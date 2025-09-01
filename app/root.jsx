import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useEffect } from "react";
import { AppProvider, Frame } from "@shopify/polaris";
import enTranslations from "@shopify/polaris/locales/en.json";
import "@shopify/polaris/build/esm/styles.css";
import "@shopify/polaris-viz/build/esm/styles.css";
import { ToastProvider } from "./components/ToastContext.jsx";

export const meta = () => ([
  { charSet: "utf-8" },
  { title: "Address Validator++" },
  { name: "viewport", content: "width=device-width,initial-scale=1" }
]);

export const loader = async () => {
  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
};

export default function App() {
  const { apiKey } = useLoaderData();
  // Optional: prefer system theme; Polaris handles dark mode automatically if desired
  useEffect(() => { }, []);
  return (
    <html lang="en">
      <head>
        <Meta />
        {/* Expose API key for App Bridge initialization in admin pages */}
        {apiKey ? <meta name="shopify-api-key" content={apiKey} /> : null}
        <Links />
      </head>
      <body>
        <AppProvider i18n={enTranslations}>
          <Frame>
            <ToastProvider>
              <Outlet />
            </ToastProvider>
          </Frame>
        </AppProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
