import { adjustForEvidence, applyProductPolicy, getMetadataEvidenceStrength, preferenceMatch } from "@doomless/scoring";
import type {
  ContentClassificationType,
  NutritionAnalysis,
  ReelMetadata,
  UserPreferences,
} from "@doomless/shared-types";

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const metadataClamp = (value: number) => Math.max(15, Math.min(85, Math.round(value)));
const metric = (score: number, reason: string, evidence: string[]) => ({ score, reason, evidence });

export function hasMeaningfulMetadata(metadata: ReelMetadata): boolean {
  return getMetadataEvidenceStrength(metadata) > 0;
}

export function buildMetadataFallback(
  metadata: ReelMetadata,
  preferences: UserPreferences,
  cause = "The live AI service is unavailable.",
): NutritionAnalysis {
  const evidenceText = [
    metadata.caption,
    metadata.creator,
    ...metadata.hashtags.map((tag) => `#${tag}`),
    ...metadata.visibleText,
    ...metadata.accessibilityLabels,
    ...metadata.engagementText,
  ].join(" ").toLowerCase();
  const wordCount = evidenceText.split(/\s+/).filter(Boolean).length;
  const hasSteps = /\b(steps?|tips?|how to|guide|framework|first|second|finally)\b/i.test(evidenceText);
  const classification = classifyContent(evidenceText, hasSteps, metadata.hashtags);
  const isEntertainment = classification.type === "ENTERTAINMENT";
  const isPromotional = classification.type === "PROMOTION";
  const educational = /\b(learn|explain|explained|lesson|science|research|history|guide|tutorial|facts?|because|how|why)\b/i.test(evidenceText);
  const clickbait = /\b(shocking|secret|you won't believe|must watch|before it's too late|nobody tells you|life changing|guaranteed)\b/i.test(evidenceText);
  const urgency = /\b(now|urgent|immediately|don't miss|last chance)\b/i.test(evidenceText);
  const emotionalPressure = /\b(terrified|fear|panic|disaster|hate|angry|outrage|warning)\b/i.test(evidenceText);
  const duration = metadata.durationSeconds ?? 30;
  const evidenceStrength = getMetadataEvidenceStrength(metadata);
  const adjust = (value: number) => metadataClamp(adjustForEvidence(value, evidenceStrength));
  const learning = adjust(isEntertainment ? 24 : isPromotional ? 28 : 32 + Math.min(28, wordCount / 2) + (educational ? 24 : 0) + (hasSteps ? 12 : 0));
  const actionability = adjust(isEntertainment ? 20 : isPromotional ? 35 : 28 + (hasSteps ? 48 : 0) + Math.min(15, wordCount / 4));
  const timeEfficiency = adjust((isPromotional ? 42 : isEntertainment ? 74 : 70) - Math.max(0, duration - 30) * 0.55 + (hasSteps ? 6 : 0));
  const relevance = adjust(preferenceMatch(metadata, preferences));
  const emotionalImpact = adjust(emotionalPressure ? 25 : urgency ? 42 : isEntertainment ? 82 : 58);
  const clickbaitRisk = adjust(20 + (clickbait ? 58 : 0) + (urgency ? 14 : 0) + (isPromotional ? 12 : 0));
  const addictionRisk = adjust(28 + (clickbait ? 22 : 0) + (urgency ? 25 : 0));
  const confidence = clamp(evidenceStrength * 100);
  const sourcesUsed = [
    metadata.caption && "caption",
    metadata.visibleText.length > 0 && "visible text",
    metadata.accessibilityLabels.length > 0 && "accessibility labels",
    metadata.durationSeconds != null && "displayed duration",
  ].filter(Boolean) as string[];
  const sourcesMissing = [...new Set([...metadata.missingInformation, "video frames", "audio or transcript", "pacing and looping"])] as string[];
  const takeaways = metadata.caption
    ? [`Caption signal: ${shorten(metadata.caption)}`]
    : isEntertainment
      ? ["Available labels suggest an entertainment-focused Reel."]
      : metadata.hashtags.length > 0
        ? [`Visible topic signal: #${metadata.hashtags[0]}.`]
        : [];
  const preliminaryBenefit = isEntertainment
    ? "Possible intentional entertainment or mood value."
    : hasSteps
      ? "Possible practical guidance with steps visible in the metadata."
      : metadata.hashtags.length > 0
        ? `A quick preview related to #${metadata.hashtags[0]}.`
        : metadata.caption
          ? "A caption-level preview of the Reel's main claim or topic."
          : "The creator and visible page labels can be reviewed, but the Reel's payoff is not yet clear.";

  return applyProductPolicy({
    overallScore: 0,
    contentClassification: classification,
    recommendation: {
      action: "ANALYZE_MORE",
      headline: "Analyze more before deciding",
      reason: "This provisional value is replaced by the deterministic policy.",
    },
    attentionReturn: {
      level: "UNKNOWN",
      label: "Not enough evidence",
      estimatedUsefulSeconds: 0,
      estimatedFillerSeconds: 0,
      estimatedTotalSeconds: duration,
      valueRatio: 0,
      attentionSavedIfSkippedSeconds: 0,
      explanation: "Only metadata was available, so useful and filler seconds are not estimated.",
    },
    userBenefit: {
      primaryBenefit: preliminaryBenefit,
      takeawayCount: takeaways.length,
      takeaways,
      bestFor: isEntertainment ? "Viewers intentionally looking for a short entertainment break." : "Viewers deciding whether the visible topic matches their goals.",
      notUsefulFor: "Anyone needing a verified summary of the full video.",
    },
    evidence: {
      confidence,
      level: "LOW",
      sourcesUsed: sourcesUsed.length ? sourcesUsed : ["Reel URL"],
      sourcesMissing,
      analysisMode: "METADATA_ONLY",
      limitationMessage: metadata.caption
        ? "This preliminary result is based mainly on the Reel caption and visible metadata. Frames, audio, pacing, and looping were not analyzed."
        : "This preliminary result uses visible page text, hashtags, and accessibility labels where available. The caption, frames, audio, pacing, and looping were not fully analyzed.",
    },
    categories: {
      learningValue: metric(learning, metadata.caption ? "Estimated from caption information density; the teaching itself was not verified." : "No caption or transcript was available to assess learning value.", metadata.caption ? ["caption word and instruction signals"] : ["missing caption and transcript"]),
      actionability: metric(actionability, hasSteps ? "The visible text contains step-by-step or instructional language." : "The available text does not expose clear steps or a practical framework.", [hasSteps ? "instructional phrases" : "no detected steps"]),
      personalRelevance: metric(relevance, "Matched locally against your selected interests, goals, field, and avoided topics.", ["local preference match"]),
      timeEfficiency: metric(timeEfficiency, metadata.durationSeconds ? `Estimated from the displayed ${duration}s duration and text density.` : "Duration was unavailable, so a conservative 30-second placeholder was used.", [metadata.durationSeconds ? "displayed duration" : "missing duration"]),
      emotionalImpact: metric(emotionalImpact, urgency || emotionalPressure ? "Visible wording contains pressure or negative emotional signals." : "Visible wording suggests a neutral or positive tone.", [urgency || emotionalPressure ? "emotional wording" : "visible tone"]),
      clickbaitRisk: metric(clickbaitRisk, clickbait ? "The visible wording contains sensational or curiosity-gap phrases." : "No strong clickbait phrase was detected in the available text.", [clickbait ? "sensational phrase" : "caption wording"]),
      addictionRisk: metric(addictionRisk, "Estimated cautiously from visible urgency and attention-hook wording.", ["visible attention signals"]),
    },
    summary: `Preliminary ${classification.label.toLowerCase()} insight from ${sourcesUsed.join(", ") || "the Reel page"}. ${cause} Frames and audio were not analyzed.`,
    positiveSignals: [hasSteps ? "Visible text appears instructional." : isEntertainment ? "Visible text suggests intentional entertainment." : `${sourcesUsed.length || 1} metadata source${sourcesUsed.length === 1 ? " was" : "s were"} available for a preliminary preview.`],
    warningSignals: [cause, "Video frames, audio, pacing, and looping were not analyzed."],
    suggestedUserAction: confidence >= 40 ? "Use the preliminary category and caption takeaway to skim intentionally; expand the evidence before committing more time." : "Review the preliminary topic and available sources, then use Analyze more before making a watch-or-skip decision.",
    topics: metadata.hashtags.slice(0, 8),
  });
}

function classifyContent(evidence: string, hasSteps: boolean, hashtags: string[]): NutritionAnalysis["contentClassification"] {
  let type: ContentClassificationType = "UNKNOWN";
  let label = "Unknown content";
  if (/\b(paid partnership|sponsored|advertisement|shop now|buy now|discount|sale|promo code|link in bio|product launch)\b/i.test(evidence)) { type = "PROMOTION"; label = "Promotion"; }
  else if (hasSteps) { type = "PRACTICAL_LEARNING"; label = "Practical learning"; }
  else if (/\b(comedy|funny|jokes?|humou?r|meme|lol|dance|dancing|choreography|music|song|performance|movie|sports?|gaming|gameplay)\b/i.test(evidence)) { type = "ENTERTAINMENT"; label = "Entertainment"; }
  else if (/\b(news|update|report|announced|today)\b/i.test(evidence)) { type = "NEWS_OR_INFORMATION"; label = "News or information"; }
  else if (/\b(buy|sale|discount|shop|sponsored|link in bio)\b/i.test(evidence)) { type = "PROMOTION"; label = "Promotion"; }
  else if (/\b(shocking|secret|you won't believe|must watch)\b/i.test(evidence)) { type = "CLICKBAIT"; label = "Clickbait"; }
  else if (/\b(why|explained|because|means|story|history|science|technology|finance|health)\b/i.test(evidence)) { type = "EXPLANATION"; label = "Explanation"; }
  else if (/\b(motivation|inspiration|mindset|quote|believe|growth)\b/i.test(evidence)) { type = "INSPIRATION"; label = "Inspiration"; }
  else if (/\b(opinion|reaction|my take|i think|hot take)\b/i.test(evidence)) { type = "OPINION"; label = "Opinion"; }
  else if (hashtags.length > 0) { label = `Topic: #${hashtags[0]}`; }
  else { label = "Caption-level preview"; }
  return {
    type,
    label,
    reason: type === "UNKNOWN" ? `The available metadata suggests ${label.toLowerCase()}, but does not support a confident content classification.` : `Visible metadata contains signals associated with ${label.toLowerCase()}.`,
  };
}

function shorten(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length <= 180 ? compact : `${compact.slice(0, 177)}…`;
}
