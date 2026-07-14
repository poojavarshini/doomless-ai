import { describe, expect, it } from "vitest";
import { buildMetadataFallback } from "./fallback";

const preferences = { interests: ["technology"], professionalField: "software", learningGoals: ["focus"], topicsToAvoid: [], maximumDailyReelMinutes: 20, educationBalance: 70 };

describe("metadata fallback", () => {
  it("returns a valid low-confidence explained label", () => {
    const result = buildMetadataFallback({ reelId: "1", url: "https://www.instagram.com/reel/1/", creator: "Ada", caption: "Three steps for a technology focus routine", hashtags: ["technology"], visibleText: [], accessibilityLabels: [], engagementText: [], durationSeconds: 30, isPrivate: false, source: "partial", missingInformation: [] }, preferences, "Rate limit reached.");
    expect(result.confidence).toBeLessThan(50);
    expect(result.categories.relevance.score).toBeGreaterThan(50);
    expect(result.summary).toContain("metadata-only fallback");
  });
});
