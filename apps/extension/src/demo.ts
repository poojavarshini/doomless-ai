import { applyProductPolicy, preferenceMatch } from "@doomless/scoring";
import type { ContentClassificationType, NutritionAnalysis, ReelMetadata, UserPreferences } from "@doomless/shared-types";

interface DemoSpec {
  label: string;
  type: ContentClassificationType;
  scores: [number, number, number, number, number, number];
  duration: number;
  benefit: string;
  takeaway: string;
  positive: string;
  warning: string;
}

const demos: DemoSpec[] = [
  { label: "Practical learning", type: "PRACTICAL_LEARNING", scores: [92, 88, 84, 82, 12, 18], duration: 38, benefit: "Three usable active-recall steps.", takeaway: "Test yourself before rereading notes.", positive: "Clear steps and concrete examples.", warning: "Examples are simplified for a short format." },
  { label: "Useful but long", type: "EXPLANATION", scores: [86, 72, 38, 70, 18, 28], duration: 92, benefit: "A useful explanation to revisit when focused.", takeaway: "Use the framework as a planning checklist.", positive: "Strong explanatory structure.", warning: "The same point is repeated several times." },
  { label: "Clickbait", type: "CLICKBAIT", scores: [28, 18, 42, 44, 91, 76], duration: 34, benefit: "One broad claim with little supporting detail.", takeaway: "No reliable takeaway is delivered.", positive: "The topic may be relevant to some viewers.", warning: "The hook exaggerates the evidence and delays the payoff." },
  { label: "Entertainment", type: "ENTERTAINMENT", scores: [20, 12, 88, 76, 16, 28], duration: 21, benefit: "A brief, positive comedy or dance break.", takeaway: "Enjoy it as entertainment, not instruction.", positive: "Light mood payoff without fake educational claims.", warning: "It offers little informational value." },
  { label: "Emotionally manipulative", type: "OPINION", scores: [30, 20, 25, 35, 82, 79], duration: 47, benefit: "A strong opinion prompt.", takeaway: "Pause before accepting the emotional framing.", positive: "The creator's stance is clear.", warning: "Fear and urgency carry more weight than evidence." },
  { label: "Repetitive low value", type: "REPETITIVE_LOW_VALUE", scores: [24, 18, 32, 38, 45, 86], duration: 55, benefit: "A single point that can be skimmed.", takeaway: "The main idea appears near the beginning.", positive: "The core point is easy to identify.", warning: "Looping and repetition add attention cost without new value." },
];

const metric = (score: number, reason: string, evidence: string[]) => ({ score, reason, evidence });

export function buildDemoAnalysis(metadata: ReelMetadata, preferences: UserPreferences): NutritionAnalysis {
  const index = [...metadata.reelId].reduce((sum, character) => sum + character.charCodeAt(0), 0) % demos.length;
  const spec = demos[index];
  const [learning, actionability, emotional, efficiency, clickbait, addiction] = spec.scores;
  const relevance = preferenceMatch(metadata, preferences);
  const result = applyProductPolicy({
    overallScore: 0,
    contentClassification: { type: spec.type, label: spec.label, reason: `Demo evidence is designed to represent ${spec.label.toLowerCase()} content.` },
    recommendation: { action: "ANALYZE_MORE", headline: "Provisional", reason: "Replaced by deterministic policy." },
    attentionReturn: { level: "UNKNOWN", label: "Provisional", estimatedTotalSeconds: spec.duration, estimatedUsefulSeconds: 0, estimatedFillerSeconds: 0, valueRatio: 0, attentionSavedIfSkippedSeconds: 0, explanation: "Recalculated by deterministic policy." },
    userBenefit: { primaryBenefit: spec.benefit, takeawayCount: 1, takeaways: [spec.takeaway], bestFor: "Beta testers exploring the DoomLess decision flow.", notUsefulFor: "Making factual claims about the real Reel behind this demo overlay." },
    evidence: { confidence: 92, level: "HIGH", sourcesUsed: ["pre-analyzed demo fixture"], sourcesMissing: [], analysisMode: "DEMO", limitationMessage: "Demo data is simulated and does not describe the Instagram Reel underneath it." },
    categories: {
      learningValue: metric(learning, "Demo fixture reflects the amount of knowledge delivered.", [spec.positive]),
      actionability: metric(actionability, "Demo fixture reflects whether clear next steps are supplied.", [spec.takeaway]),
      personalRelevance: metric(relevance, "Matched locally against your current interest profile.", ["local preference match"]),
      timeEfficiency: metric(efficiency, `Demo payoff is compared with a ${spec.duration}s duration.`, [spec.warning]),
      emotionalImpact: metric(emotional, "Demo fixture reflects likely mood and clarity effects without diagnosis.", [spec.positive, spec.warning]),
      clickbaitRisk: metric(clickbait, "Demo fixture measures exaggeration, curiosity gaps, and delivery against the hook.", [spec.warning]),
      addictionRisk: metric(addiction, "Demo fixture measures looping, repetition, novelty, and low-value continuation signals.", [spec.warning]),
    },
    positiveSignals: [spec.positive], warningSignals: [spec.warning], summary: `${spec.label} demo: ${spec.benefit}`,
    suggestedUserAction: "Try the recommended action and confirm that it updates local history.", topics: [spec.type.toLowerCase()],
  });
  return result;
}
