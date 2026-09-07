import "./style.scss";
import "./beta.scss";
import "./site";

// 这一页的正文写在 HTML 里，不经过 markdown 渲染，页头动画的放行信号就没人发了。
document.querySelector(".page-hero")?.classList.add("is-ready");
