/**
 * Provider registry. All external services live behind these typed seams with
 * retries/timeouts/failover, selected by env at runtime. Foundation ships
 * stubs; real adapters slot in without touching call sites.
 */
export * from "./resilience";
export * from "./media-fetch";
export * from "./transcription";
export * from "./print";
