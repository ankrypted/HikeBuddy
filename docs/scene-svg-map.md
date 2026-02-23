# Scene Background SVG Map

File: `frontend/src/app/shared/components/scene-background/scene-background.component.html`
ViewBox: `1440 × 900`, `preserveAspectRatio="xMidYMid slice"`

## Coordinate Reference
- X axis: 0 (left) → 1440 (right)
- Y axis: 0 (top) → 900 (bottom)
- Water/lake starts at y=560

## Gradients (defined in `<defs>`)
| ID | Type | Description |
|---|---|---|
| `skyGrad` | linear (top→bottom) | `#050d17` → `#0f2235` → `#1e4a58` → `#1a3838` |
| `mountainL` | linear | Orange `#b84a18` → brown `#3a1a08` |
| `mountainR` | linear | Grey `#4a5a6a` → dark `#1a2a3a` |
| `waterGrad` | linear | Teal `#1e4a50` → dark `#0d2530` |
| `moonGlow` | radial | Warm white fade |
| `tentGlow` | radial | Orange `#ff9a40` fade (used inside tent door) |

## Sky & Atmosphere
| Element | Position | Notes |
|---|---|---|
| Sky rect | full canvas | `fill="url(#skyGrad)"` |
| Moon | `cx=1265, cy=108` | Upper-right — away from hero text. r=42 solid + r=100 glow |
| Stars-a | ~16 circles | `class="stars-a"` — twinkle 3.2 s |
| Stars-b | ~16 circles | `class="stars-b"` — twinkle 2.5 s, +1.1 s delay |
| Stars-c | ~14 circles | `class="stars-c"` — twinkle 4.0 s, +0.6 s delay |
| Birds | x=580–676, y=118–140 | 3 M-path arcs, stroke `#c8b88a` |
| Clouds | cx=800–1100, cy=150–200 | Dark teal ellipses, opacity 0.35 |

## Terrain
| Element | Key Points | Fill |
|---|---|---|
| Left mountain (orange) | peak `250,180`; base `0,600`–`500,600` | `url(#mountainL)` |
| Left mountain shadow | peak `380,280`; base `200,600`–`560,600` | `#8a3510` 0.7 |
| Right mountain (grey) | peak `820,200`; base `550,600`–`1100,600` | `url(#mountainR)` |
| Right mountain shadow | peak `1050,300`; base `850,600`–`1260,600` | `#2a3a4a` 0.8 |
| Pine trees cluster | x=930–1130, y=300–570 | `#1a2a1a` |
| Right edge tree (trunk) | x=1380, y=100, w=22 | `#8a3a10` |
| Right edge tree (canopy) | 3 triangles, peak x=1391 | `#1a3a1a` |

## Water & Foreground
| Element | Position | Notes |
|---|---|---|
| Lake rect | y=560, h=340 | `fill="url(#waterGrad)"` |
| Shimmer lines | y=600/630/660/690 | Horizontal, stroke `#3a8a90` 0.15 |
| Boat | `cx=380, cy=645` | Dark ellipse + rect |
| Rock 1 | `cx=150, cy=800`, `rx=90 ry=35` | |
| Rock 2 | `cx=320, cy=820`, `rx=70 ry=28` | |
| Rock 3 | `cx=500, cy=835`, `rx=55 ry=22` | |

## Campfire (center cx=295)
| Element | Position | Class/Notes |
|---|---|---|
| Ground glow | `cx=295, cy=802`, `rx=65 ry=18` | `class="fire-glow"` |
| Stone ring | 5 ellipses around cy=795–812 | `fill="#1e1e1e"` |
| Log 1 | `(268,804)→(322,788)` sw=6 | `stroke="#3d1f06"` |
| Log 2 | `(268,788)→(322,804)` sw=6 | Crosses log 1 |
| Ember tips | 4 short lines at log ends | `#ff6600` / `#ff8800` |
| Flames outer | base y=798, peak y=742 | `class="fire"`, `#ff7700` |
| Flames mid | base y=798, peak y=762 | `#ffcc00` |
| Flames inner | base y=798, peak y=772 | `#fff0a0` |
| Camping gear sticks | x=240–264, y=780–810 | Left of campfire |

## Tent (center cx=622)
| Element | Details |
|---|---|
| Body | `points="560,820 622,752 684,820"`, `fill="#2a4a18"` |
| Side shading | left half darker `#1a3010` |
| Ridge line | `(622,752)→(622,820)` |
| Door glow | `cx=622, cy=808`, `rx=18 ry=22`, `class="tent-glow"` |
| Guy ropes | 4 lines from peak+sides to pegs |
| Ground pegs | ellipses at (584,722), (660,722), (548,830), (696,830) |

## Animation Classes (all defined in `_animations.scss`)
| Class | Keyframe | Duration |
|---|---|---|
| `.fire` | `flicker` | 1.6 s |
| `.fire-glow` | `flicker` reverse | 1.4 s |
| `.stars-a` | `twinkle` | 3.2 s |
| `.stars-b` | `twinkle` | 2.5 s, 1.1 s delay |
| `.stars-c` | `twinkle` | 4.0 s, 0.6 s delay |
| `.tent-glow` | `tent-glow` | 3.0 s |
