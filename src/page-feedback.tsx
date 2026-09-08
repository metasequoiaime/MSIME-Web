import { acceptsScreenshot, canAttach, initialAnswers, issueTemplateSchema, validateAnswers } from "../shared/feedback-templates";
import type { Answers, IssueTemplate } from "../shared/feedback-templates";
import { ScreenshotViewer } from "./screenshot-viewer";
import { FeedbackFields } from "./feedback-fields";
import { screenshotError } from "../shared/feedback-images";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { contactFields, feedbackSchema, formatIssue, targets } from "../shared/feedback";
import type { Feedback } from "../shared/feedback";
import { usePageMeta } from "./page-meta";
import { markdown } from "./markdown";
import { FeedbackResponseError, readFeedbackResponse } from "./feedback-response";
import "./feedback.scss";

type Turnstile = {
  render: (element: HTMLElement, options: { sitekey: string; action: string; size: "compact"; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }
let turnstileLoader: Promise<Turnstile> | undefined;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!turnstileLoader) {
    turnstileLoader = new Promise<Turnstile>((resolve, reject) => {
      const script = document.createElement("script");
      const timer = window.setTimeout(() => fail(), 15_000);
      const fail = () => { clearTimeout(timer); script.remove(); turnstileLoader = undefined; reject(new Error("验证组件加载失败，请刷新页面重试。")); };
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = () => {
        clearTimeout(timer);
        if (window.turnstile) resolve(window.turnstile); else fail();
      };
      script.onerror = fail;
      document.head.appendChild(script);
    });
  }
  return turnstileLoader;
}
const emptyForm: Feedback = { target: "windows", title: "", templateId: "", templateRevision: "", answers: {}, screenshotFields: [], qq: "", qqNickname: "", wechat: "", github: "", email: "", consent: true };
type LocalScreenshot = { id: string; field: string; file: File; url: string };
type Draft = { title: string; answers: Answers; screenshots: LocalScreenshot[] };

