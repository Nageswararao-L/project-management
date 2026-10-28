import axios, { AxiosError } from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

/** Human-readable message from a NestJS error response. */
export function errorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { message?: string | string[] })
      ?.message;
    if (Array.isArray(message)) return message.join('\n');
    if (message) return message;
    if (!error.response) return 'Cannot reach the server. Is the API running?';
    return error.message;
  }
  return error instanceof Error ? error.message : String(error);
}
