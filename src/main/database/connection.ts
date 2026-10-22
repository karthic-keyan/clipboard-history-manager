import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  // If app is not ready or running in test mode, fallback to local directory
  const baseDir = app ? app.getPath('userData') : process.cwd();
  const dataDir = path.join(baseDir, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'clipboard-history.db');
}

export function getImageStorageDir(): string {
  const baseDir = app ? app.getPath('userData') : process.cwd();
  const imgDir = path.join(baseDir, 'data', 'images');
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
  }
  return imgDir;
}

export function getDatabase(customPath?: string): Database.Database {
  if (dbInstance && !customPath) {
    return dbInstance;
  }

  const dbPath = customPath || getDatabasePath();
  const db = new Database(dbPath, {
    // verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
  });

  // Enable WAL mode for high concurrency & low write latency
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  db.pragma('temp_store = MEMORY');
  db.pragma('cache_size = -64000'); // 64MB page cache
  db.pragma('mmap_size = 268435456'); // 256MB memory-mapped I/O

  if (!customPath) {
    dbInstance = db;
  }

  return db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (err) {
      console.error('Error closing database:', err);
    }
    dbInstance = null;
  }
}
