import { applyProductPolicy } from "@doomless/scoring";
import type { NutritionAnalysis, ReelMetadata } from "@doomless/shared-types";

const NEUTRAL_SCORE = 50;

export function isInstagramContentUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return (host === "instagram.com" || host.endsWith(".instagram.com"))
      && /^\/(reel|p|tv)\/[a-z0-9_-]+/i.test(url.pathname);
  } catch {
    return false;
  }
}

export function buildUrlSurfaceAnalysis(videoUrl: string): NutritionAnalysis {
  const parsed = new URL(videoUrl);
  const contentId = parsed.pathname.split("/").filter(Boolean)[1] ?? "unknown";
  return buildSurfaceAnalysis({
    reference: `Instagram content ${contentId}`,
    sourcesUsed: ["Instagram URL structure"],
    sourcesMissing: ["caption", "transcript", "video frames", "audio", "duration", "viewer preferences"],
    confidence: 5,
    limitationMessage: "Surface score only: DoomLess received a public Instagram URL, but no caption, transcript, frames, audio, or duration. The neutral scores are placeholders until more evidence is available.",
  });
}

export function buildMetadataSurfaceAnalysis(metadata: ReelMetadata): NutritionAnalysis {
  const sourcesUsed = [
    metadata.caption.trim() ? "caption" : "",
    metadata.visibleText.length ? "visible text" : "",
    metadata.accessibilityLabels.length ? "accessibility labels" : "",
    metadata.durationSeconds != null ? "duration" : "",
  ].filter(Boolean);
  const sourcesMissing = [
    metadata.transcript ? "" : "transcript",
    metadata.source === "screenshot" ? "" : "video frames",
    "audio delivery",
    "pacing and looping",
  ].filter(Boolean);
  const hasSurfaceEvidence = sourcesUsed.length > 0;

  return buildSurfaceAnalysis({
    reference: metadata.creator || metadata.reelId,
    sourcesUsed: hasSurfaceEvidence ? sourcesUsed : ["Instagram URL structure"],
    sourcesMissing,
    confidence: hasSurfaceEvidence ? 22 : 5,
    limitationMessage: hasSurfaceEvidence
      ? "Surface score only: visible metadata was available, but DoomLess could not verify the full Reel, audio, pacing, or looping. Scores remain neutral until deeper evidence is available."
      : "Surface score only: DoomLess received the Reel URL without enough content evidence. Scores remain neutral until a caption, transcript, or frames are available.",
  });
}

function buildSurfaceAnalysis(input: {
  reference: string;
  sourcesUsed: string[];
  sourcesMissing: string[];
  confidence: number;
  limitationMessage: string;
}): NutritionAnalysis {
  const category = (label: string, risk = false) => ({
    score: NEUTRAL_SCORE,
    reason: risk
      ? `${label} cannot be estimated from the URL alone, so DoomLess uses a neutral placeholder.`
      : `${label} cannot be verified from the URL alone, so DoomLess uses a neutral placeholder.`,
    evidence: input.sourcesUsed,
  });

  return applyProductPolicy({
    overallScore: NEUTRAL_SCORE,
    contentClassification: {
      type: "UNKNOWN",
      label: "Unknown from URL",
      reason: "A platform URL does not reveal enough about the content to classify it responsibly.",
    },
    recommendation: {
      action: "ANALYZE_MORE",
      headline: "Surface estimate — verify first",
      reason: "More evidence is needed before making a watch-or-skip recommendation.",
    },
    attentionReturn: {
      level: "UNKNOWN",
      label: "Not enough evidence",
      estimatedTotalSeconds: 0,
      estimatedUsefulSeconds: 0,
      estimatedFillerSeconds: 0,
      valueRatio: 0,
      attentionSavedIfSkippedSeconds: 0,
      explanation: "Duration and content evidence are unavailable from the URL alone.",
    },
    userBenefit: {
      primaryBenefit: "A safe surface-level placeholder instead of an unsupported content claim.",
      takeawayCount: 0,
      takeaways: [],
      bestFor: "Confirming that the link is accepted while deeper evidence is unavailable.",
      notUsefulFor: "Deciding whether the Reel is educational, emotionally positive, or worth watching.",
    },
    evidence: {
      confidence: input.confidence,
      level: "LOW",
      sourcesUsed: input.sourcesUsed,
      sourcesMissing: input.sourcesMissing,
      analysisMode: "METADATA_ONLY",
      limitationMessage: input.limitationMessage,
    },
    categories: {
      learningValue: category("Learning value"),
      actionability: category("Actionability"),
      personalRelevance: category("Personal relevance"),
      timeEfficiency: category("Time efficiency"),
      emotionalImpact: category("Emotional impact"),
      clickbaitRisk: category("Clickbait risk", true),
      addictionRisk: category("Addiction risk", true),
    },
    positiveSignals: ["The public Instagram URL was recognized."],
    warningSignals: ["No Reel content was available to verify the neutral surface scores."],
    summary: `${input.reference} was accepted, but only its URL or visible metadata was available.`,
    suggestedUserAction: "Use this as a surface estimate only. Add a transcript or analyze through the extension for a stronger label.",
    topics: [],
  });
}
