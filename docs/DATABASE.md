# HikeBuddy — Database Architecture

> **Role:** Solution Architect reference document
> **Scope:** PostgreSQL schema, indexes, relationships, access patterns, planned extensions
> **Last updated:** 2026-03-07

---

## 1. Storage Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      PERSISTENCE TIER                            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  PostgreSQL 16  (Docker — localhost:5433)               │    │
│  │                                                         │    │
│  │  Database: hikebuddy                                    │    │
│  │                                                         │    │
│  │  Managed by: Flyway (versioned migrations V1–V5)        │    │
│  │  ORM:        Spring Data JPA / Hibernate 6              │    │
│  │  PK type:    UUID (gen_random_uuid())                   │    │
│  │  Timestamps: TIMESTAMPTZ (UTC)                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  AWS S3  (external object store)                        │    │
│  │                                                         │    │
│  │  Not a relational table — binary blobs only             │    │
│  │  Referenced by: users.avatar_url (VARCHAR URL)          │    │
│  │  Path pattern:  avatars/{userId}/{uuid}.{ext}           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Redis  (planned — not yet deployed)                    │    │
│  │                                                         │    │
│  │  Target: cache high-read endpoints                      │    │
│  │  Keys:   trails:featured, trails:{slug},                │    │
│  │          users:{username}:public                        │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Entity-Relationship Diagram

```
┌─────────────────────────────────────┐
│              users                  │
│─────────────────────────────────────│
│ PK  id            UUID              │
│     username      VARCHAR(50) UNIQ  │
│     email         VARCHAR(255) UNIQ │
│     password_hash VARCHAR(255)      │◄── NULL for OAuth users
│     google_id     VARCHAR(255) UNIQ │◄── NULL for LOCAL users
│     avatar_url    VARCHAR(500)      │──► S3 object URL
│     bio           VARCHAR(500)      │
│     provider      VARCHAR(10)       │  LOCAL | GOOGLE
│     created_at    TIMESTAMPTZ       │
└──────────────┬──────────────────────┘
               │ 1
               │
     ┌─────────┼──────────────────────────────────────────────────┐
     │         │                                                   │
     │ N       │ N                             N                   │ N
     ▼         ▼                               ▼                   ▼
┌──────────┐ ┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│user_roles│ │ user_saved_trails│  │user_completed_trails │  │   trail_reviews      │
│──────────│ │──────────────────│  │──────────────────────│  │──────────────────────│
│FK user_id│ │FK PK user_id UUID│  │FK PK user_id    UUID │  │PK  id     UUID       │
│   role   │ │   PK trail_id    │  │      trail_id   slug │  │FK  user_id UUID      │
│          │ │      VARCHAR(64) │  │   PK VARCHAR(64)     │  │    trail_id VARCHAR64 │
│          │ │   saved_at TSTZ  │  │   completed_at  TSTZ │  │    rating  SMALLINT  │
│          │ └──────────────────┘  └──────────────────────┘  │    comment TEXT      │
│          │         │                       │                │    created_at TSTZ   │
│          │      trail_id               trail_id             └──────────────────────┘
│          │         │                       │                          │
│          │         ▼                       ▼                       trail_id
│          │   [trails table]          [trails table]                    │
│          │   (planned)               (planned)                         ▼
│          │                                                       [trails table]
│          │                                                       (planned)
│          │
│    ┌─────┴──────────────────────────────────┐
│    │        user_subscriptions              │
│    │────────────────────────────────────────│
│    │ PK FK follower_id   UUID  ──► users.id │
│    │ PK FK followee_id   UUID  ──► users.id │
│    │        subscribed_at TSTZ              │
│    │        CHECK follower_id <> followee_id│
│    └────────────────────────────────────────┘
└─────────────────────────────────────────────
```

---

## 3. Table Reference

### 3.1 `users`

The central entity. All other tables reference it.

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | UUID | NOT NULL PK | `gen_random_uuid()` default |
| `username` | VARCHAR(50) | NOT NULL UNIQUE | Display name, used in URLs |
| `email` | VARCHAR(255) | NOT NULL UNIQUE | Auth principal / JWT subject |
| `password_hash` | VARCHAR(255) | NULL | NULL for Google OAuth users |
| `google_id` | VARCHAR(255) | NULL UNIQUE | Google OIDC subject; NULL for LOCAL users |
| `avatar_url` | VARCHAR(500) | NULL | S3 URL; set after upload |
| `bio` | VARCHAR(500) | NULL | Added in V4 |
| `provider` | VARCHAR(10) | NOT NULL | `LOCAL` or `GOOGLE` |
| `created_at` | TIMESTAMPTZ | NOT NULL | `DEFAULT now()`, immutable |

