import MarkdownIt from "markdown-it";
import docsSource from "./content/docs.md?raw";
import "./style.scss";
import "./docs.scss";
import "./site";

const docsContent = document.getElementById("docs-content");

if (docsContent) {
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  });

  const headingIds: Record<string, string> = {
    项目简介: "introduction",
    下载安装: "download",
    项目组成: "project-structure",
    相关链接: "links",
  };

  markdown.renderer.rules.heading_open = (tokens, index, options, _env, self) => {
    const headingText = tokens[index + 1]?.content ?? "";
    const headingId = headingIds[headingText];

    if (headingId) {
      tokens[index].attrSet("id", headingId);
    }

    return self.renderToken(tokens, index, options);
  };

  docsContent.innerHTML = markdown.render(docsSource);
}
