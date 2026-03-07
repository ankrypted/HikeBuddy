# HikeBuddy — Solution Architecture

> **Role:** Solution Architect reference document
> **Status:** Reflects current implemented state + planned components
> **Last updated:** 2026-03-07

---

## 1. System Overview

HikeBuddy is a trail discovery and social hiking platform. The architecture is a **modular monolith** on the backend with a **single-page application** frontend, communicating exclusively via a REST API over HTTP/JSON.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                              │
│                                                                 │
│   Browser  ──►  Angular 19 SPA  (localhost:4200 / CDN)         │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS  (JWT Bearer / OAuth2 redirect)
┌───────────────────────────▼─────────────────────────────────────┐
│                       APPLICATION TIER                          │
│                                                                 │
│   Spring Boot 3.4.2  ──  Modular Monolith  (localhost:8080)    │
│                                                                 │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│   │  Auth    │ │  User    │ │  Review  │ │ SavedTrail /     │  │
│   │  Module  │ │  Module  │ │  Module  │ │ CompletedTrail   │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
│                                                                 │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│   │  Trail   │ │  Region  │ │  Media   │ │  Subscription    │  │
│   │  Module  │ │  Module  │ │  Module  │ │  Module          │  │
│   │ (planned)│ │ (planned)│ │  (S3)    │ │  (impl.)         │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │
└──────────┬────────────────────────────────┬─────────────────────┘
           │                                │
┌──────────▼──────────┐      ┌─────────────▼───────────────────┐
│    DATA TIER         │      │       STORAGE TIER              │
│                      │      │                                 │
│  PostgreSQL 16       │      │  AWS S3 (or compatible)         │
│  (Docker :5433)      │      │  avatars/, trail-media/         │
│                      │      │                                 │
│  Redis (planned)     │      │  Google OAuth2 (external IdP)   │
│  (cache layer)       │      │                                 │
└──────────────────────┘      └─────────────────────────────────┘
```

---

## 2. Domain Model

Six core domains. Each domain owns its database tables and is encapsulated behind a service class.

```
┌──────────┐       ┌─────────────────┐       ┌────────────────┐
│  User    │──1:N──│  TrailReview    │──N:1──│  Trail (slug)  │
│          │       └─────────────────┘       │  (static data, │
│          │──1:N──┌─────────────────┐       │  no DB table   │
│          │       │ UserSavedTrail  │──N:1──│  yet)          │
│          │──1:N──└─────────────────┘       │                │
│          │       ┌─────────────────┐       └────────────────┘
│          │──1:N──│UserCompletedTrl │──N:1──┘
│          │       └─────────────────┘
│          │──N:M──┌─────────────────┐
│          │       │ UserSubscription│
└──────────┘       └─────────────────┘
```

### Entity Summary

| Entity | Table | PK | Notes |
|---|---|---|---|
| `User` | `users` | UUID | email (unique), username (unique), provider (LOCAL/GOOGLE) |
| `TrailReview` | `trail_reviews` | UUID | trailId is a slug string (no FK to a trails table yet) |
| `UserSavedTrail` | `user_saved_trails` | composite (userId, trailId) | savedAt timestamp |
| `UserCompletedTrail` | `user_completed_trails` | composite (userId, trailId) | completedAt timestamp |
| `UserSubscription` | `user_subscriptions` | composite (followerId, followeeId) | social follow graph |

---

## 3. Backend Module Breakdown

### 3.1 Auth Module (`com.hikebuddy.auth`)

**Responsibility:** Identity — registration, login, JWT issuance, Google OAuth2 flow.

```
AuthController  ──►  AuthService  ──►  UserRepository
                          │
                          └──►  JwtService  (sign / validate HS256 JWT)
                          └──►  PasswordEncoder (BCrypt)

OAuth2 Flow:
  Browser  ──►  /oauth2/authorization/google
           ◄──  Google OIDC  ──►  CustomOAuth2UserService
                                        │
                                        └──►  upsert User  ──►  UserRepository
                                  OAuth2AuthenticationSuccessHandler
                                        │
                                        └──►  JwtService.generateToken()
                                        └──►  redirect → frontend /auth/callback?token=...
```

**Key classes:**
- `AuthController` — `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- `AuthService` — validates credentials, calls `JwtService`, returns `AuthResponseDto`
- `JwtService` — HS256 token generation and parsing (subject = user email)
- `CustomOAuth2UserService` — OIDC user info → upserts `User` entity with `provider=GOOGLE`
- `OAuth2AuthenticationSuccessHandler` — issues JWT, redirects browser to Angular callback route
- `HttpCookieOAuth2AuthorizationRequestRepository` — stores OAuth2 state in cookie (stateless session)
- `JwtAuthFilter` — `OncePerRequestFilter`; extracts Bearer token, validates, populates `SecurityContext`

