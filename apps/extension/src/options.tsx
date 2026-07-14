import { FormEvent, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { chromeApi } from "./chrome";
import { defaultSettings, getSettings, type ExtensionSettings } from "./storage";
import "./ui.css";

const choices = ["artificial intelligence", "health", "finance", "parenting", "technology", "cooking", "fitness", "career growth", "entertainment", "travel"];

function Options() {
  const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  useEffect(() => { void getSettings().then(setSettings); }, []);
  function update<K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) { setSettings((current) => ({ ...current, [key]: value })); setSaved(false); }
  function submit(event: FormEvent) { event.preventDefault(); void chromeApi.storage.local.set({ settings }).then(() => setSaved(true)); }
  function toggleInterest(value: string) { const set = new Set(settings.preferences.interests); if (set.has(value)) set.delete(value); else set.add(value); update("preferences", { ...settings.preferences, interests: [...set] }); }

  return <main className="panel options"><span className="eyebrow">DoomLess</span><h1>Preferences & privacy</h1><p className="lede">Personal relevance changes with you. Intrinsic quality and behavioral-risk scores do not.</p>
    <form onSubmit={submit}>
      <section><h2>Analysis controls</h2><label className="check"><input type="checkbox" checked={settings.enabled} onChange={(event) => update("enabled", event.target.checked)} /> Enable Reel analysis</label><label className="check"><input type="checkbox" checked={settings.analyzeOnHover} onChange={(event) => update("analyzeOnHover", event.target.checked)} /> Analyze after an 800ms hover</label><label className="check"><input type="checkbox" checked={settings.analyzeVisible} onChange={(event) => update("analyzeVisible", event.target.checked)} /> Analyze the active visible Reel</label><label>Backend URL<input value={settings.apiBaseUrl} onChange={(event) => update("apiBaseUrl", event.target.value)} /></label></section>
      <section><h2>Your interests</h2><div className="chips">{choices.map((choice) => <button className={settings.preferences.interests.includes(choice) ? "chip selected" : "chip"} type="button" aria-pressed={settings.preferences.interests.includes(choice)} onClick={() => toggleInterest(choice)} key={choice}>{choice}</button>)}</div><label>Professional field<input value={settings.preferences.professionalField} onChange={(event) => update("preferences", { ...settings.preferences, professionalField: event.target.value })} /></label><label>Maximum daily Reel time<input type="number" min="1" max="240" value={settings.preferences.maximumDailyReelMinutes} onChange={(event) => update("preferences", { ...settings.preferences, maximumDailyReelMinutes: Number(event.target.value) })} /></label><label>Education balance: {settings.preferences.educationBalance}%<input type="range" min="0" max="100" value={settings.preferences.educationBalance} onChange={(event) => update("preferences", { ...settings.preferences, educationBalance: Number(event.target.value) })} /></label></section>
      <section><h2>Privacy notice</h2><p>DoomLess reads only supported Reel caption, visible text, accessibility labels, creator, duration, and displayed engagement metadata. It does not read passwords or private messages. Data is sent only after analysis is enabled or you press Analyze. History and preferences stay in Chrome storage on this device.</p><label className="check"><input type="checkbox" checked={settings.localHistoryOnly} onChange={(event) => update("localHistoryOnly", event.target.checked)} /> Keep history local only</label><button className="danger" type="button" onClick={() => void chromeApi.storage.local.clear().then(() => setSettings(defaultSettings))}>Delete all DoomLess data</button></section>
      <button className="primary" type="submit">Save settings</button>{saved && <span role="status" className="saved">Saved</span>}
    </form>
  </main>;
}

createRoot(document.getElementById("root")!).render(<Options />);
