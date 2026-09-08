import { z } from "zod";
import { feedbackSchema, formatIssue, targets } from "../../shared/feedback.ts";
import { githubAppConfig, installationToken } from "../../shared/github-app.ts";

const configSchema = githubAppConfig.extend({
  TURNSTILE_SITE_KEY: z.string().trim().min(1),
  TURNSTILE_SECRET: z.string().trim().min(1),
  FEEDBACK_ORIGIN: z.url().refine(value => new URL(value).origin === value),
});
const requestSchema = feedbackSchema.extend({ token: z.string().min(1).max(2048) });
const json = (data: unknown, status = 200) => Response.json(data, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" },
});

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 40_000) {
        await reader.cancel();
        throw new Error("large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function onRequest({ request, env }: { request: Request; env: Record<string, unknown> }) {
  if (!["GET", "POST"].includes(request.method)) {
    const response = json({ error: "不支持此请求方式" }, 405);
    response.headers.set("Allow", "GET, POST");
    return response;
  }
  const config = configSchema.safeParse(env);
  if (!config.success) return json({ error: "需求上报暂未开放，请稍后再试。" }, 503);
  const { TURNSTILE_SITE_KEY, TURNSTILE_SECRET, FEEDBACK_ORIGIN } = config.data;
  // 预览部署默认关闭，除非为其配置独立 origin 和凭据。
  if (new URL(request.url).origin !== FEEDBACK_ORIGIN) return json({ error: "此站点未开放需求上报。" }, 403);
  if (request.method === "GET") return json({ siteKey: TURNSTILE_SITE_KEY });
  if (request.headers.get("Origin") !== FEEDBACK_ORIGIN) return json({ error: "请从官网表单提交。" }, 403);
  if (request.headers.get("Content-Type")?.split(";")[0].trim() !== "application/json") return json({ error: "请求格式不正确。" }, 415);
  let input: unknown;
  try { input = await readBody(request); }
  catch { return json({ error: "内容过长或请求格式不正确。" }, 400); }
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
  const data = parsed.data;
  try {
    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: TURNSTILE_SECRET, response: data.token }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!verification.ok) return json({ error: "验证服务暂时不可用，请重新验证后再试。" }, 503);
    const result = z.object({ success: z.literal(true), action: z.literal("feedback"), hostname: z.literal(new URL(FEEDBACK_ORIGIN).hostname) }).safeParse(await verification.json());
    if (!result.success) return json({ error: "验证已失效，请重新验证后提交。" }, 403);
  } catch { return json({ error: "验证服务暂时不可用，请重新验证后再试。" }, 503); }

  const repo = targets[data.target].repo;
  let token: string;
  try { token = await installationToken(config.data, repo); }
  catch { return json({ error: "需求机器人暂时不可用，请稍后再试。" }, 503); }
  // 不自动重试 GitHub 写请求：响应丢失时，Issue 可能已经创建。
  try {
    const response = await fetch(`https://api.github.com/repos/metasequoiaime/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "MSIME-Web-feedback",
      },
      body: JSON.stringify(formatIssue(data)),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      if (response.status === 429 || response.status === 403) return json({ error: "GitHub 暂时限制提交，请稍后再试。" }, 503);
      if (response.status >= 500) throw new Error("uncertain");
      return json({ error: "GitHub 未能接收需求，请稍后再试。" }, 502);
    }
    const issue = z.object({ number: z.number().int().positive() }).parse(await response.json());
    return json({ url: `https://github.com/metasequoiaime/${repo}/issues/${issue.number}` }, 201);
  } catch {
    return json({ error: "暂时无法确认提交结果。请先查看仓库中的最新 Issue，确认未创建后再提交，避免重复。", uncertain: true, issuesUrl: `https://github.com/metasequoiaime/${repo}/issues` }, 502);
  }
}
