export interface LogEntry {
  _id: string;
  timestamp: string;
  content: string;
  type: string;
  action: string;
  integrity: string;
  _traceable?: boolean;
}

export interface LogsResponse {
  entries: LogEntry[];
}