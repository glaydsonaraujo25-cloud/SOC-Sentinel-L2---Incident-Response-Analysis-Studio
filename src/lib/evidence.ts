import { EvidenceArtifact, ExtractedIOC, TimelineEvent } from "../types";

const IP_REGEX = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const URL_REGEX = /https?:\/\/[^\s"'<>]+/gi;
const HASH_REGEX = /\b(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})\b/gi;
const DOMAIN_REGEX = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b/gi;
const TIMESTAMP_REGEX = /\b(?:\d{4}-\d{2}-\d{2}[T ][0-2]\d:[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?|\d{2}\/\d{2}\/\d{4}[ T][0-2]\d:[0-5]\d(?::[0-5]\d)?)\b/g;

function uniq(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function validIp(value: string) {
  const parts = value.split(".");
  return parts.length === 4 && parts.every((part) => Number(part) >= 0 && Number(part) <= 255);
}

export function analyzeEvidenceText(name: string, type: string, size: number, content: string): EvidenceArtifact {
  const urls = uniq(content.match(URL_REGEX) || []);
  const hashes = uniq(content.match(HASH_REGEX) || []);
  const ips = uniq((content.match(IP_REGEX) || []).filter(validIp));
  const urlHosts = new Set<string>();
  for (const url of urls) {
    try { urlHosts.add(new URL(url).hostname.toLowerCase()); } catch { /* ignore */ }
  }
  const domains = uniq((content.match(DOMAIN_REGEX) || []).filter((domain) => !urlHosts.has(domain.toLowerCase())));
  const timestamps = uniq(content.match(TIMESTAMP_REGEX) || []).slice(0, 50);

  const extractedIocs: EvidenceArtifact["extractedIocs"] = [
    ...ips.map((value) => ({ type: "IP" as const, value })),
    ...domains.map((value) => ({ type: "Domain" as const, value })),
    ...hashes.map((value) => ({ type: "Hash" as const, value })),
    ...urls.map((value) => ({ type: "URL" as const, value })),
  ];

  return { name, type, size, content, extractedIocs, timestamps };
}

export function evidenceToContext(evidence: EvidenceArtifact[]) {
  if (!evidence.length) return "";
  return evidence.map((item) => {
    const iocs = item.extractedIocs?.map((ioc) => `${ioc.type}: ${ioc.value}`).join("\n") || "Nenhum IOC extraído";
    const timestamps = item.timestamps?.join(", ") || "Nenhum timestamp extraído";
    return `[EVIDÊNCIA: ${item.name}]\n${item.content.slice(0, 12000)}\n\nIOCs extraídos localmente:\n${iocs}\nTimestamps: ${timestamps}`;
  }).join("\n\n---\n\n");
}

export function evidenceIocs(evidence: EvidenceArtifact[]): ExtractedIOC[] {
  const seen = new Set<string>();
  const result: ExtractedIOC[] = [];
  for (const artifact of evidence) {
    for (const ioc of artifact.extractedIocs || []) {
      const key = `${ioc.type}:${ioc.value.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        type: ioc.type,
        value: ioc.value,
        confidence: "Alta",
        source: "Evidence Upload",
        validFormat: true,
        notes: `Extraído diretamente do arquivo ${artifact.name}.`,
      });
    }
  }
  return result;
}

function parseTimestamp(value: string) {
  const normalized = /^\d{2}\/\d{2}\/\d{4}/.test(value)
    ? value.replace(/^(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1")
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function evidenceTimelineEvents(evidence: EvidenceArtifact[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const artifact of evidence) {
    for (const timestamp of artifact.timestamps || []) {
      const iso = parseTimestamp(timestamp);
      if (!iso) continue;
      events.push({
        id: `evt-evidence-${artifact.name}-${events.length}`,
        time: iso,
        stage: "Evidência",
        description: `Evento temporal extraído da evidência ${artifact.name}.`,
        indicator: timestamp,
      });
    }
  }
  return events.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 30);
}
