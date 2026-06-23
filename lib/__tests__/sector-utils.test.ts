import { 
  getAbsoluteSector,
  getRelativeSector,
  formatAbsoluteSector,
  formatRelativeSector,
  isWingSector,
  isCenterSector,
} from "@/lib/sector-utils";

describe("Sector Utils - Absolute Sectors", () => {
  describe("getAbsoluteSector", () => {
    it("should return 'top' for Y < 33.33", () => {
      expect(getAbsoluteSector(0)).toBe("top");
      expect(getAbsoluteSector(10)).toBe("top");
      expect(getAbsoluteSector(33.32)).toBe("top");
    });

    it("should return 'middle' for Y between 33.33 and 66.67", () => {
      expect(getAbsoluteSector(33.33)).toBe("middle");
      expect(getAbsoluteSector(50)).toBe("middle");
      expect(getAbsoluteSector(66.66)).toBe("middle");
    });

    it("should return 'bottom' for Y >= 66.67", () => {
      expect(getAbsoluteSector(66.67)).toBe("bottom");
      expect(getAbsoluteSector(75)).toBe("bottom");
      expect(getAbsoluteSector(100)).toBe("bottom");
    });

    it("should return null for null input", () => {
      expect(getAbsoluteSector(null as any)).toBe(null);
    });

    it("should be consistent across calls", () => {
      // Same input should always give same output
      expect(getAbsoluteSector(25)).toBe(getAbsoluteSector(25));
      expect(getAbsoluteSector(50)).toBe(getAbsoluteSector(50));
      expect(getAbsoluteSector(85)).toBe(getAbsoluteSector(85));
    });
  });
});

describe("Sector Utils - Relative Sectors", () => {
  describe("getRelativeSector for side1 (top of table)", () => {
    it("should map top sector to 'backhand'", () => {
      expect(getRelativeSector(10, "side1")).toBe("backhand");
      expect(getRelativeSector(20, "side1")).toBe("backhand");
    });

    it("should map middle sector to 'crossover'", () => {
      expect(getRelativeSector(50, "side1")).toBe("crossover");
      expect(getRelativeSector(60, "side1")).toBe("crossover");
    });

    it("should map bottom sector to 'forehand'", () => {
      expect(getRelativeSector(75, "side1")).toBe("forehand");
      expect(getRelativeSector(90, "side1")).toBe("forehand");
    });
  });

  describe("getRelativeSector for side2 (bottom of table)", () => {
    it("should map top sector to 'forehand' (flipped)", () => {
      expect(getRelativeSector(10, "side2")).toBe("forehand");
      expect(getRelativeSector(20, "side2")).toBe("forehand");
    });

    it("should map middle sector to 'crossover' (same)", () => {
      expect(getRelativeSector(50, "side2")).toBe("crossover");
      expect(getRelativeSector(60, "side2")).toBe("crossover");
    });

    it("should map bottom sector to 'backhand' (flipped)", () => {
      expect(getRelativeSector(75, "side2")).toBe("backhand");
      expect(getRelativeSector(90, "side2")).toBe("backhand");
    });
  });

  describe("getRelativeSector for team sides", () => {
    it("should treat team1 like side1", () => {
      expect(getRelativeSector(10, "team1")).toBe("backhand");
      expect(getRelativeSector(75, "team1")).toBe("forehand");
    });

    it("should treat team2 like side2", () => {
      expect(getRelativeSector(10, "team2")).toBe("forehand");
      expect(getRelativeSector(75, "team2")).toBe("backhand");
    });
  });

  describe("getRelativeSector without receivingSide", () => {
    it("should default to side1 behavior", () => {
      expect(getRelativeSector(10)).toBe("backhand");
      expect(getRelativeSector(50)).toBe("crossover");
      expect(getRelativeSector(85)).toBe("forehand");
    });
  });

  describe("getRelativeSector with null input", () => {
    it("should return null for null Y", () => {
      expect(getRelativeSector(null as any, "side1")).toBe(null);
      expect(getRelativeSector(null as any, "side2")).toBe(null);
    });
  });
});

