import { serializeJsonLd } from "../shared/site-seo";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import faqSource from "../vendor/MSIME-Docs/guides/faq.md?raw";
import { renderContent } from "./markdown";
import { PageHero } from "./page-content";
import { usePageMeta } from "./page-meta";
import { withHeadingIds } from "./toc";
import { useInternalLinks } from "./use-internal-links";
import "./faq.scss";

type Question = { id: string; title: string; category: string; html: string; text: string };

function readFaq() {
  const content = renderContent(faqSource);
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
  usePageMeta("常见问题 Q&A | 水杉输入法", "水杉输入法常见问题：字体方框、安装启动、快捷键、候选与翻译排查。");
  const faq = useMemo(readFaq, []);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const root = useRef<HTMLDivElement>(null);
  useInternalLinks(root);

  useEffect(() => {
    const revealHash = () => {
      let id: string;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      if (!faq.questions.some(question => question.id === id)) return;
      setQuery("");
      setCategory("");
      setExpanded(previous => new Set([...previous, id]));
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    };
    revealHash();
    window.addEventListener("hashchange", revealHash);
    return () => window.removeEventListener("hashchange", revealHash);
  }, [faq]);

  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = faq.questions.filter(question => (!category || question.category === category) && words.every(word => `${question.title} ${question.text}`.toLocaleLowerCase().includes(word)));

  return <>
    <script type="application/ld+json">{serializeJsonLd({ "@context": "https://schema.org", "@type": "FAQPage", "@id": "https://msime.app/faq/#faq", mainEntity: faq.questions.map(question => ({ "@type": "Question", name: question.title, acceptedAnswer: { "@type": "Answer", text: question.text.trim() } })) })}</script>
    <PageHero kicker="使用帮助" title={faq.title} leadHtml={faq.leadHtml} />
    <main className="content-page faq-page">
      <div className="container" ref={root}>
        <section className="card faq-tools" aria-label="查找问题">
          <label htmlFor="faq-search">搜索常见问题</label>
          <input id="faq-search" type="search" placeholder="例如：方框、字体、设置打不开、Shift、翻译" value={query} onChange={event => setQuery(event.target.value)} />
          <fieldset className="faq-filters" aria-label="问题分类">
            {["", ...faq.categories].map(value => <button key={value} type="button" className={`btn ${category === value ? "btn-primary" : "btn-ghost"}`} aria-pressed={category === value} onClick={() => setCategory(value)}>{value || "全部问题"}</button>)}
          </fieldset>
          <div className="faq-results">
            <p role="status">{query || category ? `找到 ${matches.length} 个问题` : `共 ${faq.questions.length} 个问题 · 以 Windows 为主`}</p>
            <button type="button" className="btn btn-ghost" disabled={!matches.length} onClick={() => setExpanded(previous => matches.every(question => previous.has(question.id)) ? new Set([...previous].filter(id => !matches.some(question => question.id === id))) : new Set([...previous, ...matches.map(question => question.id)]))}>{matches.length > 0 && matches.every(question => expanded.has(question.id)) ? "收起当前问题" : "展开当前问题"}</button>
          </div>
        </section>
        {faq.categories.map(group => {
          const items = matches.filter(question => question.category === group);
          return items.length > 0 && <section className="faq-group" key={group} aria-label={group}>
            <h2>{group}</h2>
            {items.map(question => <details className="card faq-question" key={question.id} id={question.id} open={expanded.has(question.id)} onToggle={event => {
              const open = event.currentTarget.open;
              setExpanded(previous => { if (previous.has(question.id) === open) return previous; const next = new Set(previous); if (open) next.add(question.id); else next.delete(question.id); return next; });
            }}>
              <summary>{question.title}</summary>
              {/* biome-ignore lint/security/noDangerouslySetInnerHtml: 正文来自 MSIME-Docs，markdown-it 禁用 HTML 透传 */}
              <div className="docs-content faq-answer" dangerouslySetInnerHTML={{ __html: question.html }} />
              <a className="faq-permalink" href={`#${question.id}`} aria-label={`问题链接：${question.title}`}>此问题链接 ↗</a>
            </details>)}
          </section>;
        })}
        {!matches.length && <section className="card faq-empty"><h2>暂时没有匹配的问题</h2><p>试试更短的关键词，或查看全部问题。</p><button type="button" className="btn btn-ghost" onClick={() => { setQuery(""); setCategory(""); }}>清除筛选</button></section>}
        <section className="card faq-help"><h2>还没找到答案？</h2><p>遇到故障时，请带上版本号、复现步骤和截图。想增加或改进功能，也可以通过官网提交需求。</p><div className="btn-row"><Link className="btn btn-ghost" to="/docs/$guide/" params={{ guide: "windows" }}>查看完整指南</Link><a className="btn btn-ghost" href="https://github.com/metasequoiaime/MSIME-Windows/issues">查看与反馈 Windows 问题 ↗</a><Link className="btn btn-primary" to="/feedback/">提交功能需求</Link></div></section>
      </div>
    </main>
  </>;
}
