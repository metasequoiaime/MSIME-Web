/** Legacy macOS beta links open the existing download page in one step. */
export function onRequest({ request, next }: { request: Request; next: () => Promise<Response> }) {
  const url = new URL(request.url);
  if (url.searchParams.get("platform") !== "macos") return next();
  url.pathname = `${url.pathname.startsWith("/zh-TW/") ? "/zh-TW" : ""}/download/`;
  return Response.redirect(url.toString(), 301);
}
