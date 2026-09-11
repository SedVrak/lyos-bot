export interface ChanceBreakdown {
  base: number;
  levelDiff: number;
  rookieBoost: number;
}

export interface ScanTarget {
  _id: string;
  login: string;
  ip: string;
  rep: number;
  firewall: number;
  money: number;
  bot_last_payout_at?: number;
  bypassChance: number;
  chanceBreakdown: ChanceBreakdown;
  bypassRamCost: number;
  // present (true) only while a bypass process against this target is running
  bypassInProgress?: boolean;
  // present (true) once we've already successfully bypassed this target - nothing left to do here
  hasBypass?: boolean;
}

export interface ScanResponse {
  targets: ScanTarget[];
  freeRam: number;
}
