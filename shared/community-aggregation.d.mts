export interface Contributor {
  login: string;
  type?: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}
export function aggregateContributors(repositories: { repo: string; contributors: Contributor[] }[], limit?: number): {
  login: string; avatarUrl: string; url: string; contributions: number; repos: number;
}[];
export function monthlyStarHistory(timestamps: string[]): { month: string; stars: number }[];
