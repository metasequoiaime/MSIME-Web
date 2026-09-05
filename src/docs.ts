import docsSource from "./content/docs.md?raw";
import { renderContentPage } from "./content-page";
import "./style.scss";
import "./docs.scss";
import "./site";

const docsContent = document.getElementById("docs-content");
const docsToc = document.getElementById("docs-toc");
const docsSidebar = document.querySelector<HTMLElement>(".docs-sidebar");
const docsTocToggle = document.getElementById("docs-toc-toggle");

const closeDocsToc = () => {
  docsSidebar?.classList.remove("is-open");
  docsTocToggle?.setAttribute("aria-expanded", "false");
};

docsTocToggle?.addEventListener("click", () => {
  const isOpen = docsSidebar?.classList.toggle("is-open") ?? false;
  docsTocToggle.setAttribute("aria-expanded", String(isOpen));
});

if (docsContent && docsToc) {
  renderContentPage({ target: docsContent, source: docsSource });

  const usedIds = new Map<string, number>();
  const sections: { heading: HTMLElement; link: HTMLAnchorElement }[] = [];

  docsContent.querySelectorAll<HTMLElement>("h2, h3").forEach((heading) => {
    const headingText = heading.textContent?.trim() ?? "";
    const baseId = headingText
      .toLocaleLowerCase()
      .replace(/[^\p{Letter}\p{Number}\s_-]/gu, "")
      .trim()
      .replace(/[\s_]+/g, "-") || "section";
    const occurrence = (usedIds.get(baseId) ?? 0) + 1;
    const headingId = occurrence === 1 ? baseId : `${baseId}-${occurrence}`;

    usedIds.set(baseId, occurrence);
    heading.id = headingId;

    const link = document.createElement("a");
    link.href = `#${headingId}`;
    link.textContent = headingText;

    if (heading.tagName === "H3") {
      link.classList.add("docs-toc-subitem");
    }

    docsToc.appendChild(link);
    sections.push({ heading, link });
  });

  // 目录高亮跟随正文滚动
  let activeIndex = -1;
  // 点目录之后到滚动停下之前先锁住，否则平滑滚动会把沿途每一节都点亮一遍
  let locked = false;
  let unlockTimer = 0;

  /** 侧栏自己可滚动（窄屏时是目录本身），高亮项跑出可视区就带进来 */
  const scroller = () =>
    docsToc.scrollHeight > docsToc.clientHeight
      ? docsToc
      : docsSidebar && docsSidebar.scrollHeight > docsSidebar.clientHeight
        ? docsSidebar
        : null;

  const keepInView = (link: HTMLElement) => {
    const box = scroller();
    if (!box) return;

    const linkRect = link.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    if (linkRect.top < boxRect.top + 8) {
      box.scrollTop -= boxRect.top + 8 - linkRect.top;
    } else if (linkRect.bottom > boxRect.bottom - 8) {
      box.scrollTop += linkRect.bottom - (boxRect.bottom - 8);
    }
  };

  const setActive = (index: number) => {
    if (index === activeIndex || !sections[index]) return;

    sections[activeIndex]?.link.classList.remove("is-active");
    sections[activeIndex]?.link.removeAttribute("aria-current");

    activeIndex = index;
    const { link } = sections[index];
    link.classList.add("is-active");
    link.setAttribute("aria-current", "location");
    keepInView(link);
  };

  const updateActive = () => {
    if (locked) return;

    // 顶栏是固定的，判定线要压到它下面
    const offset = (document.querySelector<HTMLElement>(".header-wrap")?.offsetHeight ?? 68) + 24;
    let index = 0;

    for (let i = 0; i < sections.length; i += 1) {
      if (sections[i].heading.getBoundingClientRect().top - offset > 0) break;
      index = i;
    }

    // 触底时直接点亮最后一节，否则末尾几节永远轮不到
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

    setActive(atBottom ? sections.length - 1 : index);
  };

  const releaseLock = () => {
    locked = false;
    window.clearTimeout(unlockTimer);
  };

  sections.forEach(({ link }, index) => {
    link.addEventListener("click", () => {
      setActive(index);
      locked = true;
      // 长距离的平滑滚动要一秒多，scrollend 才是准点；没有这个事件的浏览器靠超时兜底
      window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(releaseLock, 2000);

      if (window.matchMedia("(max-width: 900px)").matches) {
        closeDocsToc();
      }
    });
  });

  window.addEventListener("scrollend", () => {
    releaseLock();
    updateActive();
  });

  // 中途自己滚就交还控制权
  window.addEventListener("wheel", releaseLock, { passive: true });
  window.addEventListener("touchstart", releaseLock, { passive: true });

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        updateActive();
      });
    },
    { passive: true }
  );

  // 带 hash 进来时浏览器要等一帧才滚到位；图片加载完还会顶一次版面，落定后再校准一次
  requestAnimationFrame(updateActive);
  window.addEventListener("load", updateActive);
}
