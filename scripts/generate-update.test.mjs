import assert from 'node:assert/strict';
import test from 'node:test';
import { metadataFromRelease, selectRelease } from './generate-update.mjs';

const release = {
  draft: false, prerelease: false, published_at: '2026-09-05T00:00:00Z', tag_name: '0.0.9.2',
  html_url: 'https://github.com/metasequoiaime/MSIME-Windows/releases/tag/0.0.9.2',
  assets: [{ name: 'MetasequoiaIME_Setup_v0.0.9.2-unsigned.exe', size: 100,
    browser_download_url: 'https://github.com/metasequoiaime/MSIME-Windows/releases/download/0.0.9.2/setup.exe' }],
};
test('published Windows installer produces the existing update API', () => {
  assert.deepEqual(metadataFromRelease(release), {version: '0.0.9.2', releaseUrl: release.html_url});
});
test('drafts, prereleases, absent installers and foreign URLs cannot advertise an update', () => {
  for (const change of [{draft: true}, {prerelease: true}, {published_at: null}, {assets: []},
    {html_url: 'https://example.com/release'}, {tag_name: '../main'}]) {
    assert.throws(() => metadataFromRelease({...release, ...change}));
  }
});

test('preview policy accepts published previews but excludes newer drafts and missing installers', () => {
  const preview = {...release, prerelease: true};
  assert.deepEqual(selectRelease([{...preview, draft: true}, {...preview, assets: []}, preview], 'preview'),
    {version: '0.0.9.2', releaseUrl: release.html_url});
  assert.throws(() => selectRelease([preview], 'stable'));
});
