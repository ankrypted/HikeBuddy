# Design System

## Colour Palette
| Token (`$var`) | Value | Usage |
|---|---|---|
| `$color-primary` | `#7ecb3f` | Brand green — buttons, accents, staff glow |
| `$color-primary-light` | `#b0f050` | Hover states, dot-pulse highlight |
| `$color-bg` | `#0d1b2a` | Page background, deep navy |
| `$color-surface` | `#112233` | Card surfaces |
| `$color-text` | `#e8f4e8` | Body text |
| `$color-text-muted` | `#8aaa8a` | Secondary text |
| `$color-accent-orange` | `#ff6600` | Campfire, ember |

## Glass-morphism (`.glass`)
```scss
background:              rgba(255, 255, 255, 0.06);
border:                  1px solid rgba(255, 255, 255, 0.12);
backdrop-filter:         blur(14px);
-webkit-backdrop-filter: blur(14px);
```
Defined in `src/styles/_glassmorphism.scss`.

## Typography
Angular Material M3 typography enabled. Base font from Material.
Brand mark: "HikeBuddy" + `<span class="dot dot-pulse">.</span>` (animated)

## Angular Material Theme
- Theme type: dark (M3)
- Primary palette: built-in `$green` centred on `#7ecb3f`
- Neutral palette: `#0d1b2a`
- Defined in `src/styles/_theme.scss`

## Animations (`src/styles/_animations.scss`)
All keyframes and utility classes are global — must NOT be in component SCSS.

### Keyframes
| Name | Effect |
|---|---|
| `flicker` | Fire flicker — scale + translate + opacity |
| `staff-glow` | Green drop-shadow pulse on hiking staff |
| `hiker-bob` | Whole body vertical bob ±1.8 px |
| `swing-a` | Limb swing −24° ↔ +24° |
| `swing-b` | Limb swing +24° ↔ −24° (counter-phase) |
| `dot-pulse` | Brand dot colour + glow pulse |
| `twinkle` | Star opacity 0.25 ↔ 1 |
| `tent-glow` | Tent door glow opacity 0.10 ↔ 0.22 |

### Hiker Animation Classes
| Class | Keyframe | pivot (`transform-origin`) |
|---|---|---|
| `.hiker-body` | `hiker-bob` 0.65 s | — |
| `.hiker-arm-l` | `swing-a` 0.65 s alternate | `right top` (shoulder) |
| `.hiker-leg-r` | `swing-a` 0.65 s alternate | `left top` (hip) |
| `.hiker-arm-r` | `swing-b` 0.65 s alternate | `left top` (shoulder) |
| `.hiker-leg-l` | `swing-b` 0.65 s alternate | `right top` (hip) |
| `.hiker-staff` | `staff-glow` 2 s | — (inside `.hiker-arm-r` group) |
| `.dot-pulse` | `dot-pulse` 2.4 s | — |

Hover speed-up: `.hb-logo:hover .hiker-*` → `animation-duration: 0.32s`

### Star Classes
| Class | Duration | Delay |
|---|---|---|
| `.stars-a` | 3.2 s | 0 s |
| `.stars-b` | 2.5 s | 1.1 s |
| `.stars-c` | 4.0 s | 0.6 s |

### Fire & Tent Classes
| Class | Keyframe | Duration |
|---|---|---|
| `.fire` | `flicker` | 1.6 s |
| `.fire-glow` | `flicker` reverse | 1.4 s |
| `.tent-glow` | `tent-glow` | 3.0 s |

## Hiker Logo SVG (`hiker-logo.component.html`)
ViewBox: `36 × 46`
- Walking gait: arm-L + leg-R → `swing-a`; arm-R + leg-L → `swing-b`
- Hiking staff is **inside** `.hiker-arm-r` group — starts at hand (22,22), ends at (29,44)
- Pivot trick: `transform-box: fill-box` + `transform-origin: left/right top`
- Hat: lime green `#b8e86a`; backpack: `#7ecb3f`; torso/limbs: white; staff: `#7ecb3f`
