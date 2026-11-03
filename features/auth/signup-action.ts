"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSafeInternalPath } from "@/features/auth/services/redirect";
import { parseSignupInput, performSignupWithoutEnumeration, signupFeedback } from "@/features/auth/services/signup-feedback";

export async function registerAccount(input: unknown) {
  const parsedInput = parseSignupInput(input);
  if (!parsedInput) return { message: signupFeedback };
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("host");
  let baseUrl: URL;
  try {
    baseUrl = new URL(origin ?? "");
    if (!host || baseUrl.host !== host || (baseUrl.protocol !== "https:" && baseUrl.hostname !== "localhost")) return { message: signupFeedback };
  } catch {
    return { message: signupFeedback };
  }
  const next = getSafeInternalPath(parsedInput.next, baseUrl.origin);
  const callback = new URL("/auth/callback", baseUrl.origin);
  callback.searchParams.set("next", next);
  const message = await performSignupWithoutEnumeration(async () => {
    const supabase = await createClient();
    return supabase.auth.signUp({
      email: parsedInput.email,
      password: parsedInput.password,
      options: {
        emailRedirectTo: callback.toString(),
        data: { name: parsedInput.name, full_name: parsedInput.name, username: parsedInput.username },
      },
    });
  });
  return { message };
}
