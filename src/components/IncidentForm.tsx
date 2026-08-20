import React, { useState } from "react";
import { IncidentInput, AssetCriticality, IncidentPreset, EvidenceArtifact } from "../types";
import { INCIDENT_PRESETS, COMMON_INCIDENT_TYPES } from "../data/scenarios";
import { analyzeEvidenceText, evidenceToContext } from "../lib/evidence";
import { ShieldAlert, Terminal, Zap, Play, HelpCircle, RotateCcw, Server, Layers, Upload, FileSearch, X } from "lucide-react";

interface IncidentFormProps {
  onSubmit: (input: IncidentInput) => void;
  isLoading: boolean;
}

const MAX_FILE_SIZE = 512 * 1024;
const ALLOWED_EXTENSIONS = [".log", ".txt", ".json", ".csv"];

export const IncidentForm: React.FC<IncidentFormProps> = ({ onSubmit, isLoading }) => {
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("Ransomware / Malware Infection");
  const [customTipo, setCustomTipo] = useState("");
  const [criticidade, setCriticidade] = useState<AssetCriticality>("Alta");
  const [contextoAdicional, setContextoAdicional] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<EvidenceArtifact[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleSelectPreset = (preset: IncidentPreset) => {
    setSelectedPresetId(preset.id);
    setDescricao(preset.descricao);
    setTipo(preset.tipo);
    setCriticidade(preset.criticidade);
    setContextoAdicional(preset.contextoAdicional);
  };

  const handleClear = () => {
    setSelectedPresetId(null);
    setDescricao("");
    setTipo("Ransomware / Malware Infection");
    setCustomTipo("");
    setCriticidade("Alta");
    setContextoAdicional("");
    setEvidence([]);
    setFileError(null);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setFileError(null);
    const next: EvidenceArtifact[] = [];

    for (const file of Array.from(files).slice(0, 5)) {
      const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        setFileError(`Formato não suportado: ${file.name}. Use .log, .txt, .json ou .csv.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`${file.name} excede o limite de 512 KB.`);
        continue;
      }
      const content = await file.text();
      next.push(analyzeEvidenceText(file.name, file.type || "text/plain", file.size, content));
    }

    setEvidence((current) => [...current, ...next].slice(0, 5));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;
    const finalTipo = tipo === "Outro / Personalizado" && customTipo.trim() ? customTipo.trim() : tipo;
    const evidenceContext = evidenceToContext(evidence);
    const combinedContext = [contextoAdicional.trim(), evidenceContext].filter(Boolean).join("\n\n");

    onSubmit({
      descricao: descricao.trim(),
      tipo: finalTipo,
      criticidade,
      contextoAdicional: combinedContext || undefined,
      evidence: evidence.length ? evidence : undefined,
    });
  };

  const criticalityConfig: Record<AssetCriticality, { bg: string; text: string; border: string; desc: string }> = {
    Crítica: { bg: "bg-red-950/80", text: "text-red-400", border: "border-red-600/80", desc: "Domain Controllers, banco principal, core routers e ERP." },
    Alta: { bg: "bg-orange-950/80", text: "text-orange-400", border: "border-orange-600/80", desc: "Servidores, APIs de produção e sistemas de pagamento." },
    Média: { bg: "bg-amber-950/80", text: "text-amber-400", border: "border-amber-600/80", desc: "Estações corporativas e homologação." },
    Baixa: { bg: "bg-emerald-950/80", text: "text-emerald-400", border: "border-emerald-600/80", desc: "Ativos de teste e ambientes temporários." },
  };

  const totalIocs = evidence.reduce((sum, item) => sum + (item.extractedIocs?.length || 0), 0);
  const totalTimestamps = evidence.reduce((sum, item) => sum + (item.timestamps?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
          <Zap className="w-4 h-4" /><span>Painel de Ingestão de Incidentes SOC</span>
        </div>
        <h2 className="text-xl font-bold text-slate-100">Análise Técnica de Segurança Cibernética</h2>
        <p className="text-sm text-slate-400 mt-1">Descreva o incidente ou anexe evidências de texto para extração automática de IOCs e eventos temporais.</p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-300 font-semibold uppercase"><Layers className="w-4 h-4 text-cyan-400" /><span>Cenários de Teste</span></div>
          {selectedPresetId && <button type="button" onClick={handleClear} className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"><RotateCcw className="w-3 h-3" />Limpar</button>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {INCIDENT_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => handleSelectPreset(preset)} className={`text-left p-3 rounded-lg border text-xs ${selectedPresetId === preset.id ? "bg-cyan-950/80 border-cyan-500" : "bg-slate-950/70 border-slate-800 hover:border-slate-700"}`}><div className="font-semibold text-slate-100">{preset.title}</div><p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{preset.descricao}</p></button>)}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">Tipo de Incidente *</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg p-2.5" required>{COMMON_INCIDENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            {tipo === "Outro / Personalizado" && <input value={customTipo} onChange={(e) => setCustomTipo(e.target.value)} className="mt-2.5 w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg p-2.5" placeholder="Especifique o tipo..." required />}
          </div>
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">Criticidade do Ativo *</label>
            <div className="grid grid-cols-4 gap-2">{(["Crítica", "Alta", "Média", "Baixa"] as AssetCriticality[]).map((crit) => { const cfg = criticalityConfig[crit]; return <button key={crit} type="button" onClick={() => setCriticidade(crit)} className={`p-2 rounded-lg border text-xs font-mono ${criticidade === crit ? `${cfg.bg} ${cfg.border} ${cfg.text} font-bold` : "bg-slate-950/60 border-slate-800 text-slate-400"}`}>{crit}</button>; })}</div>
            <p className="text-[11px] text-slate-400 mt-2 flex gap-1"><Server className="w-3 h-3 text-cyan-400" />{criticalityConfig[criticidade].desc}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">Descrição do Incidente *</label>
          <textarea rows={5} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg p-3" placeholder="Descreva o ocorrido..." required />
        </div>

        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2 flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-cyan-400" />Contexto Adicional / Logs</label>
          <textarea rows={4} value={contextoAdicional} onChange={(e) => setContextoAdicional(e.target.value)} className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg p-3" placeholder="Cole IPs, hashes, comandos, Event IDs ou logs..." />
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div><div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><FileSearch className="w-4 h-4 text-cyan-400" />Evidências</div><p className="text-[11px] text-slate-500 mt-1">.log, .txt, .json ou .csv • até 512 KB por arquivo • máximo 5 arquivos</p></div>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs cursor-pointer"><Upload className="w-4 h-4 text-cyan-400" />Adicionar arquivos<input type="file" multiple accept=".log,.txt,.json,.csv,text/plain,application/json,text/csv" onChange={(e) => handleFiles(e.target.files)} className="hidden" /></label>
          </div>
          {fileError && <div className="text-xs text-amber-400">{fileError}</div>}
          {evidence.length > 0 && <><div className="grid grid-cols-2 gap-3 text-xs"><div className="bg-slate-900 rounded-lg p-3"><span className="text-slate-500">IOCs extraídos</span><div className="text-xl font-bold text-cyan-400">{totalIocs}</div></div><div className="bg-slate-900 rounded-lg p-3"><span className="text-slate-500">Timestamps</span><div className="text-xl font-bold text-cyan-400">{totalTimestamps}</div></div></div><div className="space-y-2">{evidence.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3"><div><div className="text-xs text-slate-200 font-medium">{item.name}</div><div className="text-[10px] text-slate-500">{item.extractedIocs?.length || 0} IOCs • {item.timestamps?.length || 0} timestamps</div></div><button type="button" onClick={() => setEvidence((current) => current.filter((_, i) => i !== index))} className="text-slate-500 hover:text-red-400"><X className="w-4 h-4" /></button></div>)}</div></>}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-slate-800 gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-cyan-400" /><span>Arquivos são lidos localmente e enviados somente como contexto textual da análise.</span></div>
          <div className="flex items-center gap-3 w-full sm:w-auto">{(descricao || contextoAdicional || evidence.length > 0) && <button type="button" onClick={handleClear} disabled={isLoading} className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-lg text-xs border border-slate-700">Limpar</button>}<button type="submit" disabled={isLoading || !descricao.trim()} className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">{isLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Analisando...</span></> : <><Play className="w-4 h-4 fill-current" /><span>Analisar Incidente</span></>}</button></div>
        </div>
      </form>
    </div>
  );
};
