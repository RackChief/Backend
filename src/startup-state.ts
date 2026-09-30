export type StartupPhase = "starting" | "migrating" | "indexing_catalog" | "ready" | "error";
export type CatalogStartupState = { status: "pending" | "ready" | "unavailable"; revision?: string; entryCount?: number; message?: string };
let state: { phase: StartupPhase; message: string; catalog: CatalogStartupState; error?: string } = { phase: "starting", message: "Starting RackChief", catalog: { status: "pending" } };
export const startupState = { get: () => state, set: (phase: StartupPhase, message: string, error?: string) => { state = { ...state, phase, message, ...(error ? { error } : {}) }; }, catalog: (value: CatalogStartupState) => { state = { ...state, catalog: value }; } };
