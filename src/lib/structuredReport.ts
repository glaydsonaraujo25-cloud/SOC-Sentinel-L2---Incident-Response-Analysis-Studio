import {
  ActionItem,
  ExtractedIOC,
  ParsedReportData,
  StructuredIncidentAnalysis,
} from "../types";
import { MITRE_CATALOG, getMitreTechniqueUrl } from "../data/mitreCatalog";
import { enrichIOC, validateIOCFormat } from "./ioc";

function joinLines(items: string[]) {
  return items.filter(Boolean).join("\n");
}

export function structuredAnalysisToParsedData(
  analysis: StructuredIncidentAnalysis,
): ParsedReportData {
  const iocs: ExtractedIOC[] = (analysis.iocs || [])
    .filter((ioc) => ioc.value?.trim())
    .map((ioc) => {
      const enriched = enrichIOC(
        { type: ioc.type, value: ioc.value.trim() },
        "Structured AI",
      );
      return {
        ...enriched,
        confidence: validateIOCFormat(ioc.type, ioc.value)
          ? ioc.confidence
          : "Baixa",
        notes: ioc.evidence || enriched.notes,
      };
    });

  const immediateActions: ActionItem[] = (analysis.immediateActions || []).map(
    (text, index) => ({
      id: `act-${index + 1}`,
      text,
      completed: false,
    }),
  );

  const seen = new Set<string>();
  const mitreTechniques = (analysis.mitre || [])
    .filter((item) => /^T\d{4}(?:\.\d{3})?$/.test(item.id || ""))
    .filter((item) => {
      const id = item.id.toUpperCase();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((item) => {
      const id = item.id.toUpperCase();
      const catalog = MITRE_CATALOG[id];
      return {
        id,
        name: catalog?.name || "Técnica não validada no catálogo local",
        tactic: catalog?.tactic || "Revisão necessária",
        description: item.reason,
        validated: Boolean(catalog),
        officialUrl: getMitreTechniqueUrl(id),
      };
    });

  return {
    summary: analysis.summary,
    category: analysis.classification.category,
    severity: analysis.classification.severity,
    likelihood: analysis.classification.likelihood,
    iocs,
    possibleAttack: analysis.possibleAttack,
    impact: analysis.impact,
    immediateActions,
    investigationLogs: joinLines(analysis.investigation || []),
    recommendations: joinLines(analysis.recommendations || []),
    mitreTechniques,
    priority: analysis.priority.level,
    priorityJustification: analysis.priority.justification,
  };
}

export function structuredAnalysisToMarkdown(
  analysis: StructuredIncidentAnalysis,
): string {
  const labels: Record<string, string> = {
    IP: "Endereços IP",
    Domain: "Domínios",
    Hash: "Hashes",
    File: "Arquivos",
    Process: "Processos",
    URL: "URLs",
  };

  const iocGroups = ["IP", "Domain", "Hash", "File", "Process", "URL"].map((type) => {
    const values = analysis.iocs
      .filter((ioc) => ioc.type === type)
      .map((ioc) => ioc.value)
      .join(", ");
    return `- ${labels[type]}: ${values || "Não informado"}`;
  });

  const mitre = analysis.mitre.length
    ? analysis.mitre.map((item) => `- ${item.id} - ${item.reason}`).join("\n")
    : "- Nenhuma técnica identificada com confiança.";

  return `## Resumo\n${analysis.summary}\n\n## Classificação\n- Categoria: ${analysis.classification.category}\n- Severidade: ${analysis.classification.severity}\n- Probabilidade de comprometimento: ${analysis.classification.likelihood}\n\n## Indicadores de Comprometimento (IOCs)\n${iocGroups.join("\n")}\n\n## Possível ataque\n${analysis.possibleAttack}\n\n## Impacto\n${analysis.impact}\n\n## Ações imediatas\n${analysis.immediateActions.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\n## Investigação\n${analysis.investigation.map((item) => `- ${item}`).join("\n")}\n\n## Recomendações\n${analysis.recommendations.map((item) => `- ${item}`).join("\n")}\n\n## MITRE ATT&CK\n${mitre}\n\n## Prioridade\n${analysis.priority.level} - ${analysis.priority.justification}`;
}
