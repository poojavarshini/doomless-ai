import { applyProductPolicy } from "@doomless/scoring";
import type { ContentClassificationType, NutritionAnalysis } from "@doomless/shared-types";

export interface DemoVideo {
  video_url: string;
  platform: "instagram" | "youtube_short";
  video_title: string;
  creator_name: string;
  topic: string;
  description: string;
  label: NutritionAnalysis;
}

export const demoVideos: DemoVideo[] = [
  demo("https://www.instagram.com/reel/DawLVAitqec/", "instagram", "Positive Dance Break", "@rhythmroom.demo", "Entertainment", "A short, upbeat dance performance with a clear ending.", "ENTERTAINMENT", [18, 10, 86, 78, 15, 28], 22, "A brief positive entertainment break.", "Enjoy the performance as entertainment, not instruction."),
  demo("https://www.instagram.com/reel/DLDEMO0002/", "instagram", "Active Recall in Three Steps", "@studyminute.demo", "Practical learning", "A teacher demonstrates a focused active-recall exercise.", "PRACTICAL_LEARNING", [92, 90, 82, 88, 10, 16], 36, "Three usable active-recall steps.", "Test yourself before rereading your notes."),
  demo("https://www.instagram.com/reel/DLDEMO0003/", "instagram", "Useful but Long Planning Guide", "@calmwork.demo", "Explanation", "A useful planning framework that repeats its core point.", "EXPLANATION", [86, 74, 70, 40, 18, 30], 92, "A planning checklist worth saving for later.", "Choose three priorities before filling your calendar."),
  demo("https://www.youtube.com/shorts/DLDEMO0004", "youtube_short", "Wait for the Secret Reveal", "@loopshock.demo", "Clickbait", "A curiosity-gap reveal repeatedly delays its payoff.", "CLICKBAIT", [24, 14, 34, 28, 92, 84], 41, "One vague claim with little supporting value.", "No reliable practical takeaway is delivered."),
  demo("https://www.youtube.com/shorts/DLDEMO0005", "youtube_short", "Urgent Fear-Based Opinion", "@reactnow.demo", "Opinion", "A forceful opinion uses urgency and emotional pressure.", "OPINION", [30, 18, 24, 36, 80, 76], 48, "A clear opinion to evaluate cautiously.", "Separate the stated claim from the urgency around it."),
  demo("https://www.youtube.com/shorts/DLDEMO0006", "youtube_short", "One Point, Repeated", "@againandagain.demo", "Repetitive low value", "The core point arrives early and is repeated until the loop.", "REPETITIVE_LOW_VALUE", [26, 20, 40, 30, 48, 88], 57, "A single idea that can be skimmed.", "The main point appears near the beginning."),
];

export function findDemoVideo(videoUrl?: string) {
  if (!videoUrl) return null;
  const normalizedInput = normalizeDemoUrl(videoUrl);
  return demoVideos.find((video) => normalizeDemoUrl(video.video_url) === normalizedInput) ?? null;
}

function demo(
  video_url: string,
  platform: DemoVideo["platform"],
  video_title: string,
  creator_name: string,
  topic: string,
  description: string,
  type: ContentClassificationType,
  scores: [number, number, number, number, number, number],
  duration: number,
  benefit: string,
  takeaway: string,
): DemoVideo {
  const [learning, actionability, emotional, efficiency, clickbait, addiction] = scores;
  const metric = (score: number, reason: string, evidence: string[]) => ({ score, reason, evidence });
  const label = applyProductPolicy({
    overallScore: 0,
    contentClassification: { type, label: topic, reason: `The demo fixture is designed to represent ${topic.toLowerCase()} content.` },
    recommendation: { action: "ANALYZE_MORE", headline: "Provisional", reason: "Replaced by product policy." },
    attentionReturn: { level: "UNKNOWN", label: "Provisional", estimatedTotalSeconds: duration, estimatedUsefulSeconds: 0, estimatedFillerSeconds: 0, valueRatio: 0, attentionSavedIfSkippedSeconds: 0, explanation: "Recomputed by product policy." },
    userBenefit: { primaryBenefit: benefit, takeawayCount: 1, takeaways: [takeaway], bestFor: "Beta testers exploring a realistic DoomLess decision.", notUsefulFor: "Making claims about a real platform video; this is simulated demo data." },
    evidence: { confidence: 94, level: "HIGH", sourcesUsed: ["pre-analyzed demo fixture"], sourcesMissing: [], analysisMode: "DEMO", limitationMessage: "This is simulated demo data. DoomLess did not download or analyze platform media for this result." },
    categories: {
      learningValue: metric(learning, "The fixture reflects how much knowledge or context is delivered.", [description]),
      actionability: metric(actionability, "The fixture reflects whether a viewer receives usable steps.", [takeaway]),
      personalRelevance: metric(60, "No personal profile is supplied on the website demo, so relevance remains neutral.", ["no viewer profile"]),
      timeEfficiency: metric(efficiency, `The designed payoff is compared with a ${duration}s runtime.`, [description]),
      emotionalImpact: metric(emotional, "The fixture reflects likely mood and clarity effects without diagnosis.", [description]),
      clickbaitRisk: metric(clickbait, "The fixture measures exaggeration, curiosity gaps, and delivery against the hook.", [description]),
      addictionRisk: metric(addiction, "The fixture measures repetition, looping, novelty, and continuation pressure.", [description]),
    },
    positiveSignals: [benefit], warningSignals: [description], summary: `${topic}: ${description}`,
    suggestedUserAction: "Use the recommendation as the primary decision and inspect the evidence behind it.", topics: [topic.toLowerCase()],
  });
  return { video_url, platform, video_title, creator_name, topic, description, label };
}

function normalizeDemoUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, "").toLowerCase()}`;
  } catch {
    return value.trim().replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase();
  }
}
