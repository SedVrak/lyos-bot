import 'dotenv/config';
import { cleanLogs, createProcess, deposit, fetchDailyQuests, fetchLogs, fetchMe, fetchProcesses, fetchScanWithRetry } from './api';
import { getLastSavedId, saveEntries, initDb, countAttacksToday, insertAttack, resolveAttack, saveDeposit, saveQuestStreak, upsertQuest, upsertScanTarget } from './db';
import { LogEntry, LogsResponse } from './types/logs';
import { ProcessType } from './types/process';
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

  if (user.money <= 200000) {
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

async function syncQuests(): Promise<void> {
  const { quests, starterQuests, streak } = await fetchDailyQuests();

  for (const quest of quests) {
    await upsertQuest(quest, 'quests');
  }
  for (const quest of starterQuests) {
    await upsertQuest(quest, 'starterQuests');
  }
  await saveQuestStreak(streak);

  logger.info(`[syncQuests] Synced ${quests.length + starterQuests.length} quests, streak: ${streak.current}`);
}

async function runScan(): Promise<void> {
  logger.info('[runScan] Starting scans...');
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

// targets above this firewall level are too costly in RAM/time relative to what they yield
const ATTACK_MAX_FIREWALL = 400;
// self-imposed cap to stay under the radar
const ATTACK_DAILY_LIMIT = 10;
// api/scan returns 5 random targets per call; keep re-rolling until we've either
// filled today's quota or given up finding anything attackable
const ATTACK_MAX_SCAN_ATTEMPTS = 15;

async function runAttacks(): Promise<void> {
  let remaining = ATTACK_DAILY_LIMIT - await countAttacksToday();
  if (remaining <= 0) {
    logger.info(`[runAttacks] Daily limit reached (${ATTACK_DAILY_LIMIT})`);
    return;
  }

  let launched = 0;

  for (let attempt = 0; attempt < ATTACK_MAX_SCAN_ATTEMPTS && remaining > 0; attempt++) {
    const { targets, freeRam } = await fetchScanWithRetry();
    let ram = freeRam;

    const candidates = targets.filter(t =>
      t.firewall < ATTACK_MAX_FIREWALL &&
      !t.bypassInProgress &&
      !t.hasBypass && // already bypassed this one before, nothing left to do
      t.bypassRamCost <= ram
    );

    for (const target of candidates) {
      if (remaining <= 0 || target.bypassRamCost > ram) continue;

      try {
        const { process } = await createProcess(target._id, ProcessType.Bypass);
        await insertAttack(target, process);
        ram -= target.bypassRamCost;
        remaining--;
        launched++;
        logger.info(`[runAttacks] Attacking ${target.login} (${target.ip}), ram cost ${target.bypassRamCost}, ${remaining} left today`);
      } catch (err) {
        logger.warn(`[runAttacks] Failed to attack ${target.login}`, err);
      }
    }

    if (remaining > 0) {
      await new Promise(r => setTimeout(r, 3_000));
    }
  }

  logger.info(`[runAttacks] Done. Launched ${launched} attacks.`);
}

async function syncAttacks(): Promise<void> {
  const { processes } = await fetchProcesses('completed', 1, 50);

  let resolved = 0;
  for (const process of processes) {
    if (!process.completed) continue;
    if (await resolveAttack(process)) resolved++;
  }

  if (resolved > 0) {
    logger.info(`[syncAttacks] Resolved ${resolved} attacks`);
  }
}

async function main() {
  logger.info('Starting lyos-bot...');
  await initDb();
  logger.info('DB initialized');

  scheduleTask('syncLogs', 2_000, syncLogs);
  scheduleTask('autoDeposit', randomInterval(20, 40), autoDeposit);
  scheduleTask('cleanLogs', 1_000 * 60 * 60 * 12, cleanLogs);
  scheduleTask('syncQuests', randomInterval(60, 120), syncQuests);
  scheduleTask('runAttacks', 30 * 60_000, runAttacks); // retry cadence for "not enough RAM" per user's spec
  scheduleTask('syncAttacks', 10 * 60_000, syncAttacks);
  //scheduleTask('runScan', randomInterval(120, 360), runScan);
}

main();