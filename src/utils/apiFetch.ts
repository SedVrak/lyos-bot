import 'dotenv/config';
import { logger } from './logger';

const BASE_URL = process.env.BASE_URL!;
const COOKIE = process.env.SESSION_COOKIE!;

const headers = {
  'cookie': COOKIE,
  'accept': '*/*',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export async function apiFetch<T>(url: string, body?: any, method:HttpMethod = 'GET'): Promise<T> {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}/${url}`, config);

  if (!response.ok) {
    logger.error(`HTTP error! Status: ${response.status}`);
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}