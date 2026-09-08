import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { seoPages } from '../shared/site-seo.ts';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const SITE = 'https://msime.app';

/** 仓库里每个带 index.html 的目录就是一个页面；根目录的 index.html 是首页。 */
const pageDirectories = () =>
  readdirSync(new URL('.', root), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .filter(entry => !['node_modules', 'dist', 'public', 'scripts', 'src', 'vendor'].includes(entry.name))
    .filter(entry => existsSync(new URL(`${entry.name}/index.html`, root)))
    .map(entry => `/${entry.name}/`);

// 简历页是个人页面，入口里带 noindex，不进站点地图。
const NOINDEX = ['/resume/'];

test('the SEO registry includes every entry page', () => {
  for (const path of ['/', ...pageDirectories()]) assert.ok(seoPages[path], path);
  assert.equal(Object.keys(seoPages).filter(path => path.startsWith('/docs/') && path !== '/docs/').length, 4);
});

test('pages excluded from the sitemap actually say so in their own markup', () => {
  for (const path of NOINDEX) {
    const html = read(`${path.slice(1)}index.html`);
    assert.match(html, /<meta name="robots"[^>]*noindex/, `${path} 必须自己声明 noindex`);
  }
});

test('robots exposes the sitemap and permits reading noindex directives', () => {
  const robots = read('public/robots.txt');
  assert.match(robots, new RegExp(`^Sitemap: ${SITE}/sitemap\\.xml$`, 'm'));
  for (const path of NOINDEX) assert.doesNotMatch(robots, new RegExp(`^Disallow: ${path}$`, 'm'));
  assert.match(robots, /^Disallow: \/api\/$/m);
});

test('every page carries a canonical and sharing metadata that match its own address', () => {
  for (const path of ['/', ...pageDirectories()]) {
    const html = read(path === '/' ? 'index.html' : `${path.slice(1)}index.html`);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.equal(canonical, `${SITE}${path}`, `${path} canonical`);
    assert.match(html, /<meta property="og:image" content="[^"]+og-cover\.png"/, `${path} 缺 og:image`);
    assert.match(html, /<meta name="twitter:card" content="summary_large_image"/, `${path} 缺 twitter card`);

    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1];
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
    assert.equal(ogTitle, title, `${path} og:title 应与 <title> 一致`);
  }
});

test('the 404 entry exists, is not indexable, and has no canonical of its own', () => {
  const html = read('404.html');
  assert.match(html, /<meta name="robots"[^>]*noindex/);
  assert.doesNotMatch(html, /rel="canonical"/);
  assert.match(read('vite.config.ts'), /404\.html/, '404.html 必须是构建入口，否则不会进产物');
});

test('the web manifest is valid and points at icons that exist', () => {
  const manifest = JSON.parse(read('public/site.webmanifest'));
  assert.ok(manifest.name && manifest.start_url && manifest.icons?.length);
  for (const icon of manifest.icons) {
    assert.ok(existsSync(new URL(`public${icon.src}`, root)), `缺图标 ${icon.src}`);
  }
});

test('the response headers lock the page down and keep hashed assets cacheable', () => {
  const headers = read('public/_headers');
  const csp = headers.match(/Content-Security-Policy: (.+)/)?.[1] ?? '';
  for (const directive of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'none'"]) {
    assert.ok(csp.includes(directive), `CSP 缺 ${directive}`);
  }
  // 只放行头像和 Turnstile 的脚本、验证框。
  const externals = [...csp.matchAll(/https:\/\/[^\s;]+/g)].map(m => m[0]);
  assert.deepEqual(externals, ['https://challenges.cloudflare.com', 'https://avatars.githubusercontent.com', 'https://challenges.cloudflare.com']);
  assert.match(headers, /\/assets\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/);
});
