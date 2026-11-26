import { hashToken, newToken } from './token.js';

export const RESET_TOKEN_TTL_MS = 1 * 60 * 60 * 1000;

export type ResetTokenRecord = {
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export type ResetCheck = 'ok' | 'invalid' | 'expired' | 'used';

export function createResetToken(now: Date): {
  token: string;
  record: ResetTokenRecord;
} {
  const token = newToken();
  const start = now;
  const tokenHash = hashToken(token);
  const expiresAt = new Date(start.getTime() + RESET_TOKEN_TTL_MS);
  const usedAt = null;
  return { token, record: { tokenHash, expiresAt, usedAt } };
}

export function checkResetToken(
  token: string,
  record: ResetTokenRecord,
  now: Date,
): ResetCheck {
  if (hashToken(token) !== record.tokenHash) {
    return 'invalid';
  }

  if (record.expiresAt <= now) {
    return 'expired';
  }

  if (record.usedAt !== null) {
    return 'used';
  }

  return 'ok';
}

// Returns a copy of the record, marked as used at `now` (so it can't be used twice).
export function markUsed(
  record: ResetTokenRecord,
  now: Date,
): ResetTokenRecord {
  return {
    ...record,
    usedAt: now,
  };
}
