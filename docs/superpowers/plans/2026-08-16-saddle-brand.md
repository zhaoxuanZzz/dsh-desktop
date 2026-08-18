# Saddle Brand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Stone Saddle brand: `DESIGN.md` + `brand/` materials, build-time overlay onto dsh, restore submodule sources after compile, splash follows system light/dark.

**Architecture:** Canonical tokens live in `DESIGN.md`. `brand/` holds SVG, `theme.css`, overlay files, and `overlay-map.json`. `scripts/apply-brand.ts` copies/patches into `vendor/deepseek-harness`, `make dsh` / `stage-dsh` build, then `git checkout`/`clean` restore sources. Gitignored `lib/`/`dist/` keep the branded output. No Electron injection, no submodule commits.

**Tech Stack:** TypeScript ESM, Vitest, tsx, `@google/design.md`, existing pnpm/Make/electron-builder.

**Spec:** [docs/superpowers/specs/2026-08-16-saddle-brand-design.md](../specs/2026-08-16-saddle-brand-design.md)

## Global Constraints

- Product name is Saddle; bundle id stays `app.saddle`.
- Do not commit changes under `vendor/deepseek-harness`.
- Do not `insertCSS` / `executeJavaScript` to reskin.
- Do not full-copy large dsh files; use exact `find`/`with` patches (exactly one match).
- No second accent color; remap `--dsw-static-deepseek-*` to ink/bone; keep red/green/amber.
- Dock icon `resources/icon.svg` stays the dark square; does not follow theme.
- Model IDs and `$DSH_HOME` unchanged.
- About line only in Settings → General: `Saddle 基于 DeepSeek Harness.` / `Saddle is based on DeepSeek Harness.`
- `pnpm test` must run `designmd lint DESIGN.md` (0 errors; warnings allowed).
- Git commits in Chinese, matching this repo (`功能：` / `测试：` / `构建：`).

## File map

| File | Responsibility |
|---|---|
| `DESIGN.md` | DESIGN.md-format tokens + prose |
| `brand/mark.svg` | Canonical saddle arcs, `currentColor` |
| `brand/wordmark.svg` | Mark + “Saddle” |
| `brand/theme.css` | `--dsw-static-neutral*`, `neutral-bluish*`, `deepseek*` remap |
| `brand/overlay-map.json` | replace / add / patch table |
| `brand/overlay/*` | Small full-file replacements |
| `scripts/apply-brand.ts` | load map, dirty check, apply, restore, `runWithBrandOverlay` |
| `scripts/stage-dsh.ts` | wrap dsh `build` in overlay |
| `Makefile` | `make dsh` uses `with-build` |
| `resources/splash.html` | `prefers-color-scheme`, no unofficial footer |
| `package.json` | `@google/design.md`, `design:lint` |
| `tests/brand.test.ts` | lint, overlay copy, map paths |
| `tests/apply-brand.test.ts` | temp-git apply/restore/errors |
| `tests/error-copy.test.ts` | splash assertions |
| `README.md` | rebuild dsh after brand edits; link brand spec |

---

### Task 1: DESIGN.md and lint

