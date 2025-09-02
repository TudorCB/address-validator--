import { redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getReturnTo, clearReturnTo } from "../lib/return-to.server.js";

export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);
  } catch (response) {
    if (response instanceof Response) {
      const returnTo = await getReturnTo(request);
      if (returnTo) {
        const headers = new Headers(response.headers);
        await clearReturnTo(headers);
        throw redirect(returnTo, { headers });
      }
    }
    throw response;
  }

  return null;
};
