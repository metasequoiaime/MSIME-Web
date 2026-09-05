import docsSource from "../vendor/MSIME-Docs/guides/windows.md?raw";
import { renderContentPage } from "./content-page";
import "./style.scss";
import "./docs.scss";
import "./site";

const docsContent = document.getElementById("docs-content");
const docsToc = document.getElementById("docs-toc");
const docsSidebar = document.querySelector<HTMLElement>(".docs-sidebar");
const docsTocToggle = document.getElementById("docs-toc-toggle");

const closeDocsToc = () => {
  docsSidebar?.classList.remove("is-open");
  docsTocToggle?.setAttribute("aria-expanded", "false");
};

docsTocToggle?.addEventListener("click", () => {
  const isOpen = docsSidebar?.classList.toggle("is-open") ?? false;
  docsTocToggle.setAttribute("aria-expanded", String(isOpen));
});

if (docsContent) {
  renderContentPage({ target: docsContent, source: docsSource });

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

      link.addEventListener("click", () => {
        if (window.matchMedia("(max-width: 900px)").matches) {
          closeDocsToc();
        }
      });

      docsToc.appendChild(link);
    });
  }
}
