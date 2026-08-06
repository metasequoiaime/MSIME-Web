import MarkdownIt from "markdown-it";
import aboutSource from "./content/about.md?raw";
import "./style.scss";
import "./docs.scss";
import "./site";

const aboutContent = document.getElementById("about-content");

if (aboutContent) {
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  });

  aboutContent.innerHTML = markdown.render(aboutSource);
}
