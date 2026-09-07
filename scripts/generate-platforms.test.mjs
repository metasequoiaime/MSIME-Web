import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyAssets, selectRelease, signingState } from './generate-platforms.mjs';

const asset = (name, extra = {}) => ({
  name,
  size: 1024,
  digest: `sha256:${'a'.repeat(64)}`,
  browser_download_url: `https://github.com/metasequoiaime/MSIME-Linux/releases/download/v0.9.1/${name}`,
  ...extra,
});

const linuxAssets = [
  asset('metasequoia-ime-linux_0.9.1_amd64.deb'),
  asset('metasequoia-ime-linux_0.9.1_arm64.deb'),
  asset('metasequoia-ime-linux-0.9.1-1.x86_64.rpm'),
  asset('metasequoia-ime-linux-0.9.1-linux-x86_64.tar.gz'),
  asset('metasequoia-ime-linux-0.9.1.tar.gz'),
  asset('metasequoia-ime-linux_0.9.1_amd64.deb.sha256'),
  asset('product-manifest.json'),
];

test('each package is labelled with the distribution family and the architecture it is for', () => {
  const downloads = classifyAssets('linux', linuxAssets);
  assert.deepEqual(downloads.map(d => `${d.label} ${d.arch}`), [
    'Debian / Ubuntu · deb x86_64',
    'Debian / Ubuntu · deb aarch64',
    'Fedora / openSUSE · rpm x86_64',
    '通用压缩包 · tar.gz x86_64',
  ]);
});

test('checksums, build manifests and the bare source archive stay out of the download list', () => {
  const names = classifyAssets('linux', linuxAssets).map(d => d.name);
  assert.ok(!names.some(n => n.endsWith('.sha256')));
  assert.ok(!names.includes('product-manifest.json'));
  // 那个不带架构的 tar.gz 不知道是给谁的，标不出架构就不展示
  assert.ok(!names.includes('metasequoia-ime-linux-0.9.1.tar.gz'));
});

test('an asset hosted somewhere other than this repository is refused', () => {
  const foreign = [asset('metasequoia-ime-linux_0.9.1_amd64.deb', {
    browser_download_url: 'https://example.invalid/metasequoia-ime-linux_0.9.1_amd64.deb',
  })];
  assert.deepEqual(classifyAssets('linux', foreign), []);
});

test('macOS keeps the installer and archive but never the iOS build', () => {
  const macos = ['MetasequoiaIME-v0.47.2-macos-universal-unsigned.pkg',
                 'MetasequoiaIME-v0.47.2-macos-universal-unsigned.zip',
                 'MetasequoiaIME-v0.47.2-macos-universal-unsigned-update.zip',
                 'MetasequoiaIME-v0.47.2-ios-unsigned.ipa'].map(n => asset(n, {
    browser_download_url: `https://github.com/metasequoiaime/MSIME-Apple/releases/download/v0.47.2/${n}`,
  }));
  const labels = classifyAssets('macos', macos).map(d => d.label);
  assert.deepEqual(labels, ['安装包 · pkg', '压缩包 · zip']);
});

test('signing is only claimed where the filenames actually declare it', () => {
  // Windows 和 macOS 的流水线把 unsigned 写进文件名，所以没有它就是签过
  assert.equal(signingState('windows', [{ name: 'MetasequoiaIME_Setup_v0.5.4.exe' }]), true);
  assert.equal(signingState('macos', [{ name: 'MetasequoiaIME-v0.47.2-macos-universal-unsigned.pkg' }]), false);
  // Linux 不走这个约定：名字里没有 unsigned 不代表签过，只能是「不知道」
  assert.equal(signingState('linux', [{ name: 'metasequoia-ime-linux_0.9.1_amd64.deb' }]), null);
  assert.equal(signingState('linux', []), null);
});

test('drafts and releases without a recognisable package are skipped', () => {
  const chosen = selectRelease('linux', [
    { tag_name: 'v0.9.3', draft: true, published_at: null, html_url: 'x', assets: linuxAssets },
    { tag_name: 'v0.9.2', draft: false, published_at: '2026-09-06T00:00:00Z', html_url: 'x', assets: [asset('notes.txt')] },
    { tag_name: 'v0.9.1', draft: false, prerelease: true, published_at: '2026-09-06T00:00:00Z',
      html_url: 'https://github.com/metasequoiaime/MSIME-Linux/releases/tag/v0.9.1', assets: linuxAssets },
  ]);
  assert.equal(chosen.version, '0.9.1');
  assert.equal(chosen.prerelease, true);
  assert.equal(chosen.downloads.length, 4);
});

test('nothing is returned when no release qualifies, so the page can fall back', () => {
  assert.equal(selectRelease('linux', [{ tag_name: 'v1', draft: true, assets: linuxAssets }]), null);
});

test('a tag that is not a plain version is refused, the same way the update manifest refuses it', () => {
  const withAssets = tag => ({
    tag_name: tag, draft: false, published_at: '2026-09-07T00:00:00Z',
    html_url: `https://github.com/metasequoiaime/MSIME-Linux/releases/tag/${tag}`, assets: linuxAssets,
  });
  // 上游真发过 v0.6.2-beta：update.json 按规则拒掉，这份也必须拒，否则同一页会出现两个版本号
  assert.equal(selectRelease('linux', [withAssets('v0.6.2-beta')]), null);
  assert.equal(selectRelease('linux', [withAssets('nightly')]), null);
  assert.equal(selectRelease('linux', [withAssets('v0.9.1')]).version, '0.9.1');
  assert.equal(selectRelease('linux', [withAssets('v0.9.1.2')]).version, '0.9.1.2');
});

test('the highest version wins, not the most recently published', () => {
  const at = (tag, when) => ({
    tag_name: tag, draft: false, published_at: when,
    html_url: `https://github.com/metasequoiaime/MSIME-Linux/releases/tag/${tag}`, assets: linuxAssets,
  });
  // 补发一个旧版本不该把页面推回去
  const chosen = selectRelease('linux', [at('v0.8.9', '2026-09-07T00:00:00Z'), at('v0.9.1', '2026-09-01T00:00:00Z')]);
  assert.equal(chosen.version, '0.9.1');
  assert.equal(selectRelease('linux', [at('v0.10.0', '2026-09-01T00:00:00Z'), at('v0.9.9', '2026-09-02T00:00:00Z')]).version, '0.10.0');
});
