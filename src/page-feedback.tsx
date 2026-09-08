import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { contactFields, feedbackSchema, formatIssue, targets } from "../shared/feedback";
import type { Feedback } from "../shared/feedback";
import { usePageMeta } from "./page-meta";
import { markdown } from "./markdown";
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
const emptyForm: Feedback = { target: "windows", title: "", background: "", expected: "", environment: "", extra: "", qq: "", qqNickname: "", wechat: "", github: "", email: "", consent: true };
const textFields = [
  { name: "background", label: "使用场景与问题", hint: "你在什么情况下遇到不便？目前是如何处理的？", required: true, max: 3000 },
  { name: "expected", label: "期望行为", hint: "希望增加或改进什么？可以举一个具体例子。", required: true, max: 3000 },
  { name: "environment", label: "使用环境与版本", hint: "例如 Windows 11、输入法版本、使用的应用。", required: false, max: 500 },
  { name: "extra", label: "补充说明", hint: "相关链接、替代方案或其他需要说明的内容。", required: false, max: 3000 },
] as const;

// 将共享规则接入浏览器约束校验，空白、长度和联系方式格式与服务端保持一致。
function validateField(event: FormEvent<HTMLFormElement>) {
  const field = event.target;
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement)) return;
  if (!Object.hasOwn(feedbackSchema.shape, field.name)) return;
  const value = field instanceof HTMLInputElement && field.type === "checkbox" ? field.checked : field.value;
  const result = feedbackSchema.shape[field.name as keyof Feedback].safeParse(value);
  field.setCustomValidity(result.success ? "" : result.error.issues[0].message);
}

