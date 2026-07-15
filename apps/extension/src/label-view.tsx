import type { NutritionLabelResult } from "./compact";
import { CATEGORY_NAMES, CATEGORY_ORDER, scoreLabelText } from "./compact";

interface NutritionPanelProps {
  label: NutritionLabelResult;
  expanded: boolean;
  logoUrl: string;
  loading?: boolean;
  onToggle: () => void;
}

export function NutritionPanel({ label, expanded, logoUrl, loading = false, onToggle }: NutritionPanelProps) {
  const score = label.overallScore;
  const limited = !loading && score == null;
  const tone = score == null ? "limited" : score >= 70 ? "positive" : score >= 40 ? "mixed" : "low";
  const scoreLabel = loading ? "ANALYZING REEL" : scoreLabelText(label.scoreLabel);
  const conclusion = loading ? "Creating a nutrition label from available Reel signals." : label.conclusion;

  return (
    <section
      className={`dl-card ${expanded ? "" : "dl-collapsed"} ${limited ? "dl-limited" : ""}`}
      data-tone={tone}
      aria-label="DoomLess Digital Nutrition Label"
      aria-live="polite"
    >
      <div className="dl-head">
        <img className="dl-logo" src={logoUrl} alt="" />
        <span className="dl-brand">DoomLess AI</span>
        <strong className="dl-score" aria-label={score == null ? "DoomLess score unavailable" : `DoomLess score ${score} out of 100`}>
          {score ?? "--"}<small>/100</small>
        </strong>
        {!loading && !limited ? (
          <button
            className="dl-toggle"
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse Digital Nutrition details" : "Expand Digital Nutrition details"}
          >
            {expanded ? "\u2212" : "+"}
          </button>
        ) : null}
      </div>
      <p className="dl-value-label">{scoreLabel}</p>
      <p className="dl-conclusion">{conclusion}</p>
      {!loading ? <p className="dl-evidence-note">{label.evidenceNote}</p> : null}
      {!loading ? (
        <a
          className="dl-guide-link"
          href="https://doomless-ai-demo.poojavarshini1995.chatgpt.site/score-guide"
          target="_blank"
          rel="noreferrer"
        >
          What does this score mean?
        </a>
      ) : null}

      {expanded && label.categories ? (
        <div className="dl-nutrition">
          <h2 className="dl-nutrition-head">Digital Nutrition</h2>
          <p className="dl-risk-note">Higher Clickbait and Addiction scores mean greater risk.</p>
          {CATEGORY_ORDER.map((key) => {
            const metric = label.categories?.[key];
            if (!metric) return null;
            return (
              <div className="dl-metric" data-risk={metric.isRisk ? "true" : "false"} key={key}>
                <div className="dl-metric-row">
                  <span className="dl-metric-name">{CATEGORY_NAMES[key]}</span>
                  {metric.isRisk ? <span className="dl-risk-tag">RISK</span> : null}
                  <span className="dl-metric-score">{metric.score}</span>
                </div>
                <div
                  className="dl-track"
                  role="progressbar"
                  aria-label={CATEGORY_NAMES[key]}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={metric.score}
                >
                  <div className="dl-fill" style={{ width: `${metric.score}%` }} />
                </div>
                <p className="dl-interpretation">{metric.interpretation}</p>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
