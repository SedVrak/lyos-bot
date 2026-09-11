import { Pool } from 'pg';
import { DepositResponce } from './types/bank';
import { LogEntry } from './types/logs';
import { ProcessInfo, ProcessListItem } from './types/process';
import { Quest, QuestStreak } from './types/quests';
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS daily_quests (
      id TEXT PRIMARY KEY,
      quest_id TEXT,
      quest_key TEXT,
      title TEXT,
      description TEXT,
      category TEXT,
      rarity TEXT,
      current_value INTEGER,
      target_value INTEGER,
      progress INTEGER,
      completed BOOLEAN,
      claimed BOOLEAN,
      reward_type TEXT,
      reward_amount INTEGER,
      source TEXT,
      first_seen_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quest_streak (
      id SERIAL PRIMARY KEY,
      current INTEGER,
      best INTEGER,
      total_completed INTEGER,
      next_milestone INTEGER,
      freezes INTEGER,
      freeze_days_left INTEGER,
      lost_streak_value INTEGER,
      freezes_consumed_on_break INTEGER,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attack_log (
      id SERIAL PRIMARY KEY,
      process_id TEXT UNIQUE,
      process_type INTEGER,
      target_id TEXT,
      target_login TEXT,
      target_ip TEXT,
      ram_cost INTEGER,
      status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress | success | failed
      -- raw reward payload from api/processes once resolved (e.g. repBreakdown for a bypass)
      result_data JSONB,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      end_time TIMESTAMPTZ,
      resolved_at TIMESTAMPTZ
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
    ) VALUES ($1, $2, $3, $4, $5, $2, $3, $4, $5, $6::integer, $6::numeric, 1, $7)
    ON CONFLICT (id) DO UPDATE SET
      login_last    = EXCLUDED.login_last,
      ip_last       = EXCLUDED.ip_last,
      rep_last      = EXCLUDED.rep_last,
      firewall_last = EXCLUDED.firewall_last,
      money_last    = EXCLUDED.money_last,
      money_avg     = (scan_targets.money_avg * scan_targets.scan_count + EXCLUDED.money_last::numeric)
                      / (scan_targets.scan_count + 1),
      scan_count    = scan_targets.scan_count + 1,
      updated_at    = NOW()
  `, [t._id, t.login, t.ip, t.rep, t.firewall, t.money, isBot]);
}

export async function upsertQuest(q: Quest, source: 'quests' | 'starterQuests'): Promise<void> {
  await pool.query(`
    INSERT INTO daily_quests (
      id, quest_id, quest_key, title, description, category, rarity,
      current_value, target_value, progress, completed, claimed,
      reward_type, reward_amount, source
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    ON CONFLICT (id) DO UPDATE SET
      current_value = EXCLUDED.current_value,
      target_value  = EXCLUDED.target_value,
      progress      = EXCLUDED.progress,
      completed     = EXCLUDED.completed,
      claimed       = EXCLUDED.claimed,
      updated_at    = NOW()
  `, [
    q._id, q.quest_id, q.quest_key, q.title, q.description, q.category, q.rarity,
    q.current_value, q.target_value, q.progress, q.completed, q.claimed,
    q.reward.type, q.reward.amount, source,
  ]);
}

export async function saveQuestStreak(streak: QuestStreak): Promise<void> {
  await pool.query(`
    INSERT INTO quest_streak (
      current, best, total_completed, next_milestone,
      freezes, freeze_days_left, lost_streak_value, freezes_consumed_on_break
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    streak.current, streak.best, streak.total_completed, streak.next_milestone,
    streak.freezes, streak.freeze_days_left, streak.lost_streak_value, streak.freezes_consumed_on_break,
  ]);
}

export async function insertAttack(target: ScanTarget, process: ProcessInfo): Promise<void> {
  await pool.query(`
    INSERT INTO attack_log (process_id, process_type, target_id, target_login, target_ip, ram_cost, end_time)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (process_id) DO NOTHING
  `, [process.id, process.type, target._id, target.login, target.ip, target.bypassRamCost, process.endTime]);
}

// how many attacks were launched in the trailing 24h, for the daily-cap check
export async function countAttacksToday(): Promise<number> {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS count FROM attack_log WHERE started_at >= NOW() - INTERVAL '24 hours'`
  );
  return res.rows[0]?.count ?? 0;
}

// mark a still-open attack_log row as resolved once api/processes reports it completed.
// returns false if there was no matching in-progress row (e.g. already resolved).
export async function resolveAttack(item: ProcessListItem): Promise<boolean> {
  const res = await pool.query(`
    UPDATE attack_log
    SET status = $2, result_data = $3, resolved_at = NOW()
    WHERE process_id = $1 AND status = 'in_progress'
  `, [item.id, item.success ? 'success' : 'failed', JSON.stringify(item.data ?? {})]);
  return (res.rowCount ?? 0) > 0;
}