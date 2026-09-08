import { GUIDE_NAMES } from "../shared/site-seo.ts";

/** Preserve old shared guide URLs while consolidating indexing on static paths. */
export function onRequest({ request, next }: { request: Request; next: () => Promise<Response> }) {
  const url = new URL(request.url);
  const guide = url.searchParams.get("platform");
  if (guide && Object.hasOwn(GUIDE_NAMES, guide)) {
    url.pathname = `/docs/${guide}/`;
    url.searchParams.delete("platform");
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
