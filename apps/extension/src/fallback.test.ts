import { describe, expect, it } from "vitest";
import type { ReelMetadata } from "@doomless/shared-types";
import { buildMetadataFallback, hasMeaningfulMetadata } from "./fallback";

const preferences = { interests: ["technology"], professionalField: "software", learningGoals: ["focus"], topicsToAvoid: [], maximumDailyReelMinutes: 20, educationBalance: 70 };
const metadata = (overrides: Partial<ReelMetadata> = {}): ReelMetadata => ({
  reelId: "1",
  url: "https://www.instagram.com/reel/1/",
  creator: "Ada",
  caption: "",
  hashtags: [],
  visibleText: [],
  accessibilityLabels: [],
  engagementText: [],
  isPrivate: false,
  source: "partial",
  missingInformation: [],
  ...overrides,
});

describe("metadata fallback nutrition scorer", () => {
  it("generates seven cautious scores for an educational caption", () => {
    const result = buildMetadataFallback(metadata({
      caption: "Three practical steps explaining how to build a technology focus routine",
      hashtags: ["technology"],
      durationSeconds: 30,
    }), preferences, "Failed to fetch");
    expect(result.evidence.analysisMode).toBe("METADATA_ONLY");
    expect(result.contentClassification.type).toBe("PRACTICAL_LEARNING");
    expect(result.categories.learningValue.score).toBeGreaterThan(60);
    expect(result.categories.actionability.score).toBeGreaterThan(60);
    expect(Object.keys(result.categories)).toHaveLength(7);
    for (const value of Object.values(result.categories)) {
      expect(value.score).toBeGreaterThanOrEqual(15);
      expect(value.score).toBeLessThanOrEqual(85);
    }
  });

  it("detects paid product promotion and lowers its nutrition score", () => {
    const result = buildMetadataFallback(metadata({
      caption: "Paid partnership. Buy this product now with my discount code. Last chance.",
      hashtags: ["ad"],
      durationSeconds: 45,
    }), preferences);
    expect(result.contentClassification.type).toBe("PROMOTION");
    expect(result.overallScore).toBeLessThan(55);
    expect(result.categories.clickbaitRisk.score).toBeGreaterThanOrEqual(45);
  });

  it("detects urgency and exaggerated hooks", () => {
    const result = buildMetadataFallback(metadata({
      caption: "Shocking secret you must watch now before it is too late",
      durationSeconds: 20,
    }), preferences);
    expect(result.categories.clickbaitRisk.score).toBeGreaterThan(65);
    expect(result.categories.addictionRisk.score).toBeGreaterThan(50);
  });

  it("preserves entertainment value without pretending it is educational", () => {
    const result = buildMetadataFallback(metadata({
      caption: "A funny dance performance and comedy moment",
      hashtags: ["dance", "comedy"],
      durationSeconds: 18,
    }), preferences);
    expect(result.contentClassification.type).toBe("ENTERTAINMENT");
    expect(result.categories.emotionalImpact.score).toBeGreaterThan(result.categories.learningValue.score);
  });

  it("requires genuinely meaningful evidence", () => {
    expect(hasMeaningfulMetadata(metadata({ creator: "Ada" }))).toBe(false);
    expect(hasMeaningfulMetadata(metadata({ hashtags: ["technology"], durationSeconds: 20 }))).toBe(true);
    expect(hasMeaningfulMetadata(metadata({ visibleText: ["Useful visible topic text"] }))).toBe(true);
  });
});
