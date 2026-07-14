import type { NutritionAnalysis, Recommendation } from "@doomless/shared-types";
import type { ReelMetadata, UserPreferences } from "@doomless/shared-types";

export const SCORE_WEIGHTS = Object.freeze({
  positive: {
    learningValue: 0.25,
    actionability: 0.2,
    relevance: 0.2,
    timeEfficiency: 0.2,
    emotionalImpact: 0.15,
  },
  risk: { clickbaitRisk: 0.1, addictionRisk: 0.15 },
});

export type ScoredCategories = NutritionAnalysis["categories"];

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function calculateOverallScore(categories: ScoredCategories): number {
  const positiveValue =
    categories.learningValue.score * SCORE_WEIGHTS.positive.learningValue +
    categories.actionability.score * SCORE_WEIGHTS.positive.actionability +
    categories.relevance.score * SCORE_WEIGHTS.positive.relevance +
    categories.timeEfficiency.score * SCORE_WEIGHTS.positive.timeEfficiency +
    categories.emotionalImpact.score * SCORE_WEIGHTS.positive.emotionalImpact;
  const riskPenalty =
    categories.clickbaitRisk.score * SCORE_WEIGHTS.risk.clickbaitRisk +
    categories.addictionRisk.score * SCORE_WEIGHTS.risk.addictionRisk;

  // Raw range is -25..100. Shift and scale that range to 0..100.
  return Math.round(clamp(((positiveValue - riskPenalty + 25) / 125) * 100));
}

export function mapRecommendation(
  overallScore: number,
  categories: ScoredCategories,
  contentType = "",
): Recommendation {
  if (categories.addictionRisk.score > 85 && categories.learningValue.score < 40) return "SKIP";
  if (categories.clickbaitRisk.score > 80 && overallScore < 60) return "SKIP";
  if (categories.learningValue.score > 80 && categories.timeEfficiency.score < 45) return "SAVE";
  if (/entertainment/i.test(contentType) && categories.learningValue.score < 40 && overallScore >= 45) {
    return "LIMIT";
  }
  if (overallScore >= 80) return "WATCH";
  if (overallScore >= 65) return "SAVE";
  if (overallScore >= 45) return "LIMIT";
  return "SKIP";
}

export function applyProductPolicy(analysis: NutritionAnalysis): NutritionAnalysis {
  const overallScore = calculateOverallScore(analysis.categories);
  return {
    ...analysis,
    overallScore,
    recommendation: mapRecommendation(overallScore, analysis.categories, analysis.contentType),
  };
}

export function preferenceMatch(metadata: ReelMetadata, preferences: UserPreferences): number {
  const haystack = [metadata.caption, metadata.creator, ...metadata.hashtags, ...metadata.visibleText]
    .join(" ")
    .toLowerCase();
  const positive = [...preferences.interests, ...preferences.learningGoals, preferences.professionalField]
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (positive.length === 0) return 50;
  const matches = positive.filter((value) => haystack.includes(value)).length;
  const avoided = preferences.topicsToAvoid.filter((value) => haystack.includes(value.toLowerCase())).length;
  return clamp(Math.round(35 + (matches / positive.length) * 65 - avoided * 25));
}
