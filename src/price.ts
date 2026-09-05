import priceSource from "./content/price.md?raw";
import { renderContentPage } from "./content-page";
import "./style.scss";
import "./docs.scss";
import "./site";

renderContentPage({
  target: document.getElementById("price-content"),
  source: priceSource,
  sectioned: true,
});
