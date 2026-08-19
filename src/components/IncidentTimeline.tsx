import React from "react";
import { IncidentAnalysisRecord, TimelineEvent } from "../types";
import { Clock3, Plus } from "lucide-react";

interface IncidentTimelineProps {
  record: IncidentAnalysisRecord;
  onUpdateRecord: (record: IncidentAnalysisRecord) => void;
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ record, onUpdateRecord }) => {
  const timeline = record.timeline || [];

  const addManualEvent = () => {
    const description = window.prompt("Descreva o evento da investigação:");
    if (!description?.trim()) return;

    const event: TimelineEvent = {
      id: `evt-${Date.now()}`,
      time: new Date().toISOString(),
      stage: record.status || "Investigação",
      description: description.trim(),
    };

    onUpdateRecord({ ...record, timeline: [...timeline, event] });
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan-400">
            <Clock3 className="w-4 h-4" />
            <span>Incident Timeline</span>
          </div>
          <h3 className="text-base font-bold text-slate-100 mt-1">Linha do tempo da resposta</h3>
        </div>
        <button onClick={addManualEvent} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-xs text-slate-300 hover:border-cyan-700">
          <Plus className="w-3.5 h-3.5" /> Adicionar evento
        </button>
      </div>

      {timeline.length === 0 ? (
        <p className="text-xs text-slate-500">Nenhum evento registrado.</p>
      ) : (
        <div className="relative pl-5 space-y-5 before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-px before:bg-slate-700">
          {[...timeline].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()).map((event) => (
            <div key={event.id} className="relative">
              <div className="absolute -left-5 top-1.5 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-slate-950" />
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase text-cyan-300">{event.stage}</span>
                <span className="text-[10px] font-mono text-slate-500">{new Date(event.time).toLocaleString("pt-BR")}</span>
              </div>
              <p className="text-sm text-slate-300">{event.description}</p>
              {event.indicator && <p className="text-xs font-mono text-amber-300 mt-1">{event.indicator}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
