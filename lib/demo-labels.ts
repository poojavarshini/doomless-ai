import type { VideoNutritionLabel } from "@/lib/nutrition";
import { findDemoVideo } from "@/lib/demo-videos";

const RICK_ASTLEY_VIDEO_ID = "dQw4w9WgXcQ";

const rickAstleyDemoLabel: VideoNutritionLabel = {
  video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  analysis_mode: "demo_fallback",
  notice: "Demo rating shown because the live AI service is unavailable.",
  scores: {
    learning: 0,
    usefulness: 1,
    mind_impact: 7,
    quality: 8,
    personal_relevance: 3,
    time_worth: 6,
    scroll_risk: 4,
  },
  explanations: {
    learning: "This entertainment-focused music video does not aim to teach new information.",
    usefulness: "The video offers enjoyment but little that can be applied in everyday life.",
    mind_impact: "Its upbeat music and playful reputation may leave many viewers feeling amused.",
    quality: "The video is a professionally produced and clearly presented pop-music performance.",
    personal_relevance: "It has limited connection to a general adult user's digital wellbeing goals.",
    time_worth: "It can be worthwhile as brief entertainment, depending on the viewer's taste.",
    scroll_risk: "Its meme appeal may encourage related viewing, but the video has a natural ending.",
  },
};

export function getDevelopmentDemoLabel(videoUrl?: string) {
  const platformDemo = findDemoVideo(videoUrl);
  if (platformDemo) {
    return { ...platformDemo.label, video_url: videoUrl ?? platformDemo.video_url };
  }

  if (process.env.NODE_ENV === "production") return null;
  if (videoUrl?.includes(RICK_ASTLEY_VIDEO_ID)) return rickAstleyDemoLabel;
  return null;
}