export function FeedbackPage() {
  usePageMeta("需求上报 | 水杉输入法", "提交功能需求，自动分流到对应的 GitHub 仓库。");
  const [form, setForm] = useState<Feedback>(emptyForm);
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
        const config = await response.json();
        if (!response.ok || typeof config.siteKey !== "string") throw new Error(config.error || "需求上报暂未开放，请稍后再试。");
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || issueUrl) return;
    setError("");
    setUncertainUrl("");
    const result = feedbackSchema.safeParse({ ...form, consent });
    if (!result.success) { setError(result.error.issues[0].message); return; }
    if (!token) { setError("请先完成验证。"); return; }
    submitting.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, token }), signal: AbortSignal.timeout(45_000),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.uncertain) setUncertainUrl(`https://github.com/metasequoiaime/${targets[form.target].repo}/issues`);
        throw new Error(data.error || "提交失败，请稍后再试。");
      }
      const expectedPrefix = `https://github.com/metasequoiaime/${targets[form.target].repo}/issues/`;
      if (typeof data.url !== "string" || !data.url.startsWith(expectedPrefix) || !/^\d+$/.test(data.url.slice(expectedPrefix.length))) throw new Error("无法确认 Issue 地址，请查看目标仓库。");
      setIssueUrl(data.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "提交失败，请稍后再试。");
      // 网络中断时无法判断 GitHub 是否已创建；保留表单并提供查重入口。
      if (reason instanceof TypeError || (reason instanceof DOMException && ["TimeoutError", "AbortError"].includes(reason.name))) {
        setError("网络中断，无法确认提交结果。请先查看最新 Issue，确认未创建后再提交。");
        setUncertainUrl(`https://github.com/metasequoiaime/${targets[form.target].repo}/issues`);
      }
    } finally {
      setToken("");
      if (widgetId.current !== undefined) window.turnstile?.reset(widgetId.current);
      setBusy(false);
      submitting.current = false;
    }
  }

  const previewIssue = formatIssue(form);

  return (
    <main className="content-page feedback-page">
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
          <form className="card feedback-form" onSubmit={submit} onChange={validateField} onBlur={validateField} onInvalid={validateField}>
            <fieldset disabled={busy}>
              <legend>需求详情</legend>
              <label>需求归属
                <select name="target" required value={form.target} onChange={event => setForm({ ...form, target: feedbackSchema.shape.target.parse(event.target.value) })}>
                  {Object.entries(targets).map(([key, target]) => <option key={key} value={key}>{target.label}</option>)}
                </select>
              </label>
              <p className="feedback-hint">不确定归属时，选择你使用的平台。</p>
              <label>需求标题 <span className="feedback-required" aria-hidden="true">*</span>
                <input name="title" value={form.title} minLength={5} maxLength={100} required placeholder="一句话概括你希望改进的功能" onChange={event => setForm({ ...form, title: event.target.value })} />
              </label>
              {textFields.map(field => <label key={field.name}>{field.label}{field.required && <span className="feedback-required" aria-hidden="true"> *</span>}
                <textarea name={field.name} value={form[field.name]} required={field.required} minLength={field.required ? 10 : undefined} maxLength={field.max} rows={field.name === "environment" ? 2 : 4} placeholder={field.hint} onChange={event => setForm({ ...form, [field.name]: event.target.value })} />
              </label>)}
              <section className="feedback-contacts">
                <h2>联系方式</h2>
                <p className="feedback-hint">方便维护者进一步了解需求，可填写任意一项或全部留空。填写的联系方式会随 Issue 公开，请只提供愿意公开的账号。</p>
                <div className="feedback-contact-grid">
                  {contactFields.map(field => <label key={field.name}>{field.label}
                    <input name={field.name} type={field.type} value={form[field.name]} maxLength={field.max} placeholder={field.placeholder} autoCapitalize="none" spellCheck={false} onChange={event => setForm({ ...form, [field.name]: event.target.value })} />
                  </label>)}
                </div>
              </section>
              <details className="feedback-preview">
                <summary>预览将要提交的 Issue</summary>
                <article className="feedback-issue">
                  <h2 className="feedback-issue-title">{previewIssue.title}</h2>
                  {/* biome-ignore lint/security/noDangerouslySetInnerHtml: markdown-it 禁用 HTML 透传并校验链接协议，用户输入按 Markdown 渲染 */}
                  <div className="feedback-issue-body" dangerouslySetInnerHTML={{ __html: markdown.render(previewIssue.body) }} />
                </article>
              </details>
              <label className="feedback-consent"><input name="consent" type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} /><span>我同意将以上内容及自愿填写的联系方式公开发布到 GitHub，确认不包含密码、令牌或其他不愿公开的信息。</span></label>
            </fieldset>
            <div className="feedback-verification"><div ref={widget} /><p className="feedback-hint" role="status">{status}</p>
              {!token && widgetId.current !== undefined && <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { if (widgetId.current !== undefined) window.turnstile?.reset(widgetId.current); }}>重新验证</button>}
            </div>
            {error && <p className="feedback-error" role="alert">{error}</p>}
            {uncertainUrl && <p><a href={uncertainUrl} target="_blank" rel="noreferrer">先查看最新 Issue ↗</a></p>}
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "正在提交…" : "提交需求"}</button>
          </form>
          <aside className="card feedback-aside">
            <p className="feedback-kicker">提交到</p><h2>{targets[form.target].label}</h2>
            <a href={`https://github.com/metasequoiaime/${targets[form.target].repo}/issues`} target="_blank" rel="noreferrer">{targets[form.target].repo} ↗</a>
            <hr /><h3>一个具体的场景，更容易推进</h3>
            <p>说清楚遇到的问题、目前的做法，以及你希望的结果。提交前也可以查看已有 Issue，避免重复需求。</p>
            <h3>提交之后</h3><p>页面会显示 Issue 链接。维护者将在对应仓库讨论、评估并跟进；提交并不代表已经排入开发计划。</p>
            <h3>隐私与安全</h3><p>表单内容会公开。安全漏洞请按 <a href="https://github.com/metasequoiaime/.github/blob/main/SECURITY.md" target="_blank" rel="noreferrer">安全策略</a> 私下报告。</p>
          </aside>
        </div>}
      </div>
    </main>
  );
}
