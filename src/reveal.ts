// 入场动画：先给根节点挂标记，样式表才会把 [data-reveal] 藏起来，脚本失效时页面照常可读
document.documentElement.classList.add("has-reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-revealed");
      revealObserver.unobserve(entry.target);
    }
  },
  // threshold 保持 0：文档正文是一整张很高的卡片，按比例判定时它永远达不到阈值
  { rootMargin: "0px 0px -8% 0px", threshold: 0 }
);

/**
 * 登记入场动画。只有需要滚动才看得到的部分才做动画 —— 否则每次换页整屏都要重新淡入
 * 一遍，看起来就是闪屏。markdown 渲染出来的节点在插入之后再调一次。
 *
 * 首屏内的元素直接摘掉 data-reveal，而不是补 is-revealed：量 rect 会强制一次样式计算，
 * 把 opacity: 0 定下来，之后再加类就真的会跑一遍过渡。摘属性会连隐藏样式带 transition
 * 声明一起失配，元素直接回到不透明状态，不会有过渡。
 */
export const observeReveals = (root: ParentNode = document) => {
  const foldLine = window.innerHeight * 0.9;

  root.querySelectorAll("[data-reveal]:not(.is-revealed)").forEach((element) => {
    if (element.getBoundingClientRect().top < foldLine) {
      element.removeAttribute("data-reveal");
      return;
    }

    revealObserver.observe(element);
  });
};

observeReveals();
