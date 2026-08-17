<p align="center">
  <img src="resources/icon.svg" width="120" height="120" alt="Saddle">
</p>

<h1 align="center">Saddle</h1>

<p align="center">
  <a href="README.md">中文</a> · <strong>English</strong>
</p>

<p align="center">
  Unofficial desktop app for DeepSeek Harness<br>
  <a href="https://github.com/zhaoxuanZzz/dsh-desktop/releases/latest">Download</a>
  ·
  <a href="#quick-start">Quick start</a>
  ·
  <a href="#design">Design</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-1c1917" alt="MIT"></a>
  <a href="https://github.com/zhaoxuanZzz/dsh-desktop/releases/latest"><img src="https://img.shields.io/github/v/release/zhaoxuanZzz/dsh-desktop" alt="Release"></a>
</p>

Saddle opens the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web UI in its own window. The installer bundles Node and a production dsh build, so you do not need a local runtime first. It shares `~/.dsh` with the CLI (same sessions, keys, and plugins).

This is not a DeepSeek product. Settings says: Saddle is based on DeepSeek Harness.

## Install

Download from [Releases](https://github.com/zhaoxuanZzz/dsh-desktop/releases/latest):

| OS | Arch | Package |
| --- | --- | --- |
| macOS 13+ | Apple Silicon | `.dmg` |
| Windows 10+ | x64 | `.exe` |

Builds are **unsigned**:

- macOS: in Finder, right-click the disk image → Open
- Windows: SmartScreen → More info → Run anyway

v1 does not ship Linux, Intel Mac, or Windows arm64.

## Quick start

You need Node `^22.19 || >=24` and [pnpm](https://pnpm.io).

```sh
git clone --recurse-submodules https://github.com/zhaoxuanZzz/dsh-desktop.git
cd dsh-desktop
make
```

`make` inits the submodule, installs deps, builds dsh if needed, then starts Electron.

```sh
make install   # deps only
make dsh       # rebuild the dsh CLI
pnpm test
```

After editing `brand/` or `DESIGN.md`, run `make dsh` again. `pnpm dev` does not re-apply the brand.

dsh lives in the `vendor/deepseek-harness` git submodule. This repo does not change its sources. Make sets `CI=true` so the submodule's lefthook is skipped.

## Design

The look is Stone Saddle: a geometric two-arc mark, warm stone at night and limestone paper by day, no second accent. The Dock and installer icon stay the dark stone square and do not follow theme.

| Doc | What it covers |
| --- | --- |
| [DESIGN.md](DESIGN.md) | Brand tokens, color, type, do / don't |
| [Desktop shell](docs/superpowers/specs/2026-08-15-dsh-desktop-design.md) | Window, bundled runtime, loopback loading, ship scope |
| [Stone Saddle brand](docs/superpowers/specs/2026-08-16-saddle-brand-design.md) | Product name, build-time overlay, reskin bounds |

Assets live in `brand/` (`mark.svg`, `wordmark.svg`, `theme.css`). The build overlays them onto dsh, compiles, then restores the submodule sources.

## Package

```sh
pnpm dist
```

The first run compiles all of dsh and takes a while. Optional mirrors:

```sh
export NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
```

Signing and notarization are not part of v1. Set `CSC_LINK`, `APPLE_ID`, `WIN_CSC_LINK`, and related vars later if you need signed builds; leave them unset to skip.

macOS and Windows installers can also be built by GitHub Actions on `macos-latest` / `windows-latest`.

## License

[MIT](LICENSE)
