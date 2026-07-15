import type { NutritionAnalysis } from "@doomless/shared-types";

export type ScoreTone = "good" | "mixed" | "low" | "unknown";

export interface ScorePresentation {
  contentLabel: string;
  valueLabel: string;
  oneLiner: string;
  scoreMeaning: string;
  tone: ScoreTone;
}

export function getScorePresentation(analysis: NutritionAnalysis): ScorePresentation {
  const tone: ScoreTone = analysis.recommendation.action === "ANALYZE_MORE"
    ? "unknown"
    : analysis.recommendation.action === "SKIP"
      ? "low"
      : analysis.recommendation.action === "SKIM" || analysis.recommendation.action === "SAVE_FOR_LATER"
        ? "mixed"
        : "good";
  return {
    contentLabel: analysis.contentClassification.label,
    valueLabel: analysis.recommendation.headline,
    oneLiner: analysis.recommendation.reason,
    scoreMeaning: `${analysis.overallScore}/100 is supporting context; the recommendation also uses evidence confidence, content type, attention return, and risk overrides.`,
    tone,
  };
}
