import 'dotenv/config';
import { fetchLogs } from './api';
import { getLastSavedId, saveEntries, initDb, LogEntry } from './db';
import { LogsResponse } from './types/logs';
import { logger } from './utils/logger';

//Scheduler
type Task = () => Promise<void>;

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

async function main() {
  logger.info('Starting lyos-bot...');
  await initDb();
  logger.info('DB initialized');

  scheduleTask('syncLogs', 2_000, syncLogs);
}

main();