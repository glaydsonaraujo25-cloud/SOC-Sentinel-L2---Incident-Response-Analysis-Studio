import React, { useState } from "react";
import { IncidentAnalysisRecord } from "../types";
import { History, X, Trash2, Search, ArrowRight, ShieldAlert } from "lucide-react";

interface IncidentHistoryProps {
  history: IncidentAnalysisRecord[];
  onSelectRecord: (record: IncidentAnalysisRecord) => void;
  onClearHistory: () => void;
  onClose: () => void;
}

export const IncidentHistory: React.FC<IncidentHistoryProps> = ({
  history,
  onSelectRecord,
  onClearHistory,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");

  const filteredHistory = history.filter((rec) => {
    const matchSearch =
      rec.input.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.input.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.parsedData.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchPrio =
      filterPriority === "ALL" || rec.parsedData.priority === filterPriority;

    return matchSearch && matchPrio;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="bg-slate-900 border-l border-slate-800 max-w-md w-full h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-mono font-bold text-slate-100 text-sm">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Histórico de Análises ({history.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por tipo, palavra-chave ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-lg outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Prioridade:</span>
            {["ALL", "P1", "P2", "P3", "P4"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  filterPriority === p
                    ? "bg-cyan-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              Nenhum incidente encontrado no histórico.
            </div>
          ) : (
            filteredHistory.map((rec) => {
              const dateStr = new Date(rec.createdAt).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });

              const prioColors: Record<string, string> = {
                P1: "bg-red-950 text-red-400 border-red-700",
                P2: "bg-orange-950 text-orange-400 border-orange-700",
                P3: "bg-amber-950 text-amber-400 border-amber-700",
                P4: "bg-emerald-950 text-emerald-400 border-emerald-700",
              };

              return (
                <div
                  key={rec.id}
                  onClick={() => {
                    onSelectRecord(rec);
                    onClose();
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 cursor-pointer hover:border-cyan-500/80 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        prioColors[rec.parsedData.priority] || prioColors.P2
                      }`}
                    >
                      {rec.parsedData.priority}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {dateStr}
                    </span>
                  </div>

                  <h4 className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {rec.input.tipo}
                  </h4>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {rec.input.descricao}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
                    <span>Ativo: {rec.input.criticidade}</span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform inline-flex items-center space-x-1">
                      <span>Abrir</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              Salvo localmente
            </span>
            <button
              onClick={onClearHistory}
              className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-800 rounded-lg text-xs font-mono font-medium flex items-center space-x-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Histórico</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
