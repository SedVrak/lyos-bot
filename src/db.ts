import { Pool } from 'pg';
import { DepositResponce } from './types/bank';
import { LogEntry } from './types/logs';
import { ScanTarget } from './types/scan';

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS scan_targets (
      id TEXT PRIMARY KEY,

      -- first scan
      login_first TEXT,
      ip_first TEXT,
      rep_first INTEGER,
      firewall_first INTEGER,
      first_seen_at TIMESTAMPTZ DEFAULT NOW(),

      -- last scan
      login_last TEXT,
      ip_last TEXT,
      rep_last INTEGER,
      firewall_last INTEGER,
      updated_at TIMESTAMPTZ DEFAULT NOW(),

      -- money
      money_last INTEGER,
      money_avg NUMERIC(12, 2),
      scan_count INTEGER DEFAULT 1,

      is_bot BOOLEAN DEFAULT FALSE
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

export async function upsertScanTarget(t: ScanTarget): Promise<void> {
  const isBot = t.bot_last_payout_at !== undefined;

  await pool.query(`
    INSERT INTO scan_targets (
      id,
      login_first, ip_first, rep_first, firewall_first,
      login_last,  ip_last,  rep_last,  firewall_last,
      money_last, money_avg, scan_count,
      is_bot
    ) VALUES ($1, $2, $3, $4, $5, $2, $3, $4, $5, $6, $6, 1, $7)
    ON CONFLICT (id) DO UPDATE SET
      login_last    = EXCLUDED.login_last,
      ip_last       = EXCLUDED.ip_last,
      rep_last      = EXCLUDED.rep_last,
      firewall_last = EXCLUDED.firewall_last,
      money_last    = EXCLUDED.money_last,
      money_avg     = (scan_targets.money_avg * scan_targets.scan_count + EXCLUDED.money_last)
                      / (scan_targets.scan_count + 1),
      scan_count    = scan_targets.scan_count + 1,
      updated_at    = NOW()
  `, [t._id, t.login, t.ip, t.rep, t.firewall, t.money, isBot]);
}