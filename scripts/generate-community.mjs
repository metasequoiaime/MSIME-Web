import { writeFile } from 'node:fs/promises';

// Optional static fallback for SSR and API outages. Live statistics use /api/community.
const organisation = 'metasequoiaime';

import { aggregateContributors, monthlyStarHistory } from '../shared/community-aggregation.mjs';
export { aggregateContributors, monthlyStarHistory } from '../shared/community-aggregation.mjs';

const headers = () => {
  const value = { Accept: 'application/vnd.github+json' };
  if (process.env.GH_TOKEN) value.Authorization = `Bearer ${process.env.GH_TOKEN}`;
  return value;
};

async function getJson(url, accept) {
  const response = await fetch(url, {
    headers: accept ? { ...headers(), Accept: accept } : headers(),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`${url} failed: HTTP ${response.status}`);
  return response.json();
}

/** Walk `?page=` until a short page comes back. GitHub caps stargazers at 400 pages; this repo is nowhere near it. */
async function getAllPages(url, accept) {
  const collected = [];
  for (let page = 1; page <= 60; page += 1) {
    const batch = await getJson(`${url}${url.includes('?') ? '&' : '?'}per_page=100&page=${page}`, accept);
    if (!Array.isArray(batch) || batch.length === 0) break;
    collected.push(...batch);
    if (batch.length < 100) break;
  }
  return collected;
}

async function main() {
  const repositories = (await getAllPages(`https://api.github.com/orgs/${organisation}/repos?sort=full_name`))
    .filter(repo => !repo.fork && !repo.archived && !repo.private);

  const starEvents = [];
  const perRepository = [];

  for (const repo of repositories) {
    const contributors = await getAllPages(`https://api.github.com/repos/${organisation}/${repo.name}/contributors`)
      .catch(() => []);
    perRepository.push({ repo: repo.name, contributors });

    if (repo.stargazers_count > 0) {
      // The star+json media type is what turns /stargazers into timestamps instead of a list of users.
      const stargazers = await getAllPages(
        `https://api.github.com/repos/${organisation}/${repo.name}/stargazers`,
        'application/vnd.github.star+json'
      );
      for (const entry of stargazers) if (entry.starred_at) starEvents.push(entry.starred_at);
    }
  }

  const community = {
    generatedAt: new Date().toISOString(),
    totalStars: repositories.reduce((sum, repo) => sum + (repo.stargazers_count ?? 0), 0),
    repoCount: repositories.length,
    starHistory: monthlyStarHistory(starEvents),
    contributors: aggregateContributors(perRepository),
  };

  if (!community.starHistory.length || !community.contributors.length)
    throw new Error('Refusing to write an empty community snapshot');

  await writeFile(new URL('../public/community.json', import.meta.url), `${JSON.stringify(community, null, 2)}\n`);
  console.log(`Generated community snapshot: ${community.totalStars} stars, ${community.contributors.length} contributors`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
