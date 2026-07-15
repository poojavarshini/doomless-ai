import { describe, expect, it } from "vitest";
import type { NutritionAnalysis } from "@doomless/shared-types";
import { CATEGORY_ORDER, LIMITED_ANALYSIS_RESULT, compactOverlayCss, toNutritionLabelResult } from "./compact";

export function analysis(overrides: Partial<NutritionAnalysis> = {}): NutritionAnalysis {
  const metric = (score: number) => ({ score, reason: "Model prose is ignored.", evidence: ["fixture"] });
  return {
    overallScore: 1,
    contentClassification: { type: "PRACTICAL_LEARNING", label: "Learning", reason: "Clear steps." },
    recommendation: { action: "WATCH", headline: "Ignored", reason: "Ignored" },
    attentionReturn: { level: "HIGH", label: "Ignored", estimatedTotalSeconds: 30, estimatedUsefulSeconds: 24, estimatedFillerSeconds: 6, valueRatio: .8, attentionSavedIfSkippedSeconds: 6, explanation: "Ignored" },
    userBenefit: { primaryBenefit: "Ignored", takeawayCount: 1, takeaways: ["Ignored"], bestFor: "Ignored", notUsefulFor: "Ignored" },
    evidence: { confidence: 85, level: "HIGH", sourcesUsed: ["transcript"], sourcesMissing: [], analysisMode: "FULL", limitationMessage: "Ignored" },
    categories: {
      learningValue: metric(92),
      actionability: metric(88),
      personalRelevance: metric(83),
      timeEfficiency: metric(91),
      emotionalImpact: metric(76),
      clickbaitRisk: metric(12),
      addictionRisk: metric(18),
    },
    positiveSignals: ["Ignored"],
    warningSignals: ["Failed to fetch"],
    summary: "Ignored",
    suggestedUserAction: "Ignored",
    topics: [],
    ...overrides,
  };
}

describe("sanitized nutrition label result", () => {
  it("shows the true no-data state without category scores", () => {
    expect(toNutritionLabelResult(null, new Error("Failed to fetch"))).toEqual(LIMITED_ANALYSIS_RESULT);
    expect(LIMITED_ANALYSIS_RESULT).toMatchObject({
      overallScore: null,
      scoreLabel: "LIMITED_ANALYSIS",
      conclusion: "Not enough Reel content was available to score.",
      evidenceNote: "No usable Reel surface signals were found.",
      categories: null,
    });
  });

  it("recomputes the total and never trusts AI prose or overallScore", () => {
    const result = toNutritionLabelResult(analysis());
    expect(result.overallScore).toBeGreaterThan(85);
    expect(result.overallScore).not.toBe(1);
    expect(JSON.stringify(result)).not.toContain("Ignored");
    expect(JSON.stringify(result)).not.toContain("Failed to fetch");
    expect(result.evidenceNote).toBe("AI analysis · 85% evidence confidence");
  });

  it("creates exactly seven deterministic metrics", () => {
    const result = toNutritionLabelResult(analysis());
    expect(Object.keys(result.categories ?? {})).toEqual(CATEGORY_ORDER);
    expect(Object.values(result.categories ?? {})).toHaveLength(7);
    for (const metric of Object.values(result.categories ?? {})) {
      expect(metric.interpretation.split(/[.!?]/).filter(Boolean)).toHaveLength(1);
    }
  });

  it("uses cautious wording for metadata-only analysis", () => {
    const result = toNutritionLabelResult(analysis({
      evidence: { confidence: 60, level: "MEDIUM", sourcesUsed: ["caption"], sourcesMissing: [], analysisMode: "METADATA_ONLY", limitationMessage: "Ignored" },
    }));
    expect(result.conclusion).not.toContain("exceptional");
    expect(result.evidenceNote).toBe("Surface estimate · 60% evidence confidence");
    expect(result.categories?.learningValue.interpretation).toContain("Visible text");
  });

  it("marks risk metrics with inverse visual semantics", () => {
    const result = toNutritionLabelResult(analysis());
    expect(result.categories?.learningValue.isRisk).toBe(false);
    expect(result.categories?.clickbaitRisk.isRisk).toBe(true);
    expect(result.categories?.addictionRisk.isRisk).toBe(true);
    expect(compactOverlayCss).toContain('[data-risk="true"] .dl-fill');
  });
});
