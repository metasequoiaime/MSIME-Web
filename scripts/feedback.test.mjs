import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateKeyPairSync, verify } from 'node:crypto';
import { onRequest } from '../functions/api/feedback.ts';
import { formatIssue, targets } from '../shared/feedback.ts';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const env = { GITHUB_APP_ID: '123', GITHUB_APP_INSTALLATION_ID: '456', GITHUB_APP_PRIVATE_KEY: privateKey.export({ type: 'pkcs1', format: 'pem' }), TURNSTILE_SITE_KEY: 'test-only-sitekey', TURNSTILE_SECRET: 'test-only-secret', FEEDBACK_ORIGIN: 'https://msime.app' };
const form = { target: 'windows', title: '增加候选窗口字号设置', background: '在高分辨率屏幕上候选字太小，看起来比较吃力。', expected: '希望可以单独设置候选窗口字号，不影响其他界面。', environment: '测试环境', extra: '', consent: true, token: 'test-token' };
const request = (data = form, headers = {}) => new Request('https://msime.app/api/feedback', { method: 'POST', headers: { Origin: 'https://msime.app', 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
function mockFetch(t, verification = { success: true, action: 'feedback', hostname: 'msime.app' }, github = () => Response.json({ number: 42 }, { status: 201 })) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    if (url.includes('siteverify')) return Response.json(verification);
    if (url.includes('/access_tokens')) return Response.json({ token: 'test-only-token' });
    return github();
  });
  return calls;
}

test('all seven targets create an issue in the fixed repository with the shared template', async t => {
  const calls = mockFetch(t);
  for (const [target, { repo }] of Object.entries(targets)) {
    const data = { ...form, target, repo: 'attacker/elsewhere' };
    const response = await onRequest({ request: request(data), env });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).url, `https://github.com/metasequoiaime/${repo}/issues/42`);
    const auth = calls.at(-2);
    assert.equal(auth.url, 'https://api.github.com/app/installations/456/access_tokens');
    assert.deepEqual(JSON.parse(auth.options.body), { repositories: [repo], permissions: { issues: 'write' } });
    const [header, claims, signature] = auth.options.headers.Authorization.slice(7).split('.');
    assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url')), { alg: 'RS256', typ: 'JWT' });
    const jwt = JSON.parse(Buffer.from(claims, 'base64url'));
    assert.equal(jwt.iss, env.GITHUB_APP_ID);
    assert.ok(jwt.iat <= Date.now() / 1000 && jwt.exp > Date.now() / 1000);
    assert.equal(jwt.exp - jwt.iat, 600);
    assert.ok(verify('RSA-SHA256', Buffer.from(`${header}.${claims}`), publicKey, Buffer.from(signature, 'base64url')));
    const call = calls.at(-1);
    assert.equal(call.url, `https://api.github.com/repos/metasequoiaime/${repo}/issues`);
    assert.deepEqual(JSON.parse(call.options.body), formatIssue(data));
    assert.equal(call.options.headers.Authorization, 'Bearer test-only-token');
  }
});
test('rejects invalid target, missing consent, whitespace, overlong text and malformed requests before external calls', async t => {
  const calls = mockFetch(t);
  for (const change of [{ target: '__proto__' }, { consent: false }, { title: '' }, { title: '     ' }, { background: '' }, { expected: '          ' }, { background: 'x'.repeat(3001) }, { token: '' }, { expected: 42 }, { title: 'hello\nworld' }]) {
    assert.equal((await onRequest({ request: request({ ...form, ...change }), env })).status, 400);
  }
  assert.equal((await onRequest({ request: request({ ...form, extra: '字'.repeat(40_000) }), env })).status, 400);
  assert.equal((await onRequest({ request: request(form, { 'Content-Type': 'text/plain' }), env })).status, 415);
  assert.equal((await onRequest({ request: request(form, { Origin: 'https://evil.example' }), env })).status, 403);
  assert.equal((await onRequest({ request: new Request('https://msime.app/api/feedback', { method: 'POST', headers: { Origin: 'https://msime.app', 'Content-Type': 'application/json' }, body: '{' }), env })).status, 400);
  assert.equal(calls.length, 0);
});
test('optional fields may all be blank while required content is preserved', async t => {
  const calls = mockFetch(t);
  const response = await onRequest({ request: request({ ...form, environment: '', extra: '', qq: '', qqNickname: '', wechat: '', github: '', email: '' }), env });
  assert.equal(response.status, 201);
  const issue = JSON.parse(calls.at(-1).options.body);
  assert.ok(issue.body.includes(form.background));
  assert.ok(issue.body.includes(form.expected));
  assert.ok(!issue.body.includes('## 联系方式'));
  assert.ok(!issue.body.includes('## 使用环境与版本'));
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
  mockFetch(t, undefined, () => Response.json({ message: 'test-only-token' }, { status: 403 }));
  const response = await onRequest({ request: request(), env });
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes('test-only-token'));
});
test('ambiguous GitHub write is not retried and provides a link to check for duplicates', async t => {
  const calls = mockFetch(t, undefined, () => { throw new Error('timeout'); });
  const response = await onRequest({ request: request(), env });
  assert.equal(response.status, 502);
  const body = await response.json();
  assert.equal(body.uncertain, true);
  assert.equal(body.issuesUrl, 'https://github.com/metasequoiaime/MSIME-Windows/issues');
  assert.equal(calls.length, 3);
});
test('user Markdown preserves lists and paragraphs without active mentions', () => {
  const issue = formatIssue({ ...form, extra: '**补充**\n\n- 第一项\n- @team' });
  assert.ok(issue.body.includes('**补充**\n\n- 第一项\n- @\u200bteam'));
  assert.ok(!issue.body.includes('## 补充说明\n\n>'));
  assert.ok(!formatIssue({ ...form, environment: '', extra: '' }).body.includes('未填写'));
});

