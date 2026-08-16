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
