/** All public product pages share layout and behavior across these locales. */
export const traditionalPages = {
  '/beta/': { title: 'iOS 公測｜水杉輸入法', description: '透過 TestFlight 加入水杉輸入法 iOS 公測，查看安裝、啟用鍵盤與測試版本說明。' },
  '/': { title: '水杉輸入法 MSIME｜開源中文輸入法', description: '認識水杉輸入法的全拼、雙拼與五筆功能，下載 Windows、macOS 或 Linux 版本，透過 TestFlight 加入 iOS 公測。' },
  '/features/': { title: '功能與介面｜水杉輸入法', description: '以 Windows 版為例，了解水杉輸入法的候選字視窗、輔助碼、佈景主題與詞庫設定。' },
  '/download/': { title: '下載與安裝｜水杉輸入法', description: '下載水杉輸入法 Windows、macOS 與 Linux 版本，或透過 TestFlight 加入 iOS 公測，查看安裝指南與 SHA256。' },
  '/faq/': { title: '常見問題與疑難排解｜水杉輸入法', description: '水杉輸入法常見問題：字型方框、安裝與啟動、快捷鍵、候選字和連線功能的排查方式。' },
  '/feedback/': { title: '回報問題與提出建議｜水杉輸入法', description: '了解如何回報水杉輸入法問題或提出功能建議。可使用繁體中文描述，提交內容會公開刊登於 GitHub。' },
  '/about/': { title: '關於專案與開發者｜水杉輸入法', description: '認識水杉輸入法的理念、開源授權、開發者與參與方式。' },
  '/code/': { title: '原始碼與參與開發｜水杉輸入法', description: '瀏覽各平台、共用引擎、詞庫及文件的原始碼，了解如何參與開發。' },
  '/price/': { title: '價格與付費計畫｜水杉輸入法', description: '水杉輸入法目前可免費使用，查看後續自願付費支持計畫與第三方服務費用說明。' },
  '/privacy/': { title: '隱私與連線功能說明｜水杉輸入法', description: '了解本機資料、雲端候選字、語音等連線功能的資料流程，以及關閉方式。' },
  '/docs/': { title: '使用指南｜水杉輸入法', description: '選擇 Windows、macOS 或 Linux 使用指南，查看安裝、設定與疑難排解。' },
  '/docs/windows/': { title: 'Windows 安裝與使用指南｜水杉輸入法', description: 'Windows 版水杉輸入法完整使用指南：安裝、輸入方案、設定、詞庫與疑難排解。' },
  '/docs/macos/': { title: 'macOS 安裝與使用指南｜水杉輸入法', description: 'macOS 版水杉輸入法使用指南：安裝、鍵盤輸入、設定、備份與更新。' },
  '/docs/macos-voice/': { title: 'macOS 語音輸入指南｜水杉輸入法', description: '設定 macOS 語音輸入、本機 Whisper 與雲端辨識，了解快捷鍵、文字潤飾和隱私。' },
  '/docs/linux/': { title: 'Linux 安裝與使用指南｜水杉輸入法', description: 'Linux IBus 版水杉輸入法指南：安裝、設定、輸入功能、資料與疑難排解。' },
} as const;
export const TW_PREFIX = '/zh-TW';
export const isTraditional = (path: string) => path === TW_PREFIX || path.startsWith(`${TW_PREFIX}/`);
export const baseLocalePath = (path: string) => isTraditional(path) ? path.slice(TW_PREFIX.length) || '/' : path;
export const traditionalPath = (path: string) => `${TW_PREFIX}${path}`;
export const languageAlternates = (path: string) => {
  const source = baseLocalePath(path);
  const base = source === "/docs/" ? "/docs/windows/" : source;
  return base in traditionalPages || base === '/docs/$guide/' ? [
    { lang: 'zh-Hans', path: base },
    { lang: 'zh-Hant-TW', path: traditionalPath(base) },
    { lang: 'x-default', path: base },
  ] : [];
};

/** Preserve query/fragment and leave external URLs, downloads and API paths alone. */
export function localeHref(url: string, currentPath: string): string {
  if (!isTraditional(currentPath)) return url;
  const local = url.startsWith('https://msime.app/') ? url.slice('https://msime.app'.length) : url;
  if (!local.startsWith('/') || local.startsWith('//') || isTraditional(local)) return url;
  const match = /^([^?#]*)(.*)$/.exec(local);
  if (!match) return url;
  const base = match[1].endsWith('/') ? match[1] : `${match[1]}/`;
  return base in traditionalPages || base === '/docs/$guide/' ? `${traditionalPath(base)}${match[2]}` : url;
}
