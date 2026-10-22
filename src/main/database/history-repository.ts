import Database from 'better-sqlite3';
import fs from 'fs';
import { ClipboardItem, FilterOptions, AppSettings, ClipboardStats } from '../../shared/types';
import { DEFAULT_SETTINGS } from '../../shared/constants/defaults';

export class HistoryRepository {
  // In-memory cache for settings to avoid querying SQLite on every 250-500ms clipboard poll tick
  private cachedSettings: AppSettings | null = null;

  // Cached prepared statements for high performance & zero re-compilation
  private insertStmt: Database.Statement;
  private getByIdStmt: Database.Statement;
  private getByHashStmt: Database.Statement;
  private updateLastCopiedStmt: Database.Statement;
  private togglePinStmt: Database.Statement;
  private deleteStmt: Database.Statement;
  private defaultGetItemsStmt: Database.Statement;
  private selectSettingsStmt: Database.Statement;
  private saveSettingStmt: Database.Statement;
  private countNonPinnedStmt: Database.Statement;
  private selectExcessStmt: Database.Statement;
  private selectExpiredStmt: Database.Statement;
  private getStatsTotalsStmt: Database.Statement;
  private getTypeCountsStmt: Database.Statement;
  private selectUnpinnedImagesStmt: Database.Statement;
  private selectAllImagesStmt: Database.Statement;
  private deleteUnpinnedStmt: Database.Statement;
  private deleteAllStmt: Database.Statement;

