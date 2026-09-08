import { renderToString } from "react-dom/server";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { makeRouter } from "./routes";
import { ThemeProvider } from "./theme";

export async function render(url: string, data: Record<string, unknown>) {
  const router = makeRouter(url);
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  for (const [key, value] of Object.entries(data)) client.setQueryData([key], value);
  await router.load();
  const html = renderToString(<QueryClientProvider client={client}><ThemeProvider><RouterProvider router={router} /></ThemeProvider></QueryClientProvider>);
  client.clear();
  return html;
}
