import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { HistoryRecord, NutritionAnalysis, ReelMetadata } from "@doomless/shared-types";
import { chromeApi } from "./chrome";
import { extractReelMetadata, findReelContainers } from "./reels";
import { getSettings } from "./storage";

type Status = "idle" | "loading" | "ready" | "error";
interface ApiResult { ok: boolean; analysis?: NutritionAnalysis; error?: string; cached?: boolean }
const mounted = new WeakSet<HTMLElement>();
const cleanup = new Map<HTMLElement, () => void>();
const visibilityObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
      entry.target.dispatchEvent(new CustomEvent("doomless:visible"));
    }
  }
}, { threshold: [0.65] });

function Overlay({ container }: { container: HTMLElement }) {
  const [status, setStatus] = useState<Status>("idle");
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null);
  const [metadata, setMetadata] = useState<ReelMetadata | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const analyze = useCallback(async (explicit = false) => {
    if (status === "loading" || status === "ready") return;
    setStatus("loading"); setError("");
    try {
      const nextMetadata = await extractReelMetadata(container);
      if (nextMetadata.isPrivate && !explicit) { setStatus("idle"); return; }
      setMetadata(nextMetadata);
      const result = await chromeApi.runtime.sendMessage({ type: "ANALYZE_REEL", metadata: nextMetadata }) as ApiResult;
      if (!result.ok || !result.analysis) throw new Error(result.error ?? "Analysis failed.");
      setAnalysis(result.analysis); setStatus("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed."); setStatus("error");
    }
  }, [container, status]);

  async function action(value: HistoryRecord["userAction"]) {
    if (!metadata) return;
    await chromeApi.runtime.sendMessage({ type: "REEL_ACTION", reelId: metadata.reelId, action: value });
    if (value === "SKIP") container.scrollIntoView({ behavior: "smooth", block: "end" });
  }

  useEffect(() => {
    const listener = () => void analyze(false);
    container.addEventListener("doomless:analyze", listener);
    return () => container.removeEventListener("doomless:analyze", listener);
  }, [analyze, container]);

  return <div className={`dl-card ${expanded ? "dl-expanded" : ""}`} aria-live="polite">
    <div className="dl-head">
      <span className="dl-brand">DoomLess</span>
      {analysis && <strong className="dl-score" aria-label={`DoomLess score ${analysis.overallScore} out of 100`}>{analysis.overallScore}</strong>}
      <button className="dl-icon" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? "Collapse nutrition label" : "Expand nutrition label"}>{expanded ? "−" : "+"}</button>
    </div>
    {status === "idle" && <button className="dl-primary" onClick={() => void analyze(true)}>Analyze Reel</button>}
    {status === "loading" && <p className="dl-state"><span className="dl-spinner" /> Reading available metadata…</p>}
    {status === "error" && <><p className="dl-error">{error}</p><button className="dl-primary" onClick={() => void analyze(true)}>Retry</button></>}
    {analysis && <>
      <div className="dl-summary"><b>{analysis.recommendation}</b><span>Attention: {analysis.attentionCost.label}</span><span>{analysis.confidence}% confidence</span></div>
      {expanded && <div className="dl-details">
        <p>{analysis.summary}</p>
        <p className="dl-evidence">{analysis.analysisSource === "partial" ? "This score is based mainly on the Reel caption and visible metadata." : `Source: ${analysis.analysisSource}`}</p>
        {Object.entries(analysis.categories).map(([key, category]) => <div className="dl-category" key={key}>
          <div><span>{labelFor(key)}</span><b>{category.score}</b></div><progress max="100" value={category.score} /><small>{category.reason}</small>
        </div>)}
        <div className="dl-attention">Costs ~{Math.round(analysis.attentionCost.estimatedTotalSeconds)}s; useful value ~{Math.round(analysis.attentionCost.estimatedUsefulSeconds)}s.</div>
        <details><summary>Why this score?</summary><p><b>Strongest positive:</b> {analysis.positiveSignals[0] ?? "No strong positive signal available."}</p><p><b>Strongest warning:</b> {analysis.warningSignals[0] ?? "No strong warning signal available."}</p><p><b>Missing:</b> {analysis.missingInformation.join(", ") || "Nothing material reported."}</p></details>
        <div className="dl-actions">
          <button onClick={() => void action("WATCH")}>Watch</button><button onClick={() => void action("SKIP")}>Skip</button><button onClick={() => void action("SAVE")}>Save useful</button><button onClick={() => void action("SHOW_LESS")}>Show less</button><button onClick={() => void action("REPLACE")}>Replace</button>
        </div>
      </div>}
    </>}
  </div>;
}

