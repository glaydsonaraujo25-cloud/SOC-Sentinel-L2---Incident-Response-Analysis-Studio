import React, { useState } from "react";
import { IncidentAnalysisRecord, ActionItem } from "../types";
import {
  ShieldAlert,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Printer,
  Ticket,
  FileText,
  Terminal,
  Crosshair,
  CheckSquare,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Info,
  Clock,
  Layers
} from "lucide-react";

interface ReportViewerProps {
  record: IncidentAnalysisRecord;
  onOpenTicketModal: () => void;
  onNewIncident: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  record,
  onOpenTicketModal,
  onNewIncident,
}) => {
  const [activeTab, setActiveTab] = useState<"report" | "iocs" | "mitre" | "checklist">("report");
  const [copied, setCopied] = useState(false);
  const [copiedIoc, setCopiedIoc] = useState<string | null>(null);

  // Local checklist state
  const [actions, setActions] = useState<ActionItem[]>(record.parsedData.immediateActions);

  const toggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = actions.filter((a) => a.completed).length;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(record.rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyIoc = (val: string) => {
    navigator.clipboard.writeText(val);
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
  };

  const priorityColorMap: Record<string, { bg: string; text: string; border: string }> = {
    P1: { bg: "bg-red-950/90", text: "text-red-400", border: "border-red-600" },
    P2: { bg: "bg-orange-950/90", text: "text-orange-400", border: "border-orange-600" },
    P3: { bg: "bg-amber-950/90", text: "text-amber-400", border: "border-amber-600" },
    P4: { bg: "bg-emerald-950/90", text: "text-emerald-400", border: "border-emerald-600" },
  };

  const prioCfg = priorityColorMap[record.parsedData.priority] || priorityColorMap.P2;

  // Custom renderer for markdown sections to highlight headers cleanly
  const renderFormattedMarkdown = (markdown: string) => {
    // Split by sections starting with ## 
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

          // Header icon mapping
          let headerIcon = <FileText className="w-5 h-5 text-cyan-400" />;
          let headerBg = "bg-slate-900 border-slate-800";

          if (headerTitle.toLowerCase().includes("resumo")) {
            headerIcon = <Info className="w-5 h-5 text-cyan-400" />;
          } else if (headerTitle.toLowerCase().includes("classificação")) {
            headerIcon = <Layers className="w-5 h-5 text-blue-400" />;
          } else if (headerTitle.toLowerCase().includes("indicadores")) {
            headerIcon = <Crosshair className="w-5 h-5 text-amber-400" />;
          } else if (headerTitle.toLowerCase().includes("possível ataque")) {
            headerIcon = <AlertTriangle className="w-5 h-5 text-red-400" />;
          } else if (headerTitle.toLowerCase().includes("impacto")) {
            headerIcon = <ShieldAlert className="w-5 h-5 text-orange-400" />;
          } else if (headerTitle.toLowerCase().includes("ações imediatas")) {
            headerIcon = <CheckSquare className="w-5 h-5 text-emerald-400" />;
            headerBg = "bg-emerald-950/20 border-emerald-900/50";
          } else if (headerTitle.toLowerCase().includes("investigação")) {
            headerIcon = <Terminal className="w-5 h-5 text-purple-400" />;
          } else if (headerTitle.toLowerCase().includes("recomendações")) {
            headerIcon = <ShieldCheck className="w-5 h-5 text-teal-400" />;
          } else if (headerTitle.toLowerCase().includes("mitre")) {
            headerIcon = <Crosshair className="w-5 h-5 text-cyan-400" />;
          } else if (headerTitle.toLowerCase().includes("prioridade")) {
            headerIcon = <AlertTriangle className="w-5 h-5 text-red-500" />;
            headerBg = "bg-red-950/20 border-red-900/50";
          }

          return (
            <div
              key={idx}
              className={`border rounded-xl p-5 ${headerBg} shadow-md transition-all`}
            >
              {headerTitle && (
                <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800/80 mb-4">
                  {headerIcon}
                  <h3 className="font-mono font-bold text-base text-slate-100 tracking-tight">
                    ## {headerTitle}
                  </h3>
                </div>
              )}

              {/* Render section body paragraphs and bullet items */}
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-2 font-sans">
                {bodyText.split("\n\n").map((para, pIdx) => {
                  const pTrim = para.trim();
                  if (!pTrim) return null;

                  // List items formatting
                  if (pTrim.includes("\n- ") || pTrim.startsWith("- ") || pTrim.startsWith("* ") || /^\d+\.\s/.test(pTrim)) {
                    const listLines = pTrim.split("\n");
                    return (
                      <ul key={pIdx} className="space-y-2 my-2">
                        {listLines.map((line, lIdx) => {
                          const lClean = line.replace(/^[-*•\d+.]+\s*/, "").trim();
                          if (!lClean) return null;

                          // Bold keyword prefix if exists
                          const parts = lClean.split(":");
                          if (parts.length > 1 && parts[0].length < 35) {
                            return (
                              <li key={lIdx} className="flex items-start space-x-2 text-slate-300">
                                <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                                <div>
                                  <strong className="text-slate-100">{parts[0]}:</strong>
                                  <span>{parts.slice(1).join(":")}</span>
                                </div>
                              </li>
                            );
                          }

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

                  return <p key={pIdx} className="text-slate-300 leading-relaxed">{pTrim}</p>;
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
      {/* Top Incident Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
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

            <h2 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">
              Análise de Incidente: {record.input.tipo}
            </h2>

            <div className="flex items-center space-x-4 text-xs text-slate-400 font-mono">
              <div className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gerado em: {new Date(record.createdAt).toLocaleString('pt-BR')}</span>
              </div>
              <div className="hidden sm:flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Formatado rigorosamente em 10 seções SOC L2</span>
              </div>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Copiar relatório completo em Markdown"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? "Copiado!" : "Copiar Markdown"}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Baixar arquivo .md"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Baixar .MD</span>
            </button>

            <button
              onClick={onOpenTicketModal}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
            >
              <Ticket className="w-4 h-4" />
              <span>Gerar Ticket (Jira)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 overflow-x-auto space-x-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("report")}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-mono text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "report"
              ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Relatório Completo (10 Seções)</span>
        </button>

        <button
          onClick={() => setActiveTab("iocs")}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-mono text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "iocs"
              ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <Crosshair className="w-4 h-4" />
          <span>Indicadores (IOCs) ({record.parsedData.iocs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("mitre")}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-mono text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "mitre"
              ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>MITRE ATT&CK ({record.parsedData.mitreTechniques.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex items-center space-x-2 py-3 px-4 border-b-2 font-mono text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === "checklist"
              ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Checklist de Contenção ({completedCount}/{actions.length})</span>
        </button>
      </div>

      {/* Tab 1: Full Formatted Markdown Report */}
      {activeTab === "report" && (
        <div className="space-y-6">
          {renderFormattedMarkdown(record.rawMarkdown)}
        </div>
      )}

      {/* Tab 2: IOC Matrix */}
      {activeTab === "iocs" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-mono font-bold text-base text-slate-100 flex items-center space-x-2">
                <Crosshair className="w-5 h-5 text-amber-400" />
                <span>Matriz de Indicadores de Comprometimento (IOCs)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Extração e catalogação automática de artefatos maliciosos para bloqueio em EDR/Firewall/Proxy.
              </p>
            </div>
          </div>

          {record.parsedData.iocs.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/50 rounded-lg border border-slate-800">
              <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhum IOC direto identificado no relatório gerado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase">
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Valor / Artefato</th>
                    <th className="p-3 text-right">Ações de Pesquisa / Bloqueio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {record.parsedData.iocs.map((ioc, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-semibold">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                          {ioc.type}
                        </span>
                      </td>
                      <td className="p-3 text-slate-200 font-mono break-all selection:bg-cyan-900">
                        {ioc.value}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleCopyIoc(ioc.value)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 inline-flex items-center space-x-1"
                        >
                          {copiedIoc === ioc.value ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-cyan-400" />
                          )}
                          <span>{copiedIoc === ioc.value ? "Copiado" : "Copiar"}</span>
                        </button>

                        {ioc.type === "IP" && (
                          <a
                            href={`https://www.virustotal.com/gui/ip-address/${ioc.value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 inline-flex items-center space-x-1"
                          >
                            <span>VT</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {ioc.type === "Domain" && (
                          <a
                            href={`https://www.virustotal.com/gui/domain/${ioc.value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 inline-flex items-center space-x-1"
                          >
                            <span>VT</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {ioc.type === "Hash" && (
                          <a
                            href={`https://www.virustotal.com/gui/file/${ioc.value}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800 inline-flex items-center space-x-1"
                          >
                            <span>VT</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: MITRE ATT&CK Breakdown */}
      {activeTab === "mitre" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-mono font-bold text-base text-slate-100 flex items-center space-x-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span>Mapeamento de Técnicas MITRE ATT&CK</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mapeamento de Táticas e Técnicas identificadas neste incidente.
              </p>
            </div>
          </div>

          {record.parsedData.mitreTechniques.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/50 rounded-lg border border-slate-800">
              <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhuma técnica MITRE extraída especificamente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {record.parsedData.mitreTechniques.map((tech, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800 text-xs">
                      {tech.id}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      Tática: {tech.tactic}
                    </span>
                  </div>

                  <h4 className="font-semibold text-slate-100 text-sm">{tech.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {tech.description}
                  </p>

                  <div className="pt-2">
                    <a
                      href={`https://attack.mitre.org/techniques/${tech.id.replace(".", "/")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1 font-mono"
                    >
                      <span>Ver na Base do MITRE ATT&CK</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Interactive Containment Action Checklist */}
      {activeTab === "checklist" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-mono font-bold text-base text-slate-100 flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <span>Checklist Interativo de Ações Imediatas</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Acompanhe o status de execução das ações de contenção recomendadas para este incidente.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                {completedCount} de {actions.length} concluídas
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {actions.map((act) => (
              <div
                key={act.id}
                onClick={() => toggleAction(act.id)}
                className={`p-3.5 rounded-lg border flex items-start space-x-3 cursor-pointer transition-all ${
                  act.completed
                    ? "bg-emerald-950/30 border-emerald-800/80 text-slate-300"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-100"
                }`}
              >
                <div className={`w-5 h-5 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                  act.completed ? "bg-emerald-600 border-emerald-500 text-white" : "border-slate-600 bg-slate-900"
                }`}>
                  {act.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div className="flex-1 text-xs leading-relaxed font-sans">
                  <span className={act.completed ? "line-through text-slate-500" : "text-slate-200 font-medium"}>
                    {act.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
