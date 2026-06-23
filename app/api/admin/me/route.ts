import { withDBAndErrorHandling } from "@/lib/api/routeWrapper";
import { jsonOk } from "@/lib/api/http";
import { requirePlatformAdmin } from "@/lib/admin/requirePlatformAdmin";
import type { AdminMeResponse } from "@/types/admin";

export const GET = withDBAndErrorHandling(async (req) => {
  const admin = await requirePlatformAdmin(req);

  const body: AdminMeResponse = {
    isAdmin: true,
    userId: admin.userId,
    email: admin.email,
    username: admin.username,
  };

  return jsonOk(body);
});
