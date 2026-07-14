import { nutritionAnalysisSchema, type HistoryRecord, type ReelMetadata } from "@doomless/shared-types";
import { chromeApi } from "./chrome";
import { getCached, getSettings, saveAnalysis } from "./storage";

type AnalyzeMessage = { type: "ANALYZE_REEL"; metadata: ReelMetadata };
type ActionMessage = { type: "REEL_ACTION"; reelId: string; action: HistoryRecord["userAction"] };
const pending = new Map<string, Promise<unknown>>();

chromeApi.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  const data = message as {
    type?: AnalyzeMessage["type"] | ActionMessage["type"];
    metadata?: ReelMetadata;
    reelId?: string;
    action?: HistoryRecord["userAction"];
  };
  if (data.type === "ANALYZE_REEL" && data.metadata) {
    analyze(data.metadata).then(sendResponse).catch((error: unknown) => {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "Analysis failed." });
    });
    return true;
  }
  if (data.type === "REEL_ACTION" && data.reelId && data.action) {
    updateAction(data.reelId, data.action).then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function analyze(metadata: ReelMetadata) {
  const cached = await getCached(metadata.reelId);
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
    const stale = await getCached(metadata.reelId);
    if (stale) return { ok: true, analysis: stale, cached: true, stale: true };
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, error: "Analysis timed out. Retry when your connection is stable." };
    }
    return { ok: false, error: error instanceof Error ? error.message : "You appear to be offline." };
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
