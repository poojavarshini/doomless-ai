import {
  calculateOverallScore,
  CATEGORY_GUIDE_CONFIG,
  getCategoryInterpretation,
  getKpiConclusion,
  getScoreBand,
} from "@doomless/scoring";
import Link from "next/link";
import { scoreKeys, type VideoNutritionLabel } from "@/lib/nutrition";

export interface NutritionLabelProps { label: VideoNutritionLabel; title?: string; compact?: boolean }

export function NutritionLabel({ label, title = "DoomLess Digital Nutrition Label", compact = false }: NutritionLabelProps) {
  const overallScore = calculateOverallScore(label.categories);
  const band = getScoreBand(overallScore);
  const provisional = label.evidence.analysisMode === "METADATA_ONLY";
  const conclusion = getKpiConclusion(overallScore, label.categories, label.contentClassification.type, provisional);
  const visibleKeys = compact ? (["learningValue", "timeEfficiency", "addictionRisk"] as const) : scoreKeys;

  return (
    <section className="rounded-3xl border border-emerald-900/10 bg-emerald-950 p-5 text-white shadow-xl shadow-emerald-950/10" aria-label={title}>
      <div className="flex items-center gap-3">
        <img src="/doomless-ai-icon-128.png" alt="" className="size-10 rounded-xl" />
        <strong className="text-sm">DoomLess Digital Nutrition</strong>
        <span className="ml-auto text-2xl font-bold">{overallScore}<small className="text-xs text-emerald-100/50">/100</small></span>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">{band.title}</p>
      <p className="mt-1 text-base font-semibold leading-6">{conclusion}</p>
      {!compact && <p className="mt-2 text-xs text-emerald-100/55">Higher Clickbait and Addiction scores mean greater risk.</p>}

      {provisional && !compact ? (
        <div className="mt-4 rounded-2xl border border-amber-200/20 bg-amber-200/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm text-amber-100">Surface score — limited evidence</strong>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.68rem] font-semibold text-amber-100">
              Confidence {label.evidence.confidence}/100
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-amber-50/75">{label.evidence.limitationMessage}</p>
          <p className="mt-2 text-xs font-semibold text-amber-100">Recommendation: analyze more before deciding.</p>
        </div>
      ) : null}

      <div className="mt-5 space-y-3 border-t border-white/10 pt-3">
        {visibleKeys.map((key) => {
          const category = CATEGORY_GUIDE_CONFIG[key];
          const score = label.categories[key].score;
          return (
            <div key={key} className="border-b border-white/8 pb-3 last:border-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{category.label}</span>
                {category.isRisk ? <span className="text-[0.62rem] font-bold uppercase tracking-wide text-rose-300">Risk</span> : null}
                <strong className="ml-auto">{score}</strong>
              </div>
              {!compact && <>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/12"><div className={category.isRisk ? "h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500" : "h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-200"} style={{ width: `${score}%` }} /></div>
                <p className="mt-2 text-xs leading-5 text-emerald-50/70">{getCategoryInterpretation(key, score, provisional)}</p>
              </>}
            </div>
          );
        })}
      </div>
      {!compact && <Link href="/score-guide" className="mt-4 inline-flex text-sm font-semibold text-emerald-300 underline decoration-emerald-300/40 underline-offset-4 hover:text-emerald-200">Understand this score</Link>}
    </section>
  );
}
