import React, { useMemo, useState } from "react";
import { IncidentAnalysisRecord, IncidentSeverity, IncidentStatus } from "../types";
import { History, X, Trash2, Search, ArrowRight, ShieldAlert, RotateCcw } from "lucide-react";

interface IncidentHistoryProps {
  history: IncidentAnalysisRecord[];
  onSelectRecord: (record: IncidentAnalysisRecord) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

const SEVERITIES: (IncidentSeverity | "ALL")[] = ["ALL", "Crítica", "Alta", "Média", "Baixa"];
const STATUSES: (IncidentStatus | "ALL")[] = ["ALL", "Novo", "Triagem", "Investigando", "Contido", "Erradicado", "Recuperado", "Fechado"];

export const IncidentHistory: React.FC<IncidentHistoryProps> = ({ history, onSelectRecord, onClearHistory, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | "ALL">("ALL");

  const filteredHistory = useMemo(() => history.filter((rec) => {
    const query = searchTerm.trim().toLowerCase();
    const searchable = [
      rec.input.tipo,
      rec.input.descricao,
      rec.parsedData.category,
      rec.parsedData.priority,
      rec.parsedData.severity,
      rec.status || "Novo",
      ...rec.parsedData.mitreTechniques.map((t) => `${t.id} ${t.name}`),
      ...rec.parsedData.iocs.map((ioc) => ioc.value),
    ].join(" ").toLowerCase();

    const matchSearch = !query || searchable.includes(query);
    const matchPriority = filterPriority === "ALL" || rec.parsedData.priority === filterPriority;
    const matchSeverity = filterSeverity === "ALL" || rec.parsedData.severity === filterSeverity;
    const matchStatus = filterStatus === "ALL" || (rec.status || "Novo") === filterStatus;

    return matchSearch && matchPriority && matchSeverity && matchStatus;
  }), [history, searchTerm, filterPriority, filterSeverity, filterStatus]);

  const hasFilters = Boolean(searchTerm) || filterPriority !== "ALL" || filterSeverity !== "ALL" || filterStatus !== "ALL";

  const resetFilters = () => {
    setSearchTerm("");
    setFilterPriority("ALL");
    setFilterSeverity("ALL");
    setFilterStatus("ALL");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 max-w-lg w-full h-full flex flex-col shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-mono font-bold text-slate-100 text-sm">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Histórico de Análises ({history.length})</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar tipo, IOC, MITRE, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-lg outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-300">
              <option value="ALL">Todas prioridades</option>
              {["P1", "P2", "P3", "P4"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as IncidentSeverity | "ALL")} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-300">
              {SEVERITIES.map((s) => <option key={s} value={s}>{s === "ALL" ? "Todas severidades" : s}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as IncidentStatus | "ALL")} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-300">
              {STATUSES.map((s) => <option key={s} value={s}>{s === "ALL" ? "Todos status" : s}</option>)}
            </select>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>{filteredHistory.length} de {history.length} incidentes</span>
            {hasFilters && (
              <button onClick={resetFilters} className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
                <RotateCcw className="w-3 h-3" /> Limpar filtros
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              Nenhum incidente encontrado com estes filtros.
            </div>
          ) : filteredHistory.map((rec) => {
            const dateStr = new Date(rec.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
            const prioColors: Record<string, string> = {
              P1: "bg-red-950 text-red-400 border-red-700",
              P2: "bg-orange-950 text-orange-400 border-orange-700",
              P3: "bg-amber-950 text-amber-400 border-amber-700",
              P4: "bg-emerald-950 text-emerald-400 border-emerald-700",
            };

            return (
              <div key={rec.id} onClick={() => { onSelectRecord(rec); onClose(); }} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 cursor-pointer hover:border-cyan-500/80 group">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${prioColors[rec.parsedData.priority] || prioColors.P2}`}>{rec.parsedData.priority}</span>
                    <span className="text-[10px] font-mono text-slate-500">{rec.status || "Novo"}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{dateStr}</span>
                </div>

                <h4 className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300">{rec.input.tipo}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{rec.input.descricao}</p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                  <span>{rec.parsedData.severity} • Risk {rec.riskScore ?? 0}/100</span>
                  <span className="text-cyan-400 group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1">
                    <span>Abrir</span><ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">Salvo localmente</span>
            <button onClick={onClearHistory} className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-800 rounded-lg text-xs font-mono font-medium flex items-center space-x-1">
              <Trash2 className="w-3.5 h-3.5" /><span>Limpar Histórico</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
