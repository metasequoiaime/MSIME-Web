import aboutSource from "./content/about.md?raw";
import { renderContentPage } from "./content-page";
import "./style.scss";
import "./docs.scss";
import "./site";

renderContentPage({
  target: document.getElementById("about-content"),
  source: aboutSource,
  sectioned: true,
});
