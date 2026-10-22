import Database from 'better-sqlite3';

export function runMigrations(db: Database.Database): void {
  db.exec(`
    -- Main clipboard items table
    CREATE TABLE IF NOT EXISTS clipboard_items (
      id TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      content TEXT NOT NULL,
      preview TEXT NOT NULL,
      html_content TEXT,
      content_hash TEXT NOT NULL,
      content_size INTEGER NOT NULL DEFAULT 0,
      char_count INTEGER NOT NULL DEFAULT 0,
      word_count INTEGER NOT NULL DEFAULT 0,
      line_count INTEGER NOT NULL DEFAULT 0,
      image_path TEXT,
      image_width INTEGER,
      image_height INTEGER,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_sensitive INTEGER NOT NULL DEFAULT 0,
      sensitive_type TEXT,
      source_app TEXT,
      created_at INTEGER NOT NULL,
      last_copied_at INTEGER NOT NULL,
      copy_count INTEGER NOT NULL DEFAULT 1
    );

    -- Indexes for high-performance sorting, filtering and deduplication
    CREATE INDEX IF NOT EXISTS idx_items_last_copied_at ON clipboard_items(last_copied_at DESC);
    CREATE INDEX IF NOT EXISTS idx_items_created_at ON clipboard_items(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_items_is_pinned ON clipboard_items(is_pinned);
    CREATE INDEX IF NOT EXISTS idx_items_content_type ON clipboard_items(content_type);
    CREATE INDEX IF NOT EXISTS idx_items_content_hash ON clipboard_items(content_hash);

    -- SQLite FTS5 Full-Text Search Virtual Table
    CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
      id UNINDEXED,
      content,
      preview,
      tokenize = 'unicode61 remove_diacritics 2'
    );

    -- Triggers to maintain FTS5 synchronization automatically
    CREATE TRIGGER IF NOT EXISTS trg_items_ai AFTER INSERT ON clipboard_items BEGIN
      INSERT INTO items_fts(id, content, preview) VALUES (new.id, new.content, new.preview);
    END;

    CREATE TRIGGER IF NOT EXISTS trg_items_ad AFTER DELETE ON clipboard_items BEGIN
      DELETE FROM items_fts WHERE id = old.id;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_items_au AFTER UPDATE ON clipboard_items BEGIN
      DELETE FROM items_fts WHERE id = old.id;
      INSERT INTO items_fts(id, content, preview) VALUES (new.id, new.content, new.preview);
    END;

    -- Settings key-value store
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
