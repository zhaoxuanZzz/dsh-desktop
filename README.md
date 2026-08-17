# Saddle

Unofficial desktop shell for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). Not a DeepSeek product.

## Develop

```sh
make
```

Installs the submodule, pnpm deps, and dsh CLI (once), then starts Electron. Requires Node `^22.19 || >=24` and pnpm.

```sh
make install   # deps only
make dsh       # rebuild dsh CLI
pnpm test
```

`pnpm dev` uses host Node (not Electron's) plus the submodule CLI. `CI=true` is set in Make so dsh lefthook is skipped (it cannot run inside this git submodule).

Changing files under `brand/` or `DESIGN.md` requires `make dsh` again. `pnpm dev` does not re-apply the brand.

Brand: [docs/superpowers/specs/2026-08-16-saddle-brand-design.md](docs/superpowers/specs/2026-08-16-saddle-brand-design.md).

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
