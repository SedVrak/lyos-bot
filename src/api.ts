import { DepositResponce } from "./types/bank";
import { LogsResponse } from "./types/logs";
import { DailyQuestsResponse } from "./types/quests";
import { CreateProcessResponse, ProcessListResponse, ProcessStatus, ProcessType } from "./types/process";
import { ScanResponse } from "./types/scan";
import { RootUserObject } from "./types/user";
import { apiFetch } from "./utils/apiFetch";
import { logger } from "./utils/logger";


//get logs
export async function fetchLogs(): Promise<LogsResponse> {
  return await apiFetch(`api/log`);
}
export async function cleanLogs(): Promise<any> {
  return await apiFetch(`api/log`, {bulkContent: ""}, "PUT");
}
//get my info
export async function fetchMe(): Promise<RootUserObject> {
  return await apiFetch(`api/user/me`);
}
//set deposit
export async function deposit(amount: number): Promise<DepositResponce> {
  return await apiFetch(`api/bank/deposit`, { amount }, 'POST');
}
//scan
export async function fetchScan(): Promise<ScanResponse> {
  return await apiFetch(`api/scan`);
}

//get daily quests
export async function fetchDailyQuests(): Promise<DailyQuestsResponse> {
  return await apiFetch(`api/daily-quests`);
}

//start an attack process (bypass, sabotage, ...) against a scanned target
export async function createProcess(targetId: string, type: ProcessType = ProcessType.Bypass): Promise<CreateProcessResponse> {
  return await apiFetch(`api/process/create`, { targetId, type }, 'POST');
}

//list our own processes (active/completed/failed), newest first
export async function fetchProcesses(status: ProcessStatus, page = 1, limit = 20): Promise<ProcessListResponse> {
  return await apiFetch(`api/processes?status=${status}&page=${page}&limit=${limit}&sort=date`);
}

export async function fetchScanWithRetry(): Promise<ScanResponse> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetchScan();
    } catch (err: any) {
      if (err.message?.includes('429') && attempt < 3) {
        logger.info(`[runScan] Rate limited, waiting 10s... (attempt ${attempt})`);
        await new Promise(r => setTimeout(r, 10_000));
      } else {
        throw err;
      }
    }
  }
  throw new Error('fetchScan failed after 3 attempts');
}