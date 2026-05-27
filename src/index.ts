import 'dotenv/config';
import { fetchLogs } from './api';
import { getLastSavedId, saveEntries, initDb, LogEntry } from './db';

const randomDelay = (minMin: number, maxMin: number): Promise<void> => {
  const ms = (Math.random() * (maxMin - minMin) + minMin) * 60_000;
  console.log(`Sleeping ${(ms / 60000).toFixed(1)} min...`);
  return new Promise(r => setTimeout(r, ms));
};

async function syncLogs() {
  const { entries } = await fetchLogs();
  const lastId = await getLastSavedId();

  // Відфільтровуємо тільки нові — до першого вже збереженого
  const newEntries: LogEntry[] = [];
  for (const entry of entries) {
    if (entry._id === lastId) break;
    newEntries.push(entry);
  }

  if (newEntries.length === 0) {
    console.log('No new entries');
    return;
  }

  const saved = await saveEntries(newEntries);
  console.log(`Saved ${saved} new log entries`);
}

async function main() {
  console.log('Starting lyos-bot...');
  await initDb();
  console.log('DB initialized');

  while (true) {
    try {
      await syncLogs();
    } catch (err) {
      console.error('Error:', err);
    }
    await randomDelay(4, 10); // кожні 4-10 хвилин
  }
}

main();
