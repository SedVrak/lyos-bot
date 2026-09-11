// process types (bypass, sabotage, miner/spyware deploy, ...) share this shape.
// Only `Bypass` is understood by the bot for now; extend as other kinds get reverse-engineered.
export enum ProcessType {
  Bypass = 0,
}

export interface ProcessInfo {
  id: string;
  type: ProcessType;
  app: string;
  lvl: number;
  endTime: string;
  timeLeft: number;
  baseDuration: number;
}

export interface CreateProcessResponse {
  process: ProcessInfo;
}

export type ProcessStatus = 'active' | 'completed' | 'failed';

export interface ProcessListTarget {
  _id: string;
  login: string;
  ip: string;
  rep: number;
}

export interface ProcessListItem {
  id: string;
  type: ProcessType;
  app: string;
  lvl: number;
  mode: number;
  target: ProcessListTarget;
  progress: number;
  timeLeft: number;
  startTime: string;
  endTime: string;
  success: boolean;
  completed: boolean;
  baseDuration: number;
  workCompleted: number;
  loadMultiplier: number;
  // reward payload, shape varies by process type/app (e.g. repBreakdown for a bypass)
  data: Record<string, any>;
}

export interface ProcessListResponse {
  processes: ProcessListItem[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
  counts: {
    active: number;
    completed: number;
    failed: number;
  };
  typeCounts: Record<string, number>;
  recent: ProcessListItem[];
}
