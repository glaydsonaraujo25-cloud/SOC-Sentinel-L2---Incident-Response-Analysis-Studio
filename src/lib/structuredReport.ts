import {
  ActionItem,
  ExtractedIOC,
  ParsedReportData,
  StructuredIncidentAnalysis,
} from "../types";
import { MITRE_CATALOG, getMitreTechniqueUrl } from "../data/mitreCatalog";
import { enrichIoc } from "./iocValidation";

function joinLines(items: string[]) {
  return items.filter(Boolean).join("\n");
}

export function structuredAnalysisToParsedData(
  analysis: StructuredIncidentAnalysis,
): ParsedReportData {
  const iocs: ExtractedIOC[] = (analysis.iocs || [])
    .filter((ioc) => ioc.value?.trim())
    .map((ioc) =>
      enrichIoc({
        type: ioc.type,
        value: ioc.value.trim(),
        confidence: ioc.confidence,
        source: "Structured AI",
        notes: ioc.evidence || "Extraído da resposta estruturada da IA.",
      }),
    );

  const immediateActions: ActionItem[] = (analysis.immediateActions || []).map(
    (text, index) => ({
      id: `act-${index + 1}`,
      text,
      completed: false,
    }),
  );

  const mitreTechniques = (analysis.mitre || [])
    .filter((item) => /^T\d{4}(?:\.\d{3})?$/.test(item.id || ""))
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
  const iocGroups = ["IP", "Domain", "Hash", "File", "Process", "URL"].map((type) => {
    const values = analysis.iocs
      .filter((ioc) => ioc.type === type)
      .map((ioc) => ioc.value)
      .join(", ");
    return `- ${type}: ${values || "Não informado"}`;
  });

  const mitre = analysis.mitre.length
    ? analysis.mitre.map((item) => `- ${item.id} - ${item.reason}`).join("\n")
    : "- Nenhuma técnica identificada com confiança.";

  return `## Resumo\n${analysis.summary}\n\n## Classificação\n- Categoria: ${analysis.classification.category}\n- Severidade: ${analysis.classification.severity}\n- Probabilidade de comprometimento: ${analysis.classification.likelihood}\n\n## Indicadores de Comprometimento (IOCs)\n${iocGroups.join("\n")}\n\n## Possível ataque\n${analysis.possibleAttack}\n\n## Impacto\n${analysis.impact}\n\n## Ações imediatas\n${analysis.immediateActions.map((item, index) => `${index + 1}. ${item}`).join("\n")}\n\n## Investigação\n${analysis.investigation.map((item) => `- ${item}`).join("\n")}\n\n## Recomendações\n${analysis.recommendations.map((item) => `- ${item}`).join("\n")}\n\n## MITRE ATT&CK\n${mitre}\n\n## Prioridade\n${analysis.priority.level} - ${analysis.priority.justification}`;
}
