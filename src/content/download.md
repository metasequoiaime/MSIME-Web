# 下载水杉输入法

水杉输入法目前提供 Windows、macOS 和 Linux 三个平台的构建。三个平台各自独立发布，版本号不通用；安装前请查看对应版本的发布说明。

## Windows

适用于 Windows 10 和 Windows 11。当前最新版本：**v{{version}}**

- [GitHub Release 下载]({{releaseUrl}}) — 官方发布位置，随包附带校验值
- [阿里云盘下载](https://www.alipan.com/s/wKbWStNYVLZ)（提取码：`27qi`）— 加速镜像，国内直连更快；这是第三方网盘，项目无法控制其内容，请务必用下方的 SHA256 核对

### 安装说明

下载并运行安装程序，按照页面提示完成安装。安装完成后，可使用 `Win + Space` 切换到水杉输入法。

升级现有版本时，请先阅读该版本的 GitHub Release 说明，确认是否有额外操作要求。

#### 必备运行环境

水杉输入法的 Server 和设置程序均为 64 位程序，需要安装最新的 **Microsoft Visual C++ 2015–2022 Redistributable（x64）**。请前往[微软官方下载页面](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170)，在最新支持版本中选择 x64 架构，对应安装文件为 `vc_redist.x64.exe`。

请特别注意：`vc_redist.x86.exe` 与 `vc_redist.x64.exe` 是两套独立的运行库。即使电脑已经安装了新版 x86 运行库，也不能代替水杉输入法所需的 x64 版本。

如果安装后无法切换到水杉输入法、Server 反复退出，或者设置窗口打开后立即消失，请优先安装或修复 x64 运行库并重新启动 Windows。更多症状和排查方法请参阅[安装后无法使用或设置窗口闪退](/docs/#安装后无法使用或设置窗口闪退)。

### 安全提示

{{securityNote}}

Windows binaries are code-signed through the SignPath Foundation.

#### 核对构建来源

除了 SHA256，Windows 安装包还带有 GitHub 的构建来源证明（build provenance attestation），它能证明这个文件确实由本项目仓库的发布流水线构建，而不只是证明文件没被改动。安装 [GitHub CLI](https://cli.github.com) 后运行：

```powershell
gh attestation verify .\{{installerName}} --repo metasequoiaime/MSIME-Windows
```

通过时会打印出触发构建的工作流与 commit。这一步不需要登录，也不依赖代码签名证书。

## macOS

适用于 macOS 12 及以上，提供 Universal 构建（同时支持 Apple Silicon 与 Intel）。

- [GitHub Release 下载](https://github.com/metasequoiaime/MSIME-Apple/releases)

下载 `.pkg` 安装，或下载 `.zip` 后把输入法包放进 `~/Library/Input Methods`，再到「系统设置 → 键盘 → 文字输入 → 编辑」中启用「水杉输入法」。

当前构建**未经 Apple 公证**，文件名中带 `unsigned`。首次打开时系统会拦截，需要在「系统设置 → 隐私与安全性」中手动放行。每个版本都附带 `.sha256` 校验文件，可用 `shasum -a 256` 核对下载完整性。

macOS 版内置 Sparkle 自动更新，安装后可从输入法菜单中的「检查更新…」直接升级。

## Linux

以 IBus 输入法的形式提供，支持 x86_64 与 aarch64。

- [GitHub Release 下载](https://github.com/metasequoiaime/MSIME-Linux/releases)

每个版本提供 `.deb`、`.rpm` 和 `.tar.gz` 三种包，按发行版选择。安装后重启 IBus，再在桌面环境的输入源设置中添加「Metasequoia IME」。

Linux 包同样未经签名。Release 页面每个资产旁都显示 GitHub 计算的 SHA256，下载后可用 `sha256sum <文件名>` 核对。

## 隐私

输入法能看到你敲下的每一个键，所以装之前值得先看一眼它会不会联网。

本地转换（拼音切分、候选排序、词频学习）完全不联网。会联网的功能里，**只有云候选是装完就生效的**——它在 Windows 和 Linux 上默认开启，输入过程中会把当前正在输入的那一串拼写发给 Google 的 input-tools 服务；AI 联想、候选翻译、语音输入都要你自己填入 API token 之后才会发出任何请求。

完整的联网功能清单、各平台默认状态、以及一次全部关掉的方法，见[隐私说明](/privacy/)。
