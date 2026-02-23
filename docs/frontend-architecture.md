# Frontend Architecture

## Folder Structure
```
frontend/src/
  app/
    app.component.ts          # Shell — <router-outlet> only, no logic
    app.config.ts             # provideRouter + withViewTransitions + withComponentInputBinding
                              # provideHttpClient + withInterceptors([auth, error])
                              # provideAnimationsAsync()
    app.routes.ts             # All routes lazy-loaded; '**' → redirect ''

    core/
      guards/
        auth.guard.ts         # checks auth.isLoggedIn(), redirects /auth/login?returnUrl=
        role.guard.ts         # checks route.data['roles'] against auth.roles()
      interceptors/
        auth.interceptor.ts   # clones req with Authorization: Bearer <token>
        error.interceptor.ts  # global HTTP error handling stub
      layout/
        navbar/               # NavbarComponent — search open/close signal
        footer/               # (stub, not yet implemented)
      services/
        auth/auth.service.ts  # Signal-based auth state
        trail/trail.service.ts # Mock data now; HTTP-ready

    shared/
      components/
        scene-background/     # Fixed SVG background (aria-hidden)
        hiker-logo/           # Animated walking hiker SVG
        search-overlay/       # Modal search bar (AfterViewInit focus)
        trail-card/           # @Input trail: TrailSummaryDto, @Output viewTrail
        cta-card/             # Glass card with routerLink @Input
      models/                 # 7 DTO interfaces (see below)

    features/
      landing/                # LandingComponent — composes everything
      trails/                 # TRAILS_ROUTES: list + ':slug' detail (stubs)
      auth/                   # AUTH_ROUTES: login + register (stubs)
      gallery/                # Stub
      contact/                # Stub
      favorites/              # Stub (authGuard slot ready)

  styles/
    _variables.scss           # All SCSS $vars (colors, spacing, glass, blur)
    _animations.scss          # All @keyframes + SVG utility classes (MUST be global)
    _glassmorphism.scss       # .glass utility (backdrop-filter + rgba bg + border)
    _theme.scss               # Angular Material M3 dark theme
  styles.scss                 # Root — @use all partials + reset + body
  environments/
    environment.ts            # apiUrl: 'http://localhost:8080/api'
    environment.development.ts
```

## Component Tree (Landing Page)
```
AppComponent (<router-outlet>)
  └── LandingComponent (OnPush, signals)
        ├── SceneBackgroundComponent  (aria-hidden, fixed SVG)
        ├── NavbarComponent           (signal: searchOpen, menuOpen)
        │     ├── HikerLogoComponent  (pure, animated SVG hiker)
        │     └── SearchOverlayComponent (@Input isOpen, @Output closed)
        ├── [hero — inline HTML in LandingComponent template]
        ├── CtaCardComponent ×2       (@Input: title, subtitle, icon, link)
        └── TrailCardComponent ×3     (@Input trail, @Output viewTrail)
```

## DTO Files (`shared/models/`)
| File | Key types |
|---|---|
| `pagination.dto.ts` | `PageRequestDto`, `PageResponseDto<T>` |
| `trail.dto.ts` | `TrailSummaryDto`, `TrailDetailDto`, `TrailFilterDto`, `DifficultyLevel` |
| `user.dto.ts` | `UserSummaryDto`, `AuthResponseDto`, `LoginRequestDto`, `RegisterRequestDto`, `UserRole` |
| `review.dto.ts` | `ReviewSummaryDto`, `ReviewDetailDto`, `CreateReviewRequestDto` |
| `favorites.dto.ts` | `FavoriteSummaryDto`, `AddFavoriteRequestDto` |
| `media.dto.ts` | `MediaSummaryDto`, `MediaDetailDto`, `MediaType` |
| `region.dto.ts` | `RegionSummaryDto`, `RegionDetailDto` |

## AuthService (Signal Pattern)
```typescript
readonly accessToken = signal<string | null>(localStorage.getItem(TOKEN_KEY));
readonly currentUser = signal<UserSummaryDto | null>(null);
readonly roles       = signal<UserRole[]>([]);
readonly isLoggedIn  = computed(() => this.accessToken() !== null);
readonly isAdmin     = computed(() => this.roles().includes('ROLE_ADMIN'));
```

## TrailService (Mock → HTTP)
```typescript
getFeaturedTrails(): Observable<TrailSummaryDto[]> {
  // Swap this line when backend is ready:
  // return this.http.get<TrailSummaryDto[]>(`${this.base}/featured`);
  return of(MOCK_FEATURED_TRAILS);
}
```
Mock data: Wanaka (MODERATE), Bavaria (EASY), Manali (HARD)

## Routing
| Path | Target |
|---|---|
| `''` | `LandingComponent` |
| `'trails'` | `TRAILS_ROUTES` → list + `':slug'` detail |
| `'gallery'` | `GalleryComponent` stub |
| `'contact'` | `ContactComponent` stub |
| `'favorites'` | `FavoritesComponent` stub |
| `'auth'` | `AUTH_ROUTES` → login + register |
| `'**'` | redirect `''` |

## Angular Material Theme
- M3 dark theme, custom green primary palette centred on `#7ecb3f`
- Custom property overrides wrapped in `& {}` after `@include` (Sass mixed-decls fix)
- Background: `#0d1b2a`; toolbar: transparent; cards: `rgba(255,255,255,0.06)`

## Build Notes
- `stylePreprocessorOptions: { includePaths: ["src"] }` in `angular.json`
  → allows `@use 'styles/variables' as v;` from any component SCSS
- `ng build --configuration development` → clean build, no errors
- Lazy chunks: landing ~53 kB, all stubs ~2–3 kB
