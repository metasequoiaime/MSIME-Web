import codeSource from "./content/code.md?raw";
import { renderContentPage } from "./content-page";
import "./style.scss";
import "./docs.scss";
import "./site";

const codeContent = document.getElementById("code-content");

/** 仓库条目拆成两行：仓库名一行，说明一行 */
const splitRepoRows = (root: HTMLElement) => {
  root.querySelectorAll<HTMLLIElement>("li").forEach((item) => {
    const link = item.firstChild;
    if (!(link instanceof HTMLAnchorElement)) return;

    const name = document.createElement("span");
    name.className = "repo-name";
    name.appendChild(link);

    const desc = document.createElement("span");
    desc.className = "repo-desc";
    while (item.firstChild) desc.appendChild(item.firstChild);

    // 冒号原本是名称和说明之间的分隔符，拆成两行之后不需要了
    const lead = desc.firstChild;
    if (lead?.nodeType === Node.TEXT_NODE) {
      lead.textContent = (lead.textContent ?? "").replace(/^\s*[：:]\s*/, "");
    }

    item.append(name, desc);
  });
};

renderContentPage({
  target: codeContent,
  source: codeSource,
  sectioned: true,
});

if (codeContent) splitRepoRows(codeContent);
