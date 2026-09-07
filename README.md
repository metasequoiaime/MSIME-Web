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

站点是 React + TanStack Router，但仍然多入口：每个目录下的 `index.html` 负责直接访问时的首帧、标题与分享元数据，页面本身由路由渲染。新增一页要动五处——`<name>/index.html`、`src/page-<name>.tsx`、`src/routes.tsx` 的路由、`vite.config.ts` 的 `input`、`public/sitemap.xml`。正文是散文的页面把内容写在 `src/content/<name>.md`，交给 `src/page-content.tsx` 渲染；自定义排版的页面直接写 JSX。`scripts/site-metadata.test.mjs` 会盯着 canonical、og 标签与站点地图三边不许走偏。

入口 HTML 里那段读主题的内联脚本必须逐字节照抄现有页面：CSP 不含 `unsafe-inline`，`scripts/csp-hashes.mjs` 在构建时按摘要放行，改动一个字符就会多出一条需要放行的摘要。

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

`/feedback/` 无需 GitHub 登录，按 Windows / Apple / Linux / 公共引擎 / 公共 API / 文档 / 官网分流到组织内对应仓库。前后端共用答案校验与 Issue 格式化函数；模板正文从 GitHub 仓库读取。提交内容公开；可选填 QQ 号码及昵称、微信、GitHub 用户名和 Email，填写的联系方式也会公开；防机器人验证使用 Turnstile。

继续使用现有 Cloudflare Pages Git 集成，构建命令和 `dist` 输出目录不变。根目录 `functions/api/feedback.ts` 提供 `/api/feedback`，`public/_routes.json` 仅将此接口、`/api/feedback-templates` 模板读取接口及 `/api/feedback-images/*` 截图读取路由交给 Functions。不要将 GitHub 凭据放入任何 `VITE_*` 环境变量或前端代码。

在现有 Pages 项目的生产环境设置以下运行时变量，再通过正常 PR 发布：

| 变量 | 用途 |
| --- | --- |
| `FEEDBACK_ORIGIN` | 允许提交的完整站点 origin，生产为 `https://msime.app`（无末尾斜杠） |
| `TURNSTILE_SITE_KEY` | Managed Turnstile widget 的公开 site key，域名包含 `msime.app` |
| `TURNSTILE_SECRET` | 对应 widget 的 secret，作为 Pages secret 保存 |
| `GITHUB_APP_ID` | GitHub App 设置页的 App ID |
| `GITHUB_APP_INSTALLATION_ID` | App 安装到组织后的安装 ID（安装配置页 URL 末尾数字） |
| `GITHUB_APP_PRIVATE_KEY` | App 生成的完整 PEM 私钥，保留换行，作为 Pages secret 保存；支持 GitHub 下载的 PKCS#1 和 PKCS#8 |

在组织内创建专用 GitHub App（例如 `msime-feedback`），主页填 `https://msime.app/feedback/`，关闭 Webhook，无需 OAuth 回调或 Client secret。仓库权限只选 Issues: Read and write（Metadata: Read-only 自动附带），仅允许本组织安装。生成私钥，再安装到 MSIME-Windows、MSIME-Apple、MSIME-Linux、MSIME-Engine、MSIME-Backend、MSIME-Docs、MSIME-Web 这七个仓库，仓库需开启 Issues。

Issue 作者为 App 的机器人账号（例如 `msime-feedback[bot]`）。后端在验证 Turnstile 后签发 JWT，兑换仅限本次目标仓库、Issues 写权限的一小时安装令牌，再创建 Issue；不使用用户授权令牌。旧的 `GITHUB_ISSUES_TOKEN` 已不再读取，切换后从 Pages 配置中移除；旧 PAT 若无其他用途，可在 GitHub 撤销。更新生产变量后需重新部署才能生效。

缺少配置时接口返回 503，表单禁用提交；预览域名与 origin 不符时返回 403。生产凭据不要配置到预览环境。

`pnpm dev` / `pnpm preview` 只提供静态站，不执行 Pages Functions。联调需在安装 Wrangler 后运行 `pnpm build` 和 `wrangler pages dev dist`，在被忽略的 `.dev.vars` 中设置本地专用配置（origin 与本地地址完全一致）。使用测试凭据与测试目标环境；不要通过关闭服务端验证来调试。`pnpm test` 包含模拟 GitHub / Turnstile 的路由、模板、校验和失败场景测试，不会发布真实 Issue。

上线验收：确认生产域名的验证组件可用；经维护者同意提交一条明确标注的测试需求，核对目标仓库和格式；重放同一个验证 token 应被拒绝。网络中断或 GitHub 5xx 不会自动重试写操作，页面提示先查看已有 Issue，防止重复创建。

