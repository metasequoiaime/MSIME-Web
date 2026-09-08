import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { makeRouter } from "./routes";
import { ThemeProvider } from "./theme";
import "./style.scss";
import "./docs.scss";

const router = makeRouter();

const queryClient = new QueryClient();
const initialData = document.getElementById("static-query-data");
if (initialData?.textContent) {
  try { for (const [key, value] of Object.entries(JSON.parse(initialData.textContent))) queryClient.setQueryData([key], value); }
  catch { /* The live queries recover if an HTML snapshot is incomplete. */ }
  initialData.remove();
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root; the page shell did not load.");

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
