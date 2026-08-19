import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { IncidentForm } from "./components/IncidentForm";
import { ReportViewer } from "./components/ReportViewer";
import { IncidentHistory } from "./components/IncidentHistory";
import { TicketModal } from "./components/TicketModal";
import {
  IncidentInput,
  IncidentAnalysisRecord,
} from "./types";
import { parseMarkdownReport } from "./lib/parser";
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
      try {
        localStorage.setItem("soc_sentinel_incident_history", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save history", e);
      }
      return updated;
    });
  };

  const updateActiveRecord = (updatedRecord: IncidentAnalysisRecord) => {
    setActiveRecord(updatedRecord);
    saveRecordToHistory(updatedRecord);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao conectar com o motor de análise SOC.");
      }

      const rawMarkdown = data.report;
      const parsedData = parseMarkdownReport(rawMarkdown);

      const baseRecord: IncidentAnalysisRecord = {
        id: `inc-${Date.now()}`,
        createdAt: data.timestamp || new Date().toISOString(),
        input,
        rawMarkdown,
        parsedData,
        status: "Novo",
        actions: parsedData.immediateActions,
      };

      const record: IncidentAnalysisRecord = {
        ...baseRecord,
        riskScore: calculateRiskScore(baseRecord),
      };

      setActiveRecord(record);
      saveRecordToHistory(record);
    } catch (err: any) {
      console.error("Error analyzing incident:", err);
      setError(err.message || "Não foi possível concluir a análise do incidente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-900 selection:text-cyan-100">
      <Header
        totalAnalyzed={history.length}
        onOpenHistory={() => setShowHistoryModal(true)}
        onNewIncident={() => {
          setActiveRecord(null);
          setError(null);
        }}
      />

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
          <IncidentForm onSubmit={handleAnalyzeIncident} isLoading={isLoading} />
        ) : (
          <ReportViewer
            record={activeRecord}
            onUpdateRecord={updateActiveRecord}
            onOpenTicketModal={() => setShowTicketModal(true)}
            onNewIncident={() => setActiveRecord(null)}
          />
        )}
      </main>

      {showHistoryModal && (
        <IncidentHistory
          history={history}
          onSelectRecord={(rec) => {
            setActiveRecord(rec);
            setShowHistoryModal(false);
          }}
          onClearHistory={handleClearHistory}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {showTicketModal && activeRecord && (
        <TicketModal
          record={activeRecord}
          onClose={() => setShowTicketModal(false)}
        />
      )}

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
