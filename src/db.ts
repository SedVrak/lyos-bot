import { Pool } from 'pg';
import { DepositResponce } from './types/bank';
import { LogEntry } from './types/logs';

const pool = new Pool({
  host: process.env.PG_HOST ?? 'postgres',
  port: Number(process.env.PG_PORT ?? 5432),
  database: process.env.PG_DATABASE ?? 'lyos',
  user: process.env.PG_USER ?? 'postgres',
  password: process.env.PG_PASSWORD ?? '',
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS log_entries (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      content TEXT,
      type TEXT,
      action TEXT,
      integrity TEXT,
      saved_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS deposit_log (
      id SERIAL PRIMARY KEY,
      success BOOLEAN,
      deposited INTEGER,
      fee INTEGER,
      deposited_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function getLastSavedId(): Promise<string | null> {
  const res = await pool.query(
    `SELECT id FROM log_entries ORDER BY saved_at DESC LIMIT 1`
  );
  return res.rows[0]?.id ?? null;
}

export async function saveEntries(entries: LogEntry[]): Promise<number> {
  if (entries.length === 0) return 0;

  let count = 0;
  for (const entry of entries) {
    const res = await pool.query(
      `INSERT INTO log_entries (id, timestamp, content, type, action, integrity)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [entry._id, entry.timestamp, entry.content, entry.type, entry.action, entry.integrity]
    );
    count += res.rowCount ?? 0;
  }
  return count;
}

export async function saveDeposit(result: DepositResponce): Promise<void> {
  await pool.query(
    `INSERT INTO deposit_log (success, deposited, fee)
     VALUES ($1, $2, $3)`,
    [result.success, result.deposited, result.fee]
  );
}

