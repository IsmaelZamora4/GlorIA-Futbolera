export function getSafeInternalPath(value: string | null | undefined, origin: string, fallback = "/home") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;

  try {
    const destination = new URL(value, origin);
    if (destination.origin !== origin) return fallback;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return fallback;
  }
}
