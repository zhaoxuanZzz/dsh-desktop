# Saddle 设计

日期：2026-08-15  
状态：已定稿（含 grilling 修订），待实现

Saddle 是独立桌面应用：用 Electron 窗口 1:1 加载现有 `dsh web` 界面，安装包自带运行时，对方不必先装 Node / pnpm。dsh 以 git 子模块接入，本仓库不修改 dsh 源码。Saddle 是第三方壳，不是 DeepSeek 官方客户端。

## 目标

- 双击打开后，窗口里就是当前 dsh Web UI（会话、工具、工作区、审批、模型 onboarding 均原样跟随 dsh）。
- 可分发 macOS / Windows 安装包；运行时不依赖本机 Node、pnpm 或 dsh 源码树。
- 与本机 CLI `dsh` 共用 `$DSH_HOME`（默认 `~/.dsh`）：同一套会话、密钥、profile、插件。
- 签名与公证不作为 v1 交付：流水线预留开关，证书就绪后再启用。

## 非目标（v1）

- 修改 dsh 源码，或在 dsh 仓库内增加 Electron / `apps/electron`。
- 把 dsh 跑进 Electron 自带的 Node。
- 原生菜单、托盘、开机启动、自动更新、自定义协议；不用 `file://` 加载 dsh Web UI（splash / 错误页除外）。
- 用 Electron 对话框替换 dsh 已有的本机目录选择器。
- 桌面专用 cordis overlay，或换皮 dsh Web UI。
- 使用 DeepSeek 商标、官方鲸标、或 `ai.deepseek.*` bundle id。
- 运行时再调用 npm / npx。
- 复用已经在跑的 CLI `dsh web`（不抢、不接管 3080）。
- 关窗口后仍在 Dock / 托盘里挂着 dsh。
- 崩溃上报、使用情况遥测、Sentry 一类远程日志。
- Linux 安装包；macOS Intel；Windows arm64。
- 在 CI 里启动真实 Electron 去点 Web UI。
- 公开 GitHub Release（v1 仓库私有，artifact 留在 Actions）。

## 约束

| 项 | 决定 |
|---|---|
| 产品显示名 | Saddle（Finder / 开始菜单 / 无会话时的窗口标题） |
| 仓库 | 与 dsh 并列的 `dsh-desktop`（git/CI slug），不在 dsh 树内 |
| 远端 | GitHub **私有**仓库 + Actions |
| 许可证 | MIT |
| 子模块 | `vendor/deepseek-harness`，远端 `https://github.com/deepseek-ai/deepseek-harness.git`，pin 到具体 commit（dsh 无 git tag 可钉） |
| bundle id | `app.saddle` |
| 图标 | 扁平几何原作（单色底 + 抽象 S 或鞍形），导出 icns / ico；不用 DeepSeek 商标，不写实马鞍 |
| 用户数据 | 继承环境中的 `DSH_HOME`；否则由 dsh 自己解析为 `~/.dsh`。壳子不另写配置层 |
| Node 引擎 | 捆绑官方 Node 22，版本 ≥ 22.19.0，mac/win 同一主版本，版本号写入本仓库锁文件 |
| 二进制下载 | 默认 nodejs.org / Electron 官方源；若设置了 `NODEJS_ORG_MIRROR`、`ELECTRON_MIRROR` 等常见变量则走镜像。CI 不设这些变量 |
| 绑定 | `dsh web --host 127.0.0.1 --port 0` |
| 窗口加载 | 产品 UI 只加载解析到的 `http://127.0.0.1:<port>`；splash / 错误页用 `loadFile` |
| 分发 | 内部分发；electron-builder 读取 `CSC_*` / `WIN_CSC_*` / Apple 公证变量，v1 留空即不签 |

dsh 现状（本设计所依赖、不复制）：`dsh web` 在回环上提供 HTTP + WebSocket；就绪时 stdout 打印 `dsh web: http://127.0.0.1:<port>`；`/api` 信任栅栏接受回环 Host；Web UI 按 Chromium 测试；页面 `<title>` 为 `DeepSeek Harness` 或 `会话名 — DeepSeek Harness`；Session ZIP 经浏览器下载管理器保存；本地文件打开走 host `openPath`，不经 Electron。

## 架构

三件套，进程上分开：

