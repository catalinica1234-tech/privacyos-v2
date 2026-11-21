/** Nombres compartidos entre middleware (Edge) y Route Handlers (Node). */
export const WORKSPACE_COOKIE = "privacyos_workspace";
export const WORKSPACE_HEADER = "x-privacyos-workspace";
export const WORKSPACE_TOKEN_RE = /^[a-f0-9]{64}$/;
