/** First-stage translations. Guides remain in Simplified Chinese until reviewed. */
export const traditionalPages = {
  '/': { title: '水杉輸入法 MSIME｜開源中文輸入法', description: '認識水杉輸入法的全拼、雙拼與五筆功能，下載 Windows、macOS 或 Linux 版本，查看常見問題與回報方式。' },
  '/features/': { title: '功能與介面｜水杉輸入法', description: '以 Windows 版為例，了解水杉輸入法的候選字視窗、輔助碼、佈景主題與詞庫設定。' },
  '/download/': { title: '下載與安裝｜水杉輸入法', description: '下載水杉輸入法 Windows、macOS 與 Linux 版本，選擇安裝套件、核對 SHA256 並查看安裝指南。' },
  '/faq/': { title: '常見問題與疑難排解｜水杉輸入法', description: '水杉輸入法常見問題：字型方框、安裝與啟動、快捷鍵、候選字和連線功能的排查方式。' },
  '/feedback/': { title: '回報問題與提出建議｜水杉輸入法', description: '了解如何回報水杉輸入法問題或提出功能建議。可使用繁體中文描述，提交內容會公開刊登於 GitHub。' },
} as const;
export const TW_PREFIX = '/zh-TW';
export const isTraditional = (path: string) => path === TW_PREFIX || path.startsWith(`${TW_PREFIX}/`);
export const baseLocalePath = (path: string) => isTraditional(path) ? path.slice(TW_PREFIX.length) || '/' : path;
export const traditionalPath = (path: string) => `${TW_PREFIX}${path}`;
export const languageAlternates = (path: string) => {
  const base = baseLocalePath(path);
  return base in traditionalPages ? [
    { lang: 'zh-Hans', path: base },
    { lang: 'zh-Hant-TW', path: traditionalPath(base) },
    { lang: 'x-default', path: base },
  ] : [];
};
