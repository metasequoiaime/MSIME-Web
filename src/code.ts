import MarkdownIt from "markdown-it";
import codeSource from "./content/code.md?raw";
import "./style.scss";
import "./docs.scss";
import "./site";

const codeContent = document.getElementById("code-content");

if (codeContent) {
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  });

  codeContent.innerHTML = markdown.render(codeSource);
}
