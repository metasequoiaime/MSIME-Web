# 陆凡

**软件工程师 / 独立开发者**

- 📱 [18627158203](tel:+8618627158203)
- 📧 [lxyfl6688@gmail.com](mailto:lxyfl6688@gmail.com)
- 🔗 [github.com/fanlusky](https://github.com/fanlusky)
- 🌐 [msime.app](https://msime.app)

---

## 个人简介

华中科技大学软件工程本科毕业，具有 **Java 后端开发、Windows 原生应用开发以及独立产品开发**经验。

曾在华为云从事后端开发工作，主要使用 Java 参与企业级业务系统的需求开发、问题处理以及相关业务逻辑实现。2024 年开始进行独立开发，将主要精力投入到 Windows 原生软件、中文输入法、语音输入以及 AI 相关工具的研发。

独立开发的 Windows 中文输入法目前已达到**完全可用**状态，在 GitHub 上获得 **350+ Stars**，并拥有众多内测用户。

目前主要使用 **C/C++、Python** 进行独立项目开发，熟悉 Windows API、TSF（Text Services Framework）、Direct2D、DirectWrite、SQLite 等 Windows 原生开发技术，并持续研究中文输入法、拼音输入、语言模型、N-gram 等相关技术。

能够独立完成从**需求设计、核心功能开发、性能优化、UI 实现、安装包制作到项目发布与维护**的完整开发流程。

---

# 教育经历

### 华中科技大学

**软件工程 · 本科**  
2023 年 6 月毕业

---

# 工作经历

### 华为云 · 后端开发

**2023.06 – 2024.05**

主要从事 Java 后端开发工作，参与企业级业务系统的需求开发、问题处理以及业务逻辑维护。

- 使用 Java 参与后端业务需求开发及问题单处理。
- 根据业务需求进行数据处理、业务逻辑实现以及相关接口开发。
- 参与商务测算相关业务模块的开发与维护。
- 参与商务数据的定级、利润测算、折扣测算等相关功能实现。
- 在实际项目中熟悉企业级软件开发流程、代码协作以及问题定位与处理流程。

### 华为云 · 后端开发实习

**2022.06 – 2022.08**

主要参与后端业务开发工作，负责商务测算相关功能。

- 根据业务数据进行商务定级及相关数据计算。
- 参与利润测算、折扣测算等业务逻辑开发。
- 熟悉 Java 后端项目的开发、调试以及企业级项目协作流程。

---

# 独立开发

### 个人独立开发者

**2024.05 – 至今**

离开全职工作后，开始进行独立软件开发，主要研究方向包括 **Windows 原生应用、中文输入法、语音输入、自然语言处理以及 AI 工具**。

目前主要使用 C/C++、Python 进行开发，并持续维护多个个人项目。

独立开发过程中，不仅负责核心代码开发，也参与项目架构设计、UI 设计、性能优化、数据处理、安装包制作、官网建设、开源项目维护等工作。

---

# 核心项目

## MetasequoiaIME —— Windows 中文输入法

**C/C++ · Windows API · TSF · Direct2D · DirectWrite · SQLite · Python**

GitHub: https://github.com/metasequoiaime/MetasequoiaImeTsf  
Website: https://msime.app

一款面向 Windows 平台的现代中文输入法项目，主要由个人独立开发，目前已达到**完全可用**状态。项目在 GitHub 上获得 **350+ Stars**，并拥有众多内测用户。

项目从 Windows 原生输入法底层开始实现，涉及输入法框架、候选窗口、词库、拼音转换以及 UI 渲染等多个部分。

### Windows 原生输入法开发

- 基于 Windows **Text Services Framework（TSF）** 开发输入法核心。
- 使用 C/C++ 实现输入法核心逻辑以及与 Windows 系统的交互。
- 研究 TSF Composition、Candidate List、Preserved Key 等输入法相关机制。
- 处理输入法与不同 Windows 应用程序之间的兼容性问题。
- 针对输入法运行环境进行进程间通信以及模块化设计。

### 候选窗口与图形渲染

候选窗口没有直接依赖传统 Windows 控件，而是使用 Windows 原生图形技术进行实现：

- 使用 **Direct2D** 进行 2D 图形绘制。
- 使用 **DirectWrite** 进行高质量文本排版与字体渲染。
- 研究 DPI Awareness、Per-Monitor DPI 等 Windows 高 DPI 机制。
- 使用分层窗口等 Windows 原生机制实现异形窗口。
- 针对候选窗口的响应速度以及渲染性能进行优化。
- 结合 Windows 11 的视觉设计，对候选窗口进行现代化 UI 设计。

### 中文词库与搜索性能

输入法词库规模约 **100 万条**，主要通过公开词库、电子词典以及个人语料进行整理和加工。

使用 Python 对原始数据进行自动化处理，包括：

- 数据清洗
- 去重
- 词频统计
- 词库格式转换
- 语料预处理
- 数据导入 SQLite

使用 SQLite 保存和查询词库，并通过索引优化查询性能。

在个人测试环境下，词库查询通常可以控制在 **毫秒级**；从用户按下按键到候选窗口展示的完整链路进行了针对性优化，以降低输入过程中的延迟。

### 输入方案与语言模型

目前支持小鹤双拼以及蓝天小雨点辅助码等输入方案，并持续研究中文拼音输入与自然语言处理相关技术。

同时研究：

- Pinyin → Han 字符转换
- Viterbi 动态规划
- N-gram Language Model
- KenLM
- 中文语料处理
- 词频与语言模型评分
- 输入法候选排序

---

## Metasequoia Voice Input —— Windows 语音输入工具

**C/C++ · Whisper.cpp · ONNX Runtime · Silero VAD · Windows API**

围绕中文输入场景开发的独立语音输入工具，用于将语音快速转换为文字并输入到当前 Windows 应用程序。

主要技术包括：

- 使用 **Whisper.cpp** 实现本地语音识别。
- 使用 Whisper 模型进行中文语音转写。
- 使用 **Silero VAD** 进行语音活动检测。
- 使用 ONNX Runtime 加载 VAD 模型。
- 使用 Windows 输入相关 API 将识别结果输入当前应用。
- 支持本地模型以及云端语音识别方案。
- 针对录音、识别、文本注入等流程进行模块化设计。

该项目与中文输入法项目形成互补，探索传统键盘输入之外的自然语言输入方式。

---

## Windows 原生 UI / 工具开发

在独立开发过程中长期研究 Windows 原生 UI 与图形技术，实际使用过：

- Windows API
- Direct2D
- DirectWrite
- WebView2
- Sciter
- DPI Awareness
- Windows 分层窗口
- Windows 11 Fluent Design 相关视觉设计

能够根据不同场景选择原生渲染、WebView 或其他 UI 技术，并针对启动速度、渲染性能以及视觉效果进行优化。

---

## Django 网页聊天室

**Python · Django · SQLite / MySQL**

个人独立开发的 Web 项目，用于学习 Python Web 开发以及 Django 框架。

主要涉及：

- Django Web 开发
- 后端路由及业务逻辑
- 数据库操作
- 前后端交互
- 用户及聊天相关功能

---

## SSM 个人博客系统

**Java · Spring Boot · Spring · MyBatis · JavaScript**

独立完成的前后端项目，用于学习 Java Web 以及 SSM 相关技术。

主要涉及：

- Spring Boot
- Spring
- MyBatis
- Java 后端开发
- 数据库设计
- REST API
- 前后端交互

---

# 专业技能

## 编程语言

- **C/C++**：长期用于 Windows 原生软件及输入法开发，熟悉 Windows API、C++17 等。
- **Python**：目前个人开发中使用频率较高，用于数据处理、工具开发、NLP 实验及自动化任务。
- **Java**：具有企业级后端开发经验，曾在华为云长期参与 Java 后端项目开发。
- **JavaScript / TypeScript**：能够进行 Web 前端及工具类应用开发。

## Windows 原生开发

- Windows API
- Text Services Framework（TSF）
- Direct2D
- DirectWrite
- WebView2
- DPI Awareness
- Windows IPC
- Windows 原生窗口及消息机制

## 数据库与数据处理

- SQLite
- MySQL
- Python 数据处理
- SQL 查询及索引优化
- 中文词库处理
- 文本数据清洗
- N-gram 语言模型

## Web / 后端

- Java
- Spring
- Spring Boot
- MyBatis
- Python
- Django
- REST API

## AI / NLP 相关

- Whisper.cpp
- ONNX Runtime
- Silero VAD
- KenLM
- N-gram Language Model
- Viterbi
- 中文拼音输入与候选排序

## 开发工具

- Git / GitHub
- CMake
- Visual Studio
- VSCode
- IntelliJ IDEA
- Neovim
- Neovide

---

# 开源与社区

长期维护个人开源项目，并通过 GitHub 进行项目发布、版本管理以及社区交流。

主要开源方向包括：

- Windows 中文输入法
- Windows 语音输入
- 中文输入相关工具
- NLP / 中文语言模型实验
- Windows 原生软件开发

熟悉从 GitHub 项目初始化、代码开发、Issue / Pull Request 管理，到 Release、安装包制作以及项目官网建设的完整开源项目流程。

---

# 技术兴趣

长期关注并实践以下方向：

- Windows 原生应用开发
- 中文输入法技术
- C/C++ 系统级开发
- 编译原理与计算机系统
- 自然语言处理
- 语言模型
- AI 应用开发
- 独立软件开发

---

# 个人特点

具有较强的独立学习和长期项目开发能力。

相比于只完成明确需求，我更喜欢从一个具体问题出发，深入研究其底层实现，并最终将其做成可以长期使用的软件。

在独立开发输入法的过程中，从 Windows TSF、候选窗口渲染、字体排版，到词库设计、语言模型、性能优化以及安装发布，很多部分都需要自行阅读资料、分析现有软件并反复实验。

我比较享受这种长期解决复杂问题的过程，也愿意持续投入时间将一个项目从“能够运行”逐渐完善到“真正可以使用”。

---

# 业余生活

### 乒乓球

长期进行乒乓球训练，曾获得公司部门乒乓球比赛冠军。

日常保持规律训练，每天通常投入约 1–2 小时进行技术训练。

我比较喜欢这种需要长期积累、持续训练才能获得进步的事情，也将这种习惯延续到了编程和独立开发中。
