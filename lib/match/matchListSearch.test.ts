import { describe, expect, it } from "vitest";
import {
  buildMatchIdListFilter,
  normalizeMatchListSearchInput,
  parseMatchListSearch,
} from "./matchListSearch";

const FULL_ID = "674a1b2c3d4e5f6789012345";

describe("parseMatchListSearch", () => {
  it("parses pasted match code with hash prefix", () => {
    expect(parseMatchListSearch(`#${FULL_ID}`)).toEqual({
      type: "exactId",
      id: FULL_ID,
    });
  });

  it("parses bare 24-char hex as exact id", () => {
    expect(parseMatchListSearch(FULL_ID)).toEqual({
      type: "exactId",
      id: FULL_ID,
    });
  });

  it("parses hash-prefixed partial id", () => {
    expect(parseMatchListSearch("#901234")).toEqual({
      type: "partialId",
      fragment: "901234",
    });
  });

  it("treats short hex without hash as text", () => {
    expect(parseMatchListSearch("dead")).toEqual({
      type: "text",
      query: "dead",
    });
  });

  it("treats player names as text", () => {
    expect(parseMatchListSearch("Alex Chen")).toEqual({
      type: "text",
      query: "Alex Chen",
    });
  });
});

describe("normalizeMatchListSearchInput", () => {
  it("strips leading hash", () => {
    expect(normalizeMatchListSearchInput(`  #${FULL_ID}  `)).toBe(FULL_ID);
  });
});

describe("buildMatchIdListFilter", () => {
  it("builds ObjectId filter for exact id", () => {
    const filter = buildMatchIdListFilter({ type: "exactId", id: FULL_ID });
    expect(filter._id).toBeDefined();
    expect(String(filter._id)).toBe(FULL_ID);
  });

  it("builds $expr regex filter for partial id", () => {
    const filter = buildMatchIdListFilter({ type: "partialId", fragment: "901234" });
    expect(filter.$expr).toBeDefined();
  });
});
