export const SITE_ORIGIN = "https://msime.app";
export const SITE_NAME = "水杉输入法";
export const GUIDE_NAMES = { windows: "Windows", macos: "macOS", "macos-voice": "macOS 语音", linux: "Linux" } as const;
export const seoPages: Record<string, { title: string; description: string; noindex?: boolean; canonicalPath?: string }> = {
  "/": { title: "水杉输入法 MSIME｜开源中文输入法", description: "水杉输入法（MSIME）是开源中文输入法，各平台共用 C++ 引擎。查看 Windows、macOS 和 Linux 下载、功能、使用指南与常见问题。" },
  "/features/": { title: "功能与界面｜水杉输入法", description: "查看水杉输入法的候选窗、皮肤、词库与输入功能，了解可自定义的界面和实际使用效果。" },
  "/download/": { title: "下载 Windows、macOS 与 Linux 版｜水杉输入法", description: "下载水杉输入法 Windows、macOS 和 Linux 版本，查看最新发布、安装包、签名状态与 SHA256 校验方法。" },
  "/docs/": { canonicalPath: "/docs/windows/", title: "使用文档与安装指南｜水杉输入法", description: "水杉输入法 Windows、macOS、macOS 语音与 Linux 使用指南，选择平台查看安装、配置和日常使用方法。" },
  "/faq/": { title: "常见问题与故障排查 Q&A｜水杉输入法", description: "水杉输入法常见问题与排查方法：字体方框、安装启动、快捷键、候选窗口和翻译，附相关指南及 Issue 来源。" },
  "/code/": { title: "开源仓库与贡献入口｜水杉输入法", description: "浏览水杉输入法各平台、公共引擎、输入方案、词库与文档的开源仓库，了解项目分工和贡献入口。" },
  "/about/": { title: "关于项目与开发者｜水杉输入法", description: "了解水杉输入法的项目理念、开源许可、开发者与社区联系方式。" },
  "/price/": { title: "价格与服务说明｜水杉输入法", description: "了解水杉输入法的免费功能、联网服务与费用说明，按实际需求选择使用方式。" },
  "/privacy/": { title: "隐私与联网功能说明｜水杉输入法", description: "了解水杉输入法哪些功能会联网、默认状态、数据用途，以及如何关闭联网功能。" },
  "/feedback/": { title: "问题反馈与功能建议｜水杉输入法", description: "无需 GitHub 账号，选择平台提交水杉输入法的问题或功能建议，支持截图和提交前预览。" },
  "/resume/": { title: "陆凡 | 软件工程师 / 独立开发者", description: "陆凡的软件工程师个人简历", noindex: true },
};
for (const [id, name] of Object.entries(GUIDE_NAMES)) seoPages[`/docs/${id}/`] = {
  title: `${name} 安装与使用指南｜水杉输入法`, description: `水杉输入法 ${name} 使用指南：安装、配置、输入操作与常见问题排查。内容来自官方 MSIME-Docs 文档。`,
};
export const normalizePath = (path: string) => path === "/" ? "/" : `${path.replace(/\/+$/, "")}/`;
export const markdownPath = (path: string) => path === "/" ? "/index.md" : `${normalizePath(path).slice(0, -1)}.md`;
export function pageSeo(path: string) {
  const normalized = normalizePath(path);
  const page = seoPages[normalized];
  return { ...(page ?? { title: "页面不存在｜水杉输入法", description: "这个地址没有内容，请返回首页或查看使用文档。", noindex: true }), path: normalized, canonicalPath: page?.canonicalPath ?? normalized, canonical: page ? `${SITE_ORIGIN}${page.canonicalPath ?? normalized}` : undefined };
}
export function structuredData(path: string) {
  const requested = pageSeo(path);
  const page = pageSeo(requested.canonicalPath);
  if (page.noindex || !page.canonical) return undefined;
  const organization = { "@type": "Organization", "@id": `${SITE_ORIGIN}/#organization`, name: SITE_NAME, url: `${SITE_ORIGIN}/`, logo: `${SITE_ORIGIN}/msime-logo.png`, sameAs: ["https://github.com/metasequoiaime"] };
  const graph: object[] = [organization, { "@type": "WebSite", "@id": `${SITE_ORIGIN}/#website`, url: `${SITE_ORIGIN}/`, name: SITE_NAME, alternateName: "MSIME", inLanguage: "zh-CN", publisher: { "@id": organization["@id"] } }, {
    "@type": "WebPage", "@id": `${page.canonical}#webpage`, url: page.canonical, name: page.title, description: page.description, inLanguage: "zh-CN", isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
  }];
  if (page.path === "/") graph.push({ "@type": "SoftwareApplication", "@id": `${SITE_ORIGIN}/#software`, name: SITE_NAME, alternateName: ["MSIME", "MetasequoiaIME"], applicationCategory: "UtilitiesApplication", operatingSystem: ["Windows", "macOS", "Linux"], url: `${SITE_ORIGIN}/`, downloadUrl: `${SITE_ORIGIN}/download/`, isAccessibleForFree: true, offers: { "@type": "Offer", price: 0, priceCurrency: "CNY", url: `${SITE_ORIGIN}/price/` }, license: "https://github.com/metasequoiaime/MSIME-Web/blob/main/LICENSE", publisher: { "@id": organization["@id"] } });
  if (page.path !== "/") {
    const crumbs = [{ "@type": "ListItem", position: 1, name: "首页", item: `${SITE_ORIGIN}/` }];
    if (page.path.startsWith("/docs/") && page.path !== "/docs/") crumbs.push({ "@type": "ListItem", position: 2, name: "使用文档", item: `${SITE_ORIGIN}/docs/` });
    crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name: page.title.split("｜")[0], item: page.canonical });
    graph.push({ "@type": "BreadcrumbList", itemListElement: crumbs });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replaceAll("<", "\\u003c");
