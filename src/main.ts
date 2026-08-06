import "./style.scss";

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
};

const closeThemeOptions = () => {
  themeSwitcher?.classList.remove("is-open");
  themeButton?.setAttribute("aria-expanded", "false");
};

applyTheme(getStoredTheme());

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
  }
});

const headerWrap = document.querySelector<HTMLElement>(".header-wrap");
if (headerWrap) {
  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateHeader = () => {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;
    const shouldHide = delta > 2 && currentY > 4;
    const shouldShow = delta < -2 || currentY <= 4;

    if (shouldHide) {
      headerWrap.classList.add("header--hidden");
    } else if (shouldShow) {
      headerWrap.classList.remove("header--hidden");
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