---

### 3.2 User Module (`com.hikebuddy.user`)

**Responsibility:** User profile management, avatar upload, public profiles, social subscriptions, activity feed.

```
UserController  ──►  UserService
                          │
                          ├──►  UserRepository            (CRUD on users table)
                          ├──►  S3Service                 (avatar upload)
                          ├──►  UserCompletedTrailRepository
                          ├──►  TrailReviewRepository
                          ├──►  UserSavedTrailRepository
                          └──►  UserSubscriptionRepository
```

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/me` | Required | Authenticated user's full profile |
| PATCH | `/api/v1/users/me` | Required | Update bio / avatarUrl |
| POST | `/api/v1/users/me/avatar` | Required | Multipart image upload → S3 |
| PUT | `/api/v1/users/me/password` | Required | Change password (LOCAL provider only) |
| GET | `/api/v1/users/public` | Public | All users (summary, no activity) |
| GET | `/api/v1/users/{username}/public` | Public | Full public profile + activity feed |
| POST | `/api/v1/users/{username}/subscribe` | Required | Follow a user |
| DELETE | `/api/v1/users/{username}/subscribe` | Required | Unfollow a user |
| GET | `/api/v1/users/subscriptions` | Required | List of followed usernames |
| GET | `/api/v1/users/feed` | Required | Full profiles of followed users |

**Activity Feed construction** (`buildActivityEvents`):
Merges completed trail events, review events, and saved trail events from three repositories, sorts by timestamp descending, limits to 20. Returns `List<ActivityEventDto>`.

---

### 3.3 Review Module (`com.hikebuddy.review`)

**Responsibility:** Trail reviews — submit and retrieve.

```
ReviewController  ──►  ReviewService  ──►  TrailReviewRepository
                                │
                                └──►  UserRepository  (resolve email → userId)
```

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/trails/{trailId}/reviews` | Public | All reviews for a trail |
| POST | `/api/v1/trails/{trailId}/reviews` | Required | Submit a review |

**Notes:**
- `trailId` is a slug string (e.g., `grand-canyon-rim`); no foreign key to a trails table
- `repo.saveAndFlush()` required so `@CreationTimestamp` is populated before `toResponse()` is called

---

### 3.4 SavedTrail Module (`com.hikebuddy.savedtrail`)

**Responsibility:** User's saved (bookmarked) trails list.

```
SavedTrailController  ──►  SavedTrailService  ──►  UserSavedTrailRepository
                                     │
                                     └──►  UserRepository
```

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/me/saved-trails` | Required | List of saved trail slugs |
| POST | `/api/v1/users/me/saved-trails` | Required | Save a trail `{trailId}` |
| DELETE | `/api/v1/users/me/saved-trails/{trailId}` | Required | Remove a saved trail |

---

### 3.5 CompletedTrail Module (`com.hikebuddy.completedtrail`)

**Responsibility:** Tracking which trails a user has completed.

```
CompletedTrailController  ──►  CompletedTrailService  ──►  UserCompletedTrailRepository
                                           │
                                           └──►  UserRepository
```

**Endpoints:**

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/me/completed-trails` | Required | List of completed trail slugs |
| POST | `/api/v1/users/me/completed-trails` | Required | Mark trail complete `{trailId}` |
| DELETE | `/api/v1/users/me/completed-trails/{trailId}` | Required | Unmark complete |

---

### 3.6 Storage Module (`com.hikebuddy.storage`)

**Responsibility:** Abstraction over AWS S3 for binary file storage.

```
S3Service  ──►  AWS SDK v2 S3Client  ──►  S3 Bucket
```

- Called exclusively by `UserService.uploadAvatar()`
- Validates: `contentType` must start with `image/`, max 5 MB
- Stores under `avatars/{userId}/{uuid}.{ext}`
- Returns public URL stored on `User.avatarUrl`
- Config: `S3Config` constructs `S3Client` from `application-local.properties` (gitignored)

---

### 3.7 Subscription Module (`com.hikebuddy.subscription`)

**Responsibility:** Social follow/unfollow graph between users.

- No dedicated controller — operations delegated through `UserController` → `UserService`
- `UserSubscription` entity: composite PK `(followerId UUID, followeeId UUID)`
- Supports: subscribe, unsubscribe, list subscriptions, count followers, feed generation

