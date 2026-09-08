import { z } from "zod";

const githubUrl = (prefix: string) =>
  z
    .string()
    .url()
    .refine((value) => value.startsWith(prefix), { message: `地址必须以 ${prefix} 开头` });

export const communitySchema = z.object({
  generatedAt: z.string(),
  stale: z.boolean().optional(),
  totalStars: z.number().int().nonnegative(),
  repoCount: z.number().int().nonnegative(),
  starHistory: z.array(z.object({ month: z.string(), stars: z.number().int().nonnegative() })).min(1),
  contributors: z
    .array(
      z.object({
        login: z.string(),
        avatarUrl: githubUrl("https://avatars.githubusercontent.com/"),
        url: githubUrl("https://github.com/"),
        contributions: z.number().int().nonnegative(),
        repos: z.number().int().nonnegative(),
      })
    )
    .min(1),
});

