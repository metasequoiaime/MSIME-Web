import { traditionalMarkdown } from "../shared/translate";
import { useLocale } from "./use-locale";
import type { ReactNode } from "react";
import { MAX_ANSWER_LENGTH } from "../shared/feedback-templates";
import type { Answers, IssueTemplate } from "../shared/feedback-templates";
import { markdown } from "./markdown";

export function TemplateMarkdown({ source, inline = false }: { source: string; inline?: boolean }) {
  const { tw } = useLocale();
  const text = tw ? traditionalMarkdown(source) : source;
  const html = inline ? markdown.renderInline(text) : markdown.render(text);
  const Tag = inline ? "span" : "div";
  // biome-ignore lint/security/noDangerouslySetInnerHtml: markdown-it 禁用 HTML 透传并校验链接协议。
  return <Tag className="feedback-template-markdown" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function FeedbackFields({ template, answers, onChange, upload }: {
  template: IssueTemplate;
  answers: Answers;
  onChange: (id: string, value: string | string[]) => void;
  upload: (id: string) => ReactNode;
}) {
  const { t } = useLocale();
  return template.fields.map(field => {
    if (field.type === "markdown") return <div className="feedback-issue-body feedback-template-note" key={field.id}><TemplateMarkdown source={field.value} /></div>;
    const selected = Array.isArray(answers[field.id]) ? answers[field.id] as string[] : [];
    const text = typeof answers[field.id] === "string" ? answers[field.id] as string : "";
    const toggle = (label: string, checked: boolean) => onChange(field.id, checked ? [...selected, label] : selected.filter(item => item !== label));
    const id = `answer-${field.id}`;
    const hint = `${id}-hint`;
    const label = <>{t(field.label)}{t((field.required || field.options.some(option => option.required)) ? <span className="feedback-required">{t("（必填）")}</span> : <span className="feedback-optional">{t("（可选）")}</span>)}</>;
    const description = <div id={hint} className="feedback-hint">{t(field.description && <TemplateMarkdown source={field.description} />)}{t(field.type === "dropdown" && <span>{t(field.multiple ? "可选择多项" : "请选择一项")}</span>)}{t(field.type === "checkboxes" && <span>{t(field.options.some(option => option.required) ? "请逐项阅读并确认带 * 的项目" : "可选择多项，也可以跳过")}</span>)}</div>;
    if (field.type === "checkboxes" || (field.type === "dropdown" && field.multiple)) return <fieldset className="feedback-choice-field" key={field.id} data-feedback-field={field.id} aria-describedby={hint}>
      <legend>{t(label)}</legend>{t(description)}
      {t(field.options.map(option => <label className="feedback-consent feedback-option" key={option.label}>
        <input type="checkbox" checked={selected.includes(option.label)} required={field.type === "checkboxes" && option.required} onChange={event => toggle(option.label, event.target.checked)} />
        <span><TemplateMarkdown source={option.label} inline />{t(option.required && <span className="feedback-required" aria-hidden="true"> *</span>)}</span>
      </label>))}
    </fieldset>;
    if (field.type === "dropdown") return <fieldset className="feedback-choice-field" key={field.id} data-feedback-field={field.id} aria-describedby={hint}>
      <legend>{t(label)}</legend>{t(description)}
      {t(field.options.map(option => <label className="feedback-consent feedback-option" key={option.label}>
        <input type="radio" name={id} value={option.label} checked={selected[0] === option.label} required={field.required} onChange={() => onChange(field.id, [option.label])} />
        <span>{t(option.label)}</span>
      </label>))}
      {t(!field.required && selected.length > 0 && <button type="button" className="btn btn-ghost feedback-clear-choice" onClick={() => onChange(field.id, [])}>{t("清除选择")}</button>)}
    </fieldset>;
    return <div className="feedback-template-field" key={field.id} data-feedback-field={field.id}>
      <label htmlFor={field.type === "upload" ? `screenshots-${field.id}` : id}>{t(label)}</label>{t(description)}
      {t(field.type === "input" && <input id={id} value={text} maxLength={MAX_ANSWER_LENGTH} required={field.required} aria-describedby={hint} placeholder={t(field.placeholder)} onChange={event => onChange(field.id, event.target.value)} />)}
      {t(field.type === "textarea" && <textarea id={id} value={text} maxLength={MAX_ANSWER_LENGTH} rows={4} required={field.required} aria-describedby={hint} placeholder={t(field.placeholder)} onChange={event => onChange(field.id, event.target.value)} />)}
      {t(field.type === "upload" && upload(field.id))}
    </div>;
  });
}
