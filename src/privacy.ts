import privacySource from "./content/privacy.md?raw";
import { renderContentPage } from "./content-page";
import "./style.scss";
import "./docs.scss";
import "./site";

renderContentPage({
  target: document.getElementById("privacy-content"),
  source: privacySource,
  sectioned: true,
});
