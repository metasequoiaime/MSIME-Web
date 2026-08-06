import MarkdownIt from "markdown-it";
import priceSource from "./content/price.md?raw";
import "./style.scss";
import "./docs.scss";
import "./site";

const priceContent = document.getElementById("price-content");

if (priceContent) {
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  });

  priceContent.innerHTML = markdown.render(priceSource);
}
