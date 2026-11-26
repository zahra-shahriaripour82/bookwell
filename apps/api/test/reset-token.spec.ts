// import {

// } from
import {
  createResetToken,
  RESET_TOKEN_TTL_MS,
  checkResetToken,
  markUsed,
} from '../src/auth/reset-token.js';
import { hashToken } from '../src/auth/token.js';

// One fixed "now" for every test, so time is data we control.
const now = new Date('2026-11-18T10:00:00Z');
const minutes = (n: number) => n * 60 * 1000;
const at = (ms: number) => new Date(now.getTime() + ms); // a time relative to `now`

describe('createResetToken', () => {
  it('returns a token, and the record holds its hash, not the token', () => {
    const { token, record } = createResetToken(now);

    expect(token.length).toBeGreaterThan(30); // 32 random bytes in base64url ≈ 43 characters
    expect(record.tokenHash).toBe(hashToken(token));
    expect(record.tokenHash).not.toBe(token);
    expect(JSON.stringify(record)).not.toContain(token); // the real key is nowhere in what we store
  });

  it('gives a different token every time', () => {
    const a = createResetToken(now);
    const b = createResetToken(now);

    expect(a.token).not.toBe(b.token);
    expect(a.record.tokenHash).not.toBe(b.record.tokenHash);
  });

  it('expires exactly 1 hour after now', () => {
    const { record } = createResetToken(now);

    expect(RESET_TOKEN_TTL_MS).toBe(minutes(60));
    expect(record.expiresAt.getTime()).toBe(now.getTime() + minutes(60));
  });

  it('starts as not used', () => {
    const { record } = createResetToken(now);

    expect(record.usedAt).toBeNull();
  });
});

describe('checkResetToken', () => {
  it('right token, 59 minutes later → ok', () => {
    const { token, record } = createResetToken(now);

    expect(checkResetToken(token, record, at(minutes(59)))).toBe('ok');
  });

  it('right token, 1 ms before the end → ok (edge)', () => {
    const { token, record } = createResetToken(now);

    expect(checkResetToken(token, record, at(minutes(60) - 1))).toBe('ok');
  });

  it('right token, exactly at expiresAt → expired (edge: "at or after" counts as expired)', () => {
    const { token, record } = createResetToken(now);

    expect(checkResetToken(token, record, record.expiresAt)).toBe('expired');
  });

  it('right token, 2 hours later → expired', () => {
    const { token, record } = createResetToken(now);

    expect(checkResetToken(token, record, at(minutes(120)))).toBe('expired');
  });

  it('wrong token → invalid', () => {
    const { record } = createResetToken(now);

    expect(checkResetToken('not-the-real-token', record, now)).toBe('invalid');
  });

  it('empty token → invalid', () => {
    const { record } = createResetToken(now);

    expect(checkResetToken('', record, now)).toBe('invalid');
  });

  it("another user's real token → invalid", () => {
    const sara = createResetToken(now);
    const lisa = createResetToken(now);

    expect(checkResetToken(lisa.token, sara.record, now)).toBe('invalid');
  });

  it('wrong token AND expired → invalid (a wrong key learns nothing about the record)', () => {
    const { record } = createResetToken(now);

    expect(
      checkResetToken('not-the-real-token', record, at(minutes(120))),
    ).toBe('invalid');
  });

  it('wrong token AND used → invalid', () => {
    const { record } = createResetToken(now);
    const used = markUsed(record, at(minutes(5)));

    expect(checkResetToken('not-the-real-token', used, at(minutes(10)))).toBe(
      'invalid',
    );
  });
});

describe('markUsed', () => {
  it('after markUsed, the right token → used (single-use)', () => {
    const { token, record } = createResetToken(now);
    const used = markUsed(record, at(minutes(5)));

    expect(checkResetToken(token, used, at(minutes(10)))).toBe('used');
  });

  it('stores when it was used', () => {
    const { record } = createResetToken(now);
    const usedTime = at(minutes(5));

    expect(markUsed(record, usedTime).usedAt).toEqual(usedTime);
  });

  it('does not change the original record (returns a new object)', () => {
    const { record } = createResetToken(now);
    const before = { ...record };

    const used = markUsed(record, at(minutes(5)));

    expect(used).not.toBe(record);
    expect(record).toEqual(before);
    expect(record.usedAt).toBeNull();
  });

  it('keeps the hash and the expiry the same', () => {
    const { record } = createResetToken(now);
    const used = markUsed(record, at(minutes(5)));

    expect(used.tokenHash).toBe(record.tokenHash);
    expect(used.expiresAt).toEqual(record.expiresAt);
  });
});
