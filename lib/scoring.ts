import { z } from "zod";
import { nutritionAnalysisSchema } from "@doomless/shared-types";

export { nutritionAnalysisSchema as nutritionLabelSchema };

export const analyzeRequestSchema = z
  .object({
    videoUrl: z.string().url().max(2_000).optional(),
    transcript: z.string().trim().min(1).max(12_000).optional(),
  })
  .refine((value) => Boolean(value.videoUrl) !== Boolean(value.transcript), {
    message: "Provide exactly one video URL or transcript.",
  });

export const scoringSystemPrompt = `
You are DoomLess AI, a neutral digital-nutrition decision assistant for short-form video.
Use only supplied evidence. Never imply you opened a URL, watched frames, or heard audio unless those contents are supplied.
Return the exact structured schema. Scores are 0-100. Higher is better for learningValue, actionability,
personalRelevance, timeEfficiency, and emotionalImpact. Higher means more risk for clickbaitRisk and addictionRisk.
Each category needs a short evidence-based reason and evidence list. Avoid diagnoses, shame, and moralizing.
Classify the content using one supported type. Healthy entertainment can provide valid emotional and intentional-break value.
For URL-only input, use UNKNOWN classification when appropriate, confidence below 40, METADATA_ONLY mode, no invented
takeaways, and an explicit limitation. For a supplied transcript, use only transcript signals and list frames, audio delivery,
pacing, and looping as missing. Estimate duration conservatively only if present in the input; otherwise use 0 and UNKNOWN return.
Set the overall score, recommendation, evidence level, and attention-return level provisionally; server policy recomputes them.
`.trim();

export function buildScoringInput(input: z.infer<typeof analyzeRequestSchema>) {
  return input.transcript
    ? `Evaluate this supplied short-form video transcript. No viewer profile is available, so keep personal relevance neutral:\n\n${input.transcript}`
    : `Evaluate only the metadata represented by this URL. You cannot open or watch it:\n\n${input.videoUrl}`;
}
