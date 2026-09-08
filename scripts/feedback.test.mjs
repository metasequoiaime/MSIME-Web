import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onRequest } from '../functions/api/feedback.ts';
import { formatIssue, targets } from '../shared/feedback.ts';

const env = { GITHUB_ISSUES_TOKEN: 'test-only-token', TURNSTILE_SITE_KEY: 'test-only-sitekey', TURNSTILE_SECRET: 'test-only-secret', FEEDBACK_ORIGIN: 'https://msime.app' };
const form = { target: 'windows', title: '增加候选窗口字号设置', background: '在高分辨率屏幕上候选字太小，看起来比较吃力。', expected: '希望可以单独设置候选窗口字号，不影响其他界面。', environment: '测试环境', extra: '', consent: true, token: 'test-token' };
const request = (data = form, headers = {}) => new Request('https://msime.app/api/feedback', { method: 'POST', headers: { Origin: 'https://msime.app', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
function mockFetch(t, verification = { success: true, action: 'feedback', hostname: 'msime.app' }, github = () => Response.json({ number: 42 }, { status: 201 })) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    if (url.includes('siteverify')) return Response.json(verification);
    return github();
  });
  return calls;
}

test('all six targets create an issue in the fixed repository with the shared template', async t => {
  const calls = mockFetch(t);
  for (const [target, { repo }] of Object.entries(targets)) {
    const data = { ...form, target, repo: 'attacker/elsewhere' };
    const response = await onRequest({ request: request(data), env });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).url, `https://github.com/metasequoiaime/${repo}/issues/42`);
    const call = calls.at(-1);
    assert.equal(call.url, `https://api.github.com/repos/metasequoiaime/${repo}/issues`);
    assert.deepEqual(JSON.parse(call.options.body), formatIssue(data));
    assert.equal(call.options.headers.Authorization, 'Bearer test-only-token');
  }
});
test('rejects invalid target, missing consent, whitespace, overlong text and malformed requests before external calls', async t => {
  const calls = mockFetch(t);
  for (const change of [{ target: '__proto__' }, { consent: false }, { title: '     ' }, { background: 'x'.repeat(3001) }, { token: '' }, { expected: 42 }, { title: 'hello\nworld' }]) {
    assert.equal((await onRequest({ request: request({ ...form, ...change }), env })).status, 400);
  }
  assert.equal((await onRequest({ request: request({ ...form, extra: '字'.repeat(40_000) }), env })).status, 400);
  assert.equal((await onRequest({ request: request(form, { 'Content-Type': 'text/plain' }), env })).status, 415);
  assert.equal((await onRequest({ request: request(form, { Origin: 'https://evil.example' }), env })).status, 403);
  assert.equal((await onRequest({ request: new Request('https://msime.app/api/feedback', { method: 'POST', headers: { Origin: 'https://msime.app', 'Content-Type': 'application/json' }, body: '{' }), env })).status, 400);
  assert.equal(calls.length, 0);
});
test('config endpoint exposes only the site key and disables unconfigured and preview deployments', async () => {
  const get = new Request('https://msime.app/api/feedback');
  assert.deepEqual(await (await onRequest({ request: get, env })).json(), { siteKey: env.TURNSTILE_SITE_KEY });
  assert.equal((await onRequest({ request: get, env: {} })).status, 503);
  assert.equal((await onRequest({ request: new Request('https://preview.pages.dev/api/feedback'), env })).status, 403);
  const method = await onRequest({ request: new Request(get, { method: 'DELETE' }), env });
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('Allow'), 'GET, POST');
});
test('rejects failed, replayed, wrong-action and wrong-host challenges without creating issues', async t => {
  for (const verification of [{ success: false, 'error-codes': ['timeout-or-duplicate'] }, { success: true, action: 'login', hostname: 'msime.app' }, { success: true, action: 'feedback', hostname: 'localhost' }]) {
    await t.test(JSON.stringify(verification), async t => {
      const calls = mockFetch(t, verification);
      assert.equal((await onRequest({ request: request(), env })).status, 403);
      assert.equal(calls.length, 1);
    });
  }
});
test('verification outage fails closed', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  assert.equal((await onRequest({ request: request(), env })).status, 503);
});
test('GitHub failures never disclose credentials or upstream response details', async t => {
  mockFetch(t, undefined, () => Response.json({ message: env.GITHUB_ISSUES_TOKEN }, { status: 403 }));
  const response = await onRequest({ request: request(), env });
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes(env.GITHUB_ISSUES_TOKEN));
});
test('ambiguous GitHub write is not retried and provides a link to check for duplicates', async t => {
  const calls = mockFetch(t, undefined, () => { throw new Error('timeout'); });
  const response = await onRequest({ request: request(), env });
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.equal(body.uncertain, true);
  assert.equal(body.issuesUrl, 'https://github.com/metasequoiaime/MSIME-Windows/issues');
  assert.equal(calls.length, 2);
});
test('user text cannot inject template headings or active mentions', () => {
  const issue = formatIssue({ ...form, extra: '## invented\n@team' });
  assert.ok(issue.body.includes('> ## invented\n> @\u200bteam'));
  assert.ok(!issue.body.includes('\n## invented'));
});

test('optional contacts are published verbatim as code without mention notifications', async t => {
  const calls = mockFetch(t);
  const contacts = { qq: '123456789', qqNickname: '测试昵称', wechat: 'example_wechat', github: 'example-user', email: 'example@example.com' };
  const response = await onRequest({ request: request({ ...form, ...contacts }), env });
  assert.equal(response.status, 201);
  const issue = JSON.parse(calls.at(-1).options.body);
  for (const value of Object.values(contacts)) assert.ok(issue.body.includes(`\` ${value} \``));
  assert.ok(issue.body.includes('联系方式（提交者自愿公开，未经验证）'));
  assert.ok(!formatIssue(form).body.includes('## 联系方式'));
});

test('invalid contact details are rejected before external requests', async t => {
  const calls = mockFetch(t);
  for (const contacts of [{ email: 'not-an-email' }, { qq: 'x'.repeat(101) }, { qqNickname: 'x'.repeat(101) }, { wechat: 'line\nbreak' }, { github: 123 }, { github: 'https://github.com/example-user' }, { github: '@example-user' }]) {
    assert.equal((await onRequest({ request: request({ ...form, ...contacts }), env })).status, 400);
  }
  assert.equal(calls.length, 0);
});
