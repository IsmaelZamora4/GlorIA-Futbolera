import { NextResponse } from "next/server";
import { getSafeInternalPath } from "@/features/auth/services/redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const safeDestination = new URL(getSafeInternalPath(requestedNext, url.origin), url.origin);

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
