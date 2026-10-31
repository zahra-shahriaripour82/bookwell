# Design: <title>

**Author:** · **Date:** · **Ticket:** · **Status:** draft | reviewed | done

## Problem

Today, CoachSlot has no accounts: owners, coaches and clients can’t sign up or log in.

Coaches at our pilot gym also report that their account was used by someone else. One found a session she never booked, and another maybe forgot to log out on the front-desk computer.

## Options

Decided in [ADR-003](../../adr/003-sessions.md), summarized here.

### Option A: Server sessions
After login, we save a session row in the database and give the browser a cookie
with a random ID. On every request, we look the ID up in the table.

+ We can log someone out immediately by deleting their session row
+ Simple, because we have one app (ADR-001)
− Every request needs one extra database lookup

### Option B: JWT
After login, the server gives the browser a signed token with the user's ID and an
expiry time. On every request, the server only checks the signature.

+ No database lookup on every request
− A JWT can't be cancelled before it expires


## Decision and why

sessions
- id              uuid, primary key
- token_hash      varchar, unique  (hash of the random session ID in the cookie)
- user_id         uuid → users.id
- created_at      timestamptz      (when she logged in)
- last_used_at    timestamptz      (updated on each request; for the idle timeout)
- expires_at      timestamptz      (the absolute end, even if she keeps using it)
- remember_me     boolean          (own phone = long, shared computer = short; see question 2)
- user_agent      varchar          (shown as the device name in "My devices")

- token_hash:   if the DB leaks, the attacker can't use the hashes as cookies (threat row 4)
- last_used_at: to log out after 15 minutes of no use on a shared computer (A4)
- expires_at:   a hard end, so even an active or stolen session dies for sure (threat row 4)
- user_agent:   the device name shown in "My devices" (A5)


### 2. Shared computer or own device?
The server can't know which computer is shared, so the user tells us with a
"Remember me" checkbox on the login page.

- Not checked (default): the session ends after 15 minutes of no use (A4).
- Checked: the session stays alive as long as it's used at least once a week (A4).
-  The default is unchecked because a coach at the front desk may not notice the box,
  and then she still gets the safe, short session.

- Hard end: every session ends after 30 days, even if it's used daily (expires_at),
  so a stolen cookie can't work forever (threat row 4).



### 3. The cookie
Name: `co-slot` 
Value: the random session ID (only its hash is in the DB)

- HttpOnly: so javacrtipt can't read it (threat row 4a)
- Secure: so it's only sent over https (threat row 4b)
- SameSite: ? (I'll read about it on Day 3)
- Max-Age: with "Remember me" = 30days; without = no Max-Age, so the cookie
  disappears when the browser is closed


### 4.Rate limits
Sign-up is 20 per 3 minutes per IP, not 5, because everyone on the gym Wi-Fi shares
one IP address. A group of new clients on opening day still fits, while an attacker
testing thousands of emails is still very slow.



### 5. Log out everywhere
When she presses "Log out everywhere", we delete all sessions with her user_id,
except the current one (found by hashing the cookie of this request).
So every other device sees the login page on its next click, and her phone stays logged in (A5).



### 6. Assumptions (product owner, please confirm)
- Owner sessions follow the same rules as coaches for now.
- Every session ends after 30 days, even if she uses it every day, so she logs in again once a month.
- In "Log out everywhere", the device she pressed it on stays logged in.
- After 5 wrong passwords for one email, we wait 10 minutes (no full lockout).
- Out of scope: removing a coach from a gym and ending her sessions there (Week 4).


### Data / API changes
POST /auth/register   → 201 created / 400 invalid input / 409 email exists / 429 too many
POST /auth/login      → 200 ok / 400 invalid / 401 wrong email or password (same message for both) / 429 too many
POST /auth/logout     → 204 no content / 401 not logged in
POST /auth/logout-all → 204 no content / 401 not logged in
GET  /auth/me         → 200 her user (id, email, role) / 401 not logged in
GET  /auth/sessions   → 200 list of her sessions / 401 not logged in

## Risks

Security risks: see [threat-model.md](threat-model.md).

- Cookie across domains: the website and API are on different addresses.
  The browser may not send the cookie, so users look logged out after login.
  Status: unknown, check on Day 4. Possible fix: put both behind one domain.
- Server sleep: Render's free plan sleeps after about 15 minutes with no traffic.
  The first login of the day can take up to a minute, and a coach may think login is broken.
  Fix: show a "Waking up the server…" message, or move to a paid plan before real users.

## Test plan

- register with a new email → 201
- register with the same email again → 409
- register with incorrect data → 400 invalid input 
- login with wrong an email → 401
- login with incorrect data → 400 invalid input 
- login with wrong password → 401
- logout without login → 401
- logout all without login → 401
- get profile → 200 her user(id , email)
- get profile → 401 without login 
- get session → 200 list of her session
- get session → 401 without login
- login with correct email + password → 200, and the response sets cookie co-slot (HttpOnly, Secure)
- wrong email and wrong password → the same 401 (A1, no enumeration)
- 6th wrong password for one email → 429 too many tries, wait 10 minutes
- logout → 204, then GET /auth/me with the old cookie → 401 
- logout-all from the phone → laptop cookie gets 401, phone cookie still gets 200

