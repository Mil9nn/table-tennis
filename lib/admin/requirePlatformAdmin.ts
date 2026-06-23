import { User } from "@/models/User";
import { requireAuth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { env } from "@/lib/env";
import {
  isPlatformAdminEmail as isEmailInAllowlist,
  parseAdminEmails,
} from "@/lib/admin/adminEmails";

let emptyEnvWarned = false;

export { parseAdminEmails } from "@/lib/admin/adminEmails";

export function getAdminEmails(): string[] {
  return parseAdminEmails(env.ADMIN_EMAILS ?? process.env.ADMIN_EMAILS);
}

export function isPlatformAdminEmail(email: string): boolean {
  return isEmailInAllowlist(email, getAdminEmails());
}

export interface PlatformAdmin {
  userId: string;
  email: string;
  username: string;
}

export async function requirePlatformAdmin(
  request: Request
): Promise<PlatformAdmin> {
  const allowlist = getAdminEmails();

  if (allowlist.length === 0) {
    if (env.NODE_ENV === "development" && !emptyEnvWarned) {
      console.warn(
        "[Admin] ADMIN_EMAILS is empty — all admin access denied. Set ADMIN_EMAILS in .env.local"
      );
      emptyEnvWarned = true;
    }
    throw ApiError.forbidden("Admin access is not configured");
  }

  const { userId } = await requireAuth(request);

  const user = await User.findById(userId).select("email username").lean();
  if (!user?.email) {
    throw ApiError.notFound("User");
  }

  if (!isEmailInAllowlist(user.email, allowlist)) {
    throw ApiError.forbidden("You do not have admin access");
  }

  return {
    userId,
    email: user.email,
    username: user.username,
  };
}
