import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { HistoryRecord } from "@doomless/shared-types";
import { chromeApi } from "./chrome";
import { getSettings, type ExtensionSettings } from "./storage";
import "./ui.css";

function Popup() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  useEffect(() => { void Promise.all([getSettings(), chromeApi.storage.local.get("history")]).then(([next, stored]) => { setSettings(next); setHistory((stored.history as HistoryRecord[] | undefined) ?? []); }); }, []);
  const today = new Date().toDateString();
  const todays = useMemo(() => history.filter((item) => new Date(item.analyzedAt).toDateString() === today), [history, today]);
  const average = todays.length ? Math.round(todays.reduce((sum, item) => sum + item.analysis.overallScore, 0) / todays.length) : 0;
  const savedSeconds = todays.filter((item) => item.userAction === "SKIP").reduce((sum, item) => sum + item.analysis.attentionCost.estimatedTotalSeconds, 0);

  async function toggle() {
    if (!settings) return;
    const next = { ...settings, enabled: !settings.enabled };
    await chromeApi.storage.local.set({ settings: next }); setSettings(next);
  }

  return <main className="panel popup">
    <header><div><span className="eyebrow">DoomLess</span><h1>Today’s nutrition</h1></div><button className={settings?.enabled ? "toggle on" : "toggle"} onClick={() => void toggle()} aria-pressed={settings?.enabled}>{settings?.enabled ? "On" : "Off"}</button></header>
    {!settings?.enabled && <p className="notice">Analysis is privacy-off by default. Turn it on when you want DoomLess to read supported Reel metadata.</p>}
    <section className="stats"><article><b>{todays.length}</b><span>Analyzed</span></article><article><b>{average}</b><span>Avg score</span></article><article><b>{Math.round(savedSeconds / 60)}m</b><span>Attention saved*</span></article></section>
    <p className="fine">*Estimate based on skipped Reel duration.</p>
    <h2>Recent labels</h2>
    <div className="history">{history.slice(0, 4).map((item) => <article key={item.reelId}><div><b>{item.metadata.creator}</b><span>{item.analysis.contentType}</span></div><strong>{item.analysis.overallScore}</strong></article>)}{history.length === 0 && <p className="empty">Analyze a Reel to start your local dashboard.</p>}</div>
    <button className="primary" onClick={() => void chromeApi.runtime.openOptionsPage()}>Preferences & privacy</button>
  </main>;
}

createRoot(document.getElementById("root")!).render(<Popup />);
