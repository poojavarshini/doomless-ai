"use client";

import { FormEvent, useRef, useState } from "react";
import { DemoReelCard } from "@/components/DemoReelCard";
import { NutritionLabel } from "@/components/NutritionLabel";
import { demoVideos } from "@/lib/demo-videos";
import type { VideoNutritionLabel } from "@/lib/nutrition";

type InputMode = "url" | "transcript";

const categoryOrder = ["Entertainment", "Learning", "Productivity", "News", "Scroll bait"] as const;

const categoryCopy: Record<(typeof categoryOrder)[number], string> = {
  Entertainment: "Light, expressive content for enjoyment and a quick mood shift.",
  Learning: "Short explanations designed to leave you knowing something new.",
  Productivity: "Practical ideas that can support focus, planning, and follow-through.",
  News: "Brief updates with context, without turning the feed into a news spiral.",
  "Scroll bait": "High-stimulation examples that demonstrate stronger attention hooks.",
};

const productivityKpis = [
  {
    label: "Focus time reclaimed",
    measure: "Minutes saved each week by avoiding low-value viewing.",
    direction: "Increase",
  },
  {
    label: "High-value watch rate",
    measure: "Videos watched with a Time Worth score of 7 or higher.",
    direction: "Increase",
  },
  {
    label: "Goal-aligned viewing",
    measure: "Videos with a Personal Relevance score of 7 or higher.",
    direction: "Increase",
  },
  {
    label: "Scroll-risk exposure",
    measure: "Videos watched with a Scroll Risk score above 6.",
    direction: "Reduce",
  },
  {
    label: "Intentional session rate",
    measure: "Viewing sessions that end when the user planned.",
    direction: "Increase",
  },
] as const;

export default function Home() {
  const [mode, setMode] = useState<InputMode>("transcript");
  const [value, setValue] = useState("");
  const [label, setLabel] = useState<VideoNutritionLabel | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await analyzeVideo(mode === "url" ? { videoUrl: value } : { transcript: value });
  }

  async function analyzeVideo(payload: { videoUrl: string } | { transcript: string }) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Analysis failed.");
      }

      setLabel(data as VideoNutritionLabel);
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  async function analyzeDemo(videoUrl: string) {
    setMode("url");
    setValue(videoUrl);
    await analyzeVideo({ videoUrl });
  }

  function changeMode(nextMode: InputMode) {
    setMode(nextMode);
    setValue("");
    setError("");
  }

  return (
    <main className="mx-auto min-h-screen max-w-[90rem] px-5 py-10 sm:px-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          DoomLess AI
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
          Know what your feed is feeding you.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Paste a transcript or video link to get a clear, neutral view of its value,
          mind impact, and scroll risk.
        </p>
      </header>

      <section className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_24rem_18rem]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="inline-flex rounded-full bg-slate-100 p-1" aria-label="Input type">
            {(["transcript", "url"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => changeMode(option)}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                  mode === option ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                }`}
              >
                {option === "url" ? "Video URL" : option}
              </button>
            ))}
          </div>

          <label htmlFor="content" className="mt-6 block text-sm font-semibold">
            {mode === "url" ? "Short-form video URL" : "Video transcript"}
          </label>
          {mode === "url" ? (
            <input
              id="content"
              type="url"
              required
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="https://www.youtube.com/shorts/..."
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          ) : (
            <textarea
              id="content"
              required
              rows={10}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Paste the spoken transcript here..."
              className="mt-2 w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          )}

          <p className="mt-2 text-sm text-slate-500">
            {mode === "url"
              ? "URL-only scores may be limited when the video's transcript is not publicly available."
              : "For the most useful label, include the full spoken content."}
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

        <aside
          aria-labelledby="productivity-kpis-title"
          className="rounded-3xl border border-emerald-900/10 bg-emerald-950 p-5 text-white shadow-xl shadow-emerald-950/10 lg:col-span-2 xl:sticky xl:top-6 xl:col-span-1"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Why use DoomLess AI
          </p>
          <h2 id="productivity-kpis-title" className="mt-2 text-2xl font-semibold tracking-tight">
            5 productivity KPIs
          </h2>
          <p className="mt-2 text-sm leading-6 text-emerald-100/75">
            Turn healthier feed choices into outcomes you can measure over time.
          </p>

          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-1">
            {productivityKpis.map((kpi, index) => (
              <li key={kpi.label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-emerald-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${
                      kpi.direction === "Reduce"
                        ? "bg-amber-300/15 text-amber-200"
                        : "bg-emerald-300/15 text-emerald-200"
                    }`}
                  >
                    {kpi.direction}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold leading-5">{kpi.label}</h3>
                <p className="mt-1 text-xs leading-5 text-emerald-100/70">{kpi.measure}</p>
              </li>
            ))}
          </ol>

          <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-emerald-100/60">
            These are suggested measures, not promised results. Your progress stays in your control.
          </p>
        </aside>
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
