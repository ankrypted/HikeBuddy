# HikeBuddy Platform

## Objective
Build a production-grade, scalable hiking discovery platform.

## Architecture
- Modular monolith (Spring Boot)
- PostgreSQL
- Redis caching
- Angular frontend
- S3-compatible storage
- Leaflet (OpenStreetMap)

## Design Principles
- Clean architecture
- DTO pattern
- Service layer abstraction
- No direct entity exposure
- Indexed filtering
- Pagination mandatory
- Cache high-read endpoints
- Media stored outside DB

## Core Domains
- Trail
- User
- Review
- Favorites
- Media
- Region

## Non-Functional
- Performance optimized queries
- Secure JWT auth
- Role-based access
- Scalable folder structure
- Dockerized
- CI/CD enabled

---

## Frontend (Angular 19)

Root: `HikeBuddy/frontend/`
Detailed docs: `HikeBuddy/docs/`

### Stack
- Angular 19, standalone components, `ChangeDetectionStrategy.OnPush` everywhere
- Angular Material M3 dark theme — custom green palette (`#7ecb3f`) on deep navy (`#0d1b2a`)
- SCSS with custom partials (`_variables`, `_animations`, `_glassmorphism`, `_theme`)
- Signal-based services; functional HTTP interceptors

### Key Rules
- All components: `standalone: true`, `OnPush`
- DTOs only in the component layer — no entity classes cross the boundary
- All routes lazy-loaded via `loadComponent` / `loadChildren`
- SVG animation classes **must** live in global `_animations.scss` — Angular view encapsulation hashes class names inside component SCSS and breaks SVG selectors
- SCSS partials resolved via `stylePreprocessorOptions.includePaths: ["src"]` in `angular.json`

### Build
```bash
cd HikeBuddy/frontend
ng serve                              # dev server → localhost:4200
ng build --configuration production  # production build
```

### Current State
- Landing page fully implemented with animated SVG scene, hiker logo, trail cards, search overlay
- Route stubs: /trails, /auth/login, /auth/register, /gallery, /contact, /favorites
- TrailService uses mock data; one-line swap for HTTP when backend is ready
- AuthService is signal-based; interceptors wired but backend not connected yet