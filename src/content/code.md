# 开源代码

水杉输入法由几个相互协作的开源项目组成。这里汇总平台前端、共享引擎、文档和基础设施，便于查阅、构建与参与开发。

2026 年 9 月做过一次仓库合并：Windows 端的全部一方源码收进了单个仓库，词库、辅助码、语音模块并入了引擎。原来的仓库已归档为只读，历史随代码迁到了接收仓，`git log` 和 `git blame` 仍能追到新路径上。下面列的都是当前实际维护的位置。

## 平台前端

- [MSIME-Windows](https://github.com/metasequoiaime/MSIME-Windows)：Windows 端的完整产品。`windows/` 是注入宿主进程的 TSF C++ COM DLL，`server/` 是常驻后端，`ui/` 是自研原生 GUI 框架，`ui-html/` 是 WebView2 界面资源，`installer/` 是安装包构建流程。DLL 与 Server 仍是两个进程，只是不再是两个仓库。
- [MSIME-Apple](https://github.com/metasequoiaime/MSIME-Apple)：Apple 平台前端。macOS 使用 InputMethodKit 与 AppKit，iOS 的宿主 App 与键盘扩展正在开发中。
- [MSIME-Linux](https://github.com/metasequoiaime/MSIME-Linux)：Linux 前端，基于 IBus，另含 GTK 设置程序、剪贴板历史和屏幕键盘等桌面工具。

## 引擎与共享数据

- [MSIME-Engine](https://github.com/metasequoiaime/MSIME-Engine)：跨平台 C++ 输入引擎，三端共用。负责输入方案、候选生成、用户词典，以及各端之间的协议契约。词库源数据与构建入口在 `dictionary/`，自定义词库在 `dictionary/custom/`，辅助码在 `helpcode/`，共享语音采集在 `voice/`。

## 工具与示例

- [Google-PinyinIME-Rev](https://github.com/metasequoiaime/Google-PinyinIME-Rev)：为水杉输入法整理和修改的原 Android 谷歌拼音输入法引擎。
- [metasequoia-ime-skin-example](https://github.com/metasequoiaime/metasequoia-ime-skin-example)：候选窗皮肤的最小示例，含 `skin.toml` 配色声明、预览页和安装脚本。

## 文档与基础设施

- [MSIME-Docs](https://github.com/metasequoiaime/MSIME-Docs)：使用与开发文档。
- [.github](https://github.com/metasequoiaime/.github)：组织级公共文件，包含贡献指南、行为准则、安全策略和参与方向说明。
- [MSIME-Web](https://github.com/metasequoiaime/MSIME-Web)：水杉输入法官方网站的源代码。

## 已归档的仓库

这些仓库不再接受提交和 Issue，保留只读是为了让历史链接、已发布的 Release 和既有讨论继续可用。要改动请到括号里的位置。

- MSIME-Server（→ MSIME-Windows 的 `server/`）
- MSIME-UI（→ MSIME-Windows 的 `ui/`）
- MSIME-UiHtml（→ MSIME-Windows 的 `ui-html/`）
- MSIME-Installer（→ MSIME-Windows 的 `installer/`）
- MetasequoiaImeLog（→ MSIME-Windows 的 `log/`）
- TsfEditControl（→ MSIME-Windows 的 `experiments/tsf-edit-control/`）
- MSIME-Dict（→ MSIME-Engine 的 `dictionary/`）
- MSIME-CustomDict（→ MSIME-Engine 的 `dictionary/custom/`）
- MSIME-HelpCode（→ MSIME-Engine 的 `helpcode/`）
- MetasequoiaVoiceInput（→ MSIME-Engine 的 `voice/`）

## 参与开发

每个仓库的构建方式、依赖和开源许可可能不同，请以对应仓库中的 README 和 LICENSE 为准。

主仓的 Issue 已经按可接手程度分类：`good first issue` 是改动小且修法已写明的，`no-code` 完全不需要写代码（词库、图标、文档），`help wanted` 适合熟悉代码的人，`needs-design` 则建议先在 Issue 里讨论方案再动手。组织级的贡献约定见 [CONTRIBUTING](https://github.com/metasequoiaime/.github/blob/main/CONTRIBUTING.md)，可参与的方向见[招募开源开发者](https://github.com/metasequoiaime/.github/blob/main/RECRUITING.md)。
