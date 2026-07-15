import type { NutritionAnalysis } from "@doomless/shared-types";

export type VideoNutritionLabel = NutritionAnalysis;

export const categoryMeta: Record<keyof NutritionAnalysis["categories"], { label: string; lowerIsBetter?: boolean }> = {
  learningValue: { label: "Learning value" },
  actionability: { label: "Actionability" },
  personalRelevance: { label: "Personal relevance" },
  timeEfficiency: { label: "Time efficiency" },
  emotionalImpact: { label: "Emotional impact" },
  clickbaitRisk: { label: "Clickbait risk", lowerIsBetter: true },
  addictionRisk: { label: "Addiction risk", lowerIsBetter: true },
};

export const scoreKeys = Object.keys(categoryMeta) as (keyof NutritionAnalysis["categories"])[];
