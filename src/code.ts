import codeSource from "./content/code.md?raw";
import { renderContentPage } from "./content-page";
import "./style.scss";
import "./docs.scss";
import "./site";

renderContentPage({
  target: document.getElementById("code-content"),
  source: codeSource,
  sectioned: true,
});
