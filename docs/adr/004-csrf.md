# ADR-004: CSRF protection

Status: Accepted (not built yet) · Date: 2026-11-17

## Context

CoachSlot authenticates users with the `co-slot` session cookie (HttpOnly, Secure, SameSite=Lax), see ADR-003.

A malicious website may try to make a logged-in user's browser send a request to our API
(for example "log out everywhere" or "cancel a booking"). The browser can attach the user's
session cookie automatically, so the server would think the user sent it. This is
Cross-Site Request Forgery (CSRF). The attacker never sees the cookie; they only make the browser use it.

OWASP (CSRF Prevention Cheat Sheet) says SameSite is useful defense in depth, but not enough on its own.

## Decision

We use three layers of CSRF protection:

1. **Cookie:** keep `co-slot` as `SameSite=Lax`, `HttpOnly` and `Secure`.
2. **JSON only:** POST, PUT, PATCH and DELETE endpoints accept only `Content-Type: application/json`.
   Any other content type (including `text/plain` and form types) is rejected with 415.
3. **Origin check:** every state-changing request (POST, PUT, PATCH, DELETE) must have an `Origin`
   header that exactly matches our allow list:
   - `https://coachslot-web.onrender.com`
   - `http://localhost:3000`

   The list is read from the `ALLOWED_ORIGINS` environment variable.
   If `Origin` is missing, we check the host of the `Referer` header instead.
   If both are missing, or `Origin` is `null`, or the origin is not on the list, we reject with 403.

GET endpoints must never change state.

## Why

- `SameSite=Lax` stops the browser from sending the cookie on cross-site POST requests,
  but still sends it when a user follows a link to us (a top-level GET).
- An HTML form cannot send `application/json`, so a simple hidden form on another site can't call our API.
  JSON-only is not a full defense by itself, because an API that also accepts `text/plain` can be tricked.
- The Origin check is our own server-side check of where the request comes from, so we don't rely only on the browser.
- Together these layers cover each other's gaps. None of them helps against XSS, so preventing XSS stays important.

## Consequences

- All state-changing browser requests must come from an allowed origin.
- The allowed origins must be configured on the backend (`ALLOWED_ORIGINS` on Render and locally).
- CORS must allow only these origins, and never `*` together with credentials.
- **Tests:** every e2e POST test must send `.set('Origin', 'http://localhost:3000')`, or it will get 403.
- **Manual testing:** curl commands must add `-H 'Origin: http://localhost:3000'`.
- Non-browser clients (scripts, a future mobile app) will need their own authentication policy.

## Implementation

Not built yet. Planned together with rate limiting on Week 3 Day 7 (issue #\_\_).
