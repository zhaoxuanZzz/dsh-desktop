# Saddle 品牌

日期：2026-08-16  
状态：已定稿（brainstorming），待实现

本文件修订 [2026-08-15 桌面壳设计](2026-08-15-dsh-desktop-design.md) 中的两条非目标：**换皮 dsh Web UI** 与 **智能体仍自称 DeepSeek Harness**。其余壳层约束仍有效：不提交 `vendor/deepseek-harness` 的改动、不向页面注入脚本、不用 `ai.deepseek.*` bundle id、不用官方鲸标。

Saddle 是产品名。视觉是「石鞍」：几何双弧、无第二强调色。浅色 / 深色 / 跟随系统沿用 dsh 已有的 `ui-theme.preference`（默认 `system`），只换色板。Dock / 安装包图标仍用现有深色方标 `resources/icon.svg`，不随主题变。

## 目标

- 用户可见的产品名、字标、空状态、欢迎文案、窗口/页面标题、启动页都是 Saddle。
- 智能体系统提示自称 Saddle，不自称 DeepSeek Harness。
- 设置 → 通用 底部一行：`Saddle 基于 DeepSeek Harness.`（英文 `Saddle is based on DeepSeek Harness.`）。README / LICENSE 可继续写 unofficial。
- 品牌规范与物料维护在本仓库：根目录 `DESIGN.md`（[DESIGN.md](https://github.com/google-labs-code/design.md) 格式）+ `brand/`。
- 构建时把物料盖进 dsh 再编译，编译后还原子模块源文件。gitignored 的 `dist/` / `lib/` 留下换皮产物。

## 非目标

- 提交对 `vendor/deepseek-harness` 的源码修改、patch 文件、或 fork。
- Electron `insertCSS` / `executeJavaScript` 换皮（避免闪鲸标、升 dsh 即碎）。
- `dsh --patch` 桌面专用 cordis 插件。
- 改模型 ID（`deepseek-chat` 等）、`$DSH_HOME`、CLI help、dsh website、dsh-badge skill。
- 品牌字体、插画包、第三套强调色。
- 另做一套主题开关（dsh 已有浅/深/系统）。
- 像素级视觉回归；CI 里启动真实 Electron 点 Web UI。

## 气质与 token

夜间：石底 `#1c1917`，抬起面 `#292524`，骨字 `#e7e5e4`，石灰描边 `#44403c`，弱字 `#a8a29e`。  
白天：石灰纸 `#f7f5f2`，抬起面 `#ffffff`，墨字 `#1c1917`，描边 `#e7e5e4`，弱字 `#78716c`。

`DESIGN.md` 的 YAML `colors` 必须包含至少：`primary`（墨 `#1c1917`）、`neutral`（石灰纸 `#f7f5f2`）、`surface-dark`（`#1c1917`）、`on-surface`（白天墨）、`on-surface-dark`（骨 `#e7e5e4`）。不设独立 CTA 色；主按钮走 `primary`（墨/骨），不要 DeepSeek 蓝。红 / 绿 / 琥珀保持 dsh 语义，用于错误、成功、警告。

字体：继续 dsh `base.css` 的系统栈（`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', …`）。`DESIGN.md` 的 typography 写明这一点，不引入 webfont。

圆角与间距不另发明；`DESIGN.md` 的 `rounded` / `spacing` 可省略，或在 `omitted` 里写明沿用 dsh。

## 仓库布局

```text
DESIGN.md                    # 规范：YAML token + 正文（Overview → Colors → Typography → Do's and Don'ts）
brand/
  mark.svg                   # 几何鞍线，currentColor；空状态 / favicon / 启动页共用
  wordmark.svg               # 鞍标 + 「Saddle」字
  theme.css                  # 覆盖 --dsw-static-neutral*、neutral-bluish*、deepseek*（品牌蓝改墨/骨）
  overlay-map.json           # apply 脚本只认这份表
  overlay/                   # 要盖进子模块的替换件（路径见下表）
resources/icon.svg           # Dock / 安装包；深色方标，不随主题变
resources/splash.html        # prefers-color-scheme 昼夜；无 unofficial 页脚
```

`brand/mark.svg` 是鞍线的唯一源。`wordmark.svg`、`favicon` overlay、`FishLogo` overlay、启动页内联图形都从它复制路径，不允许另画一条弧。

`@google/design.md` 作为本仓库 devDependency。`pnpm test`（或并列的 `pnpm design:lint` 且被 test 调用）必须跑 `designmd lint DESIGN.md`。

## 覆盖清单

`overlay-map.json` 三段。`to` 均相对 `vendor/deepseek-harness/`。目标文件不存在、或 `patch` 的 `find` 在文件中不是恰好一次，apply 失败并打印路径，不跳过、不做模糊匹配。

```json
{
  "replace": [{ "from": "brand/overlay/FishLogo.tsx", "to": "packages/client/ui-primitives/src/FishLogo.tsx" }],
  "add": [{ "from": "brand/theme.css", "to": "packages/client/ui-theme/src/styles/saddle-theme.css" }],
  "patch": [{ "to": "packages/core/system-prompt/src/index.ts", "find": "…", "with": "…" }]
}
```

`from` 相对本仓库根。`patch` 没有 `from`。

### replace（整文件覆盖）

只用于本就几乎整份都是品牌件、或本仓库会整份重写的小文件。

| from | to | 换成 |
|---|---|---|
| `brand/overlay/BrandWordmark.tsx` | `packages/client/ui-primitives/src/BrandWordmark.tsx` | 内联 `wordmark.svg`；保留 `IconProps`（`size` 默认 24、按原 182:24 比例改宽） |
| `brand/overlay/FishLogo.tsx` | `packages/client/ui-primitives/src/FishLogo.tsx` | 内联 `mark.svg`；保留 `size` 默认 24 |
| `brand/overlay/index.html` | `apps/web/index.html` | `<title>Saddle</title>` |
| `brand/overlay/manifest.webmanifest` | `apps/web/public/manifest.webmanifest` | `"name": "Saddle"`, `"short_name": "Saddle"` |
| `brand/mark.svg` | `apps/web/public/favicon.svg` | 同一份鞍线 |
| `brand/overlay/onboarding-copy.ts` | `packages/client/ui-settings-models/src/onboarding-copy.ts` | 欢迎文案（见下） |
| `brand/overlay/GeneralSection.tsx` | `packages/client/ui-settings-general/src/client/GeneralSection.tsx` | 见关于行 |

关于行：`GeneralSection` overlay 增加 `PropsLocale<'settings'>`，在 `renderSlot` 之后渲染 `t('about')`。若 `settings.section` 槽目前不注入 locale，overlay 该槽注册处把 locale 传进来。不要用 `document.lang` 猜测。该文件目前约 20 行；升 dsh 后若组件结构变了，重做这份 overlay。

### patch（源文件上精确替换，还原靠 git checkout）

不要整份复制这些文件。升 dsh 时若 `find` 对不上，失败即信号。`with` 按字面写入（含换行）。

| to | find（恰好一次） | with |
|---|---|---|
| `packages/client/web/src/base.css` | `@import '@deepseek-ai/dsh-client-ui-theme/styles/design-platform.css';` | `@import '@deepseek-ai/dsh-client-ui-theme/styles/design-platform.css';\n@import '@deepseek-ai/dsh-client-ui-theme/styles/saddle-theme.css';` |
| `packages/core/system-prompt/src/index.ts` | `You are an AI agent powered by DeepSeek Harness.` | `You are an AI agent running in Saddle.` |
| `packages/bundle/web-app/src/index.ts` | `You are interacting with the user through the DeepSeek Harness Web GUI at ${webUrl}.` | `You are interacting with the user through the Saddle desktop app at ${webUrl}.` |
| `packages/boot/app-boot/src/index.ts` | `The DeepSeek Harness implementation checkout is at ${sourceRoot}.` | `The runtime implementation checkout is at ${sourceRoot}.` |
| `packages/boot/app-boot/src/index.ts` | `Use this checkout only to inspect or extend DSH itself.` | `Use this checkout only to inspect or extend this runtime.` |
| `packages/client/ui-conversation/src/client/locales.ts` | `'hero.headline': '探索未至之境'` | `'hero.headline': '坐好，开始。'` |
| `packages/client/ui-conversation/src/client/locales.ts` | `'hero.headline': 'Into the Unknown'` | `'hero.headline': 'Sit down and start.'` |
| `packages/client/ui-conversation/src/client/skeleton/EmptyHero.tsx` | `fill="#6187D8"` | `fill="#a8a29e"` |
| `packages/client/ui-settings-general/src/client/locales.ts` | `'general.nav': '通用设置',` | `'general.nav': '通用设置',\n  'about': 'Saddle 基于 DeepSeek Harness.',` |
| `packages/client/ui-settings-general/src/client/locales.ts` | `'general.nav': 'General',` | `'general.nav': 'General',\n  'about': 'Saddle is based on DeepSeek Harness.',` |

### add

| from | to |
|---|---|
| `brand/theme.css` | `packages/client/ui-theme/src/styles/saddle-theme.css` |

`ui-theme` 的 tsdown 已 `copy: src/styles/* → lib/styles`，新增文件会进 `lib/styles/saddle-theme.css`。包的 `exports["./styles/*"]` 已覆盖，不必改 `package.json`。

`theme.css` 只重写 `body` 与 `body[data-ds-dark-theme]` 上的 `--dsw-static-neutral*`、`--dsw-static-neutral-bluish*`、`--dsw-static-deepseek*`。alias 继续引用这些 static，因此表面、侧栏、主按钮会跟着走。不要重写 `--dsw-static-red*` / `green*` / `amber*`。

## 文案（逐字）

欢迎（`onboarding-copy.ts`）仍用现有 `WELCOME_NOTICE_VERSION` 常量名；**版本字符串改成 `2026-08-16.saddle`**，让已点过上游声明的用户再看到一次 Saddle 欢迎。

```
zh.title: 欢迎使用 Saddle
zh.body: Saddle 是面向本地工作区的桌面智能体应用。功能仍在迭代，欢迎直接在产品里反馈。
zh.continueLabel: 继续
en.title: Welcome to Saddle
en.body: Saddle is a desktop agent app for local workspaces. It is still changing; send feedback from inside the product.
en.continueLabel: Continue
```

关于（设置通用，跟在现有 item 槽后面；用 locale `about`，不要写死一种语言）：

```
zh: Saddle 基于 DeepSeek Harness.
en: Saddle is based on DeepSeek Harness.
```

空状态标题：

```
zh hero.headline: 坐好，开始。
en hero.headline: Sit down and start.
```

`hero.preview` 仍为「预览版」/ `Preview`。

智能体（英文，模型只吃这些）：

```
harness:identity: You are an AI agent running in Saddle.
webSurfacePrompt 首句: You are interacting with the user through the Saddle desktop app at ${webUrl}.
harness:source 首句: The runtime implementation checkout is at ${sourceRoot}.
```

`webSurfacePrompt` 其余句子（HMR、不要另起服务器等）保留。`harness:source` 其余句子（cwd 与 checkout 不是一回事、用 pwd）保留；「extend DSH itself」改为「inspect or extend this runtime」。

启动页：`正在启动 Saddle…`；用 `prefers-color-scheme` 在 `#1c1917`/`#e7e5e4` 与 `#f7f5f2`/`#1c1917` 之间切换；**删除**页脚 unofficial 句。错误页文案不改。

窗口标题改写（`src/main/title.ts`）保留：上游若仍发来 `DeepSeek Harness` 后缀，继续换成 `Saddle`。

## Apply 流程

唯一入口：`scripts/apply-brand.ts`（tsx）。不在 Makefile 里手写 cp。

`make dsh` 与 `scripts/stage-dsh.ts` 在 **`pnpm run build` 之前**调用 apply，在 build **成功或失败之后**都还原。建议顺序：

1. 确认 `vendor/deepseek-harness/.git` 存在且工作区对 pin commit 干净（仅允许 gitignored 的 `lib/`/`dist/`/`node_modules/`）。若有已跟踪文件改动，拒绝 apply，以免还原时冲掉无关修改。
2. 按 map 拷贝 `replace` / `add`，再按 `patch` 做精确替换。
3. `pnpm --dir vendor/deepseek-harness run build`（stage-dsh 里这步已有，不要编两次）。
4. `finally`：对所有 `replace` 与 `patch` 的 `to` 执行 `git -C vendor/deepseek-harness checkout -- <to>`；对所有 `add` 的 `to` 执行 `git -C vendor/deepseek-harness clean -f -- <to>`。
5. 任一步失败：先做第 4 步，再以非零退出。第 2 步若某 `to` 缺失或 `find` 不是恰好一次，打印路径后走同样还原。

`pnpm dist` → `stage-dsh`（已含 build）→ deploy。deploy 吃的是已换皮的 `dist/`/`lib/`，源码已还原。

`pnpm dev` 不重新 apply；它依赖上次 `make dsh` / `stage-dsh` 留下的产物。README 写明：改品牌物料后必须再跑 `make dsh`。

不要在还原之后再编一次前端（那会把鲸标编回去）。

## 失败模式

| 情况 | 用户/开发者看到 |
|---|---|
| overlay 目标文件不存在，或 patch 的 find 不是恰好一次 | apply 退出码 ≠ 0，stderr 含该相对路径与 find 摘要 |
| 子模块工作区有已跟踪改动 | 拒绝 apply，提示先处理 vendor 改动 |
| overlay 后 `pnpm run build` 失败 | 源文件已还原；构建错误原样打出 |
| 还原失败 | 非零退出，明确写「vendor 源文件可能仍带品牌，需手动 `git checkout`」 |

运行中的 Electron 启动失败路径不因品牌而改变（仍是 `launch-failed` / `timeout` / `load-failed` / `exited`）。

## 测试

只测本仓库。子模块未 checkout 时，map 路径存在性测试 skip。

1. `designmd lint DESIGN.md`：0 error（warning 可保留，如 orphaned-tokens）。
2. 子模块在时：`overlay-map.json` 每个 `to` 存在（`add` 的父目录存在即可）。
3. apply 用临时 git 仓库：replace + add + patch 后内容符合 map；模拟 build 失败时源文件回到原样、add 的文件被删；`find` 缺失或出现两次则失败并还原。
4. overlay 物料：`BrandWordmark.tsx` / `onboarding-copy.ts` 不含 `DeepSeek Harness`；`FishLogo.tsx` 不含 `dsh-wordmark-whale`；欢迎 version 为 `2026-08-16.saddle`。patch 表里的 `with` 字符串出现在 map 中。
5. `resources/splash.html` 含 `正在启动 Saddle` 与 `prefers-color-scheme`，**不含** unofficial。现有 `tests/error-copy.test.ts` 里「splash mentions unofficial」改为上述断言。
6. 标题改写测试保留。

不测：把 overlay 打进真实 vendor 再全量编 dsh；视觉截图。

## 实现时禁止做的捷径

- 把品牌文件提交进 submodule，或 `git submodule` 指到私有 fork。
- 构建成功后不还原源文件。
- 整份复制 system-prompt / web-app / app-boot 等大文件当 overlay（升 dsh 会静默盖掉上游改动）。
- 在 Vite dist 里字符串替换鲸标 SVG。
- 用 Electron 注入换皮。
- 欢迎正文沿用上游「探索智能上限 / DSH 插件生态」声明。
- 把 DeepSeek 蓝留作主按钮或空状态光晕（`#6187D8` / `--dsw-static-deepseek-*` 品牌用途必须改掉）。
