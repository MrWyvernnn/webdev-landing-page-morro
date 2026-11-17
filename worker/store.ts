import type { D1Database } from "./types";

export type WaitlistStatus = "pending" | "confirmed" | "unsubscribed";

export type WaitlistRow = {
  id: string;
  email: string;
  status: WaitlistStatus;
  ref: string;
  marketing: number;
  policy_version: string;
  consent_at: string;
  token_hash: string | null;
  token_expires_at: number;
  manage_hash: string | null;
  created_at: number;
  confirmed_at: number | null;
  ip_hash: string;
};

export type NewRow = Omit<WaitlistRow, "confirmed_at"> & { confirmed_at?: number | null };

/**
 * The storage seam. Production is D1 (prepared statements only); tests get the
 * in-memory implementation below, so handler logic is exercised without a
 * database and without mocking SQL strings.
 */
export interface WaitlistStore {
  findByEmail(email: string): Promise<WaitlistRow | null>;
  findByTokenHash(hash: string): Promise<WaitlistRow | null>;
  findByManageHash(hash: string): Promise<WaitlistRow | null>;
  insert(row: NewRow): Promise<void>;
  markConfirmed(id: string, confirmedAt: number): Promise<void>;
  markUnsubscribed(id: string): Promise<void>;
  reissueToken(
    id: string,
    tokenHash: string,
    expiresAt: number,
    manageHash: string,
  ): Promise<void>;
  /** Returns the attempt count for this IP in the current window. */
  bumpRate(ipHash: string, windowStart: number): Promise<number>;
}

const COLUMNS =
  "id, email, status, ref, marketing, policy_version, consent_at, token_hash, token_expires_at, manage_hash, created_at, confirmed_at, ip_hash";

export function d1Store(db: D1Database): WaitlistStore {
  return {
    async findByEmail(email) {
      return db
        .prepare(`SELECT ${COLUMNS} FROM waitlist WHERE email = ?1 LIMIT 1`)
        .bind(email)
        .first<WaitlistRow>();
    },

    async findByTokenHash(hash) {
      return db
        .prepare(`SELECT ${COLUMNS} FROM waitlist WHERE token_hash = ?1 LIMIT 1`)
        .bind(hash)
        .first<WaitlistRow>();
    },

    async findByManageHash(hash) {
      return db
        .prepare(`SELECT ${COLUMNS} FROM waitlist WHERE manage_hash = ?1 LIMIT 1`)
        .bind(hash)
        .first<WaitlistRow>();
    },

    async insert(row) {
      await db
        .prepare(
          `INSERT INTO waitlist (${COLUMNS})
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
        )
        .bind(
          row.id,
          row.email,
          row.status,
          row.ref,
          row.marketing,
          row.policy_version,
          row.consent_at,
          row.token_hash,
          row.token_expires_at,
          row.manage_hash,
          row.created_at,
          row.confirmed_at ?? null,
          row.ip_hash,
        )
        .run();
    },

    async markConfirmed(id, confirmedAt) {
      await db
        .prepare(
          `UPDATE waitlist
              SET status = 'confirmed', confirmed_at = ?1, token_hash = NULL, token_expires_at = 0
            WHERE id = ?2`,
        )
        .bind(confirmedAt, id)
        .run();
    },

    async markUnsubscribed(id) {
      await db
        .prepare(`UPDATE waitlist SET status = 'unsubscribed', token_hash = NULL WHERE id = ?1`)
        .bind(id)
        .run();
    },

    async reissueToken(id, tokenHash, expiresAt, manageHash) {
      await db
        .prepare(
          `UPDATE waitlist
              SET token_hash = ?1, token_expires_at = ?2, manage_hash = ?3
            WHERE id = ?4`,
        )
        .bind(tokenHash, expiresAt, manageHash, id)
        .run();
    },

    async bumpRate(ipHash, windowStart) {
      const row = await db
        .prepare(
          `INSERT INTO rate_limits (ip_hash, window_start, count) VALUES (?1, ?2, 1)
           ON CONFLICT(ip_hash, window_start) DO UPDATE SET count = count + 1
           RETURNING count`,
        )
        .bind(ipHash, windowStart)
        .first<{ count: number }>();
      return row?.count ?? 1;
    },
  };
}

/** Test/`--local` stand-in with the same semantics as the D1 statements. */
export function memoryStore(seed: NewRow[] = []): WaitlistStore {
  const rows = new Map<string, WaitlistRow>();
  const rates = new Map<string, number>();
  for (const row of seed) rows.set(row.id, { ...row, confirmed_at: row.confirmed_at ?? null });

  return {
    async findByEmail(email) {
      return [...rows.values()].find((row) => row.email === email) ?? null;
    },
    async findByTokenHash(hash) {
      return [...rows.values()].find((row) => row.token_hash === hash) ?? null;
    },
    async findByManageHash(hash) {
      return [...rows.values()].find((row) => row.manage_hash === hash) ?? null;
    },
    async insert(row) {
      if ([...rows.values()].some((item) => item.email === row.email)) {
        throw new Error("UNIQUE constraint failed: waitlist.email");
      }
      rows.set(row.id, { ...row, confirmed_at: row.confirmed_at ?? null });
    },
    async markConfirmed(id, confirmedAt) {
      const row = rows.get(id);
      if (!row) return;
      rows.set(id, { ...row, status: "confirmed", confirmed_at: confirmedAt, token_hash: null });
    },
    async markUnsubscribed(id) {
      const row = rows.get(id);
      if (!row) return;
      rows.set(id, { ...row, status: "unsubscribed", token_hash: null });
    },
    async reissueToken(id, tokenHash, expiresAt, manageHash) {
      const row = rows.get(id);
      if (!row) return;
      rows.set(id, {
        ...row,
        token_hash: tokenHash,
        token_expires_at: expiresAt,
        manage_hash: manageHash,
      });
    },
    async bumpRate(ipHash, windowStart) {
      const key = `${ipHash}:${windowStart}`;
      const next = (rates.get(key) ?? 0) + 1;
      rates.set(key, next);
      return next;
    },
  };
}