---

### 3.8 Security Layer (`com.hikebuddy.security`, `com.hikebuddy.config`)

```
Incoming Request
      │
      ▼
CorsFilter  ──►  OPTIONS → 200 immediately
      │
      ▼
JwtAuthFilter
  ├── No/invalid token  →  continue (SecurityContext stays anonymous)
  └── Valid token       →  load UserDetails → set Authentication in SecurityContext
      │
      ▼
SecurityFilterChain (Spring Security 6.4)
  ├── Public paths  →  permitAll
  └── Protected     →  authenticated() check
      │
      ▼
Controller / ExceptionTranslationFilter
  └── AuthenticationException  →  401 (authenticationEntryPoint)
```

**Public paths (no token required):**
- `OPTIONS /**` (CORS preflight)
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- `GET /oauth2/**`, `GET /login/oauth2/**`
- `GET /api/v1/trails/**`
- `GET /api/v1/regions/**`
- `GET /api/v1/users/public`, `GET /api/v1/users/*/public`
- `/error`

---

## 4. Frontend Module Breakdown

Angular 19 SPA. All components standalone, `ChangeDetectionStrategy.OnPush`. All routes lazy-loaded.

```
AppComponent  (shell — router-outlet only)
      │
      ├── NavbarComponent     (OnPush, signals: searchOpen, menuOpen)
      │     ├── HikerLogoComponent
      │     └── SearchOverlayComponent
      │
      └── <router-outlet>
            ├── /               →  LandingComponent
            ├── /trails         →  TrailListComponent  (stub)
            ├── /trails/:slug   →  TrailDetailComponent (stub)
            ├── /auth/login     →  LoginComponent       (stub)
            ├── /auth/register  →  RegisterComponent    (stub)
            ├── /auth/callback  →  AuthCallbackComponent (OAuth2 token handler)
            ├── /users/:username→  UserProfileComponent
            ├── /gallery        →  GalleryComponent     (stub)
            ├── /contact        →  ContactComponent     (stub)
            └── /favorites      →  FavoritesComponent   (stub)
```

### 4.1 Core Services

#### `AuthService` (signal-based)

```
AuthService
  Signals:  accessToken, currentUser, roles
  Computed: isLoggedIn, isAdmin

  login(credentials)        POST /api/v1/auth/login      → stores JWT in signal
  register(data)            POST /api/v1/auth/register   → stores JWT in signal
  handleOAuthCallback(token)                             → stores JWT from OAuth2 redirect
  logout()                                               → clears signals
```

#### `TrailService`

```
TrailService
  getFeaturedTrails()   →  of(MOCK_FEATURED_TRAILS)   [swap: GET /api/v1/trails?featured=true]
  getTrailBySlug(slug)  →  of(MOCK_TRAIL)             [swap: GET /api/v1/trails/{slug}]
```

> **Note:** Currently returns mock `Observable`. The service is designed for a one-line swap to an `HttpClient` call when the Trail backend module is implemented.

#### `UserService`

```
UserService
  getPublicProfile(username)  GET /api/v1/users/{username}/public
  getCurrentUser()            GET /api/v1/users/me
  updateProfile(dto)          PATCH /api/v1/users/me
  uploadAvatar(file)          POST /api/v1/users/me/avatar
```

### 4.2 HTTP Interceptors

```
auth.interceptor.ts     — Attaches Bearer token from AuthService signal to all outbound requests
error.interceptor.ts    — Catches 401 responses → triggers AuthService.logout() + redirect to /auth/login
```

### 4.3 Guards

```
auth.guard.ts   — Functional guard: checks AuthService.isLoggedIn signal; redirects to /auth/login
role.guard.ts   — Functional guard: checks AuthService.isAdmin signal; redirects to /
```

---

## 5. Data Flow: Key Scenarios

### 5.1 Email Registration

```
Browser  ──POST /api/v1/auth/register──►  AuthController
                                               │
                                          AuthService
                                               │
                                    ┌──►  UserRepository.existsByEmail()
                                    ├──►  UserRepository.existsByUsername()
                                    ├──►  PasswordEncoder.encode()
                                    ├──►  UserRepository.save()
                                    └──►  JwtService.generateToken()
                                               │
                                     ◄── 201 AuthResponseDto { token, user, roles }
                                               │
                              Angular AuthService.accessToken.set(token)
                              Angular router → /  (landing)
```

### 5.2 Google OAuth2 Login