**Indexes:**

| Index | Column(s) | Purpose |
|---|---|---|
| PK | `id` | Entity lookup by JPA |
| UNIQUE | `username` | Username availability check on register |
| UNIQUE | `email` | Auth lookup; uniqueness on register |
| UNIQUE | `google_id` | OAuth2 upsert lookup |
| `idx_users_email` | `email` | Fast `findByEmail()` — called on every authenticated request |
| `idx_users_google_id` | `google_id` | Fast `findByGoogleId()` during OAuth2 login |

---

### 3.2 `user_roles`

Join table for the `@ElementCollection` on `User.roles`.

| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID FK | References `users(id)` ON DELETE CASCADE |
| `role` | VARCHAR(20) | `ROLE_USER` or `ROLE_ADMIN` |

**Primary key:** composite `(user_id, role)`

Loaded `EAGER` — fetched in the same query as the user entity. Used by `JwtService` to embed roles in the JWT and by `UserDetails` for Spring Security authorization.

---

### 3.3 `user_saved_trails`

Bookmarked trails per user. Composite PK prevents duplicate saves.

| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID FK | References `users(id)` ON DELETE CASCADE |
| `trail_id` | VARCHAR(64) | Trail slug (e.g., `grand-canyon-rim`); no FK yet |
| `saved_at` | TIMESTAMPTZ | `DEFAULT NOW()`, immutable |

**Primary key:** composite `(user_id, trail_id)`

**Indexes:**

| Index | Column | Purpose |
|---|---|---|
| `idx_saved_trails_user` | `user_id` | List a user's saved trails — primary read pattern |

**Note:** `trail_id` is a slug string. A FK to a `trails` table will be added when that table is implemented (V6+).

---

### 3.4 `user_completed_trails`

Trails a user has marked as completed. Same structure as saved trails.

| Column | Type | Notes |
|---|---|---|
| `user_id` | UUID FK | References `users(id)` ON DELETE CASCADE |
| `trail_id` | VARCHAR(64) | Trail slug; no FK yet |
| `completed_at` | TIMESTAMPTZ | `DEFAULT NOW()`, immutable |

**Primary key:** composite `(user_id, trail_id)`

**Indexes:**

| Index | Column | Purpose |
|---|---|---|
| `idx_completed_trails_user` | `user_id` | List completed trails and count for profile stats |

---

### 3.5 `trail_reviews`

User reviews for trails. One review per user per trail enforced by UNIQUE constraint.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | `gen_random_uuid()` default |
| `user_id` | UUID FK | References `users(id)` ON DELETE CASCADE |
| `trail_id` | VARCHAR(64) | Trail slug; no FK yet |
| `rating` | SMALLINT | `CHECK (rating BETWEEN 1 AND 5)` |
| `comment` | TEXT | Unlimited length |
| `created_at` | TIMESTAMPTZ | `DEFAULT NOW()`, immutable; populated on flush |

**Constraints:**
- `UNIQUE (user_id, trail_id)` — one review per user per trail

**Indexes:**

| Index | Column | Purpose |
|---|---|---|
| PK | `id` | Direct review lookup |
| `idx_trail_reviews_trail` | `trail_id` | Fetch all reviews for a given trail (primary public read) |
| UNIQUE | `(user_id, trail_id)` | Prevents duplicate reviews + fast existence check |

**Note:** `@CreationTimestamp` populates during Hibernate flush (Hibernate 6 behavior). The service calls `saveAndFlush()` — not `save()` — to ensure `created_at` is populated before `toResponse()` is called.

---

### 3.6 `user_subscriptions`

Social follow graph — many-to-many self-referential on `users`.

| Column | Type | Notes |
|---|---|---|
| `follower_id` | UUID FK | References `users(id)` ON DELETE CASCADE |
| `followee_id` | UUID FK | References `users(id)` ON DELETE CASCADE |
| `subscribed_at` | TIMESTAMPTZ | `DEFAULT now()`, immutable |

