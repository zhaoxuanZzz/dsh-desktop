# DSH Desktop 设计

日期：2026-08-15  
状态：已定稿，待实现

独立桌面应用：用 Electron 窗口 1:1 复现现有 `dsh web` 界面，安装包自带运行时，对方不必先装 Node / pnpm。dsh 以 git 子模块接入，本仓库不修改 dsh 源码。

## 目标

- 双击打开后，窗口里就是当前 dsh Web UI（会话、工具、工作区、审批、模型 onboarding 均原样跟随 dsh）。
- 可分发 macOS / Windows 安装包；运行时不依赖本机 Node、pnpm 或 dsh 源码树。
- 与本机 CLI `dsh` 共用 `$DSH_HOME`（默认 `~/.dsh`）：同一套会话、密钥、profile、插件。
- 签名与公证不作为 v1 交付：流水线预留开关，证书就绪后再启用。

## 非目标（v1）

- 修改 dsh 源码，或在 dsh 仓库内增加 Electron / `apps/electron`。
- 把 dsh 跑进 Electron 自带的 Node（ABI、引擎版本、插件树都会倒逼改 dsh）。
- 原生菜单、托盘、开机启动、自动更新、自定义协议；不用 `file://` 加载 dsh Web UI（splash / 错误页除外）。
- 用 Electron 对话框替换 dsh 已有的本机目录选择器。
- 桌面专用 cordis overlay 或换皮 UI。
- 运行时再调用 npm / npx。
- 复用已经在跑的 CLI `dsh web`（不抢、不接管 3080）。
- Linux 安装包；macOS Intel；Windows arm64。
- 在 CI 里启动真实 Electron 去点 Web UI（那是 dsh 自己的套件）。

## 约束

| 项 | 决定 |
|---|---|
| 仓库 | 与 dsh 并列的新仓库 `dsh-desktop`，不在 dsh 树内 |
| 子模块 | `vendor/deepseek-harness`，远端 `https://github.com/deepseek-ai/deepseek-harness.git`，pin 到具体 commit |
| 显示名 | DSH |
| 包名 | `dsh-desktop` |
| macOS bundle id | `ai.deepseek.dsh.desktop`（首次签名前仍可改） |
| 用户数据 | 继承环境中的 `DSH_HOME`；否则由 dsh 自己解析为 `~/.dsh`。桌面壳不另写配置层 |
| Node 引擎 | 捆绑官方 Node 22，版本 ≥ 22.19.0（满足 dsh `engines`），mac/win 同一主版本，版本号写入本仓库锁文件 |
| 绑定 | `dsh web --host 127.0.0.1 --port 0` |
| 窗口加载 | 产品 UI 只加载解析到的 `http://127.0.0.1:<port>`；splash / 错误页用 `loadFile`，不用自定义协议 |
| 分发 | 先内部可用；electron-builder 读取 `CSC_*` / `WIN_CSC_*` / Apple 公证变量，v1 留空即不签 |

dsh 现状（本设计所依赖、不复制）：`dsh web` 在回环上提供 HTTP + WebSocket；就绪时 stdout 打印 `dsh web: http://127.0.0.1:<port>`；`/api` 信任栅栏接受回环 Host；Web UI 按 Chromium 测试。

## 架构

三件套，进程上分开：

1. **Electron 壳**：单实例、splash / 错误页、BrowserWindow、子进程生死、日志。没有业务 UI。dsh Web 没有 preload；仅 `error.html` 允许最小 preload（`restart` / `quit`）。
2. **捆绑 Node**：官方发行里的 `node` / `node.exe`，不带 npm。
3. **stage 后的生产版 dsh**：从子模块构建，再 `pnpm --filter @deepseek-ai/dsh deploy` 得到可执行安装，不是整个 monorepo。

