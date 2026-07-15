import { describe, expect, it } from "vitest";
import type { NutritionAnalysis } from "@doomless/shared-types";
import { getScorePresentation } from "./presentation";

describe("decision presentation", () => {
  it("uses the recommendation instead of inventing meaning from nearby scores", () => {
    const analysis = {
      overallScore: 58,
      contentClassification: { type: "ENTERTAINMENT", label: "Entertainment", reason: "Comedy signals." },
      recommendation: { action: "WATCH_FOR_FUN", headline: "Watch for a deliberate break", reason: "Healthy entertainment payoff." },
    } as NutritionAnalysis;
    expect(getScorePresentation(analysis).valueLabel).toBe("Watch for a deliberate break");
    expect(getScorePresentation(analysis).tone).toBe("good");
  });
});
