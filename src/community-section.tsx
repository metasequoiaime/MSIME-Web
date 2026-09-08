import { useLocale } from "./use-locale";
import { useQuery } from "@tanstack/react-query";
import { StarHistoryChart } from "./star-history-chart";
import { useReveal } from "./use-reveal";

/** 同源接口提供 GitHub 最新可用统计；静态数据保留给首屏与故障回退。 */
const fetchCommunity = async () => {
  const response = await fetch("/api/community");
  if (!response.ok) throw new Error(`Community snapshot returned ${response.status}`);
  const { communitySchema } = await import("./community-data");
  return communitySchema.parse(await response.json());
};

const groupThousands = (value: number) => value.toLocaleString("en-US");

export function CommunitySection() {
  const { t } = useLocale();
  const community = useQuery({
    queryKey: ["community"],
    queryFn: fetchCommunity,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // 这一节等数据到了才出现，那时首页那次 observeReveals 早跑完了。不补登记一次，整节会一直停在 opacity: 0。
  useReveal([community.data]);

  // 拿不到快照就整节不渲染。这是锦上添花的内容，缺了它首页依旧完整，没必要留一块报错占位。
  if (!community.data) return null;

  const { totalStars, repoCount, starHistory, contributors } = community.data;

  return (
    <section className="container section">
      <div className="section-eyebrow" data-reveal>
        <span>{t("社区")}</span>
        <span className="section-rule" />
      </div>

      <h2 className="section-title" data-reveal>
        {t("开源社区动态")}</h2>
      <p className="section-lead" data-reveal>
        {t("每分钟自动刷新。提交数可能因 GitHub 缓存而延迟，贡献者头像由 GitHub 提供。")}</p>

      <p className="community-people-note">
        {t(community.data.stale || community.isError ? "暂时无法更新，显示最近可用数据：" : "数据获取时间：")}
        <time dateTime={community.data.generatedAt}>{community.data.generatedAt.replace("T", " ").replace(/\.\d+Z$/, " UTC")}</time>
      </p>

      <div className="community-grid" data-reveal>
        <div className="card community-chart-card">
          <div className="community-chart-head">
            <div>
              <p className="community-kicker">{t("GitHub Star 累计")}</p>
              <strong className="community-figure">{t(groupThousands(totalStars))}</strong>
            </div>
            <a
              className="community-link"
              href="https://github.com/metasequoiaime"
              target="_blank"
              rel="noreferrer"
            >
              {t("在 GitHub 查看 →")}</a>
          </div>
          <StarHistoryChart series={starHistory} />
        </div>

        <div className="card community-people-card">
          <p className="community-kicker">{t("核心贡献者")}</p>
          <p className="community-people-note">
            {t("按")}{t(repoCount)} {t("个仓库的提交数合并排序，机器人账号不计入。")}</p>

          <ul className="community-people">
            {t(contributors.map((person) => (
              <li key={person.login}>
                <a href={person.url} target="_blank" rel="noreferrer">
                  <img
                    src={`${person.avatarUrl}${person.avatarUrl.includes("?") ? "&" : "?"}s=96`}
                    alt=""
                    width="40"
                    height="40"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <span className="community-person-name">{t(person.login)}</span>
                  <span className="community-person-meta">
                    {t(groupThousands(person.contributions))} {t("次提交 ·")}{t(person.repos)} {t("个仓库")}</span>
                </a>
              </li>
            )))}
          </ul>
        </div>
      </div>
    </section>
  );
}
