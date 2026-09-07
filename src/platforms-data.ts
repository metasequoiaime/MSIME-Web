import { z } from "zod";
import { PLATFORMS, type Platform } from "./platform";

const downloadSchema = z.object({
  label: z.string(),
  arch: z.string(),
  name: z.string(),
  url: z.string().url(),
  size: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/).nullable().catch(null),
});

/** 由 scripts/generate-platforms.mjs 生成，三个平台各自最新一个已发布版本。 */
const platformsSchema = z.object({
  generatedAt: z.string(),
  platforms: z.record(
    z.enum(PLATFORMS),
    z.object({
      version: z.string(),
      releaseUrl: z.string().url(),
      publishedAt: z.string(),
      prerelease: z.boolean().catch(false),
      // 三态：true 已签名、false 未签名、null 判不出来。判不出来时页面什么都不说。
      signed: z.boolean().nullable().catch(null),
      downloads: z.array(downloadSchema).min(1),
    })
  ),
  /* 三个平台共用同一份词库，单独发布，所以放在 platforms 之外。 */
  dictionary: z
    .object({
      tag: z.string(),
      releaseUrl: z.string().url(),
      publishedAt: z.string(),
      files: z
        .array(
          z.object({
            name: z.string(),
            label: z.string(),
            size: z.number().int().nonnegative(),
            sha256: z.string().regex(/^[0-9a-f]{64}$/).nullable().catch(null),
          })
        )
        .min(1),
    })
    .nullable()
    .catch(null),
});

export const fetchPlatforms = async () => {
  const response = await fetch("/platforms.json");
  if (!response.ok) throw new Error(`Platform manifest returned ${response.status}`);
  return platformsSchema.parse(await response.json());
};


export type Platforms = z.infer<typeof platformsSchema>["platforms"];
export type PlatformRelease = NonNullable<Platforms[Platform]>;
export type Dictionary = NonNullable<z.infer<typeof platformsSchema>["dictionary"]>;
