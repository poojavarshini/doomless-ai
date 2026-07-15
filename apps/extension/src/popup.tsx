import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { nutritionAnalysisSchema, type HistoryRecord } from "@doomless/shared-types";
import { chromeApi } from "./chrome";
import { getSettings, type ExtensionSettings } from "./storage";
import "./ui.css";
import "./brand.css";

function Popup() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<{ lastSeenAt?: string; reelContainersDetected?: number } | null>(null);
  const [openedAt] = useState(() => Date.now());
  useEffect(() => {
    void Promise.all([getSettings(), chromeApi.storage.local.get(["history", "runtimeStatus"])]).then(([next, stored]) => {
      const records = ((stored.history as HistoryRecord[] | undefined) ?? []).filter((record) => nutritionAnalysisSchema.safeParse(record.analysis).success);
      setSettings(next); setHistory(records); setRuntimeStatus((stored.runtimeStatus as typeof runtimeStatus) ?? null);
    });
  }, []);
  const today = new Date().toDateString();
  const todays = useMemo(() => history.filter((item) => new Date(item.analyzedAt).toDateString() === today), [history, today]);
  const average = mean(todays.map((item) => item.analysis.overallScore));
  const useful = todays.filter((item) => ["WATCH", "WATCH_FOR_FUN", "SAVE_FOR_LATER"].includes(item.analysis.recommendation.action)).length;
  const lowValue = todays.filter((item) => item.analysis.recommendation.action === "SKIP").length;
  const savedSeconds = todays.reduce((sum, item) => sum + (item.userAction === "SKIP" ? item.analysis.attentionReturn.estimatedTotalSeconds : item.userAction === "SHOW_LESS" ? item.analysis.attentionReturn.estimatedFillerSeconds : 0), 0);
  const usefulSeconds = todays.filter((item) => item.userAction === "WATCH").reduce((sum, item) => sum + item.analysis.attentionReturn.estimatedUsefulSeconds, 0);
  const clickbaitExposure = todays.filter((item) => item.analysis.categories.clickbaitRisk.score >= 70).length;
  const addictionExposure = todays.filter((item) => item.analysis.categories.addictionRisk.score >= 70).length;
  const sevenDays = history.filter((item) => openedAt - new Date(item.analyzedAt).getTime() <= 7 * 86_400_000);
  const topType = mostCommon(todays.map((item) => item.analysis.contentClassification.label));

  async function toggle() {
    if (!settings) return;
    const next = { ...settings, enabled: !settings.enabled };
    await chromeApi.storage.local.set({ settings: next }); setSettings(next);
  }

  return <main className="panel popup">
    <header><div className="brand-lockup"><img src="/icons/icon-48.png" alt="" /><div><span className="eyebrow">DoomLess AI</span><h1>Attention dashboard</h1></div></div><button className={settings?.enabled ? "toggle on" : "toggle"} onClick={() => void toggle()} aria-pressed={settings?.enabled}>{settings?.enabled ? "On" : "Off"}</button></header>
    {settings?.demoMode && <p className="demo-banner"><b>Demo mode</b> · Labels are simulated beta examples.</p>}
    {!settings?.enabled && <p className="notice">Analysis is privacy-off by default. Turn it on when you want DoomLess to read supported Reel metadata.</p>}
    <p className="detector">Instagram detector: {runtimeStatus?.lastSeenAt ? `active · ${runtimeStatus.reelContainersDetected ?? 0} Reel container(s) seen` : "not seen yet — reload an Instagram Reel tab after installing or updating"}</p>
    <section className="stats dashboard-stats"><article><b>{todays.length}</b><span>Analyzed today</span></article><article><b>{average}</b><span>Average score</span></article><article><b>{useful}/{lowValue}</b><span>Useful / skip</span></article><article><b>{formatSeconds(savedSeconds)}</b><span>Attention saved*</span></article><article><b>{formatSeconds(usefulSeconds)}</b><span>Useful consumed*</span></article><article><b>{mean(sevenDays.map((item) => item.analysis.overallScore))}</b><span>7-day score</span></article></section>
    <p className="fine">*Transparent estimate from Reel duration, useful/filler ratio, and your recorded action—not a scientific measurement.</p>
    <section className="exposure"><div><span>Top content</span><b>{topType || "No data"}</b></div><div><span>High clickbait exposure</span><b>{clickbaitExposure}</b></div><div><span>High addiction-risk exposure</span><b>{addictionExposure}</b></div></section>
    <h2>Recent decisions</h2>
    <div className="history">{history.slice(0, 5).map((item) => <article key={`${item.reelId}-${item.analyzedAt}`}><div><b>{item.metadata.creator}</b><span>{item.analysis.contentClassification.label} · {item.analysis.recommendation.headline}</span></div><strong>{item.analysis.overallScore}</strong></article>)}{history.length === 0 && <p className="empty">Analyze a Reel or enable demo mode to start your local dashboard.</p>}</div>
    <a className="score-guide-link" href="https://doomless-ai-demo.poojavarshini1995.chatgpt.site/score-guide" target="_blank" rel="noreferrer">Understand your DoomLess score</a>
    <button className="primary" onClick={() => void chromeApi.runtime.openOptionsPage()}>Preferences, demo & privacy</button>
  </main>;
}

function mean(values: number[]) { return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0; }
function formatSeconds(seconds: number) { return seconds >= 60 ? `${Math.round(seconds / 60)}m` : `${Math.round(seconds)}s`; }
function mostCommon(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

createRoot(document.getElementById("root")!).render(<Popup />);
