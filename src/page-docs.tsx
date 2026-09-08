import windowsGuideTw from "../vendor/MSIME-Docs/guides/zh-TW/windows.md?raw";
import macosGuideTw from "../vendor/MSIME-Docs/guides/zh-TW/macos.md?raw";
import macosVoiceGuideTw from "../vendor/MSIME-Docs/guides/zh-TW/macos-voice.md?raw";
import linuxGuideTw from "../vendor/MSIME-Docs/guides/zh-TW/linux.md?raw";
import { LocaleLink as Link } from "./locale-link";
import { useLocale } from "./use-locale";
import { useNavigate, useSearch, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import linuxGuide from "../vendor/MSIME-Docs/guides/linux.md?raw";
import macosGuide from "../vendor/MSIME-Docs/guides/macos.md?raw";
import macosVoiceGuide from "../vendor/MSIME-Docs/guides/macos-voice.md?raw";
import windowsGuide from "../vendor/MSIME-Docs/guides/windows.md?raw";
import { renderContent } from "./markdown";
import { PageHero } from "./page-content";
import { usePageMeta } from "./page-meta";
import { linkGuideCrossReferences, useTocScrollSpy, withHeadingIds } from "./toc";
import { useInternalLinks } from "./use-internal-links";
import { TocNav } from "./toc-nav";

// The site distributes Windows, macOS and Linux builds, but this page only ever rendered the Windows guide -- the other three guides were written and sitting in the submodule unreferenced.
const GUIDES = [
  { id: "windows", label: "Windows", source: windowsGuide },
  { id: "macos", label: "macOS", source: macosGuide },
  { id: "macos-voice", label: "macOS 语音", source: macosVoiceGuide },
  { id: "linux", label: "Linux", source: linuxGuide },
] as const;


const GUIDE_IDS = GUIDES.map((guide) => guide.id);

export function DocsPage() {
  const { t, tw, path } = useLocale();
  const { platform } = useSearch({ strict: false });
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const guideId = params.guide ?? platform;
  useEffect(() => {
    if (platform && !params.guide) void navigate({ to: tw ? "/zh-TW/docs/$guide/" : "/docs/$guide/", params: { guide: platform }, search: previous => ({ ...previous, platform: undefined }), replace: true, hash: window.location.hash.slice(1) });
  }, [platform, params.guide, navigate, tw]);

  const [sidebarIsOpen, setSidebarIsOpen] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const tocRef = useRef<HTMLElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const guide = useMemo(() => GUIDES.find((candidate) => candidate.id === guideId) ?? GUIDES[0], [guideId]);
  const content = useMemo(() => {
    const translated = { windows: windowsGuideTw, macos: macosGuideTw, "macos-voice": macosVoiceGuideTw, linux: linuxGuideTw };
    const rendered = renderContent(tw ? translated[guide.id] : guide.source, { localePath: path });
    const linked = linkGuideCrossReferences(rendered.bodyHtml, GUIDE_IDS, tw ? "/zh-TW" : "");
    return { ...rendered, ...withHeadingIds(linked) };
  }, [guide, tw, path]);

  const { activeId, lockUntilScrollEnds } = useTocScrollSpy(content.toc, articleRef, tocRef, sidebarRef);
  useInternalLinks(articleRef);

  usePageMeta(guideId ? `${guide.label} 使用指南 | 水杉输入法` : "文档 | 水杉输入法", guideId ? `水杉输入法 ${guide.label} 使用指南：安装、配置、输入与常见问题排查。` : "水杉输入法 Windows、macOS、macOS 语音与 Linux 使用指南，选择平台查看安装和配置方法。");

  const closeSidebar = useCallback(() => {
    setSidebarIsOpen(false);
  }, []);

  if (guideId && !GUIDES.some(item => item.id === guideId)) return <main className="content-page"><div className="container"><h1>{t("指南不存在")}</h1><Link to="/docs/$guide/" params={{ guide: "windows" }}>{t("查看 Windows 使用指南")}</Link></div></main>;
  return (
    <>
      <PageHero kicker="文档" title={t(content.title)} leadHtml={content.leadHtml} />

      <main className="docs-page">
        <div className="container docs-shell">
          <aside className={`docs-sidebar${sidebarIsOpen ? " is-open" : ""}`} ref={sidebarRef} aria-label={t("文档导航")}>
            <button
              className="docs-toc-toggle"
              id="docs-toc-toggle"
              type="button"
              aria-expanded={sidebarIsOpen}
              onClick={() => {
                setSidebarIsOpen((open) => !open);
              }}
            >
              <span>{t("文档目录")}</span>
              <span className="docs-toc-toggle-icon" aria-hidden="true">
                <svg viewBox="0 0 12 12" focusable="false" aria-hidden="true">
                  <path d="M2.25 4.25 6 8l3.75-3.75" />
                </svg>
              </span>
            </button>

            <nav className="docs-platforms" id="docs-platforms" aria-label={t("平台")}>
              {t(GUIDES.map((candidate) => (
                <Link key={candidate.id} className={`docs-platform${candidate.id === guide.id ? " is-active" : ""}`} to="/docs/$guide/" params={{ guide: candidate.id }} aria-current={candidate.id === guide.id ? "page" : undefined}>{t(candidate.label)}</Link>
              )))}
            </nav>

            <Link className="btn btn-ghost" to="/faq/">{t("常见问题 Q&A ↗")}</Link>

            <TocNav
              entries={content.toc}
              activeId={activeId}
              tocRef={tocRef}
              onSelect={lockUntilScrollEnds}
              onNavigateNarrow={closeSidebar}
            />
          </aside>

          <article
            className="docs-content docs-article"
            id="docs-content"
            ref={articleRef}
            aria-live="polite"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: 正文来自随仓库固定的 MSIME-Docs gitlink，markdown-it 关掉了 html 透传
            dangerouslySetInnerHTML={{ __html: content.html }}
          />
        </div>
      </main>
    </>
  );
}
