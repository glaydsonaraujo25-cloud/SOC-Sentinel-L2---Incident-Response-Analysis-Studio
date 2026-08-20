import React, { useMemo, useState } from "react";
import { IncidentAnalysisRecord } from "../types";
import { BriefcaseBusiness, Clock3, FileText, Plus, UserRound, History } from "lucide-react";

interface Props { record: IncidentAnalysisRecord; onUpdateRecord: (record: IncidentAnalysisRecord) => void; }
const actor = "SOC Analyst";
const auditId = () => `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const CaseManagementPanel: React.FC<Props> = ({ record, onUpdateRecord }) => {
  const [note, setNote] = useState("");
  const [author, setAuthor] = useState(actor);
  const cm = record.caseManagement || { notes: [], audit: [] };

  const sla = useMemo(() => {
    if (!cm.slaTargetAt) return null;
    const diff = new Date(cm.slaTargetAt).getTime() - Date.now();
    const overdue = diff < 0;
    const hours = Math.abs(diff) / 3600000;
    return { overdue, label: hours < 1 ? `${Math.round(hours * 60)} min` : `${hours.toFixed(1)} h` };
  }, [cm.slaTargetAt, record]);

  const updateOwner = (owner: string) => onUpdateRecord({ ...record, caseManagement: { ...cm, owner, notes: cm.notes || [], audit: [...(cm.audit || []), { id: auditId(), createdAt: new Date().toISOString(), actor, action: "Responsável alterado", details: owner || "Sem responsável" }] } });
  const updateSla = (slaTargetAt: string) => onUpdateRecord({ ...record, caseManagement: { ...cm, slaTargetAt, notes: cm.notes || [], audit: [...(cm.audit || []), { id: auditId(), createdAt: new Date().toISOString(), actor, action: "SLA atualizado", details: slaTargetAt ? new Date(slaTargetAt).toLocaleString("pt-BR") : "SLA removido" }] } });
  const addNote = () => {
    const text = note.trim(); if (!text) return;
    const now = new Date().toISOString();
    onUpdateRecord({ ...record, caseManagement: { ...cm, notes: [...(cm.notes || []), { id: `note-${Date.now()}`, createdAt: now, author: author.trim() || actor, text }], audit: [...(cm.audit || []), { id: auditId(), createdAt: now, actor: author.trim() || actor, action: "Nota adicionada" }] } });
    setNote("");
  };

  return <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BriefcaseBusiness className="w-4 h-4 text-cyan-400"/><div><h3 className="text-sm font-semibold text-slate-100">Case Management</h3><p className="text-[10px] text-slate-500 font-mono">OWNER • SLA • NOTES • AUDIT</p></div></div>{sla && <span className={`text-[10px] font-mono px-2 py-1 rounded border ${sla.overdue ? "text-red-300 border-red-800 bg-red-950/40" : "text-emerald-300 border-emerald-800 bg-emerald-950/30"}`}>{sla.overdue ? "SLA vencido" : "SLA restante"}: {sla.label}</span>}</div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label className="space-y-1"><span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1"><UserRound className="w-3 h-3"/>Analista responsável</span><input value={cm.owner || ""} onChange={(e)=>updateOwner(e.target.value)} placeholder="Ex.: Analista L2" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-600"/></label>
      <label className="space-y-1"><span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1"><Clock3 className="w-3 h-3"/>Prazo SLA</span><input type="datetime-local" value={cm.slaTargetAt ? cm.slaTargetAt.slice(0,16) : ""} onChange={(e)=>updateSla(e.target.value ? new Date(e.target.value).toISOString() : "")} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-600"/></label>
    </div>
    <div className="space-y-2"><div className="flex items-center gap-2 text-xs font-semibold text-slate-300"><FileText className="w-4 h-4 text-cyan-400"/>Notas da investigação</div><div className="grid grid-cols-1 md:grid-cols-[150px_1fr_auto] gap-2"><input value={author} onChange={(e)=>setAuthor(e.target.value)} placeholder="Autor" className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs"/><textarea value={note} onChange={(e)=>setNote(e.target.value)} rows={2} placeholder="Registre hipótese, descoberta, decisão ou próximo passo..." className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs resize-none"/><button onClick={addNote} disabled={!note.trim()} className="px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-xs font-semibold flex items-center justify-center gap-1"><Plus className="w-4 h-4"/>Adicionar</button></div><div className="space-y-2 max-h-48 overflow-auto">{[...(cm.notes || [])].reverse().map(n=><div key={n.id} className="border border-slate-800 bg-slate-950/60 rounded-lg p-3"><div className="flex justify-between gap-2 text-[10px] font-mono text-slate-500"><span>{n.author}</span><span>{new Date(n.createdAt).toLocaleString("pt-BR")}</span></div><p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">{n.text}</p></div>)}{!cm.notes?.length && <p className="text-xs text-slate-500">Nenhuma nota registrada.</p>}</div></div>
    <div className="space-y-2"><div className="flex items-center gap-2 text-xs font-semibold text-slate-300"><History className="w-4 h-4 text-cyan-400"/>Auditoria do caso</div><div className="max-h-40 overflow-auto space-y-1">{[...(cm.audit || [])].reverse().slice(0,20).map(a=><div key={a.id} className="grid grid-cols-[120px_1fr] gap-2 text-[10px] border-l border-slate-700 pl-2"><span className="font-mono text-slate-500">{new Date(a.createdAt).toLocaleString("pt-BR")}</span><span className="text-slate-400"><strong className="text-slate-300">{a.action}</strong>{a.details ? ` — ${a.details}` : ""}</span></div>)}{!cm.audit?.length && <p className="text-xs text-slate-500">As alterações deste caso aparecerão aqui.</p>}</div></div>
  </section>;
};
