import { usePageSearch } from "./use-page-search";
import traditionalFaqSource from "../vendor/MSIME-Docs/guides/zh-TW/faq.md?raw";
import { LocaleLink as Link } from "./locale-link";
import { useLocale } from "./use-locale";
import { serializeJsonLd } from "../shared/site-seo";
import { useEffect, useMemo, useRef, useState } from "react";
import faqSource from "../vendor/MSIME-Docs/guides/faq.md?raw";
import { renderContent } from "./markdown";
import { PageHero } from "./page-content";
import { usePageMeta } from "./page-meta";
import { withHeadingIds } from "./toc";
import { useInternalLinks } from "./use-internal-links";
import "./faq.scss";

const platforms = ["Windows", "macOS", "Linux", "iOS", "Android"] as const;
const platformIds = ["windows", "macos", "linux", "ios", "android"] as const;
const categoryIds = ["fonts", "installation", "input", "data"] as const;

type Question = { id: string; title: string; category: string; html: string; text: string };

function readFaq(source: string, path: string) {
  const content = renderContent(source, { localePath: path });
  const holder = document.createElement("div");
  holder.innerHTML = withHeadingIds(content.bodyHtml).html;
  const questions: Question[] = [];
  let category = "";
  let current: Question | undefined;
  for (const element of Array.from(holder.children)) {
    if (element.tagName === "H2") { category = element.textContent ?? ""; current = undefined; }
    else if (element.tagName === "H3") {
      current = { id: element.id, title: element.textContent ?? "", category, html: "", text: "" };
      questions.push(current);
    } else if (current) {
      current.html += element.outerHTML;
      current.text += ` ${element.textContent ?? ""}`;
    }
  }
  return { ...content, questions, categories: [...new Set(questions.map(question => question.category))] };
}

