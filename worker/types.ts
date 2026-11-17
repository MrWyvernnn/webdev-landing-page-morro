/**
 * The slice of Cloudflare's runtime this Worker uses. Declared locally so the
 * repo needs no extra type package and `tsc` stays honest about what we touch.
 */

export type D1Result<T = unknown> = { results?: T[]; success: boolean };

export type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(column?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
};

export type D1Database = {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
};

export type Env = {
  DB: D1Database;
  ASSETS?: { fetch(request: Request): Promise<Response> };
  /** `re_...` from the mail provider. Set with `wrangler secret put`, never in a file. */
  RESEND_API_KEY?: string;
  /** The verified sender, e.g. `Morro <hello@yourdomain.com>`. */
  FROM_EMAIL?: string;
  /** Random per-deployment salt; IPs are only ever stored as sha256(ip + salt). */
  IP_SALT?: string;
  /** Optional canonical origin, e.g. `https://morrolandingpage.marhaanansari.workers.dev`. */
  APP_ORIGIN?: string;
};
