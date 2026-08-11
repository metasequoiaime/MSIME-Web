import MarkdownIt from "markdown-it";
import resumeSource from "./content/resume.md?raw";
import "./style.scss";
import "./resume.scss";

document.documentElement.classList.remove("preload");

const resumeContent = document.getElementById("resume-content");

if (resumeContent) {
  const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
  });

  resumeContent.innerHTML = markdown.render(resumeSource);

  resumeContent.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    link.target = "_blank";
    link.rel = "noreferrer";
  });
}
