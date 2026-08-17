<p align="center">
  <img src="resources/icon.svg" width="120" height="120" alt="Saddle">
</p>

<h1 align="center">Saddle</h1>

<p align="center">
  <strong>中文</strong> · <a href="README.en.md">English</a>
</p>

<p align="center">
  DeepSeek Harness 的非官方桌面应用<br>
  <a href="https://github.com/zhaoxuanZzz/dsh-desktop/releases/latest">下载安装包</a>
  ·
  <a href="#快速开始">快速开始</a>
  ·
  <a href="#设计">设计</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-1c1917" alt="MIT"></a>
  <a href="https://github.com/zhaoxuanZzz/dsh-desktop/releases/latest"><img src="https://img.shields.io/github/v/release/zhaoxuanZzz/dsh-desktop" alt="Release"></a>
</p>

Saddle（石鞍）用独立窗口打开 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 Web UI。安装包自带 Node 与生产版 dsh，不必先装运行时。与本机 CLI 共用 `~/.dsh`（会话、密钥、插件同一套）。

不是 DeepSeek 官方产品。设置里会写明：Saddle 基于 DeepSeek Harness.

## 安装

从 [Releases](https://github.com/zhaoxuanZzz/dsh-desktop/releases/latest) 下载：

| 系统 | 架构 | 安装包 |
| --- | --- | --- |
| macOS 13+ | Apple Silicon | `.dmg` |
| Windows 10+ | x64 | `.exe` |

当前安装包**未签名**：

- macOS：Finder 中右键安装包 → 打开
- Windows：SmartScreen → 更多信息 → 仍要运行

v1 不提供 Linux、Intel Mac、Windows arm64。

## 快速开始

开发需要 Node `^22.19 || >=24` 和 [pnpm](https://pnpm.io)。

```sh
git clone --recurse-submodules https://github.com/zhaoxuanZzz/dsh-desktop.git
cd dsh-desktop
make
```

`make` 会初始化子模块、安装依赖、必要时编译 dsh，然后启动 Electron。

```sh
make install   # 只装依赖
make dsh       # 重新编译 dsh
pnpm test
```

改 `brand/` 或 `DESIGN.md` 之后必须再跑 `make dsh`。`pnpm dev` 不会重新套品牌。

本仓库把 dsh 放在 git 子模块 `vendor/deepseek-harness` 里，不修改其源码。Make 会设置 `CI=true`，跳过子模块里的 lefthook。

## 设计

视觉是「石鞍」：几何双弧、夜间暖石 / 白天石灰纸、没有第二强调色。Dock 与安装包图标保持深色方标，不随主题变。

| 文档 | 内容 |
| --- | --- |
| [DESIGN.md](DESIGN.md) | 品牌 token、色彩、字体、Do / Don't |
| [桌面壳设计](docs/superpowers/specs/2026-08-15-dsh-desktop-design.md) | 窗口、捆绑运行时、回环加载、分发范围 |
| [石鞍品牌](docs/superpowers/specs/2026-08-16-saddle-brand-design.md) | 产品名、构建时 overlay、换皮边界 |

物料在 `brand/`（`mark.svg`、`wordmark.svg`、`theme.css`）。构建时盖进 dsh 再编译，编译后还原子模块源文件。

## 打包

```sh
pnpm dist
```

第一次会完整编译 dsh，耗时较长。国内可选镜像：

```sh
export NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
```

签名与公证不是 v1 交付。若以后要签，再设 `CSC_LINK`、`APPLE_ID`、`WIN_CSC_LINK` 等；留空即不签。

macOS 与 Windows 安装包也可以由 GitHub Actions 在 `macos-latest` / `windows-latest` 上打出。

## 许可证

[MIT](LICENSE)
