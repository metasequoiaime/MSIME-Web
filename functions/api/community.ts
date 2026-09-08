import { communityToken, githubAppConfig } from "../../shared/github-app.ts";
import { cachedCommunity, loadCommunity } from "../../shared/live-community.ts";
import fallback from "../../public/community.json";

export async function onRequest({ request, env }: { request: Request; env: Record<string, unknown> }) {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (request.method !== "GET") return new Response(null, { status: 405, headers: { ...headers, Allow: "GET" } });
  const key = new Request(new URL("/api/community", request.url));
  const cache = (caches as CacheStorage & { default: Cache }).default;
  const data = await cachedCommunity(key, cache, async () => {
    const token = await communityToken(githubAppConfig.parse(env));
    return loadCommunity(token);
  }, fallback);
  return Response.json(data, { headers });
}
