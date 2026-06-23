import { User } from "@/models/User";

/** Derive a valid username base from an email local-part */
export function usernameBaseFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  let base = local.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (!base) base = "user";
  if (!/^[a-zA-Z0-9]/.test(base)) base = `u${base}`;
  if (!/[a-zA-Z0-9]$/.test(base)) base = `${base}0`;
  return base.slice(0, 26);
}

/** Pick a unique username, appending a numeric suffix when needed */
export async function generateUniqueUsername(email: string): Promise<string> {
  const base = usernameBaseFromEmail(email);
  let candidate = base;
  let suffix = 0;

  while (await User.exists({ username: candidate })) {
    suffix += 1;
    candidate = `${base.slice(0, Math.max(1, 26 - String(suffix).length))}${suffix}`;
  }

  return candidate;
}
