import { nutritionAnalysisSchema, type HistoryRecord, type NutritionAnalysis, type UserPreferences } from "@doomless/shared-types";
import { chromeApi } from "./chrome";

export interface ExtensionSettings {
  settingsVersion: number;
  enabled: boolean;
  analyzeVisible: boolean;
  analyzeOnHover: boolean;
  localHistoryOnly: boolean;
  demoMode: boolean;
  apiBaseUrl: string;
  preferences: UserPreferences;
}

export const defaultSettings: ExtensionSettings = {
  settingsVersion: 5,
  enabled: false,
  analyzeVisible: true,
  analyzeOnHover: true,
  localHistoryOnly: true,
  demoMode: false,
  apiBaseUrl: "https://doomless-ai-demo.poojavarshini1995.chatgpt.site",
  preferences: {
    interests: ["artificial intelligence", "technology"],
    professionalField: "",
    learningGoals: [],
    topicsToAvoid: [],
    maximumDailyReelMinutes: 20,
    educationBalance: 70,
  },
};

type StoredSettings = Partial<Omit<ExtensionSettings, "preferences">> & {
  preferences?: Partial<UserPreferences>;
};

export function resolveSettings(previous: StoredSettings = {}) {
  const migratedFromLocalhost = previous.settingsVersion == null
    && /^http:\/\/(localhost|127\.0\.0\.1):3000\/?$/i.test(previous.apiBaseUrl ?? "");
  const migratedAnalyzeVisible = previous.enabled === true
    && (previous.settingsVersion ?? 0) < 4
    && previous.analyzeVisible !== true;
  const settings: ExtensionSettings = {
    ...defaultSettings,
    ...previous,
    settingsVersion: defaultSettings.settingsVersion,
    analyzeVisible: migratedAnalyzeVisible ? true : previous.analyzeVisible ?? defaultSettings.analyzeVisible,
    apiBaseUrl: migratedFromLocalhost ? defaultSettings.apiBaseUrl : previous.apiBaseUrl ?? defaultSettings.apiBaseUrl,
    preferences: { ...defaultSettings.preferences, ...previous.preferences },
  };
  return { settings, migratedFromLocalhost, migratedAnalyzeVisible };
}

export async function getSettings(): Promise<ExtensionSettings> {
  const stored = await chromeApi.storage.local.get("settings");
  const { settings, migratedFromLocalhost, migratedAnalyzeVisible } = resolveSettings(stored.settings as StoredSettings | undefined);
  if (migratedFromLocalhost || migratedAnalyzeVisible) await chromeApi.storage.local.set({ settings });
  return settings;
}

export async function getCached(reelId: string, demoMode = false): Promise<NutritionAnalysis | null> {
  const key = cacheKey(reelId, demoMode);
  const stored = await chromeApi.storage.local.get(key);
  const parsed = nutritionAnalysisSchema.safeParse(stored[key]);
  if (parsed.success) return parsed.data;
  if (stored[key]) await chromeApi.storage.local.remove(key);
  return null;
}

export async function saveAnalysis(record: HistoryRecord): Promise<void> {
  const { history } = await chromeApi.storage.local.get("history");
  const records = (history as HistoryRecord[] | undefined) ?? [];
  const next = mergeHistory(records, record);
  const demoMode = record.analysis.evidence.analysisMode === "DEMO";
  await chromeApi.storage.local.set({ [cacheKey(record.reelId, demoMode)]: record.analysis, history: next });
}

export const cacheKey = (reelId: string, demoMode = false) => `cache:v4:${demoMode ? "demo:" : ""}${reelId}`;
export const mergeHistory = (records: HistoryRecord[], record: HistoryRecord) =>
  [record, ...records.filter((item) => item.reelId !== record.reelId)].slice(0, 500);
