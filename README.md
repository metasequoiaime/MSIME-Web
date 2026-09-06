# Metasequoia IME Website

<!-- badges:start -->
[![CI](https://img.shields.io/github/actions/workflow/status/metasequoiaime/MSIME-Web/ci.yml?branch=main&label=CI)](https://github.com/metasequoiaime/MSIME-Web/actions/workflows/ci.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/metasequoiaime/MSIME-Web/codeql.yml?branch=main&label=CodeQL)](https://github.com/metasequoiaime/MSIME-Web/actions/workflows/codeql.yml)
[![License](https://img.shields.io/github/license/metasequoiaime/MSIME-Web)](LICENSE)
[![Stars](https://img.shields.io/github/stars/metasequoiaime/MSIME-Web?style=flat)](https://github.com/metasequoiaime/MSIME-Web/stargazers)
<!-- badges:end -->

水杉输入法网页。

## 项目首页

<https://msime.app>

## 文档

<https://msime.app/docs>

## 发布新版本

不需要手工改动。`.github/workflows/update-manifest.yml` 每 30 分钟把 `public/update.json` 同步到 [MSIME-Windows](https://github.com/metasequoiaime/MSIME-Windows/releases) 版本号最高且含有效 Windows 安装包的已发布 release，有变化才提交。官网下载页和输入法设置中的“检查更新”都会读取这份文件。

想立刻生效就手动触发一次该 workflow；发布仓也可以用 `repository_dispatch`（`event_type: update-manifest`）把它推起来。

取的是版本号最高的有效非 draft release，包含 prerelease 在内。这里不能用 `/releases/latest`，它会跳过 prerelease，而本产品目前发布的每一个 release 都是 prerelease。

## Bug 反馈 or 功能建议

提交 issue 到本项目的 [issue](https://github.com/metasequoiaime/MSIME-Web/issues) 区。

## 文档内容来源

用户指南由 MSIME-Docs 的 `guides/windows.md` 维护，本站从 `vendor/MSIME-Docs` 的固定 gitlink 读取并渲染。初始化：`git submodule update --init`；更新内容时先修改 Docs，再评审本站 gitlink 的变更。页面样式、目录和导航留在本站。

更新元数据校验拒绝草稿、无安装包、其他仓库 URL 和不支持的版本号；旧版本重新发布不会使更新通道回退。预览版本是显式支持的产品通道。运行 `node --test scripts/generate-update.test.mjs` 验证。

<!-- star-history:start -->
## Star History

<a href="https://star-history.com/#metasequoiaime/MSIME-Web&Date">
  <img src="https://api.star-history.com/svg?repos=metasequoiaime/MSIME-Web&type=Date" alt="Star History Chart" width="600">
</a>
<!-- star-history:end -->
