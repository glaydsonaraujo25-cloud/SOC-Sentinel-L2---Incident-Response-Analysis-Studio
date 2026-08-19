import { ParsedReportData, IncidentPriority } from "../types";
import { enrichIOC } from "./ioc";

export function parseMarkdownReport(rawMarkdown: string): ParsedReportData {
  const result: ParsedReportData = {
    summary: "",
    category: "Geral",
    severity: "Média",
    likelihood: "Média",
    iocs: [],
    possibleAttack: "",
    impact: "",
    immediateActions: [],
    investigationLogs: "",
    recommendations: "",
    mitreTechniques: [],
    priority: "P2",
    priorityJustification: "",
  };

  if (!rawMarkdown) return result;

  const sections: Record<string, string> = {};
  const splitRegex = /##\s+([^\n]+)/g;
  const matches: { title: string; index: number; textIndex: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = splitRegex.exec(rawMarkdown)) !== null) {
    matches.push({ title: match[1].trim(), index: match.index, textIndex: match.index + match[0].length });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : rawMarkdown.length;
    const content = rawMarkdown.substring(current.textIndex, nextIndex).trim();
    const title = current.title.toLowerCase();

    if (title.includes("resumo")) sections.Resumo = content;
    else if (title.includes("classificação") || title.includes("classificacao")) sections.Classificação = content;
    else if (title.includes("indicadores") || title.includes("ioc")) sections.IOCs = content;
    else if (title.includes("possível ataque") || title.includes("possivel ataque")) sections["Possível ataque"] = content;
    else if (title.includes("impacto")) sections.Impacto = content;
    else if (title.includes("ações imediatas") || title.includes("acoes imediatas")) sections["Ações imediatas"] = content;
    else if (title.includes("investigação") || title.includes("investigacao")) sections.Investigação = content;
    else if (title.includes("recomendações") || title.includes("recomendacoes")) sections.Recomendações = content;
    else if (title.includes("mitre")) sections["MITRE ATT&CK"] = content;
    else if (title.includes("prioridade")) sections.Prioridade = content;
  }

  result.summary = sections.Resumo || "Resumo do incidente não detalhado.";

  if (sections.Classificação) {
    const text = sections.Classificação;
    const category = text.match(/Categoria:\s*([^\n]+)/i)?.[1]?.trim();
    if (category) result.category = category;

    const severity = text.match(/Severidade:\s*([^\n]+)/i)?.[1]?.trim().toLowerCase() || "";
    if (severity.includes("crític") || severity.includes("critic")) result.severity = "Crítica";
    else if (severity.includes("alta")) result.severity = "Alta";
    else if (severity.includes("méd") || severity.includes("med")) result.severity = "Média";
    else if (severity.includes("baix")) result.severity = "Baixa";

    const likelihood = text.match(/Probabilidade[^\n:]*:\s*([^\n]+)/i)?.[1]?.trim();
    if (likelihood) result.likelihood = likelihood;
  }

  if (sections.IOCs) {
    const lines = sections.IOCs.split("\n");
    let currentType: "IP" | "Domain" | "Hash" | "File" | "Process" | "URL" = "IP";

    for (const line of lines) {
      const l = line.trim();
      if (!l) continue;
      const lower = l.toLowerCase();

      if (lower.includes("endereços ip") || lower.includes("enderecos ip") || lower.startsWith("ip:")) currentType = "IP";
      else if (lower.includes("domínio") || lower.includes("dominio")) currentType = "Domain";
      else if (lower.includes("hash")) currentType = "Hash";
      else if (lower.includes("arquivo")) currentType = "File";
      else if (lower.includes("processo")) currentType = "Process";
      else if (lower.includes("url")) currentType = "URL";

      const itemMatch = l.match(/[-*•\d+.]+\s*(.+)/) || l.match(/:\s*(.+)/);
      if (!itemMatch) continue;

      const value = itemMatch[1].trim();
      if (!value || /nenhum|não informado/i.test(value) || value.startsWith("[") || value.length <= 2) continue;

      for (const part of value.split(/[,;\n]/)) {
        const cleaned = part.replace(/^`|`$/g, "").trim();
        if (!cleaned || /^(nenhum|não)/i.test(cleaned) || cleaned.length <= 2) continue;
        result.iocs.push(enrichIOC({ type: currentType, value: cleaned }, "IOC Section"));
      }
    }
  }

  const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  for (const ip of rawMarkdown.match(ipRegex) || []) {
    if (["127.0.0.1", "0.0.0.0"].includes(ip)) continue;
    if (!result.iocs.some((ioc) => ioc.value === ip)) {
      result.iocs.push(enrichIOC({ type: "IP", value: ip }, "Report Regex"));
    }
  }

  result.possibleAttack = sections["Possível ataque"] || "";
  result.impact = sections.Impacto || "";

  if (sections["Ações imediatas"]) {
    let count = 1;
    for (const line of sections["Ações imediatas"].split("\n")) {
      const text = line.trim().match(/^[-*•\d+.]+\s*(.+)/)?.[1]?.trim();
      if (text && text.length > 5) {
        result.immediateActions.push({ id: `act-${count++}`, text, completed: false });
      }
    }
  }

  result.investigationLogs = sections.Investigação || "";
  result.recommendations = sections.Recomendações || "";

  if (sections["MITRE ATT&CK"]) {
    const found = new Set<string>();
    for (const line of sections["MITRE ATT&CK"].split("\n")) {
      const clean = line.trim();
      const id = clean.match(/(T\d{4}(?:\.\d{3})?)/)?.[1];
      if (!id || found.has(id)) continue;
      found.add(id);

      const afterCode = clean.replace(/^.*T\d{4}(?:\.\d{3})?/, "").trim();
      const name = afterCode.replace(/^[-–:]\s*/, "").split(".")[0]?.trim() || "Técnica MITRE";
      let tactic = "Execution / Persistence";
      if (id.startsWith("T1059")) tactic = "Execution";
      else if (["T1003", "T1110", "T1555"].some((p) => id.startsWith(p))) tactic = "Credential Access";
      else if (["T1566", "T1190", "T1195"].some((p) => id.startsWith(p))) tactic = "Initial Access";
      else if (["T1021", "T1055", "T1078"].some((p) => id.startsWith(p))) tactic = "Lateral Movement";
      else if (["T1071", "T1090", "T1105"].some((p) => id.startsWith(p))) tactic = "Command and Control";
      else if (["T1486", "T1485", "T1041"].some((p) => id.startsWith(p))) tactic = "Impact / Exfiltration";
      else if (["T1053", "T1543", "T1547"].some((p) => id.startsWith(p))) tactic = "Persistence";

      result.mitreTechniques.push({ id, name, tactic, description: clean });
    }
  }

  if (sections.Prioridade) {
    const priorityText = sections.Prioridade;
    const priority = priorityText.match(/\b(P1|P2|P3|P4)\b/i)?.[1]?.toUpperCase() as IncidentPriority | undefined;
    if (priority) result.priority = priority;
    result.priorityJustification = priorityText;
  }

  return result;
}