```
Browser  ──GET /oauth2/authorization/google──►  Spring Security
                                                     │
                                              Redirect to Google
                                                     │
                Google OIDC callback ──►  /login/oauth2/code/google
                                                     │
                                          CustomOAuth2UserService
                                          (upsert User, provider=GOOGLE)
                                                     │
                                          OAuth2AuthenticationSuccessHandler
                                          JwtService.generateToken()
                                                     │
                                          Redirect → localhost:4200/auth/callback?token=...
                                                     │
                              Angular AuthCallbackComponent
                              authService.handleOAuthCallback(token)
                              router → /
```

### 5.3 Submit a Review

```
Browser  ──POST /api/v1/trails/{trailId}/reviews──►  ReviewController
  (Bearer JWT in header)                                    │
                                                   JwtAuthFilter validates token
                                                   SecurityContext populated
                                                            │
                                                   ReviewService.submitReview()
                                                       ├──►  UserRepository (resolve email → userId)
                                                       ├──►  TrailReviewRepository.saveAndFlush()
                                                       └──►  toResponse() → ReviewResponse
                                                            │
                                                   ◄── 201 ReviewResponse
```

### 5.4 Avatar Upload

```
Browser  ──POST /api/v1/users/me/avatar (multipart)──►  UserController
                                                              │
                                                     UserService.uploadAvatar()
                                                         ├──  validate contentType + size
                                                         ├──►  S3Service.uploadAvatar()
                                                         │         └──►  AWS S3 SDK
                                                         │               └──►  S3 Bucket
                                                         │         ◄── public URL
                                                         ├──►  User.setAvatarUrl(url)
                                                         └──►  UserRepository.save()
                                                              │
                                                     ◄── 200 { "avatarUrl": "https://..." }
```

### 5.5 Public Profile + Activity Feed

```
Browser  ──GET /api/v1/users/{username}/public──►  UserController (no auth required)
                                                         │
                                                UserService.getPublicUserProfile()
                                                    ├──►  UserRepository.findByUsername()
                                                    ├──►  CompletedTrailRepository.findTrailIdsByUserId()
                                                    ├──►  buildActivityEvents():
                                                    │       ├──►  CompletedTrailRepository (desc by date)
                                                    │       ├──►  ReviewRepository (desc by date)
                                                    │       └──►  SavedTrailRepository (desc by date)
                                                    │       └──  merge + sort + limit(20)
                                                    └──►  PublicUserDto.from(...)
                                                         │
                                                ◄── 200 PublicUserDto { stats, completedTrailIds, recentActivity }
                                                         │
                                     Angular UserProfileComponent
                                         resolvedActivity (computed signal):
                                             trailId → TrailService.allTrails() lookup
                                         completedTrails (computed signal):
                                             completedTrailIds → PublicTrailRef[]
```

---

## 6. Security Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  TOKEN LIFECYCLE                                               │
│                                                                │
│  Issue:    AuthService (register/login) or OAuth2Handler       │
│  Format:   HS256 JWT  { sub: email, roles: [...], iat, exp }   │
│  Storage:  Angular signal (memory only — no localStorage)      │
│  Expiry:   Configurable via app.jwt.expiration-ms              │
│  Refresh:  Not implemented (re-login required on expiry)       │
│                                                                │
│  Transport: Authorization: Bearer <token>                      │
│             Attached by auth.interceptor.ts on every request   │
│                                                                │
│  Validation: JwtAuthFilter (OncePerRequestFilter)              │
│              ├── Extract from Authorization header             │
│              ├── JwtService.validateToken()                    │
│              ├── Load UserDetails (email → DB lookup)          │
│              └── Set UsernamePasswordAuthenticationToken       │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  ROLES                                                         │
│                                                                │
│  ROLE_USER   — default for all registered users               │
│  ROLE_ADMIN  — elevated; checked by role.guard.ts on frontend  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  CORS                                                          │
│                                                                │
│  Allowed origin: http://localhost:4200 (dev)                   │
│  Configured in: CorsConfig.java                                │
│  OPTIONS requests: permitted before any auth check             │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Infrastructure & Deployment

### Development Environment

| Component | Host | Port |
|---|---|---|
| Angular SPA | localhost | 4200 |
| Spring Boot API | localhost | 8080 |
| PostgreSQL (Docker) | localhost | 5433 |
| pgAdmin (Docker) | localhost | 5050 |
| AWS S3 | external | — |
| Google OAuth2 | external | — |

**Note:** Native PostgreSQL on this machine occupies port 5432. Docker is mapped to 5433.

