import type {
  ContentClassificationType,
  NutritionAnalysis,
  ReelMetadata,
  RecommendationAction,
  UserPreferences,
} from "@doomless/shared-types";
import { CATEGORY_GUIDE_CONFIG, EVIDENCE_STRENGTH, RAW_SCORE_RANGE, SCORE_BAND_CONFIG, SCORE_WEIGHTS } from "./config";

export { CATEGORY_GUIDE_CONFIG, EVIDENCE_STRENGTH, RAW_SCORE_RANGE, SCORE_BAND_CONFIG, SCORE_WEIGHTS } from "./config";

export type ScoredCategories = NutritionAnalysis["categories"];
export type AttentionReturn = NutritionAnalysis["attentionReturn"];
export type Recommendation = NutritionAnalysis["recommendation"];

const clamp = (value: number) => Math.max(0, Math.min(100, value));
const roundedRatio = (value: number) => Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;

export function calculateOverallScore(categories: ScoredCategories): number {
  const positiveValue =
    categories.learningValue.score * SCORE_WEIGHTS.positive.learningValue +
    categories.actionability.score * SCORE_WEIGHTS.positive.actionability +
    categories.personalRelevance.score * SCORE_WEIGHTS.positive.personalRelevance +
    categories.timeEfficiency.score * SCORE_WEIGHTS.positive.timeEfficiency +
    categories.emotionalImpact.score * SCORE_WEIGHTS.positive.emotionalImpact;
  const riskPenalty =
    categories.clickbaitRisk.score * SCORE_WEIGHTS.risk.clickbaitRisk +
    categories.addictionRisk.score * SCORE_WEIGHTS.risk.addictionRisk;

  return normalizeOverallScore(positiveValue - riskPenalty);
}

export function calculateRiskPenalty(categories: ScoredCategories): number {
  return categories.clickbaitRisk.score * SCORE_WEIGHTS.risk.clickbaitRisk
    + categories.addictionRisk.score * SCORE_WEIGHTS.risk.addictionRisk;
}

export function normalizeOverallScore(rawScore: number): number {
  const range = RAW_SCORE_RANGE.maximum - RAW_SCORE_RANGE.minimum;
  return Math.round(clamp(((rawScore - RAW_SCORE_RANGE.minimum) / range) * 100));
}

export function adjustForEvidence(rawScore: number, evidenceStrength: number): number {
  const strength = Math.max(0, Math.min(1, evidenceStrength));
  return Math.round(clamp(50 + (clamp(rawScore) - 50) * strength));
}

export function getMetadataEvidenceStrength(metadata: ReelMetadata): number {
  const caption = metadata.caption.trim().length >= 20;
  const visible = metadata.visibleText.some((value) => value.trim().length >= 12);
  const transcript = Boolean(metadata.transcript?.trim());
  if (metadata.source === "screenshot") return EVIDENCE_STRENGTH.multimodal;
  if (transcript && caption) return EVIDENCE_STRENGTH.transcriptAndCaption;
  if (caption && visible) return EVIDENCE_STRENGTH.captionAndVisibleText;
  if (caption) return EVIDENCE_STRENGTH.meaningfulCaption;
  if (visible || metadata.accessibilityLabels.some((value) => value.trim().length >= 12)
    || (metadata.hashtags.length > 0 && metadata.durationSeconds != null)) {
    return EVIDENCE_STRENGTH.meaningfulMetadata;
  }
  return EVIDENCE_STRENGTH.none;
}

export function calculateAttentionReturn(
  categories: ScoredCategories,
  durationSeconds: number,
  confidence: number,
  classification: ContentClassificationType,
): AttentionReturn {
  const total = Math.max(0, Math.min(3_600, Math.round(durationSeconds)));
  if (confidence < 40 || classification === "UNKNOWN" || total === 0) {
    return {
      level: "UNKNOWN",
      label: "Not enough evidence",
      estimatedTotalSeconds: total,
      estimatedUsefulSeconds: 0,
      estimatedFillerSeconds: 0,
      valueRatio: 0,
      attentionSavedIfSkippedSeconds: 0,
      explanation: "Available evidence is too limited for a reliable return-on-attention estimate.",
    };
  }

  const entertainmentValue = classification === "ENTERTAINMENT" ? categories.emotionalImpact.score : 0;
  const valueScore =
    categories.learningValue.score * 0.32 +
    categories.actionability.score * 0.24 +
    categories.timeEfficiency.score * 0.24 +
    categories.personalRelevance.score * 0.1 +
    entertainmentValue * 0.1;
  const riskDrag = categories.clickbaitRisk.score * 0.12 + categories.addictionRisk.score * 0.16;
  const evidenceFactor = 0.7 + confidence / 333;
  const ratio = roundedRatio(((valueScore - riskDrag) / 100) * evidenceFactor);
  const useful = Math.min(total, Math.max(0, Math.round(total * ratio)));
  const filler = Math.max(0, total - useful);
  const level = ratio >= 0.65 ? "HIGH" : ratio >= 0.38 ? "MEDIUM" : "LOW";
  const label = level === "HIGH" ? "Strong payoff" : level === "MEDIUM" ? "Mixed payoff" : "Low payoff";

  return {
    level,
    label,
    estimatedTotalSeconds: total,
    estimatedUsefulSeconds: useful,
    estimatedFillerSeconds: filler,
    valueRatio: ratio,
    attentionSavedIfSkippedSeconds: filler,
    explanation: `Estimated ${useful}s of useful or intentional value in a ${total}s Reel, with about ${filler}s of lower-value attention.`,
  };
}

