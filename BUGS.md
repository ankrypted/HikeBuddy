# HikeBuddy — Known Bugs & Issues

---

## [RESOLVED] Silent 401 after JWT expiry — user stays "logged in" but all API calls fail

**Reported:** 2026-03-16
**Severity:** High
**Symptom:** After being logged in for an extended period, all authenticated API calls
(`/api/v1/users/feed`, `/api/v1/users/subscriptions`, `/api/v1/notifications`, etc.)
return 401. The user is never redirected to login — the UI silently breaks.
**Root cause:** The JWT expires (currently 24h via `app.jwt.expiration-ms=86400000`) but
the frontend has no mechanism to detect expiry or handle the resulting 401s. The token
sits in localStorage indefinitely.

### Suggested fixes (pick one or combine)

**Option 1 — Refresh token (industry standard, best UX)**
Issue two tokens on login:
- Access token: short-lived (15 min), used for API calls
- Refresh token: long-lived (7–30 days), stored in an `HttpOnly` cookie

An Angular HTTP interceptor silently calls `POST /auth/refresh` before the access token
expires. The user only sees a login prompt when the refresh token itself expires.
_Backend work:_ new `/auth/refresh` endpoint, refresh token storage (DB or Redis),
rotation on use.
_Frontend work:_ interceptor queues in-flight requests while refreshing, retries after.

**Option 2 — 401 interceptor → redirect to login (quick fix)**
In the Angular HTTP interceptor, catch any 401 response:
1. Clear the stored token + signal state in `AuthService`
2. Navigate to `/auth/login?sessionExpired=true`
3. Show a snackbar: *"Your session expired. Please sign in again."*

No backend changes needed. Not seamless, but correct and ships fast.

**Option 3 — Proactive expiry check on the frontend**
Decode the JWT on app init and on every navigation (`APP_INITIALIZER` + `Router` events).
Read the `exp` claim and compare to `Date.now()`. If expired or within 5 minutes of
expiry, clear state and redirect to login before any API call is attempted.

No backend changes needed. Doesn't handle server-side token revocation.

### Recommended path
Short term: **Option 2** (interceptor redirect) — eliminates the broken-UI state.
Long term: **Option 1** (refresh tokens) — seamless re-auth without user interruption.

### Status
**Resolved (2026-03-16):** Options 2 and 3 implemented together as a two-layer defence.
- `auth.interceptor.ts` — proactive `exp` check before every request; logout + redirect if expired (Option 3)
- `error.interceptor.ts` — catches server-returned 401 on non-auth endpoints as a safety net (Option 2)
- `login.component` — shows "Your session has expired" banner when redirected with `?sessionExpired=true`

Option 1 (refresh tokens) remains a long-term improvement item.

---

## [KNOWN RISK] JWT stored in localStorage — XSS exposure

**Reported:** 2026-03-16
**Severity:** Medium
**Status:** Accepted risk (no immediate fix planned)

**Issue:** The access token is stored in `localStorage`, which is readable by any JavaScript
running on the page. A successful XSS attack (e.g. via a malicious npm dependency or DOM
injection bug) could exfiltrate the token and let an attacker impersonate the user for up
to 24 hours (current token lifetime).

**Why it's currently acceptable:**
- Angular's template engine escapes output by default — most XSS vectors are blocked
- The app does not use `[innerHTML]`, `bypassSecurityTrustHtml`, or `eval`
- No user-generated HTML is rendered

**Proper fix — `HttpOnly` cookies:**
Store the JWT in a `Set-Cookie: HttpOnly; Secure; SameSite=Strict` cookie instead of
returning it in the JSON response body. JavaScript cannot read `HttpOnly` cookies at all,
so even a successful XSS attack cannot steal the token.

Required changes:
- **Backend:** Issue token via `Set-Cookie` header instead of JSON body; add CSRF token support
- **Frontend:** Remove manual token read/write from `AuthService`; update CORS config to `withCredentials: true`
- **Interceptors:** No longer need to attach `Authorization` header manually — browser sends cookie automatically

**Trade-off:** `HttpOnly` cookies require same-site or carefully configured cross-origin setup.
Worth doing if the app ever handles sensitive personal data beyond hiking preferences.
