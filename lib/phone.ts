/** Normalize Indian mobile numbers to E.164 (+91XXXXXXXXXX). */
export function normalizeIndianPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 13 && digits.startsWith("091")) return `+91${digits.slice(1)}`;
  if (digits.length === 13 && phone.trim().startsWith("+91")) return `+${digits}`;
  return null;
}

export function syntheticEmailForPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `${digits || "unknown"}@phone.ttpro.local`;
}

export function generatePhoneUsername(phone: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  const tail = phone.replace(/\D/g, "").slice(-4) || "0000";
  return `player_${tail}_${suffix}`;
}
