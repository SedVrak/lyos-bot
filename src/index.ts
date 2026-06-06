import 'dotenv/config';
import { deposit, fetchLogs, fetchMe, fetchScanWithRetry } from './api';
import { getLastSavedId, saveEntries, initDb, saveDeposit, upsertScanTarget } from './db';
import { LogEntry, LogsResponse } from './types/logs';
import { logger } from './utils/logger';

//Scheduler
type Task = () => Promise<void>;

const randomInterval = (minMinutes: number, maxMinutes: number): number => {
  return (Math.random() * (maxMinutes - minMinutes) + minMinutes) * 60_000;
};

function scheduleTask(name: string, intervalMs: number, task: Task): void {
  const run = async () => {
    try {
      await task();
    } catch (err) {
      console.error(`[${name}] Error:`, err);
    } finally {
      setTimeout(run, intervalMs);
    }
  };
  run();
}

//Tasks
async function syncLogs(): Promise<void> {
  const response: LogsResponse = await fetchLogs();
  const lastId = await getLastSavedId();

  const newEntries: LogEntry[] = [];
  for (const entry of response.entries) {
    if (entry._id === lastId) break;
    newEntries.push(entry);
  }

  if (newEntries.length === 0) {
    return;
  }

  const saved = await saveEntries(newEntries);
  logger.info(`[syncLogs] Saved ${saved} new entries`);
}

async function autoDeposit(): Promise<void> {
  const { user } = await fetchMe();

  if (user.money <= 0) {
    return;
  }

  logger.info(`[autoDeposit] Depositing ${user.money}...`);
  const result = await deposit(user.money);

  if (!result.success) {
    logger.warn('[autoDeposit] Deposit failed', result);
    return;
  }

  await saveDeposit(result);
  logger.info(`[autoDeposit] Deposited ${result.deposited}, fee: ${result.fee}`);
}

async function runScan(): Promise<void> {
  logger.info('[runScan] Starting 100 scans...');
  let saved = 0;

  for (let i = 0; i < 10; i++) {
    const { targets } = await fetchScanWithRetry();
    for (const target of targets) {
      await upsertScanTarget(target);
      saved++;
    }
    await new Promise(r => setTimeout(r, 3_000)); 
  }

  logger.info(`[runScan] Done. Processed ${saved} target entries`);
}

async function main() {
  logger.info('Starting lyos-bot...');
  await initDb();
  logger.info('DB initialized');

  scheduleTask('syncLogs', 2_000, syncLogs);
  scheduleTask('autoDeposit', randomInterval(20, 40), autoDeposit);
  scheduleTask('runScan', randomInterval(120, 360) * 60_000, runScan);
}

main();