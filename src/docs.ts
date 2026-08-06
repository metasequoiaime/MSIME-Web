import MarkdownIt from "markdown-it";
import docsSource from "./content/docs.md?raw";
import "./style.scss";
import "./docs.scss";
import "./site";

const docsContent = document.getElementById("docs-content");
const docsToc = document.getElementById("docs-toc");

if (docsContent) {
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  });

  docsContent.innerHTML = markdown.render(docsSource);

  if (docsToc) {
    const usedIds = new Map<string, number>();
    const headings = docsContent.querySelectorAll<HTMLElement>("h2, h3");

    headings.forEach((heading) => {
      const headingText = heading.textContent?.trim() ?? "";
      const baseId = headingText
        .toLocaleLowerCase()
        .replace(/[^\p{Letter}\p{Number}\s_-]/gu, "")
        .trim()
        .replace(/[\s_]+/g, "-") || "section";
      const occurrence = (usedIds.get(baseId) ?? 0) + 1;
      const headingId = occurrence === 1 ? baseId : `${baseId}-${occurrence}`;

      usedIds.set(baseId, occurrence);
      heading.id = headingId;

      const link = document.createElement("a");
      link.href = `#${headingId}`;
      link.textContent = headingText;

      if (heading.tagName === "H3") {
        link.classList.add("docs-toc-subitem");
      }

      docsToc.appendChild(link);
    });
  }
}
