import { IncidentAnalysisRecord } from "../types";
import { isSupabaseConfigured, supabase } from "./supabase";

const LEGACY_LOCAL_KEY = "soc_sentinel_incident_history";
const storageKey = (scope = "local") => `soc_sentinel_incident_history:${scope}`;

export function loadLocalHistory(scope = "local"): IncidentAnalysisRecord[] {
  try {
    const scoped = localStorage.getItem(storageKey(scope));
    if (scoped) return JSON.parse(scoped);

    if (scope === "local") {
      const legacy = localStorage.getItem(LEGACY_LOCAL_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        localStorage.setItem(storageKey(scope), legacy);
        localStorage.removeItem(LEGACY_LOCAL_KEY);
        return parsed;
      }
    }

    return [];
  } catch {
    return [];
  }
}

export function saveLocalHistory(records: IncidentAnalysisRecord[], scope = "local") {
  localStorage.setItem(storageKey(scope), JSON.stringify(records));
}

export function clearLocalHistory(scope = "local") {
  localStorage.removeItem(storageKey(scope));
  if (scope === "local") localStorage.removeItem(LEGACY_LOCAL_KEY);
}

export async function loadCloudHistory(userId: string): Promise<IncidentAnalysisRecord[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("incidents")
    .select("payload")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => row.payload as IncidentAnalysisRecord);
}

export async function upsertCloudRecord(userId: string, record: IncidentAnalysisRecord) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("incidents").upsert(
    {
      id: record.id,
      user_id: userId,
      status: record.status || "Novo",
      priority: record.parsedData.priority,
      severity: record.parsedData.severity,
      created_at: record.createdAt,
      updated_at: new Date().toISOString(),
      payload: record,
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function deleteCloudHistory(userId: string) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from("incidents").delete().eq("user_id", userId);
  if (error) throw error;
}
