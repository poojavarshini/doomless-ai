import { CATEGORY_GUIDE_CONFIG, SCORE_BAND_CONFIG, SCORE_WEIGHTS } from "@doomless/scoring";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Understanding Your DoomLess Score | DoomLess AI",
  description: "Learn what every DoomLess Digital Nutrition score, category, risk metric, and recommendation means.",
};

const categoryOrder = ["learningValue", "actionability", "personalRelevance", "timeEfficiency", "emotionalImpact", "clickbaitRisk", "addictionRisk"] as const;
const interpretationRanges = ["0\u201319", "20\u201339", "40\u201359", "60\u201379", "80\u2013100"] as const;

const examples = [
  {
    title: "Educational Reel",
    score: 91,
    label: "Excellent Digital Value",
    conclusion: "Strongly recommended \u2014 high learning value for your time.",
    scores: [94, 88, 83, 91, 76, 12, 18],
  },
  {
    title: "Entertainment Reel",
    score: 64,
    label: "Mixed Digital Value",
    conclusion: "Watch for fun \u2014 entertaining without strong manipulation.",
    scores: [21, 15, 70, 72, 82, 22, 35],
  },
  {
    title: "Promotional Reel",
    score: 34,
    label: "Digital Junk",
    conclusion: "Skip \u2014 mostly promotion with limited practical value.",
    scores: [24, 38, 47, 33, 58, 64, 52],
  },
] as const;

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 font-semibold text-white">
      <img src="/doomless-ai-icon-128.png" alt="" className="size-11 rounded-xl" />
      <span>DoomLess AI</span>
    </Link>
  );
}

function ScoreRangeCard({ band }: { band: (typeof SCORE_BAND_CONFIG)[number] }) {
  const range = band.minimum == null ? "No score" : `${band.minimum}\u2013${band.maximum}`;
  return (
    <article className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="text-2xl font-bold tracking-tight text-emerald-950">{range}</span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">{band.action}</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold">{band.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{band.explanation}</p>
    </article>
  );
}

function CategoryCard({ categoryKey }: { categoryKey: (typeof categoryOrder)[number] }) {
  const category = CATEGORY_GUIDE_CONFIG[categoryKey];
  return (
    <article className="rounded-3xl border border-white/10 bg-white/7 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{category.label}</h3>
        <span className={category.isRisk ? "rounded-full bg-rose-300/15 px-3 py-1 text-xs font-semibold text-rose-200" : "rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-200"}>
          {category.isRisk ? "Higher = greater risk" : "Higher = more value"}
        </span>
      </div>
      <p className="mt-2 min-h-12 text-sm leading-6 text-emerald-50/70">{category.definition}</p>
      <details className="group mt-4 rounded-2xl border border-white/10 bg-black/10 p-3">
        <summary className="cursor-pointer list-none text-sm font-semibold text-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300">
          View the five score bands <span aria-hidden="true" className="float-right transition group-open:rotate-45">+</span>
        </summary>
        <ol className="mt-3 space-y-2">
          {interpretationRanges.map((range, index) => (
            <li key={range} className="grid grid-cols-[3.5rem_1fr] gap-3 border-t border-white/8 pt-2 text-xs leading-5">
              <strong className={category.isRisk ? "text-rose-200" : "text-emerald-200"}>{range}</strong>
              <span className="text-emerald-50/70">{category.interpretations[index]}</span>
            </li>
          ))}
        </ol>
      </details>
    </article>
  );
}

function FormulaBreakdown() {
  const positive = [
    ["Learning Value", SCORE_WEIGHTS.positive.learningValue],
    ["Actionability", SCORE_WEIGHTS.positive.actionability],
    ["Personal Relevance", SCORE_WEIGHTS.positive.personalRelevance],
    ["Time Efficiency", SCORE_WEIGHTS.positive.timeEfficiency],
    ["Emotional Impact", SCORE_WEIGHTS.positive.emotionalImpact],
  ] as const;
  const risks = [
    ["Clickbait Risk", SCORE_WEIGHTS.risk.clickbaitRisk],
    ["Addiction Risk", SCORE_WEIGHTS.risk.addictionRisk],
  ] as const;
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-3xl bg-emerald-50 p-5">
        <h3 className="font-semibold text-emerald-950">Value ingredients</h3>
        <div className="mt-4 space-y-3">
          {positive.map(([label, weight]) => <WeightBar key={label} label={label} weight={weight} risk={false} />)}
        </div>
      </div>
      <div className="rounded-3xl bg-rose-50 p-5">
        <h3 className="font-semibold text-rose-950">Risk penalties</h3>
        <div className="mt-4 space-y-3">
          {risks.map(([label, weight]) => <WeightBar key={label} label={label} weight={weight} risk />)}
        </div>
        <p className="mt-5 text-sm leading-6 text-rose-900/70">Risk scores lower the total rather than adding value.</p>
      </div>
    </div>
  );
}

function WeightBar({ label, weight, risk }: { label: string; weight: number; risk: boolean }) {
  const percent = Math.round(weight * 100);
  return (
    <div>
      <div className="flex justify-between gap-4 text-sm"><span>{label}</span><strong>{percent}%</strong></div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white">
        <div className={risk ? "h-full rounded-full bg-rose-500" : "h-full rounded-full bg-emerald-600"} style={{ width: `${percent * 3.3}%` }} />
      </div>
    </div>
  );
}

