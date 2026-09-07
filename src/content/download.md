# 下载水杉输入法

水杉输入法目前提供 Windows、macOS 和 Linux 三个平台的构建，iOS 版还在 TestFlight 内测。各平台独立发布，版本号不通用；安装前请查看对应版本的发布说明。

## Windows

适用于 Windows 10 和 Windows 11。当前最新版本：**v{{version}}**

- [GitHub Release 下载]({{releaseUrl}}) — 官方发布位置，随包附带校验值
- [阿里云盘下载](https://www.alipan.com/s/wKbWStNYVLZ)（提取码：`27qi`）— 备用镜像，访问速度因网络而异；下载后请与官方发布的 SHA256 核对

### 安装说明

下载并运行安装程序，按照页面提示完成安装。安装完成后，可使用 `Win + Space` 切换到水杉输入法。

升级现有版本时，请先阅读该版本的 GitHub Release 说明，确认是否有额外操作要求。

#### 必备运行环境

水杉输入法的 Server 和设置程序均为 64 位程序，需要安装最新的 **Microsoft Visual C++ 2015–2022 Redistributable（x64）**。请前往[微软官方下载页面](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170)，在最新支持版本中选择 x64 架构，对应安装文件为 `vc_redist.x64.exe`。

请特别注意：`vc_redist.x86.exe` 与 `vc_redist.x64.exe` 是两套独立的运行库。即使电脑已经安装了新版 x86 运行库，也不能代替水杉输入法所需的 x64 版本。

如果安装后无法切换到水杉输入法、Server 反复退出，或者设置窗口打开后立即消失，请优先安装或修复 x64 运行库并重新启动 Windows。更多症状和排查方法请参阅[安装后无法使用或设置窗口闪退](/docs/#安装后无法使用或设置窗口闪退)。

### 安全提示

{{securityNote}}

#### 核对构建来源

除了 SHA256，Windows 安装包还带有 GitHub 的构建来源证明（build provenance attestation），可用于核对文件与本项目构建工作流的关联。安装 [GitHub CLI](https://cli.github.com) 后运行：

```powershell
gh attestation verify .\{{installerName}} --repo metasequoiaime/MSIME-Windows
```

通过时会打印出触发构建的工作流与 commit。该检查与代码签名验证不同；命令的登录与网络要求请以 GitHub CLI 的提示为准。

## macOS

适用于 macOS 12 及以上。当前最新版本：**v{{macosVersion}}**，{{macosPackages}}。

- [GitHub Release 下载]({{macosReleaseUrl}}) — 官方发布位置，随包附带校验值

安装包直接双击运行；压缩包解开后把输入法包放进 `~/Library/Input Methods`，再到「系统设置 → 键盘 → 文字输入 → 编辑」中启用「水杉输入法」。

{{macosSigning}}

macOS 版内置 Sparkle 自动更新，安装后可从输入法菜单中的「检查更新…」直接升级。

## iOS

需要 iOS 15 或更高版本。iOS 的自定义键盘只能通过 App Store 或 TestFlight 安装，没有其他分发渠道，因此目前只提供 TestFlight 内测。

- [加入 TestFlight 内测](/beta/) — 用 iPhone 打开链接即可安装，不需要邮箱，也不需要开发者账号

是否上架 App Store 尚未决定：iOS 词库中包含 GPL-3.0 的第三方数据，与 App Store 条款存在冲突，需要先解决授权问题。原委见 [ios-distribution.md](https://github.com/metasequoiaime/MSIME-Apple/blob/main/docs/ios-distribution.md)。

## Linux

以 IBus 输入法的形式提供。当前最新版本：**v{{linuxVersion}}**，{{linuxPackages}}。

- [GitHub Release 下载]({{linuxReleaseUrl}}) — 官方发布位置，随包附带校验值

按发行版选择对应的包。安装后重启 IBus，再在桌面环境的输入源设置中添加「Metasequoia IME」。

{{linuxSigning}}

## 隐私

本地输入处理不需要联网。Windows 和 Linux 的云候选默认开启，可在安装或设置中关闭；AI 联想、在线翻译、语音输入与更新检查的行为因平台和设置而异。

安装前可查看[隐私说明](/privacy/)，了解发送的数据、默认设置和关闭方式。
