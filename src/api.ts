import { DepositResponce } from "./types/bank";
import { LogsResponse } from "./types/logs";
import { RootUserObject } from "./types/user";
import { apiFetch } from "./utils/apiFetch";


//get logs
export async function fetchLogs(): Promise<LogsResponse> {
  return await apiFetch(`api/log`);
}
//get my info
export async function fetchMe(): Promise<RootUserObject> {
  return await apiFetch(`api/user/me`);
}
//set deposit
export async function deposit(amount: number): Promise<DepositResponce> {
  return await apiFetch(`api/bank/deposit`, { amount }, 'POST');
}