function ExampleNutritionLabel({ example }: { example: (typeof examples)[number] }) {
  return (
    <article className="rounded-3xl border border-emerald-900/10 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{example.title}</p>
      <div className="mt-3 flex items-end justify-between gap-4"><h3 className="text-lg font-semibold">{example.label}</h3><strong className="text-3xl">{example.score}<small className="text-xs text-slate-400">/100</small></strong></div>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{example.conclusion}</p>
      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
        {categoryOrder.map((key, index) => {
          const category = CATEGORY_GUIDE_CONFIG[key];
          const score = example.scores[index];
          return (
            <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-3 text-xs">
              <span>{category.label}{category.isRisk ? " · risk" : ""}</span>
              <strong className={category.isRisk && score >= 60 ? "text-rose-700" : "text-slate-800"}>{score}</strong>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default function ScoreGuidePage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] text-slate-950">
      <header className="bg-emerald-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
          <nav className="flex flex-wrap items-center justify-between gap-4" aria-label="Score guide navigation">
            <Brand />
            <div className="flex items-center gap-2 text-sm">
              <Link href="/#demo" className="rounded-full px-4 py-2 text-emerald-100 hover:bg-white/10">View demo</Link>
              <Link href="/#beta" className="rounded-full bg-emerald-300 px-4 py-2 font-semibold text-emerald-950 hover:bg-emerald-200">Install DoomLess</Link>
            </div>
          </nav>
          <div className="grid items-center gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Two-minute guide</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">Understand Your Digital Nutrition Score</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-emerald-100/75">DoomLess shows how much value a Reel gives you for the attention it takes.</p>
              <Link href="/#beta" className="mt-7 inline-flex rounded-2xl bg-white px-5 py-3 font-semibold text-emerald-950 hover:bg-emerald-100">Try DoomLess on Instagram Reels</Link>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/8 p-6">
              <div className="flex items-end justify-between gap-4"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Example score</span><strong className="text-5xl">84<small className="text-sm text-emerald-100/50">/100</small></strong></div>
              <p className="mt-5 text-sm font-semibold tracking-wide text-emerald-200">HIGH DIGITAL VALUE</p>
              <p className="mt-2 text-lg font-semibold leading-7">Worth watching \u2014 useful and time-efficient content.</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8" aria-labelledby="score-ranges">
        <p className="text-sm font-semibold text-emerald-700">What the score means</p>
        <h2 id="score-ranges" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">A fast guide from avoid to excellent</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">Higher totals mean more useful, relevant, and time-efficient value after accounting for distraction risks.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{SCORE_BAND_CONFIG.map((band) => <ScoreRangeCard key={band.label} band={band} />)}</div>
      </section>

      <section className="bg-emerald-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <p className="text-sm font-semibold text-emerald-300">The seven categories</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">What goes into your label</h2>
          <p className="mt-3 max-w-3xl leading-7 text-emerald-100/70">Five categories measure value. Two measure risk, where a higher score means greater risk.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{categoryOrder.map((key) => <CategoryCard key={key} categoryKey={key} />)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8" aria-labelledby="formula-title">
        <p className="text-sm font-semibold text-emerald-700">Transparent calculation</p>
        <h2 id="formula-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">How the final score is calculated</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">The final score rewards useful, relevant, and time-efficient content while reducing the score for clickbait and compulsive attention patterns.</p>
        <div className="mt-8"><FormulaBreakdown /></div>
        <p className="mt-4 text-sm text-slate-500">This is a transparent product heuristic, not a scientific or medical measurement.</p>
      </section>

      <section className="border-y border-emerald-900/10 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <p className="text-sm font-semibold text-emerald-700">Example labels</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Different content can provide different value</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">{examples.map((example) => <ExampleNutritionLabel key={example.title} example={example} />)}</div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-16 sm:px-8 lg:grid-cols-2">
        <article className="rounded-3xl bg-emerald-100 p-7">
          <p className="text-sm font-semibold text-emerald-800">Intentional entertainment</p>
          <h2 className="mt-2 text-2xl font-semibold">Entertainment is not automatically bad</h2>
          <p className="mt-3 leading-7 text-emerald-950/70">DoomLess does not treat all non-educational content as bad. Entertainment can still be valuable when it is intentionally chosen, emotionally positive, and low in manipulation.</p>
        </article>
        <article className="rounded-3xl bg-slate-900 p-7 text-white">
          <p className="text-sm font-semibold text-emerald-300">When evidence is limited</p>
          <h2 className="mt-2 text-2xl font-semibold">Cautious when Instagram shares less</h2>
          <p className="mt-3 leading-7 text-slate-300">Instagram may not expose captions, transcripts, subtitles, or video-level data. When meaningful metadata exists, DoomLess creates a cautious provisional score without inventing unseen content.</p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4"><strong>LIMITED ANALYSIS</strong><p className="mt-1 text-sm text-slate-300">Not enough Reel content was available to score.</p></div>
        </article>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="rounded-[2rem] bg-emerald-950 px-6 py-10 text-center text-white sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight">Make your feed work for you.</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-emerald-100/70">See the value, risks, and purpose of a Reel before giving it more of your attention.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/#beta" className="rounded-2xl bg-emerald-300 px-5 py-3 font-semibold text-emerald-950">Install DoomLess</Link><Link href="/#demo" className="rounded-2xl border border-white/20 px-5 py-3 font-semibold">View Demo</Link></div>
        </div>
      </section>
    </main>
  );
}
