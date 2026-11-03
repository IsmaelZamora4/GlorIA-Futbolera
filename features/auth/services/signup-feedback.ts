export const signupFeedback = "Si es posible crear una cuenta con esos datos, recibirás instrucciones en tu correo.";

export type SignupInput = { email: string; password: string; name: string; username: string; next: string };

export function parseSignupInput(input: unknown): SignupInput | null {
  try {
    if (!input || typeof input !== "object" || Array.isArray(input)) return null;
    const record = input as Record<string, unknown>;
    const { email, password, name, username, next } = record;
    if (typeof email !== "string" || typeof password !== "string" || typeof name !== "string"
      || typeof username !== "string" || typeof next !== "string") return null;
    if (email.length > 512 || password.length < 8 || password.length > 72 || name.length > 160
      || username.length > 40 || next.length > 2048) return null;

    const normalized = {
      email: email.trim(),
      password,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      next,
    };
    if (normalized.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)
      || normalized.name.length < 2 || normalized.name.length > 80
      || !/^[a-z0-9_]{3,20}$/.test(normalized.username)) return null;
    return normalized;
  } catch {
    return null;
  }
}

export function safeSignupFailureStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error)) return undefined;
  const status = error.status;
  return typeof status === "number" && Number.isInteger(status) && status >= 100 && status <= 599 ? status : undefined;
}

export async function performSignupWithoutEnumeration(
  signUp: () => Promise<{ error?: unknown }>,
) {
  try {
    const result = await signUp();
    if (result.error) console.warn("auth.signup.failed", { status: safeSignupFailureStatus(result.error) });
  } catch {
    console.warn("auth.signup.failed", { status: undefined });
  }
  return signupFeedback;
}
