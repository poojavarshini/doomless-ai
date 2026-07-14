import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
import { applyProductPolicy } from "@doomless/scoring";
import {
  analysisRequestSchema,
  nutritionAnalysisSchema,
  type ReelMetadata,
  type UserPreferences,
} from "@doomless/shared-types";
import { getDevelopmentDemoLabel } from "@/lib/demo-labels";
import {
  analyzeRequestSchema,
  buildScoringInput,
  nutritionLabelSchema,
  scoringSystemPrompt,
} from "@/lib/scoring";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const extensionRequest = analysisRequestSchema.safeParse(body);
  if (extensionRequest.success) {
    return analyzeReel(extensionRequest.data.metadata, extensionRequest.data.preferences);
  }

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const developmentDemo = getDevelopmentDemoLabel(parsed.data.videoUrl);
  if (developmentDemo) return NextResponse.json(developmentDemo);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "The server is missing OPENAI_API_KEY." },
      { status: 503 },
    );
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
      input: [
        { role: "system", content: scoringSystemPrompt },
        { role: "user", content: buildScoringInput(parsed.data) },
      ],
      text: { format: zodTextFormat(nutritionLabelSchema, "video_nutrition_label") },
    });

    if (!response.output_parsed) {
      return NextResponse.json(
        { error: "The analysis did not return a nutrition label." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ...response.output_parsed, analysis_mode: "live" });
  } catch (error) {
    console.error("Video analysis failed", error);

    const demoLabel = getDevelopmentDemoLabel(parsed.data.videoUrl);
    if (demoLabel) return NextResponse.json(demoLabel);

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: "The OpenAI API key is invalid. Update it in your server environment." },
          { status: 503 },
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: "OpenAI quota is unavailable. Check API billing or try again later." },
          { status: 503 },
        );
      }
      if (error.status === 400) {
        return NextResponse.json(
          { error: "The configured OpenAI model or request is not available." },
          { status: 502 },
        );
      }
    }

    return NextResponse.json(
      { error: "The video could not be analyzed. Please try again." },
      { status: 502 },
    );
  }
}

async function analyzeReel(metadata: ReelMetadata, preferences?: UserPreferences) {
  if (metadata.isPrivate) {
    return NextResponse.json(
      { error: "Private Reels require an explicit user-triggered analysis." },
      { status: 403 },
    );
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "The server is missing OPENAI_API_KEY." }, { status: 503 });
  }

  const startedAt = Date.now();
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-5.6-luna",
      input: [
        { role: "system", content: reelScoringPrompt },
        { role: "user", content: buildReelScoringInput(metadata, preferences) },
      ],
      text: { format: zodTextFormat(nutritionAnalysisSchema, "digital_nutrition_analysis") },
    });
    if (!response.output_parsed) {
      return NextResponse.json({ error: "The model returned no structured analysis." }, { status: 502 });
    }
    const validated = nutritionAnalysisSchema.safeParse(response.output_parsed);
    if (!validated.success) {
      return NextResponse.json({ error: "The model response failed schema validation." }, { status: 502 });
    }
    const result = applyProductPolicy({ ...validated.data, analysisSource: metadata.source });
    console.info("DoomLess analysis completed", {
      reelId: metadata.reelId,
      source: metadata.source,
      latencyMs: Date.now() - startedAt,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (error) {
    console.error("Reel analysis failed", { error, latencyMs: Date.now() - startedAt });
    if (error instanceof OpenAI.APIError && error.status === 429) {
      return NextResponse.json({ error: "Analysis is busy. Try again shortly." }, { status: 429 });
    }
    return NextResponse.json({ error: "The Reel could not be analyzed. A cached result may still be available." }, { status: 502 });
  }
}

const reelScoringPrompt = `
You are DoomLess, a neutral digital-nutrition analyst for short-form video.
Use only the evidence supplied. Never claim to have watched video or heard audio unless a transcript is present.
Score 0-100. Higher is better for learningValue, actionability, relevance, timeEfficiency, and emotionalImpact.
Higher means more risk for clickbaitRisk and addictionRisk. Avoid diagnoses and moralizing language.
Every category reason must cite a concrete signal or explicitly identify missing evidence.
Personalize only relevance. Treat intrinsic content quality and behavioral risks independently.
When evidence is caption-only, keep confidence conservative and state that the result is based mainly on caption and visible metadata.
Estimate attention cost transparently; do not imply scientific precision.
Set overallScore and recommendation provisionally; the server applies the published deterministic formula and overrides them.
`.trim();

function buildReelScoringInput(metadata: ReelMetadata, preferences?: UserPreferences) {
  return JSON.stringify(
    {
      task: "Create a strict Digital Nutrition Label for this Reel.",
      reel: metadata,
      viewerPreferences: preferences ?? "No personalization profile supplied; use a neutral relevance score.",
      availableEvidence: {
        caption: Boolean(metadata.caption),
        visibleText: metadata.visibleText.length > 0,
        accessibilityLabels: metadata.accessibilityLabels.length > 0,
        transcript: Boolean(metadata.transcript),
        duration: metadata.durationSeconds != null,
      },
    },
    null,
    2,
  );
}
