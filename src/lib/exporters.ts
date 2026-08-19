import { IncidentAnalysisRecord } from "../types";

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportIncidentJson(record: IncidentAnalysisRecord) {
  downloadBlob(
    JSON.stringify(record, null, 2),
    `SOC-Incident-${record.parsedData.priority}-${record.id}.json`,
    "application/json;charset=utf-8",
  );
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportIncidentIocsCsv(record: IncidentAnalysisRecord) {
  const header = ["type", "value", "confidence", "source", "validFormat", "notes"];
  const rows = record.parsedData.iocs.map((ioc) => [
    ioc.type,
    ioc.value,
    ioc.confidence || "",
    ioc.source || "",
    ioc.validFormat === undefined ? "" : ioc.validFormat ? "true" : "false",
    ioc.notes || "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadBlob(csv, `SOC-IOCs-${record.id}.csv`, "text/csv;charset=utf-8");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function exportIncidentPdf(record: IncidentAnalysisRecord) {
  const printable = window.open("", "_blank", "noopener,noreferrer");
  if (!printable) return;

  const report = escapeHtml(record.rawMarkdown)
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n/g, "<br />");

  printable.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>SOC Sentinel - ${escapeHtml(record.id)}</title>
<style>
  body{font-family:Arial,sans-serif;color:#111827;margin:40px;line-height:1.5}
  h1{font-size:24px;margin-bottom:4px} h2{font-size:17px;margin-top:24px;border-bottom:1px solid #d1d5db;padding-bottom:6px}
  .meta{font-size:12px;color:#4b5563;margin-bottom:24px}.badge{display:inline-block;border:1px solid #9ca3af;border-radius:6px;padding:4px 8px;margin-right:6px}
  li{margin-left:18px} @media print{body{margin:18mm}.no-print{display:none}}
</style>
</head>
<body>
<h1>SOC Sentinel L2 — Relatório de Incidente</h1>
<div class="meta">
  <span class="badge">Prioridade ${escapeHtml(record.parsedData.priority)}</span>
  <span class="badge">Severidade ${escapeHtml(record.parsedData.severity)}</span>
  <span class="badge">Risk Score ${record.riskScore ?? 0}/100</span><br /><br />
  ID: ${escapeHtml(record.id)}<br />
  Gerado em: ${escapeHtml(new Date(record.createdAt).toLocaleString("pt-BR"))}<br />
  Status: ${escapeHtml(record.status || "Novo")}
</div>
<div>${report}</div>
<script>window.onload=()=>setTimeout(()=>window.print(),200);</script>
</body>
</html>`);
  printable.document.close();
}
