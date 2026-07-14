import type { VideoNutritionLabel } from "@/lib/nutrition";

export interface DemoVideo {
  video_url: string;
  platform: "instagram" | "youtube_short";
  video_title: string;
  creator_name: string;
  topic: "Learning" | "Entertainment" | "Productivity" | "News" | "Scroll bait";
  description: string;
  label: VideoNutritionLabel;
}

const demoNotice =
  "Demo rating from the sample dataset; no platform content was downloaded.";

export const demoVideos: DemoVideo[] = [
  {
    video_url: "https://www.instagram.com/reel/DawLVAitqec/",
    platform: "instagram",
    video_title: "Dance Challenge Highlights",
    creator_name: "@rhythmroom.demo",
    topic: "Entertainment",
    description: "A fictional upbeat dance challenge edited as a short, energetic Reel.",
    label: makeLabel(
      [1, 1, 8, 8, 6, 7, 7],
      [
        "The dance performance is designed for entertainment rather than learning.",
        "It offers enjoyment but little practical guidance for everyday life.",
        "The upbeat movement and music may leave viewers feeling energized.",
        "The performance is presented clearly with polished editing.",
        "It may appeal to viewers interested in dance and light entertainment.",
        "The short performance provides a satisfying burst of entertainment.",
        "Fast pacing and challenge-style editing may encourage continued viewing.",
      ],
    ),
  },
  {
    video_url: "https://www.instagram.com/reel/DLDEMO0002/",
    platform: "instagram",
    video_title: "Remember More of What You Read",
    creator_name: "@studyminute.demo",
    topic: "Learning",
    description: "A teacher demonstrates a quick active-recall exercise using a short paragraph.",
    label: makeLabel(
      [9, 9, 8, 8, 8, 9, 2],
      [
        "The Reel clearly teaches a useful active-recall technique.",
        "The exercise can be used immediately during study or reading.",
        "Its constructive tone may support confidence and mental clarity.",
        "The explanation is focused, plausible, and clearly presented.",
        "The topic fits viewers interested in learning and self-improvement.",
        "It delivers a practical technique in very little time.",
        "The self-contained lesson provides a natural stopping point.",
      ],
    ),
  },
  {
    video_url: "https://www.instagram.com/reel/DLDEMO0003/",
    platform: "instagram",
    video_title: "Reset Your Desk in 60 Seconds",
    creator_name: "@calmwork.demo",
    topic: "Productivity",
    description: "A simple desk-reset routine helps viewers prepare for a focused work session.",
    label: makeLabel(
      [5, 9, 8, 8, 8, 9, 3],
      [
        "The Reel introduces a basic organization routine.",
        "The steps are simple enough to apply immediately.",
        "The calm presentation may reduce friction around starting work.",
        "The instructions are coherent and clearly demonstrated.",
        "It is relevant to viewers interested in focus and productivity.",
        "The concise routine provides useful value for its length.",
        "The Reel is self-contained and uses few continuation hooks.",
      ],
    ),
  },
  {
    video_url: "https://www.instagram.com/reel/DLDEMO0004/",
    platform: "instagram",
    video_title: "Three Headlines in One Minute",
    creator_name: "@brieflytoday.demo",
    topic: "News",
    description: "A fictional presenter summarizes three news stories and separates facts from uncertainty.",
    label: makeLabel(
      [8, 6, 6, 8, 7, 8, 5],
      [
        "The summary provides useful context about several current-event topics.",
        "The information may help viewers decide which stories to explore further.",
        "The measured delivery limits unnecessary alarm while covering serious topics.",
        "The presenter distinguishes confirmed information from uncertainty.",
        "General news has moderate relevance to many adult viewers.",
        "The format communicates several useful points efficiently.",
        "Multiple headlines and updates may encourage viewers to keep checking for more.",
      ],
    ),
  },
  {
    video_url: "https://www.instagram.com/reel/DLDEMO0005/",
    platform: "instagram",
    video_title: "Blindfolded Cake Decorating",
    creator_name: "@whiskandgiggle.demo",
    topic: "Entertainment",
    description: "Two friends attempt to decorate a cake blindfolded in a self-contained comedy sketch.",
    label: makeLabel(
      [1, 1, 8, 7, 5, 7, 4],
      [
        "The sketch offers little educational content.",
        "It is intended for amusement rather than practical use.",
        "The playful interaction may leave viewers feeling amused.",
        "The premise and action are easy to understand.",
        "It may suit viewers looking for light comedy.",
        "The short sketch delivers its entertainment payoff clearly.",
        "The video has some suspense but reaches a clear ending.",
      ],
    ),
  },
  {
    video_url: "https://www.youtube.com/shorts/DLDEMO0006",
    platform: "youtube_short",
    video_title: "Wait for the Final Reveal",
    creator_name: "@loopshock.demo",
    topic: "Scroll bait",
    description: "Rapid edits repeatedly delay a promised reveal before looping back to the beginning.",
    label: makeLabel(
      [0, 0, 2, 3, 2, 1, 10],
      [
        "The Short does not provide meaningful new information.",
        "It offers no practical takeaway for the viewer.",
        "Repeated delays may leave viewers frustrated or mentally tired.",
        "The editing is attention-grabbing but the promised payoff is unclear.",
        "The generic reveal has little connection to personal goals.",
        "The video uses time without delivering the promised value.",
        "An unresolved hook, rapid cuts, and looping create very high scroll risk.",
      ],
    ),
  },
  {
    video_url: "https://www.youtube.com/shorts/DLDEMO0007",
    platform: "youtube_short",
    video_title: "The Sunday Planning Method",
    creator_name: "@intentionalweek.demo",
    topic: "Productivity",
    description: "A planner demonstrates how to select three priorities and place them on a calendar.",
    label: makeLabel(
      [8, 10, 8, 8, 9, 9, 3],
      [
        "The Short explains a clear weekly planning method.",
        "The steps can be applied directly to a calendar.",
        "The realistic approach may help viewers feel more organized.",
        "The advice is clear and avoids exaggerated productivity claims.",
        "It strongly matches common planning and productivity goals.",
        "The Short provides an actionable framework efficiently.",
        "It concludes after the method is explained and uses few hooks.",
      ],
    ),
  },
  {
    video_url: "https://www.youtube.com/shorts/DLDEMO0008",
    platform: "youtube_short",
    video_title: "Five Things You Suddenly Need",
    creator_name: "@trendcart.demo",
    topic: "Scroll bait",
    description: "A fast countdown presents novelty products with urgency, quick cuts, and more-part teasers.",
    label: makeLabel(
      [1, 3, 3, 4, 4, 3, 9],
      [
        "The product montage provides very little meaningful learning.",
        "A few products may be useful, but their value is not demonstrated.",
        "Urgent messaging may create pressure rather than clarity.",
        "The presentation is polished but offers limited supporting evidence.",
        "The products have only broad relevance without stated viewer needs.",
        "The rapid list offers limited value relative to its promotional focus.",
        "Countdowns, novelty, and more-part teasers create high scroll risk.",
      ],
    ),
  },
  {
    video_url: "https://www.youtube.com/shorts/DLDEMO0009",
    platform: "youtube_short",
    video_title: "Spot the Misleading Chart",
    creator_name: "@datawithoutdrama.demo",
    topic: "Learning",
    description: "A data analyst shows how a truncated chart axis can exaggerate a small difference.",
    label: makeLabel(
      [10, 9, 9, 9, 8, 10, 2],
      [
        "The Short teaches a concrete way charts can mislead viewers.",
        "The credibility check can be applied whenever viewing a chart.",
        "The calm explanation supports clearer and more confident thinking.",
        "The example is specific, transparent, and well explained.",
        "It is relevant to viewers interested in news and informed decisions.",
        "The Short delivers a valuable media-literacy lesson efficiently.",
        "The complete explanation offers a strong natural stopping point.",
      ],
    ),
  },
  {
    video_url: "https://www.youtube.com/shorts/DLDEMO0010",
    platform: "youtube_short",
    video_title: "A One-Minute Breathing Pause",
    creator_name: "@quietminute.demo",
    topic: "Entertainment",
    description: "A calm visual guides viewers through several slow breaths and ends with a stopping cue.",
    label: makeLabel(
      [3, 8, 9, 8, 8, 9, 1],
      [
        "The Short briefly explains a paced-breathing pattern.",
        "The guided exercise can be followed immediately.",
        "Its slow pacing may support calm and mental reset.",
        "The instructions are clear and avoid unsupported health promises.",
        "It fits viewers interested in digital breaks and wellbeing.",
        "The short exercise provides clear value for the time spent.",
        "Slow pacing and an explicit ending create very low scroll risk.",
      ],
    ),
  },
];

export function findDemoVideo(videoUrl?: string) {
  if (!videoUrl) return null;

  const normalizedInput = normalizeDemoUrl(videoUrl);
  return (
    demoVideos.find(
      (video) => normalizeDemoUrl(video.video_url) === normalizedInput,
    ) ?? null
  );
}

function normalizeDemoUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, "").toLowerCase()}`;
  } catch {
    return value.trim().replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase();
  }
}

function makeLabel(
  values: [number, number, number, number, number, number, number],
  explanations: [string, string, string, string, string, string, string],
): VideoNutritionLabel {
  return {
    analysis_mode: "demo_fallback",
    notice: demoNotice,
    scores: {
      learning: values[0],
      usefulness: values[1],
      mind_impact: values[2],
      quality: values[3],
      personal_relevance: values[4],
      time_worth: values[5],
      scroll_risk: values[6],
    },
    explanations: {
      learning: explanations[0],
      usefulness: explanations[1],
      mind_impact: explanations[2],
      quality: explanations[3],
      personal_relevance: explanations[4],
      time_worth: explanations[5],
      scroll_risk: explanations[6],
    },
  };
}
