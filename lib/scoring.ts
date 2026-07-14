import { z } from "zod";

const score = z.number().min(0).max(10);
const explanation = z.string().min(1).max(240);

export const nutritionLabelSchema = z.object({
  scores: z.object({
    learning: score,
    usefulness: score,
    mind_impact: score,
    quality: score,
    personal_relevance: score,
    time_worth: score,
    scroll_risk: score,
  }),
  explanations: z.object({
    learning: explanation,
    usefulness: explanation,
    mind_impact: explanation,
    quality: explanation,
    personal_relevance: explanation,
    time_worth: explanation,
    scroll_risk: explanation,
  }),
});

export const analyzeRequestSchema = z
  .object({
    videoUrl: z.string().url().max(2_000).optional(),
    transcript: z.string().trim().min(1).max(12_000).optional(),
  })
  .refine((value) => Boolean(value.videoUrl) !== Boolean(value.transcript), {
    message: "Provide exactly one video URL or transcript.",
  });

export const scoringSystemPrompt = `
You are DoomLess AI's neutral digital-wellbeing content rater. Evaluate short-form
video content without shaming the viewer or creator. Focus on likely impact,
informational value, accuracy, presentation, and attention-design patterns.

Score each category from 0 to 10:
- learning: how much the content teaches or builds understanding.
- usefulness: how readily it can be applied in real life.
- mind_impact: likely effect on mood, clarity, and mental energy; difficult topics
  are not automatically harmful.
- quality: apparent accuracy, credibility, nuance, and clarity. Do not claim to
  verify facts or creator credentials not present in the input.
- personal_relevance: fit with supplied viewer interests or goals. Because this
  prototype supplies no viewer profile, use 5 and explain that personalization
  context was not provided.
- time_worth: value delivered relative to time required.
- scroll_risk: likelihood of encouraging continued, unplanned scrolling. Lower is
  better. Clickbait, unresolved hooks, cliffhangers, rapid novelty, emotional
  provocation, looping, and pressure to keep watching increase this score, even
  when the content is entertaining or useful.

Use conservative mid-range scores when information is missing. If only a URL is
provided, do not imply that you accessed or watched its content and explain the
evidence limitation. Do not invent visual, audio, pacing, or factual details.
Return one short, specific sentence for every explanation.
`.trim();

export function buildScoringInput(input: z.infer<typeof analyzeRequestSchema>) {
  return input.transcript
    ? `Evaluate this short-form video transcript:\n\n${input.transcript}`
    : `Evaluate the information available from this video URL only:\n\n${input.videoUrl}`;
}
