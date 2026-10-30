import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPageRoots = [
  "/home",
  "/partidos",
  "/competiciones",
  "/posiciones",
  "/metodologia",
  "/partido",
  "/bank",
  "/configuracion",
];

function isProtectedPath(pathname: string) {
  return pathname.startsWith("/api/") || protectedPageRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if ((error || !user) && isProtectedPath(request.nextUrl.pathname)) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

    const loginUrl = request.nextUrl.clone();
    const requestedUrl = request.nextUrl.clone();
    requestedUrl.searchParams.delete("_rsc");
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${requestedUrl.pathname}${requestedUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }
  return response;
}