function labelFor(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

function mount(container: HTMLElement) {
  if (mounted.has(container)) return;
  mounted.add(container);
  if (getComputedStyle(container).position === "static") container.style.position = "relative";
  const host = document.createElement("div"); host.dataset.doomlessOverlay = "true";
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style"); style.textContent = overlayCss; shadow.append(style);
  const rootElement = document.createElement("div"); shadow.append(rootElement); container.append(host);
  const root = createRoot(rootElement); root.render(<Overlay container={container} />);
  const requestAnalysis = () => container.dispatchEvent(new CustomEvent("doomless:analyze"));
  const visible = () => { void getSettings().then((settings) => { if (settings.enabled && settings.analyzeVisible) requestAnalysis(); }); };
  let hoverTimer: number | undefined;
  const enter = () => { hoverTimer = window.setTimeout(() => { void getSettings().then((settings) => { if (settings.enabled && settings.analyzeOnHover) requestAnalysis(); }); }, 800); };
  const leave = () => window.clearTimeout(hoverTimer);
  container.addEventListener("doomless:visible", visible); container.addEventListener("mouseenter", enter); container.addEventListener("mouseleave", leave);
  visibilityObserver.observe(container);
  cleanup.set(container, () => { visibilityObserver.unobserve(container); container.removeEventListener("doomless:visible", visible); container.removeEventListener("mouseenter", enter); container.removeEventListener("mouseleave", leave); root.unmount(); host.remove(); });
}

function scan(root: ParentNode = document) { findReelContainers(root).forEach(mount); }
scan();
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) for (const node of Array.from(mutation.addedNodes)) if (node instanceof HTMLElement) scan(node);
  for (const [container, dispose] of cleanup) if (!container.isConnected) { dispose(); cleanup.delete(container); }
});
observer.observe(document.documentElement, { childList: true, subtree: true });

const overlayCss = `
:host{all:initial}.dl-card{position:absolute;z-index:2147483000;top:12px;right:12px;width:250px;padding:12px;border:1px solid rgba(255,255,255,.22);border-radius:16px;background:rgba(8,20,18,.94);color:#f8fafc;font:13px/1.4 ui-sans-serif,system-ui;box-shadow:0 16px 48px rgba(0,0,0,.35);backdrop-filter:blur(14px)}.dl-expanded{width:min(380px,calc(100% - 24px));max-height:calc(100% - 24px);overflow:auto}.dl-head,.dl-summary,.dl-category>div,.dl-actions{display:flex;align-items:center;gap:8px}.dl-head{justify-content:space-between}.dl-brand{font-weight:800;letter-spacing:.04em;color:#86efac}.dl-score{font-size:22px;margin-left:auto}.dl-icon,.dl-card button{border:1px solid rgba(255,255,255,.18);border-radius:9px;background:#18342d;color:#fff;padding:6px 9px;cursor:pointer}.dl-card button:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}.dl-primary{width:100%;margin-top:10px;font-weight:700}.dl-summary{margin-top:9px;flex-wrap:wrap;font-size:11px}.dl-summary b{color:#86efac}.dl-details>p{margin:10px 0}.dl-evidence,.dl-error{border-radius:9px;padding:8px;background:#172c27;color:#d1fae5}.dl-error{background:#4c1d24;color:#fecdd3}.dl-category{margin:10px 0}.dl-category>div{justify-content:space-between}.dl-category progress{width:100%;height:6px;accent-color:#4ade80}.dl-category small{display:block;color:#cbd5e1}.dl-attention{padding:8px;border-left:3px solid #fbbf24;background:#2a2719}.dl-actions{margin-top:10px;flex-wrap:wrap}.dl-state{display:flex;align-items:center;gap:8px}.dl-spinner{width:12px;height:12px;border:2px solid #86efac;border-right-color:transparent;border-radius:50%;animation:spin .7s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}summary{cursor:pointer;margin-top:10px;font-weight:700}details p{margin:6px 0;color:#dbeafe}
`;
