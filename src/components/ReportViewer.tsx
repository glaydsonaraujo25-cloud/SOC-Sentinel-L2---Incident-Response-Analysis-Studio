import React, { useState } from "react";
import { IncidentAnalysisRecord, ActionItem, IncidentStatus } from "../types";
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
} from "lucide-react";

interface ReportViewerProps {
  record: IncidentAnalysisRecord;
  onUpdateRecord: (record: IncidentAnalysisRecord) => void;
  onOpenTicketModal: () => void;
  onNewIncident: () => void;
}

const INCIDENT_STATUSES: IncidentStatus[] = [
  "Novo",
  "Triagem",
  "Investigando",
  "Contido",
  "Erradicado",
  "Recuperado",
  "Fechado",
];

export const ReportViewer: React.FC<ReportViewerProps> = ({
  record,
  onUpdateRecord,
  onOpenTicketModal,
  onNewIncident,
}) => {
  const [activeTab, setActiveTab] = useState<"report" | "iocs" | "mitre" | "checklist">("report");
  const [copied, setCopied] = useState(false);
  const [copiedIoc, setCopiedIoc] = useState<string | null>(null);

  const actions = record.actions || record.parsedData.immediateActions;

  const toggleAction = (id: string) => {
    const updatedActions: ActionItem[] = actions.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onUpdateRecord({ ...record, actions: updatedActions });
  };

  const completedCount = actions.filter((a) => a.completed).length;
  const completionPercent = actions.length ? Math.round((completedCount / actions.length) * 100) : 0;

  const handleStatusChange = (status: IncidentStatus) => {
    onUpdateRecord({ ...record, status });
  };

  const handleCopyMarkdown = async () => {
    await navigator.clipboard.writeText(record.rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyIoc = async (val: string) => {
    await navigator.clipboard.writeText(val);
    setCopiedIoc(val);
    setTimeout(() => setCopiedIoc(null), 1500);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([record.rawMarkdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SOC-Relatorio-${record.parsedData.priority}-${record.id.substring(0, 6)}.md`);
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
          const bodyText = matchHeader
            ? trimmed.replace(/^##\s+[^\n]+\n/, "").trim()
            : trimmed;

          let headerIcon = <FileText className="w-5 h-5 text-cyan-400" />;
          let headerBg = "bg-slate-900 border-slate-800";

          if (headerTitle.toLowerCase().includes("resumo")) headerIcon = <Info className="w-5 h-5 text-cyan-400" />;
          else if (headerTitle.toLowerCase().includes("classificação")) headerIcon = <Layers className="w-5 h-5 text-blue-400" />;
          else if (headerTitle.toLowerCase().includes("indicadores")) headerIcon = <Crosshair className="w-5 h-5 text-amber-400" />;
          else if (headerTitle.toLowerCase().includes("possível ataque")) headerIcon = <AlertTriangle className="w-5 h-5 text-red-400" />;
          else if (headerTitle.toLowerCase().includes("impacto")) headerIcon = <ShieldAlert className="w-5 h-5 text-orange-400" />;
          else if (headerTitle.toLowerCase().includes("ações imediatas")) {
            headerIcon = <CheckSquare className="w-5 h-5 text-emerald-400" />;
            headerBg = "bg-emerald-950/20 border-emerald-900/50";
          } else if (headerTitle.toLowerCase().includes("investigação")) headerIcon = <Terminal className="w-5 h-5 text-purple-400" />;
          else if (headerTitle.toLowerCase().includes("recomendações")) headerIcon = <ShieldCheck className="w-5 h-5 text-teal-400" />;
          else if (headerTitle.toLowerCase().includes("mitre")) headerIcon = <Crosshair className="w-5 h-5 text-cyan-400" />;
          else if (headerTitle.toLowerCase().includes("prioridade")) {
            headerIcon = <AlertTriangle className="w-5 h-5 text-red-500" />;
            headerBg = "bg-red-950/20 border-red-900/50";
          }

          return (
            <div key={idx} className={`border rounded-xl p-5 ${headerBg} shadow-md`}>
              {headerTitle && (
                <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800/80 mb-4">
                  {headerIcon}
                  <h3 className="font-mono font-bold text-base text-slate-100 tracking-tight">## {headerTitle}</h3>
                </div>
              )}

              <div className="max-w-none text-slate-300 text-sm leading-relaxed space-y-2 font-sans">
                {bodyText.split("\n\n").map((para, pIdx) => {
                  const pTrim = para.trim();
                  if (!pTrim) return null;

                  if (pTrim.includes("\n- ") || pTrim.startsWith("- ") || pTrim.startsWith("* ") || /^\d+\.\s/.test(pTrim)) {
                    return (
                      <ul key={pIdx} className="space-y-2 my-2">
                        {pTrim.split("\n").map((line, lIdx) => {
                          const lClean = line.replace(/^[-*•\d+.]+\s*/, "").trim();
                          if (!lClean) return null;
                          return (
                            <li key={lIdx} className="flex items-start space-x-2 text-slate-300">
                              <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                              <span>{lClean}</span>
                            </li>
                          );
                        })}
                      </ul>
                    );
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
              <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold uppercase border ${prioCfg.bg} ${prioCfg.text} ${prioCfg.border}`}>
                PRIORIDADE: {record.parsedData.priority}
              </span>
              <span className="px-3 py-1 rounded-md text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Severidade: {record.parsedData.severity}
              </span>
              <span className="px-3 py-1 rounded-md text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Ativo: {record.input.criticidade}
              </span>
              <span className="px-3 py-1 rounded-md text-xs font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                {record.parsedData.category}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-slate-100">Análise de Incidente: {record.input.tipo}</h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
              <div className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gerado em: {new Date(record.createdAt).toLocaleString("pt-BR")}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>IA como apoio • valide as evidências</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={handleCopyMarkdown} className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? "Copiado!" : "Copiar Markdown"}</span>
            </button>
            <button onClick={handleDownloadMarkdown} className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Baixar .MD</span>
            </button>
            <button onClick={onOpenTicketModal} className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-xs font-semibold">
              <Ticket className="w-4 h-4" />
              <span>Gerar Ticket</span>
            </button>
            <button onClick={onNewIncident} className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-300 hover:border-cyan-700">
              Novo incidente
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs uppercase font-mono text-slate-400 mb-2">
            <Activity className="w-4 h-4 text-cyan-400" /> SOC Risk Score
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-slate-100">{record.riskScore ?? 0}</span>
            <span className="text-sm text-slate-500 mb-1">/ 100</span>
          </div>
          <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500" style={{ width: `${record.riskScore ?? 0}%` }} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs uppercase font-mono text-slate-400 mb-3">
            <Workflow className="w-4 h-4 text-cyan-400" /> Status do incidente
          </div>
          <select
            value={record.status || "Novo"}
            onChange={(e) => handleStatusChange(e.target.value as IncidentStatus)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100"
          >
            {INCIDENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs uppercase font-mono text-slate-400 mb-2">Progresso de contenção</div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-slate-100">{completionPercent}%</span>
            <span className="text-xs text-slate-500 mb-1">{completedCount}/{actions.length} ações</span>
          </div>
          <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${completionPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          ["report", "Relatório"],
          ["iocs", `IOCs (${record.parsedData.iocs.length})`],
          ["mitre", `MITRE (${record.parsedData.mitreTechniques.length})`],
          ["checklist", `Checklist (${completedCount}/${actions.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium ${activeTab === key ? "bg-cyan-950 text-cyan-300 border border-cyan-800" : "bg-slate-900 text-slate-400 border border-slate-800"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "report" && renderFormattedMarkdown(record.rawMarkdown)}

      {activeTab === "iocs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {record.parsedData.iocs.length === 0 ? (
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm text-slate-400">Nenhum IOC confiável foi extraído.</div>
          ) : record.parsedData.iocs.map((ioc, index) => (
            <button key={`${ioc.type}-${ioc.value}-${index}`} onClick={() => handleCopyIoc(ioc.value)} className="text-left bg-slate-900 border border-slate-800 hover:border-cyan-800 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-mono uppercase text-cyan-400">{ioc.type}</span>
                <span className="text-[10px] text-slate-500">{copiedIoc === ioc.value ? "Copiado" : "Clique para copiar"}</span>
              </div>
              <code className="block mt-2 break-all text-xs text-slate-200">{ioc.value}</code>
            </button>
          ))}
        </div>
      )}

      {activeTab === "mitre" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {record.parsedData.mitreTechniques.length === 0 ? (
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 text-sm text-slate-400">Nenhuma técnica MITRE foi identificada com confiança.</div>
          ) : record.parsedData.mitreTechniques.map((technique) => (
            <div key={technique.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="font-mono text-cyan-400 font-bold">{technique.id}</span>
                <span className="text-[10px] uppercase text-slate-500">{technique.tactic}</span>
              </div>
              <div className="text-sm font-semibold text-slate-100">{technique.name}</div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{technique.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "checklist" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-100">Playbook de contenção</h3>
              <p className="text-xs text-slate-500">O progresso agora é salvo junto com o incidente.</p>
            </div>
            <span className="text-xs font-mono text-emerald-400">{completionPercent}% concluído</span>
          </div>
          {actions.map((action) => (
            <label key={action.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/70 border border-slate-800 cursor-pointer">
              <input type="checkbox" checked={action.completed} onChange={() => toggleAction(action.id)} className="mt-1" />
              <span className={`text-sm ${action.completed ? "line-through text-slate-500" : "text-slate-300"}`}>{action.text}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
