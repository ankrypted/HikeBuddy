# HikeBuddy

A production-grade hiking trail discovery platform. Find handpicked trails, read hiker reviews, and plan your next Himalayan adventure.

---

## Overview

HikeBuddy is a full-stack web application built with **Angular 19** on the frontend and planned **Spring Boot** on the backend. The current state delivers a fully functional Angular UI with mock data — backend integration is the next milestone.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19, TypeScript, SCSS, Angular Material M3 |
| State | Signals (`signal<T>()`), OnPush everywhere |
| Styling | SCSS partials, glassmorphism, CSS animations |
| Backend *(planned)* | Spring Boot, PostgreSQL, Redis, JWT Auth |
| Storage *(planned)* | S3-compatible (MinIO / AWS S3) |
| Maps *(planned)* | Leaflet + OpenStreetMap |

---

## Project Structure

```
HikeBuddy/
├── frontend/                   # Angular 19 app
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Services, guards, interceptors, layout
│   │   │   ├── features/       # Page-level feature modules
│   │   │   │   ├── landing/    # Homepage with animated scene
│   │   │   │   ├── trails/     # Trail list + trail detail pages
│   │   │   │   ├── auth/       # Login / Register (stub)
│   │   │   │   ├── gallery/    # Gallery (stub)
│   │   │   │   └── contact/    # Contact (stub)
│   │   │   └── shared/         # Components, models, utilities
│   │   ├── environments/       # Dev / prod environment config
│   │   └── styles/             # Global SCSS partials
│   └── angular.json
├── docs/                       # Design system & architecture docs
├── prototype/                  # Original HTML/CSS/JS prototype
└── CLAUDE.md                   # Architecture & coding conventions
```

---

## Features

### Live
- **Animated landing page** — custom SVG mountain/lake scene with twinkling stars, campfire, and animated hiker logo
- **Trail listing** (`/trails`) — full-width list of trails with difficulty colour bands, stats chips, ratings, and hover animations
- **Trail detail pages** (`/trails/:slug`) — hero section with difficulty, distance, elevation, duration; description; tag pills; hiker reviews grid
- **Navbar** — responsive with search overlay, hamburger menu on mobile, auth buttons
- **Search overlay** — keyboard-accessible (Esc to close)

### Implemented (mock data, pending backend)
- `TrailService` — `getFeaturedTrails()`, `getTrailBySlug()`, `getTrailReviews()`; one-line swap to real HTTP
- `AuthService` — signal-based; interceptors wired
- Role guard, auth guard — wired, awaiting JWT backend

### Trails available
| Trail | Region | Difficulty | Distance |
|---|---|---|---|
| Roopkund Trek | Uttarakhand, India | Hard | 53 km |
| Valley of Flowers | Uttarakhand, India | Moderate | 38 km |
| Hampta Pass | Himachal Pradesh, India | Moderate | 35 km |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Angular CLI 19+

```bash
npm install -g @angular/cli
```

### Run locally

```bash
cd frontend
npm install
ng serve
```

App runs at `http://localhost:4200`.

### Production build

```bash
cd frontend
ng build --configuration production
```

---

## Design System

| Token | Value |
|---|---|
| Accent green | `#7ecb3f` |
| Background navy | `#0d1b2a` |
| Glass background | `rgba(10, 20, 35, 0.45)` |
| Glass border | `rgba(255, 255, 255, 0.10)` |
| Text muted | `rgba(255, 255, 255, 0.50)` |

Full design system documented in [`docs/design-system.md`](docs/design-system.md).

---

## Architecture Principles

- All components: `standalone: true`, `ChangeDetectionStrategy.OnPush`
- DTOs only in the component layer — no entity classes cross the API boundary
- All routes lazy-loaded via `loadComponent` / `loadChildren`
- SVG animation classes live in global `_animations.scss` (Angular view encapsulation would otherwise break SVG selectors)
- SCSS partials resolved via `stylePreprocessorOptions.includePaths: ["src"]`

---

## Roadmap

- [ ] Spring Boot REST API (trails, users, reviews, favorites)
- [ ] JWT authentication + role-based access
- [ ] PostgreSQL with indexed filtering and pagination
- [ ] Interactive trail maps (Leaflet + GeoJSON routes)
- [ ] Trail photo gallery
- [ ] User favorites
- [ ] Trail search with filters (difficulty, region, distance, rating)
- [ ] More Details page per trail
- [ ] CI/CD pipeline
- [ ] Docker Compose setup

---

## License

MIT
