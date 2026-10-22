import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { runMigrations } from '../../src/main/database/migrations';
import { HistoryRepository } from '../../src/main/database/history-repository';
import { ClipboardItem } from '../../src/shared/types';

describe('HistoryRepository & SQLite FTS5 Integration', () => {
  let db: Database.Database;
  let repo: HistoryRepository;

  beforeEach(() => {
    // In-memory test database
    db = new Database(':memory:');
    runMigrations(db);
    repo = new HistoryRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  const createDummyItem = (overrides?: Partial<ClipboardItem>): ClipboardItem => ({
    id: 'id-' + Math.random().toString(36).substring(2, 9),
    content_type: 'text',
    content: 'Sample clipboard text content for testing',
    preview: 'Sample clipboard text content for testing',
    html_content: null,
    content_hash: 'hash-' + Math.random().toString(36).substring(2, 9),
    content_size: 40,
    char_count: 40,
    word_count: 6,
    line_count: 1,
    image_path: null,
    image_width: null,
    image_height: null,
    is_pinned: false,
    is_sensitive: false,
    sensitive_type: null,
    source_app: null,
    created_at: Date.now(),
    last_copied_at: Date.now(),
    copy_count: 1,
    ...overrides,
  });

  it('should insert and retrieve a clipboard item by id and hash', () => {
    const item = createDummyItem({ content: 'Quick brown fox jumps', content_hash: 'fox-hash-1' });
    repo.create(item);

    const retrieved = repo.getById(item.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.content).toBe('Quick brown fox jumps');

    const byHash = repo.getByHash('fox-hash-1');
    expect(byHash?.id).toBe(item.id);
  });

  it('should perform FTS5 full-text search', () => {
    const item1 = createDummyItem({ content: 'Antigravity developer coding assistant', preview: 'Antigravity' });
    const item2 = createDummyItem({ content: 'Windows desktop notification service', preview: 'Windows desktop' });
    const item3 = createDummyItem({ content: 'React and TypeScript UI components', preview: 'React TS' });

    repo.create(item1);
    repo.create(item2);
    repo.create(item3);

    const results = repo.getItems({ query: 'Antigravity' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(item1.id);

    const desktopResults = repo.getItems({ query: 'desktop' });
    expect(desktopResults).toHaveLength(1);
    expect(desktopResults[0].id).toBe(item2.id);
  });

  it('should filter items by content type', () => {
    const textItem = createDummyItem({ content_type: 'text' });
    const codeItem = createDummyItem({ content_type: 'code', content: 'const x = 10;' });
    const urlItem = createDummyItem({ content_type: 'url', content: 'https://github.com' });

    repo.create(textItem);
    repo.create(codeItem);
    repo.create(urlItem);

    const codeResults = repo.getItems({ type: 'code' });
    expect(codeResults).toHaveLength(1);
    expect(codeResults[0].id).toBe(codeItem.id);

    const urlResults = repo.getItems({ type: 'url' });
    expect(urlResults).toHaveLength(1);
    expect(urlResults[0].id).toBe(urlItem.id);
  });

  it('should toggle pin and filter pinned items', () => {
    const item = createDummyItem({ is_pinned: false });
    repo.create(item);

    expect(repo.getById(item.id)?.is_pinned).toBe(false);

    repo.togglePin(item.id);
    expect(repo.getById(item.id)?.is_pinned).toBe(true);

    const pinnedOnly = repo.getItems({ pinnedOnly: true });
    expect(pinnedOnly).toHaveLength(1);
    expect(pinnedOnly[0].id).toBe(item.id);
  });

  it('should preserve pinned items during excess history pruning', () => {
    // Insert 1 pinned item and 5 unpinned items
    const pinnedItem = createDummyItem({ is_pinned: true, last_copied_at: 1000 });
    repo.create(pinnedItem);

    for (let i = 1; i <= 5; i++) {
      repo.create(createDummyItem({ is_pinned: false, last_copied_at: 2000 + i }));
    }

    // Prune excess to max 2 items
    const prunedCount = repo.pruneExcess(2);
    expect(prunedCount).toBe(3); // 5 - 2 = 3 items pruned

    const remaining = repo.getItems();
    expect(remaining).toHaveLength(3); // 2 unpinned + 1 pinned
    expect(remaining.some((r) => r.id === pinnedItem.id)).toBe(true);
  });

  it('should preserve pinned items during retention pruning', () => {
    const oldTimestamp = Date.now() - 40 * 24 * 60 * 60 * 1000; // 40 days old

    const expiredUnpinned = createDummyItem({ is_pinned: false, last_copied_at: oldTimestamp });
    const expiredPinned = createDummyItem({ is_pinned: true, last_copied_at: oldTimestamp });
    const recentItem = createDummyItem({ is_pinned: false, last_copied_at: Date.now() });

    repo.create(expiredUnpinned);
    repo.create(expiredPinned);
    repo.create(recentItem);

    // Prune retention with 30-day limit
    const prunedCount = repo.pruneRetention(30);
    expect(prunedCount).toBe(1);

    const remaining = repo.getItems();
    expect(remaining).toHaveLength(2);
    expect(remaining.some((r) => r.id === expiredPinned.id)).toBe(true);
    expect(remaining.some((r) => r.id === recentItem.id)).toBe(true);
    expect(remaining.some((r) => r.id === expiredUnpinned.id)).toBe(false);
  });

  it('should calculate accurate clipboard statistics', () => {
    repo.create(createDummyItem({ content_type: 'text', is_pinned: true }));
    repo.create(createDummyItem({ content_type: 'code', is_pinned: false }));
    repo.create(createDummyItem({ content_type: 'url', is_pinned: false }));

    const stats = repo.getStats();
    expect(stats.total_items).toBe(3);
    expect(stats.pinned_items).toBe(1);
    expect(stats.text_items).toBe(1);
    expect(stats.code_items).toBe(1);
    expect(stats.url_items).toBe(1);
  });

  it('should persist and update application settings', () => {
    const initial = repo.getSettings();
    expect(initial.monitoring_enabled).toBe(true);

    repo.saveSettings({
      monitoring_enabled: false,
      polling_interval: 1000,
      global_shortcut: 'Alt+V',
    });

    const updated = repo.getSettings();
    expect(updated.monitoring_enabled).toBe(false);
    expect(updated.polling_interval).toBe(1000);
    expect(updated.global_shortcut).toBe('Alt+V');
  });
});
