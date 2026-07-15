import { describe, expect, it } from "vitest";
import type { NutritionAnalysis, ReelMetadata } from "@doomless/shared-types";
import { buildMetadataFallback, hasMeaningfulMetadata } from "./fallback";
import { toNutritionLabelResult } from "./compact";

const preferences = { interests: ["technology", "comedy"], professionalField: "", learningGoals: ["focus"], topicsToAvoid: [], maximumDailyReelMinutes: 20, educationBalance: 70 };
const metadata = (caption = "", overrides: Partial<ReelMetadata> = {}): ReelMetadata => ({
  reelId: "acceptance",
  url: "https://www.instagram.com/reel/acceptance/",
  creator: "creator",
  caption,
  hashtags: [],
  visibleText: [],
  accessibilityLabels: [],
  engagementText: [],
  isPrivate: false,
  source: "partial",
  missingInformation: [],
  ...overrides,
});
const failedApiFallback = (input: ReelMetadata) => toNutritionLabelResult(buildMetadataFallback(
  input,
  preferences,
  hasMeaningfulMetadata(input) ? "Failed to fetch" : "Only the visible Reel surface was available.",
));

describe("nutrition label acceptance", () => {
  it("uses fallback scores when the API fails with educational text", () => {
    const result = failedApiFallback(metadata("Five useful technology tips and three steps to improve focus", { durationSeconds: 25 }));
    expect(result.overallScore).not.toBeNull();
    expect(Object.keys(result.categories ?? {})).toHaveLength(7);
    expect(JSON.stringify(result)).not.toMatch(/Failed to fetch/i);
  });

  it("uses a promotional KPI when the API fails on paid promotion", () => {
    const result = failedApiFallback(metadata("Paid partnership. Buy now with my discount code and do not miss this sale.", { durationSeconds: 45 }));
    expect(result.overallScore).toBeLessThan(50);
    expect(result.conclusion).toContain("mostly promotion");
    expect(JSON.stringify(result)).not.toMatch(/Failed to fetch/i);
  });

  it("returns a neutral seven-metric surface estimate when rich evidence is unavailable", () => {
    const result = failedApiFallback(metadata());
    expect(result.overallScore).toBe(50);
    expect(result.scoreLabel).toBe("LOW_DIGITAL_VALUE");
    expect(result.conclusion).toContain("Neutral surface estimate");
    expect(result.evidenceNote).toContain("0% evidence confidence");
    expect(Object.keys(result.categories ?? {})).toHaveLength(7);
  });

  it("uses the learning KPI for valid educational analysis", () => {
    const fallback = buildMetadataFallback(metadata("How to learn technology: five clear steps with examples", { durationSeconds: 20 }), preferences);
    const analysis: NutritionAnalysis = {
      ...fallback,
      evidence: { ...fallback.evidence, confidence: 90, level: "HIGH", analysisMode: "FULL" },
      categories: {
        ...fallback.categories,
        learningValue: { ...fallback.categories.learningValue, score: 92 },
        actionability: { ...fallback.categories.actionability, score: 85 },
        timeEfficiency: { ...fallback.categories.timeEfficiency, score: 88 },
        clickbaitRisk: { ...fallback.categories.clickbaitRisk, score: 10 },
        addictionRisk: { ...fallback.categories.addictionRisk, score: 15 },
      },
    };
    expect(toNutritionLabelResult(analysis).conclusion).toContain("high learning value");
  });

  it("uses an entertainment-friendly conclusion for low-risk fun", () => {
    const analysis = buildMetadataFallback(metadata("Funny comedy dance performance", { hashtags: ["comedy"], durationSeconds: 18 }), preferences);
    expect(toNutritionLabelResult(analysis).conclusion).toContain("Watch for fun");
  });

  it("prioritizes high clickbait in the final conclusion", () => {
    const base = buildMetadataFallback(metadata("Shocking secret you must watch now before it is too late", { durationSeconds: 20 }), preferences);
    const analysis: NutritionAnalysis = {
      ...base,
      contentClassification: { type: "CLICKBAIT", label: "Clickbait", reason: "Visible hook." },
      categories: {
        ...base.categories,
        learningValue: { ...base.categories.learningValue, score: 25 },
        clickbaitRisk: { ...base.categories.clickbaitRisk, score: 88 },
      },
    };
    expect(toNutritionLabelResult(analysis).conclusion).toContain("exaggerated hook");
  });
});
