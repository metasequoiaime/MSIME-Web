# 开源代码

水杉输入法由多个相互协作的开源项目组成。这里汇总与输入法有关的平台前端、引擎、词库、界面组件和早期探索项目，便于查阅、构建与参与开发。

## 平台前端

- [MSIME-Windows](https://github.com/metasequoiaime/MSIME-Windows)：Windows 前端，负责 Text Services Framework（TSF）集成，是被加载进宿主进程的 C++ COM DLL。
- [MSIME-Apple](https://github.com/metasequoiaime/MSIME-Apple)：Apple 平台前端。macOS 使用 InputMethodKit 与 AppKit，iOS 的宿主 App 与键盘扩展正在开发中。
- [MSIME-Linux](https://github.com/metasequoiaime/MSIME-Linux)：Linux 前端，基于 IBus，另含 GTK 设置程序、剪贴板历史和屏幕键盘等桌面工具。

## 引擎与后端

- [MSIME-Engine](https://github.com/metasequoiaime/MSIME-Engine)：跨平台 C++ 输入引擎，负责输入方案、候选生成和用户词典。各平台前端共用这一套。
- [MSIME-Server](https://github.com/metasequoiaime/MSIME-Server)：Windows 常驻后端，负责引擎调度、配置、词典加载，以及候选窗和悬浮工具栏的宿主窗口。

## 词库与输入方案

- [MSIME-Dict](https://github.com/metasequoiaime/MSIME-Dict)：基础词库、单字、五笔及扩展词库，以及生成词库数据库的脚本。
- [MSIME-CustomDict](https://github.com/metasequoiaime/MSIME-CustomDict)：个人自定义词库，包含自造词、人名和候选窗翻译补丁。
- [MSIME-HelpCode](https://github.com/metasequoiaime/MSIME-HelpCode)：蓝天小雨点、自然码、首右 2.0、首右 Plus、小鹤等方案的辅助码数据。
- [Google-PinyinIME-Rev](https://github.com/metasequoiaime/Google-PinyinIME-Rev)：为水杉输入法整理和修改的原 Android 谷歌拼音输入法引擎。

## 界面与功能组件

- [MSIME-UI](https://github.com/metasequoiaime/MSIME-UI)：自研的原生 GUI 框架，基于 Win32 宿主窗口与 Direct2D / DirectWrite 渲染，文本控件内置 TSF 实现。
- [MSIME-UiHtml](https://github.com/metasequoiaime/MSIME-UiHtml)：现行 WebView2 界面资源，包含候选窗、悬浮工具栏、托盘菜单和设置页的 HTML、CSS 与 JavaScript。
- [MetasequoiaVoiceInput](https://github.com/metasequoiaime/MetasequoiaVoiceInput)：水杉记言语音输入模块，也可以作为独立的语音输入工具使用。
- [MetasequoiaImeLog](https://github.com/metasequoiaime/MetasequoiaImeLog)：输入法各模块共用的日志组件。
- [metasequoia-ime-skin-example](https://github.com/metasequoiaime/metasequoia-ime-skin-example)：候选窗皮肤的最小示例，含 `skin.toml` 配色声明、预览页和安装脚本。

## 文档、打包与基础设施

- [MSIME-Docs](https://github.com/metasequoiaime/MSIME-Docs)：使用与开发文档。
- [.github](https://github.com/metasequoiaime/.github)：组织级公共文件，包含贡献指南、行为准则、安全策略和参与方向说明。
- [msime-installer](https://github.com/metasequoiaime/msime-installer)：Windows 安装包的构建流程，涵盖产物收集、签名与 Inno Setup 打包。
- [MSIME-Web](https://github.com/metasequoiaime/MSIME-Web)：水杉输入法官方网站的源代码。

## 早期与实验项目

- [Metasequoia-n-gram](https://github.com/metasequoiaime/Metasequoia-n-gram)：用于收集词汇、处理语料并构建输入法 n-gram 数据的项目。
- [TsfEditControl](https://github.com/metasequoiaime/TsfEditControl)：基于 Win32 TSF 的编辑控件实验，涵盖组合串显示、候选框定位和基础编辑逻辑。
- [pinyin_cpp](https://github.com/metasequoiaime/pinyin_cpp)：全拼与双拼候选查询的 C++ 早期原型，基于 SQLite 词库。
- [pinyin_python](https://github.com/metasequoiaime/pinyin_python)：拼音切分与候选查询的 Python 早期原型。
- [FullIME](https://github.com/fanlusky/FullIME)：早期基于 Windows Hook、Direct2D 和 DirectWrite 实现的 Windows 输入法实验项目。

## 参与开发

每个仓库的构建方式、依赖和开源许可可能不同，请以对应仓库中的 README 和 LICENSE 为准。

主仓的 Issue 已经按可接手程度分类：`good first issue` 是改动小且修法已写明的，`no-code` 完全不需要写代码（词库、图标、文档），`help wanted` 适合熟悉代码的人，`needs-design` 则建议先在 Issue 里讨论方案再动手。组织级的贡献约定见 [CONTRIBUTING](https://github.com/metasequoiaime/.github/blob/main/CONTRIBUTING.md)，可参与的方向见[招募开源开发者](https://github.com/metasequoiaime/.github/blob/main/RECRUITING.md)。
