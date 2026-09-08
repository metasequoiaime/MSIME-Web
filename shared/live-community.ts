import { z } from "zod";
import { communitySchema } from "../src/community-data.ts";
import { aggregateContributors } from "./community-aggregation.mjs";

const repositorySchema = z.object({ name: z.string().regex(/^[\w.-]+$/), fork: z.boolean(), archived: z.boolean(), private: z.boolean(), stargazers_count: z.number().int().nonnegative() });
const contributorSchema = z.object({ login: z.string(), type: z.string(), avatar_url: z.string(), html_url: z.string(), contributions: z.number().int().nonnegative() });

export async function loadCommunity(token: string, request: typeof fetch = fetch) {
  let requests = 0;
  const signal = AbortSignal.timeout(25_000);
  async function pages(path: string, perPage = 100): Promise<unknown[]> {
    const result: unknown[] = [];
    for (let page = 1; ; page++) {
      if (++requests > 45) throw new Error("Community request budget exceeded");
      const response = await request(`https://api.github.com/${path}${path.includes("?") ? "&" : "?"}per_page=${perPage}&page=${page}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "MSIME-Web-community", "X-GitHub-Api-Version": "2026-03-10" }, signal,
      });
      if (response.status === 204) return result;
      if (!response.ok) throw new Error(`GitHub statistics unavailable: HTTP ${response.status} (${path})`);
      const batch = z.array(z.unknown()).parse(await response.json());
      result.push(...batch);
      if (!response.headers.get("link")?.includes('rel="next"')) return result;
    }
  }
  const repositories = z.array(repositorySchema).parse(await pages("orgs/metasequoiaime/repos?sort=full_name"))
    .filter(repo => !repo.fork && !repo.archived && !repo.private);
  const perRepository = [];
  const monthlyStars = new Map<string, number>();
  // Sequential calls respect GitHub's secondary rate limit and bound open connections.
  for (const repo of repositories) {
    const base = `repos/metasequoiaime/${repo.name}`;
    const contributors = z.array(contributorSchema).parse(await pages(`${base}/contributors`));
    perRepository.push({ repo: repo.name, contributors });
    if (repo.stargazers_count) {
      // GitHub restricts individual stargazer lists; aggregate history is public.
      const weeks = z.array(z.object({ week: z.number().int(), days: z.array(z.number().int().nonnegative()).length(7) })).parse(await pages(`${base}/stargazers/history`, 30));
      for (const week of weeks) week.days.forEach((count, day) => {
        const month = new Date((week.week + day * 86400) * 1000).toISOString().slice(0, 7);
        monthlyStars.set(month, (monthlyStars.get(month) ?? 0) + count);
      });
    }
  }
  const starHistory = [];
  const firstMonth = [...monthlyStars.keys()].sort()[0];
  let total = 0;
  if (firstMonth) {
    const cursor = new Date(`${firstMonth}-01T00:00:00Z`);
    const end = new Date();
    while (cursor <= end) {
      const month = cursor.toISOString().slice(0, 7);
      total += monthlyStars.get(month) ?? 0;
      starHistory.push({ month, stars: total });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }
  return communitySchema.parse({ generatedAt: new Date().toISOString(), stale: false,
    totalStars: repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0), repoCount: repositories.length,
    contributors: aggregateContributors(perRepository), starHistory,
  });
}

type Community = z.infer<typeof communitySchema>;
type Entry = { checkedAt: number; data: Community };
const pending = new Map<string, Promise<Community>>();

export async function cachedCommunity(key: Request, cache: Cache, load: () => Promise<Community>, fallback: Community): Promise<Community> {
  const hit = await cache.match(key);
  const entry = hit ? await hit.json() as Entry : undefined;
  if (entry && Date.now() - entry.checkedAt < 60_000) return entry.data;
  const existing = pending.get(key.url);
  if (existing) return existing;
  const refresh = (async () => {
    let data: Community;
    try { data = await load(); }
    catch { data = { ...(entry?.data ?? fallback), stale: true }; }
    await cache.put(key, Response.json({ checkedAt: Date.now(), data }, { headers: { "Cache-Control": "max-age=86400" } }));
    return data;
  })();
  pending.set(key.url, refresh);
  try { return await refresh; }
  finally { pending.delete(key.url); }
}
