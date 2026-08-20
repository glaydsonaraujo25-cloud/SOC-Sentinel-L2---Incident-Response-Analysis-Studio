import React from "react";
import { IncidentAnalysisRecord } from "../types";
import { FileSearch, Gauge, ShieldCheck, Clock3 } from "lucide-react";

interface Props {
  record: IncidentAnalysisRecord;
}

export const EvidenceInsights: React.FC<Props> = ({ record }) => {
  const evidence = record.input.evidence || [];
  const iocCount = evidence.reduce((sum, item) => sum + (item.extractedIocs?.length || 0), 0);
  const timestampCount = evidence.reduce((sum, item) => sum + (item.timestamps?.length || 0), 0);
  const confidence = record.confidenceScore ?? 0;
  const confidenceLabel = confidence >= 80 ? "Alta" : confidence >= 55 ? "Média" : "Baixa";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs uppercase font-mono text-slate-400 mb-2"><Gauge className="w-4 h-4 text-cyan-400" /> Confidence Score</div>
        <div className="flex items-end gap-2"><span className="text-4xl font-bold text-slate-100">{confidence}</span><span className="text-sm text-slate-500 mb-1">/100</span></div>
        <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-500" style={{ width: `${confidence}%` }} /></div>
        <p className="mt-2 text-[11px] text-slate-500">Confiança {confidenceLabel}, calculada por evidências, IOCs, formato estruturado e MITRE validado.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs uppercase font-mono text-slate-400 mb-2"><FileSearch className="w-4 h-4 text-cyan-400" /> Evidências</div>
        <div className="text-4xl font-bold text-slate-100">{evidence.length}</div>
        <p className="mt-2 text-[11px] text-slate-500">Arquivos anexados à investigação.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs uppercase font-mono text-slate-400 mb-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> IOCs de evidência</div>
        <div className="text-4xl font-bold text-slate-100">{iocCount}</div>
        <p className="mt-2 text-[11px] text-slate-500">Indicadores extraídos diretamente dos arquivos.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs uppercase font-mono text-slate-400 mb-2"><Clock3 className="w-4 h-4 text-amber-400" /> Eventos temporais</div>
        <div className="text-4xl font-bold text-slate-100">{timestampCount}</div>
        <p className="mt-2 text-[11px] text-slate-500">Timestamps usados para correlação automática da timeline.</p>
      </div>
    </div>
  );
};
