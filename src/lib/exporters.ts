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
