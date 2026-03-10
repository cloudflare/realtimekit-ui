# packages/core — Stencil Package

Main source package for `@cloudflare/realtimekit-ui`. All authored Web Component source lives here; React + Angular wrappers are generated from this package on every build.

## STRUCTURE

```
packages/core/
├── stencil.config.ts     # Output targets: dist, react, angular, dist-custom-elements, docs-json, docs-vscode, www
├── tailwind.config.js    # Tailwind v3.1 — preflight off, Shadow DOM size-* variants, CSS variable colors
├── rollup.config.mjs     # Lib bundle config
├── src/
│   ├── index.ts          # Re-exports: type * from components + * from exports
│   ├── exports.ts        # All runtime exports (stores, utils, builder, i18n, icons, types)
│   ├── components/       # 136 rtk-* Stencil Web Components
│   ├── lib/              # Shared modules (render, audio, grid, icons, lang, builder, addons)
│   ├── utils/            # ~29 utility files + sync-with-store/ (store + @SyncWithStore decorator)
│   ├── types/            # TypeScript types: UIConfig, States, DesignTokens, Peer
│   ├── theme/            # Tailwind theme: colors.js, space.js, breakpoints.json, presets/
│   └── styles/           # Global CSS: reset.css, scrollbar.css, html-select.css
├── dist/                 # Build output — never edit by hand
├── loader/               # Generated ESM loader — never edit by hand
└── docs/                 # Generated docs JSON — never edit by hand
```

## OUTPUT TARGETS (stencil.config.ts)

| Target                 | Output path                                                         | Notes                                                                          |
| ---------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `dist`                 | `dist/`                                                             | Standard ESM/CJS; loader → `../loader`                                         |
| `reactOutputTarget`    | `../react-library/src/components/stencil-generated/index.ts`        | Auto-generated; calls `defineCustomElements()` at import time (side-effectful) |
| `angularOutputTarget`  | `../angular-library/projects/components/src/lib/stencil-generated/` | Auto-generated Angular `@Component` proxies                                    |
| `dist-custom-elements` | `dist/components/`                                                  | Tree-shakeable; runtime bundled inline (`externalRuntime: false`)              |
| `docs-json`            | `dist/docs/docs-components.json`                                    | Component docs; source for TypeDoc cross-repo PR                               |
| `docs-vscode`          | `dist/docs/docs-vscode.json`                                        | VS Code HTML autocomplete data                                                 |
| `www`                  | `www/`                                                              | Dev server only                                                                |

**Vue output target is disabled** (commented out) — `packages/vue-library/lib/components.ts` is frozen.

## TAILWIND SETUP

- `preflight: false` — Shadow DOM manages its own baseline styles.
- All `filter`, `backdrop-filter`, `transform`, `container`, `space` utilities are disabled (bundle size).
- Custom `size-sm:`, `size-md:`, `size-lg:`, `size-xl:` variants map to `:host([size='X']) &` — not media queries.
- `content: ['']` — no purging; PostCSS handles per-component CSS.
- Colors use CSS variables: `rgb(var(--rtk-colors-brand-500, 33 96 253))` — all overridable at runtime.

## THEME SYSTEM

Three built-in themes: `darkest` (default), `dark`, `light` — defined in `src/theme/presets/themes.ts`.

`DesignTokens` controls: `spacingBase`, `fontFamily`, `googleFont`, `borderWidth` (`none|thin|fat`), `borderRadius` (`sharp|rounded|extra-rounded|circular`), `colors`, `logo`, `theme`, `tokenPrefix`.

All CSS variables use `--rtk-` prefix (configurable via `tokenPrefix`).

## BUILD SCRIPTS

```bash
npm run build    # Stencil build (generates React + Angular wrappers as side effect)
npm run dev      # stencil build --dev --watch + www server
npm test         # stencil test --spec --e2e
npm run lint     # eslint src/
npm run lint:fix # eslint --fix
```

`prepublishOnly` / `postpublish` scripts swap `package.json` fields for publish hygiene via `prepublish.js`.

## ANTI-PATTERNS

- **Never** edit `dist/`, `loader/`, `docs/` by hand — overwritten on every build.
- **Never** edit `src/components.d.ts` — Stencil-generated; changes to component APIs go in the `.tsx` source file.
- **Never** use Tailwind `sm:`, `md:` breakpoint prefixes for size variants — use `size-sm:`, `size-md:` instead.
- **Note:** `peerDepdendencies` (misspelled at `package.json:55`) is silently ignored by npm — the peer dep on `@cloudflare/realtimekit >=0` is not enforced.
