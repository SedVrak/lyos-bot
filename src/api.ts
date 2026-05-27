import { LogsResponse } from "./types/logs";
import { apiFetch } from "./utils/apiFetch";


//get logs
export async function fetchLogs(): Promise<LogsResponse> {
  return await apiFetch(`api/log`);
}
/*//get my info
export async function fetchMe(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/user/me`, { headers });
  if (!res.ok) throw new Error(`Me fetch failed: ${res.status}`);
  return res.json();
}
//set deposit
export async function deposit(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/bank/deposit`, { headers });
  if (!res.ok) throw new Error(`Deposit fetch failed: ${res.status}`);
  return res.json();
}*/