test('optional contacts are published verbatim as code without mention notifications', async t => {
  const calls = mockFetch(t);
  const contacts = { qq: '123456789', qqNickname: '测试昵称', wechat: 'example_wechat', github: 'example-user', email: 'example@example.com' };
  const response = await onRequest({ request: request({ ...form, ...contacts }), env });
  assert.equal(response.status, 201);
  const issue = JSON.parse(calls.at(-1).options.body);
  for (const value of Object.values(contacts)) assert.ok(issue.body.includes(`\` ${value} \``));
  assert.ok(issue.body.includes('| QQ | ` 123456789 ` · ` 测试昵称 ` |'));
  assert.ok(issue.body.includes('联系方式由提交者自愿公开，未经验证。'));
  assert.ok(!formatIssue(form).body.includes('## 联系方式'));
});

test('invalid contact details are rejected before external requests', async t => {
  const calls = mockFetch(t);
  for (const contacts of [{ email: 'not-an-email' }, { qq: 'x'.repeat(101) }, { qqNickname: 'x'.repeat(101) }, { wechat: 'line\nbreak' }, { github: 123 }, { github: 'https://github.com/example-user' }, { github: '@example-user' }]) {
    assert.equal((await onRequest({ request: request({ ...form, ...contacts }), env })).status, 400);
  }
  assert.equal(calls.length, 0);
});


test('PKCS8 keys work and personal token alone cannot enable submissions', async t => {
  mockFetch(t);
  assert.equal((await onRequest({ request: request(), env: { ...env, GITHUB_APP_PRIVATE_KEY: privateKey.export({ type: 'pkcs8', format: 'pem' }) } })).status, 201);
  assert.equal((await onRequest({ request: request(), env: { ...env, GITHUB_APP_PRIVATE_KEY: undefined, GITHUB_ISSUES_TOKEN: 'old-personal-token' } })).status, 503);
});

test('App authentication failures never attempt issue creation or leak private keys', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(url);
    if (url.includes('siteverify')) return Response.json({ success: true, action: 'feedback', hostname: 'msime.app' });
    return Response.json({ message: env.GITHUB_APP_PRIVATE_KEY }, { status: 401 });
  });
  const response = await onRequest({ request: request(), env });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.uncertain, undefined);
  assert.ok(!JSON.stringify(body).includes('PRIVATE KEY'));
  assert.equal(calls.length, 2);
  assert.ok(calls.at(-1).endsWith('/access_tokens'));
  assert.equal((await onRequest({ request: request(), env: { ...env, GITHUB_APP_PRIVATE_KEY: 'invalid' } })).status, 503);
  assert.equal(calls.length, 3);
});
