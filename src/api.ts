import 'dotenv/config';

const BASE_URL = process.env.BASE_URL!;
const COOKIE = process.env.SESSION_COOKIE!;

const headers = {
  'cookie': COOKIE,
  'accept': '*/*',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

export async function fetchLogs(): Promise<{ entries: any[] }> {
  const res = await fetch(`${BASE_URL}/api/log`, { headers });
  if (!res.ok) throw new Error(`Log fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchMe(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/user/me`, { headers });
  if (!res.ok) throw new Error(`Me fetch failed: ${res.status}`);
  return res.json();
}
