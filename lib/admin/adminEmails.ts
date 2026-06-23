export function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(
  email: string,
  allowlist: string[]
): boolean {
  if (allowlist.length === 0) {
    return false;
  }
  const normalized = email.trim().toLowerCase();
  return allowlist.includes(normalized);
}
