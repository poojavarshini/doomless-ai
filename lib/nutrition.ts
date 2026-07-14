export const scoreKeys = [
  "learning",
  "usefulness",
  "mind_impact",
  "quality",
  "personal_relevance",
  "time_worth",
  "scroll_risk",
] as const;

export type ScoreKey = (typeof scoreKeys)[number];

export type NutritionScores = Record<ScoreKey, number>;
export type NutritionExplanations = Record<ScoreKey, string>;

export interface VideoNutritionLabel {
  video_url?: string;
  analysis_mode?: "live" | "demo_fallback";
  notice?: string;
  scores: NutritionScores;
  explanations: NutritionExplanations;
}

export const categoryMeta: Record<
  ScoreKey,
  { label: string; icon: string; lowerIsBetter?: boolean }
> = {
  learning: { label: "Learning", icon: "◫" },
  usefulness: { label: "Usefulness", icon: "◇" },
  mind_impact: { label: "Mind Impact", icon: "◉" },
  quality: { label: "Quality", icon: "✓" },
  personal_relevance: { label: "Personal Relevance", icon: "◎" },
  time_worth: { label: "Time Worth", icon: "◷" },
  scroll_risk: { label: "Scroll Risk", icon: "↻", lowerIsBetter: true },
};
