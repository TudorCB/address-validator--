import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { useEffect } from "react";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";

export const meta = () => ([
  { charSet: "utf-8" },
  { title: "Address Validator++" },
  { name: "viewport", content: "width=device-width,initial-scale=1" }
]);

export default function App() {
  // Optional: prefer system theme; Polaris handles dark mode automatically if desired
  useEffect(() => {}, []);
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <AppProvider>
          <Outlet />
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