**Primary key:** composite `(follower_id, followee_id)`

**Constraints:**
- `CHECK (follower_id <> followee_id)` — prevents self-follow

**Indexes:**

| Index | Column | Purpose |
|---|---|---|
| `idx_subscriptions_follower` | `follower_id` | "Who am I following?" — feed generation |
| `idx_subscriptions_followee` | `followee_id` | Follower count on public profile |

---

## 4. Flyway Migration History

| Version | File | Description |
|---|---|---|
| V1 | `V1__create_users_table.sql` | `users` + `user_roles` tables; email and google_id indexes |
| V2 | `V2__saved_trails.sql` | `user_saved_trails` table + user index |
| V3 | `V3__completed_trails_and_reviews.sql` | `user_completed_trails` + `trail_reviews` tables + indexes |
| V4 | `V4__add_bio_to_users.sql` | `ALTER TABLE users ADD COLUMN bio VARCHAR(500)` |
| V5 | `V5__user_subscriptions.sql` | `user_subscriptions` table + follower/followee indexes |

Flyway metadata tracked in the `flyway_schema_history` system table. Migrations run automatically on Spring Boot startup.

---

## 5. Repository Access Patterns

Each JPA repository maps to one table. Queries listed are the ones actually called in production code.

### `UserRepository` → `users`

