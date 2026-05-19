import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join('data', 'lyos.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS log_entries (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    content TEXT,
    type TEXT,
    action TEXT,
    integrity TEXT,
    saved_at TEXT DEFAULT (datetime('now'))
  )
`);

export function getLastSavedId(): string | null {
  const row = db.prepare(`
    SELECT id FROM log_entries ORDER BY saved_at DESC LIMIT 1
  `).get() as { id: string } | undefined;
  return row?.id ?? null;
}

export function saveEntries(entries: LogEntry[]): number {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO log_entries (id, timestamp, content, type, action, integrity)
    VALUES (@_id, @timestamp, @content, @type, @action, @integrity)
  `);

  const insertMany = db.transaction((items: LogEntry[]) => {
    let count = 0;
    for (const entry of items) {
      const result = insert.run(entry);
      count += result.changes;
    }
    return count;
  });

  return insertMany(entries);
}

export interface LogEntry {
  _id: string;
  timestamp: string;
  content: string;
  type: string;
  action: string;
  integrity: string;
}