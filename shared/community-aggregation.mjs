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
 * Turn raw `starred_at` timestamps into a cumulative monthly series.
 *
 * Monthly buckets, not one point per star: the chart is about the shape of the curve, and 1400 points would draw the same line while making the file 30x bigger. Months with no new stars still get a point so a quiet stretch reads as a plateau instead of a straight line between distant dates.
 */
export function monthlyStarHistory(timestamps) {
  const months = timestamps
    // The string check has to come first: `new Date(null)` is not an invalid date, it is 1970-01-01, so a single missing timestamp would stretch the series back fifty years.
    .filter(value => typeof value === 'string')
    .map(value => new Date(value))
    .filter(date => !Number.isNaN(date.getTime()))
    .sort((left, right) => left - right)
    .map(date => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);

  if (!months.length) return [];

  const perMonth = new Map();
  for (const month of months) perMonth.set(month, (perMonth.get(month) ?? 0) + 1);

  const series = [];
  let total = 0;
  const [firstYear, firstMonth] = months[0].split('-').map(Number);
  const cursor = new Date(Date.UTC(firstYear, firstMonth - 1, 1));
  const end = new Date();

  while (cursor <= end) {
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`;
    total += perMonth.get(key) ?? 0;
    series.push({ month: key, stars: total });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return series;
}

