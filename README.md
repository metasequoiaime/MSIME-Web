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

## 官网需求上报

`/feedback/` 无需 GitHub 登录，按 Windows / Apple / Linux / 公共引擎 / 文档 / 官网分流到组织内对应仓库。前后端共用 `shared/feedback.ts` 的校验与 Issue 模板。提交内容公开；可选填 QQ 号码及昵称、微信、GitHub 用户名和 Email，填写的联系方式也会公开；防机器人验证使用 Turnstile。

继续使用现有 Cloudflare Pages Git 集成，构建命令和 `dist` 输出目录不变。根目录 `functions/api/feedback.ts` 提供 `/api/feedback`，`public/_routes.json` 只让此接口进入 Functions。不要将 GitHub 凭据放入任何 `VITE_*` 环境变量或前端代码。

在现有 Pages 项目的生产环境设置以下运行时变量，再通过正常 PR 发布：

| 变量 | 用途 |
| --- | --- |
| `FEEDBACK_ORIGIN` | 允许提交的完整站点 origin，生产为 `https://msime.app`（无末尾斜杠） |
| `TURNSTILE_SITE_KEY` | Managed Turnstile widget 的公开 site key，域名包含 `msime.app` |
| `TURNSTILE_SECRET` | 对应 widget 的 secret，作为 Pages secret 保存 |
| `GITHUB_ISSUES_TOKEN` | 专用 fine-grained token，作为 Pages secret 保存；仅授权 MSIME-Windows、MSIME-Apple、MSIME-Linux、MSIME-Engine、MSIME-Docs、MSIME-Web 的 Issues: write 权限 |

凭据所属账号需要有对应仓库权限，组织需批准 token（如适用），六个仓库需开启 Issues。Issue 作者是该凭据对应账号。缺少配置时接口返回 503，表单禁用提交；预览域名与 origin 不符时返回 403。生产凭据不要配置到预览环境。

`pnpm dev` / `pnpm preview` 只提供静态站，不执行 Pages Functions。联调需在安装 Wrangler 后运行 `pnpm build` 和 `wrangler pages dev dist`，在被忽略的 `.dev.vars` 中设置本地专用配置（origin 与本地地址完全一致）。使用测试凭据与测试目标环境；不要通过关闭服务端验证来调试。`pnpm test` 包含模拟 GitHub / Turnstile 的路由、模板、校验和失败场景测试，不会发布真实 Issue。

上线验收：确认生产域名的验证组件可用；经维护者同意提交一条明确标注的测试需求，核对目标仓库和格式；重放同一个验证 token 应被拒绝。网络中断或 GitHub 5xx 不会自动重试写操作，页面提示先查看已有 Issue，防止重复创建。

实现依据：[Pages Functions 路由](https://developers.cloudflare.com/pages/functions/routing/)、[Turnstile 服务端校验](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)、[GitHub 创建 Issue API](https://docs.github.com/en/rest/issues/issues#create-an-issue)。
