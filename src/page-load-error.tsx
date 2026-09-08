import { useEffect } from "react";

import { recoverUpdatedPage } from "./module-recovery";

export function PageLoadError({ error }: { error: unknown }) {
  const tw = typeof window !== "undefined" && window.location.pathname.startsWith("/zh-TW/");
  useEffect(() => { void recoverUpdatedPage(error); }, [error]);
  return <main className="content-page"><div className="container"><section className="card" role="alert">
    <h1>{tw ? "頁面暫時無法載入" : "页面暂时无法加载"}</h1>
    <p>{tw ? "網站可能剛剛更新，或網路連線暫時中斷。請重新載入頁面。" : "网站可能刚刚更新，或网络连接暂时中断。请重新加载页面。"}</p>
    <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>{tw ? "重新載入" : "重新加载"}</button>
  </section></div></main>;
}
