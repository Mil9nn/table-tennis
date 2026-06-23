import mongoose from "mongoose";
import { escapeRegex } from "@/lib/utils";
import { isValidObjectId } from "@/lib/validations";

export type MatchListSearchParse =
  | { type: "exactId"; id: string }
  | { type: "partialId"; fragment: string }
  | { type: "text"; query: string };

/** Strip leading `#` from pasted match codes (e.g. from match details copy). */
export function normalizeMatchListSearchInput(raw: string): string {
  return raw.trim().replace(/^#+/, "").trim();
}

/**
 * Classify a matches-list search string as exact id, partial id, or free text.
 * Partial id requires a `#` prefix or at least 6 hex chars to avoid false positives on short words.
 */
export function parseMatchListSearch(raw: string): MatchListSearchParse | null {
  const hadHashPrefix = raw.trim().startsWith("#");
  const q = normalizeMatchListSearchInput(raw);
  if (!q) return null;

  if (isValidObjectId(q)) {
    return { type: "exactId", id: q };
  }

  const isHexFragment = /^[0-9a-fA-F]+$/.test(q);
  if (isHexFragment && q.length >= 4 && q.length <= 23) {
    if (hadHashPrefix || q.length >= 6) {
      return { type: "partialId", fragment: q };
    }
  }

  return { type: "text", query: q };
}

/** Mongo filter for exact or partial match `_id` search. */
export function buildMatchIdListFilter(
  parsed: Extract<MatchListSearchParse, { type: "exactId" } | { type: "partialId" }>
): Record<string, unknown> {
  if (parsed.type === "exactId") {
    return { _id: new mongoose.Types.ObjectId(parsed.id) };
  }

  const pattern = escapeRegex(parsed.fragment);
  return {
    $expr: {
      $regexMatch: {
        input: { $toString: "$_id" },
        regex: pattern,
        options: "i",
      },
    },
  };
}
