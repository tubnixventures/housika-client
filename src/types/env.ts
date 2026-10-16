export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: Record<string, unknown>;
  error?: string;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export interface KVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expiration?: number; expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: { name: string }[]; cursor?: string; list_complete: boolean }>;
}

export interface AnalyticsEngineDataset {
  writeDataPoint(event: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void;
}

export interface Env {
  JWT_ACCESS_SECRET?: string;
  RECEIPT_VERIFY_SECRET?: string;
  PAYSTACK_SECRET_KEY?: string;
  PAYSTACK_PUBLIC_KEY?: string;
  PAYSTACK_WEBHOOK_SECRET?: string;
  PAYSTACK_BASE_URL?: string;
  ZEPTOMAIL_API_KEY?: string;
  ZEPTOMAIL_BOUNCE_ADDRESS?: string;
  INFOBIP_BASE_URL?: string;
  INFOBIP_API_KEY?: string;
  COSMOS_ENDPOINT?: string;
  COSMOS_KEY?: string;
  STORAGE_SERVICE_URL?: string;
  STORAGE_SERVICE_KEY?: string;
  STORAGE_DELETE_URL?: string;
  CLIENT_FRONTEND_ORIGIN?: string;
  BOOKING_UNPAID_TTL_MINUTES?: string;
  BOOKING_APPROVAL_REMINDER_AFTER_MINUTES?: string;
  BOOKING_APPROVAL_TTL_HOURS?: string;
  DRAFT_RESOURCE_TTL_DAYS?: string;
  DB_ACCOUNTS?: D1Database;
  DB_PROFILES?: D1Database;
  DB_COUNTRIES?: D1Database;
  DB_COMPANY_PERMISSIONS?: D1Database;
  DB_CLIENT_AUDIT?: D1Database;
  DB_CONCERNS?: D1Database;
  DB_FILE_BIN?: D1Database;
  ADMIN_VOUCHERS_D1?: D1Database;
  VOUCHERS_D1?: D1Database;
  KV_IDEMPOTENCY?: KVNamespace;
  KV_OTP?: KVNamespace;
  KV_RATE_LIMIT?: KVNamespace;
  housika_client_analytics?: AnalyticsEngineDataset;
  AI?: any;
}
