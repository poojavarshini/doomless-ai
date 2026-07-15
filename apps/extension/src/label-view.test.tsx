import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { NutritionLabelResult, NutritionMetric } from "./compact";
import { NutritionPanel } from "./label-view";

const metric = (score: number, isRisk = false): NutritionMetric => ({
  score,
  isRisk,
  interpretation: "One concise interpretation.",
});

const label: NutritionLabelResult = {
  overallScore: 78,
  scoreLabel: "GOOD_DIGITAL_VALUE",
  conclusion: "Worth watching \u2014 good value with minor distractions.",
  evidenceNote: "Surface estimate · 60% evidence confidence",
  categories: {
    learningValue: metric(84),
    actionability: metric(77),
    personalRelevance: metric(72),
    timeEfficiency: metric(81),
    emotionalImpact: metric(70),
    clickbaitRisk: metric(22, true),
    addictionRisk: metric(29, true),
  },
};

describe("Digital Nutrition overlay", () => {
  it("collapsed output contains only the score label and KPI summary", () => {
    const html = renderToStaticMarkup(<NutritionPanel label={label} expanded={false} logoUrl="chrome-extension://test/icons/icon-48.png" onToggle={() => undefined} />);
    expect(html).toContain("78");
    expect(html).toContain("GOOD DIGITAL VALUE");
    expect(html).toContain(label.conclusion);
    expect(html).toContain("DoomLess AI");
    expect(html).toContain("icon-48.png");
    expect(html).toContain("What does this score mean?");
    expect(html).toContain("Surface estimate");
    expect(html).not.toContain("dl-metric-row");
  });

  it("expanded output contains exactly seven metrics and no old report sections", () => {
    const html = renderToStaticMarkup(<NutritionPanel label={label} expanded logoUrl="chrome-extension://test/icons/icon-48.png" onToggle={() => undefined} />);
    expect((html.match(/class="dl-metric"/g) ?? [])).toHaveLength(7);
    expect((html.match(/class="dl-interpretation"/g) ?? [])).toHaveLength(7);
    for (const forbidden of ["Your Decision", "What You Get", "Return on Attention", "Why This Decision", "Failed to fetch"]) {
      expect(html).not.toContain(forbidden);
    }
  });
});