export function FeedbackPage() {
  usePageMeta("需求上报 | 水杉输入法", "提交功能需求，自动分流到对应的 GitHub 仓库。");
  const [form, setForm] = useState<Feedback>(emptyForm);
  const [screenshots, setScreenshots] = useState<LocalScreenshot[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const previewBody = useRef<HTMLDivElement>(null);
  const [screenshotsEnabled, setScreenshotsEnabled] = useState<boolean | null>(null);
  const [readingImages, setReadingImages] = useState(false);
  const [imageError, setImageError] = useState("");
  const [catalog, setCatalog] = useState<{ target: string; templates: IssueTemplate[] }>({ target: "", templates: [] });
  const [templateError, setTemplateError] = useState("");
  const [templateLoading, setTemplateLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const drafts = useRef<Record<string, Draft>>({});
  const template = catalog.target === form.target ? catalog.templates.find(item => item.id === form.templateId) : undefined;
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("正在加载提交验证…");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [issueUrl, setIssueUrl] = useState("");
  const [uncertainUrl, setUncertainUrl] = useState("");
  const widget = useRef<HTMLDivElement>(null);
  const successPanel = useRef<HTMLElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const submitting = useRef(false);

  const saveDraft = () => {
    if (form.templateId) drafts.current[`${form.target}:${form.templateId}`] = { title: form.title, answers: form.answers, screenshots };
  };
  function chooseTemplate(next: IssueTemplate, target = form.target) {
    const draft = drafts.current[`${target}:${next.id}`];
    const answers = initialAnswers(next);
    if (draft) for (const field of next.fields) {
      const value = draft.answers[field.id];
      if ((field.type === "input" || field.type === "textarea") && typeof value === "string") answers[field.id] = value;
      else if ((field.type === "dropdown" || field.type === "checkboxes") && Array.isArray(value)) answers[field.id] = value.filter(item => field.options.some(option => option.label === item));
    }
    setForm(previous => ({ ...previous, target, title: draft?.title ?? next.title, templateId: next.id, templateRevision: next.revision, answers }));
    setScreenshots((draft?.screenshots ?? []).map(image => ({ ...image, field: image.field && !next.fields.some(field => field.id === image.field && acceptsScreenshot(field, image.file.type)) ? "" : image.field })));
    setError("");
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: 只在仓库或刷新次数变化时加载，模板选择与输入不触发请求。
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setTemplateLoading(true);
    setTemplateError("");
    async function load() {
      try {
        const response = await fetch(`/api/feedback-templates?target=${form.target}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(25_000)]) });
        const data = await readFeedbackResponse(response, "模板服务暂不可用，请重新加载，或前往 GitHub 提交。");
        if (!response.ok) throw new Error(data.error || "无法读取仓库模板。");
        const templates = issueTemplateSchema.array().min(1).parse(data.templates);
        if (!active) return;
        setCatalog({ target: form.target, templates });
        chooseTemplate(templates.find(item => item.id === form.templateId) ?? templates[0], form.target);
      } catch (reason) {
        if (active) setTemplateError(reason instanceof Error ? reason.message : "无法读取仓库模板。");
      } finally { if (active) setTemplateLoading(false); }
    }
    void load();
    return () => { active = false; controller.abort(); };
    // 只在切换仓库或手动刷新时加载；输入和切换 Tab 不重新请求模板。
  }, [form.target, reload]);

  useEffect(() => {
    if (issueUrl) {
      successPanel.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [issueUrl]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function setup() {
      try {
        const response = await fetch("/api/feedback", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]) });
        const config = await readFeedbackResponse(response, "提交服务暂不可用，请稍后刷新重试。");
        if (!response.ok || typeof config.siteKey !== "string") throw new Error(config.error || "需求上报暂未开放，请稍后再试。");
        if (active) setScreenshotsEnabled(config.screenshotsEnabled === true);
        const api = await loadTurnstile();
        if (!active || !widget.current) return;
        widgetId.current = api.render(widget.current, {
          sitekey: config.siteKey,
          action: "feedback",
          size: "compact",
          callback: value => { if (active) { setToken(value); setStatus("验证通过，可以提交。"); } },
          "expired-callback": () => { if (active) { setToken(""); setStatus("验证已过期，请重新验证。"); } },
          "error-callback": () => { if (active) { setToken(""); setStatus("验证失败，请检查网络后重新验证。"); } },
        });
        setStatus("请完成下方验证。");
      } catch (reason) {
        if (active) setScreenshotsEnabled(previous => previous ?? false);
        if (active) setStatus(reason instanceof Error && reason.message !== "Unexpected end of JSON input" && !reason.message.startsWith("Unexpected token") ? reason.message : "提交服务暂不可用，请稍后刷新重试。");
      }
    }
    void setup();
    return () => {
      active = false;
      controller.abort();
      if (widgetId.current !== undefined) window.turnstile?.remove(widgetId.current);
      widgetId.current = undefined;
    };
  }, []);

  async function addScreenshots(files: File[], field = "") {
    const targetField = template?.fields.find(item => item.id === field);
    if (field && (!targetField || files.some(file => !acceptsScreenshot(targetField, file.type)))) { setImageError("该字段不接受此截图格式。"); return; }
    const invalid = screenshotError([...screenshots.map(item => item.file), ...files]);
    if (invalid) { setImageError(invalid); return; }
    setImageError("");
    setReadingImages(true);
    try {
      const added = await Promise.all(files.map(file => new Promise<LocalScreenshot>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ id: crypto.randomUUID(), field, file, url: String(reader.result) });
        reader.onerror = () => reject(new Error("截图读取失败，请重新选择。"));
        reader.readAsDataURL(file);
      })));
      setScreenshots(previous => [...previous, ...added]);
    } catch { setImageError("截图读取失败，请重新选择。"); }
    finally { setReadingImages(false); }
  }

  function showValidation(message: string, selector: string) {
    setError(message);
    setTab("edit");
    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(selector);
      const details = element?.closest("details");
      if (details) details.open = true;
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || readingImages || issueUrl) return;
    setError("");
    setUncertainUrl("");
    if (!template || templateLoading || templateError) { setError("请先加载仓库模板。"); return; }
    const result = feedbackSchema.safeParse({ ...form, consent, screenshotFields: screenshots.map(image => image.field) });
    if (!result.success) {
      const issue = result.error.issues[0];
      const name = String(issue.path[0]);
      const field = ["title", "consent", ...contactFields.map(item => item.name)].includes(name) ? name : "title";
      showValidation(issue.message, `[name="${field}"]`);
      return;
    }
    const invalidAnswers = validateAnswers(template, result.data.answers, result.data.screenshotFields);
    if (form.title.trim() === template.title.trim()) { showValidation("请补充需求标题。", '[name="title"]'); return; }
    if (invalidAnswers) {
      const invalidField = template.fields.find(field => validateAnswers({ ...template, fields: [field] }, form.answers[field.id] === undefined ? {} : { [field.id]: form.answers[field.id] }, screenshots.filter(image => image.field === field.id).map(image => image.field)));
      showValidation(invalidAnswers, invalidField ? `[data-feedback-field="${invalidField.id}"] input:not([type="file"]), [data-feedback-field="${invalidField.id}"] textarea, [data-feedback-field="${invalidField.id}"] button` : '[name="title"]');
      return;
    }
    if (!token) { showValidation("请先完成提交验证。", ".feedback-verification"); return; }
    submitting.current = true;
    setBusy(true);
    try {
      const body = new FormData();
      body.set("payload", JSON.stringify({ ...result.data, token }));
      screenshots.forEach(({ file }) => { body.append("screenshots", file); });
      const response = await fetch("/api/feedback", {
        method: "POST", body, signal: AbortSignal.timeout(60_000),
      });
      const data = await readFeedbackResponse(response, "无法确认提交结果，请先查看最新 Issue。");
      if (!response.ok) {
        if (data.templateChanged) {
          saveDraft();
          const updated = issueTemplateSchema.array().min(1).safeParse(data.templates);
          if (updated.success) {
            setCatalog({ target: form.target, templates: updated.data });
            chooseTemplate(updated.data.find(item => item.id === form.templateId) ?? updated.data[0]);
            setTemplateError("");
          } else setTemplateError("仓库模板已更新，请重新加载模板并核对内容后提交。");
          setTab("edit");
        }
        if (data.uncertain) setUncertainUrl(`https://github.com/metasequoiaime/${targets[form.target].repo}/issues`);
        throw new Error(data.error || "提交失败，请稍后再试。");
      }
      const expectedPrefix = `https://github.com/metasequoiaime/${targets[form.target].repo}/issues/`;
      if (typeof data.url !== "string" || !data.url.startsWith(expectedPrefix) || !/^\d+$/.test(data.url.slice(expectedPrefix.length))) throw new FeedbackResponseError("无法确认 Issue 地址，请查看目标仓库。");
      setIssueUrl(data.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提交失败，请稍后再试。");
      // 网络中断时无法判断 GitHub 是否已创建；保留表单并提供查重入口。
      if (reason instanceof FeedbackResponseError || reason instanceof TypeError || (reason instanceof DOMException && ["TimeoutError", "AbortError"].includes(reason.name))) {
        setError("未收到有效的提交结果。请先查看最新 Issue，确认未创建后再提交。");
        setUncertainUrl(`https://github.com/metasequoiaime/${targets[form.target].repo}/issues`);
      }
    } finally {
      setToken("");
      if (widgetId.current !== undefined) window.turnstile?.reset(widgetId.current);
      setBusy(false);
      submitting.current = false;
    }
  }

  const requiredFields = template?.fields.filter(field => field.required || field.options.some(option => option.required)) ?? [];
  const completedFields = requiredFields.filter(field => template && !validateAnswers({ ...template, fields: [field] }, form.answers[field.id] === undefined ? {} : { [field.id]: form.answers[field.id] }, screenshots.filter(image => image.field === field.id).map(image => image.field))).length;
  const titleComplete = form.title.trim().length >= 5 && form.title.trim() !== template?.title.trim();
  const previewIssue = template ? formatIssue(form, template, screenshots.map(item => ({ field: item.field, url: item.url }))) : undefined;
  const renderUpload = (field = "") => <div className="feedback-upload">
    <input id={`screenshots-${field || "general"}`} aria-label="选择截图" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden disabled={!screenshotsEnabled || busy || readingImages || screenshots.length >= 3} onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ""; void addScreenshots(files, field); }} />
    <button type="button" className="btn btn-ghost" disabled={!screenshotsEnabled || busy || readingImages || screenshots.length >= 3} onClick={() => document.getElementById(`screenshots-${field || "general"}`)?.click()}>{readingImages ? "正在读取…" : screenshots.length >= 3 ? "已选满 3 张" : "＋ 选择截图"}</button>
    <span aria-live="polite">已选 {screenshots.length} / 3 张 · 点击缩略图查看大图</span>
  </div>;
  useEffect(() => {
    const root = previewBody.current;
    if (!root || tab !== "preview" || !previewIssue?.body) return;
    const cleanups: (() => void)[] = [];
    root.querySelectorAll("img").forEach(image => {
      const screenshot = screenshots.find(item => item.url === image.getAttribute("src"));
      if (!screenshot) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "feedback-preview-image";
      button.setAttribute("aria-label", `放大查看 ${screenshot.file.name}`);
      image.replaceWith(button);
      button.append(image);
      const open = () => setSelectedScreenshot(screenshot.id);
      button.addEventListener("click", open);
      cleanups.push(() => { button.removeEventListener("click", open); button.replaceWith(image); });
    });
    return () => { cleanups.forEach(cleanup => { cleanup(); }); };
  }, [tab, previewIssue?.body, screenshots]);
  const selectTab = (value: "edit" | "preview", focus = false) => { setTab(value); if (focus) document.getElementById(`feedback-tab-${value}`)?.focus(); };

  return (
    <main className="content-page feedback-page">
      <ScreenshotViewer images={screenshots} selected={selectedScreenshot} onClose={() => setSelectedScreenshot(null)} />
      <div className="container">
        <div className="feedback-heading">
          <p className="feedback-kicker">一起改进水杉输入法</p>
          <h1>把你的需求告诉我们</h1>
          <p>描述使用场景和期望的改进。提交后，我们会按统一格式在对应仓库创建 Issue，无需 GitHub 账号。</p>
        </div>
        {issueUrl ? <section className="card feedback-success" aria-live="polite" tabIndex={-1} ref={successPanel}>
          <h2>需求已提交</h2><p>感谢你帮助水杉输入法变得更好。你可以通过 Issue 查看后续讨论和处理进展。</p>
          <a className="btn btn-primary" href={issueUrl} target="_blank" rel="noreferrer">查看已创建的 Issue ↗</a>
        </section> : <div className="feedback-layout">
          <form className="card feedback-form" onSubmit={submit} noValidate>
            <div className="feedback-tabs" role="tablist" aria-label="需求表单">
              {(["edit", "preview"] as const).map(value => <button key={value} id={`feedback-tab-${value}`} type="button" role="tab" aria-selected={tab === value} aria-controls={`feedback-panel-${value}`} tabIndex={tab === value ? 0 : -1} onClick={() => selectTab(value)} onKeyDown={event => {
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); selectTab(event.key === "Home" ? "edit" : event.key === "End" ? "preview" : tab === "edit" ? "preview" : "edit", true); }
              }}>{value === "edit" ? "填写" : "预览"}</button>)}
            </div>
            {error && <p className="feedback-error" role="alert">{error}</p>}
            <div id="feedback-panel-edit" role="tabpanel" aria-labelledby="feedback-tab-edit" hidden={tab !== "edit"}>

            <fieldset disabled={busy || readingImages}>
              <legend>1. 选择反馈对象</legend>
              <p id="feedback-target-hint" className="feedback-hint">先选你正在使用的平台。想反馈网站或文档，也可以在这里选择。</p>
              <div className="feedback-target-grid" role="radiogroup" aria-label="反馈对象" aria-describedby="feedback-target-hint">
                {Object.entries(targets).map(([key, target]) => <label className="feedback-consent feedback-option" key={key}>
                  <input type="radio" name="target" value={key} checked={form.target === key} onChange={() => { saveDraft(); setForm({ ...form, target: feedbackSchema.shape.target.parse(key), templateId: "", templateRevision: "", answers: {} }); setScreenshots([]); setImageError(""); setError(""); }} />
                  <span>{target.label}</span>
                </label>)}
              </div>
              <p className="feedback-hint">不知道“公共引擎”或“公共 API”是什么？选你的输入法平台即可，我们会协助分类。</p>
              <p className="feedback-help-link">遇到使用问题？先看看 <a href="/faq/" target="_blank" rel="noreferrer">常见问题 ↗</a>，或 <a href={`https://github.com/metasequoiaime/${targets[form.target].repo}/issues`} target="_blank" rel="noreferrer">搜索已有反馈 ↗</a>。</p>
              {templateLoading && <p className="feedback-hint" role="status">正在读取仓库模板…</p>}
              {templateError && <div className="feedback-error" role="alert"><p>{templateError}</p><button type="button" className="btn btn-ghost" onClick={() => { saveDraft(); setReload(value => value + 1); }}>重新加载模板</button><a href={`https://github.com/metasequoiaime/${targets[form.target].repo}/issues/new/choose`} target="_blank" rel="noreferrer">前往 GitHub 提交 ↗</a></div>}
              {template && !templateLoading && !templateError && <>
                <fieldset className="feedback-choice-field feedback-template-picker">
                  <legend>2. 你想反馈什么？</legend>
                  {catalog.templates.map(item => <label className="feedback-consent" key={item.id}>
                    <input type="radio" name="issue-template" value={item.id} checked={template.id === item.id} onChange={() => { saveDraft(); chooseTemplate(item); }} />
                    <span><strong>{item.name}</strong><small>{item.description}</small></span>
                  </label>)}
                </fieldset>
                <p className="feedback-hint">遇到出错、无法使用，选择问题反馈；想增加功能或改善体验，选择功能建议。</p>
                <p className="feedback-hint">切换类型会保留当前页面中的草稿，刷新或关闭页面后不会保留。</p>
                <h2 className="feedback-section-heading">3. 描述你的反馈</h2>
                <p className="feedback-hint">标注“必填”或 * 的项目必须填写，其余可以跳过。按自己的话描述即可。</p>
                <div className="feedback-progress"><span>必填内容已完成 {completedFields + Number(titleComplete)} / {requiredFields.length + 1} 项</span><progress aria-label="必填内容完成进度" value={completedFields + Number(titleComplete)} max={requiredFields.length + 1} /></div>
                <label>用一句话概括 <span className="feedback-required" aria-hidden="true">*</span><input name="title" value={form.title} minLength={5} maxLength={100} required aria-describedby="feedback-title-hint" placeholder="例如：候选字显示为方框，或希望能调整字号" onChange={event => setForm({ ...form, title: event.target.value })} /></label>
                <p id="feedback-title-hint" className="feedback-hint">写清楚哪里出了问题，或希望增加什么。5–100 个字，不用考虑技术术语。</p>
                <FeedbackFields template={template} answers={form.answers} onChange={(id, value) => setForm(previous => ({ ...previous, answers: { ...previous.answers, [id]: value } }))} upload={renderUpload} />
              </>}
              <section className="feedback-screenshots">
                <label htmlFor="screenshots-general">补充截图（可选）</label>
                <p id="screenshot-hint" className="feedback-hint">支持 PNG、JPEG、WebP，最多 3 张，每张不超过 5 MiB。截图将随 Issue 公开，请先遮挡个人信息。</p>
                {renderUpload()}
                {screenshotsEnabled === null && <p className="feedback-hint" role="status">正在检查截图上传服务…</p>}
                {screenshotsEnabled === false && <p className="feedback-hint">截图上传暂不可用，仍可提交文字需求。</p>}
                {readingImages && <p role="status">正在读取截图…</p>}
                {imageError && <p className="feedback-error" role="alert">{imageError}</p>}
                <div className="feedback-image-grid">{screenshots.map((item, index) => <figure key={item.id}>
                  <button type="button" className="feedback-thumbnail" aria-label={`放大查看 ${item.file.name}`} onClick={() => setSelectedScreenshot(item.id)}><img src={item.url} alt={`截图 ${index + 1}：${item.file.name}`} /><span>放大查看 ↗</span></button>
                  <figcaption title={item.file.name}>{item.file.name}<small>{(item.file.size / 1024 / 1024).toFixed(2)} MiB</small></figcaption>
                  <details className="feedback-image-position"><summary>调整截图位置</summary><label>截图位置<select aria-label={`截图 ${index + 1} 的位置`} value={item.field} onChange={event => setScreenshots(items => items.map(image => image.id === item.id ? { ...image, field: event.target.value } : image))}><option value="">单独的截图小节</option>{template?.fields.filter(field => canAttach(field) && acceptsScreenshot(field, item.file.type)).map(field => <option key={field.id} value={field.id}>{field.label}</option>)}</select></label></details>
                  <button type="button" className="btn btn-ghost" aria-label={`移除截图 ${index + 1}`} onClick={() => setScreenshots(items => items.filter((_, i) => i !== index))}>移除</button>
                </figure>)}</div>
              </section>
              <details className="feedback-contacts">
                <summary>留下联系方式（可选）{contactFields.some(field => form[field.name].trim()) && <span className="feedback-hint"> · 已填写</span>}</summary>
                <p className="feedback-hint">方便维护者进一步了解需求，可填写任意一项或全部留空。填写的联系方式会随 Issue 公开，请只提供愿意公开的账号。</p>
                <div className="feedback-contact-grid">
                  {contactFields.map(field => <label key={field.name}>{field.label}
                    <input name={field.name} type={field.type} value={form[field.name]} maxLength={field.max} placeholder={field.placeholder} autoCapitalize="none" spellCheck={false} onChange={event => setForm({ ...form, [field.name]: event.target.value })} />
                  </label>)}
                </div>
              </details>
            </fieldset>
            </div>
            {/* biome-ignore lint/a11y/noNoninteractiveTabindex: WAI-ARIA Tab 面板允许键盘聚焦以阅读预览正文。 */}
            <div id="feedback-panel-preview" role="tabpanel" aria-labelledby="feedback-tab-preview" hidden={tab !== "preview"} tabIndex={0}>
              {previewIssue && !templateLoading && !templateError ? <article className="feedback-issue">
                <h2 className="feedback-issue-title">{previewIssue.title || "尚未填写标题"}</h2>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: markdown-it 禁用 HTML 透传并校验链接协议。 */}
                <div ref={previewBody} className="feedback-issue-body" dangerouslySetInnerHTML={{ __html: markdown.render(previewIssue.body) }} />
              </article> : <p className="feedback-hint">请先在“填写”中加载仓库模板。</p>}
            </div>
            <h2 className="feedback-section-heading">4. 确认并提交</h2>
            <p className="feedback-hint">可以在顶部“预览”检查内容。提交成功后会获得反馈链接，方便查看处理进展。</p>
            <fieldset disabled={busy || readingImages}>
              <label className="feedback-consent"><input name="consent" type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /><span>我同意将以上文字、截图及自愿填写的联系方式公开发布到 GitHub，确认不包含密码、令牌或其他不愿公开的信息。</span></label>
            </fieldset>
            <div className="feedback-verification" tabIndex={-1}><div ref={widget} /><p className="feedback-hint" role="status">{status}</p>
              {!token && widgetId.current !== undefined && <button type="button" className="btn btn-ghost" disabled={busy || readingImages} onClick={() => { if (widgetId.current !== undefined) window.turnstile?.reset(widgetId.current); }}>重新验证</button>}
            </div>
            {uncertainUrl && <p><a href={uncertainUrl} target="_blank" rel="noreferrer">先查看最新 Issue ↗</a></p>}
            {tab === "edit" && <button className="btn btn-ghost feedback-preview-action" type="button" onClick={() => { selectTab("preview", true); document.getElementById("feedback-tab-preview")?.scrollIntoView({ block: "start", behavior: "smooth" }); }}>先预览内容</button>}
            <button className="btn btn-primary" type="submit" disabled={busy || readingImages || templateLoading || !template || Boolean(templateError)}>{busy ? "正在提交…" : "提交需求"}</button>
          </form>
          <aside className="card feedback-aside">
            <p className="feedback-kicker">提交到</p><h2>{targets[form.target].label}</h2>
            <a href={`https://github.com/metasequoiaime/${targets[form.target].repo}/issues`} target="_blank" rel="noreferrer">{targets[form.target].repo} ↗</a>
            <hr /><h3>先查常见问题</h3><p>字体方框、设置打不开或快捷键冲突？<a href="/faq/">查看常见问题 Q&A</a>，试试已有的排查办法。</p>
            <h3>一个具体的场景，更容易推进</h3>
            <p>说清楚遇到的问题、目前的做法，以及你希望的结果。提交前也可以查看已有 Issue，避免重复需求。</p>
            <h3>提交之后</h3><p>页面会显示 Issue 链接。维护者将在对应仓库讨论、评估并跟进；提交并不代表已经排入开发计划。</p>
            <h3>隐私与安全</h3><p>表单内容会公开。安全漏洞请按 <a href="https://github.com/metasequoiaime/.github/blob/main/SECURITY.md" target="_blank" rel="noreferrer">安全策略</a> 私下报告。</p>
          </aside>
        </div>}
      </div>
    </main>
  );
}
