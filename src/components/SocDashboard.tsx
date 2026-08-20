import React, { useMemo } from "react";
import { IncidentAnalysisRecord } from "../types";
import { Activity, AlertTriangle, CheckCircle2, Crosshair, ShieldAlert, Gauge, Clock3, TrendingUp } from "lucide-react";

interface SocDashboardProps { history: IncidentAnalysisRecord[]; }

export const SocDashboard: React.FC<SocDashboardProps> = ({ history }) => {
  const metrics = useMemo(() => {
    const severity: Record<string, number> = { Crítica: 0, Alta: 0, Média: 0, Baixa: 0 };
    const priority: Record<string, number> = { P1: 0, P2: 0, P3: 0, P4: 0 };
    const mitre = new Map<string, number>();
    const categories = new Map<string, number>();
    let confidenceTotal = 0;
    let confidenceCount = 0;
    let closedDurationTotal = 0;
    let closedDurationCount = 0;

    history.forEach((record) => {
      if (severity[record.parsedData.severity] !== undefined) severity[record.parsedData.severity] += 1;
      if (priority[record.parsedData.priority] !== undefined) priority[record.parsedData.priority] += 1;
      record.parsedData.mitreTechniques.forEach((technique) => mitre.set(technique.id, (mitre.get(technique.id) || 0) + 1));
      const category = record.parsedData.category || record.input.tipo || "Não classificado";
      categories.set(category, (categories.get(category) || 0) + 1);
      if (typeof record.confidenceScore === "number") { confidenceTotal += record.confidenceScore; confidenceCount += 1; }
      if ((record.status || "Novo") === "Fechado") {
        const events = record.timeline || [];
        const closedEvent = [...events].reverse().find((event) => event.stage === "Fechado");
        if (closedEvent) {
          const duration = new Date(closedEvent.time).getTime() - new Date(record.createdAt).getTime();
          if (duration >= 0) { closedDurationTotal += duration; closedDurationCount += 1; }
        }
      }
    });

    const open = history.filter((record) => (record.status || "Novo") !== "Fechado").length;
    const closed = history.length - open;
    const avgRisk = history.length ? Math.round(history.reduce((sum, record) => sum + (record.riskScore || 0), 0) / history.length) : 0;
    const avgConfidence = confidenceCount ? Math.round(confidenceTotal / confidenceCount) : 0;
    const mttrHours = closedDurationCount ? closedDurationTotal / closedDurationCount / 3600000 : 0;
    const closureRate = history.length ? Math.round((closed / history.length) * 100) : 0;
    const topMitre = [...mitre.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    const topCategories = [...categories.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    const last7 = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - offset));
      const next = new Date(date); next.setDate(next.getDate() + 1);
      return {
        label: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        count: history.filter((record) => {
          const created = new Date(record.createdAt);
          return created >= date && created < next;
        }).length,
      };
    });

    return { severity, priority, open, closed, avgRisk, avgConfidence, mttrHours, closureRate, topMitre, topCategories, last7 };
  }, [history]);

  const maxSeverity = Math.max(1, ...Object.values(metrics.severity));
  const maxCategory = Math.max(1, ...metrics.topCategories.map(([, count]) => count));
  const maxDay = Math.max(1, ...metrics.last7.map((day) => day.count));
  const formatMttr = metrics.mttrHours === 0 ? "—" : metrics.mttrHours < 1 ? `${Math.round(metrics.mttrHours * 60)} min` : `${metrics.mttrHours.toFixed(1)} h`;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400"><Activity className="w-4 h-4" /><span>SOC Operations Dashboard</span></div>
          <h2 className="text-xl font-bold text-slate-100 mt-1">Visão operacional dos incidentes</h2>
        </div>
        <span className="text-[11px] font-mono text-slate-500">Dados armazenados neste navegador</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={<ShieldAlert className="w-4 h-4 text-cyan-400" />} label="Incidentes" value={history.length} />
        <MetricCard icon={<AlertTriangle className="w-4 h-4 text-orange-400" />} label="Em aberto" value={metrics.open} />
        <MetricCard icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} label="Fechados" value={metrics.closed} />
        <MetricCard icon={<Activity className="w-4 h-4 text-purple-400" />} label="Risco médio" value={`${metrics.avgRisk}/100`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={<Gauge className="w-4 h-4 text-cyan-400" />} label="Confiança média" value={`${metrics.avgConfidence}/100`} />
        <MetricCard icon={<Clock3 className="w-4 h-4 text-amber-400" />} label="MTTR estimado" value={formatMttr} />
        <MetricCard icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} label="Taxa de fechamento" value={`${metrics.closureRate}%`} />
        <MetricCard icon={<TrendingUp className="w-4 h-4 text-blue-400" />} label="Últimos 7 dias" value={metrics.last7.reduce((sum, day) => sum + day.count, 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-slate-200">Distribuição por severidade</h3><div className="flex gap-2 text-[10px] font-mono text-slate-500"><span>P1 {metrics.priority.P1}</span><span>P2 {metrics.priority.P2}</span><span>P3 {metrics.priority.P3}</span><span>P4 {metrics.priority.P4}</span></div></div>
          <div className="space-y-3">{Object.entries(metrics.severity).map(([label, count]) => <div key={label} className="grid grid-cols-[70px_1fr_28px] items-center gap-3 text-xs"><span className="text-slate-400">{label}</span><div className="h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(count / maxSeverity) * 100}%` }} /></div><span className="text-right font-mono text-slate-300">{count}</span></div>)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4"><Crosshair className="w-4 h-4 text-cyan-400" /><h3 className="text-sm font-semibold text-slate-200">Top MITRE ATT&CK</h3></div>
          {metrics.topMitre.length === 0 ? <p className="text-xs text-slate-500">Analise incidentes para visualizar técnicas recorrentes.</p> : <div className="space-y-2">{metrics.topMitre.map(([id, count]) => <div key={id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2"><span className="font-mono text-xs text-cyan-300">{id}</span><span className="text-[10px] text-slate-500">{count} ocorrência{count === 1 ? "" : "s"}</span></div>)}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Categorias mais frequentes</h3>
          {metrics.topCategories.length === 0 ? <p className="text-xs text-slate-500">Nenhum incidente registrado.</p> : <div className="space-y-3">{metrics.topCategories.map(([category, count]) => <div key={category} className="space-y-1"><div className="flex justify-between gap-3 text-xs"><span className="text-slate-300 truncate">{category}</span><span className="font-mono text-slate-500">{count}</span></div><div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(count / maxCategory) * 100}%` }} /></div></div>)}</div>}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Volume de incidentes • 7 dias</h3>
          <div className="h-28 flex items-end gap-2">{metrics.last7.map((day) => <div key={day.label} className="flex-1 h-full flex flex-col justify-end items-center gap-2"><span className="text-[10px] font-mono text-slate-500">{day.count}</span><div className="w-full max-w-10 bg-cyan-500/80 rounded-t" style={{ height: `${Math.max(day.count ? 12 : 2, (day.count / maxDay) * 75)}%` }} /><span className="text-[10px] text-slate-500 capitalize">{day.label}</span></div>)}</div>
        </div>
      </div>
    </section>
  );
};

const MetricCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="flex items-center gap-2 text-[10px] font-mono uppercase text-slate-500 mb-2">{icon}<span>{label}</span></div><div className="text-2xl font-bold text-slate-100">{value}</div></div>;
