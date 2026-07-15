import { describe, expect, it } from "vitest";
import {
  adjustForEvidence,
  calculateAttentionReturn,
  calculateOverallScore,
  calculateRiskPenalty,
  determineRecommendation,
  getCategoryInterpretation,
  getKpiConclusion,
  getMetadataEvidenceStrength,
  getScoreBand,
  normalizeOverallScore,
  preferenceMatch,
  sanitizeUserFacingText,
} from "./index";
import { nutritionAnalysisSchema } from "@doomless/shared-types";

const metric = (score: number) => ({ score, reason: "Test evidence.", evidence: ["fixture"] });
const categories = (positive: number, risk: number) => ({
  learningValue: metric(positive),
  actionability: metric(positive),
  personalRelevance: metric(positive),
  timeEfficiency: metric(positive),
  emotionalImpact: metric(positive),
  clickbaitRisk: metric(risk),
  addictionRisk: metric(risk),
});

describe("digital nutrition scoring", () => {
  it("normalizes the configured raw range", () => {
    expect(calculateOverallScore(categories(100, 0))).toBe(100);
    expect(calculateOverallScore(categories(0, 100))).toBe(0);
  });

  it("applies risk penalties", () => {
    expect(calculateOverallScore(categories(70, 90))).toBeLessThan(calculateOverallScore(categories(70, 10)));
    expect(calculateRiskPenalty(categories(70, 100))).toBe(25);
  });

  it("normalizes and clamps raw totals", () => {
    expect(normalizeOverallScore(-25)).toBe(0);
    expect(normalizeOverallScore(100)).toBe(100);
    expect(normalizeOverallScore(-500)).toBe(0);
    expect(normalizeOverallScore(500)).toBe(100);
  });

  it("pulls uncertain evidence toward 50", () => {
    expect(adjustForEvidence(90, 0)).toBe(50);
    expect(adjustForEvidence(90, 0.5)).toBe(70);
    expect(adjustForEvidence(90, 1)).toBe(90);
  });

  it("does not make a strong recommendation with insufficient evidence", () => {
    const attentionReturn = calculateAttentionReturn(categories(80, 10), 30, 32, "PRACTICAL_LEARNING");
    expect(attentionReturn.level).toBe("UNKNOWN");
    const result = determineRecommendation({ overallScore: 82, categories: categories(80, 10), classification: "PRACTICAL_LEARNING", confidence: 32, attentionReturn });
    expect(result.action).toBe("ANALYZE_MORE");
    expect(result.headline).toContain("Preliminary insight");
  });

  it("supports positive entertainment without calling it educational", () => {
    const values = categories(35, 20);
    values.emotionalImpact.score = 82;
    const attentionReturn = calculateAttentionReturn(values, 20, 80, "ENTERTAINMENT");
    expect(determineRecommendation({ overallScore: 58, categories: values, classification: "ENTERTAINMENT", confidence: 80, attentionReturn }).action).toBe("WATCH_FOR_FUN");
  });

  it("applies high-risk overrides", () => {
    const values = categories(30, 20);
    values.addictionRisk.score = 91;
    const attentionReturn = calculateAttentionReturn(values, 30, 75, "CLICKBAIT");
    expect(determineRecommendation({ overallScore: 55, categories: values, classification: "CLICKBAIT", confidence: 75, attentionReturn }).action).toBe("SKIP");
  });

  it("estimates useful and filler seconds transparently", () => {
    const result = calculateAttentionReturn(categories(80, 10), 60, 85, "PRACTICAL_LEARNING");
    expect(result.estimatedUsefulSeconds + result.estimatedFillerSeconds).toBe(60);
    expect(result.valueRatio).toBeGreaterThan(0.5);
  });

  it("matches relevance without changing intrinsic categories", () => {
    const metadata = { reelId: "1", url: "https://instagram.com/reel/1", creator: "Ada", caption: "Practical artificial intelligence tutorial", hashtags: ["AI"], visibleText: [], accessibilityLabels: [], engagementText: [], isPrivate: false, source: "partial" as const, missingInformation: [] };
    const base = { professionalField: "", learningGoals: [], topicsToAvoid: [], maximumDailyReelMinutes: 20, educationBalance: 70 };
    expect(preferenceMatch(metadata, { ...base, interests: ["artificial intelligence"] })).toBeGreaterThan(preferenceMatch(metadata, { ...base, interests: ["cooking"] }));
  });

  it("rejects out-of-range structured responses", () => {
    expect(nutritionAnalysisSchema.safeParse({ overallScore: 101 }).success).toBe(false);
  });

  it.each([
    [95, "EXCELLENT_DIGITAL_VALUE"], [85, "HIGH_DIGITAL_VALUE"], [75, "GOOD_DIGITAL_VALUE"],
    [65, "MIXED_DIGITAL_VALUE"], [55, "LOW_DIGITAL_VALUE"], [45, "POOR_DIGITAL_VALUE"],
    [30, "DIGITAL_JUNK"], [10, "HARMFUL_ATTENTION_PATTERN"],
  ])("maps score %i to %s", (score, label) => {
    expect(getScoreBand(score).label).toBe(label);
  });

  it("applies KPI priority rules deterministically", () => {
    const values = categories(70, 20);
    values.learningValue.score = 90;
    expect(getKpiConclusion(80, values, "PRACTICAL_LEARNING")).toContain("high learning value");
    values.learningValue.score = 40;
    values.actionability.score = 85;
    expect(getKpiConclusion(75, values, "PRACTICAL_LEARNING")).toContain("clear advice");
    values.actionability.score = 30;
    values.clickbaitRisk.score = 80;
    expect(getKpiConclusion(42, values, "CLICKBAIT")).toContain("exaggerated hook");
  });

  it("supports entertainment without automatically calling it junk", () => {
    const values = categories(25, 25);
    values.emotionalImpact.score = 82;
    expect(getKpiConclusion(55, values, "ENTERTAINMENT")).toContain("Watch for fun");
  });

  it("uses all category interpretation bands and inverse risk language", () => {
    for (const score of [10, 30, 50, 70, 90]) {
      expect(getCategoryInterpretation("learningValue", score)).toMatch(/\.$/);
      expect(getCategoryInterpretation("clickbaitRisk", score)).toMatch(/\.$/);
    }
    expect(getCategoryInterpretation("learningValue", 90)).toContain("meaningful information");
    expect(getCategoryInterpretation("clickbaitRisk", 90)).toContain("misleading");
    expect(getCategoryInterpretation("clickbaitRisk", 10)).toContain("closely matches");
  });

  it("detects evidence strength without inventing evidence", () => {
    const metadata = { reelId: "1", url: "https://instagram.com/reel/1", creator: "Ada", caption: "A meaningful caption explaining three useful concepts", hashtags: [], visibleText: [], accessibilityLabels: [], engagementText: [], isPrivate: false, source: "partial" as const, missingInformation: [] };
    expect(getMetadataEvidenceStrength(metadata)).toBe(0.6);
    expect(getMetadataEvidenceStrength({ ...metadata, caption: "", creator: "Unknown creator" })).toBe(0);
  });

  it("sanitizes technical errors", () => {
    const fallback = "Not enough Reel content was available to score.";
    expect(sanitizeUserFacingText("Failed to fetch", fallback)).toBe(fallback);
    expect(sanitizeUserFacingText(undefined, fallback)).toBe(fallback);
    expect(sanitizeUserFacingText("Worth watching.", fallback)).toBe("Worth watching.");
  });
});
