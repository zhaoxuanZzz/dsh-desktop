# Saddle

Unofficial desktop shell for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Not a DeepSeek product.

## Develop

```sh
git submodule update --init
pnpm install
# optional: build dsh once so pnpm dev can spawn apps/cli/lib/bin.js
pnpm --dir vendor/deepseek-harness install && pnpm --dir vendor/deepseek-harness run build
pnpm test
pnpm dev
```

`pnpm dev` uses host Node (not Electron's) plus the submodule CLI. Requires Node `^22.19 || >=24`.

## Package

```sh
pnpm dist
```

Needs a long first run (full dsh build). Optional mirrors:

```sh
export NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
```

Unsigned macOS: Finder → right-click → Open. Unsigned Windows: SmartScreen → More info → Run anyway.

Signing later: set `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`. Leave them unset for v1.

## License

MIT. See [LICENSE](LICENSE). Design: [docs/superpowers/specs/2026-08-15-dsh-desktop-design.md](docs/superpowers/specs/2026-08-15-dsh-desktop-design.md).
