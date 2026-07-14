import { z } from "zod";

export const recommendationSchema = z.enum(["WATCH", "SKIP", "SAVE", "LIMIT"]);
export const analysisSourceSchema = z.enum(["live", "partial", "screenshot", "demo"]);
export const scoreSchema = z.number().min(0).max(100);

const categorySchema = z.object({
  score: scoreSchema,
  reason: z.string().trim().min(1).max(320),
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
  recommendation: recommendationSchema,
  confidence: scoreSchema,
  attentionCost: z.object({
    label: z.enum(["Low", "Medium", "High"]),
    estimatedUsefulSeconds: z.number().min(0).max(3_600),
    estimatedTotalSeconds: z.number().min(0).max(3_600),
    valueRatio: z.number().min(0).max(1),
  }),
  categories: z.object({
    learningValue: categorySchema,
    actionability: categorySchema,
    relevance: categorySchema,
    timeEfficiency: categorySchema,
    emotionalImpact: categorySchema,
    clickbaitRisk: categorySchema,
    addictionRisk: categorySchema,
  }),
  summary: z.string().trim().min(1).max(500),
  positiveSignals: z.array(z.string().max(240)).max(8),
  warningSignals: z.array(z.string().max(240)).max(8),
  suggestedAction: z.string().trim().min(1).max(300),
  contentType: z.string().trim().min(1).max(100),
  topics: z.array(z.string().max(100)).max(15),
  analysisSource: analysisSourceSchema,
  availableSourceData: z.array(z.string().max(160)).max(20),
  missingInformation: z.array(z.string().max(160)).max(20),
});

export type UserPreferences = z.infer<typeof preferencesSchema>;
export type ReelMetadata = z.infer<typeof reelMetadataSchema>;
export type NutritionAnalysis = z.infer<typeof nutritionAnalysisSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;

export interface HistoryRecord {
  reelId: string;
  metadata: ReelMetadata;
  analysis: NutritionAnalysis;
  analyzedAt: string;
  userAction?: "WATCH" | "SKIP" | "SAVE" | "SHOW_LESS" | "REPLACE";
}
