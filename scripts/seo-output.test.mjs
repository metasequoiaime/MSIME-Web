import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { parseHTML } from 'linkedom';
import { seoPages, markdownPath, SITE_ORIGIN } from '../shared/site-seo.ts';
import { onRequest } from '../functions/docs.ts';

const read = path => readFileSync(`dist/${path}`, 'utf8');
const indexed = Object.entries(seoPages).filter(([, page]) => !page.noindex);
const file = path => path === '/' ? 'index.html' : `${path.slice(1)}index.html`;
const document = path => parseHTML(read(file(path))).document;

test('every indexable route has visible static content, matching metadata and discoverable Markdown', () => {
  const titles = new Set();
  for (const [path, page] of indexed) {
    const doc = document(path);
    assert.equal(doc.querySelectorAll('h1').length, 1, `${path}: one primary heading`);
    assert.ok(doc.querySelector('#root').textContent.trim().length > 150, `${path}: real static content`);
    assert.ok(!doc.documentElement.classList.contains('preload'));
    assert.equal(doc.title, page.title);
    assert.ok(!titles.has(doc.title), `${path}: unique title`); titles.add(doc.title);
    assert.equal(doc.querySelector('meta[name=description]').content, page.description);
    assert.equal(doc.querySelector('meta[property="og:title"]').content, page.title);
    assert.equal(doc.querySelector('meta[name="twitter:description"]').content, page.description);
    assert.equal(doc.querySelector('link[rel=canonical]').href, `${SITE_ORIGIN}${path}`);
    assert.equal(doc.querySelector('meta[property="og:url"]').content, `${SITE_ORIGIN}${path}`);
    assert.doesNotMatch(doc.querySelector('meta[name=robots]').content, /noindex/);
    assert.equal(doc.querySelector('link[type="text/markdown"]').href, `${SITE_ORIGIN}${markdownPath(path)}`);
    assert.ok(read(markdownPath(path).slice(1)).includes(`${SITE_ORIGIN}${path}`));
    assert.doesNotMatch(read(file(path)), /data-msg=|data-stck=/, `${path}: SSR did not fall back`);
    for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) assert.equal(JSON.parse(script.textContent)['@context'], 'https://schema.org');
    for (const element of doc.querySelectorAll('script[src], link[rel=stylesheet], img[src]')) {
      const url = element.getAttribute(element.tagName === 'SCRIPT' || element.tagName === 'IMG' ? 'src' : 'href');
      if (url.startsWith('/') && !url.startsWith('//')) assert.ok(existsSync(`dist${url}`), `${path}: missing asset ${url}`);
    }
  }
});

test('sitemap and AI index cover exactly the canonical public pages', () => {
  const locations = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.deepEqual(locations.sort(), indexed.map(([path]) => `${SITE_ORIGIN}${path}`).sort());
  for (const [path] of indexed) {
    assert.ok(read('llms.txt').includes(`${SITE_ORIGIN}${markdownPath(path)}`));
    assert.ok(read('llms-full.txt').includes(read(markdownPath(path).slice(1))));
  }
  assert.doesNotMatch(read('llms.txt'), /\/resume/);
  assert.doesNotMatch(read('llms-full.txt'), /undefined|\{\{[A-Z_]+\}\}/);
});

test('all four guides and FAQ answers are present without JavaScript', () => {
  const landing = document('/docs/');
  assert.ok(landing.querySelector('.docs-article')?.textContent.length > 400, 'the docs entry opens a readable guide');
  assert.equal(landing.querySelector('.docs-platform[aria-current="page"]')?.textContent, 'Windows');
  for (const guide of ['windows', 'macos', 'macos-voice', 'linux']) {
    const doc = document(`/docs/${guide}/`);
    assert.ok(doc.querySelector('.docs-article').textContent.length > 400, guide);
    assert.ok(doc.querySelectorAll('a[href^="/docs/"]').length >= 4, guide);
    assert.ok(read(`docs/${guide}.md`).includes('MSIME-Docs'));
  }
  const faq = document('/faq/');
  const schema = [...faq.querySelectorAll('script[type="application/ld+json"]')].map(script => JSON.parse(script.textContent)).find(data => data['@type'] === 'FAQPage');
  assert.equal(schema.mainEntity.length, 18);
  for (const item of schema.mainEntity) {
    assert.ok(faq.querySelector('#root').textContent.includes(item.name));
    assert.ok(item.acceptedAnswer.text.length > 20);
  }
  assert.ok(document('/download/').querySelector('.docs-content').textContent.includes(JSON.parse(read('update.json')).version));
});

test('noindex pages and Markdown duplicates do not pollute canonical indexing', () => {
  const notFound = parseHTML(read('404.html')).document;
  assert.match(notFound.querySelector('meta[name=robots]').content, /noindex/);
  assert.equal(notFound.querySelector('link[rel=canonical]'), null);
  assert.match(document('/resume/').querySelector('meta[name=robots]').content, /noindex/);
  assert.doesNotMatch(read('robots.txt'), /Disallow: \/resume/);
  for (const [path] of indexed) assert.ok(read('_headers').includes(`${markdownPath(path)}\n  Content-Type: text/markdown; charset=utf-8\n  Link: <${SITE_ORIGIN}${path}>; rel="canonical"\n  X-Robots-Tag: noindex`));
  assert.ok(Math.max(...read('_headers').split('\n').map(line => line.length)) < 2000, 'Pages header line limit');
});

test('legacy guide redirects preserve queries without accepting unknown or external targets', async () => {
  let calls = 0;
  const next = async () => { calls++; return new Response('static'); };
  for (const guide of ['windows', 'macos', 'macos-voice', 'linux']) {
    const response = await onRequest({ request: new Request(`${SITE_ORIGIN}/docs/?platform=${guide}&utm_source=test`), next });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('Location'), `${SITE_ORIGIN}/docs/${guide}/?utm_source=test`);
  }
  for (const value of ['', '?platform=unknown', '?platform=https://example.com']) assert.equal((await onRequest({ request: new Request(`${SITE_ORIGIN}/docs/${value}`), next })).status, 200);
  assert.equal(calls, 3);
  const mirror = await onRequest({ request: new Request('https://metasequoiaime.pages.dev/docs/?platform=linux'), next });
  assert.equal(mirror.status, 301);
  assert.equal(mirror.headers.get('Location'), 'https://msime.app/docs/?platform=linux');
});
