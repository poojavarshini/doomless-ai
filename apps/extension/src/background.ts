import { nutritionAnalysisSchema, type HistoryRecord, type ReelMetadata } from "@doomless/shared-types";
import { chromeApi } from "./chrome";
import { buildMetadataFallback, hasMeaningfulMetadata } from "./fallback";
import { buildDemoAnalysis } from "./demo";
import { getCached, getSettings, saveAnalysis } from "./storage";

type AnalyzeMessage = { type: "ANALYZE_REEL"; metadata: ReelMetadata; force?: boolean };
type ActionMessage = { type: "REEL_ACTION"; reelId: string; action: HistoryRecord["userAction"] };
const pending = new Map<string, Promise<unknown>>();

chromeApi.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  const data = message as {
    type?: AnalyzeMessage["type"] | ActionMessage["type"];
    metadata?: ReelMetadata;
    force?: boolean;
    reelId?: string;
    action?: HistoryRecord["userAction"];
  };
  if (data.type === "ANALYZE_REEL" && data.metadata) {
    analyze(data.metadata, Boolean(data.force)).then(sendResponse).catch((error: unknown) => {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "Analysis failed." });
    });
    return true;
  }
  if (data.type === "REEL_ACTION" && data.reelId && data.action) {
    updateAction(data.reelId, data.action).then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function analyze(metadata: ReelMetadata, force = false) {
  const settings = await getSettings();
  const cached = force ? null : await getCached(metadata.reelId, settings.demoMode);
  if (cached) return { ok: true, analysis: cached, cached: true };
  const existing = pending.get(metadata.reelId);
  if (existing) return existing;

  const request = performAnalysis(metadata).finally(() => pending.delete(metadata.reelId));
  pending.set(metadata.reelId, request);
  return request;
}

async function performAnalysis(metadata: ReelMetadata) {
  const settings = await getSettings();
  if (!settings.enabled) return { ok: false, error: "Enable analysis in DoomLess settings first." };
  if (metadata.isPrivate) return { ok: false, error: "Use Analyze explicitly for private content; automatic analysis is disabled." };
  if (settings.demoMode) {
    const demo = buildDemoAnalysis(metadata, settings.preferences);
    await saveAnalysis({ reelId: metadata.reelId, metadata: { ...metadata, source: "demo" }, analysis: demo, analyzedAt: new Date().toISOString() });
    return { ok: true, analysis: demo, cached: false, demo: true };
  }
  if (!hasMeaningfulMetadata(metadata)) {
    const surfaceEstimate = buildMetadataFallback(metadata, settings.preferences, "Only the visible Reel surface was available.");
    await saveAnalysis({ reelId: metadata.reelId, metadata, analysis: surfaceEstimate, analyzedAt: new Date().toISOString() });
    return { ok: true, analysis: surfaceEstimate, cached: false, fallback: true, surfaceOnly: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${settings.apiBaseUrl.replace(/\/$/, "")}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata, preferences: settings.preferences, demoMode: false }),
      signal: controller.signal,
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      const errorBody = body as { error?: string };
      throw new Error(errorBody.error ?? `Analysis failed (${response.status}).`);
    }
    const parsed = nutritionAnalysisSchema.safeParse(body);
    if (!parsed.success) throw new Error("The analysis response was invalid. Please retry.");
    await saveAnalysis({ reelId: metadata.reelId, metadata, analysis: parsed.data, analyzedAt: new Date().toISOString() });
    return { ok: true, analysis: parsed.data, cached: false };
  } catch (error) {
    console.warn("DoomLess live analysis unavailable; using local nutrition scorer.", error);
    const stale = await getCached(metadata.reelId);
    if (stale) return { ok: true, analysis: stale, cached: true, stale: true };
    const fallback = buildMetadataFallback(metadata, settings.preferences, "Live analysis unavailable.");
    await saveAnalysis({ reelId: metadata.reelId, metadata, analysis: fallback, analyzedAt: new Date().toISOString() });
    return { ok: true, analysis: fallback, cached: false, fallback: true };
  } finally {
    clearTimeout(timeout);
  }
}

async function updateAction(reelId: string, action: HistoryRecord["userAction"]) {
  const stored = await chromeApi.storage.local.get("history");
  const history = ((stored.history as HistoryRecord[] | undefined) ?? []).map((record) =>
    record.reelId === reelId ? { ...record, userAction: action } : record,
  );
  await chromeApi.storage.local.set({ history });
}
