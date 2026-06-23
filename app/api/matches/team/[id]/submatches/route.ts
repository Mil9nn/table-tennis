import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-utils";
import { jsonError } from "@/lib/api-errors";
import { validateRequest } from "@/lib/validations";
import { configureTeamMatchSubmatchesSchema } from "@/shared/match/teamMatchSchemas";
import { teamMatchService } from "@/services/match/teamMatchService";

/**
 * POST /api/matches/team/[id]/submatches
 * Configure rubbers for a custom-format team match after creation.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(request);
    if (!auth.success) return auth.response;

    const { id } = await context.params;
    const body = await request.json();

    const validation = validateRequest(configureTeamMatchSubmatchesSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const result = await teamMatchService.configureCustomSubmatches(
      id,
      validation.data.customConfig,
      auth.userId
    );

    if (!result.success) {
      return jsonError(
        result.error || "Failed to configure rubbers",
        result.status || 400
      );
    }

    return NextResponse.json(
      { message: "Rubbers configured successfully", match: result.match },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[matches/team/[id]/submatches POST] Error:", err);
    return jsonError("Failed to configure rubbers", 500, { details: err.message });
  }
}
