import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
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
