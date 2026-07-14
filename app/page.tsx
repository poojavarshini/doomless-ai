"use client";

import { FormEvent, useRef, useState } from "react";
import { DemoReelCard } from "@/components/DemoReelCard";
import { NutritionLabel } from "@/components/NutritionLabel";
import { demoVideos, findDemoVideo } from "@/lib/demo-videos";
import type { VideoNutritionLabel } from "@/lib/nutrition";

const categoryOrder = ["Entertainment", "Learning", "Productivity", "News", "Scroll bait"] as const;

const categoryCopy: Record<(typeof categoryOrder)[number], string> = {
  Entertainment: "Light, expressive content for enjoyment and a quick mood shift.",
  Learning: "Short explanations designed to leave you knowing something new.",
  Productivity: "Practical ideas that can support focus, planning, and follow-through.",
  News: "Brief updates with context, without turning the feed into a news spiral.",
  "Scroll bait": "High-stimulation examples that demonstrate stronger attention hooks.",
};

export default function Home() {
  const [value, setValue] = useState("");
  const [label, setLabel] = useState<VideoNutritionLabel | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    analyzeVideo(value);
  }

  function analyzeVideo(videoUrl: string) {
    setLoading(true);
    setError("");

    const demo = findDemoVideo(videoUrl);
    if (!demo) {
      setLabel(null);
      setError("This privacy-safe demo supports the 10 sample videos shown below.");
      setLoading(false);
      return;
    }

    setLabel({ ...demo.label, video_url: videoUrl });
    setLoading(false);
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  function analyzeDemo(videoUrl: string) {
    setValue(videoUrl);
    analyzeVideo(videoUrl);
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 sm:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          DoomLess AI
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
          Know what your feed is feeding you.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Choose one of the sample video links to see a clear, neutral view of its
          value, mind impact, and scroll risk.
        </p>
      </header>

      <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <label htmlFor="content" className="block text-sm font-semibold">
            Sample video URL
          </label>
          <input
            id="content"
            type="url"
            required
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Select a demo below or paste its sample URL"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />

          <p className="mt-2 text-sm text-slate-500">
            Ratings load locally from the curated demo dataset; no API key is used.
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Building your label…" : "Analyze video"}
          </button>
        </form>

        <div ref={resultRef} className="scroll-mt-6">
          {label ? (
            <NutritionLabel label={label} />
          ) : (
            <div className="flex min-h-80 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
              <div>
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-xl text-emerald-800">◎</div>
                <h2 className="mt-4 font-semibold">Your label will appear here</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  A clearer choice, without judgment or guilt.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Multi-platform demo feed</p>
            <h2 className="mt-1 text-3xl font-semibold">5 Reels + 5 Shorts</h2>
          </div>
          <p className="max-w-sm text-right text-sm text-slate-500">
            Animated simulations for product testing—pause any video or open its full label.
          </p>
        </div>

        <div className="mt-9 space-y-12">
          {categoryOrder.map((category) => {
            const categoryVideos = demoVideos.filter((video) => video.topic === category);

            return (
              <section key={category} aria-labelledby={`category-${category.replace(" ", "-").toLowerCase()}`}>
                <div className="mb-4 flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
                  <div>
                    <h3 id={`category-${category.replace(" ", "-").toLowerCase()}`} className="text-xl font-semibold">
                      {category}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">{categoryCopy[category]}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                    {categoryVideos.length} {categoryVideos.length === 1 ? "video" : "videos"}
                  </span>
                </div>

                <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5">
                  {categoryVideos.map((video) => (
                    <DemoReelCard
                      key={video.video_url}
                      video={video}
                      index={demoVideos.indexOf(video)}
                      disabled={loading}
                      onAnalyze={analyzeDemo}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
