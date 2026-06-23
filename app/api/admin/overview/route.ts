import { withDBAndErrorHandling } from "@/lib/api/routeWrapper";
import { jsonOk } from "@/lib/api/http";
import { requirePlatformAdmin } from "@/lib/admin/requirePlatformAdmin";
import { getAdminOverview } from "@/services/admin/adminStatsService";

export const GET = withDBAndErrorHandling(async (req) => {
  await requirePlatformAdmin(req);
  const overview = await getAdminOverview();
  return jsonOk(overview);
});