1. **Electron 壳**：单实例、splash / 错误页、BrowserWindow、导航与权限栅栏、标题改写、子进程生死、日志。没有业务 UI。dsh Web 没有 preload；仅 `error.html` 允许最小 preload（`restart` / `quit`）。
2. **捆绑 Node**：官方发行里的 `node` / `node.exe`，不带 npm。
3. **stage 后的生产版 dsh**：从子模块构建，再 `pnpm --filter @deepseek-ai/dsh deploy` 得到可执行安装，不是整个 monorepo。

```text
Electron main
  → spawn <bundled-node> <staged-dsh-bin> web --host 127.0.0.1 --port 0
  → 扫描 stdout 得到 http://127.0.0.1:<port>
  → BrowserWindow.loadURL（主窗口永不离开该回环源）
用户数据：dsh 进程读写 ~/.dsh（或 $DSH_HOME）
```

升 dsh = 更新子模块 commit + 在目标 OS 上重新 stage + 打包装。不跟踪子模块 `master` 的浮动 HEAD。

## 仓库布局

```text
dsh-desktop/
  vendor/deepseek-harness/   # git submodule
  src/main/                  # Electron 主进程
  resources/splash.html      # 「正在启动 Saddle…」；页脚一行 unofficial 说明
  resources/error.html       # 启动失败 / dsh 退出；?code= 区分文案
  resources/icon.*           # 几何原作图标源与 icns/ico
  scripts/stage-dsh.ts
  scripts/fetch-node.ts
  build/                     # gitignore：staged 的 node/ 与 dsh/
  electron-builder.yml
  package.json
  LICENSE                    # MIT
```

本仓库没有自己的 React 前端。壳子只编译 main；界面来自 staged dsh 已构建的 Web dist。

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

若 `pnpm deploy` 不能得到可运行安装，stage 脚本可以改用「打包 workspace 包并安装进 `build/dsh`」，对外契约不变。

`scripts/fetch-node.ts` 按目标平台/架构下载 Node 22（官方或 `NODEJS_ORG_MIRROR`），只保留可执行文件放到 `build/node/`。

native addon 必须在**目标操作系统**上 stage。禁止在 macOS 上交叉产出 Windows 的 `build/dsh`。

### extraResources

- Node：`path.join(process.resourcesPath, 'node', process.platform === 'win32' ? 'node.exe' : 'bin/node')`
- dsh bin：读取 `resources/dsh/package.json` 的 `bin.dsh`，相对 `resources/dsh` 解析

### 开发 vs 发布

| 命令 | Node | dsh | 用途 |
|---|---|---|---|
| `pnpm dev` | 本机 Node（须满足 engines） | 子模块源码启动（`pnpm dsh web --host 127.0.0.1 --port 0`） | 只迭代壳子 |
| `pnpm dist` | `build/node` | `build/dsh` | 与用户安装包同一条链 |

`app.isPackaged === false` 走开发路径；`true` 走 extraResources。窗口状态机两套路径共用。

### 安装包

- macOS arm64：dmg（未签名：README 写明右键打开）
- Windows x64：NSIS，当前用户安装，`perMachine: false`（未签名：SmartScreen「更多信息 → 仍要运行」）
- 不引入 electron-updater
- 签名变量文档化，v1 CI 不设置

### CI

私有仓库 GitHub Actions：

- `macos-latest`：submodule init → stage → 拉 darwin-arm64 Node → `electron-builder --mac --arm64` → 上传 dmg artifact
- `windows-latest`：同样流程，目标 nsis x64

不自动创建 GitHub Release。本机验收 macOS arm64；Windows 验收 CI artifact。

## 启动、退出、失败

### 启动顺序

1. `app.requestSingleInstanceLock()`。失败则退出；已有实例只聚焦窗口，不拉第二条 dsh。
2. 恢复上次窗口 bounds（大小、位置、最大化）和缩放比例；没有记录则 1280×800 居中。最小约 900×600。
3. 创建**唯一** `BrowserWindow`，`loadFile(resources/splash.html)`，文案：「正在启动 Saddle…」。不要第二个窗口。
4. `spawn` dsh（`detached: false`）：
   - `cwd`：`os.homedir()`
   - `env`：继承 `process.env`；不由壳子写入 `DSH_HOME`
   - stdout / stderr 写入轮转日志（见「日志」）
