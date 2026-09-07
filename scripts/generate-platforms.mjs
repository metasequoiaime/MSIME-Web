import { writeFile } from 'node:fs/promises';

/*
 * public/platforms.json 给下载页提供三个平台各自的最新版本与安装包。
 *
 * 在这之前只有 Windows 有版本信息（来自 public/update.json），macOS 和 Linux 的访客在官网上拿不到版本号、拿不到文件、也拿不到校验值，只能被推去 GitHub 自己翻。三个平台各自在自己的仓库发版，版本号互不相通，所以这里逐个仓库取最新一个已发布的版本。
 *
 * update.json 不动：它是 Windows 客户端「检查更新」读的接口，形状是对外承诺，不该为了页面好看去改。
 */
const SOURCES = {
  windows: 'metasequoiaime/MSIME-Windows',
  macos: 'metasequoiaime/MSIME-Apple',
  linux: 'metasequoiaime/MSIME-Linux',
};

/** 校验和、构建溯源清单和自动更新用的载荷都不该出现在「下载」按钮上。 */
const isNoise = name =>
  name.endsWith('.sha256') || name === 'product-manifest.json' || name === 'appcast.xml' ||
  name.includes('-update.zip') || name.includes('.xcarchive');

/*
 * 每个平台把产物翻译成人看得懂的名字。顺序就是页面上的展示顺序，第一个是主推。
 *
 * 用精确的形状去匹配，不做「含 .deb 就算」的模糊判断：认不出来的产物宁可不展示，也不要在下载按钮上标错架构。
 */
const RULES = {
  windows: [[/^MetasequoiaIME_Setup_v[\w.-]+\.exe$/i, '安装程序', 'x64']],
  // iOS 的 ipa 也在这个仓库里发，但站点把 iOS 标为开发中，把一个能下的包摆在 macOS 名下只会让人误解。
  macos: [
    [/-macos-universal[\w-]*\.pkg$/i, '安装包 · pkg', 'Universal'],
    [/-macos-universal[\w-]*\.zip$/i, '压缩包 · zip', 'Universal'],
  ],
  linux: [
    [/_amd64\.deb$/i, 'Debian / Ubuntu · deb', 'x86_64'],
    [/_arm64\.deb$/i, 'Debian / Ubuntu · deb', 'aarch64'],
    [/\.x86_64\.rpm$/i, 'Fedora / openSUSE · rpm', 'x86_64'],
    [/\.aarch64\.rpm$/i, 'Fedora / openSUSE · rpm', 'aarch64'],
    [/-linux-x86_64\.tar\.gz$/i, '通用压缩包 · tar.gz', 'x86_64'],
    [/-linux-aarch64\.tar\.gz$/i, '通用压缩包 · tar.gz', 'aarch64'],
  ],
};

const sha256Of = asset =>
  typeof asset.digest === 'string' && asset.digest.startsWith('sha256:')
    ? asset.digest.slice('sha256:'.length)
    : null;

export function classifyAssets(platform, assets) {
  const rules = RULES[platform] ?? [];
  const downloads = [];

  for (const [pattern, label, arch] of rules) {
    for (const asset of assets) {
      if (isNoise(asset.name) || !pattern.test(asset.name)) continue;
      if (!asset.browser_download_url?.startsWith(`https://github.com/${SOURCES[platform]}/releases/download/`)) continue;
      downloads.push({
        label,
        arch,
        name: asset.name,
        url: asset.browser_download_url,
        size: asset.size ?? 0,
        sha256: sha256Of(asset),
      });
    }
  }

  return downloads;
}

/*
 * 签名状态：true / false / null（不知道）。
 *
 * 文件名里带 unsigned 一定是没签名，这条对哪个平台都成立。反过来不成立：只有 Windows 和 macOS 的发布流水线用「没签名就把 unsigned 写进文件名」这个约定，所以名字里没有 unsigned 才能推出已签名。Linux 包不走这个约定，名字里本来就不会有 unsigned，据此判成「已签名」是在页面上说假话 —— 站点自己的下载说明写的是 Linux 未经签名。
 *
 * 判不出来就返回 null，页面对这种情况什么都不说，而不是猜一个。
 */
const NAMES_DECLARE_SIGNING = new Set(['windows', 'macos']);

export const signingState = (platform, downloads) => {
  if (!downloads.length) return null;
  if (downloads.some(entry => /unsigned/i.test(entry.name))) return false;
  return NAMES_DECLARE_SIGNING.has(platform) ? true : null;
};

export function selectRelease(platform, releases) {
  for (const release of releases) {
    if (release.draft !== false || !release.published_at) continue;
    const downloads = classifyAssets(platform, release.assets ?? []);
    if (!downloads.length) continue;
    return {
      version: String(release.tag_name ?? '').replace(/^v/, ''),
      releaseUrl: release.html_url,
      publishedAt: release.published_at,
      prerelease: release.prerelease === true,
      signed: signingState(platform, downloads),
      downloads,
    };
  }
  return null;
}

async function main() {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GH_TOKEN) headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;

  const platforms = {};
  for (const [platform, repository] of Object.entries(SOURCES)) {
    const response = await fetch(`https://api.github.com/repos/${repository}/releases?per_page=30`,
      { headers, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`${repository} releases failed: HTTP ${response.status}`);
    const selected = selectRelease(platform, await response.json());
    if (selected) platforms[platform] = { repository, ...selected };
  }

  // 一个平台都取不到就别写：宁可让页面回落到「前往发布页」，也不要发布一份空清单。
  if (!Object.keys(platforms).length) throw new Error('Refusing to write an empty platform manifest');

  await writeFile(new URL('../public/platforms.json', import.meta.url),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), platforms }, null, 2)}\n`);
  console.log(Object.entries(platforms).map(([k, v]) => `${k} v${v.version} (${v.downloads.length} 个产物)`).join(', '));
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
