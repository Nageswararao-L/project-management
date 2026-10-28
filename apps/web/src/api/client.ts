import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'pm-token';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
});

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable: the session lasts until the page is reloaded
  }
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
}

setToken(getToken());

/** Called when the API rejects the session (expired token, deactivated account). */
let onUnauthorized: () => void = () => undefined;
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

http.interceptors.response.use(undefined, (error) => {
  const isLogin =
    error instanceof AxiosError && error.config?.url === '/auth/login';
  if (
    error instanceof AxiosError &&
    error.response?.status === 401 &&
    !isLogin
  ) {
    onUnauthorized();
  }
  return Promise.reject(error);
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