  constructor(private db: Database.Database) {
    this.insertStmt = this.db.prepare(`
      INSERT INTO clipboard_items (
        id, content_type, content, preview, html_content, content_hash,
        content_size, char_count, word_count, line_count, image_path,
        image_width, image_height, is_pinned, is_sensitive, sensitive_type,
        source_app, created_at, last_copied_at, copy_count
      ) VALUES (
        @id, @content_type, @content, @preview, @html_content, @content_hash,
        @content_size, @char_count, @word_count, @line_count, @image_path,
        @image_width, @image_height, @is_pinned, @is_sensitive, @sensitive_type,
        @source_app, @created_at, @last_copied_at, @copy_count
      )
    `);

    this.getByIdStmt = this.db.prepare('SELECT * FROM clipboard_items WHERE id = ?');
    this.getByHashStmt = this.db.prepare('SELECT * FROM clipboard_items WHERE content_hash = ? LIMIT 1');
    this.updateLastCopiedStmt = this.db.prepare(`
      UPDATE clipboard_items 
      SET last_copied_at = ?, copy_count = copy_count + 1 
      WHERE id = ?
    `);
    this.togglePinStmt = this.db.prepare('UPDATE clipboard_items SET is_pinned = ? WHERE id = ?');
    this.deleteStmt = this.db.prepare('DELETE FROM clipboard_items WHERE id = ?');
    this.defaultGetItemsStmt = this.db.prepare(
      'SELECT * FROM clipboard_items ORDER BY last_copied_at DESC LIMIT ? OFFSET ?'
    );
    this.selectSettingsStmt = this.db.prepare('SELECT key, value FROM settings');
    this.saveSettingStmt = this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    this.countNonPinnedStmt = this.db.prepare('SELECT COUNT(*) as cnt FROM clipboard_items WHERE is_pinned = 0');
    this.selectExcessStmt = this.db.prepare(`
      SELECT id, image_path FROM clipboard_items 
      WHERE is_pinned = 0 
      ORDER BY last_copied_at ASC 
      LIMIT ?
    `);
    this.selectExpiredStmt = this.db.prepare(`
      SELECT id, image_path FROM clipboard_items 
      WHERE is_pinned = 0 AND last_copied_at < ?
    `);
    this.getStatsTotalsStmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total, 
        COALESCE(SUM(CASE WHEN is_pinned = 1 THEN 1 ELSE 0 END), 0) as pinned 
      FROM clipboard_items
    `);
    this.getTypeCountsStmt = this.db.prepare(
      'SELECT content_type, COUNT(*) as cnt FROM clipboard_items GROUP BY content_type'
    );
    this.selectUnpinnedImagesStmt = this.db.prepare(
      'SELECT image_path FROM clipboard_items WHERE is_pinned = 0 AND image_path IS NOT NULL'
    );
    this.selectAllImagesStmt = this.db.prepare(
      'SELECT image_path FROM clipboard_items WHERE image_path IS NOT NULL'
    );
    this.deleteUnpinnedStmt = this.db.prepare('DELETE FROM clipboard_items WHERE is_pinned = 0');
    this.deleteAllStmt = this.db.prepare('DELETE FROM clipboard_items');
  }

  private mapRowToItem(row: any): ClipboardItem {
    return {
      id: row.id,
      content_type: row.content_type,
      content: row.content,
      preview: row.preview,
      html_content: row.html_content || null,
      content_hash: row.content_hash,
      content_size: row.content_size,
      char_count: row.char_count,
      word_count: row.word_count,
      line_count: row.line_count,
      image_path: row.image_path || null,
      image_width: row.image_width || null,
      image_height: row.image_height || null,
      is_pinned: Boolean(row.is_pinned),
      is_sensitive: Boolean(row.is_sensitive),
      sensitive_type: row.sensitive_type || null,
      source_app: row.source_app || null,
      created_at: row.created_at,
      last_copied_at: row.last_copied_at,
      copy_count: row.copy_count,
    };
  }

  public create(item: ClipboardItem): void {
    this.insertStmt.run({
      id: item.id,
      content_type: item.content_type,
      content: item.content,
      preview: item.preview,
      html_content: item.html_content || null,
      content_hash: item.content_hash,
      content_size: item.content_size,
      char_count: item.char_count,
      word_count: item.word_count,
      line_count: item.line_count,
      image_path: item.image_path || null,
      image_width: item.image_width || null,
      image_height: item.image_height || null,
      is_pinned: item.is_pinned ? 1 : 0,
      is_sensitive: item.is_sensitive ? 1 : 0,
      sensitive_type: item.sensitive_type || null,
      source_app: item.source_app || null,
      created_at: item.created_at,
      last_copied_at: item.last_copied_at,
      copy_count: item.copy_count,
    });
  }

  public getById(id: string): ClipboardItem | null {
    const row = this.getByIdStmt.get(id);
    return row ? this.mapRowToItem(row) : null;
  }

  public getByHash(hash: string): ClipboardItem | null {
    const row = this.getByHashStmt.get(hash);
    return row ? this.mapRowToItem(row) : null;
  }

  public updateLastCopied(id: string, timestamp: number): void {
    this.updateLastCopiedStmt.run(timestamp, id);
  }

  public getItems(filter?: FilterOptions): ClipboardItem[] {
    const query = filter?.query?.trim();
    const hasType = filter?.type && filter.type !== 'all';
    const isPinnedOnly = Boolean(filter?.pinnedOnly);
    const hasDateRange = filter?.dateRange && filter.dateRange !== 'all';
    const hasCustomSort = filter?.sortBy && filter.sortBy !== 'recent';
    const limit = filter?.limit || 200;
    const offset = filter?.offset || 0;

    // Fast-path: default unconstrained query on app boot / normal scroll
    if (!query && !hasType && !isPinnedOnly && !hasDateRange && !hasCustomSort) {
      const rows = this.defaultGetItemsStmt.all(limit, offset);
      return rows.map((r) => this.mapRowToItem(r));
    }

    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (query) {
      // Escape double quotes in FTS query and support prefix matching
      const sanitized = query.replace(/"/g, '""');
      params.ftsQuery = `"${sanitized}"*`;
      params.likeQuery = `%${query}%`;
      // Use FTS5 subquery with LIKE fallback for exact substring matches
      conditions.push(`(
        id IN (SELECT id FROM items_fts WHERE items_fts MATCH @ftsQuery)
        OR content LIKE @likeQuery
        OR preview LIKE @likeQuery
      )`);
    }

    if (hasType) {
      conditions.push('content_type = @type');
      params.type = filter!.type;
    }

    if (isPinnedOnly) {
      conditions.push('is_pinned = 1');
    }

    if (hasDateRange) {
      const now = Date.now();
      let startTime = 0;
      if (filter!.dateRange === 'today') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        startTime = todayStart.getTime();
      } else if (filter!.dateRange === 'week') {
        startTime = now - 7 * 24 * 60 * 60 * 1000;
      } else if (filter!.dateRange === 'month') {
        startTime = now - 30 * 24 * 60 * 60 * 1000;
      }
      conditions.push('last_copied_at >= @startTime');
      params.startTime = startTime;
    }

    let orderBy = 'last_copied_at DESC';
    if (filter?.sortBy === 'oldest') {
      orderBy = 'last_copied_at ASC';
    } else if (filter?.sortBy === 'most_copied') {
      orderBy = 'copy_count DESC, last_copied_at DESC';
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT * FROM clipboard_items
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(params);
    return rows.map((r) => this.mapRowToItem(r));
  }

  public togglePin(id: string): boolean {
    const item = this.getById(id);
    if (!item) return false;
    const newStatus = item.is_pinned ? 0 : 1;
    this.togglePinStmt.run(newStatus, id);
    return true;
  }

  public delete(id: string): boolean {
    const item = this.getById(id);
    if (!item) return false;

    // Delete image file if exists
    if (item.image_path && fs.existsSync(item.image_path)) {
      try {
        fs.unlinkSync(item.image_path);
      } catch (err) {
        console.error('Failed to delete image file:', err);
      }
    }

    const res = this.deleteStmt.run(id);
    return res.changes > 0;
  }

  public clearHistory(preservePinned = true): boolean {
    const selectStmt = preservePinned ? this.selectUnpinnedImagesStmt : this.selectAllImagesStmt;
    const rows = selectStmt.all() as { image_path: string }[];

    for (const row of rows) {
      if (row.image_path && fs.existsSync(row.image_path)) {
        try {
          fs.unlinkSync(row.image_path);
        } catch (err) {
          console.error('Error removing image file:', err);
        }
      }
    }

    const deleteStmt = preservePinned ? this.deleteUnpinnedStmt : this.deleteAllStmt;
    deleteStmt.run();
    return true;
  }

  public pruneExcess(maxItems: number): number {
    if (maxItems <= 0) return 0;

    // Check count of non-pinned items
    const countRow = this.countNonPinnedStmt.get() as { cnt: number };

    if (countRow.cnt <= maxItems) {
      return 0;
    }

    const excess = countRow.cnt - maxItems;
    const excessRows = this.selectExcessStmt.all(excess) as { id: string; image_path: string | null }[];

    for (const r of excessRows) {
      if (r.image_path && fs.existsSync(r.image_path)) {
        try {
          fs.unlinkSync(r.image_path);
        } catch {
          // Ignore
        }
      }
    }

    if (excessRows.length > 0) {
      const deleteBatch = this.db.transaction((rows: { id: string }[]) => {
        for (const row of rows) {
          this.deleteStmt.run(row.id);
        }
      });
      deleteBatch(excessRows);
    }

    return excessRows.length;
  }

  public pruneRetention(retentionDays: number): number {
    if (retentionDays <= 0) return 0; // 0 = never expire

    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const expiredRows = this.selectExpiredStmt.all(cutoff) as { id: string; image_path: string | null }[];

    for (const r of expiredRows) {
      if (r.image_path && fs.existsSync(r.image_path)) {
        try {
          fs.unlinkSync(r.image_path);
        } catch {
          // Ignore
        }
      }
    }

    if (expiredRows.length > 0) {
      const deleteBatch = this.db.transaction((rows: { id: string }[]) => {
        for (const row of rows) {
          this.deleteStmt.run(row.id);
        }
      });
      deleteBatch(expiredRows);
    }

    return expiredRows.length;
  }

  public getStats(): ClipboardStats {
    const totals = this.getStatsTotalsStmt.get() as { total: number; pinned: number };
    const typeRows = this.getTypeCountsStmt.all() as { content_type: string; cnt: number }[];

    const typeCounts: Record<string, number> = {};
    for (const tr of typeRows) {
      typeCounts[tr.content_type] = tr.cnt;
    }

    // Get approximate db file size
    let dbSizeBytes = 0;
    try {
      const pageCount = (this.db.pragma('page_count') as any)[0]?.page_count || 0;
      const pageSize = (this.db.pragma('page_size') as any)[0]?.page_size || 4096;
      dbSizeBytes = pageCount * pageSize;
    } catch {
      dbSizeBytes = 0;
    }

    return {
      total_items: totals?.total || 0,
      pinned_items: totals?.pinned || 0,
      text_items: typeCounts['text'] || 0,
      code_items: typeCounts['code'] || 0,
      url_items: typeCounts['url'] || 0,
      image_items: typeCounts['image'] || 0,
      db_size_bytes: dbSizeBytes,
    };
  }

  public getSettings(): AppSettings {
    if (this.cachedSettings) {
      return { ...this.cachedSettings };
    }

    const rows = this.selectSettingsStmt.all() as {
      key: string;
      value: string;
    }[];

    const current: Partial<AppSettings> = {};
    for (const r of rows) {
      try {
        current[r.key as keyof AppSettings] = JSON.parse(r.value);
      } catch {
        // Fallback for string
      }
    }

    this.cachedSettings = { ...DEFAULT_SETTINGS, ...current };
    return { ...this.cachedSettings };
  }

  public saveSettings(settings: Partial<AppSettings>): AppSettings {
    const transaction = this.db.transaction((updates: Partial<AppSettings>) => {
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) {
          this.saveSettingStmt.run(k, JSON.stringify(v));
        }
      }
    });

    transaction(settings);

    // Invalidate cached settings so next getSettings reads fresh values
    this.cachedSettings = null;
    return this.getSettings();
  }
}
