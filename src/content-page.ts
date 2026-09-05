import MarkdownIt from "markdown-it";
import { observeReveals } from "./reveal";

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

type RenderOptions = {
  target: HTMLElement | null;
  source: string;
  /** 把每个二级标题及其后续内容包进独立卡片 */
  sectioned?: boolean;
};

export const setPageKicker = (text: string) => {
  const kicker = document.getElementById("page-kicker");
  if (kicker) kicker.textContent = text;
};

/** 一级标题与首段属于页头 hero，正文继续由 markdown 驱动 */
const liftHero = (article: HTMLElement) => {
  const heading = article.querySelector("h1");
  if (!heading) return;

  const title = document.getElementById("page-title");
  const lead = document.getElementById("page-lead");
  const intro = heading.nextElementSibling;

  if (title) title.textContent = heading.textContent;

  if (lead && intro instanceof HTMLParagraphElement) {
    lead.innerHTML = intro.innerHTML;
    intro.remove();
  }

  heading.remove();
};

const groupSections = (article: HTMLElement) => {
  const cards: HTMLElement[] = [];
  let current: HTMLElement | null = null;

  for (const node of Array.from(article.childNodes)) {
    if (current === null || (node instanceof HTMLElement && node.tagName === "H2")) {
      current = document.createElement("section");
      current.className = "card doc-card";
      current.setAttribute("data-reveal", "");
      cards.push(current);
    }

    current.appendChild(node);
  }

  article.replaceChildren(...cards.filter((card) => card.textContent?.trim()));
};

export const renderContentPage = ({ target, source, sectioned = false }: RenderOptions) => {
  if (!target) return;

  target.innerHTML = markdown.render(source);
  liftHero(target);

  if (sectioned) groupSections(target);

  // 页头的文字到位了，入场动画才放行
  document.querySelector(".page-hero")?.classList.add("is-ready");

  observeReveals();
};
