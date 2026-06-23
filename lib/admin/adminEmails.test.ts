import { describe, expect, it } from "vitest";
import { isPlatformAdminEmail, parseAdminEmails } from "./adminEmails";

describe("parseAdminEmails", () => {
  it("returns empty array for undefined or blank input", () => {
    expect(parseAdminEmails(undefined)).toEqual([]);
    expect(parseAdminEmails("")).toEqual([]);
    expect(parseAdminEmails("   ")).toEqual([]);
  });

  it("parses comma-separated emails trimmed and lowercased", () => {
    expect(parseAdminEmails(" Admin@Example.com , user@test.io ")).toEqual([
      "admin@example.com",
      "user@test.io",
    ]);
  });
});

describe("isPlatformAdminEmail", () => {
  it("returns false when allowlist is empty", () => {
    expect(isPlatformAdminEmail("admin@example.com", [])).toBe(false);
  });

  it("matches email case-insensitively against allowlist", () => {
    const allowlist = ["admin@example.com"];
    expect(isPlatformAdminEmail("Admin@Example.com", allowlist)).toBe(true);
    expect(isPlatformAdminEmail("other@example.com", allowlist)).toBe(false);
  });
});
