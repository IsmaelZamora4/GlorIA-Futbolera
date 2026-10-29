import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") ?? "/";
  let safeDestination = new URL("/", url.origin);
  try {
    const destination = new URL(requestedNext, url.origin);
    if (destination.origin === url.origin) safeDestination = destination;
  } catch {
    // Invalid redirect targets fall back to the app home page.
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?auth_error=callback", url.origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?auth_error=callback", url.origin));
    }
  } catch {
    return NextResponse.redirect(new URL("/login?auth_error=callback", url.origin));
  }

  return NextResponse.redirect(safeDestination);
}
