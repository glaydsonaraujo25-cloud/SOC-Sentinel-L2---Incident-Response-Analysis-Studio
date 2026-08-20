import React, { useMemo, useState } from "react";
import { IncidentAnalysisRecord, ThreatIntelResult } from "../types";
import { Radar, RefreshCw, ShieldCheck, ShieldAlert, CircleHelp } from "lucide-react";

interface ThreatIntelPanelProps {
  record: IncidentAnalysisRecord;
  onUpdateRecord: (record: IncidentAnalysisRecord) => void;
}

const supportedTypes = new Set(["IP", "Domain", "Hash"]);

export const ThreatIntelPanel: React.FC<ThreatIntelPanelProps> = ({ record, onUpdateRecord }) => {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supportedIocs = useMemo(
    () => record.parsedData.iocs.filter((ioc) => supportedTypes.has(ioc.type) && ioc.validFormat !== false),
    [record.parsedData.iocs],
  );

  const enrich = async (indexInSupported: number) => {
    const target = supportedIocs[indexInSupported];
    if (!target) return;

    const key = `${target.type}:${target.value}`;
    setLoadingKey(key);
    setMessage(null);

    try {
      const response = await fetch("/api/threat-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ type: target.type, value: target.value }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Falha ao consultar Threat Intelligence.");
      }

      if (data.enabled === false) {
        setMessage(data.message || "Threat Intelligence externa está desativada.");
        return;
      }

      const results = (data.results || []) as ThreatIntelResult[];
      const updatedIocs = record.parsedData.iocs.map((ioc) =>
        ioc.type === target.type && ioc.value === target.value
          ? { ...ioc, threatIntel: results }
          : ioc,
      );

      onUpdateRecord({
        ...record,
        parsedData: { ...record.parsedData, iocs: updatedIocs },
      });

      if (!results.length && Array.isArray(data.errors) && data.errors.length) {
        setMessage(data.errors.join(" | "));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha inesperada no enriquecimento.");
    } finally {
      setLoadingKey(null);
    }
  };

  const enrichAll = async () => {
    for (let index = 0; index < supportedIocs.length; index += 1) {
      await enrich(index);
    }
  };

  const verdictClass = (verdict: string) => {
    if (verdict === "Malicioso") return "text-red-400 border-red-900 bg-red-950/40";
    if (verdict === "Suspeito") return "text-amber-400 border-amber-900 bg-amber-950/40";
    if (verdict === "Limpo") return "text-emerald-400 border-emerald-900 bg-emerald-950/40";
    return "text-slate-400 border-slate-700 bg-slate-950";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Radar className="w-4 h-4 text-cyan-400" /> Threat Intelligence
          </div>
          <p className="text-xs text-slate-500 mt-1">Consulta opcional de reputação externa para IPs, domínios e hashes.</p>
        </div>
        <button
          onClick={enrichAll}
          disabled={!supportedIocs.length || Boolean(loadingKey)}
          className="px-3 py-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs disabled:opacity-40"
        >
          Enriquecer todos
        </button>
      </div>

      {message && <div className="text-xs text-amber-300 bg-amber-950/20 border border-amber-900/50 rounded-lg p-3">{message}</div>}

      {supportedIocs.length === 0 ? (
        <div className="text-xs text-slate-500">Nenhum IOC compatível com enriquecimento externo foi encontrado.</div>
      ) : (
        <div className="space-y-3">
          {supportedIocs.map((ioc, index) => {
            const key = `${ioc.type}:${ioc.value}`;
            return (
              <div key={key} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-mono text-cyan-400">{ioc.type}</div>
                    <code className="text-xs text-slate-200 break-all">{ioc.value}</code>
                  </div>
                  <button
                    onClick={() => enrich(index)}
                    disabled={loadingKey === key}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-300 disabled:opacity-50"
                  >
                    {loadingKey === key ? <span className="inline-flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Consultando</span> : "Consultar reputação"}
                  </button>
                </div>

                {ioc.threatIntel?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    {ioc.threatIntel.map((intel) => (
                      <div key={`${key}-${intel.provider}`} className={`rounded-lg border p-3 ${verdictClass(intel.verdict)}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold">{intel.provider}</span>
                          <span className="text-[10px] uppercase font-mono">{intel.verdict}</span>
                        </div>
                        <div className="text-[11px] mt-2 space-y-1 opacity-90">
                          {intel.score !== undefined && <div>Score: {intel.score}</div>}
                          {intel.malicious !== undefined && <div>Malicioso: {intel.malicious} • Suspeito: {intel.suspicious || 0}</div>}
                          {intel.totalReports !== undefined && <div>Relatos: {intel.totalReports}</div>}
                          {intel.country && <div>País: {intel.country}</div>}
                          {intel.asOwner && <div>Rede/ASN: {intel.asOwner}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1">
                    <CircleHelp className="w-3.5 h-3.5" /> Sem reputação externa salva para este IOC.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 text-[11px] text-slate-500 border-t border-slate-800 pt-3">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>As chaves de API ficam somente no backend da Vercel. Resultados externos complementam a análise e ainda devem ser validados pelo analista.</span>
      </div>
    </div>
  );
};