**Files:**
- Create: `DESIGN.md`
- Modify: `package.json` (devDependency `@google/design.md`, scripts `design:lint` and `test`)
- Test: `tests/brand.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: repo-root `DESIGN.md`; `pnpm design:lint` → `designmd lint DESIGN.md`

- [ ] **Step 1: Write the failing lint test**

Create `tests/brand.test.ts`:

```ts
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('DESIGN.md', () => {
  it('lints with zero errors', () => {
    const r = spawnSync('pnpm', ['exec', 'designmd', 'lint', 'DESIGN.md'], {
      encoding: 'utf8',
    })
    expect(r.status, r.stderr || r.stdout).toBe(0)
    const report = JSON.parse(r.stdout) as { summary: { errors: number } }
    expect(report.summary.errors).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/brand.test.ts`

Expected: FAIL (`designmd` missing and/or `DESIGN.md` missing).

- [ ] **Step 3: Add `@google/design.md` and DESIGN.md**

```sh
pnpm add -D @google/design.md
```

In `package.json` scripts:

```json
"design:lint": "designmd lint DESIGN.md",
"test": "pnpm run design:lint && vitest run"
```

`pnpm run design:lint` must succeed even if vitest JSON-parse differs; the vitest test still parses JSON from `pnpm exec designmd lint`.

Create `DESIGN.md`:

```md
---
version: alpha
name: Saddle
description: Stone Saddle visual identity for the Saddle desktop app.
omitted:
  - section: rounded
    reason: Inherit dsh radii
  - section: spacing
    reason: Inherit dsh spacing
  - section: layout
    reason: Unchanged dsh app frame
  - section: elevation
    reason: Unchanged dsh elevation
  - section: shapes
    reason: Unchanged dsh radii
  - section: components
    reason: Remap via CSS static tokens; no new component atoms
colors:
  primary: "#1c1917"
  secondary: "#78716c"
  neutral: "#f7f5f2"
  on-surface: "#1c1917"
  surface-dark: "#1c1917"
  surface-raised-dark: "#292524"
  on-surface-dark: "#e7e5e4"
  mute-dark: "#a8a29e"
  border-dark: "#44403c"
  surface-raised: "#ffffff"
  mute: "#78716c"
  border: "#e7e5e4"
typography:
  body-md:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
---

## Overview

Stone Saddle. Geometric two-arc mark, warm stone at night and limestone paper by day, no second accent. Feels like a tool, not a western costume. Light, dark, and system follow dsh `ui-theme.preference` (default `system`). Dock icon stays the dark stone square.

## Colors

- **Primary (#1c1917):** Ink. Headlines, body, primary buttons on light.
- **Neutral (#f7f5f2):** Limestone paper. Light page ground.
- **On-surface-dark (#e7e5e4):** Bone. Ink on dark stone.
- **Mute / mute-dark:** Captions and the secondary arc.
- Do not use DeepSeek blue for brand, primary buttons, or empty-state glow.

## Typography

System UI stack already in dsh `base.css`. No webfonts.

## Do's and Don'ts

- Do remap `--dsw-static-neutral*`, `--dsw-static-neutral-bluish*`, and `--dsw-static-deepseek*` only.
- Don't introduce a CTA accent or a whale mark.
- Don't follow theme on the Dock icon.
- Do keep red / green / amber for error / success / warning.
```

- [ ] **Step 4: Run lint and test**

Run: `pnpm run design:lint && pnpm exec vitest run tests/brand.test.ts`

Expected: PASS. If `designmd` JSON is wrapped in extra log lines, parse the last JSON object in stdout.

- [ ] **Step 5: Commit**

```bash
git add DESIGN.md package.json pnpm-lock.yaml tests/brand.test.ts
git commit -m "$(cat <<'EOF'
功能：加入 Saddle 石鞍 DESIGN.md 与 lint

EOF
)"
```

---

### Task 2: Brand materials and overlay map

**Files:**
- Create: `brand/mark.svg`, `brand/wordmark.svg`, `brand/theme.css`, `brand/overlay-map.json`
- Create: `brand/overlay/BrandWordmark.tsx`, `brand/overlay/FishLogo.tsx`, `brand/overlay/index.html`, `brand/overlay/manifest.webmanifest`, `brand/overlay/onboarding-copy.ts`, `brand/overlay/GeneralSection.tsx`
- Modify: `tests/brand.test.ts`

**Interfaces:**
- Consumes: `DESIGN.md` color values
- Produces: overlay-map schema `{ replace, add, patch }`; overlay files used by Task 3

Mark paths **must** match `resources/icon.svg` arcs (no rounded rect).

- [ ] **Step 1: Extend tests for materials**

Append to `tests/brand.test.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const icon = readFileSync(join(root, 'resources/icon.svg'), 'utf8')
const arc1 = 'M220 620 C360 420, 664 420, 804 620'
const arc2 = 'M340 700 C512 560, 684 700, 684 700'

describe('brand materials', () => {
  it('mark.svg reuses the icon arcs and currentColor', () => {
    const svg = readFileSync(join(root, 'brand/mark.svg'), 'utf8')
    expect(svg).toContain(arc1)
    expect(svg).toContain(arc2)
    expect(svg).toContain('currentColor')
    expect(svg).not.toContain('#1c1917')
  })

  it('overlay copy is Saddle, not DeepSeek Harness', () => {
    const wordmark = readFileSync(join(root, 'brand/overlay/BrandWordmark.tsx'), 'utf8')
    const fish = readFileSync(join(root, 'brand/overlay/FishLogo.tsx'), 'utf8')
    const onboard = readFileSync(join(root, 'brand/overlay/onboarding-copy.ts'), 'utf8')
    expect(wordmark).not.toContain('DeepSeek Harness')
    expect(fish).not.toContain('dsh-wordmark-whale')
    expect(onboard).not.toContain('DeepSeek Harness')
    expect(onboard).toContain("WELCOME_NOTICE_VERSION = '2026-08-16.saddle'")
    expect(fish).toContain(arc1)
  })

  it('overlay-map patches use the spec strings', () => {
    const map = JSON.parse(readFileSync(join(root, 'brand/overlay-map.json'), 'utf8')) as {
      patch: { find: string; with: string }[]
    }
    const withs = map.patch.map(p => p.with)
    expect(withs).toContain('You are an AI agent running in Saddle.')
    expect(withs.some(w => w.includes('Saddle desktop app'))).toBe(true)
    expect(withs).toContain('fill="#a8a29e"')
  })

  it('overlay-map targets exist when the submodule is present', () => {
    const vendor = join(root, 'vendor/deepseek-harness')
    if (!existsSync(join(vendor, 'package.json'))) return
    const map = JSON.parse(readFileSync(join(root, 'brand/overlay-map.json'), 'utf8')) as {
      replace: { to: string }[]
      add: { to: string }[]
      patch: { to: string }[]
    }
    for (const row of [...map.replace, ...map.patch]) {
      expect(existsSync(join(vendor, row.to)), row.to).toBe(true)
    }
    for (const row of map.add) {
      expect(existsSync(join(vendor, row.to, '..')), row.to).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run tests/brand.test.ts`

Expected: FAIL on missing `brand/` files.

- [ ] **Step 3: Write materials**

`brand/mark.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <path d="M220 620 C360 420, 664 420, 804 620" fill="none" stroke="currentColor" stroke-width="72" stroke-linecap="round"/>
  <path d="M340 700 C512 560, 684 700, 684 700" fill="none" stroke="currentColor" stroke-width="48" stroke-linecap="round" opacity="0.65"/>
</svg>
```

`brand/wordmark.svg` (same arcs, plus the word Saddle; native 182×24):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="182" height="24" viewBox="0 0 182 24" fill="none">
  <g transform="translate(0 -2) scale(0.028)">
    <path d="M220 620 C360 420, 664 420, 804 620" fill="none" stroke="currentColor" stroke-width="72" stroke-linecap="round"/>
    <path d="M340 700 C512 560, 684 700, 684 700" fill="none" stroke="currentColor" stroke-width="48" stroke-linecap="round" opacity="0.65"/>
  </g>
  <text x="36" y="17" fill="currentColor" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="14" font-weight="600">Saddle</text>
</svg>
```

If the scaled mark looks clipped, keep the two arc `d` values unchanged and only adjust the `transform` / `text` x.

`brand/overlay/FishLogo.tsx`:

```tsx
import type { IconProps } from './icons/props.ts'

export function FishLogo({ size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox="0 0 1024 1024"
      fill="none"
      aria-hidden="true"
    >
      <path d="M220 620 C360 420, 664 420, 804 620" fill="none" stroke="currentColor" strokeWidth="72" strokeLinecap="round"/>
      <path d="M340 700 C512 560, 684 700, 684 700" fill="none" stroke="currentColor" strokeWidth="48" strokeLinecap="round" opacity="0.65"/>
    </svg>
  )
}
```

`brand/overlay/BrandWordmark.tsx`:

```tsx
import type { IconProps } from './icons/props.ts'

export function BrandWordmark({ size = 24, className }: IconProps) {
  return (
    <svg
      width={(size * 182) / 24}
      height={size}
      className={className}
      viewBox="0 0 182 24"
      fill="none"
      aria-hidden="true"
    >
      <g transform="translate(0 -2) scale(0.028)">
        <path d="M220 620 C360 420, 664 420, 804 620" fill="none" stroke="currentColor" strokeWidth="72" strokeLinecap="round"/>
        <path d="M340 700 C512 560, 684 700, 684 700" fill="none" stroke="currentColor" strokeWidth="48" strokeLinecap="round" opacity="0.65"/>
      </g>
      <text x="36" y="17" fill="currentColor" fontFamily="system-ui, -apple-system, Segoe UI, sans-serif" fontSize="14" fontWeight="600">Saddle</text>
    </svg>
  )
}
```

`brand/overlay/index.html` — copy `vendor/deepseek-harness/apps/web/index.html` and set `<title>Saddle</title>` only.

`brand/overlay/manifest.webmanifest`:

```json
{
  "id": "/",
  "name": "Saddle",
  "short_name": "Saddle",
  "start_url": "/",
  "scope": "/",
  "display": "fullscreen",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}
```

`brand/overlay/onboarding-copy.ts` — keep the existing exports from `packages/client/ui-settings-models/src/onboarding-copy.ts`, change version and copy:

```ts
export const WELCOME_NOTICE_SETTINGS_NAMESPACE = 'ui-onboarding'
export const WELCOME_NOTICE_ACK_FIELD = 'welcomeNoticeVersion'
export const WELCOME_NOTICE_VERSION = '2026-08-16.saddle'
export const WELCOME_NOTICE_COPY = {
  zh: {
    title: '欢迎使用 Saddle',
    body: 'Saddle 是面向本地工作区的桌面智能体应用。功能仍在迭代，欢迎直接在产品里反馈。',
    continueLabel: '继续',
  },
  en: {
    title: 'Welcome to Saddle',
    body: 'Saddle is a desktop agent app for local workspaces. It is still changing; send feedback from inside the product.',
    continueLabel: 'Continue',
  },
} as const
```

`brand/overlay/GeneralSection.tsx`:

```tsx
import type { PropsLocale, PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import css from './GeneralSection.module.css'

export type GeneralSectionComponentProps =
  PropsRuntime<'settings.section'> & PropsRenderSlots<'settings.general.item'> & PropsLocale<'settings'>

export function GeneralSection({ renderSlot, t }: GeneralSectionComponentProps) {
  return (
    <div className={css.section}>
      {renderSlot('settings.general.item', {})}
      <p style={{ marginTop: 24, fontSize: 12, opacity: 0.65 }}>{t('about')}</p>
    </div>
  )
}
```

The general section is already registered with `locale: NS`, so `t` is injected. Do not use `document.lang`.

`brand/theme.css` — only static neutrals, bluish, and deepseek on `body` and `body[data-ds-dark-theme]`. Example skeleton (fill every token name that exists in `design-platform.css` for those three families):

```css
body {
  --dsw-static-neutral-00: #ffffff;
  --dsw-static-neutral-50: #f7f5f2;
  --dsw-static-neutral-100: #f7f5f2;
  --dsw-static-neutral-150: #e7e5e4;
  --dsw-static-neutral-200: #e7e5e4;
  --dsw-static-neutral-250: #d6d3d1;
  --dsw-static-neutral-300: #d6d3d1;
  --dsw-static-neutral-400: #a8a29e;
  --dsw-static-neutral-500: #78716c;
  --dsw-static-neutral-550: #78716c;
  --dsw-static-neutral-600: #57534e;
  --dsw-static-neutral-700: #44403c;
  --dsw-static-neutral-800: #292524;
  --dsw-static-neutral-850: #1c1917;
  --dsw-static-neutral-900: #1c1917;
  --dsw-static-neutral-1000: #1c1917;
  --dsw-static-neutral-bluish-00: #f7f5f2;
  --dsw-static-neutral-bluish-50: #ffffff;
  --dsw-static-neutral-bluish-60: #f7f5f2;
  --dsw-static-neutral-bluish-75: #f0eeea;
  --dsw-static-neutral-bluish-100: #e7e5e4;
  --dsw-static-neutral-bluish-150: #e7e5e4;
  --dsw-static-neutral-bluish-200: #d6d3d1;
  --dsw-static-neutral-bluish-300: #a8a29e;
  --dsw-static-neutral-bluish-400: #a8a29e;
  --dsw-static-neutral-bluish-500: #78716c;
  --dsw-static-neutral-bluish-600: #78716c;
  --dsw-static-neutral-bluish-700: #57534e;
  --dsw-static-neutral-bluish-750: #44403c;
  --dsw-static-neutral-bluish-800: #292524;
  --dsw-static-neutral-bluish-850: #1c1917;
  --dsw-static-neutral-bluish-875: #1c1917;
  --dsw-static-neutral-bluish-900: #1c1917;
  --dsw-static-neutral-bluish-950: #1c1917;
  --dsw-static-neutral-bluish-1000: #1c1917;
  --dsw-static-deepseek-50: #f7f5f2;
  --dsw-static-deepseek-100: #e7e5e4;
  --dsw-static-deepseek-200: #e7e5e4;
  --dsw-static-deepseek-300: #a8a29e;
  --dsw-static-deepseek-400: #78716c;
  --dsw-static-deepseek-450: #57534e;
  --dsw-static-deepseek-500: #1c1917;
  --dsw-static-deepseek-600: #1c1917;
  --dsw-static-deepseek-700-delete: #1c1917;
  --dsw-static-deepseek-800: #292524;
  --dsw-static-deepseek-900: #1c1917;
}

body[data-ds-dark-theme] {
  --dsw-static-neutral-00: #e7e5e4;
  --dsw-static-neutral-50: #292524;
  --dsw-static-neutral-100: #292524;
  --dsw-static-neutral-900: #1c1917;
  --dsw-static-neutral-1000: #e7e5e4;
  --dsw-static-neutral-bluish-00: #e7e5e4;
  --dsw-static-neutral-bluish-50: #e7e5e4;
  --dsw-static-neutral-bluish-60: #292524;
  --dsw-static-neutral-bluish-75: #292524;
  --dsw-static-neutral-bluish-100: #44403c;
  --dsw-static-neutral-bluish-800: #44403c;
  --dsw-static-neutral-bluish-850: #292524;
  --dsw-static-neutral-bluish-875: #292524;
  --dsw-static-neutral-bluish-900: #1c1917;
  --dsw-static-neutral-bluish-950: #1c1917;
  --dsw-static-neutral-bluish-1000: #1c1917;
  --dsw-static-deepseek-400: #e7e5e4;
  --dsw-static-deepseek-450: #e7e5e4;
  --dsw-static-deepseek-500: #a8a29e;
  --dsw-static-deepseek-800: #292524;
  --dsw-static-deepseek-900: #1c1917;
}
```

Complete every `--dsw-static-neutral*` / `neutral-bluish*` / `deepseek*` name present in `vendor/deepseek-harness/packages/client/ui-theme/src/styles/design-platform.css` for both selectors. Do not set red/green/amber.

`brand/overlay-map.json` (literal `\n` in JSON strings):

```json
{
  "replace": [
    { "from": "brand/overlay/BrandWordmark.tsx", "to": "packages/client/ui-primitives/src/BrandWordmark.tsx" },
    { "from": "brand/overlay/FishLogo.tsx", "to": "packages/client/ui-primitives/src/FishLogo.tsx" },
    { "from": "brand/overlay/index.html", "to": "apps/web/index.html" },
    { "from": "brand/overlay/manifest.webmanifest", "to": "apps/web/public/manifest.webmanifest" },
    { "from": "brand/mark.svg", "to": "apps/web/public/favicon.svg" },
    { "from": "brand/overlay/onboarding-copy.ts", "to": "packages/client/ui-settings-models/src/onboarding-copy.ts" },
    { "from": "brand/overlay/GeneralSection.tsx", "to": "packages/client/ui-settings-general/src/client/GeneralSection.tsx" }
  ],
  "add": [
    { "from": "brand/theme.css", "to": "packages/client/ui-theme/src/styles/saddle-theme.css" }
  ],
  "patch": [
    {
      "to": "packages/client/web/src/base.css",
      "find": "@import '@deepseek-ai/dsh-client-ui-theme/styles/design-platform.css';",
      "with": "@import '@deepseek-ai/dsh-client-ui-theme/styles/design-platform.css';\n@import '@deepseek-ai/dsh-client-ui-theme/styles/saddle-theme.css';"
    },
    {
      "to": "packages/core/system-prompt/src/index.ts",
      "find": "You are an AI agent powered by DeepSeek Harness.",
      "with": "You are an AI agent running in Saddle."
    },
    {
      "to": "packages/bundle/web-app/src/index.ts",
      "find": "You are interacting with the user through the DeepSeek Harness Web GUI at ${webUrl}.",
      "with": "You are interacting with the user through the Saddle desktop app at ${webUrl}."
    },
    {
      "to": "packages/boot/app-boot/src/index.ts",
      "find": "The DeepSeek Harness implementation checkout is at ${sourceRoot}.",
      "with": "The runtime implementation checkout is at ${sourceRoot}."
    },
    {
      "to": "packages/boot/app-boot/src/index.ts",
      "find": "Use this checkout only to inspect or extend DSH itself.",
      "with": "Use this checkout only to inspect or extend this runtime."
    },
    {
      "to": "packages/client/ui-conversation/src/client/locales.ts",
      "find": "'hero.headline': '探索未至之境'",
      "with": "'hero.headline': '坐好，开始。'"
    },
    {
      "to": "packages/client/ui-conversation/src/client/locales.ts",
      "find": "'hero.headline': 'Into the Unknown'",
      "with": "'hero.headline': 'Sit down and start.'"
    },
    {
      "to": "packages/client/ui-conversation/src/client/skeleton/EmptyHero.tsx",
      "find": "fill=\"#6187D8\"",
      "with": "fill=\"#a8a29e\""
    },
    {
      "to": "packages/client/ui-settings-general/src/client/locales.ts",
      "find": "'general.nav': '通用设置',",
      "with": "'general.nav': '通用设置',\n  'about': 'Saddle 基于 DeepSeek Harness.',"
    },
    {
      "to": "packages/client/ui-settings-general/src/client/locales.ts",
      "find": "'general.nav': 'General',",
      "with": "'general.nav': 'General',\n  'about': 'Saddle is based on DeepSeek Harness.',"
    }
  ]
}
```

Before committing, grep the live vendor files for each `find` and confirm count is 1. If a `find` uses different quotes/spaces, fix the map to the file, not the other way around.

- [ ] **Step 4: Run tests**

Run: `pnpm exec vitest run tests/brand.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add brand tests/brand.test.ts
git commit -m "$(cat <<'EOF'
功能：加入石鞍物料与 overlay 映射表

EOF
)"
```

---

### Task 3: apply-brand

**Files:**
- Create: `scripts/apply-brand.ts`
- Test: `tests/apply-brand.test.ts`

**Interfaces:**
- Consumes: `brand/overlay-map.json` from Task 2
- Produces:

```ts
export interface OverlayReplace { from: string; to: string }
export interface OverlayAdd { from: string; to: string }
export interface OverlayPatch { to: string; find: string; with: string }
export interface OverlayMap {
  replace: OverlayReplace[]
  add: OverlayAdd[]
  patch: OverlayPatch[]
}
export class ApplyBrandError extends Error {
  constructor(message: string, readonly overlayPath?: string)
}
export function loadOverlayMap(repoRoot: string): OverlayMap
export function assertVendorClean(vendorRoot: string, git?: GitFn): void
export function applyOverlay(opts: { repoRoot: string; vendorRoot: string; map: OverlayMap }): void
export function restoreOverlay(opts: { vendorRoot: string; map: OverlayMap; git?: GitFn }): void
export function runWithBrandOverlay(
  opts: { repoRoot: string; vendorRoot: string; map: OverlayMap },
  fn: () => void,
): void
export type GitFn = (args: string[], cwd: string) => void
```

CLI (`process.argv[2]`): `apply` | `restore` | `with-build`.

- [ ] **Step 1: Write failing tests**

Create `tests/apply-brand.test.ts`. Use `mkdtempSync`, `git init`, and a tiny map — do not touch the real submodule.

```ts
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  ApplyBrandError,
  applyOverlay,
  assertVendorClean,
  restoreOverlay,
  runWithBrandOverlay,
  type OverlayMap,
} from '../scripts/apply-brand.ts'

let dir = ''
afterEach(() => { if (dir !== '') rmSync(dir, { recursive: true, force: true }) })

function gitInit(): string {
  dir = mkdtempSync(join(tmpdir(), 'saddle-brand-'))
  execFileSync('git', ['init'], { cwd: dir })
  execFileSync('git', ['config', 'user.email', 't@t'], { cwd: dir })
  execFileSync('git', ['config', 'user.name', 't'], { cwd: dir })
  mkdirSync(join(dir, 'packages'), { recursive: true })
  writeFileSync(join(dir, 'keep.txt'), 'orig\n')
  writeFileSync(join(dir, 'packages/base.css'), "@import 'a.css';\n")
  execFileSync('git', ['add', '.'], { cwd: dir })
  execFileSync('git', ['commit', '-m', 'i'], { cwd: dir })
  return dir
}

const map: OverlayMap = {
  replace: [{ from: 'brand/overlay/keep.txt', to: 'keep.txt' }],
  add: [{ from: 'brand/theme.css', to: 'packages/saddle-theme.css' }],
  patch: [{ to: 'packages/base.css', find: "@import 'a.css';", with: "@import 'a.css';\n@import 'saddle.css';" }],
}

describe('apply-brand', () => {
  it('replaces, adds, patches, then restore returns sources', () => {
    const vendor = gitInit()
    const repo = mkdtempSync(join(tmpdir(), 'saddle-repo-'))
    mkdirSync(join(repo, 'brand/overlay'), { recursive: true })
    writeFileSync(join(repo, 'brand/overlay/keep.txt'), 'branded\n')
    writeFileSync(join(repo, 'brand/theme.css'), 'body{}\n')
    applyOverlay({ repoRoot: repo, vendorRoot: vendor, map })
    expect(readFileSync(join(vendor, 'keep.txt'), 'utf8')).toBe('branded\n')
    expect(readFileSync(join(vendor, 'packages/saddle-theme.css'), 'utf8')).toBe('body{}\n')
    expect(readFileSync(join(vendor, 'packages/base.css'), 'utf8')).toContain("@import 'saddle.css';")
    restoreOverlay({ vendorRoot: vendor, map })
    expect(readFileSync(join(vendor, 'keep.txt'), 'utf8')).toBe('orig\n')
    expect(() => readFileSync(join(vendor, 'packages/saddle-theme.css'))).toThrow()
    expect(readFileSync(join(vendor, 'packages/base.css'), 'utf8')).toBe("@import 'a.css';\n")
    rmSync(repo, { recursive: true, force: true })
  })

  it('fails when find is missing and restores', () => {
    const vendor = gitInit()
    const repo = mkdtempSync(join(tmpdir(), 'saddle-repo-'))
    mkdirSync(join(repo, 'brand/overlay'), { recursive: true })
    writeFileSync(join(repo, 'brand/overlay/keep.txt'), 'branded\n')
    writeFileSync(join(repo, 'brand/theme.css'), 'body{}\n')
    const bad = { ...map, patch: [{ to: 'packages/base.css', find: 'NOPE', with: 'x' }] }
    expect(() => runWithBrandOverlay({ repoRoot: repo, vendorRoot: vendor, map: bad }, () => {})).toThrow(ApplyBrandError)
    expect(readFileSync(join(vendor, 'keep.txt'), 'utf8')).toBe('orig\n')
    rmSync(repo, { recursive: true, force: true })
  })

  it('fails when find occurs twice', () => {
    const vendor = gitInit()
    writeFileSync(join(vendor, 'packages/base.css'), "@import 'a.css';\n@import 'a.css';\n")
    execFileSync('git', ['add', 'packages/base.css'], { cwd: vendor })
    execFileSync('git', ['commit', '-m', 'dup'], { cwd: vendor })
    const repo = mkdtempSync(join(tmpdir(), 'saddle-repo-'))
    mkdirSync(join(repo, 'brand/overlay'), { recursive: true })
    writeFileSync(join(repo, 'brand/overlay/keep.txt'), 'branded\n')
    writeFileSync(join(repo, 'brand/theme.css'), 'body{}\n')
    expect(() => applyOverlay({ repoRoot: repo, vendorRoot: vendor, map })).toThrow(/exactly once/)
    rmSync(repo, { recursive: true, force: true })
  })

  it('rejects a dirty vendor tree', () => {
    const vendor = gitInit()
    writeFileSync(join(vendor, 'keep.txt'), 'dirty\n')
    expect(() => assertVendorClean(vendor)).toThrow(/dirty/)
  })

  it('runWithBrandOverlay restores when fn throws', () => {
    const vendor = gitInit()
    const repo = mkdtempSync(join(tmpdir(), 'saddle-repo-'))
    mkdirSync(join(repo, 'brand/overlay'), { recursive: true })
    writeFileSync(join(repo, 'brand/overlay/keep.txt'), 'branded\n')
    writeFileSync(join(repo, 'brand/theme.css'), 'body{}\n')
    expect(() => runWithBrandOverlay({ repoRoot: repo, vendorRoot: vendor, map }, () => {
      throw new Error('build failed')
    })).toThrow(/build failed/)
    expect(readFileSync(join(vendor, 'keep.txt'), 'utf8')).toBe('orig\n')
    rmSync(repo, { recursive: true, force: true })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec vitest run tests/apply-brand.test.ts`

Expected: FAIL, cannot find `../scripts/apply-brand.ts`.

- [ ] **Step 3: Implement `scripts/apply-brand.ts`**

```ts
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

export interface OverlayReplace { from: string; to: string }
export interface OverlayAdd { from: string; to: string }
export interface OverlayPatch { to: string; find: string; with: string }
export interface OverlayMap {
  replace: OverlayReplace[]
  add: OverlayAdd[]
  patch: OverlayPatch[]
}
export type GitFn = (args: string[], cwd: string) => void

export class ApplyBrandError extends Error {
  constructor(message: string, readonly overlayPath?: string) {
    super(message)
  }
}

export function loadOverlayMap(repoRoot: string): OverlayMap {
  const raw = JSON.parse(readFileSync(join(repoRoot, 'brand/overlay-map.json'), 'utf8')) as OverlayMap
  if (!Array.isArray(raw.replace) || !Array.isArray(raw.add) || !Array.isArray(raw.patch)) {
    throw new ApplyBrandError('overlay-map.json must have replace, add, and patch arrays')
  }
  return raw
}

function defaultGit(args: string[], cwd: string): void {
  execFileSync('git', args, { cwd, stdio: 'pipe' })
}

export function assertVendorClean(vendorRoot: string, git: GitFn = defaultGit): void {
  const porcelain = execFileSync('git', ['status', '--porcelain'], { cwd: vendorRoot, encoding: 'utf8' })
  if (porcelain.trim() !== '') {
    throw new ApplyBrandError('vendor working tree is dirty; commit or stash before apply-brand')
  }
  void git
}

export function applyOverlay(opts: { repoRoot: string; vendorRoot: string; map: OverlayMap }): void {
  const { repoRoot, vendorRoot, map } = opts
  for (const row of map.replace) {
    const dest = join(vendorRoot, row.to)
    if (!existsSync(dest)) throw new ApplyBrandError(`replace target missing: ${row.to}`, row.to)
    copyFileSync(join(repoRoot, row.from), dest)
  }
  for (const row of map.add) {
    const dest = join(vendorRoot, row.to)
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(join(repoRoot, row.from), dest)
  }
  for (const row of map.patch) {
    const dest = join(vendorRoot, row.to)
    if (!existsSync(dest)) throw new ApplyBrandError(`patch target missing: ${row.to}`, row.to)
    const src = readFileSync(dest, 'utf8')
    const n = src.split(row.find).length - 1
    if (n !== 1) {
      throw new ApplyBrandError(
        `patch find must occur exactly once in ${row.to} (found ${String(n)}): ${row.find.slice(0, 80)}`,
        row.to,
      )
    }
    writeFileSync(dest, src.replace(row.find, row.with))
  }
}

export function restoreOverlay(opts: { vendorRoot: string; map: OverlayMap; git?: GitFn }): void {
  const git = opts.git ?? defaultGit
  const tracked = [...new Set([...opts.map.replace, ...opts.map.patch].map(row => row.to))]
  try {
    if (tracked.length > 0) git(['checkout', '--', ...tracked], opts.vendorRoot)
    for (const row of opts.map.add) git(['clean', '-f', '--', row.to], opts.vendorRoot)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    throw new ApplyBrandError(`vendor 源文件可能仍带品牌，需手动 git checkout: ${detail}`)
  }
}

export function runWithBrandOverlay(
  opts: { repoRoot: string; vendorRoot: string; map: OverlayMap },
  fn: () => void,
): void {
  assertVendorClean(opts.vendorRoot)
  let fnError: unknown
  try {
    applyOverlay(opts)
    fn()
  } catch (error) {
    fnError = error
  } finally {
    restoreOverlay({ vendorRoot: opts.vendorRoot, map: opts.map })
  }
  if (fnError !== undefined) throw fnError
}

function main(): void {
  const cmd = process.argv[2]
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
  const vendorRoot = join(repoRoot, 'vendor', 'deepseek-harness')
  if (!existsSync(join(vendorRoot, '.git'))) throw new ApplyBrandError('missing vendor/deepseek-harness')
  const map = loadOverlayMap(repoRoot)
  if (cmd === 'restore') {
    restoreOverlay({ vendorRoot, map })
    return
  }
  if (cmd === 'apply') {
    assertVendorClean(vendorRoot)
    try {
      applyOverlay({ repoRoot, vendorRoot, map })
    } catch (error) {
      try { restoreOverlay({ vendorRoot, map }) } catch { /* keep original */ }
      throw error
    }
    return
  }
  if (cmd === 'with-build') {
    runWithBrandOverlay({ repoRoot, vendorRoot, map }, () => {
      execFileSync('pnpm', ['run', 'build'], {
        cwd: vendorRoot,
        stdio: 'inherit',
        env: { ...process.env, CI: 'true' },
      })
    })
    return
  }
  throw new ApplyBrandError('usage: apply-brand.ts apply | restore | with-build')
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(message)
    process.exit(1)
  }
}
```

If `runWithBrandOverlay` restore throws, that error replaces `fnError`. Wrap restore:

```ts
  } finally {
    try {
      restoreOverlay({ vendorRoot: opts.vendorRoot, map: opts.map })
    } catch (restoreError) {
      const restoreMsg = restoreError instanceof Error ? restoreError.message : String(restoreError)
      if (fnError !== undefined) {
        const fnMsg = fnError instanceof Error ? fnError.message : String(fnError)
        throw new ApplyBrandError(`vendor 源文件可能仍带品牌，需手动 git checkout (${restoreMsg}); prior: ${fnMsg}`)
      }
      throw restoreError
    }
  }
```

- [ ] **Step 4: Run tests**

Run: `pnpm exec vitest run tests/apply-brand.test.ts`

Expected: PASS. If `git init` needs `init.defaultBranch`, set `git checkout -b main` after init.

- [ ] **Step 5: Commit**

```bash
git add scripts/apply-brand.ts tests/apply-brand.test.ts
git commit -m "$(cat <<'EOF'
功能：构建前 overlay 品牌并在结束后还原源文件

EOF
)"
```

---

### Task 4: Wire make dsh and stage-dsh

**Files:**
- Modify: `Makefile` (`dsh` target)
- Modify: `scripts/stage-dsh.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: `runWithBrandOverlay`, `loadOverlayMap` from `scripts/apply-brand.ts`
- Produces: branded `vendor/.../lib` and `apps/web/dist` after `make dsh`; `pnpm dist` stage path overlays then builds then restores then deploys

- [ ] **Step 1: Point Makefile `dsh` at `with-build`**

Replace the `dsh` recipe with:

```make
dsh:
	$(PNPM) --dir $(DSH) install
	$(PNPM) exec tsx scripts/apply-brand.ts with-build
```

Keep `export CI := true`.

- [ ] **Step 2: Wrap stage-dsh build**

In `scripts/stage-dsh.ts`, import overlay helpers and wrap **only** `pnpm run build` (install stays outside; deploy stays **after** restore so sources are clean while `lib`/`dist` stay branded):

```ts
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { resolveDshBin } from './dsh-bin.ts'
import { loadOverlayMap, runWithBrandOverlay } from './apply-brand.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sub = join(root, 'vendor', 'deepseek-harness')
const out = join(root, 'build', 'dsh')
if (!existsSync(join(sub, 'package.json'))) throw new Error('missing vendor/deepseek-harness submodule')
const pnpmEnv = { ...process.env, CI: 'true' }
execFileSync('pnpm', ['install'], { cwd: sub, stdio: 'inherit', env: pnpmEnv })
const map = loadOverlayMap(root)
runWithBrandOverlay({ repoRoot: root, vendorRoot: sub, map }, () => {
  execFileSync('pnpm', ['run', 'build'], { cwd: sub, stdio: 'inherit', env: pnpmEnv })
})
rmSync(out, { recursive: true, force: true })
mkdirSync(join(root, 'build'), { recursive: true })
execFileSync('pnpm', ['--filter', '@deepseek-ai/dsh', 'deploy', out, '--prod'], {
  cwd: sub,
  stdio: 'inherit',
  env: pnpmEnv,
})
const pkg = JSON.parse(readFileSync(join(out, 'package.json'), 'utf8')) as { bin?: string | Record<string, string> }
const bin = resolveDshBin(out, pkg)
if (!existsSync(bin)) throw new Error(`deployed dsh bin missing: ${bin}`)
```

Do not run `pnpm run build` a second time after restore.

- [ ] **Step 3: README**

After the `make dsh` snippet, add:

```md
Changing files under `brand/` or `DESIGN.md` requires `make dsh` again. `pnpm dev` does not re-apply the brand.

Brand: [docs/superpowers/specs/2026-08-16-saddle-brand-design.md](docs/superpowers/specs/2026-08-16-saddle-brand-design.md).
```

Keep the unofficial DeepSeek Harness sentence in the README intro.

- [ ] **Step 4: Smoke the map against the real submodule (no full dsh build in CI)**

Run: `pnpm exec vitest run tests/brand.test.ts tests/apply-brand.test.ts`

Expected: PASS, including “overlay-map targets exist” if the submodule is checked out.

Optional local (not CI): `pnpm exec tsx scripts/apply-brand.ts apply && git -C vendor/deepseek-harness diff --stat && pnpm exec tsx scripts/apply-brand.ts restore && git -C vendor/deepseek-harness status --porcelain` — after restore, porcelain must be empty (ignored `lib`/`dist` may still exist).

- [ ] **Step 5: Commit**

```bash
git add Makefile scripts/stage-dsh.ts README.md
git commit -m "$(cat <<'EOF'
构建：make dsh 与 stage 在编译前套上品牌 overlay

EOF
)"
```

If `Makefile` was untracked, include it in this commit.

---

### Task 5: Splash follows system

**Files:**
- Modify: `resources/splash.html`
- Modify: `tests/error-copy.test.ts`

**Interfaces:**
- Consumes: Stone palettes from the spec
- Produces: splash with `prefers-color-scheme`, no unofficial footer

- [ ] **Step 1: Change the splash test**

In `tests/error-copy.test.ts` replace the splash example:

```ts
  it('splash mentions Saddle and follows color scheme', () => {
    const html = readFileSync(join('resources', 'splash.html'), 'utf8')
    expect(html).toContain('正在启动 Saddle')
    expect(html).toContain('prefers-color-scheme')
    expect(html).not.toMatch(/unofficial/i)
    expect(html).toContain('#f7f5f2')
    expect(html).toContain('#1c1917')
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/error-copy.test.ts`

Expected: FAIL (`unofficial` still present, no `prefers-color-scheme`).

- [ ] **Step 3: Rewrite `resources/splash.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>Saddle</title>
    <style>
      html, body { height: 100%; margin: 0; font-family: system-ui, sans-serif; background: #1c1917; color: #e7e5e4; }
      main { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
      svg { width: 48px; height: 48px; }
      @media (prefers-color-scheme: light) {
        html, body { background: #f7f5f2; color: #1c1917; }
      }
    </style>
  </head>
  <body>
    <main>
      <svg viewBox="0 0 1024 1024" aria-hidden="true">
        <path d="M220 620 C360 420, 664 420, 804 620" fill="none" stroke="currentColor" stroke-width="72" stroke-linecap="round"/>
        <path d="M340 700 C512 560, 684 700, 684 700" fill="none" stroke="currentColor" stroke-width="48" stroke-linecap="round" opacity="0.65"/>
      </svg>
      <p>正在启动 Saddle…</p>
    </main>
  </body>
</html>
```

Use the same two `d=` strings as `brand/mark.svg`. No footer.

- [ ] **Step 4: Run tests**

Run: `pnpm test`

Expected: `design:lint` 0 errors; all vitest files PASS, including title rewrite tests still expecting `DeepSeek Harness` → `Saddle`.

- [ ] **Step 5: Commit**

```bash
git add resources/splash.html tests/error-copy.test.ts
git commit -m "$(cat <<'EOF'
功能：启动页跟随系统浅色深色并去掉 unofficial 页脚

EOF
)"
```

---

## Self-review

**Spec coverage**

| Spec section | Task |
|---|---|
| DESIGN.md tokens + lint | 1 |
| mark/wordmark/theme/overlay files | 2 |
| overlay-map replace/add/patch strings | 2 |
| apply, restore, dirty, find≠1, build failure restore | 3 |
| make dsh / stage-dsh / no second build | 4 |
| README unofficial stays; rebuild after brand | 4 |
| splash light/dark, no unofficial | 5 |
| title rewrite kept | 5 (existing tests) |
| About locale patches | 2 map |
| Agent identity patches | 2 map |
| No Electron inject / no submodule commit | 3–4 |

**Placeholder scan:** none.

**Type consistency:** `OverlayMap` / `applyOverlay` / `restoreOverlay` / `runWithBrandOverlay` names match Tasks 3 and 4.
