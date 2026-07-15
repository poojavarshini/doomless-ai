import { z } from "zod";

export const recommendationActionSchema = z.enum([
  "WATCH",
  "WATCH_FOR_FUN",
  "SAVE_FOR_LATER",
  "SKIM",
  "SKIP",
  "ANALYZE_MORE",
]);
export const contentClassificationTypeSchema = z.enum([
  "PRACTICAL_LEARNING",
  "EXPLANATION",
  "NEWS_OR_INFORMATION",
  "INSPIRATION",
  "ENTERTAINMENT",
  "PROMOTION",
  "OPINION",
  "CLICKBAIT",
  "REPETITIVE_LOW_VALUE",
  "UNKNOWN",
]);
export const analysisSourceSchema = z.enum(["live", "partial", "screenshot", "demo"]);
export const analysisModeSchema = z.enum(["FULL", "METADATA_ONLY", "SCREENSHOT_ASSISTED", "DEMO"]);
export const scoreSchema = z.number().min(0).max(100);

const categorySchema = z.object({
  score: scoreSchema,
  reason: z.string().trim().min(1).max(320),
  evidence: z.array(z.string().trim().min(1).max(240)).max(5),
});

export const preferencesSchema = z.object({
  interests: z.array(z.string()).max(30).default([]),
  professionalField: z.string().max(120).default(""),
  learningGoals: z.array(z.string()).max(20).default([]),
  topicsToAvoid: z.array(z.string()).max(20).default([]),
  maximumDailyReelMinutes: z.number().int().min(1).max(240).default(20),
  educationBalance: z.number().min(0).max(100).default(70),
});

export const reelMetadataSchema = z.object({
  reelId: z.string().trim().min(1).max(256),
  url: z.string().url().max(2_000),
  creator: z.string().trim().max(160).default("Unknown creator"),
  caption: z.string().trim().max(8_000).default(""),
  hashtags: z.array(z.string().max(100)).max(50).default([]),
  visibleText: z.array(z.string().max(500)).max(60).default([]),
  accessibilityLabels: z.array(z.string().max(500)).max(60).default([]),
  transcript: z.string().trim().max(12_000).optional(),
  durationSeconds: z.number().min(0).max(3_600).optional(),
  engagementText: z.array(z.string().max(160)).max(20).default([]),
  isPrivate: z.boolean().default(false),
  source: analysisSourceSchema.default("partial"),
  missingInformation: z.array(z.string().max(160)).max(20).default([]),
});

export const analysisRequestSchema = z.object({
  metadata: reelMetadataSchema,
  preferences: preferencesSchema.optional(),
  demoMode: z.boolean().default(false),
});

export const nutritionAnalysisSchema = z.object({
  overallScore: scoreSchema,
  contentClassification: z.object({
    type: contentClassificationTypeSchema,
    label: z.string().trim().min(1).max(100),
    reason: z.string().trim().min(1).max(320),
  }),
  recommendation: z.object({
    action: recommendationActionSchema,
    headline: z.string().trim().min(1).max(120),
    reason: z.string().trim().min(1).max(320),
  }),
  attentionReturn: z.object({
    level: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"]),
    label: z.string().trim().min(1).max(100),
    estimatedTotalSeconds: z.number().min(0).max(3_600),
    estimatedUsefulSeconds: z.number().min(0).max(3_600),
    estimatedFillerSeconds: z.number().min(0).max(3_600),
    valueRatio: z.number().min(0).max(1),
    attentionSavedIfSkippedSeconds: z.number().min(0).max(3_600),
    explanation: z.string().trim().min(1).max(320),
  }),
  userBenefit: z.object({
    primaryBenefit: z.string().trim().min(1).max(200),
    takeawayCount: z.number().int().min(0).max(20),
    takeaways: z.array(z.string().trim().min(1).max(240)).max(3),
    bestFor: z.string().trim().min(1).max(240),
    notUsefulFor: z.string().trim().min(1).max(240),
  }),
  evidence: z.object({
    confidence: scoreSchema,
    level: z.enum(["HIGH", "MEDIUM", "LOW"]),
    sourcesUsed: z.array(z.string().trim().min(1).max(160)).max(20),
    sourcesMissing: z.array(z.string().trim().min(1).max(160)).max(20),
    analysisMode: analysisModeSchema,
    limitationMessage: z.string().trim().min(1).max(320),
  }),
  categories: z.object({
    learningValue: categorySchema,
    actionability: categorySchema,
    personalRelevance: categorySchema,
    timeEfficiency: categorySchema,
    emotionalImpact: categorySchema,
    clickbaitRisk: categorySchema,
    addictionRisk: categorySchema,
  }),
  positiveSignals: z.array(z.string().max(240)).max(8),
  warningSignals: z.array(z.string().max(240)).max(8),
  summary: z.string().trim().min(1).max(500),
  suggestedUserAction: z.string().trim().min(1).max(300),
  topics: z.array(z.string().max(100)).max(15).default([]),
});

export type UserPreferences = z.infer<typeof preferencesSchema>;
export type ReelMetadata = z.infer<typeof reelMetadataSchema>;
export type NutritionAnalysis = z.infer<typeof nutritionAnalysisSchema>;
export type RecommendationAction = z.infer<typeof recommendationActionSchema>;
export type ContentClassificationType = z.infer<typeof contentClassificationTypeSchema>;

export interface HistoryRecord {
  reelId: string;
  metadata: ReelMetadata;
  analysis: NutritionAnalysis;
  analyzedAt: string;
  userAction?: "WATCH" | "SKIP" | "SAVE" | "SHOW_LESS" | "REPLACE";
}
