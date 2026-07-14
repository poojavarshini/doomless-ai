import { applyProductPolicy, preferenceMatch } from "@doomless/scoring";
import type { NutritionAnalysis, ReelMetadata, UserPreferences } from "@doomless/shared-types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function buildMetadataFallback(
  metadata: ReelMetadata,
  preferences: UserPreferences,
  cause = "The live AI service is unavailable.",
): NutritionAnalysis {
  const evidence = [metadata.caption, ...metadata.visibleText].join(" ").toLowerCase();
  const wordCount = evidence.split(/\s+/).filter(Boolean).length;
  const hasSteps = /\b(steps?|tips?|how to|guide|framework|first|second|finally)\b/i.test(evidence);
  const clickbait = /\b(shocking|secret|you won't believe|must watch|before it's too late|nobody tells you)\b/i.test(evidence);
  const urgency = /\b(now|urgent|immediately|don't miss|last chance)\b/i.test(evidence);
  const duration = metadata.durationSeconds ?? 30;
  const learning = clamp(25 + Math.min(35, wordCount / 2) + (hasSteps ? 18 : 0));
  const actionability = clamp(22 + (hasSteps ? 40 : 0) + Math.min(20, wordCount / 3));
  const timeEfficiency = clamp(75 - Math.max(0, duration - 30) * 0.7 + (hasSteps ? 8 : 0));
  const relevance = preferenceMatch(metadata, preferences);
  const clickbaitRisk = clamp(18 + (clickbait ? 55 : 0) + (urgency ? 20 : 0));
  const addictionRisk = clamp(25 + (clickbait ? 25 : 0) + (urgency ? 15 : 0));
  const usefulSeconds = clamp(duration * ((learning + actionability + timeEfficiency) / 300));

  return applyProductPolicy({
    overallScore: 0,
    recommendation: "LIMIT",
    confidence: metadata.caption ? 38 : 22,
    attentionCost: {
      label: duration <= 30 ? "Low" : duration <= 60 ? "Medium" : "High",
      estimatedUsefulSeconds: Math.min(duration, usefulSeconds),
      estimatedTotalSeconds: duration,
      valueRatio: Math.min(1, usefulSeconds / Math.max(1, duration)),
    },
    categories: {
      learningValue: { score: learning, reason: metadata.caption ? "Estimated from the caption's information density; visuals and audio were not analyzed." : "No caption was available, so learning value cannot be assessed reliably." },
      actionability: { score: actionability, reason: hasSteps ? "The visible text uses step-by-step or instructional language." : "The available text does not expose clear steps or a practical framework." },
      relevance: { score: relevance, reason: "Matched locally against your selected interests, goals, field, and avoided topics." },
      timeEfficiency: { score: timeEfficiency, reason: metadata.durationSeconds ? `Estimated from ${duration} seconds of displayed duration and the available text density.` : "Duration was unavailable, so a conservative 30-second estimate was used." },
      emotionalImpact: { score: urgency ? 42 : 62, reason: urgency ? "The available wording contains urgency signals that may increase pressure." : "The available wording does not show strong fear or urgency signals." },
      clickbaitRisk: { score: clickbaitRisk, reason: clickbait ? "The visible wording contains sensational or curiosity-gap phrases." : "No strong clickbait phrase was detected in the available text." },
      addictionRisk: { score: addictionRisk, reason: "Only text-level hook and urgency signals were assessed; pacing, looping, and audio remain unknown." },
    },
    summary: `Limited metadata-only fallback. ${cause} This is not a full AI video analysis.`,
    positiveSignals: [hasSteps ? "Visible text appears instructional." : "Available metadata was analyzed locally."],
    warningSignals: [cause, "Video frames, audio, pacing, and looping were not analyzed."],
    suggestedAction: "Treat this label as a quick caption-level estimate and use the confidence indicator.",
    contentType: hasSteps ? "Educational / instructional" : "Unclassified short-form content",
    topics: metadata.hashtags.slice(0, 8),
    analysisSource: "partial",
    availableSourceData: [metadata.caption && "caption", metadata.visibleText.length && "visible text", metadata.durationSeconds != null && "displayed duration"].filter(Boolean) as string[],
    missingInformation: [...new Set([...metadata.missingInformation, "live AI analysis", "video frames", "audio and pacing"])],
  });
}
