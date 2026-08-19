export type AssetCriticality = "Baixa" | "Média" | "Alta" | "Crítica";

export type IncidentPriority = "P1" | "P2" | "P3" | "P4";

export type IncidentSeverity = "Baixa" | "Média" | "Alta" | "Crítica";

export type IncidentStatus =
  | "Novo"
  | "Triagem"
  | "Investigando"
  | "Contido"
  | "Erradicado"
  | "Recuperado"
  | "Fechado";

export type IOCConfidence = "Alta" | "Média" | "Baixa";

export interface IncidentInput {
  descricao: string;
  tipo: string;
  criticidade: AssetCriticality;
  contextoAdicional?: string;
  incidentTitle?: string;
}

export interface ExtractedIOC {
  type: "IP" | "Domain" | "Hash" | "File" | "Process" | "URL";
  value: string;
  notes?: string;
  confidence?: IOCConfidence;
  source?: "IOC Section" | "Report Regex" | "Manual";
  validFormat?: boolean;
}

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
  description: string;
}

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  assignedTo?: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  stage: string;
  description: string;
  indicator?: string;
}

export interface ParsedReportData {
  summary: string;
  category: string;
  severity: IncidentSeverity;
  likelihood: string;
  iocs: ExtractedIOC[];
  possibleAttack: string;
  impact: string;
  immediateActions: ActionItem[];
  investigationLogs: string;
  recommendations: string;
  mitreTechniques: MitreTechnique[];
  priority: IncidentPriority;
  priorityJustification: string;
}

export interface IncidentAnalysisRecord {
  id: string;
  createdAt: string;
  input: IncidentInput;
  rawMarkdown: string;
  parsedData: ParsedReportData;
  riskScore?: number;
  status?: IncidentStatus;
  actions?: ActionItem[];
  timeline?: TimelineEvent[];
  playbookCompleted?: string[];
}

export interface IncidentPreset {
  id: string;
  title: string;
  badge: string;
  tipo: string;
  criticidade: AssetCriticality;
  descricao: string;
  contextoAdicional: string;
}