```text
Electron main
  → spawn <bundled-node> <staged-dsh-bin> web --host 127.0.0.1 --port 0
  → 扫描 stdout 得到 http://127.0.0.1:<port>
  → BrowserWindow.loadURL
用户数据：dsh 进程读写 ~/.dsh（或 $DSH_HOME）
```

升 dsh = 更新子模块 commit + 在目标 OS 上重新 stage + 打包装。不跟踪子模块 `master` 的浮动 HEAD。

## 仓库布局

```text
dsh-desktop/
  vendor/deepseek-harness/   # git submodule
  src/main/                  # Electron 主进程（窗口 / 单实例 / 拉起 dsh）
  resources/splash.html      # URL 就绪前的占位页
  resources/error.html       # 启动失败 / dsh 退出；用 ?code= 区分文案
  scripts/stage-dsh.ts       # 子模块 build + deploy 到 build/dsh
  scripts/fetch-node.ts      # 按目标平台拉官方 Node 到 build/node
  build/                     # gitignore：staged 的 node/ 与 dsh/
  electron-builder.yml
  package.json
```

本仓库没有自己的 React 前端。壳子只编译 main；界面来自 dsh 已构建的 Web dist（经 staged `@deepseek-ai/dsh` → `dsh-web-app` 解析）。

## Stage 与打包

### Stage 契约

`scripts/stage-dsh.ts` 在子模块内执行 `pnpm install` 与 `pnpm run build`，然后：

```sh
pnpm --filter @deepseek-ai/dsh deploy <repo>/build/dsh --prod
```

成功标准：`build/dsh` 是一份可脱离源码树运行的安装；其 `package.json` 的 `bin.dsh` 解析到一个真实文件。壳子启动命令为：

```text
<node绝对路径> <bin.dsh解析路径> web --host 127.0.0.1 --port 0
```

若 `pnpm deploy` 在该 monorepo 上不能得到可运行安装，stage 脚本可以改用「打包 workspace 包并安装进 `build/dsh`」，但对外契约不变：仍必须满足上面的 bin 路径与 `dsh web` 就绪行。

`scripts/fetch-node.ts` 按 electron-builder 的目标平台/架构下载官方 Node 22 tarball/zip，解开后只保留可执行文件（macOS：`bin/node`；Windows：`node.exe`），放到 `build/node/`。

native addon 必须在**目标操作系统**上 stage。禁止在 macOS 上交叉产出 Windows 的 `build/dsh`。

### extraResources

electron-builder 把 `build/node` 和 `build/dsh` 拷进应用 `resources/`。打包后的解析：

- Node：`path.join(process.resourcesPath, 'node', process.platform === 'win32' ? 'node.exe' : 'bin/node')`
- dsh bin：读取 `path.join(process.resourcesPath, 'dsh', 'package.json')` 的 `bin.dsh`，相对 `resources/dsh` 解析

### 开发 vs 发布

| 命令 | Node | dsh | 用途 |
|---|---|---|---|
| `pnpm dev` | 本机 Node（须满足 engines） | 子模块源码启动（`pnpm dsh web --host 127.0.0.1 --port 0`） | 只迭代壳子 |
| `pnpm dist` | `build/node` | `build/dsh` | 与用户安装包同一条链 |

`app.isPackaged === false` 走开发路径；`true` 走 extraResources。状态机（splash、就绪、超时、崩溃）两套路径共用。

### 安装包

- macOS arm64：dmg
- Windows x64：NSIS，当前用户安装，不要求管理员（`perMachine: false`）
- 不引入 electron-updater
- 签名：文档化 `CSC_LINK`、`CSC_KEY_PASSWORD`、`APPLE_ID`、`APPLE_APP_SPECIFIC_PASSWORD`、`APPLE_TEAM_ID`、`WIN_CSC_LINK`、`WIN_CSC_KEY_PASSWORD`；v1 CI 不设置这些变量

### CI

GitHub Actions 矩阵：

