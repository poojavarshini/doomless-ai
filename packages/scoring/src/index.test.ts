import { describe, expect, it } from "vitest";
import { calculateOverallScore, mapRecommendation, preferenceMatch } from "./index";
import { nutritionAnalysisSchema } from "@doomless/shared-types";

const categories = (positive: number, risk: number) => ({
  learningValue: { score: positive, reason: "test" },
  actionability: { score: positive, reason: "test" },
  relevance: { score: positive, reason: "test" },
  timeEfficiency: { score: positive, reason: "test" },
  emotionalImpact: { score: positive, reason: "test" },
  clickbaitRisk: { score: risk, reason: "test" },
  addictionRisk: { score: risk, reason: "test" },
});

describe("digital nutrition scoring", () => {
  it("normalizes the configured raw range", () => {
    expect(calculateOverallScore(categories(100, 0))).toBe(100);
    expect(calculateOverallScore(categories(0, 100))).toBe(0);
  });

  it("applies risk penalties", () => {
    expect(calculateOverallScore(categories(70, 90))).toBeLessThan(calculateOverallScore(categories(70, 10)));
  });

  it("maps thresholds and high-risk overrides", () => {
    expect(mapRecommendation(82, categories(80, 10))).toBe("WATCH");
    expect(mapRecommendation(70, categories(70, 10))).toBe("SAVE");
    const addictive = categories(30, 20);
    addictive.addictionRisk.score = 90;
    expect(mapRecommendation(70, addictive)).toBe("SKIP");
  });

  it("matches relevance without changing intrinsic categories", () => {
    const metadata = { reelId: "1", url: "https://instagram.com/reel/1", creator: "Ada", caption: "Practical artificial intelligence tutorial", hashtags: ["AI"], visibleText: [], accessibilityLabels: [], engagementText: [], isPrivate: false, source: "partial" as const, missingInformation: [] };
    const base = { professionalField: "", learningGoals: [], topicsToAvoid: [], maximumDailyReelMinutes: 20, educationBalance: 70 };
    expect(preferenceMatch(metadata, { ...base, interests: ["artificial intelligence"] })).toBeGreaterThan(preferenceMatch(metadata, { ...base, interests: ["cooking"] }));
  });

  it("rejects out-of-range structured responses", () => {
    expect(nutritionAnalysisSchema.safeParse({ overallScore: 101 }).success).toBe(false);
  });
});
