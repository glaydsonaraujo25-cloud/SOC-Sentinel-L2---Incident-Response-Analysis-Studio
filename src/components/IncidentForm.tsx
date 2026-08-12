import React, { useState } from "react";
import {
  IncidentInput,
  AssetCriticality,
  IncidentPreset,
} from "../types";
import { INCIDENT_PRESETS, COMMON_INCIDENT_TYPES } from "../data/scenarios";
import {
  ShieldAlert,
  AlertOctagon,
  FileText,
  Terminal,
  Zap,
  Play,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  Server,
  Layers,
  Database
} from "lucide-react";

interface IncidentFormProps {
  onSubmit: (input: IncidentInput) => void;
  isLoading: boolean;
}

export const IncidentForm: React.FC<IncidentFormProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("Ransomware / Malware Infection");
  const [customTipo, setCustomTipo] = useState("");
  const [criticidade, setCriticidade] = useState<AssetCriticality>("Alta");
  const [contextoAdicional, setContextoAdicional] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    const finalTipo = tipo === "Outro / Personalizado" && customTipo.trim() ? customTipo.trim() : tipo;

    onSubmit({
      descricao: descricao.trim(),
      tipo: finalTipo,
      criticidade,
      contextoAdicional: contextoAdicional.trim() || undefined,
    });
  };

  const criticalityConfig: Record<
    AssetCriticality,
    { label: string; bg: string; text: string; border: string; desc: string }
  > = {
    Crítica: {
      label: "Crítica",
      bg: "bg-red-950/80",
      text: "text-red-400",
      border: "border-red-600/80",
      desc: "Domain Controllers, Banco de Dados Principal, Core Routers, ERP Financeiro",
    },
    Alta: {
      label: "Alta",
      bg: "bg-orange-950/80",
      text: "text-orange-400",
      border: "border-orange-600/80",
      desc: "Servidores de Aplicação, VIPs, APIs de Produção, Sistemas de Pagamento",
    },
    Média: {
      label: "Média",
      bg: "bg-amber-950/80",
      text: "text-amber-400",
      border: "border-amber-600/80",
      desc: "Estações de Trabalho Corporativas, Ambientes de Staging/Homologação",
    },
    Baixa: {
      label: "Baixa",
      bg: "bg-emerald-950/80",
      text: "text-emerald-400",
      border: "border-emerald-600/80",
      desc: "Ativos de Teste, DMZ Isolada, Máquinas Virtuais Temporárias",
    },
  };

  return (
    <div className="space-y-6">
      {/* Banner Intro */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              <span>Painel de Ingestão de Incidentes SOC</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Análise Técnica de Segurança Cibernética
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Informe os detalhes do incidente abaixo para receber um relatório completo de SOC Nível 2
              contendo <strong className="text-slate-200">Classificação, IOCs, Vetor de Ataque, Ações Imediatas, Logs para Investigação, MITRE ATT&CK e Prioridade (P1-P4)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Scenarios Gallery */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-300 font-semibold uppercase">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Cenários de Teste Pré-carregados (Templates Rápido)</span>
          </div>
          {selectedPresetId && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar seleção</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {INCIDENT_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`text-left p-3 rounded-lg border text-xs transition-all ${
                  isSelected
                    ? "bg-cyan-950/80 border-cyan-500 text-cyan-100 shadow-md shadow-cyan-900/30"
                    : "bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-100 truncate pr-2">
                    {preset.title}
                  </span>
                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-mono bg-slate-800 text-cyan-400 rounded border border-slate-700">
                    {preset.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {preset.descricao}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Incident Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de Incidente */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">
              Tipo de Incidente <span className="text-cyan-400">*</span>
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg p-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
              required
            >
              {COMMON_INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {tipo === "Outro / Personalizado" && (
              <input
                type="text"
                placeholder="Especifique o tipo de incidente..."
                value={customTipo}
                onChange={(e) => setCustomTipo(e.target.value)}
                className="mt-2.5 w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg p-2.5 focus:border-cyan-500 outline-none"
                required
              />
            )}
          </div>

          {/* Criticidade do Ativo */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">
              Criticidade do Ativo Comprometido <span className="text-cyan-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["Crítica", "Alta", "Média", "Baixa"] as AssetCriticality[]).map((crit) => {
                const cfg = criticalityConfig[crit];
                const isChecked = criticidade === crit;
                return (
                  <button
                    key={crit}
                    type="button"
                    onClick={() => setCriticidade(crit)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      isChecked
                        ? `${cfg.bg} ${cfg.border} ${cfg.text} font-bold shadow-sm`
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="text-xs font-mono">{cfg.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <Server className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{criticalityConfig[criticidade].desc}</span>
            </p>
          </div>
        </div>

        {/* Descrição do Incidente */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono font-semibold uppercase text-slate-300">
              Descrição do Incidente <span className="text-cyan-400">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {descricao.length} caracteres
            </span>
          </div>
          <textarea
            rows={5}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva detalhadamente o ocorrido (ex: Alerta EDR sobre execução suspeita de PowerShell codificado em base64, criação de usuário administrador não autorizado, movimentação lateral via RDP, alteração de regras de caixa de e-mail, etc.)..."
            className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-sm rounded-lg p-3 font-sans focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none leading-relaxed"
            required
          />
        </div>

        {/* Contexto Adicional / Logs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono font-semibold uppercase text-slate-300 flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Contexto Adicional, Telemetria & Logs Brutos (Opcional)</span>
            </label>
          </div>
          <textarea
            rows={4}
            value={contextoAdicional}
            onChange={(e) => setContextoAdicional(e.target.value)}
            placeholder="Cole aqui IPs envolvidos, Hashes SHA256, Nomes de Usuários, Linhas de Comando, Event IDs do Windows, Trechos de Logs do Firewall/Proxy/CloudTrail..."
            className="w-full bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg p-3 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none leading-relaxed"
          />
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-slate-800 gap-4">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>A IA irá estruturar rigorosamente as 10 seções solicitadas de triagem SOC Nível 2.</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {(descricao || contextoAdicional) && (
              <button
                type="button"
                onClick={handleClear}
                disabled={isLoading}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              >
                Limpar Form
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !descricao.trim()}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analisando com Gemini SOC AI...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Analisar Incidente (SOC L2)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
