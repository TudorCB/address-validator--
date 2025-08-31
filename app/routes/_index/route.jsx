import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  // Redirect root to the Polaris Dashboard route
  const qs = url.search ? url.search : "";
  throw redirect(`/index${qs}`);
};

export default function Empty() {
  return null;
}
