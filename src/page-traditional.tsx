import { useQuery } from '@tanstack/react-query';
import { Outlet, useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { baseLocalePath, traditionalPath, traditionalPages } from '../shared/locales';
import { serializeJsonLd } from '../shared/site-seo';
import { renderContent } from './markdown';
import { fetchPlatforms } from './platforms-data';
import { PLATFORM_LABELS, DESKTOP_PLATFORMS, type DesktopPlatform } from './platform';
import { usePageMeta } from './page-meta';
import { questions, faqRevision } from './locales/zh-TW/faq';
import home from './locales/zh-TW/home.md?raw';
import features from './locales/zh-TW/features.md?raw';
import download from './locales/zh-TW/download.md?raw';
import feedback from './locales/zh-TW/feedback.md?raw';
import './traditional.scss';

const navigation = [['/', '首頁'], ['/features/', '功能'], ['/download/', '下載'], ['/faq/', '常見問題'], ['/feedback/', '問題與建議']] as const;
const sources: Record<string, string> = { '/': home, '/features/': features, '/download/': download, '/feedback/': feedback };

export function TraditionalShell() {
  const path = useLocation({ select: value => value.pathname });
  const base = baseLocalePath(path);
  usePageMeta();
  return <div className="traditional-site">
    <a className="skip-link" href="#site-content">跳至主要內容</a>
    <header className="container traditional-header">
      <a className="logo" href="/zh-TW/"><img src="/msime-logo.png" alt="" width="34" height="34" /><span>水杉輸入法</span></a>
      <nav aria-label="語言"><a href={base in traditionalPages ? base : '/'} hrefLang="zh-Hans" lang="zh-Hans" className="btn btn-ghost">简体中文</a><span lang="zh-Hant-TW" aria-current="true">繁體中文</span></nav>
    </header>
    <nav className="container traditional-nav" aria-label="主選單">{navigation.map(([to, label]) => <a key={to} href={traditionalPath(to)} aria-current={base === to ? 'page' : undefined}>{label}</a>)}<a href="/docs/windows/" lang="zh-Hans">使用指南（簡體）</a></nav>
    <Outlet />
    <footer className="container traditional-footer"><p>水杉輸入法 · 開源中文輸入法</p><nav aria-label="頁尾"><a href="/privacy/">隱私說明（簡體）</a><a href="/price/">價格說明（簡體）</a><a href="https://github.com/metasequoiaime">GitHub 原始碼</a><a href="/zh-TW/feedback/">問題與建議</a></nav><p>目前提供繁體中文核心頁面；使用指南與回報範本尚待翻譯。</p></footer>
  </div>;
}

function Downloads() {
  const [platform, setPlatform] = useState<DesktopPlatform>('windows');
  const query = useQuery({ queryKey: ['platforms'], queryFn: fetchPlatforms, staleTime: Infinity, retry: 1 });
  const release = query.data?.platforms[platform];
  return <section className="card traditional-download" aria-label="下載安裝套件">
    <fieldset><legend>選擇作業系統</legend><div className="btn-row">{DESKTOP_PLATFORMS.map(value => <button type="button" key={value} className={`btn ${value === platform ? 'btn-primary' : 'btn-ghost'}`} aria-pressed={value === platform} onClick={() => setPlatform(value)}>{PLATFORM_LABELS[value]}</button>)}</div></fieldset>
    {release ? <><h2>{PLATFORM_LABELS[platform]} v{release.version}</h2><p>{release.prerelease ? '公開測試版本 · ' : ''}發布日期：{release.publishedAt.slice(0, 10)} · <a href={release.releaseUrl}>發布說明</a></p><p>請依電腦架構與套件格式選擇；完整安裝方式見下方說明。</p>
      <ul className="traditional-packages">{release.downloads.map(file => <li key={file.url}><a className="btn btn-primary" href={file.url}>下載 {file.arch} · {file.name.split('.').pop()?.toUpperCase()}</a><p><code>{file.name}</code> · {(file.size / 1024 / 1024).toFixed(1)} MiB</p>{file.sha256 ? <details><summary>查看 SHA256 校驗值</summary><code>{file.sha256}</code></details> : <p>目前未取得校驗值，請查看發布頁。</p>}</li>)}</ul></> : <p role="status">{query.isPending ? '正在讀取版本資訊…' : '暫時無法讀取版本資訊，請稍後重試，或前往官方發布頁。'}</p>}
    <p><a href={`https://github.com/metasequoiaime/${{ windows: 'MSIME-Windows', macos: 'MSIME-Apple', linux: 'MSIME-Linux' }[platform]}/releases`}>查看 {PLATFORM_LABELS[platform]} 所有發布版本</a></p>
  </section>;
}

function Faq() {
  const [search, setSearch] = useState('');
  const matches = questions.filter(q => `${q.title} ${q.answer}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <>
    <script type="application/ld+json">{serializeJsonLd({ '@context': 'https://schema.org', '@type': 'FAQPage', '@id': 'https://msime.app/zh-TW/faq/#faq', mainEntity: questions.map(q => ({ '@type': 'Question', name: q.title, acceptedAnswer: { '@type': 'Answer', text: q.answer } })) })}</script>
    <h1>常見問題與疑難排解</h1><p>以下為固定版本使用指南的繁體中文排查摘要，以 Windows 為主。應用程式的設定名稱與截圖可能仍為簡體中文。歷史回報的結案狀態不代表所有版本均已修復。</p>
    <p>內容依據：MSIME-Docs 常見問題，核對日期 {faqRevision}。<a href="/faq/">查看完整說明與來源（簡體中文）</a>。</p>
    <label className="traditional-search">搜尋問題<input type="search" value={search} placeholder="例如：字型、安裝、快捷鍵" onChange={event => setSearch(event.target.value)} /></label><p role="status">找到 {matches.length} 個問題</p>
    {!matches.length && <p>請嘗試較短的關鍵字，或<button type="button" className="btn btn-ghost" onClick={() => setSearch('')}>清除搜尋</button>。</p>}
    {[...new Set(questions.map(q => q.category))].map(category => <section key={category} hidden={!matches.some(q => q.category === category)}><h2>{category}</h2>{matches.filter(q => q.category === category).map(q => <details className="card traditional-question" key={q.title}><summary>{q.title}</summary><p>{q.answer}</p><a href={q.source}>{q.source.startsWith('/zh-TW/') ? '前往回報入口' : '查看原始說明（簡體中文）'}</a></details>)}</section>)}
    <p>仍有問題？<a href="/zh-TW/feedback/">回報問題或提出建議</a>。</p>
  </>;
}

export function TraditionalPage() {
  const path = useLocation({ select: value => value.pathname });
  const base = baseLocalePath(path);
  usePageMeta();
  if (base === '/faq/') return <main id="site-content" className="container traditional-content"><Faq /></main>;
  const content = renderContent(sources[base] ?? home);
  return <main id="site-content" className="container traditional-content">
    <h1>{content.title}</h1>
    {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Reviewed local Markdown; raw HTML disabled. */}
    <div className="traditional-lead" dangerouslySetInnerHTML={{ __html: content.leadHtml }} />
    {base === '/' && <div className="btn-row traditional-home-actions"><a className="btn btn-primary" href="/zh-TW/download/">下載試用</a><a className="btn btn-ghost" href="/zh-TW/features/">查看功能</a></div>}
    {base === '/download/' && <Downloads />}
    {/* biome-ignore lint/security/noDangerouslySetInnerHtml: Reviewed local Markdown; raw HTML disabled. */}
    <article className="docs-content" dangerouslySetInnerHTML={{ __html: content.bodyHtml }} />
  </main>;
}
