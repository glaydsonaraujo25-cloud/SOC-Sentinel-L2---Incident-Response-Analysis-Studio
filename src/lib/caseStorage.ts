import { IncidentAnalysisRecord } from "../types";
import { isSupabaseConfigured, supabase } from "./supabase";

const LOCAL_KEY = "soc_sentinel_incident_history";

export function loadLocalHistory(): IncidentAnalysisRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalHistory(records: IncidentAnalysisRecord[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(records));
}

export function clearLocalHistory() {
  localStorage.removeItem(LOCAL_KEY);
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
