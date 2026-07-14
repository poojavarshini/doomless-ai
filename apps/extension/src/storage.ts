import type { HistoryRecord, NutritionAnalysis, UserPreferences } from "@doomless/shared-types";
import { chromeApi } from "./chrome";

export interface ExtensionSettings {
  enabled: boolean;
  analyzeVisible: boolean;
  analyzeOnHover: boolean;
  localHistoryOnly: boolean;
  apiBaseUrl: string;
  preferences: UserPreferences;
}

export const defaultSettings: ExtensionSettings = {
  enabled: false,
  analyzeVisible: false,
  analyzeOnHover: true,
  localHistoryOnly: true,
  apiBaseUrl: "http://localhost:3000",
  preferences: {
    interests: ["artificial intelligence", "technology"],
    professionalField: "",
    learningGoals: [],
    topicsToAvoid: [],
    maximumDailyReelMinutes: 20,
    educationBalance: 70,
  },
};

export async function getSettings(): Promise<ExtensionSettings> {
  const stored = await chromeApi.storage.local.get("settings");
  return { ...defaultSettings, ...(stored.settings as Partial<ExtensionSettings> | undefined) };
}

export async function getCached(reelId: string): Promise<NutritionAnalysis | null> {
  const key = cacheKey(reelId);
  const stored = await chromeApi.storage.local.get(key);
  return (stored[key] as NutritionAnalysis | undefined) ?? null;
}

export async function saveAnalysis(record: HistoryRecord): Promise<void> {
  const { history } = await chromeApi.storage.local.get("history");
  const records = (history as HistoryRecord[] | undefined) ?? [];
  const next = mergeHistory(records, record);
  await chromeApi.storage.local.set({ [cacheKey(record.reelId)]: record.analysis, history: next });
}

export const cacheKey = (reelId: string) => `cache:${reelId}`;
export const mergeHistory = (records: HistoryRecord[], record: HistoryRecord) =>
  [record, ...records.filter((item) => item.reelId !== record.reelId)].slice(0, 500);
