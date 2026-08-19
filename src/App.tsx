import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { IncidentForm } from "./components/IncidentForm";
import { ReportViewer } from "./components/ReportViewer";
import { IncidentHistory } from "./components/IncidentHistory";
import { TicketModal } from "./components/TicketModal";
import { SocDashboard } from "./components/SocDashboard";
import { IncidentTimeline } from "./components/IncidentTimeline";
import { PlaybookPanel } from "./components/PlaybookPanel";
import {
  IncidentInput,
  IncidentAnalysisRecord,
  TimelineEvent,
  StructuredIncidentAnalysis,
} from "./types";
import { parseMarkdownReport } from "./lib/parser";
import {
  structuredAnalysisToMarkdown,
  structuredAnalysisToParsedData,
} from "./lib/structuredReport";
import { ShieldAlert, AlertCircle } from "lucide-react";

function calculateRiskScore(record: Omit<IncidentAnalysisRecord, "riskScore">) {
  const criticalityScore: Record<string, number> = {
    "Crítica": 35,
    "Alta": 28,
    "Média": 18,
    "Baixa": 10,
  };
  const severityScore: Record<string, number> = {
    "Crítica": 35,
    "Alta": 28,
    "Média": 18,
    "Baixa": 10,
  };
  const likelihoodScore: Record<string, number> = {
    "Confirmada": 20,
    "Alta": 16,
    "Média": 10,
    "Baixa": 5,
  };

  return Math.min(
    100,
    (criticalityScore[record.input.criticidade] || 10) +
      (severityScore[record.parsedData.severity] || 18) +
      (likelihoodScore[record.parsedData.likelihood] || 10) +
      Math.min(record.parsedData.iocs.length * 2, 10)
  );
}

function getErrorMessage(value: unknown, fallback = "Não foi possível concluir a análise do incidente."): string {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || fallback;

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["error", "message", "detail", "details"]) {
      const candidate = obj[key];
      if (typeof candidate === "string" && candidate.trim()) return candidate;
      if (candidate && typeof candidate === "object") {
        const nested = getErrorMessage(candidate, "");
        if (nested) return nested;
      }
    }
    try { return JSON.stringify(value); } catch { return fallback; }
  }

  return String(value);
}

async function parseApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const rawBody = await response.text();

  if (!rawBody.trim()) return { data: null as any, parseError: "O servidor retornou uma resposta vazia." };

  if (!contentType.includes("application/json")) {
    const preview = rawBody.replace(/\s+/g, " ").slice(0, 180);
    return {
      data: null as any,
      parseError: response.ok
        ? "O servidor retornou uma resposta em formato inesperado."
        : `O servidor retornou um erro não-JSON (${response.status}). ${preview}`,
    };
  }

  try { return { data: JSON.parse(rawBody), parseError: null as string | null }; }
  catch { return { data: null as any, parseError: "O servidor retornou JSON inválido. Recarregue a aplicação e tente novamente." }; }
}

function makeTimelineEvent(stage: string, description: string): TimelineEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    time: new Date().toISOString(),
    stage,
    description,
  };
}

function isStructuredAnalysis(value: unknown): value is StructuredIncidentAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Record<string, any>;
  return Boolean(
    typeof analysis.summary === "string" &&
    analysis.classification &&
    typeof analysis.classification.category === "string" &&
    Array.isArray(analysis.iocs) &&
    Array.isArray(analysis.immediateActions) &&
    Array.isArray(analysis.mitre) &&
    analysis.priority &&
    typeof analysis.priority.level === "string"
  );
}

