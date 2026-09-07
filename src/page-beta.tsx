import { PageHero } from "./page-content";
import { usePageMeta } from "./page-meta";
import { useReveal } from "./use-reveal";
import "./beta.scss";

/*
 * iOS 内测页。
 *
 * 这里只有一条 TestFlight 公开链接，没有表单。收邮箱再调 App Store Connect API 建测试员，把人放进的是同一个外部测试组，
 * 结果一样，代价却是本站要部署一份 Apple 私钥，还得在输入框前面加人机验证——否则那个地址栏就是一台替人发邀请信的中继。
 */
const TESTFLIGHT_LINK = "https://testflight.apple.com/join/bUzPvyqt";
const TITLE = "iOS 内测 | 水杉输入法";
const DESCRIPTION = "加入水杉输入法 iOS 版的 TestFlight 内测：用 iPhone 打开链接即可安装，不需要邮箱或开发者账号。";

export function BetaPage() {
  usePageMeta(TITLE, DESCRIPTION);
  useReveal();

  return (
    <>
      <PageHero
        kicker="TestFlight"
        title="iOS 内测"
        leadHtml="水杉输入法的 iOS 键盘还在内测。用 iPhone 打开 TestFlight 链接就能装，不需要邮箱，也不需要开发者账号。"
      />

      <main className="content-page">
        <div className="container docs-content beta-content">
          <section className="card doc-card beta-action" data-reveal>
            <h2>加入内测</h2>
            <p>在 iPhone 上打开下面的链接即可安装。本站不收集任何信息。</p>

            <a className="btn btn-primary btn-lg beta-cta" href={TESTFLIGHT_LINK} target="_blank" rel="noreferrer">
              在 TestFlight 中打开
            </a>

            <p className="beta-cta-url">{TESTFLIGHT_LINK.replace("https://", "")}</p>
          </section>

          <div className="beta-notes">
            <section className="card doc-card beta-note" data-reveal>
              <h3>怎么装</h3>
              <ol className="beta-steps">
                <li>
                  在 iPhone 上装好{" "}
                  <a href="https://apps.apple.com/app/testflight/id899247664" target="_blank" rel="noreferrer">
                    TestFlight
                  </a>
                  。
                </li>
                <li>用 iPhone 打开上面的链接，在 TestFlight 里点「接受」，再点「安装」。</li>
                <li>装好后到「设置 → 通用 → 键盘 → 键盘 → 添加新键盘」里启用水杉输入法。</li>
              </ol>
            </section>

            <section className="card doc-card beta-note" data-reveal>
              <h3>需要知道的</h3>
              <p>
                需要 iOS 15 或更高版本。TestFlight 的每个构建 90
                天后过期，届时从 TestFlight 里更新到新版本即可，不用重新加入。名额上限 10000 人。
              </p>
            </section>

            <section className="card doc-card beta-note" data-reveal>
              <h3>如果链接说「不接受新测试员」</h3>
              <p>
                那是当前构建还在 Apple 的 Beta App Review 排队，不是名额满了。审核通常一到两天，过了链接会自动重新开放，
                过一阵再点一次即可。也可以到{" "}
                <a href="https://t.me/msimegroup" target="_blank" rel="noreferrer">
                  Telegram 群
                </a>
                问一声当前状态。
              </p>
            </section>

            <section className="card doc-card beta-note" data-reveal>
              <h3>iOS 版还没有上架计划</h3>
              <p>
                iOS 目前只有 TestFlight 这一条路，是否上架 App Store 尚未决定——词库中包含 GPL-3.0 的第三方数据，与 App
                Store 条款存在冲突，需要先解决授权问题。进展见{" "}
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
        </div>
      </main>
    </>
  );
}
