import { useEffect } from "react";
import { LocaleLink as Link } from "./locale-link";
import { usePageSearch } from "./use-page-search";
import { useLocale } from "./use-locale";
import { PageHero } from "./page-content";
import { usePageMeta } from "./page-meta";
import { useReveal } from "./use-reveal";
import "./beta.scss";

const TESTFLIGHT_LINK = "https://testflight.apple.com/join/bUzPvyqt";

export function BetaPage() {
  const { t } = useLocale();
  const { choice, get, update, ready } = usePageSearch();
  const platform = choice("platform", ["macos", "ios"] as const, "ios");
  const requestedPlatform = get("platform");
  // biome-ignore lint/correctness/useExhaustiveDependencies: normalize only when the requested platform changes.
  useEffect(() => {
    if (ready && requestedPlatform !== platform) update({ platform }, true);
  }, [ready, requestedPlatform, platform]);
  usePageMeta();
  useReveal([platform]);

  return (
    <>
      <PageHero
        kicker="公开测试"
        title={t(platform === "macos" ? "macOS 公测" : "iOS 公测")}
        leadHtml={t(platform === "macos" ? "水杉输入法 macOS 版已开放公测。下载安装包，按使用指南启用输入法。" : "水杉输入法的 iOS 键盘已开放公测。用 iPhone 打开 TestFlight 链接就能装，不需要邮箱，也不需要开发者账号。")}
      />

      <main className="content-page">
        <div className="container docs-content beta-content">
          <fieldset className="beta-platforms">
            <legend>{t("选择公测平台")}</legend>
            <div className="btn-row">{(["macos", "ios"] as const).map(value => <button key={value} type="button" className={`btn ${platform === value ? "btn-primary" : "btn-ghost"}`} aria-pressed={platform === value} onClick={() => update({ platform: value })}>{value === "macos" ? "macOS" : "iOS"}</button>)}</div>
          </fieldset>
          {platform === "macos" ? <section className="doc-card beta-action" data-reveal>
            <h2>{t("加入 macOS 公测")}</h2>
            <p>{t("适用于 macOS 12 及以上。下载页提供当前版本的安装包、发布说明与校验信息。")}</p>
            <div className="btn-row">
              <Link className="btn btn-primary" to="/download/" search={{ platform: "macos" }}>{t("下载 macOS 公测版")}</Link>
              <Link className="btn btn-ghost" to="/docs/$guide/" params={{ guide: "macos" }} search={{}}>{t("查看 macOS 安装与使用指南")}</Link>
              <Link className="btn btn-ghost" to="/feedback/" search={{ target: "apple" }}>{t("反馈公测问题")}</Link>
            </div>
          </section> : <>

          <section className="doc-card beta-action" data-reveal>
            <h2>{t("加入公测")}</h2>
            <p>{t("在 iPhone 上点下面的按钮即可安装。本站不收集任何信息。")}</p>

            <a className="btn btn-primary btn-lg beta-cta" href={TESTFLIGHT_LINK} target="_blank" rel="noreferrer">{t("在 TestFlight 中打开")}</a>
          </section>

          <div className="beta-notes">
            <section className="doc-card beta-note" data-reveal>
              <h3>{t("怎么装")}</h3>
              <ol className="beta-steps">
                <li>{t("在 iPhone 上装好")}{" "}
                  <a href="https://apps.apple.com/app/testflight/id899247664" target="_blank" rel="noreferrer">
                    TestFlight
                  </a>
                  。
                </li>
                <li>{t("用 iPhone 打开本页，点上面的按钮，在 TestFlight 里点「接受」，再点「安装」。")}</li>
                <li>{t("装好后到「设置 → 通用 → 键盘 → 键盘 → 添加新键盘」里启用")}<span className="beta-keep">{t("水杉输入法")}</span>。
                </li>
              </ol>
            </section>

            <section className="doc-card beta-note" data-reveal>
              <h3>{t("需要知道的")}</h3>
              <p>{t("需要 iOS 15 或更高版本。TestFlight 的每个构建 90 天后过期，届时从 TestFlight 里更新到新版本即可，不用重新加入。")}<span className="beta-keep">{t("名额上限 10000 人")}</span>。
              </p>
            </section>

            <section className="doc-card beta-note" data-reveal>
              <h3>{t("如果链接说「不接受新测试员」")}</h3>
              <p>{t("多半是当前构建还在 Apple 的 Beta App Review 排队，或者上一版已经过期而新版还没放出来。这两种情况审核通常一到两天，过了链接会自动重新开放，过一阵再点一次即可。名额满了显示的也是同一句话，从页面上分不出来，可以到")}{" "}
                <a href="https://t.me/msimegroup" target="_blank" rel="noreferrer">{t("Telegram 群")}</a>{t("问一声当前状态。")}</p>
            </section>

            <section className="doc-card beta-note" data-reveal>
              <h3>{t("iOS 版还没有上架计划")}</h3>
              <p>{t("iOS 目前只有 TestFlight 这一条路，是否上架 App Store 尚未决定：词库中包含 GPL-3.0 的第三方数据，与 App Store 条款存在冲突，需要先解决授权问题。进展见")}{" "}
                <a
                  href="https://github.com/metasequoiaime/MSIME-Apple/blob/main/docs/ios-distribution.md"
                  target="_blank"
                  rel="noreferrer"
                >
                  ios-distribution.md
                </a>
                。
              </p>
            </section>
          </div>
          </>}
        </div>
      </main>
    </>
  );
}
