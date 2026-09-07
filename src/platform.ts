export const PLATFORMS = ["windows", "macos", "ios", "linux"] as const;

export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  ios: "iOS",
  linux: "Linux",
};

/**
 * 按 UA 猜访客的系统，猜不出当作 Windows。
 *
 * 只用来决定默认给谁看哪一份内容，四个平台的入口始终都在页面上 —— 猜错了也只是多点一下，不会挡住任何人。Android 会带 Linux 字样，得排掉。
 *
 * iPhone 和 iPad 必须排在 macOS 前面：iPhone 的 UA 里含 `like Mac OS X`，而 iPadOS 13 起干脆自称 Macintosh，只能靠多点触控把它和真 Mac 分开。放在后面的话，来装键盘的人会默认看到一个装不了的 .pkg。
 */
export const detectPlatform = (): Platform => {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  if (/Mac OS X|Macintosh/.test(ua)) return "macos";
  if (/Linux/.test(ua) && !/Android/.test(ua)) return "linux";
  return "windows";
};
