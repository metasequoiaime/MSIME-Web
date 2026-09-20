// Bots commit far more than people do; leaving them in would put github-actions at the top of a list titled "core contributors".
const isBot = account =>
  account?.type === 'Bot' || /\[bot\]$/i.test(account?.login ?? '');

export function aggregateContributors(perRepository, limit = 12) {
  const totals = new Map();

  for (const { repo, contributors } of perRepository) {
    for (const contributor of contributors) {
      if (isBot(contributor) || typeof contributor.login !== 'string') continue;
      const existing = totals.get(contributor.login) ?? {
        login: contributor.login,
        avatarUrl: contributor.avatar_url,
        url: contributor.html_url,
        contributions: 0,
        repos: [],
      };
      existing.contributions += contributor.contributions ?? 0;
      existing.repos.push(repo);
      totals.set(contributor.login, existing);
    }
  }

  return [...totals.values()]
    .sort((left, right) => right.contributions - left.contributions || left.login.localeCompare(right.login))
    .slice(0, limit)
    .map(entry => ({ ...entry, repos: entry.repos.length }));
}

/**
 * Turn GitHub's weekly star buckets — `{ week, days }` entries from `/stargazers/history` — into a cumulative monthly series.
 *
 * The weekly aggregate rather than per-star `starred_at` timestamps because `/stargazers` answers 403 to both tokens this project has: the worker's app installation token and the snapshot workflow's `GITHUB_TOKEN`. Only the aggregate is public, so it is the one source both callers can share, and sharing it is the point — the snapshot job spent nine days broken because the worker moved off `/stargazers` and its own copy of this code did not.
 *
 * Monthly buckets, not one point per star: the chart is about the shape of the curve, and 1400 points would draw the same line while making the file 30x bigger. Months with no new stars still get a point so a quiet stretch reads as a plateau instead of a straight line between distant dates. That includes the empty weeks GitHub reports before a repository's first star, which is what anchors the series at repository creation rather than at the first star.
 */
export function monthlyStarHistory(weeks) {
  const perMonth = new Map();
  for (const { week, days } of weeks) {
    days.forEach((count, day) => {
      const month = new Date((week + day * 86400) * 1000).toISOString().slice(0, 7);
      perMonth.set(month, (perMonth.get(month) ?? 0) + count);
    });
  }

  const first = [...perMonth.keys()].sort()[0];
  if (!first) return [];

  const series = [];
  let total = 0;
  const cursor = new Date(`${first}-01T00:00:00Z`);
  const end = new Date();

  while (cursor <= end) {
    const month = cursor.toISOString().slice(0, 7);
    total += perMonth.get(month) ?? 0;
    series.push({ month, stars: total });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return series;
}

