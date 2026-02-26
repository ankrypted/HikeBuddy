# HikeBuddy — Error Log & Fixes

> **Audience**: This document is written for both laypeople and engineers.
> Each error has a plain-English summary followed by the full technical explanation.
> Last updated: 2026-02-26

---

## Table of Contents

1. [SCSS Partial Paths — Components Can't Find Style Files](#1-scss-partial-paths--components-cant-find-style-files)
2. [Sass Mixed Declarations Warning](#2-sass-mixed-declarations-warning)
3. [SVG Animations Broken — Classes Not Applying](#3-svg-animations-broken--classes-not-applying)
4. [Fire Animation Pivot Wrong — Flame Flickers from Top](#4-fire-animation-pivot-wrong--flame-flickers-from-top)
5. [SVG Campfire Not Visible on Screen](#5-svg-campfire-not-visible-on-screen)
6. [Fire Shapes Look Stiff and Unrealistic](#6-fire-shapes-look-stiff-and-unrealistic)
7. [NgSwitch Directives Not Working in Standalone Component](#7-ngswitch-directives-not-working-in-standalone-component)
8. [Write Tool Fails — "File Has Not Been Read Yet"](#8-write-tool-fails--file-has-not-been-read-yet)
9. [Angular Material `ng add` Schema Validation Error](#9-angular-material-ng-add-schema-validation-error)
10. [HTTP Interceptors Not Registered Correctly](#10-http-interceptors-not-registered-correctly)
11. [OnChanges Lifecycle Not Triggering](#11-onchanges-lifecycle-not-triggering)
12. [SVG Hiker Limb Animation Pivots from Wrong Point](#12-svg-hiker-limb-animation-pivots-from-wrong-point)
13. [Security: CORS Preflight Requests Blocked by Spring Security](#13-security-cors-preflight-requests-blocked-by-spring-security)

---

## 1. SCSS Partial Paths — Components Can't Find Style Files

### In plain English
Every component has its own stylesheet file. Those files need to import shared design tokens like colors and font sizes from a central variables file. But the components couldn't find that central file because they were using long, fragile relative paths like `../../../../styles/variables`. When you move a folder, all those paths break.

### What the error looked like
```
Error: Can't find stylesheet to import.
  @use '../../../../../styles/variables' as v;
```

### Root cause (for engineers)
Angular CLI resolves SCSS `@use` paths relative to the importing file's location by default. Deep component trees require multi-level `../` traversal, which is brittle and breaks on refactoring. `angular.json` has no `includePaths` configured by default.

### The fix

**File**: `angular.json` → `projects.frontend.architect.build.options`

```json
"stylePreprocessorOptions": {
  "includePaths": ["src"]
}
```

**Then in any component SCSS**, regardless of nesting depth:
```scss
@use 'styles/variables' as v;
@use 'styles/glassmorphism' as g;
```

This tells the Sass compiler to treat `src/` as a root search path, turning all style imports into flat, location-independent references.

---

## 2. Sass Mixed Declarations Warning

### In plain English
In the global theme file, we set up the Angular Material color scheme and then tried to define some of our own custom color variables in the same block right after. Sass 1.x flagged this as a problem because mixing Angular Material's setup call with custom declarations in the same code block is being deprecated — the compiler printed a big warning about it.

### What the error looked like
```
Deprecation Warning: Sass's behavior for declarations that appear after nested rules
will be changing to match the behavior specified by CSS in an upcoming version.
  ╷
  │   --some-custom-property: value;
  ╵
```

### Root cause (for engineers)
Sass deprecates "mixed declarations" — having plain CSS property declarations after `@include` calls in the same rule block. The Angular Material `@include mat.all-component-themes($theme)` mixin counts as a nested rule, making any subsequent bare `--property: value` declarations mixed.

### The fix

**File**: `src/styles/_theme.scss`

Wrap post-include declarations in `& {}` to form a separate nested rule:

```scss
// Before (broken)
:root {
  @include mat.all-component-themes($theme);
  --my-custom-var: #ff0000;  // ← mixed declaration warning
}

// After (fixed)
:root {
  @include mat.all-component-themes($theme);
  & {
    --my-custom-var: #ff0000;  // ← now a proper nested rule
  }
}
```

---

## 3. SVG Animations Broken — Classes Not Applying

### In plain English
Our animated SVG elements (the walking hiker, the campfire, the stars) have CSS classes like `.fire` or `.hiker-arm-l`. We originally wrote those animation rules inside the component's own CSS file. But Angular has a security feature that secretly renames CSS classes inside components to prevent one component's styles from accidentally affecting another. This "renaming" broke our SVG classes because the SVG elements were using the original names, not the renamed ones.

### What the error looked like
The animations simply did nothing. The hiker stood still, the fire didn't flicker. No error in the console — it silently failed.

### Root cause (for engineers)
Angular's **View Encapsulation** (`ViewEncapsulation.Emulated`, the default) rewrites component CSS selectors by appending a unique attribute selector, e.g. `.fire[_ngcontent-abc-c42]`. SVG elements that aren't directly produced by the component's template (or are inside nested components) do not receive the `_ngcontent-*` attribute, so the rewritten selector never matches.

### The fix

Move all `@keyframes` definitions and animation utility classes to the **global stylesheet**:

```
src/styles/_animations.scss   ← ALL animation code goes here
src/styles/styles.scss        ← @use 'styles/animations';  (already included)
```

Global styles are not encapsulated — they apply everywhere without renaming. Never put keyframes or SVG utility classes in component `.scss` files.

**Affected classes moved to global**: `.fire`, `.fire-glow`, `.tent-glow`, `.hiker-body`, `.hiker-arm-l`, `.hiker-arm-r`, `.hiker-leg-l`, `.hiker-leg-r`, `.hiker-staff`, `.stars-a`, `.stars-b`, `.stars-c`, `.dot-pulse`

---

## 4. Fire Animation Pivot Wrong — Flame Flickers from Top

### In plain English
Imagine a candle flame: it should flicker and sway from its base, staying rooted at the bottom while the top dances. Our flame was instead pivoting from the corner of the entire canvas — like the whole SVG page was the anchor point. So the flame would swing wildly off-screen rather than flicker in place.

### What the error looked like
The campfire flame appeared to swing from the top-left of the screen or disappear entirely during the animation cycle.

### Root cause (for engineers)
CSS `transform-origin` on SVG elements defaults to `50% 50%` of the **SVG viewport**, not the element's own bounding box. So `transform-origin: center bottom` placed the pivot at the center-bottom of the 1440×900 SVG canvas, not the flame group.

### The fix

**File**: `src/styles/_animations.scss`

Add `transform-box: fill-box` to every SVG element that uses transform-based animation. This changes the reference box for `transform-origin` from the SVG canvas to the element's own bounding box:

```scss
.fire {
  transform-box:    fill-box;
  transform-origin: center bottom;   // now: center-bottom of THIS flame, not the SVG
  animation: flicker 1.6s ease-in-out infinite;
}

.fire-glow {
  transform-box:    fill-box;
  transform-origin: center bottom;
  animation: flicker 1.4s ease-in-out infinite reverse;
}
```

The same `transform-box: fill-box` technique is used on all hiker limbs — see error #12.

---

## 5. SVG Campfire Not Visible on Screen

### In plain English
We placed the campfire near the very bottom of our scene. The scene uses a setting where wide monitors crop the top and bottom slightly to fill the screen edge-to-edge. On most normal monitors, the campfire was sitting just below the visible window — you'd never know it was there.

### What the error looked like
The campfire simply wasn't visible in the browser, even though it existed in the code. The screen showed mountains and sky but no fire at the bottom.

### Root cause (for engineers)
The SVG viewBox is `1440 × 900`. The scene uses `preserveAspectRatio="xMidYMid slice"`, which scales the SVG to **cover** the container (like CSS `background-size: cover`). On widescreen monitors (16:9 or wider), this crops approximately 60–90px from the top and bottom. The campfire `<g>` had its base at `y ≈ 862`, leaving only ~38px of visual space before the crop line.

### The fix

Shifted the entire campfire group (glow ellipse, stone ring, crossed logs, flame group, gear elements) upward in two passes:

| Pass | Amount moved up | New flame base Y |
|------|----------------|-----------------|
| First fix | 60 px | y ≈ 802 |
| Second fix | 120 px | y ≈ 682 |

Final campfire is centered at approximately `cx=450, cy=682`, well within the safe zone for all aspect ratios.

**Rule of thumb for this project**: Keep important elements above `y = 800` in this viewBox to ensure visibility on 16:9+ monitors with `slice` scaling.

---

## 6. Fire Shapes Look Stiff and Unrealistic

### In plain English
The campfire flames looked like sharp triangles or rough polygons — more like a warning sign than real fire. Real flames have organic, curved, tapered shapes. The problem was the type of curve math we were using to draw them.

### What the error looked like
The flame shapes had visible straight segments or awkward kinks, especially at the tips. It looked more like a clip-art flame than a natural one.

### Root cause (for engineers)
The original flame SVG paths used **quadratic Bézier curves** (`Q` command), which have only one control point. Quadratic curves cannot produce the asymmetric, full-bodied taper of a real flame — they tend to produce symmetrical arcs with flat, wide bases. Additionally, all three flame layers were identical in shape, providing no visual depth.

### The fix

Redesigned all flame paths using **cubic Bézier curves** (`C` command), which have two independent control points per segment, allowing asymmetric lean and organic taper. Implemented a 4-layer depth model:

| Layer | Fill colour | Opacity | Purpose |
|-------|-------------|---------|---------|
| Outer | `#ff4500` (deep orange-red) | 0.88 | Wide base, full body |
| Mid | `#ff9900` (bright orange) | 0.90 | Narrower, slightly taller |
| Inner | `#ffe44a` (yellow) | 0.85 | Tighter core |
| Core | `#fff8d0` (near-white) | 0.70 | Hottest center spike |

Example cubic path for the outer layer:
```svg
<path d="M425,682 C419,656 423,632 436,619
                  C442,611 458,611 464,619
                  C477,632 481,656 475,682 Z"
      fill="#ff4500" opacity="0.88"/>
```

Each layer is progressively narrower and taller, creating the illusion of a flame's thermal gradient from cool base to hot tip.

---

## 7. NgSwitch Directives Not Working in Standalone Component

### In plain English
Angular has a feature called `NgSwitch` that lets you show different HTML blocks based on a variable value — similar to a switch/case in code. In newer Angular (v17+), components are self-contained and need to explicitly list every feature they use. We forgot to include `NgSwitch` in that list, so it silently did nothing.

### What the error looked like
The `*ngSwitchCase` blocks would either all show at once, or none would show. No console error — it just didn't work.

### Root cause (for engineers)
Angular 17+ standalone components require all directives to be explicitly declared in the component's `imports` array. `NgSwitch`, `NgSwitchCase`, and `NgSwitchDefault` are not auto-imported — they must be listed or the directives are unresolved at template compilation, leading to silent no-ops rather than a hard error.

### The fix

**In any standalone component using `*ngSwitch`**:

```typescript
import { NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';

@Component({
  standalone: true,
  imports: [
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    // ...other imports
  ],
  // ...
})
```

---

## 8. Write Tool Fails — "File Has Not Been Read Yet"

### In plain English
This is a constraint specific to our AI assistant tooling. Before overwriting a file, the tool requires that the file was read in the current session. If we skip the read step — even for a file we created earlier — the write fails. This prevents accidentally overwriting something you haven't inspected.

### What the error looked like
```
Error: File has not been read yet. Read it first before writing.
```

### Root cause
The Write tool maintains a per-session record of files that have been read. If a file is written to without a prior read (whether because the session is new, or context was lost), the tool rejects the operation as a safety measure.

### The fix

Always read the file immediately before writing it, even if you believe you know its contents:

```
Step 1: Read  → src/app/shared/components/scene-background/scene-background.component.html
Step 2: Write → (full new content)
```

This also acts as a good discipline checkpoint — reviewing the current state of a file before overwriting it catches cases where another person (or the user themselves) has made manual edits since the last session.

---

## 9. Angular Material `ng add` Schema Validation Error

### In plain English
When adding Angular Material to the project with a setup command, we passed an option in a slightly wrong format. The setup tool is strict about how options are written and rejected it.

### What the error looked like
```
Schema validation failed with the following errors:
  Data path "/typography" must be boolean.
```

### Root cause (for engineers)
The Angular CLI `ng add @angular/material` schematic defines `--typography` as a `boolean` flag. Passing `--typography="true"` provides a string `"true"`, not the boolean `true`, which fails JSON Schema validation.

### The fix

Use the bare flag form for boolean options:

```bash
# Wrong
ng add @angular/material --typography="true"

# Correct
ng add @angular/material --typography
```

---

## 10. HTTP Interceptors Not Registered Correctly

### In plain English
We wrote code that automatically attaches the user's login token to every request sent to the server (so the server knows who is making the request). But if we register that code incorrectly, it never runs — every request goes out without the token and the server rejects it with a "not logged in" error.

### What the error looked like
API calls returned `401 Unauthorized` despite a valid token being present in local storage.

### Root cause (for engineers)
Angular 17+ uses **functional interceptors** (`HttpInterceptorFn`) registered via `withInterceptors([...])` inside `provideHttpClient()`. Using the legacy class-based `HTTP_INTERCEPTORS` token doesn't work in the new provider model. Additionally, interceptors must be inside the same `provideHttpClient(...)` call passed to `bootstrapApplication`, not added elsewhere.

### The fix

**File**: `src/app/app.config.ts`

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor }  from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    // ...other providers
  ]
};
```

**Functional interceptor signature** (`auth.interceptor.ts`):
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.accessToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

---

## 11. OnChanges Lifecycle Not Triggering

### In plain English
Angular components can react when their inputs change — like updating a chart when new data arrives. We wrote the reaction code (`ngOnChanges`) but forgot to formally declare that the component participates in this lifecycle. Without the declaration, Angular doesn't call the method.

### What the error looked like
Input changes were ignored — the component displayed stale data and didn't update when the parent passed new values.

### Root cause (for engineers)
If a class defines `ngOnChanges()` without implementing the `OnChanges` interface, TypeScript compiles successfully (the method exists), but Angular's change detection pipeline only calls `ngOnChanges` on components that explicitly declare the interface. This is a silent runtime failure, not a compile error.

### The fix

Always declare the lifecycle interface alongside the method:

```typescript
// Wrong — method exists but interface not declared
export class TrailCardComponent {
  ngOnChanges(): void { ... }
}

// Correct
import { Component, OnChanges, SimpleChanges } from '@angular/core';

export class TrailCardComponent implements OnChanges {
  ngOnChanges(changes: SimpleChanges): void { ... }
}
```

---

## 12. SVG Hiker Limb Animation Pivots from Wrong Point

### In plain English
The walking hiker character has arms and legs that should swing from their attachment points — arms from the shoulder, legs from the hip. Instead, all limbs were rotating from an invisible point in the middle of the whole scene, making the hiker look like it was spinning in place rather than walking.

### What the error looked like
Arms and legs flew around wildly instead of swinging naturally. The hiker appeared to explode rather than walk.

### Root cause (for engineers)
Same root cause as error #4 — `transform-origin` without `transform-box: fill-box` uses the SVG canvas as the reference frame. With a 1440×900 canvas, a pivot like `transform-origin: left top` placed the anchor at (0,0) of the entire image, far from the limb's shoulder joint.

### The fix

All limb groups in `hiker-logo.component.html` use SVG `<g>` elements. Each animation class in `_animations.scss` declares:

```scss
.hiker-arm-l {
  transform-box:    fill-box;
  transform-origin: right top;   // pivot at right-top of arm's own bbox = shoulder
  animation: swing-a 0.65s ease-in-out alternate infinite;
}

.hiker-arm-r {
  transform-box:    fill-box;
  transform-origin: left top;    // pivot at left-top of arm's own bbox = shoulder
  animation: swing-b 0.65s ease-in-out alternate infinite;
}

.hiker-leg-l {
  transform-box:    fill-box;
  transform-origin: right top;   // hip joint
  animation: swing-b 0.65s ease-in-out alternate infinite;
}

.hiker-leg-r {
  transform-box:    fill-box;
  transform-origin: left top;
  animation: swing-a 0.65s ease-in-out alternate infinite;
}
```

Natural gait is achieved by pairing arm-L with leg-R on `swing-a`, and arm-R with leg-L on `swing-b` (counter-phase).

---

## 13. Security: CORS Preflight Requests Blocked by Spring Security

### In plain English
When a web browser makes certain types of requests to a server on a different address (like our Angular app on `localhost:4200` talking to our Spring Boot server on `localhost:8080`), it first sends a quick "check" request called a preflight to ask "is it okay to send the real request?" Our security layer was blocking these check requests and demanding a login token for them — but browsers never send a token with preflight checks. This meant every protected API call failed before it even started.

### What the error looked like
```
Access to XMLHttpRequest at 'http://localhost:8080/api/v1/...' from origin
'http://localhost:4200' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present.
```

### Root cause (for engineers)
Spring Security processes requests through a filter chain before CORS headers are applied. `OPTIONS` preflight requests arrive without an `Authorization` header — the browser specification forbids it. Without an explicit `permitAll()` rule for `OPTIONS`, Spring Security returned a `401` or `403` before the CORS filter could set the required response headers, causing the browser to interpret it as a CORS failure.

### The fix

**File**: `SecurityConfig.java` — `authorizeHttpRequests` block

```java
.authorizeHttpRequests(auth -> auth
    // CORS preflight — MUST be first, before any auth checks
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

    // Public auth endpoints
    .requestMatchers("/api/v1/auth/**").permitAll()

    // OAuth2 callback and login endpoints
    .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()

    // Unauthenticated read access for trail/region browsing
    .requestMatchers(HttpMethod.GET, "/api/v1/trails/**", "/api/v1/regions/**").permitAll()

    // Everything else requires a valid JWT
    .anyRequest().authenticated()
)
```

The `OPTIONS` rule must appear **first** in the chain. Spring Security evaluates matchers in order and stops at the first match — if an authenticated rule appears before the OPTIONS rule, the preflight is blocked.

Additionally, a CORS configuration bean was registered:

```java
@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("http://localhost:4200"));
    config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

---

## Summary Table

| # | Error | Layer | Severity | Fix category |
|---|-------|-------|----------|-------------|
| 1 | SCSS partial paths broken | Build | Medium | `angular.json` config |
| 2 | Sass mixed-decls warning | Build | Low | Syntax wrapper `& {}` |
| 3 | SVG animation classes not applying | CSS/Angular | High | Move to global stylesheet |
| 4 | Fire flicker pivot wrong | CSS/SVG | Medium | `transform-box: fill-box` |
| 5 | Campfire invisible on screen | SVG layout | High | Reposition to y < 800 |
| 6 | Flame shapes stiff/angular | SVG | Medium | Redesign with cubic Béziers |
| 7 | NgSwitch silent failure | Angular | Medium | Explicit standalone imports |
| 8 | Write tool read-guard | Tooling | Low | Always read before write |
| 9 | `ng add` schema validation | CLI | Low | Boolean flag syntax |
| 10 | JWT not attached to requests | Auth/HTTP | High | Functional interceptor pattern |
| 11 | `ngOnChanges` not called | Angular | Medium | Implement `OnChanges` interface |
| 12 | Hiker limb pivot wrong | CSS/SVG | Medium | `transform-box: fill-box` |
| 13 | CORS preflight blocked | Security | High | `OPTIONS permitAll()` first |