export default function App() {
  const [history, setHistory] = useState<IncidentAnalysisRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<IncidentAnalysisRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("soc_sentinel_incident_history");
      if (saved) {
        const parsed: IncidentAnalysisRecord[] = JSON.parse(saved);
        const normalized = parsed.map((record) => ({
          ...record,
          status: record.status || "Novo",
          actions: record.actions || record.parsedData.immediateActions,
          riskScore: record.riskScore ?? calculateRiskScore(record),
          analysisFormat: record.analysisFormat || "legacy-markdown",
          timeline:
            record.timeline && record.timeline.length
              ? record.timeline
              : [{
                  id: `evt-${record.id}-created`,
                  time: record.createdAt,
                  stage: record.status || "Novo",
                  description: "Incidente registrado no SOC Sentinel.",
                }],
          playbookCompleted: record.playbookCompleted || [],
        }));
        setHistory(normalized);
      }
    } catch (e) {
      console.error("Failed to load incident history from localStorage", e);
    }
  }, []);

  const saveRecordToHistory = (record: IncidentAnalysisRecord) => {
    setHistory((current) => {
      const updated = [record, ...current.filter((h) => h.id !== record.id)];
      try { localStorage.setItem("soc_sentinel_incident_history", JSON.stringify(updated)); }
      catch (e) { console.error("Failed to save history", e); }
      return updated;
    });
  };

  const updateActiveRecord = (updatedRecord: IncidentAnalysisRecord) => {
    const previous = activeRecord;
    let nextRecord = updatedRecord;

    if (previous && previous.id === updatedRecord.id && previous.status !== updatedRecord.status) {
      const nextStatus = updatedRecord.status || "Novo";
      nextRecord = {
        ...updatedRecord,
        timeline: [
          ...(updatedRecord.timeline || previous.timeline || []),
          makeTimelineEvent(nextStatus, `Status alterado de ${previous.status || "Novo"} para ${nextStatus}.`),
        ],
      };
    }

    setActiveRecord(nextRecord);
    saveRecordToHistory(nextRecord);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setActiveRecord(null);
    localStorage.removeItem("soc_sentinel_incident_history");
  };

  const handleAnalyzeIncident = async (input: IncidentInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-incident", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(input),
      });

      const { data, parseError } = await parseApiResponse(response);
      if (parseError) throw new Error(parseError);
      if (!response.ok) {
        throw new Error(getErrorMessage(data, `Erro HTTP ${response.status} ao conectar com o motor de análise SOC.`));
      }

      const structuredAnalysis = isStructuredAnalysis(data?.analysis) ? data.analysis : undefined;
      const rawMarkdown = structuredAnalysis
        ? (typeof data.report === "string" && data.report.trim()
            ? data.report
            : structuredAnalysisToMarkdown(structuredAnalysis))
        : data?.report;

      if (typeof rawMarkdown !== "string" || !rawMarkdown.trim()) {
        throw new Error(getErrorMessage(data, "A API respondeu sem um relatório válido."));
      }

      const parsedData = structuredAnalysis
        ? structuredAnalysisToParsedData(structuredAnalysis)
        : parseMarkdownReport(rawMarkdown);
      const createdAt = data.timestamp || new Date().toISOString();

      const baseRecord: IncidentAnalysisRecord = {
        id: `inc-${Date.now()}`,
        createdAt,
        input,
        rawMarkdown,
        parsedData,
        structuredAnalysis,
        analysisFormat: structuredAnalysis ? "structured-json" : "legacy-markdown",
        status: "Novo",
        actions: parsedData.immediateActions,
        timeline: [{
          id: `evt-${Date.now()}-created`,
          time: createdAt,
          stage: "Novo",
          description: structuredAnalysis
            ? "Incidente analisado com saída estruturada e registrado no SOC Sentinel."
            : "Incidente analisado em modo legado e registrado no SOC Sentinel.",
        }],
        playbookCompleted: [],
      };

      const record: IncidentAnalysisRecord = { ...baseRecord, riskScore: calculateRiskScore(baseRecord) };
      setActiveRecord(record);
      saveRecordToHistory(record);
    } catch (err: unknown) {
      console.error("Error analyzing incident:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-900 selection:text-cyan-100">
      <Header totalAnalyzed={history.length} onOpenHistory={() => setShowHistoryModal(true)} onNewIncident={() => { setActiveRecord(null); setError(null); }} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="bg-red-950/80 border border-red-800 text-red-200 p-4 rounded-xl flex items-start space-x-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <strong className="font-bold block text-sm mb-0.5">Erro na Análise do Incidente:</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {!activeRecord ? (
          <>
            <SocDashboard history={history} />
            <IncidentForm onSubmit={handleAnalyzeIncident} isLoading={isLoading} />
          </>
        ) : (
          <>
            <ReportViewer record={activeRecord} onUpdateRecord={updateActiveRecord} onOpenTicketModal={() => setShowTicketModal(true)} onNewIncident={() => setActiveRecord(null)} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <IncidentTimeline record={activeRecord} onUpdateRecord={updateActiveRecord} />
              <PlaybookPanel record={activeRecord} onUpdateRecord={updateActiveRecord} />
            </div>
          </>
        )}
      </main>

      {showHistoryModal && (
        <IncidentHistory history={history} onSelectRecord={(rec) => { setActiveRecord(rec); setShowHistoryModal(false); }} onClearHistory={handleClearHistory} onClose={() => setShowHistoryModal(false)} />
      )}

      {showTicketModal && activeRecord && <TicketModal record={activeRecord} onClose={() => setShowTicketModal(false)} />}

      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-cyan-500" />
            <span>SOC Sentinel L2 • AI-Assisted Incident Response & Threat Analysis</span>
          </div>
          <span>IA como apoio à análise • Validação humana recomendada</span>
        </div>
      </footer>
    </div>
  );
}
