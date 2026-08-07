document.documentElement.classList.remove("preload");

const navId = document.getElementById("nav-menu");
const toggleBtnId = document.getElementById("btn-toggle");
const closeBtnId = document.getElementById("btn-close");

if (navId && toggleBtnId) {
  toggleBtnId.addEventListener("click", () => {
    navId.classList.add("show");
    document.body.classList.add("menu-open");
  });
}

if (navId && closeBtnId) {
  closeBtnId.addEventListener("click", () => {
    navId.classList.remove("show");
    document.body.classList.remove("menu-open");
  });
}

type ThemeChoice = "light" | "dark" | "system";

const themeSwitcher = document.getElementById("theme-switcher");
const themeButton = document.getElementById("theme-button");
const themeOptionButtons = document.querySelectorAll<HTMLButtonElement>("[data-theme-choice]");
const themeChoices: ThemeChoice[] = ["light", "dark", "system"];
const themeLabels: Record<ThemeChoice, string> = {
  light: "亮色",
  dark: "暗色",
  system: "跟随系统",
};

const getStoredTheme = (): ThemeChoice => {
  try {
    const storedTheme = localStorage.getItem("msime-theme") as ThemeChoice | null;
    return storedTheme && themeChoices.includes(storedTheme) ? storedTheme : "system";
  } catch {
    return "system";
  }
};

const isLightThemeActive = () => {
  const theme = document.documentElement.dataset.theme;
  if (theme === "light") return true;
  if (theme === "dark") return false;
  return window.matchMedia("(prefers-color-scheme: light)").matches;
};

const heroVideos = document.querySelectorAll<HTMLVideoElement>(".hero-screenshot video");
const heroMediaInView = new WeakSet<Element>();
let heroScrollPaused = false;
let heroScrollResumeTimer = 0;

const isHeroVideoForActiveTheme = (video: HTMLVideoElement) => {
  const light = isLightThemeActive();
  if (video.classList.contains("hero-media-light")) return light;
  if (video.classList.contains("hero-media-dark")) return !light;
  return true;
};

const playHeroVideo = (video: HTMLVideoElement) => {
  if (heroScrollPaused || !heroMediaInView.has(video) || !isHeroVideoForActiveTheme(video)) {
    return;
  }
  void video.play().catch(() => {});
};

const pauseHeroVideo = (video: HTMLVideoElement) => {
  video.pause();
};

const syncHeroMediaForTheme = () => {
  heroVideos.forEach((video) => {
    if (isHeroVideoForActiveTheme(video)) {
      playHeroVideo(video);
    } else {
      pauseHeroVideo(video);
      video.currentTime = 0;
    }
  });
};

if (heroVideos.length) {
  const mediaObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target;
        if (!(target instanceof HTMLVideoElement)) continue;

        if (entry.isIntersecting) {
          heroMediaInView.add(target);
          playHeroVideo(target);
        } else {
          heroMediaInView.delete(target);
          pauseHeroVideo(target);
        }
      }
    },
    { rootMargin: "64px 0px", threshold: 0.05 }
  );

  heroVideos.forEach((video) => mediaObserver.observe(video));

  // 手指滑动时先暂停解码，停滑后再播，兼顾演示动画和滚动流畅
  window.addEventListener(
    "scroll",
    () => {
      if (!heroScrollPaused) {
        heroScrollPaused = true;
        heroVideos.forEach(pauseHeroVideo);
      }

      window.clearTimeout(heroScrollResumeTimer);
      heroScrollResumeTimer = window.setTimeout(() => {
        heroScrollPaused = false;
        syncHeroMediaForTheme();
      }, 140);
    },
    { passive: true }
  );
}

const applyTheme = (theme: ThemeChoice) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme =
    theme === "light" ? "light" : theme === "dark" ? "dark" : "light dark";

  themeOptionButtons.forEach((button) => {
    const isSelected = button.dataset.themeChoice === theme;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-checked", String(isSelected));
  });

  themeButton?.setAttribute("aria-label", `主题：${themeLabels[theme]}`);
  syncHeroMediaForTheme();
};

const closeThemeOptions = () => {
  themeSwitcher?.classList.remove("is-open");
  themeButton?.setAttribute("aria-expanded", "false");
};

applyTheme(getStoredTheme());

window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
  if (document.documentElement.dataset.theme === "system") {
    syncHeroMediaForTheme();
  }
});

themeButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = themeSwitcher?.classList.toggle("is-open") ?? false;
  themeButton.setAttribute("aria-expanded", String(isOpen));
});

themeOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedTheme = button.dataset.themeChoice as ThemeChoice;

    try {
      localStorage.setItem("msime-theme", selectedTheme);
    } catch {
      // The theme still applies for this session when storage is unavailable.
    }

    applyTheme(selectedTheme);
    closeThemeOptions();
    navId?.classList.remove("show");
    document.body.classList.remove("menu-open");
  });
});

document.addEventListener("click", (event) => {
  if (themeSwitcher && !themeSwitcher.contains(event.target as Node)) {
    closeThemeOptions();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeThemeOptions();
    if (navId?.classList.contains("show")) {
      navId.classList.remove("show");
      document.body.classList.remove("menu-open");
    }
  }
});

const headerWrap = document.querySelector<HTMLElement>(".header-wrap");
if (headerWrap) {
  let lastScrollY = Math.max(0, window.scrollY);
  let ticking = false;
  let hidden = false;

  const updateHeader = () => {
    // 菜单打开时保持顶栏可见
    if (document.body.classList.contains("menu-open")) {
      if (hidden) {
        headerWrap.classList.remove("header--hidden");
        hidden = false;
      }
      lastScrollY = Math.max(0, window.scrollY);
      ticking = false;
      return;
    }

    const currentY = Math.max(0, window.scrollY);
    const delta = currentY - lastScrollY;
    const shouldHide = delta > 2 && currentY > 4;
    const shouldShow = delta < -2 || currentY <= 4;

    if (shouldHide && !hidden) {
      headerWrap.classList.add("header--hidden");
      hidden = true;
    } else if (shouldShow && hidden) {
      headerWrap.classList.remove("header--hidden");
      hidden = false;
    }

    lastScrollY = currentY;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    },
    { passive: true }
  );
}
