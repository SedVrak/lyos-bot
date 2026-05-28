export interface ScanTarget {
  _id: string;
  login: string;
  ip: string;
  rep: number;
  firewall: number;
  money: number;
  bot_last_payout_at?: number;
}

export interface ScanResponse {
  targets: ScanTarget[];
  freeRam: number;
}