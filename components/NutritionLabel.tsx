import {
  categoryMeta,
  scoreKeys,
  type ScoreKey,
  type VideoNutritionLabel,
} from "@/lib/nutrition";

export interface NutritionLabelProps {
  label: VideoNutritionLabel;
  title?: string;
  compact?: boolean;
}

function scoreTone(key: ScoreKey, value: number) {
  const positiveValue = key === "scroll_risk" ? 10 - value : value;
  if (positiveValue >= 7) return "bg-emerald-100 text-emerald-900";
  if (positiveValue >= 4) return "bg-amber-100 text-amber-900";
  return "bg-rose-100 text-rose-900";
}

export function NutritionLabel({
  label,
  title = "DoomLess nutrition label",
  compact = false,
}: NutritionLabelProps) {
  const visibleKeys = compact
    ? (["mind_impact", "time_worth", "scroll_risk"] as ScoreKey[])
    : scoreKeys;

  return (
    <section className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm" aria-label={title}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
            DoomLess AI
          </p>
          <h2 className="mt-1 text-xl font-semibold">{title}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
          0–10
        </span>
      </div>

      {label.notice && (
        <p className="mb-4 rounded-2xl bg-sky-50 p-3 text-sm leading-5 text-sky-900">
          {label.notice}
        </p>
      )}

      <div className="space-y-3">
        {visibleKeys.map((key) => {
          const meta = categoryMeta[key];
          const value = label.scores[key];

          return (
            <div key={key} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  <span className="mr-2 text-slate-500" aria-hidden="true">{meta.icon}</span>
                  {meta.label}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-sm font-bold ${scoreTone(key, value)}`}>
                  {value}/10
                </span>
              </div>
              {!compact && (
                <>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-700"
                      style={{ width: `${value * 10}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-600">
                    {label.explanations[key]}
                  </p>
                </>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Scores are estimates, not judgments. Scroll Risk is the only score where lower is better.
      </p>
    </section>
  );
}
