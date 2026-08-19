import React, { useState } from "react";
import { IncidentAnalysisRecord, ActionItem, IncidentStatus } from "../types";
import { exportIncidentIocsCsv, exportIncidentJson, exportIncidentPdf } from "../lib/exporters";
import {
  ShieldAlert,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Ticket,
  FileText,
  Terminal,
  Crosshair,
  CheckSquare,
  ShieldCheck,
  Info,
  Clock,
  Layers,
  Activity,
  Workflow,
  Braces,
  Table2,
  BadgeCheck,
  BadgeAlert,
  Printer,
} from "lucide-react";

interface ReportViewerProps {
  record: IncidentAnalysisRecord;
  onUpdateRecord: (record: IncidentAnalysisRecord) => void;
  onOpenTicketModal: () => void;
  onNewIncident: () => void;
}

const INCIDENT_STATUSES: IncidentStatus[] = ["Novo", "Triagem", "Investigando", "Contido", "Erradicado", "Recuperado", "Fechado"];
type Tab = "report" | "iocs" | "mitre" | "checklist";

export const ReportViewer: React.FC<ReportViewerProps> = ({ record, onUpdateRecord, onOpenTicketModal, onNewIncident }) => {
  const [activeTab, setActiveTab] = useState<Tab>("report");
  const [copied, setCopied] = useState(false);
  const [copiedIoc, setCopiedIoc] = useState<string | null>(null);
  const actions = record.actions || record.parsedData.immediateActions;
  const completedCount = actions.filter((a) => a.completed).length;
  const completionPercent = actions.length ? Math.round((completedCount / actions.length) * 100) : 0;

  const toggleAction = (id: string) => {
    const updatedActions: ActionItem[] = actions.map((item) => item.id === id ? { ...item, completed: !item.completed } : item);
    onUpdateRecord({ ...record, actions: updatedActions });
  };

  const handleStatusChange = (status: IncidentStatus) => onUpdateRecord({ ...record, status });

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(record.rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyIoc = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedIoc(value);
    setTimeout(() => setCopiedIoc(null), 1500);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([record.rawMarkdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SOC-Relatorio-${record.parsedData.priority}-${record.id.substring(0, 6)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const priorityColorMap: Record<string, { bg: string; text: string; border: string }> = {
    P1: { bg: "bg-red-950/90", text: "text-red-400", border: "border-red-600" },
    P2: { bg: "bg-orange-950/90", text: "text-orange-400", border: "border-orange-600" },
    P3: { bg: "bg-amber-950/90", text: "text-amber-400", border: "border-amber-600" },
    P4: { bg: "bg-emerald-950/90", text: "text-emerald-400", border: "border-emerald-600" },
  };
  const prioCfg = priorityColorMap[record.parsedData.priority] || priorityColorMap.P2;

  const renderFormattedMarkdown = (markdown: string) => {
    const sections = markdown.split(/(?=##\s+)/);
    return (
      <div className="space-y-6">
        {sections.map((sectionText, idx) => {
          const trimmed = sectionText.trim();
          if (!trimmed) return null;
          const matchHeader = trimmed.match(/^##\s+([^\n]+)/);
          const headerTitle = matchHeader ? matchHeader[1].trim() : "";
          const bodyText = matchHeader ? trimmed.replace(/^##\s+[^\n]+\n/, "").trim() : trimmed;
          let headerIcon = <FileText className="w-5 h-5 text-cyan-400" />;
          let headerBg = "bg-slate-900 border-slate-800";
          const lower = headerTitle.toLowerCase();
          if (lower.includes("resumo")) headerIcon = <Info className="w-5 h-5 text-cyan-400" />;
          else if (lower.includes("classificação")) headerIcon = <Layers className="w-5 h-5 text-blue-400" />;
          else if (lower.includes("indicadores")) headerIcon = <Crosshair className="w-5 h-5 text-amber-400" />;
          else if (lower.includes("possível ataque")) headerIcon = <AlertTriangle className="w-5 h-5 text-red-400" />;
          else if (lower.includes("impacto")) headerIcon = <ShieldAlert className="w-5 h-5 text-orange-400" />;
          else if (lower.includes("ações imediatas")) { headerIcon = <CheckSquare className="w-5 h-5 text-emerald-400" />; headerBg = "bg-emerald-950/20 border-emerald-900/50"; }
          else if (lower.includes("investigação")) headerIcon = <Terminal className="w-5 h-5 text-purple-400" />;
          else if (lower.includes("recomendações")) headerIcon = <ShieldCheck className="w-5 h-5 text-teal-400" />;
          else if (lower.includes("mitre")) headerIcon = <Crosshair className="w-5 h-5 text-cyan-400" />;
          else if (lower.includes("prioridade")) { headerIcon = <AlertTriangle className="w-5 h-5 text-red-500" />; headerBg = "bg-red-950/20 border-red-900/50"; }

          return (
            <div key={idx} className={`border rounded-xl p-5 ${headerBg} shadow-md`}>
              {headerTitle && <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800/80 mb-4">{headerIcon}<h3 className="font-mono font-bold text-base text-slate-100">## {headerTitle}</h3></div>}
              <div className="text-slate-300 text-sm leading-relaxed space-y-2">
                {bodyText.split("\n\n").map((para, pIdx) => {
                  const pTrim = para.trim();
                  if (!pTrim) return null;
                  if (pTrim.includes("\n- ") || pTrim.startsWith("- ") || pTrim.startsWith("* ") || /^\d+\.\s/.test(pTrim)) {
                    return <ul key={pIdx} className="space-y-2 my-2">{pTrim.split("\n").map((line, lIdx) => {
                      const lClean = line.replace(/^[-*•\d+.]+\s*/, "").trim();
                      return lClean ? <li key={lIdx} className="flex items-start gap-2"><span className="text-cyan-400 font-bold">•</span><span>{lClean}</span></li> : null;
                    })}</ul>;
                  }
                  return <p key={pIdx}>{pTrim}</p>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase border ${prioCfg.bg} ${prioCfg.text} ${prioCfg.border}`}>PRIORIDADE: {record.parsedData.priority}</span>
              <span className="px-3 py-1 rounded-md text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">Severidade: {record.parsedData.severity}</span>
              <span className="px-3 py-1 rounded-md text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">Ativo: {record.input.criticidade}</span>
              <span className="px-3 py-1 rounded-md text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">{record.parsedData.category}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Análise de Incidente: {record.input.tipo}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-cyan-400" /><span>Gerado em: {new Date(record.createdAt).toLocaleString("pt-BR")}</span></div>
              <div className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span>IA como apoio • valide as evidências</span></div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={handleCopyMarkdown} className="tool-btn">{copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}<span>{copied ? "Copiado!" : "Markdown"}</span></button>
            <button onClick={handleDownloadMarkdown} className="tool-btn"><Download className="w-4 h-4 text-cyan-400" /><span>.MD</span></button>
            <button onClick={() => exportIncidentPdf(record)} className="tool-btn"><Printer className="w-4 h-4 text-cyan-400" /><span>PDF</span></button>
            <button onClick={() => exportIncidentJson(record)} className="tool-btn"><Braces className="w-4 h-4 text-cyan-400" /><span>JSON</span></button>
            <button onClick={() => exportIncidentIocsCsv(record)} disabled={record.parsedData.iocs.length === 0} className="tool-btn disabled:opacity-40"><Table2 className="w-4 h-4 text-cyan-400" /><span>CSV IOCs</span></button>
            <button onClick={onOpenTicketModal} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-xs font-semibold"><Ticket className="w-4 h-4" /><span>Ticket</span></button>
            <button onClick={onNewIncident} className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 hover:border-cyan-700">Novo incidente</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs uppercase font-mono text-slate-400 mb-2"><Activity className="w-4 h-4 text-cyan-400" /> SOC Risk Score</div>
          <div className="flex items-end gap-2"><span className="text-4xl font-bold text-slate-100">{record.riskScore ?? 0}</span><span className="text-sm text-slate-500 mb-1">/ 100</span></div>
          <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-500" style={{ width: `${record.riskScore ?? 0}%` }} /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs uppercase font-mono text-slate-400 mb-3"><Workflow className="w-4 h-4 text-cyan-400" /> Status do incidente</div>
          <select value={record.status || "Novo"} onChange={(e) => handleStatusChange(e.target.value as IncidentStatus)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100">{INCIDENT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs uppercase font-mono text-slate-400 mb-2">Progresso de contenção</div>
          <div className="flex items-end gap-2"><span className="text-4xl font-bold text-slate-100">{completionPercent}%</span><span className="text-xs text-slate-500 mb-1">{completedCount}/{actions.length} ações</span></div>
          <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${completionPercent}%` }} /></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[["report", "Relatório"], ["iocs", `IOCs (${record.parsedData.iocs.length})`], ["mitre", `MITRE (${record.parsedData.mitreTechniques.length})`], ["checklist", `Checklist (${completedCount}/${actions.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key as Tab)} className={`px-4 py-2 rounded-lg text-xs font-medium ${activeTab === key ? "bg-cyan-950 text-cyan-300 border border-cyan-800" : "bg-slate-900 text-slate-400 border border-slate-800"}`}>{label}</button>
        ))}
      </div>

      {activeTab === "report" && renderFormattedMarkdown(record.rawMarkdown)}

      {activeTab === "iocs" && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">Validação local verifica apenas o formato sintático. Reputação, geolocalização e histórico externo não são consultados automaticamente.</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {record.parsedData.iocs.length === 0 ? <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm text-slate-400">Nenhum IOC confiável foi extraído.</div> : record.parsedData.iocs.map((ioc, index) => (
              <button key={`${ioc.type}-${ioc.value}-${index}`} onClick={() => handleCopyIoc(ioc.value)} className="text-left bg-slate-900 border border-slate-800 hover:border-cyan-800 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="text-[10px] font-mono uppercase text-cyan-400">{ioc.type}</span>{ioc.validFormat === false ? <BadgeAlert className="w-4 h-4 text-amber-400" /> : <BadgeCheck className="w-4 h-4 text-emerald-400" />}</div><span className="text-[10px] text-slate-500">{copiedIoc === ioc.value ? "Copiado" : "Clique para copiar"}</span></div>
                <code className="block mt-2 break-all text-xs text-slate-200">{ioc.value}</code>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono"><span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400">Confiança: {ioc.confidence || "N/D"}</span><span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-400">Origem: {ioc.source || "Legado"}</span><span className={`px-2 py-1 rounded border ${ioc.validFormat === false ? "bg-amber-950/40 border-amber-900 text-amber-400" : "bg-emerald-950/40 border-emerald-900 text-emerald-400"}`}>{ioc.validFormat === false ? "Revisar formato" : "Formato válido"}</span></div>
                {ioc.notes && <p className="mt-2 text-[11px] text-slate-500">{ioc.notes}</p>}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === "mitre" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {record.parsedData.mitreTechniques.length === 0 ? <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm text-slate-400">Nenhuma técnica MITRE foi identificada com confiança.</div> : record.parsedData.mitreTechniques.map((technique) => <div key={technique.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="flex items-center justify-between gap-3 mb-2"><span className="font-mono text-cyan-400 font-bold">{technique.id}</span><span className="text-[10px] uppercase text-slate-500">{technique.tactic}</span></div><div className="text-sm font-semibold text-slate-100">{technique.name}</div><p className="text-xs text-slate-400 mt-2 leading-relaxed">{technique.description}</p></div>)}
        </div>
      )}

      {activeTab === "checklist" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-bold text-slate-100">Playbook de contenção</h3><p className="text-xs text-slate-500">O progresso é salvo junto com o incidente.</p></div><span className="text-xs font-mono text-emerald-400">{completionPercent}% concluído</span></div>
          {actions.map((action) => <label key={action.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer"><input type="checkbox" checked={action.completed} onChange={() => toggleAction(action.id)} className="mt-1" /><span className={`text-sm ${action.completed ? "line-through text-slate-500" : "text-slate-300"}`}>{action.text}</span></label>)}
        </div>
      )}

      <style>{`.tool-btn{display:flex;align-items:center;gap:.375rem;padding:.5rem .875rem;background:#1e293b;border:1px solid #334155;border-radius:.5rem;color:#e2e8f0;font-size:.75rem;font-weight:500}.tool-btn:hover{background:#334155}`}</style>
    </div>
  );
};
