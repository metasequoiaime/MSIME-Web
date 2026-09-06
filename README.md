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

## 本地开发

本仓库是全组织唯一不需要 C++ 工具链的仓库，只要有 Node 就能跑起来。

```sh
corepack enable
git submodule update --init   # 用户指南来自 vendor/MSIME-Docs 的固定 gitlink
pnpm install
pnpm dev                      # 开发服务器
```

其余命令：

| 命令 | 作用 |
| --- | --- |
| `pnpm run build` | `tsc` 类型检查 + 生产构建，CI 跑的就是这条 |
| `pnpm run preview` | 预览构建产物 |
| `pnpm run lint` | Biome 静态检查 |
| `pnpm test` | 校验更新元数据生成逻辑 |

Biome 只开了 linter，formatter 处于关闭状态——仓库既有代码尚未按 Biome 的风格格式化，统一格式化是一次独立的机械提交，不与功能改动混在一起。

页面是多入口静态站：每个目录下的 `index.html` 配一个 `src/<name>.ts` 入口，正文写在 `src/content/<name>.md`，由 `src/content-page.ts` 渲染。新增页面时三处都要加，并在 `vite.config.ts` 的 `input` 里登记。

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
