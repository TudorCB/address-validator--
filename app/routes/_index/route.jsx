import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }
  // Redirect root to the Polaris Dashboard route
  throw redirect("/index");
};

export default function Empty() {
  return null;
}
