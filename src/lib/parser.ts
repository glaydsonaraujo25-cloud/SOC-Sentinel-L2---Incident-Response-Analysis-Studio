import { ParsedReportData, ExtractedIOC, MitreTechnique, ActionItem, IncidentSeverity, IncidentPriority } from "../types";

/**
 * Helper to extract structured metadata and items from the generated Markdown SOC report
 */
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

  // Extract sections using regex or string splitting
  const sections: { [key: string]: string } = {};
  const sectionHeaders = [
    "Resumo",
    "Classificação",
    "Indicadores de Comprometimento (IOCs)",
    "Possível ataque",
    "Impacto",
    "Ações imediatas",
    "Investigação",
    "Recomendações",
    "MITRE ATT&CK",
    "Prioridade",
  ];

  // Regex to match ## Section Header
  const splitRegex = /##\s+([^\n]+)/g;
  let match;
  let matches: { title: string; index: number; textIndex: number }[] = [];

  while ((match = splitRegex.exec(rawMarkdown)) !== null) {
    matches.push({
      title: match[1].trim(),
      index: match.index,
      textIndex: match.index + match[0].length,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : rawMarkdown.length;
    const content = rawMarkdown.substring(current.textIndex, nextIndex).trim();

    // Normalize header name
    const titleLower = current.title.toLowerCase();
    if (titleLower.includes("resumo")) sections["Resumo"] = content;
    else if (titleLower.includes("classificação") || titleLower.includes("classificacao")) sections["Classificação"] = content;
    else if (titleLower.includes("indicadores") || titleLower.includes("iocs") || titleLower.includes("ioc")) sections["IOCs"] = content;
    else if (titleLower.includes("possível ataque") || titleLower.includes("possivel ataque")) sections["Possível ataque"] = content;
    else if (titleLower.includes("impacto")) sections["Impacto"] = content;
    else if (titleLower.includes("ações imediatas") || titleLower.includes("acoes imediatas")) sections["Ações imediatas"] = content;
    else if (titleLower.includes("investigação") || titleLower.includes("investigacao")) sections["Investigação"] = content;
    else if (titleLower.includes("recomendações") || titleLower.includes("recomendacoes")) sections["Recomendações"] = content;
    else if (titleLower.includes("mitre")) sections["MITRE ATT&CK"] = content;
    else if (titleLower.includes("prioridade")) sections["Prioridade"] = content;
  }

  // 1. Summary
  result.summary = sections["Resumo"] || "Resumo do incidente não detalhado.";

  // 2. Classification
  if (sections["Classificação"]) {
    const classText = sections["Classificação"];
    const catMatch = classText.match(/Categoria:\s*([^\n]+)/i);
    if (catMatch) result.category = catMatch[1].trim();

    const sevMatch = classText.match(/Severidade:\s*([^\n]+)/i);
    if (sevMatch) {
      const sevStr = sevMatch[1].trim();
      if (sevStr.toLowerCase().includes("crític") || sevStr.toLowerCase().includes("critic")) result.severity = "Crítica";
      else if (sevStr.toLowerCase().includes("alta")) result.severity = "Alta";
      else if (sevStr.toLowerCase().includes("méd") || sevStr.toLowerCase().includes("med")) result.severity = "Média";
      else if (sevStr.toLowerCase().includes("baix")) result.severity = "Baixa";
    }

    const likeMatch = classText.match(/Probabilidade[^\n:]*:\s*([^\n]+)/i);
    if (likeMatch) result.likelihood = likeMatch[1].trim();
  }

  // 3. IOCs Extraction
  if (sections["IOCs"]) {
    const iocText = sections["IOCs"];
    const lines = iocText.split("\n");
    let currentType: "IP" | "Domain" | "Hash" | "File" | "Process" | "URL" = "IP";

    for (const line of lines) {
      const l = line.trim();
      if (!l) continue;

      if (l.toLowerCase().includes("endereços ip") || l.toLowerCase().includes("enderecos ip") || l.toLowerCase().includes("ip:")) {
        currentType = "IP";
      } else if (l.toLowerCase().includes("domínio") || l.toLowerCase().includes("dominio") || l.toLowerCase().includes("domínios:")) {
        currentType = "Domain";
      } else if (l.toLowerCase().includes("hash") || l.toLowerCase().includes("hashes:")) {
        currentType = "Hash";
      } else if (l.toLowerCase().includes("arquivo") || l.toLowerCase().includes("arquivos:")) {
        currentType = "File";
      } else if (l.toLowerCase().includes("processo") || l.toLowerCase().includes("processos:")) {
        currentType = "Process";
      } else if (l.toLowerCase().includes("url") || l.toLowerCase().includes("urls:")) {
        currentType = "URL";
      }

      // Match item after bullet or colon
      const itemMatch = l.match(/[-*•\d+.]\s*(.+)/) || l.match(/:\s*(.+)/);
      if (itemMatch) {
        const val = itemMatch[1].trim();
        if (val && !val.toLowerCase().includes("nenhum") && !val.toLowerCase().includes("não informado") && !val.startsWith("[") && val.length > 2) {
          // Splitting multiple comma separated values
          const subVals = val.split(/[,;\n]/);
          for (const sv of subVals) {
            const cleaned = sv.replace(/^`|`$/g, "").trim();
            if (cleaned && cleaned.length > 2 && !cleaned.toLowerCase().startsWith("nenhum") && !cleaned.toLowerCase().startsWith("não")) {
              result.iocs.push({
                type: currentType,
                value: cleaned,
              });
            }
          }
        }
      }
    }
  }

  // Also Regex extract IP addresses, MD5/SHA256, domains from the full raw text if IOC list is sparse
  const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const rawIps = rawMarkdown.match(ipRegex) || [];
  for (const ip of rawIps) {
    if (!["127.0.0.1", "0.0.0.0"].includes(ip) && !result.iocs.some((i) => i.value.includes(ip))) {
      result.iocs.push({ type: "IP", value: ip });
    }
  }

  // 4. Possible Attack
  result.possibleAttack = sections["Possível ataque"] || "";

  // 5. Impact
  result.impact = sections["Impacto"] || "";

  // 6. Immediate Actions Checklist
  if (sections["Ações imediatas"]) {
    const actText = sections["Ações imediatas"];
    const lines = actText.split("\n");
    let count = 1;
    for (const l of lines) {
      const trimmed = l.trim();
      const actionMatch = trimmed.match(/^[-*•\d+.]+\s*(.+)/);
      if (actionMatch) {
        const text = actionMatch[1].trim();
        if (text && text.length > 5) {
          result.immediateActions.push({
            id: `act-${count++}`,
            text,
            completed: false,
          });
        }
      }
    }
  }

  // 7. Investigation
  result.investigationLogs = sections["Investigação"] || "";

  // 8. Recommendations
  result.recommendations = sections["Recomendações"] || "";

  // 9. MITRE ATT&CK Parsing
  if (sections["MITRE ATT&CK"]) {
    const mitreText = sections["MITRE ATT&CK"];
    // Look for TXXXX or TXXXX.XXX patterns
    const techRegex = /(T\d{4}(?:\.\d{3})?)(?:\s*[-:]\s*|\s+)?([^:\n\.\(\)]+)?/g;
    let mMatch;
    const foundIds = new Set<string>();

    const lines = mitreText.split("\n");
    for (const l of lines) {
      const lineTrim = l.trim();
      const codeMatch = lineTrim.match(/(T\d{4}(?:\.\d{3})?)/);
      if (codeMatch) {
        const id = codeMatch[1];
        if (!foundIds.has(id)) {
          foundIds.add(id);
          // Try to extract technique name & explanation
          let name = "Técnica MITRE";
          const afterCode = lineTrim.replace(/^.*T\d{4}(?:\.\d{3})?/, "").trim();
          if (afterCode) {
            const cleanName = afterCode.replace(/^[-–:]\s*/, "").split(".")[0];
            if (cleanName) name = cleanName.trim();
          }

          // Assign Tactic based on standard MITRE IDs
          let tactic = "Execution / Persistence";
          if (id.startsWith("T1059")) tactic = "Execution";
          else if (id.startsWith("T1003") || id.startsWith("T1110") || id.startsWith("T1555")) tactic = "Credential Access";
          else if (id.startsWith("T1566") || id.startsWith("T1190") || id.startsWith("T1195")) tactic = "Initial Access";
          else if (id.startsWith("T1021") || id.startsWith("T1055") || id.startsWith("T1078")) tactic = "Lateral Movement";
          else if (id.startsWith("T1071") || id.startsWith("T1090") || id.startsWith("T1105")) tactic = "Command and Control";
          else if (id.startsWith("T1486") || id.startsWith("T1485") || id.startsWith("T1041")) tactic = "Impact / Exfiltration";
          else if (id.startsWith("T1053") || id.startsWith("T1543") || id.startsWith("T1547")) tactic = "Persistence";

          result.mitreTechniques.push({
            id,
            name,
            tactic,
            description: lineTrim,
          });
        }
      }
    }
  }

  // 10. Priority Extraction
  if (sections["Prioridade"]) {
    const prioText = sections["Prioridade"];
    const matchPrio = prioText.match(/\b(P1|P2|P3|P4)\b/i);
    if (matchPrio) {
      result.priority = matchPrio[1].toUpperCase() as IncidentPriority;
    } else if (prioText.toLowerCase().includes("p1") || prioText.toLowerCase().includes("prioridade 1")) {
      result.priority = "P1";
    } else if (prioText.toLowerCase().includes("p2") || prioText.toLowerCase().includes("prioridade 2")) {
      result.priority = "P2";
    } else if (prioText.toLowerCase().includes("p3") || prioText.toLowerCase().includes("prioridade 3")) {
      result.priority = "P3";
    } else if (prioText.toLowerCase().includes("p4") || prioText.toLowerCase().includes("prioridade 4")) {
      result.priority = "P4";
    }
    result.priorityJustification = prioText;
  }

  return result;
}
