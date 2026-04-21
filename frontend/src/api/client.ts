import axios from "axios";

/**
 * Single axios instance. In dev, Vite proxies `/api` → `http://localhost:8000`
 * (see vite.config.ts). In production, set VITE_API_BASE_URL at build time.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 15_000,
});