describe("Sector Utils - Key Property: Absolute Sectors Don't Change", () => {
  it("should return same absolute sector regardless of receiving side", () => {
    // This is the KEY property: absolute sectors are perspective-independent
    const testY = 25;
    const absoluteSide1 = getAbsoluteSector(testY);
    const absoluteSide2 = getAbsoluteSector(testY);
    
    expect(absoluteSide1).toBe(absoluteSide2);
    expect(absoluteSide1).toBe("top");
  });

  it("should return different relative sectors for same shot on different sides", () => {
    // But relative sectors SHOULD change based on perspective
    const testY = 25;
    const relativeSide1 = getRelativeSector(testY, "side1");
    const relativeSide2 = getRelativeSector(testY, "side2");
    
    expect(relativeSide1).not.toBe(relativeSide2);
    expect(relativeSide1).toBe("backhand");
    expect(relativeSide2).toBe("forehand");
  });

  it("should not change absolute/relative when sides swap", () => {
    // Same shot from DB, with side swap
    const landingY = 80; // bottom sector
    
    // Before swap
    const absBeforeSwap = getAbsoluteSector(landingY);
    const relBeforeSwap = getRelativeSector(landingY, "side1");
    
    // After swap (same data, different perspective)
    const absAfterSwap = getAbsoluteSector(landingY);
    const relAfterSwap = getRelativeSector(landingY, "side2");
    
    // Absolute should be identical
    expect(absBeforeSwap).toBe(absAfterSwap);
    
    // Relative will be different (that's the point)
    expect(relBeforeSwap).toBe("forehand");
    expect(relAfterSwap).toBe("backhand");
    expect(relBeforeSwap).not.toBe(relAfterSwap);
  });
});

describe("Sector Utils - Formatting", () => {
  describe("formatAbsoluteSector", () => {
    it("should format absolute sectors correctly", () => {
      expect(formatAbsoluteSector("top")).toBe("Top Sector");
      expect(formatAbsoluteSector("middle")).toBe("Middle Sector");
      expect(formatAbsoluteSector("bottom")).toBe("Bottom Sector");
    });

    it("should return empty string for null", () => {
      expect(formatAbsoluteSector(null)).toBe("");
    });
  });

  describe("formatRelativeSector", () => {
    it("should format relative sectors correctly", () => {
      expect(formatRelativeSector("backhand")).toBe("Backhand");
      expect(formatRelativeSector("crossover")).toBe("CrossOver");
      expect(formatRelativeSector("forehand")).toBe("Forehand");
    });

    it("should return empty string for null", () => {
      expect(formatRelativeSector(null)).toBe("");
    });
  });
});

describe("Sector Utils - Helper Functions", () => {
  describe("isWingSector", () => {
    it("should return true for top and bottom", () => {
      expect(isWingSector("top")).toBe(true);
      expect(isWingSector("bottom")).toBe(true);
    });

    it("should return false for middle", () => {
      expect(isWingSector("middle")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isWingSector(null)).toBe(false);
    });
  });

  describe("isCenterSector", () => {
    it("should return true for middle", () => {
      expect(isCenterSector("middle")).toBe(true);
    });

    it("should return false for top and bottom", () => {
      expect(isCenterSector("top")).toBe(false);
      expect(isCenterSector("bottom")).toBe(false);
    });

    it("should return false for null", () => {
      expect(isCenterSector(null)).toBe(false);
    });
  });
});

describe("Sector Utils - Real-World Match Scenarios", () => {
  it("scenario: shot to opponent's BH corner (Y=10), side1 serving", () => {
    const landingY = 10;
    
    // From perspective of side1 (receiving is side2)
    const absolute = getAbsoluteSector(landingY);
    const relative = getRelativeSector(landingY, "side2");
    
    expect(absolute).toBe("top");
    expect(relative).toBe("forehand"); // side2's physical forehand (top is flipped for side2)
  });

  it("scenario: same shot, now side2 is serving (sides swapped)", () => {
    const landingY = 10; // Same shot data
    
    // From perspective of side2 (receiving is side1)
    const absolute = getAbsoluteSector(landingY);
    const relative = getRelativeSector(landingY, "side1");
    
    // Absolute is SAME (consistent for stats)
    expect(absolute).toBe("top");
    
    // Relative is DIFFERENT (because side1 sees it as their backhand)
    expect(relative).toBe("backhand"); // side1's physical backhand
  });

  it("scenario: wide FH shot (Y=90), both sides", () => {
    const landingY = 90;
    
    // Side1 perspective
    const abs1 = getAbsoluteSector(landingY);
    const rel1 = getRelativeSector(landingY, "side1");
    
    // Side2 perspective
    const abs2 = getAbsoluteSector(landingY);
    const rel2 = getRelativeSector(landingY, "side2");
    
    // Absolute always the same
    expect(abs1).toBe(abs2);
    expect(abs1).toBe("bottom");
    
    // Relative swaps (FH for side1 = BH for side2)
    expect(rel1).toBe("forehand");
    expect(rel2).toBe("backhand");
  });
});
