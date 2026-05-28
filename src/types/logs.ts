export interface LogsResponse {
  entries: LogEntry[];
}
export interface LogEntry {
  _id: string;
  timestamp: string;
  content: string;
  type: string;
  action: string;
  integrity: string;
}