import React from "react";
import { ShieldAlert, Terminal, History, Sparkles, Cpu, AlertTriangle } from "lucide-react";

interface HeaderProps {
  totalAnalyzed: number;
  onOpenHistory: () => void;
  onNewIncident: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalAnalyzed,
  onOpenHistory,
  onNewIncident,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-xl backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onNewIncident}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight font-mono">
                SOC <span className="text-cyan-400">SENTINEL</span> L2
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-700/50 rounded-full">
                Incident IR Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Análise Avançada de Segurança & Resposta a Incidentes • Nível 2
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Modelo:</span>
            <span className="font-mono text-cyan-300 font-semibold">Gemini 3.6 Flash</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1" />
          </div>

          <button
            onClick={onNewIncident}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Novo Incidente</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/80 rounded-lg text-xs font-medium transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico</span>
            {totalAnalyzed > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-cyan-500 text-slate-950 rounded-full">
                {totalAnalyzed}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
