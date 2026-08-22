# 开源代码

水杉输入法由多个相互协作的开源项目组成。这里汇总与输入法有关的核心程序、功能组件、词库和早期探索项目，便于查阅、构建与参与开发。

## 当前主体

- [MetasequoiaImeTsf](https://github.com/metasequoiaime/MetasequoiaImeTsf)：水杉输入法的核心项目，负责 Windows Text Services Framework（TSF）集成。
- [MetasequoiaImeServer](https://github.com/metasequoiaime/MetasequoiaImeServer)：输入法 Server 端，负责输入算法、候选处理和窗口渲染等工作。
- [MetasequoiaImeUiHtml](https://github.com/metasequoiaime/MetasequoiaImeUiHtml)：输入法设置及相关界面的 HTML、CSS 和 JavaScript 代码。
- [MetasequoiaImeEngine](https://github.com/metasequoiaime/MetasequoiaImeEngine)：输入法引擎。

## 词库与输入方案

- [MetasequoiaImeDict](https://github.com/metasequoiaime/MetasequoiaImeDict)：水杉输入法使用的基础词库、单字、五笔及扩展词库。
- [MetasequoiaImeCustomDict](https://github.com/metasequoiaime/MetasequoiaImeCustomDict)：个人自定义词典相关项目。
- [MetasequoiaImeHelpCode](https://github.com/metasequoiaime/MetasequoiaImeHelpCode)：蓝天小雨点、自然码、首右、小鹤等方案的辅助码数据。
- [googlepinyinime-rev](https://github.com/metasequoiaime/googlepinyinime-rev)：为水杉输入法整理和修改的原 Android 谷歌拼音输入法引擎。

## 功能组件与基础设施

- [MetasequoiaVoiceInput](https://github.com/metasequoiaime/MetasequoiaVoiceInput)：水杉记言语音输入模块，也可以作为独立的语音输入工具使用。
- [MetasequoiaImeLog](https://github.com/metasequoiaime/MetasequoiaImeLog)：输入法各模块共用的日志组件。
- [Metasequoia-n-gram](https://github.com/metasequoiaime/Metasequoia-n-gram)：用于收集词汇、处理语料并构建输入法 n-gram 数据的项目。
- [metasequoiaime.github.io](https://github.com/metasequoiaime/metasequoiaime.github.io)：水杉输入法官方网站的源代码。

## 界面与 TSF 实验

- [msimeui](https://github.com/metasequoiaime/msimeui)：基于 Win32、Direct2D 和 DirectWrite 的 C++ GUI 与输入控件项目，内置 TSF 文本输入支持。
- [TsfEditControl](https://github.com/metasequoiaime/TsfEditControl)：基于 Win32 TSF 的编辑控件实验，涵盖组合串显示、候选框定位和基础编辑逻辑。

## 早期项目

- [MetasequoiaIME](https://github.com/metasequoiaime/MetasequoiaIME)：早期的水杉输入法总项目与项目索引。
- [FullIME](https://github.com/fanlusky/FullIME)：早期基于 Windows Hook、Direct2D 和 DirectWrite 实现的 Windows 输入法实验项目。

## 参与开发

每个仓库的构建方式、依赖和开源许可可能不同，请以对应仓库中的 README 和 LICENSE 为准。发现问题或希望参与开发时，可以在相应仓库提交 Issue 或 Pull Request。