interface RecommendationInput {
  overallScore: number;
  categories: ScoredCategories;
  classification: ContentClassificationType;
  confidence: number;
  attentionReturn: AttentionReturn;
}

export function determineRecommendation(input: RecommendationInput): Recommendation {
  const { overallScore, categories, classification, confidence, attentionReturn } = input;
  if (confidence < 40 || classification === "UNKNOWN" || attentionReturn.level === "UNKNOWN") {
    return recommendation("ANALYZE_MORE", "Preliminary insight — verify first", "DoomLess found useful metadata signals, but not enough evidence for a confident watch-or-skip decision.");
  }
  if (categories.addictionRisk.score > 85 && categories.learningValue.score < 40) {
    return recommendation("SKIP", "Skip the high-scroll-risk loop", "Addiction risk is very high while the available learning payoff is low.");
  }
  if (categories.clickbaitRisk.score > 80 && overallScore < 60) {
    return recommendation("SKIP", "Skip the weak payoff", "Clickbait risk is very high and the total value score does not offset it.");
  }
  if (classification === "PROMOTION" && categories.personalRelevance.score < 65) {
    return recommendation("SKIP", "Skip unless you are shopping", "The main benefit is promotional and it has limited relevance to your current interests.");
  }
  if (classification === "REPETITIVE_LOW_VALUE") {
    return recommendation("SKIM", "Skim for the single takeaway", "Most of the attention cost appears to be filler or repetition.");
  }
  if (categories.learningValue.score > 80 && categories.timeEfficiency.score < 45) {
    return recommendation("SAVE_FOR_LATER", "Save for focused viewing", "The learning value is strong, but this is not an efficient watch right now.");
  }
  if (classification === "ENTERTAINMENT" && categories.emotionalImpact.score >= 58 && categories.clickbaitRisk.score < 70) {
    return recommendation("WATCH_FOR_FUN", "Watch for a deliberate break", "It offers healthy entertainment value without pretending to be educational.");
  }
  if (attentionReturn.valueRatio < 0.35 && overallScore >= 45) {
    return recommendation("SKIM", "Skim for the single takeaway", "Most of the attention cost appears to be filler or repetition.");
  }
  if (overallScore >= 75 && attentionReturn.level === "HIGH") {
    return recommendation("WATCH", "Worth your attention", "The expected payoff is strong relative to its time and behavioral risks.");
  }
  if (overallScore >= 62 || attentionReturn.level === "HIGH") {
    return recommendation("SAVE_FOR_LATER", "Useful—save it intentionally", "There is meaningful value, but saving helps you watch it at the right time.");
  }
  if (overallScore >= 45) {
    return recommendation("SKIM", "Skim before committing", "The available value is mixed, so look for the core takeaway first.");
  }
  return recommendation("SKIP", "Probably not worth the time", "The expected payoff is low relative to the attention and risk signals.");
}

