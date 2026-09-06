import windowsGuide from "../vendor/MSIME-Docs/guides/windows.md?raw";
import macosGuide from "../vendor/MSIME-Docs/guides/macos.md?raw";
import macosVoiceGuide from "../vendor/MSIME-Docs/guides/macos-voice.md?raw";
import linuxGuide from "../vendor/MSIME-Docs/guides/linux.md?raw";
import { renderContentPage } from "./content-page";
import "./style.scss";
import "./docs.scss";
import "./site";

// The site distributes Windows, macOS and Linux builds, but this page only ever rendered the Windows
// guide -- the other three guides were written and sitting in the submodule unreferenced.
const GUIDES = [
  { id: "windows", label: "Windows", source: windowsGuide },
  { id: "macos", label: "macOS", source: macosGuide },
  { id: "macos-voice", label: "macOS 语音", source: macosVoiceGuide },
  { id: "linux", label: "Linux", source: linuxGuide },
] as const;

type GuideId = (typeof GUIDES)[number]["id"];

const isGuideId = (value: string): value is GuideId =>
  GUIDES.some((guide) => guide.id === value);

/** Pick from ?platform=, else guess from the user agent, else Windows. */
const initialGuideId = (): GuideId => {
  const requested = new URLSearchParams(window.location.search).get("platform");
  if (requested && isGuideId(requested)) return requested;
  const ua = navigator.userAgent;
  if (/Mac OS X|Macintosh/.test(ua)) return "macos";
  if (/Linux/.test(ua) && !/Android/.test(ua)) return "linux";
  return "windows";
};

const docsContent = document.getElementById("docs-content");
const docsToc = document.getElementById("docs-toc");
const docsPlatforms = document.getElementById("docs-platforms");
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

const renderGuide = (docsContent: HTMLElement, docsToc: HTMLElement, source: string) => {
  renderContentPage({ target: docsContent, source });
  docsToc.replaceChildren();

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

  // 顶栏是固定的，判定线要压到它下面。顶栏是静态节点，高度只跟 CSS 变量走，查一次就够了
  const headerWrap = document.querySelector<HTMLElement>(".header-wrap");

  const updateActive = () => {
    if (locked) return;

    const offset = (headerWrap?.offsetHeight ?? 68) + 24;
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

  // 中途自己滚就交还控制权。键盘翻页和拖滚动条都不产生 wheel / touchstart，没有 scrollend 的浏览器上就只能等 2 秒超时，高亮会一直卡住，所以 keydown 和 pointerdown 也要放行
  window.addEventListener("wheel", releaseLock, { passive: true });
  window.addEventListener("touchstart", releaseLock, { passive: true });
  window.addEventListener("keydown", releaseLock);
  window.addEventListener("pointerdown", releaseLock);

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
};

if (docsContent && docsToc) {
  let currentId: GuideId | null = null;

  const show = (id: GuideId, pushState: boolean) => {
    if (id === currentId) return;
    const guide = GUIDES.find((candidate) => candidate.id === id);
    if (!guide) return;
    currentId = id;

    renderGuide(docsContent, docsToc, guide.source);

    docsPlatforms?.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
      const active = button.dataset.platform === id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });

    if (pushState) {
      const url = new URL(window.location.href);
      url.searchParams.set("platform", id);
      url.hash = "";
      // replaceState so the platform tabs do not fill the back button with history entries.
      window.history.replaceState(null, "", url);
    }
  };

  if (docsPlatforms) {
    for (const guide of GUIDES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "docs-platform";
      button.dataset.platform = guide.id;
      button.textContent = guide.label;
      button.addEventListener("click", () => {
        show(guide.id, true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      docsPlatforms.appendChild(button);
    }
  }

  show(initialGuideId(), false);
}
