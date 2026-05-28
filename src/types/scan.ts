export interface ScanTarget {
  _id: string;
  login: string;
  ip: string;
  rep: number;
  firewall: number;
  money: number;
}

export interface ScanResponse {
  targets: ScanTarget[];
  freeRam: number;
}