### Docker Compose Services

```yaml
# HikeBuddy/docker-compose.yml
services:
  postgres:   image: postgres:16,  ports: 5433:5432
  pgadmin:    image: pgadmin4,     ports: 5050:80
```

### Database Migrations (Flyway)

| Migration | Description |
|---|---|
| V1 | `users` table — core user entity |
| V2 | `user_saved_trails` table |
| V3 | `user_completed_trails` + `trail_reviews` tables |
| V4 | `bio` column added to `users` |

### Spring Boot Profiles

| Profile | Purpose | Config file |
|---|---|---|
| `local` | Development with real credentials | `application-local.properties` (gitignored) |
| default | Base config | `application.properties` |

---

## 8. Planned / Not Yet Implemented

| Component | Status | Notes |
|---|---|---|
| Trail DB table + CRUD | Planned | Currently trail data is static / mock in frontend |
| Region module | Planned | `GET /api/v1/regions/**` is whitelisted in security config |
| Redis caching | Planned | High-read endpoints: trail list, public profiles |
| Leaflet map integration | Planned | Angular feature; OpenStreetMap tiles |
| Gallery feature | Stub | Route exists; component is empty |
| Contact feature | Stub | Route exists; component is empty |
| Favorites page | Stub | Route exists; will consume SavedTrail API |
| JWT refresh tokens | Planned | Currently re-login required on expiry |
| Pagination (API) | Planned | CLAUDE.md mandates pagination mandatory |
| Trail media upload | Planned | S3Config and S3Service in place |
| Rate limiting | Planned | — |
| CI/CD pipeline | Planned | Dockerfile not yet written |

---

## 9. Inter-Service Dependency Map

```
                    ┌──────────────────────────────────────────────┐
                    │            SPRING BOOT PROCESS               │
                    │                                               │
  AuthController ──►│ AuthService ──► JwtService                   │
                    │             ──► PasswordEncoder               │
                    │             ──► UserRepository                │
                    │                                               │
  UserController ──►│ UserService ──► UserRepository                │
                    │             ──► S3Service ──► AWS S3           │
                    │             ──► CompletedTrailRepository       │
                    │             ──► ReviewRepository               │
                    │             ──► SavedTrailRepository           │
                    │             ──► SubscriptionRepository         │
                    │                                               │
  ReviewController─►│ ReviewService ──► ReviewRepository            │
                    │               ──► UserRepository               │
                    │                                               │
  SavedTrailCtrl  ──►│ SavedTrailService ──► SavedTrailRepository    │
                    │                   ──► UserRepository           │
                    │                                               │
  CompletedCtrl   ──►│ CompletedTrailService ──► CompletedTrailRepo  │
                    │                        ──► UserRepository      │
                    │                                               │
  OAuth2 Flow     ──►│ CustomOAuth2UserService ──► UserRepository    │
                    │ OAuth2SuccessHandler ──► JwtService            │
                    │                                               │
  All controllers ──►│ JwtAuthFilter ──► JwtService                 │
                    │               ──► UserDetailsServiceImpl       │
                    │                       └──► UserRepository      │
                    │                                               │
                    │   ┌────────────────────────────────────────┐  │
                    │   │  PostgreSQL  (all repositories)        │  │
                    │   └────────────────────────────────────────┘  │
                    └──────────────────────────────────────────────┘
```

---

## 10. Key Architectural Decisions & Rationale

| Decision | Rationale |
|---|---|
| Modular monolith (not microservices) | Team size and project scale don't justify distributed complexity; modules can be extracted later |
| JWT stateless auth (no server-side sessions) | Horizontal scalability; no session store needed |
| JWT stored in Angular signal (not localStorage) | XSS protection; token lives only in JS heap |
| trailId as slug string (no FK) | Trail data is static/mock; avoids premature DB table creation |
| `saveAndFlush()` in ReviewService | Hibernate 6 populates `@CreationTimestamp` on flush, not persist; prevents null NPE in response |
| S3 for media (not DB blobs) | Keeps DB lean; CDN-friendly; standard pattern for production |
| Flyway for migrations | Versioned schema; reproducible across environments |
| Angular signals for auth state | Fine-grained reactivity; OnPush-compatible; avoids BehaviorSubject boilerplate |
| All routes lazy-loaded | Reduces initial bundle; each feature chunk ~2-53kB |
| Separate permitAll() calls per HTTP method | Spring Security 6.4 MvcRequestMatcher bug: multi-pattern calls on same path hierarchy break authorization |
