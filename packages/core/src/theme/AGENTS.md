# packages/core/src/theme — Tailwind Theme + CSS Tokens

The Tailwind theme configuration and all CSS custom property (`--rtk-*`) definitions. Consumed by `tailwind.config.js` at build time and by `provideRtkDesignSystem` at runtime.

## FILE MAP

| File                 | Role                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `colors.js`          | Tailwind color palette — every color backed by a CSS var with hardcoded RGB fallback                             |
| `space.js`           | Tailwind spacing scale driven by `--rtk-space-*` CSS custom props                                                |
| `index.js`           | Assembles and exports the full Tailwind `theme` object (colors + spacing + typography + screens)                 |
| `spacing-scale.json` | Numeric multipliers `[0, 0.5, 1, 1.5, 2, 3, ��, 96]` — used to generate `--rtk-space-*` vars                     |
| `breakpoints.json`   | Px thresholds: `{ sm: 640, md: 768, lg: 1080, xl: 2160 }` — consumed by `tailwind.config.js` and `utils/size.ts` |
| `presets/themes.ts`  | Three built-in color themes (`darkest`, `dark`, `light`) as `UIColors` maps                                      |
| `presets/border.ts`  | Lookup tables: `BorderWidth` token → px values; `BorderRadius` token → px values                                 |
| `tests/`             | Unit tests for theme helpers                                                                                     |

## CSS CUSTOM PROPERTY GROUPS (`--rtk-*`)

| Group             | Pattern                                          | Example                            |
| ----------------- | ------------------------------------------------ | ---------------------------------- |
| Brand colors      | `--rtk-colors-brand-{300–700}`                   | `--rtk-colors-brand-500`           |
| Background colors | `--rtk-colors-background-{600–1000}`             | `--rtk-colors-background-900`      |
| Text colors       | `--rtk-colors-text-{600–1000}`                   | `--rtk-colors-text-1000`           |
| Semantic colors   | `--rtk-colors-{danger,success,warning,video-bg}` | `--rtk-colors-danger`              |
| Spacing           | `--rtk-space-{multiplier}`                       | `--rtk-space-4` (= 16px at base 4) |
| Border widths     | `--rtk-border-width-{none,sm,md,lg}`             | `--rtk-border-width-sm` = 1px      |
| Border radii      | `--rtk-border-radius-{none,sm,md,lg,xl}`         | `--rtk-border-radius-md` = 8px     |
| Font family       | `--rtk-font-family`                              | Used by `font-sans`                |

**Two-layer overridability:** Every color compiles as `rgb(var(--rtk-colors-X, R G B))`. The CSS variable is tried first (runtime overridable via `provideRtkDesignSystem` or direct CSS); the hardcoded RGB fallback applies when the variable is unset. This means opacity modifiers (e.g., `bg-brand-500/75`) work correctly via Tailwind's `opacityValue` callback.

## BUILT-IN THEMES (`presets/themes.ts`)

| Theme               | bg-1000   | bg-900    | bg-800    | text      |
| ------------------- | --------- | --------- | --------- | --------- |
| `darkest` (default) | `#080808` | `#1A1A1A` | `#1E1E1E` | `#FFFFFF` |
| `dark`              | `#252525` | `#2F2F2F` | `#323232` | `#F5F5F5` |
| `light`             | `#FFFFFF` | `#F5F5F5` | `#EBEBEB` | `#111111` |

## BORDER TOKENS (`presets/border.ts`)

| `BorderWidth` | none | sm  | md  | lg  |
| ------------- | ---- | --- | --- | --- |
| `none`        | 0    | 0   | 0   | 0   |
| `thin`        | 0    | 1px | 2px | 4px |
| `fat`         | 0    | 2px | 4px | 8px |

| `BorderRadius`  | none | sm   | md   | lg   |
| --------------- | ---- | ---- | ---- | ---- |
| `sharp`         | 0    | 0    | 0    | 0    |
| `rounded`       | 0    | 4px  | 8px  | 12px |
| `extra-rounded` | 0    | 8px  | 16px | 24px |
| `circular`      | 9999 | 9999 | 9999 | 9999 |

## TAILWIND CONFIG HIGHLIGHTS

```
tailwind.config.js
├── theme (from src/theme/index.js)
│   ├── colors       ← CSS-var-backed palette
│   ├── spacing      ← --rtk-space-* driven scale
│   ├── fontFamily   ← { sans: ['var(--rtk-font-family, sans-serif)'] }
│   ├── screens      ← { sm: 640, md: 768, lg: 1080, xl: 2160 }
│   └── fontSize     ← semantic tokens: heading-lg/md/sm, button-lg/md/sm, text-lg/md/sm/xs
│
├── plugins
│   └── custom: addVariant for size-sm/md/lg/xl
│       → size-sm: maps to :host([size='sm']) &
│       (NOT standard media query breakpoints)
│
└── corePlugins (disabled)
    ├── preflight: false      ← Shadow DOM owns its own baseline
    ├── All filter/backdrop-filter utilities
    ├── All transform utilities (rotate, scale, etc.)
    ├── container, space
```

## ANTI-PATTERNS

- **Never** use `sm:`, `md:`, `lg:` Tailwind breakpoint prefixes for component size variants — use `size-sm:`, `size-md:`, `size-lg:` instead (they target `:host([size='X'])`, not viewport width).
- **Never** hardcode color hex values in component CSS — always use `rgb(var(--rtk-colors-*))` classes so colors remain runtime-overridable.
- **Never** modify `breakpoints.json` without updating `utils/size.ts` logic — both consume the same thresholds.
