# 隐私说明

输入法能看到你敲下的每一个键，所以「哪些功能会联网、默认是开还是关、怎么全部关掉」应该一眼可查，而不是散在三个仓库的文档里。这一页把三个平台的隐私说明汇总到一处，每条都能在对应仓库的 `PRIVACY.md` 和源码里核对。

## 一句话

本地转换（拼音切分、候选排序、词频学习）**完全不联网**。会联网的只有下面这张表里的功能，其中**只有云候选在 Windows 和 Linux 上是装完就生效的**，其余全部需要你自己填入 API token 才会发出任何请求。

## 哪些功能会联网

| 功能 | Windows | macOS | Linux | 数据去向 |
| --- | --- | --- | --- | --- |
| 云候选 | **默认开启** | 不提供 | **默认开启**（停顿 500 毫秒后） | `inputtools.google.com`，只发当前这一串拼写 |
| AI 候选联想 | 需自填 token | 不提供 | 默认关闭 | DeepSeek / OpenAI / SiliconFlow / Groq，按你配置的服务商 |
| 候选翻译 | 需自填凭据 | 不提供 | 默认开启，但默认走本地词典、**不联网** | Windows 用腾讯云 `tmt.tencentcloudapi.com`；Linux 仅在改成 `deeplx` 时才发出 |
| 语音输入 | 需自填 token | 需手动触发 | 默认关闭，且在独立命令里 | 你配置的转写服务；macOS 可选本地 Whisper 模型，全程不出本机 |
| 检查更新 | 仅在你点按钮时 | Sparkle，约每天一次 | 无 | Windows 读 `msime.app/update.json`；macOS 读签名 appcast |

关于「需自填 token」：这几项的配置开关出厂是 `true`，但随包的 token 是占位符，运行时会拒绝占位符——**在你填入真实 token 之前，它们不会发出任何网络请求**。

## 云候选：唯一一个装完就在联网的功能

输入过程中，当前正在输入的那一串拼写会通过 HTTPS 发给 Google 的 input-tools 服务，换回一条额外候选。Google 收到的是这串拼写、你的 IP 和常规请求元数据。**不会**发送的：已上屏的文本、词库内容、学习到的词频、设置项、任何账号数据。

关掉它：

- **Windows** — 设置 → 输入 → 云候选；或在 `%LOCALAPPDATA%\metasequoiaime\config.toml` 的 `[general]` 下写 `cloud_candidates = false`
- **Linux** — `metasequoia-ime-settings` 里取消对应勾选；或在 `config.ini` 的 `[online]` 组写 `cloud-enabled=false`

## 一次全关

想要一台完全不联网的输入法：

- **Windows** — `config.toml` 里把 `[general] cloud_candidates`、`[ai_assistant] enabled`、`[tencent_tmt] enabled`、`[voice_input] voice_input` 全部设为 `false`。更新检查本来就只在你点按钮时才跑。
- **Linux** — `config.ini` 的 `[online]` 组设 `cloud-enabled=false`，翻译服务商保持默认的 `local`，AI 与语音默认就是关闭的。
- **macOS** — 输入引擎本身不联网，不需要额外操作；如果不想要每日更新检查，在 Sparkle 的更新设置里关掉自动检查即可。

## 没有遥测

没有任何分析、遥测、崩溃上报或使用度量，也没有链接任何这类第三方 SDK。这一条可以自己复核：在 Windows 仓的 `server/`、`windows/`、`ui/`、`ui-html/`、`installer/` 目录里搜 `telemetry`、`analytics`、`sentry`、`matomo`、`posthog`、`amplitude`、`mixpanel`、`crashpad`、`breakpad`，结果为空。

## 本机数据存在哪

设置、学习到的词频、自造词、日志都只写在当前用户的目录下，仅受该账号的文件权限保护：

- **Windows** — `%LOCALAPPDATA%\metasequoiaime\`（`config.toml`、`msime_user.db`、`log\`）
- **macOS** — 系统偏好设置 + `~/Library/Application Support/metasequoiaime/`
- **Linux** — `${XDG_CONFIG_HOME:-$HOME/.config}/metasequoiaime/config.ini` 与 `${XDG_DATA_HOME:-$HOME/.local/share}/metasequoiaime/`

日志记录的是进程生命周期和错误状况，不记录输入内容。剪贴板历史三个平台都默认关闭；Linux 上即使开启，也会跳过密码管理器标记为机密的条目（识别 KeePassXC、Bitwarden、1Password、Chromium 设置的标记）。

### API token 的存放方式各平台不同

- **macOS** — 系统钥匙串
- **Linux** — 桌面 Secret Service（GNOME Keyring 或兼容实现），按服务商隔离，不写进 `config.ini`、日志或诊断信息
- **Windows** — **明文存放在 `config.toml` 里**。这一点弱于另外两个平台：任何能读到该文件的程序都能读到 token。请使用仅用于此用途的、权限受限的 token，并在备份或同步用户目录时把这个文件当作机密对待。

## 原文与核对

这一页是汇总，以各平台仓库里的原文为准。每条说法都点名了对应的配置文件与键名，可以直接对着源码核对：

- [Windows](https://github.com/metasequoiaime/MSIME-Windows/blob/main/PRIVACY.md)
- [macOS / iOS](https://github.com/metasequoiaime/MSIME-Apple/blob/main/PRIVACY.md)
- [Linux](https://github.com/metasequoiaime/MSIME-Linux/blob/main/PRIVACY.md)

水杉输入法不出售、不共享个人数据，安装和使用也不会创建任何账号。如果将来新增了会联网的功能，这份说明必须在该功能发布之前更新。

发现隐私或安全问题请按[安全策略](https://github.com/metasequoiaime/.github/blob/main/SECURITY.md)私下报告，不要提交公开 issue。
