import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS =
  process.env.NODE_ENV === "production"
    ? ["/", "/auth"]
    : ["/", "/auth", "/preview"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== "/" && pathname.startsWith(p)),
  );
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Missing config used to throw here, and a throwing middleware returns
  // MIDDLEWARE_INVOCATION_FAILED for *every* route — the landing page included.
  // Let the request through instead so the site still renders and the page
  // itself can report the problem.
  if (!url || !key) {
    console.error(
      "Supabase env vars are missing; auth is disabled for this request.",
    );
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // getUser() revalidates the token with Supabase. Do not swap this for
  // getSession(), which trusts the cookie without verifying it.
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    // A Supabase outage or a network blip must not 500 the whole site. Treat
    // it as "not signed in" — protected routes still redirect to the landing
    // page, which is the safe direction to fail in.
    console.error("Session check failed:", error);
  }

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    // API routes must fail with a status a fetch() can read. Redirecting them
    // to "/" makes an expired session look like a 200 of HTML to the caller.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && pathname === "/") {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/feed";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}
