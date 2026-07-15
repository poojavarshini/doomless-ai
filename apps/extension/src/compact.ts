import {
  calculateOverallScore,
  getCategoryInterpretation,
  getKpiConclusion,
  getScoreBand,
  sanitizeUserFacingText,
  type NutritionCategoryKey,
  type NutritionScoreLabel,
} from "@doomless/scoring";
import type { NutritionAnalysis } from "@doomless/shared-types";

export interface NutritionMetric {
  score: number;
  interpretation: string;
  isRisk: boolean;
}

export type NutritionLabelCategories = Record<NutritionCategoryKey, NutritionMetric>;

export interface NutritionLabelResult {
  overallScore: number | null;
  scoreLabel: NutritionScoreLabel;
  conclusion: string;
  evidenceNote: string;
  categories: NutritionLabelCategories | null;
}

export const CATEGORY_ORDER: readonly NutritionCategoryKey[] = [
  "learningValue",
  "actionability",
  "personalRelevance",
  "timeEfficiency",
  "emotionalImpact",
  "clickbaitRisk",
  "addictionRisk",
];

export const CATEGORY_NAMES: Record<NutritionCategoryKey, string> = {
  learningValue: "Learning Value",
  actionability: "Actionability",
  personalRelevance: "Personal Relevance",
  timeEfficiency: "Time Efficiency",
  emotionalImpact: "Emotional Impact",
  clickbaitRisk: "Clickbait Risk",
  addictionRisk: "Addiction Risk",
};

export const LIMITED_ANALYSIS_RESULT: NutritionLabelResult = Object.freeze({
  overallScore: null,
  scoreLabel: "LIMITED_ANALYSIS",
  conclusion: "Not enough Reel content was available to score.",
  evidenceNote: "No usable Reel surface signals were found.",
  categories: null,
});

export function toNutritionLabelResult(
  rawAnalysis?: NutritionAnalysis | null,
  error?: unknown,
): NutritionLabelResult {
  if (error || !rawAnalysis) return LIMITED_ANALYSIS_RESULT;
  const overallScore = calculateOverallScore(rawAnalysis.categories);
  const provisional = rawAnalysis.evidence.analysisMode === "METADATA_ONLY";
  const categories = Object.fromEntries(CATEGORY_ORDER.map((key) => {
    const score = Math.max(0, Math.min(100, Math.round(rawAnalysis.categories[key].score)));
    return [key, {
      score,
      interpretation: getCategoryInterpretation(key, score, provisional),
      isRisk: key === "clickbaitRisk" || key === "addictionRisk",
    }];
  })) as NutritionLabelCategories;
  const band = getScoreBand(overallScore);
  const conclusion = getKpiConclusion(
    overallScore,
    rawAnalysis.categories,
    rawAnalysis.contentClassification.type,
    provisional,
  );
  return {
    overallScore,
    scoreLabel: band.label,
    conclusion: sanitizeUserFacingText(conclusion, band.conclusion),
    evidenceNote: provisional
      ? `Surface estimate · ${Math.round(rawAnalysis.evidence.confidence)}% evidence confidence`
      : `AI analysis · ${Math.round(rawAnalysis.evidence.confidence)}% evidence confidence`,
    categories,
  };
}

export const scoreLabelText = (label: NutritionScoreLabel) => label.replaceAll("_", " ");

export const compactOverlayCss = `
:host{all:initial;position:fixed;inset:0;display:block;z-index:2147483647;pointer-events:none}
.dl-card{position:fixed;z-index:2147483000;top:calc(var(--doomless-top) + 12px);right:calc(100vw - var(--doomless-right) + 12px);width:370px;max-width:calc(100vw - 24px);max-height:min(82vh,760px);overflow:auto;padding:14px 16px;border:1px solid rgba(255,255,255,.17);border-left:4px solid #fbbf24;border-radius:15px;background:rgba(5,24,19,.97);color:#f8fafc;font:13px/1.35 ui-sans-serif,system-ui,-apple-system,sans-serif;box-shadow:0 16px 44px rgba(0,0,0,.42);backdrop-filter:blur(16px);pointer-events:auto;box-sizing:border-box;scrollbar-width:thin;scrollbar-color:#3f665b transparent}
.dl-card[data-tone="positive"]{border-left-color:#4ade80}.dl-card[data-tone="mixed"]{border-left-color:#fbbf24}.dl-card[data-tone="low"]{border-left-color:#fb7185}.dl-card[data-tone="limited"]{border-left-color:#64748b;background:rgba(15,23,42,.97)}
.dl-head{display:flex;align-items:center;gap:9px}.dl-logo{width:34px;height:34px;flex:0 0 auto;border-radius:9px}.dl-brand{font-size:12px;font-weight:850;letter-spacing:.025em;color:#86efac}.dl-score{margin-left:auto;font-size:23px;line-height:1}.dl-score small{font-size:10px;color:#94a3b8}.dl-toggle{display:grid;place-items:center;width:32px;height:32px;padding:0;border:1px solid rgba(255,255,255,.17);border-radius:9px;background:#17382f;color:#fff;font:750 16px/1 system-ui;cursor:pointer}.dl-toggle:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}
.dl-value-label{margin:12px 0 4px;color:#a7f3d0;font-size:11px;font-weight:850;letter-spacing:.085em}.dl-conclusion{margin:0;font-size:15px;font-weight:760;line-height:1.35}.dl-evidence-note{margin:6px 0 0;color:#a7b8b2;font-size:10px;font-weight:650}.dl-guide-link{display:inline-flex;margin-top:9px;color:#86efac;font-size:10px;font-weight:750;line-height:1.3;text-decoration:underline;text-decoration-color:rgba(134,239,172,.5);text-underline-offset:3px;pointer-events:auto}.dl-guide-link:hover{color:#d1fae5}.dl-guide-link:focus-visible{border-radius:4px;outline:3px solid #fbbf24;outline-offset:2px}.dl-nutrition{margin-top:15px;padding-top:12px;border-top:1px solid rgba(255,255,255,.14)}.dl-nutrition-head{margin:0;color:#ecfdf5;font-size:13px;font-weight:850}.dl-risk-note{margin:3px 0 11px;color:#a7b8b2;font-size:10px}
.dl-metric{padding:9px 0;border-top:1px solid rgba(255,255,255,.08)}.dl-metric:first-of-type{border-top:0}.dl-metric-row{display:flex;align-items:center;gap:8px}.dl-metric-name{font-weight:740}.dl-risk-tag{color:#fda4af;font-size:9px;font-weight:850;letter-spacing:.08em}.dl-metric-score{margin-left:auto;font-weight:850}.dl-track{height:4px;margin:6px 0;border-radius:99px;background:rgba(255,255,255,.15);overflow:hidden}.dl-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,#34d399,#86efac)}.dl-metric[data-risk="true"] .dl-fill{background:linear-gradient(90deg,#fbbf24,#fb7185)}.dl-interpretation{margin:0;color:#d5e2de;font-size:11px;line-height:1.35}
.dl-collapsed{max-height:none;overflow:hidden}.dl-collapsed .dl-nutrition{display:none}.dl-limited .dl-nutrition{display:none}
@media (max-width:520px){.dl-card{width:calc(100vw - 20px);right:10px;top:10px}}
`;
