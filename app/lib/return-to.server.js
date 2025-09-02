import { createCookie } from "@remix-run/node";

const COOKIE_NAME = "return_to";

const returnToCookie = createCookie(COOKIE_NAME, {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 10, // 10 minutes
  secure: process.env.NODE_ENV === "production",
});

export async function setReturnTo(request, headers) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/auth")) {
    return;
  }

  const returnTo = url.pathname + url.search;
  headers.append("Set-Cookie", await returnToCookie.serialize(returnTo));
}

export async function getReturnTo(request) {
  const cookieHeader = request.headers.get("Cookie");
  const returnTo = await returnToCookie.parse(cookieHeader);
  return returnTo;
}

export async function clearReturnTo(headers) {
  headers.append("Set-Cookie", await returnToCookie.serialize("", { maxAge: 0 }));
}
