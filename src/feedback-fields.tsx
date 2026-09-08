import type { ReactNode } from "react";
import { MAX_ANSWER_LENGTH } from "../shared/feedback-templates";
import type { Answers, IssueTemplate } from "../shared/feedback-templates";
import { markdown } from "./markdown";

export function TemplateMarkdown({ source, inline = false }: { source: string; inline?: boolean }) {
  const html = inline ? markdown.renderInline(source) : markdown.render(source);
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
  return template.fields.map(field => {
    if (field.type === "markdown") return <div className="feedback-issue-body feedback-template-note" key={field.id}><TemplateMarkdown source={field.value} /></div>;
    const selected = Array.isArray(answers[field.id]) ? answers[field.id] as string[] : [];
    const text = typeof answers[field.id] === "string" ? answers[field.id] as string : "";
    const toggle = (label: string, checked: boolean) => onChange(field.id, checked ? [...selected, label] : selected.filter(item => item !== label));
    const id = `answer-${field.id}`;
    const hint = field.description ? `${id}-hint` : undefined;
    const label = <>{field.label}{field.required && <span className="feedback-required" aria-hidden="true"> *</span>}</>;
    const description = field.description && <div id={hint} className="feedback-hint"><TemplateMarkdown source={field.description} /></div>;
    if (field.type === "checkboxes" || (field.type === "dropdown" && field.multiple)) return <fieldset className="feedback-choice-field" key={field.id} aria-describedby={hint}>
      <legend>{label}</legend>{description}
      {field.options.map(option => <label className="feedback-consent" key={option.label}>
        <input type="checkbox" checked={selected.includes(option.label)} required={field.type === "checkboxes" && option.required} onChange={event => toggle(option.label, event.target.checked)} />
        <span><TemplateMarkdown source={option.label} inline />{option.required && <span className="feedback-required" aria-hidden="true"> *</span>}</span>
      </label>)}
    </fieldset>;
    return <div className="feedback-template-field" key={field.id}>
      <label htmlFor={field.type === "upload" ? `screenshots-${field.id}` : id}>{label}</label>{description}
      {field.type === "input" && <input id={id} value={text} maxLength={MAX_ANSWER_LENGTH} required={field.required} aria-describedby={hint} placeholder={field.placeholder} onChange={event => onChange(field.id, event.target.value)} />}
      {field.type === "textarea" && <textarea id={id} value={text} maxLength={MAX_ANSWER_LENGTH} rows={4} required={field.required} aria-describedby={hint} placeholder={field.placeholder} onChange={event => onChange(field.id, event.target.value)} />}
      {field.type === "dropdown" && <select id={id} value={selected[0] ?? ""} required={field.required} aria-describedby={hint} onChange={event => onChange(field.id, event.target.value ? [event.target.value] : [])}>
        <option value="">请选择</option>{field.options.map(option => <option key={option.label}>{option.label}</option>)}
      </select>}
      {field.type === "upload" && upload(field.id)}
    </div>;
  });
}