export function applyProductPolicy(analysis: NutritionAnalysis): NutritionAnalysis {
  const overallScore = calculateOverallScore(analysis.categories);
  const confidence = analysis.evidence.confidence;
  const evidenceLevel = confidence >= 75 ? "HIGH" : confidence >= 40 ? "MEDIUM" : "LOW";
  const attentionReturn = calculateAttentionReturn(
    analysis.categories,
    analysis.attentionReturn.estimatedTotalSeconds,
    confidence,
    analysis.contentClassification.type,
  );
  const recommendation = determineRecommendation({
    overallScore,
    categories: analysis.categories,
    classification: analysis.contentClassification.type,
    confidence,
    attentionReturn,
  });
  return {
    ...analysis,
    overallScore,
    evidence: { ...analysis.evidence, level: evidenceLevel },
    attentionReturn,
    recommendation,
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

export type NutritionScoreLabel =
  | "EXCELLENT_DIGITAL_VALUE"
  | "HIGH_DIGITAL_VALUE"
  | "GOOD_DIGITAL_VALUE"
  | "MIXED_DIGITAL_VALUE"
  | "LOW_DIGITAL_VALUE"
  | "POOR_DIGITAL_VALUE"
  | "DIGITAL_JUNK"
  | "HARMFUL_ATTENTION_PATTERN"
  | "LIMITED_ANALYSIS";

export type NutritionCategoryKey = keyof ScoredCategories;

export function getScoreBand(score: number) {
  const safeScore = Math.round(clamp(score));
  return SCORE_BAND_CONFIG.find((band) => band.minimum !== null && safeScore >= band.minimum) ?? SCORE_BAND_CONFIG[7];
}

export function getKpiConclusion(
  overallScore: number,
  categories: ScoredCategories,
  classification: ContentClassificationType,
  provisional = false,
): string {
  if (provisional && classification === "UNKNOWN") return "Neutral surface estimate — open details before deciding.";
  if (categories.learningValue.score >= 85 && overallScore >= 75) return "Strongly recommended \u2014 high learning value for your time.";
  if (categories.actionability.score >= 80 && overallScore >= 70) return "Worth watching \u2014 clear advice you can apply.";
  if (categories.personalRelevance.score >= 85 && overallScore >= 65) return "Worth watching \u2014 highly relevant to your goals.";
  if (categories.learningValue.score >= 65 && categories.timeEfficiency.score < 40) return "Save for later \u2014 useful, but longer than necessary.";
  if (categories.learningValue.score >= 50 && categories.timeEfficiency.score >= 40 && categories.timeEfficiency.score <= 59) return "Skim \u2014 useful idea mixed with repetition.";
  if (classification === "ENTERTAINMENT" && categories.clickbaitRisk.score < 55 && categories.addictionRisk.score < 55) return "Watch for fun \u2014 entertaining without strong manipulation.";
  if (classification === "PROMOTION" && overallScore < 50) return "Skip \u2014 mostly promotion with limited practical value.";
  if (categories.clickbaitRisk.score >= 75) return "Skip \u2014 exaggerated hook with limited payoff.";
  if (categories.addictionRisk.score >= 75 && categories.learningValue.score < 50) return "Skip \u2014 high distraction with little useful value.";
  if (provisional && overallScore >= 70) return "Promising from visible signals \u2014 consider a quick preview.";
  if (provisional && overallScore >= 50) return "Skim \u2014 limited evidence suggests mixed value.";
  if (provisional) return "Probably skip \u2014 visible signals suggest limited value.";
  return getScoreBand(overallScore).conclusion;
}

export function getCategoryInterpretation(category: NutritionCategoryKey, score: number, provisional = false): string {
  const safeScore = Math.round(clamp(score));
  const index = safeScore >= 80 ? 4 : safeScore >= 60 ? 3 : safeScore >= 40 ? 2 : safeScore >= 20 ? 1 : 0;
  if (!provisional) return CATEGORY_GUIDE_CONFIG[category].interpretations[index];
  if (category === "clickbaitRisk") return safeScore >= 60 ? "Visible wording suggests an exaggerated or promotional hook." : "Visible wording shows limited clickbait signals.";
  if (category === "addictionRisk") return safeScore >= 60 ? "Visible urgency suggests stronger attention-retaining tactics." : "Available signals do not show strong compulsive tactics.";
  const cautious: Record<Exclude<NutritionCategoryKey, "clickbaitRisk" | "addictionRisk">, string> = {
    learningValue: safeScore >= 60 ? "Visible text suggests useful educational information." : "Available text shows limited educational detail.",
    actionability: safeScore >= 60 ? "Visible text suggests practical guidance or steps." : "Clear practical steps could not be confirmed.",
    personalRelevance: safeScore >= 60 ? "The visible topic matches selected interests." : "The visible topic only partly matches your goals.",
    timeEfficiency: safeScore >= 60 ? "Visible information appears efficient for its duration." : "Available value appears moderate for its duration.",
    emotionalImpact: safeScore >= 60 ? "Visible wording suggests a positive or calm tone." : "Visible wording suggests a mostly neutral effect.",
  };
  return cautious[category];
}

const FORBIDDEN_USER_TEXT = /failed to fetch|networkerror|request failed|api error|schema validation failed|undefined|null|metadata-only fallback|not a full video analysis|transcript unavailable|internal server error/i;

export function sanitizeUserFacingText(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const text = value.replace(/\s+/g, " ").trim();
  return !text || FORBIDDEN_USER_TEXT.test(text) ? fallback : text;
}

function recommendation(action: RecommendationAction, headline: string, reason: string): Recommendation {
  return { action, headline, reason };
}