export function FaqPage() {
  const { t, tw, path } = useLocale();
  usePageMeta("常见问题 Q&A | 水杉输入法", "水杉输入法常见问题：字体方框、安装启动、快捷键、候选与翻译排查。");
  const faq = useMemo(() => readFaq(tw ? traditionalFaqSource : faqSource, path), [tw, path]);
  const { choice, get, update } = usePageSearch();
  const platformId = choice("platform", platformIds, "windows");
  const platform = platforms[platformIds.indexOf(platformId)];
  const query = get("q");
  const categoryId = choice("category", ["", ...categoryIds] as const, "");
  const category = categoryId ? faq.categories[categoryIds.indexOf(categoryId)] ?? "" : "";
  const setQuery = (value: string) => update({ q: value || undefined }, true, false);
  const setCategory = (value: string) => update({ category: categoryIds[faq.categories.indexOf(value)] }, false, false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const root = useRef<HTMLDivElement>(null);
  useInternalLinks(root);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reveal only on document or hash changes, not filtering.
  useEffect(() => {
    const revealHash = () => {
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      if (!faq.questions.some(question => question.id === id)) return;
      update({ platform: "windows", q: undefined, category: undefined }, true);
      setExpanded(previous => new Set([...previous, id]));
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    };
    revealHash();
    window.addEventListener("hashchange", revealHash);
    return () => window.removeEventListener("hashchange", revealHash);
  }, [faq]);

  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const platformQuestions = platform === "Windows" ? faq.questions : [];
  const matches = platformQuestions.filter(question => (!category || question.category === category) && words.every(word => `${question.title} ${question.text}`.toLocaleLowerCase().includes(word)));

  return <>
    {platformQuestions.length > 0 && <script type="application/ld+json">{serializeJsonLd({ "@context": "https://schema.org", "@type": "FAQPage", "@id": `https://msime.app${path}#faq`, mainEntity: platformQuestions.map(question => ({ "@type": "Question", name: question.title, acceptedAnswer: { "@type": "Answer", text: question.text.trim() } })) })}</script>}
    <PageHero kicker="使用帮助" title={t(faq.title)} leadHtml={t("先选择你使用的平台，再搜索问题或按分类查看排查步骤。")} />
    <main className="content-page faq-page">
      <div className="container" ref={root}>
        <section className="card faq-tools" aria-label={t("查找问题")}>
          <fieldset className="faq-platforms">
            <legend>{t("选择平台")}</legend>
            <div className="faq-platform-options">{platforms.map(value => <label key={value} className={platform === value ? "is-selected" : ""}><input type="radio" name="faq-platform" value={value} checked={platform === value} onChange={() => { update({ platform: platformIds[platforms.indexOf(value)], q: undefined, category: undefined }, false, false); setExpanded(new Set()); }} /><span>{value}</span></label>)}</div>
          </fieldset>
          {platformQuestions.length > 0 && <><label htmlFor="faq-search">{t("搜索常见问题")}</label>
          <input id="faq-search" type="search" placeholder={t("例如：方框、字体、设置打不开、Shift、翻译")} value={query} onChange={event => setQuery(event.target.value)} />
          <fieldset className="faq-filters" aria-label={t("问题分类")}>
            {t(["", ...faq.categories].map(value => <button key={value} type="button" className={`btn ${category === value ? "btn-primary" : "btn-ghost"}`} aria-pressed={category === value} onClick={() => setCategory(value)}>{t(value || "全部问题")}</button>))}
          </fieldset>
          <div className="faq-results">
            <p role="status">{t(query || category ? `找到 ${matches.length} 个问题` : `${platform} · 共 ${platformQuestions.length} 个问题`)}</p>
            <button type="button" className="btn btn-ghost" disabled={!matches.length} onClick={() => setExpanded(previous => matches.every(question => previous.has(question.id)) ? new Set([...previous].filter(id => !matches.some(question => question.id === id))) : new Set([...previous, ...matches.map(question => question.id)]))}>{t(matches.length > 0 && matches.every(question => expanded.has(question.id)) ? "收起全部结果" : "展开全部结果")}</button>
          </div></>}
        </section>
        {t(faq.categories.map(group => {
          const items = matches.filter(question => question.category === group);
          return items.length > 0 && <section className="faq-group" key={group} aria-label={t(group)}>
            <h2>{t(group)}</h2>
            {t(items.map(question => <details className="card faq-question" key={question.id} id={question.id} open={expanded.has(question.id)} onToggle={event => {
              const open = event.currentTarget.open;
              setExpanded(previous => { if (previous.has(question.id) === open) return previous; const next = new Set(previous); if (open) next.add(question.id); else next.delete(question.id); return next; });
            }}>
              <summary>{t(question.title)}</summary>
              {/* biome-ignore lint/security/noDangerouslySetInnerHtml: 正文来自 MSIME-Docs，markdown-it 禁用 HTML 透传 */}
              <div className="docs-content faq-answer" dangerouslySetInnerHTML={{ __html: question.html }} />
              <a className="faq-permalink" href={`#${question.id}`} aria-label={t(`问题链接：${question.title}`)}>{t("此问题链接 ↗")}</a>
            </details>))}
          </section>;
        }))}
        {t(platformQuestions.length > 0 && !matches.length && <section className="card faq-empty"><h2>{t("暂时没有匹配的问题")}</h2><p>{t("试试更短的关键词，或查看全部问题。")}</p><button type="button" className="btn btn-ghost" onClick={() => { update({ q: undefined, category: undefined }, false, false); }}>{t("清除筛选")}</button></section>)}
        {platformQuestions.length === 0 && <section className="card faq-empty" role="status"><h2>{t(platform === "macOS" || platform === "iOS" ? `${platform} 已开放公开测试` : `${platform} 常见问题正在整理`)}</h2><p>{t(platform === "macOS" || platform === "iOS" ? "欢迎安装体验。此平台的常见问题正在整理，遇到问题可查看使用说明或提交反馈。" : "此平台暂未整理问答。你可以先查看下方的使用入口，或提交遇到的问题。")}</p>{platform === "macOS" && <Link className="btn btn-primary" to="/download/" search={{ platform: "macos" }}>{t("下载 macOS 公开测试版")}</Link>}{platform === "iOS" && <Link className="btn btn-primary" to="/download/" search={{ platform: "ios" }}>{t("加入 iOS 公开测试")}</Link>}</section>}
        <section className="card faq-help"><h2>{t("还没找到答案？")}</h2><p>{t("遇到故障时，请带上版本号、复现步骤和截图。想增加或改进功能，也可以通过官网提交需求。")}</p><div className="btn-row">{(platform === "Windows" || platform === "macOS" || platform === "Linux") && <Link className="btn btn-ghost" to="/docs/$guide/" params={{ guide: platform.toLowerCase() }}>{t(`查看 ${platform} 指南`)}</Link>}{platform === "iOS" && <Link className="btn btn-ghost" to="/download/" search={{ platform: "ios" }}>{t("查看 iOS 公开测试说明")}</Link>}{platform === "Windows" && <a className="btn btn-ghost" href="https://github.com/metasequoiaime/MSIME-Windows/issues">{t("查看 Windows 已有反馈 ↗")}</a>}<Link className="btn btn-primary" to="/feedback/" search={{ target: platform === "macOS" || platform === "iOS" ? "apple" : platform === "Linux" ? "linux" : platform === "Windows" ? "windows" : undefined }}>{t("提交问题或建议")}</Link></div></section>
      </div>
    </main>
  </>;
}
