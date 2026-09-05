# 开源代码

水杉输入法按公共引擎、Windows、Apple、Linux 分仓维护，平台组件在各自仓库中开发。下面的链接指向当前源码；合仓前的旧仓库已归档，保留历史与已有 Release。详细边界见[仓库架构说明](https://github.com/metasequoiaime/MSIME-Docs/blob/main/architecture/repositories.md)。

## 平台前端

- [MSIME-Windows](https://github.com/metasequoiaime/MSIME-Windows)：Windows 产品，包含 TSF DLL、常驻 Server、GUI 库、WebView 页面与安装器。
- [MSIME-Apple](https://github.com/metasequoiaime/MSIME-Apple)：Apple 平台前端。macOS 使用 InputMethodKit 与 AppKit，iOS 的宿主 App 与键盘扩展正在开发中。
- [MSIME-Linux](https://github.com/metasequoiaime/MSIME-Linux)：Linux 前端，基于 IBus，另含 GTK 设置程序、剪贴板历史和屏幕键盘等桌面工具。

## 引擎与后端

- [MSIME-Engine](https://github.com/metasequoiaime/MSIME-Engine)：跨平台 C++ 输入引擎，负责输入方案、候选生成和用户词典。各平台前端共用这一套。
- [Windows/server](https://github.com/metasequoiaime/MSIME-Windows/tree/main/server)：Windows 常驻后端，负责引擎调度、配置、词典加载，以及候选窗和悬浮工具栏的宿主窗口。

## 词库与输入方案

- [Engine/dictionary](https://github.com/metasequoiaime/MSIME-Engine/tree/main/dictionary)：基础词库、单字、五笔及扩展词库，以及生成词库数据库的脚本。
- [Engine/dictionary/custom](https://github.com/metasequoiaime/MSIME-Engine/tree/main/dictionary/custom)：个人自定义词库，包含自造词、人名和候选窗翻译补丁。
- [Engine/helpcode](https://github.com/metasequoiaime/MSIME-Engine/tree/main/helpcode)：蓝天小雨点、自然码、首右 2.0、首右 Plus、小鹤等方案的辅助码数据。
- [Google-PinyinIME-Rev](https://github.com/metasequoiaime/Google-PinyinIME-Rev)：为水杉输入法整理和修改的原 Android 谷歌拼音输入法引擎。

## 界面与功能组件

- [Windows/ui](https://github.com/metasequoiaime/MSIME-Windows/tree/main/ui)：自研的原生 GUI 框架，基于 Win32 宿主窗口与 Direct2D / DirectWrite 渲染，文本控件内置 TSF 实现。
- [Windows/ui-html](https://github.com/metasequoiaime/MSIME-Windows/tree/main/ui-html)：现行 WebView2 界面资源，包含候选窗、悬浮工具栏、托盘菜单和设置页的 HTML、CSS 与 JavaScript。
- [Engine/voice](https://github.com/metasequoiaime/MSIME-Engine/tree/main/voice)：公共语音接口、音频采集和可选本地 Whisper，也保留独立 Windows 工具。macOS 使用方式见[语音指南](https://github.com/metasequoiaime/MSIME-Docs/blob/main/guides/macos-voice.md)。
- [Windows/log](https://github.com/metasequoiaime/MSIME-Windows/tree/main/log)：输入法各模块共用的日志组件。
- [metasequoia-ime-skin-example](https://github.com/metasequoiaime/metasequoia-ime-skin-example)：候选窗皮肤的最小示例，含 `skin.toml` 配色声明、预览页和安装脚本。

## 文档、打包与基础设施

- [MSIME-Docs](https://github.com/metasequoiaime/MSIME-Docs)：使用与开发文档。
- [.github](https://github.com/metasequoiaime/.github)：组织级公共文件，包含贡献指南、行为准则、安全策略和参与方向说明。
- [Windows/installer](https://github.com/metasequoiaime/MSIME-Windows/tree/main/installer)：Windows 安装包的构建流程，涵盖产物收集、签名与 Inno Setup 打包。
- [MSIME-Web](https://github.com/metasequoiaime/MSIME-Web)：水杉输入法官方网站的源代码。

## 参与开发

每个仓库的构建方式、依赖和开源许可可能不同，请以对应仓库中的 README 和 LICENSE 为准。

主仓的 Issue 已经按可接手程度分类：`good first issue` 是改动小且修法已写明的，`no-code` 完全不需要写代码（词库、图标、文档），`help wanted` 适合熟悉代码的人，`needs-design` 则建议先在 Issue 里讨论方案再动手。组织级的贡献约定见 [CONTRIBUTING](https://github.com/metasequoiaime/.github/blob/main/CONTRIBUTING.md)，可参与的方向见[招募开源开发者](https://github.com/metasequoiaime/.github/blob/main/RECRUITING.md)。