- `macos-latest`：submodule init → stage（本机 Node 编 dsh + 拉 darwin-arm64 Node）→ `electron-builder --mac --arm64` → 上传 dmg
- `windows-latest`：同样流程，目标 nsis x64

不自动创建 GitHub Release。本机开发以 macOS arm64 包为验收；Windows 以 CI artifact 为验收。

## 启动、退出、失败

### 启动顺序

1. `app.requestSingleInstanceLock()`。失败则退出；已有实例 `second-instance` 时聚焦已有窗口，不拉第二条 dsh。
2. 创建**唯一** `BrowserWindow`，先 `loadFile(resources/splash.html)`，文案：「正在启动 DSH…」。不要第二个窗口。
3. `spawn` dsh（`detached: false`）：
   - `cwd`：`os.homedir()`
   - `env`：继承 `process.env`（含已有 `DSH_HOME`、`DEEPSEEK_API_KEY`）；不由壳子写入 `DSH_HOME`
   - stdout / stderr 写入应用日志（`app.getPath('logs')`）
4. 扫描 stdout，匹配一行中的 `dsh web: http://127.0.0.1:<数字>`（忽略其后可能出现的 LAN 段）。只接受回环 URL。
5. 60 秒内匹配成功：同一窗口 `loadURL` 该地址（splash 被替换）。
6. 超时或子进程在就绪前退出：同一窗口 `loadFile(resources/error.html)`，query 为 `code=launch-failed` 或 `code=timeout`，不展示原始堆栈。

### 退出

窗口关闭、Cmd/Ctrl+Q、或应用退出：终止整棵 dsh 进程树（POSIX：对进程组 SIGTERM；Windows：按 PID 杀进程树），等 3 秒，仍在则 SIGKILL / 强制终止，再退出 Electron。禁止 `detached: true` 留下孤儿 `dsh web`。

### 用户可见失败

| `code` | 情况 | 用户看到 | 可做操作 |
|---|---|---|---|
| `launch-failed` | stage 损坏、Node 缺失、bin 不存在、进程立刻退出 | 「无法启动 DSH，请重装」 | 退出 |
| `timeout` | 进程在跑但 60s 内无就绪行 | 「启动超时」 | 退出（日志在 `app.getPath('logs')`） |
| `load-failed` | 已有 URL 但页面加载失败 | 「界面加载失败」 | 重试 = 只 `reload`，不重启 dsh |
| `exited` | 运行中 dsh 退出 | 「DSH 已退出」 | 「重新启动」= 重新走启动链 |

`load-failed` 与 `exited` 同样打开 `error.html`。该页允许最小 preload，只暴露 `restart` 与 `quit`；dsh Web 没有 preload。崩溃后不自动重试，只有用户点「重新启动」才重新走启动链。不探测或接管占用中的 3080。

## 测试

只测壳子，不复制 dsh 的 Web UI / 快照套件。

1. **就绪行解析**：抽出 `http://127.0.0.1:<port>`；拒绝非回环、缺端口、无前缀的行。含带 `(LAN: …)` 后缀的样例，结果仍是回环 URL。
2. **进程状态机**（假子进程）：就绪、超时、提前退出、运行中崩溃、SIGTERM 后再杀。
3. **路径装配**：开发态与发布态的 argv、`cwd`、环境变量（不擅自设置 `DSH_HOME`）。
4. **CI**：壳子 typecheck + 上述测试；macOS / Windows 打安装包作为构建证明。

真实拉起 `dsh web` 的集成测试：子模块未 build 则 skip；不把「先编完整个 dsh」设为单测前置。

## 实现时禁止做的捷径

- 用 Electron 的 `process.execPath` 当 dsh 的 Node。
- 把 `vendor/deepseek-harness` 整树打进 extraResources。
- 为了桌面需求给子模块打 patch、改文件、或加被 git 跟踪的 overlay。需要 dsh 行为变更时，在 dsh 上游单独提 PR；本仓库继续 pin 旧 commit 直到上游合并后再升子模块。