| Method | SQL pattern | Called by |
|---|---|---|
| `findByEmail(email)` | `WHERE email = ?` (indexed) | JwtAuthFilter, AuthService, UserService (every auth'd request) |
| `findByGoogleId(id)` | `WHERE google_id = ?` (indexed) | CustomOAuth2UserService |
| `findByUsername(name)` | `WHERE username = ?` | UserService subscribe/unfollow, public profile |
| `existsByEmail(email)` | `EXISTS WHERE email = ?` | AuthService.register() |
| `existsByUsername(name)` | `EXISTS WHERE username = ?` | AuthService.register() |
| `findAll()` | `SELECT * FROM users` | UserService.getPublicUsers() — **no pagination yet** |
| `findById(uuid)` | `WHERE id = ?` | UserService.getFeedProfiles() — N+1 risk (see §7) |

### `TrailReviewRepository` → `trail_reviews`

| Method | SQL pattern | Called by |
|---|---|---|
| `findByTrailIdOrderByCreatedAtDesc` | `WHERE trail_id = ? ORDER BY created_at DESC` | ReviewService.getReviewsForTrail() |
| `findByUserIdOrderByCreatedAtDesc` | `WHERE user_id = ? ORDER BY created_at DESC` | UserService.buildActivityEvents() |
| `existsByUserIdAndTrailId` | `EXISTS WHERE user_id=? AND trail_id=?` | ReviewService (duplicate check) |
| `countByUserId` | `COUNT WHERE user_id = ?` | UserService profile stats |
| `saveAndFlush()` | `INSERT` + flush | ReviewService.submitReview() |

### `UserSavedTrailRepository` → `user_saved_trails`

| Method | SQL pattern | Called by |
|---|---|---|
| `findTrailIdsByUserId` (JPQL) | `SELECT trail_id WHERE user_id = ? ORDER BY saved_at DESC` | SavedTrailService, UserService |
| `findById_UserIdOrderBySavedAtDesc` | `WHERE user_id = ? ORDER BY saved_at DESC` | UserService.buildActivityEvents() |
| `countByUserId` (JPQL) | `COUNT WHERE user_id = ?` | UserService profile stats |
| `save(entity)` | `INSERT` | SavedTrailService.saveTrail() |
| `deleteById(compositeId)` | `DELETE WHERE user_id=? AND trail_id=?` | SavedTrailService.removeTrail() |

### `UserCompletedTrailRepository` → `user_completed_trails`

| Method | SQL pattern | Called by |
|---|---|---|
| `findTrailIdsByUserId` (JPQL) | `SELECT trail_id WHERE user_id = ? ORDER BY completed_at DESC` | CompletedTrailService, UserService |
| `findById_UserIdOrderByCompletedAtDesc` | `WHERE user_id = ? ORDER BY completed_at DESC` | UserService.buildActivityEvents() |
| `countByUserId` (JPQL) | `COUNT WHERE user_id = ?` | UserService profile stats |
| `save(entity)` | `INSERT` | CompletedTrailService.markComplete() |
| `deleteById(compositeId)` | `DELETE WHERE user_id=? AND trail_id=?` | CompletedTrailService.unmarkComplete() |

### `UserSubscriptionRepository` → `user_subscriptions`

| Method | SQL pattern | Called by |
|---|---|---|
| `findFolloweeIdsByFollowerId` (JPQL) | `SELECT followee_id WHERE follower_id = ?` | UserService.getFeedProfiles() |
| `countByIdFolloweeId` | `COUNT WHERE followee_id = ?` | UserService profile stats (follower count) |
| `existsById(compositeId)` | `EXISTS WHERE follower_id=? AND followee_id=?` | UserService.subscribe() |
| `save(entity)` | `INSERT` | UserService.subscribe() |
| `deleteById(compositeId)` | `DELETE WHERE follower_id=? AND followee_id=?` | UserService.unsubscribe() |

---

## 6. Cascade & Referential Integrity

All child tables cascade deletes from `users`:

```sql
user_roles            → ON DELETE CASCADE  (user_id → users.id)
user_saved_trails     → ON DELETE CASCADE  (user_id → users.id)
user_completed_trails → ON DELETE CASCADE  (user_id → users.id)
trail_reviews         → ON DELETE CASCADE  (user_id → users.id)
user_subscriptions    → ON DELETE CASCADE  (follower_id → users.id)
user_subscriptions    → ON DELETE CASCADE  (followee_id → users.id)
```

Deleting a user atomically removes all their roles, saves, completions, reviews, and subscription edges in both directions.

`trail_id` columns have **no FK** — they reference trail slugs that are currently only held in application memory / mock data. FK enforcement will be added in V6 when the `trails` table is created.

---

## 7. Known Issues & Risks

| Issue | Severity | Detail |
|---|---|---|
| N+1 on feed query | Medium | `getFeedProfiles()` calls `userRepository.findById()` in a loop per followed user. Fix: single `findAllById()` or a JOIN query. |
| No pagination on `findAll()` | Medium | `getPublicUsers()` fetches the entire `users` table. Fix: add `Pageable` parameter and `Page<User>` return. |
| `trail_id` has no FK | Low | Referential integrity for trail slugs is not enforced at DB level. Stale slugs can accumulate if a trail is renamed. |
| No soft delete | Low | User deletion is hard — cascade wipes all activity permanently. Consider `deleted_at` column for audit trail. |
| No rate limiting on review insert | Low | UNIQUE(user_id, trail_id) prevents duplicates but not rapid concurrent inserts. |

---

## 8. Planned Schema Extensions

| Migration | Table | Description |
|---|---|---|
| V6 | `trails` | Trail master data: slug (PK), name, region_id, difficulty, distance, elevation, description, coordinates |
| V6 | FK constraint | `user_saved_trails.trail_id → trails.slug` |
| V6 | FK constraint | `user_completed_trails.trail_id → trails.slug` |
| V6 | FK constraint | `trail_reviews.trail_id → trails.slug` |
| V7 | `regions` | Region lookup table: id, name, country, bounding box |
| V7 | FK constraint | `trails.region_id → regions.id` |
| V8 | `trail_media` | Trail photos: id, trail_id, uploaded_by, s3_key, caption, created_at |
| V9 | `trail_tags` | Many-to-many: trail_id + tag (e.g., dog-friendly, waterfall) |
| — | Redis | Cache layer for `trails:featured`, `trails:{slug}`, `users:{username}:public` |

---

## 9. Infrastructure Notes

| Setting | Value |
|---|---|
| Engine | PostgreSQL 16 |
| Host (dev) | localhost:5433 (Docker) |
| Host (native) | localhost:5432 — **conflict: do not use for HikeBuddy** |
| Docker image | `postgres:16` |
| DB name | `hikebuddy` |
| Migration tool | Flyway — auto-runs on Spring Boot startup |
| pgAdmin | localhost:5050 (Docker) |
| UUID generation | `gen_random_uuid()` — PostgreSQL built-in (pgcrypto not required in PG13+) |
| Timezone | All timestamps stored as `TIMESTAMPTZ` in UTC |
