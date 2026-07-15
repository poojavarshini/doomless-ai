"use client";

import { useState } from "react";
import { AnimatedReelCanvas } from "@/components/AnimatedReelCanvas";
import type { DemoVideo } from "@/lib/demo-videos";

interface DemoReelCardProps {
  video: DemoVideo;
  index: number;
  disabled?: boolean;
  onAnalyze: (videoUrl: string) => void;
}

const visualThemes: Record<
  DemoVideo["topic"],
  { gradient: string; kicker: string }
> = {
  Learning: {
    gradient: "from-sky-950 via-cyan-700 to-blue-300",
    kicker: "Learn in under a minute",
  },
  Entertainment: {
    gradient: "from-fuchsia-950 via-rose-600 to-orange-300",
    kicker: "A quick mood lift",
  },
  Productivity: {
    gradient: "from-emerald-950 via-teal-700 to-lime-300",
    kicker: "One useful next step",
  },
  News: {
    gradient: "from-slate-950 via-indigo-800 to-sky-400",
    kicker: "The brief, not the spiral",
  },
  "Scroll bait": {
    gradient: "from-violet-950 via-red-700 to-amber-300",
    kicker: "High-stimulation preview",
  },
};

export function DemoReelCard({
  video,
  index,
  disabled = false,
  onAnalyze,
}: DemoReelCardProps) {
  const [playing, setPlaying] = useState(true);
  const theme = visualThemes[video.topic] ?? {
    gradient: "from-emerald-950 via-teal-700 to-sky-300",
    kicker: "See the decision, not just a score",
  };
  const platformLabel = video.platform === "instagram" ? "Instagram Reel" : "YouTube Short";

  return (
    <article
      data-playing={playing}
      className="group w-[17rem] shrink-0 snap-start overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 shadow-xl shadow-slate-900/10"
    >
      <div className={`relative aspect-[9/16] overflow-hidden bg-gradient-to-br ${theme.gradient} text-white`}>
        <AnimatedReelCanvas topic={video.topic} index={index} playing={playing} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-black/20" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-xs">
          <span className="rounded-full border border-white/20 bg-black/20 px-2.5 py-1 font-medium backdrop-blur-md">
            <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-red-400" />
            {platformLabel} · {String(index + 1).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            className="grid size-9 place-items-center rounded-full border border-white/20 bg-black/25 text-sm backdrop-blur-md transition hover:bg-black/45"
            aria-label={`${playing ? "Pause" : "Play"} ${video.video_title}`}
          >
            {playing ? "Ⅱ" : "▶"}
          </button>
        </div>

        <div className="absolute inset-x-0 top-[43%] grid place-items-center text-center">
          <p className="rounded-full bg-black/25 px-3 py-1 text-xs font-medium tracking-wide backdrop-blur-sm">
            {theme.kicker}
          </p>
        </div>

        <div className="absolute right-3 top-[48%] flex flex-col items-center gap-4 text-center text-[10px]">
          <span><span className="grid size-10 place-items-center rounded-full bg-black/30 text-xl backdrop-blur">♡</span>1.2k</span>
          <span><span className="grid size-10 place-items-center rounded-full bg-black/30 text-lg backdrop-blur">○</span>84</span>
          <span><span className="grid size-10 place-items-center rounded-full bg-black/30 text-lg backdrop-blur">↗</span>Share</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 pr-14">
          <span className="inline-flex rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
            {video.topic}
          </span>
          <p className="mt-3 text-xs font-semibold text-white/80">{video.creator_name}</p>
          <h3 className="mt-1 text-xl font-semibold leading-6">{video.video_title}</h3>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/70">{video.description}</p>

          <div className="mt-3 flex gap-1.5 text-[10px] font-semibold">
            <span className="rounded-full bg-white/15 px-2 py-1">Learn {video.label.categories.learningValue.score}</span>
            <span className="rounded-full bg-white/15 px-2 py-1">Mood {video.label.categories.emotionalImpact.score}</span>
            <span className="rounded-full bg-white/15 px-2 py-1">Risk {video.label.categories.addictionRisk.score}</span>
          </div>

          <button
            type="button"
            onClick={() => onAnalyze(video.video_url)}
            disabled={disabled}
            className="mt-4 w-full rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            View nutrition label
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
          <div className="reel-motion reel-progress h-full bg-white" />
        </div>
      </div>
    </article>
  );
}
