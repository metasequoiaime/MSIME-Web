# Metasequoia IME Website

水杉输入法网页。

## 项目首页

<https://msime.app>

## 文档

<https://msime.app/docs>

## 发布新版本

不需要手工改动。`.github/workflows/update-manifest.yml` 每 30 分钟把 `public/update.json` 同步到 [MSIME-Windows](https://github.com/metasequoiaime/MSIME-Windows/releases) 最新的一个非 draft release，有变化才提交。官网下载页和输入法设置中的“检查更新”都会读取这份文件。

想立刻生效就手动触发一次该 workflow；发布仓也可以用 `repository_dispatch`（`event_type: update-manifest`）把它推起来。

取的是最新的非 draft release，包含 prerelease 在内。这里不能用 `/releases/latest`，它会跳过 prerelease，而本产品目前发布的每一个 release 都是 prerelease。

## Bug 反馈 or 功能建议

提交 issue 到本项目的 [issue](https://github.com/metasequoiaime/MSIME-Web/issues) 区。
