# 下载水杉输入法

水杉输入法适用于 Windows 10 和 Windows 11。安装前请查看对应版本的发布说明。

## 最新版本

当前最新版本：**v{{version}}**

- [阿里云盘下载](https://www.alipan.com/s/wKbWStNYVLZ)（提取码：`27qi`）
- [GitHub Release 下载]({{releaseUrl}})

## 安装说明

下载并运行安装程序，按照页面提示完成安装。安装完成后，可使用 `Win + Space` 切换到水杉输入法。

升级现有版本时，请先阅读该版本的 GitHub Release 说明，确认是否有额外操作要求。

### 必备运行环境

水杉输入法的 Server 和设置程序均为 64 位程序，需要安装最新的 **Microsoft Visual C++ 2015–2022 Redistributable（x64）**。请前往[微软官方下载页面](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170)，在最新支持版本中选择 x64 架构，对应安装文件为 `vc_redist.x64.exe`。

请特别注意：`vc_redist.x86.exe` 与 `vc_redist.x64.exe` 是两套独立的运行库。即使电脑已经安装了新版 x86 运行库，也不能代替水杉输入法所需的 x64 版本。

如果安装后无法切换到水杉输入法、Server 反复退出，或者设置窗口打开后立即消失，请优先安装或修复 x64 运行库并重新启动 Windows。更多症状和排查方法请参阅[安装后无法使用或设置窗口闪退](/docs/#安装后无法使用或设置窗口闪退)。

## 安全提示

安装包应带有数字签名，签署者为 **Open Source Developer LU FAN**。如果签名缺失，请勿安装。