实现依据：[Pages Functions 路由](https://developers.cloudflare.com/pages/functions/routing/)、[Turnstile 服务端校验](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)、[GitHub 创建 Issue API](https://docs.github.com/en/rest/issues/issues#create-an-issue)。

截图上传：在现有 Pages 项目生产环境添加 R2 bucket binding，变量名为 `FEEDBACK_SCREENSHOTS`，绑定一个专用截图桶后重新部署（[Pages R2 配置](https://developers.cloudflare.com/pages/functions/bindings/#r2-buckets)）。无需启用桶公开访问或添加 GitHub Contents 权限。未绑定时表单仍可提交文字，截图入口显示暂不可用；预览环境若需测试，使用独立桶及 origin。

截图与表单通过同一次 multipart 请求提交，最多 3 张 PNG/JPEG/WebP，每张 5 MiB。服务端限制请求大小、校验文件签名，完成 Turnstile 和 App 验证后写入 R2，再将同域图片 URL 嵌入 Issue。上传失败或 GitHub 明确拒绝时清理本次图片；GitHub 响应不确定时保留图片，以免已创建的 Issue 出现断图。运维清理孤立图片前须核对 Issue；已引用图片应长期保留。图片存储键为 `feedback/<随机 UUID>.<扩展名>`，不保留原文件名。

模板由 `shared/load-feedback-templates.ts` 在运行时读取目标仓库默认分支的 `.github/ISSUE_TEMPLATE/` 目录，自动发现 YAML Issue Forms；目录不存在（404）时继承组织 `.github` 仓的默认模板。显示所有可解析表单，优先选择带 `enhancement` 标签的功能建议；标题默认值、说明、字段顺序、必填项、下拉多选、确认项、标签和 Issue type 均来自仓库。`shared/feedback-templates.ts` 只定义通用表单结构和校验，不保存各仓字段副本。公开模板无需新增 GitHub App 权限；读取错误、无 YAML 模板或不支持的表单语法会显示重试及 GitHub 提交入口，不悄悄换成别的模板。

模板列表读取请求设置 5 分钟 Cloudflare 边缘缓存，提交核对跳过该缓存。目录中的 blob SHA 同时作为模板版本和精确正文的读取依据。提交只接受模板 ID、SHA 和答案；服务端重新读取模板，按权威字段校验，客户端不能自定义标签或绕过必填项。模板变化返回 409 及新定义，页面保留兼容答案和截图，要求用户检查新表单后再次提交，不自动创建 Issue。

支持 Markdown 说明、单行输入、多行输入（含 `render` 代码块）、单选/多选下拉、确认项，以及截图类型的 upload 字段。官网仍只收 PNG/JPEG/WebP 截图，遵循模板 upload 的 `accept` 限制；其他附件请在 GitHub 提交。截图可放入模板的非代码文本区或上传字段，也可单列截图小节。顶部“填写 / 预览”Tab 共用草稿，可从预览提交；切换仓库或模板的草稿保留在当前页面内存中，刷新页面会丢失。

`scripts/fixtures/feedback/` 是测试专用模板快照，运行时不读取它们。模板更新不需要修改网站代码或重新构建，只有新增尚不支持的字段类型才需要扩展通用渲染器。

## 常见问题 Q&A

`/faq/` 提供按分类筛选、全文搜索、折叠展开及问题锚点。正文唯一来源为 MSIME-Docs 的 `guides/faq.md`：一级标题和首段用于页头，二级标题作为分类，三级标题作为问答，正文使用现有安全 Markdown 渲染器。导航、页脚、文档页及需求表单提供入口。

维护时先核对 Issue 的最终回复和适用版本，区分已解决、临时处理、未确认结论；字体工具栏问题 #232 仍开放，不能标成已修复。FAQ 内容先在 Docs 合入，再将 Web 的 Docs gitlink 更新到包含 FAQ 的已合并提交，最后通过正常 PR 发布网站。仅更新 Web gitlink 不会包含 Docs 工作区里尚未提交的 FAQ 文件。

### SEO 与 AI 内容入口

`pnpm build` 先构建浏览器资源，再在 Node 中渲染同一套 React 页面，生成可直接阅读的静态 HTML；不依赖构建环境安装浏览器。交互仍由浏览器端 React 接管，下载与社区数据从仓库内已生成的 JSON 快照注入，社区运行时校验库只在取新快照时加载，后续更新仍沿用现有自动 PR 和 Pages Git 发布。

- 页面标题、描述、canonical、Open Graph、Twitter 卡片和站点结构化数据统一由 `shared/site-seo.ts` 管理，客户端换页同步更新。
- `/docs/` 直接显示 Windows 指南，canonical 指向 `/docs/windows/`，保留原有阅读体验；四份指南使用 `/docs/windows/`、`/docs/macos/`、`/docs/macos-voice/`、`/docs/linux/`。旧 `?platform=` 地址通过 Pages Function 301 跳转并保留其他参数。
- `/sitemap.xml` 从规范页面注册表生成，重复入口不列入；不伪造 `lastmod`。简历和 404 带 `noindex`，但允许爬虫读取该指令。
- `/llms.txt` 提供 AI 可读索引，`/llms-full.txt` 按规范地址去重合并公开页面正文。每个公开页面还有 `.md` 副本（首页为 `/index.md`），由静态页面的正文生成，文档（含 `/docs.md` 入口副本）附带固定 Docs commit。Markdown 响应通过 HTTP canonical 指向 HTML，并用 `noindex` 避免重复索引。
- FAQ 结构化数据来自页面实际显示的 18 条问答；软件标记依据公开价格页声明当前免费（`offers.price: 0`），不添加虚构评价或评分；无真实评价时不声称符合软件富结果资格。`llms.txt` 是社区提案，不是搜索引擎或 AI 推荐的保证。
- `public/robots.txt` 统一维护抓取策略：公开正文、静态资源和 AI Markdown 允许搜索与 AI 答案抓取，排除反馈 API；单独允许 Google-Extended 用于 Gemini 引用与训练，保留其余原 Cloudflare 训练爬虫禁用名单。Google-Extended 是用途控制令牌，没有独立 HTTP User-Agent，也不是 Google 搜索排名信号（[Google 官方说明](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended)）。
- Cloudflare 的 **Manage your robots.txt** 应关闭自动管理，避免插入与仓库策略冲突的 Google-Extended 禁用规则或全局训练禁止声明；**Block AI training bots** 保持 **Block on all pages**。robots.txt 表达抓取偏好，实际访问拦截仍由 Cloudflare 管理，不通过 User-Agent 返回不同网页内容。

构建最后自动运行 `scripts/seo-output.test.mjs`，检查静态正文、元数据、所有指南、FAQ、资源路径、站点地图、AI 内容覆盖、noindex 与旧地址跳转；也可对现有产物执行 `pnpm test:seo`。新增页面时更新注册表和路由即可，地图与 AI 文件不手动维护。

上线后可在 Google Search Console / Bing Webmaster Tools 的已有域名资源中提交 `https://msime.app/sitemap.xml`，检查抓取、canonical、索引覆盖和搜索表现。站点验证凭据不写入仓库；当前改动不声称已向未授权的外部站长账户提交。Cloudflare 自定义域名应保持搜索抓取器可访问，生产 `pages.dev` 镜像通过 301 归一到正式域名。

参考：[Google 搜索技术要求](https://developers.google.com/search/docs/essentials/technical)、[noindex 与抓取](https://developers.google.com/search/docs/crawling-indexing/block-indexing)、[OpenAI 抓取器](https://developers.openai.com/api/docs/bots)、[llms.txt 提案](https://llmstxt.org/)。


### 规范域名与首屏加载

正式域名为 `https://msime.app`。Cloudflare 账户中的 `Canonical www.msime.app to msime.app` 单条规则精确匹配 www 主机；`Canonical production Pages mirror` 批量规则引用 `msime_pages_canonical` 列表，将 `metasequoiaime.pages.dev/` 全路径 301 到正式域名。均保留路径和查询参数；镜像规则不开启 Include subdomains，PR 预览域名不受影响。域名级跳转不能写进 Pages `_redirects`。

`pnpm test:seo:live` 核验上述线上规则；它依赖网络，部署完成后执行。构建测试同时检查站内链接和面包屑都使用规范页面。

初次启动使用 TanStack Router 的 SSR 状态恢复并由 React hydrateRoot 接管静态正文；构建为当前页面生成 modulepreload，不预取其他页面。路由恢复脚本作为同源带内容哈希的资源输出，避免额外内联脚本撑大 CSP。主题在接管前保持与静态快照一致，随后在绘制前应用偏好。文档首段在静态构建时就放入页头，不依赖浏览器二次移动。

安装截图保持 Docs 原文不变，在网站渲染时使用本地 WebP、尺寸声明和响应式候选。派生文件可用 `cwebp -q 85 -resize 480 0 public/screenshots/install-finish.png -o public/screenshots/install-finish-480.webp` 和 `cwebp -q 85 public/screenshots/install-finish.png -o public/screenshots/install-finish.webp` 重建。

### 繁体中文第一阶段

- `/zh-TW/`、`/zh-TW/features/`、`/zh-TW/download/`、`/zh-TW/faq/`、`/zh-TW/feedback/` 提供台湾繁体中文核心页面，语言标记为 `zh-Hant-TW`；原简体网址保持不变。手动切换语言，不依据 IP 或浏览器语言强制跳转。
- 文案在 `src/locales/zh-TW/` 维护，按台湾用语人工整理；网页语言不改变输入法输出模式。下载仍读 `public/platforms.json`，版本、资源链接与校验值不另存一份。
- FAQ 为固定 MSIME-Docs FAQ 的繁体摘要，保留原始证据链接。`faqSourceSha256` 与产物检查要求上游 FAQ 变更后重新核对翻译，不自动转换或静默沿用旧内容。
- 第一阶段的反馈页面是繁体入口，链接至可填写繁体中文的现有简体表单；指南、价格、隐私与外部 Issue 範本未宣称已有繁体版本，链接明确标记简体。完整指南翻译留到第二阶段，并在 MSIME-Docs 维护。
- `shared/locales.ts` 统一控制已翻译网址；HTML、站点地图与客户端使用互相对应的 `hreflang`（简体、繁体、x-default），每个语言版本采用自身 canonical，并生成静态正文和 Markdown。