5. 扫描 stdout，匹配 `dsh web: http://127.0.0.1:<数字>`。只接受回环 URL。
6. 60 秒内成功：同一窗口 `loadURL` 该地址。
7. 超时或就绪前退出：`loadFile(resources/error.html)`，`code=launch-failed` 或 `code=timeout`。

### 退出

窗口关闭（含 macOS 关最后一扇窗）、Cmd/Ctrl+Q、Cmd/Ctrl+W、或应用退出：一律结束应用。终止整棵 dsh 进程树（POSIX：进程组 SIGTERM；Windows：按 PID 杀进程树），等 3 秒，仍在则强制结束。不留 Dock 后台，不询问是否有进行中的任务，禁止 `detached: true`。

### 用户可见失败

| `code` | 情况 | 用户看到 | 可做操作 |
|---|---|---|---|
| `launch-failed` | stage 损坏、Node 缺失、bin 不存在、进程立刻退出 | 「无法启动 Saddle，请重装」 | 退出 |
| `timeout` | 进程在跑但 60s 内无就绪行 | 「启动超时」 | 退出 |
| `load-failed` | 已有 URL 但页面加载失败 | 「界面加载失败」 | 重试 = 只 `reload`，不重启 dsh |
| `exited` | 运行中 dsh 退出 | 「Saddle 已退出」 | 「重新启动」= 重新走启动链 |

`error.html` 允许最小 preload（`restart` / `quit`）。崩溃后不自动重试。不探测或接管占用中的 3080。

## 窗口与 Chromium 行为

渲染进程：`nodeIntegration: false`，`contextIsolation: true`。dsh Web 无 preload。

**标题：** 拦截 `page-title-updated`，把后缀 `DeepSeek Harness` 换成 `Saddle`（`会话名 — Saddle`；无会话则为 `Saddle`）。不改 dsh 源码，不向页面注入脚本。

**导航：** 主窗口不得离开就绪时的回环源。非该源的 `http(s)`（含 `target=_blank`）用系统默认浏览器打开。`file:` 不在主窗口打开（本地文件仍由 dsh `host.openPath` 处理）。

**下载：** `will-download` 保存到系统默认下载文件夹，不弹另存为。

**权限：** `setPermissionRequestHandler` 全部拒绝（通知、媒体、地理位置、串口等）。页面内复制粘贴与拖拽附件不受影响。

**DevTools：** 开发态与安装包均可用快捷键打开（macOS Cmd+Opt+I，Windows F12）。无菜单栏。

**缩放：** 允许 Cmd/Ctrl + `+` `-` `0` 与捏合；缩放比例与窗口 bounds 一起持久化。

## 日志

只写本地 `app.getPath('logs')`：壳子事件 + dsh stdout/stderr。单文件约 10MB，保留 3 份。不写入 `process.env`。不上报崩溃或使用情况。

## 测试

只测壳子。

1. **就绪行解析：** 抽出回环 URL；拒绝非回环、缺端口、无前缀；带 `(LAN: …)` 后缀时仍只取回环。
2. **标题改写：** `DeepSeek Harness` → `Saddle`；`主题 — DeepSeek Harness` → `主题 — Saddle`；无关标题不改。
3. **导航分类：** 回环同源允许；外链 http(s) 标记为系统浏览器；主窗口离开源为拒绝。
4. **进程状态机**（假子进程）：就绪、超时、提前退出、运行中崩溃、SIGTERM 后再杀。
5. **路径装配：** 开发态与发布态的 argv、`cwd`、环境变量（不擅自设置 `DSH_HOME`）。
6. **CI：** typecheck + 上述测试；macOS / Windows 打安装包。

真实 `dsh web` 集成测试：子模块未 build 则 skip。

## 实现时禁止做的捷径

- 用 Electron 的 `process.execPath` 当 dsh 的 Node。
- 把 `vendor/deepseek-harness` 整树打进 extraResources。
- 给子模块打 patch、改文件、或加被 git 跟踪的 overlay。需要 dsh 行为变更时走上游 PR；本仓库 pin 旧 commit 直到再升子模块。
- 用 DeepSeek 官方图标或 `ai.deepseek.*` 标识。
- 为排障打开 `webSecurity: false` 或 `nodeIntegration: true`。
