"use client";

import { FormEvent, useRef, useState } from "react";
import { NutritionLabel } from "@/components/NutritionLabel";
import type { VideoNutritionLabel } from "@/lib/nutrition";

type InputMode = "url" | "transcript";

const sampleLinks = [
  { platform: "Instagram Reel", title: "Positive Dance Break", url: "https://www.instagram.com/reel/DawLVAitqec/?igsh=NTc4MTIwNjQ2YQ==" },
  { platform: "Instagram Reel", title: "Active Recall", url: "https://www.instagram.com/reel/DLDEMO0002/" },
  { platform: "Instagram Reel", title: "Useful but Long", url: "https://www.instagram.com/reel/DLDEMO0003/" },
  { platform: "YouTube Short", title: "Clickbait Reveal", url: "https://www.youtube.com/shorts/DLDEMO0004" },
  { platform: "YouTube Short", title: "Emotional Pressure", url: "https://www.youtube.com/shorts/DLDEMO0005" },
  { platform: "YouTube Short", title: "Repetitive Loop", url: "https://www.youtube.com/shorts/DLDEMO0006" },
] as const;

const productivityKpis = [
  {
    label: "Focus time reclaimed",
    measure: "Minutes saved each week by avoiding low-value viewing.",
    direction: "Increase",
  },
  {
    label: "High-value watch rate",
    measure: "Videos intentionally watched with a WATCH or WATCH FOR FUN decision.",
    direction: "Increase",
  },
  {
    label: "Goal-aligned viewing",
    measure: "Videos with Personal Relevance of 70 or higher.",
    direction: "Increase",
  },
  {
    label: "Scroll-risk exposure",
    measure: "Videos watched with Addiction Risk or Clickbait Risk above 70.",
    direction: "Reduce",
  },
  {
    label: "Intentional session rate",
    measure: "Viewing sessions that end when the user planned.",
    direction: "Increase",
  },
] as const;

export default function Home() {
  const [mode, setMode] = useState<InputMode>("url");
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

  async function analyzeSample(videoUrl: string) {
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
      <header className="overflow-hidden rounded-[2rem] bg-emerald-950 px-6 py-7 text-white shadow-2xl shadow-emerald-950/15 sm:px-10 sm:py-10">
        <nav className="flex flex-wrap items-center justify-between gap-4" aria-label="Primary navigation">
          <a href="#top" className="flex items-center gap-3 font-semibold">
            <img src="/doomless-ai-icon-128.png" alt="" className="size-11 rounded-xl" />
            <span>DoomLess AI</span>
          </a>
          <div className="flex items-center gap-2 text-sm">
            <a href="/score-guide" className="rounded-full px-4 py-2 text-emerald-100 hover:bg-white/10">Score guide</a>
            <a href="#samples" className="rounded-full px-4 py-2 text-emerald-100 hover:bg-white/10">Try samples</a>
            <a href="#beta" className="rounded-full bg-white px-4 py-2 font-semibold text-emerald-950 hover:bg-emerald-100">Get beta</a>
          </div>
        </nav>

        <div id="top" className="mt-12 grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <span className="inline-flex rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-200">
              Chrome beta · MVP launch
            </span>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Know what your feed is feeding you.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-emerald-100/80">
              DoomLess AI adds a Digital Nutrition Label to Instagram Reels so you can see overall value, seven nutrition scores, and attention risks before you keep watching.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/doomless-ai-beta-v0.4.2.zip" download className="rounded-2xl bg-emerald-300 px-5 py-3 font-semibold text-emerald-950 transition hover:bg-emerald-200">
                Download Chrome beta
              </a>
              <a href="#samples" className="rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                Try sample nutrition labels
              </a>
            </div>
            <p className="mt-3 text-xs text-emerald-100/60">Desktop Chrome · One ZIP download · Privacy-first defaults</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Example decision</p>
            <div className="mt-4 flex items-end justify-between"><strong className="text-5xl">72</strong><span className="rounded-full bg-emerald-300/15 px-3 py-1 text-sm text-emerald-200">Useful</span></div>
            <p className="mt-4 font-semibold">Learning · Worth saving</p>
            <p className="mt-2 text-sm leading-6 text-emerald-100/70">A clear takeaway with moderate attention cost and low clickbait risk.</p>
          </div>
        </div>
      </header>

      <section id="beta" className="mt-10 rounded-3xl border border-emerald-900/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Beta installation</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">One download. Three Chrome steps.</h2>
            <ol className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["1", "Download & unzip", "Keep the DoomLess AI folder somewhere permanent."],
                ["2", "Open Extensions", "Visit chrome://extensions and enable Developer mode."],
                ["3", "Load unpacked", "Select the unzipped folder, then reload Instagram Reels."],
              ].map(([number, title, description]) => (
                <li key={number} className="rounded-2xl bg-slate-50 p-4">
                  <span className="grid size-8 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">{number}</span>
                  <h3 className="mt-3 font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-slate-500">A true one-click install will follow Chrome Web Store review. This beta package lets testers try the working MVP now without pretending store installation is already available.</p>
          </div>
          <aside className="rounded-3xl bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Become a beta tester</p>
            <h3 className="mt-2 text-xl font-semibold">Test real Instagram Reels</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Try the score, seven nutrition metrics, category, and plain-language verdict. Report what felt clear—or confusing.</p>
            <a href="https://github.com/poojavarshini/doomless-ai/issues/new?title=DoomLess%20AI%20beta%20feedback" target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Send beta feedback</a>
          </aside>
        </div>
      </section>

      <section id="demo" className="mt-10 grid scroll-mt-6 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_24rem_18rem]">
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

          {mode === "url" && (
            <div id="samples" className="mt-5 scroll-mt-6 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-950">Try a sample Reel or Short</p>
                  <p className="mt-0.5 text-xs text-emerald-800/65">No extension required · Demo dataset</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-emerald-800">{sampleLinks.length} samples</span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {sampleLinks.map((sample) => (
                  <button
                    key={sample.url}
                    type="button"
                    disabled={loading}
                    onClick={() => void analyzeSample(sample.url)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-emerald-900/10 bg-white px-3 py-2.5 text-left transition hover:border-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-slate-800">{sample.title}</span>
                    <span className="shrink-0 text-[0.62rem] font-semibold uppercase tracking-wide text-emerald-700">{sample.platform === "Instagram Reel" ? "Reel" : "Short"}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">Selecting a sample loads its clearly labeled nutrition data below. The website does not download the platform video.</p>
            </div>
          )}

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

    </main>
  );
}
