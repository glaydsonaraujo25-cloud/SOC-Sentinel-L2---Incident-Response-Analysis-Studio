export type AssetCriticality = "Baixa" | "Média" | "Alta" | "Crítica";
export type IncidentPriority = "P1" | "P2" | "P3" | "P4";
export type IncidentSeverity = "Baixa" | "Média" | "Alta" | "Crítica";
export type IncidentStatus = "Novo" | "Triagem" | "Investigando" | "Contido" | "Erradicado" | "Recuperado" | "Fechado";
export type IOCConfidence = "Alta" | "Média" | "Baixa";

export interface EvidenceArtifact { name: string; type: string; size: number; content: string; extractedIocs?: Array<{ type: "IP" | "Domain" | "Hash" | "URL"; value: string }>; timestamps?: string[]; }
export interface IncidentInput { descricao: string; tipo: string; criticidade: AssetCriticality; contextoAdicional?: string; incidentTitle?: string; evidence?: EvidenceArtifact[]; }
export interface ThreatIntelFinding { provider: "VirusTotal" | "AbuseIPDB"; verdict: "Malicioso" | "Suspeito" | "Limpo" | "Desconhecido"; score?: number; malicious?: number; suspicious?: number; harmless?: number; country?: string; network?: string; reports?: number; checkedAt: string; error?: string; }
export interface ExtractedIOC { type: "IP" | "Domain" | "Hash" | "File" | "Process" | "URL"; value: string; notes?: string; confidence?: IOCConfidence; source?: "IOC Section" | "Report Regex" | "Manual" | "Structured AI" | "Evidence Upload"; validFormat?: boolean; threatIntel?: ThreatIntelFinding[]; }
export interface MitreTechnique { id: string; name: string; tactic: string; description: string; validated?: boolean; officialUrl?: string; }
export interface ActionItem { id: string; text: string; completed: boolean; assignedTo?: string; }
export interface TimelineEvent { id: string; time: string; stage: string; description: string; indicator?: string; }
export interface CaseNote { id: string; createdAt: string; author: string; text: string; }
export interface AuditEntry { id: string; createdAt: string; action: string; actor: string; details?: string; }
export interface CaseManagement { owner?: string; slaTargetAt?: string; notes: CaseNote[]; audit: AuditEntry[]; }
export interface ParsedReportData { summary: string; category: string; severity: IncidentSeverity; likelihood: string; iocs: ExtractedIOC[]; possibleAttack: string; impact: string; immediateActions: ActionItem[]; investigationLogs: string; recommendations: string; mitreTechniques: MitreTechnique[]; priority: IncidentPriority; priorityJustification: string; }
export interface StructuredIncidentAnalysis { summary: string; classification: { category: string; severity: IncidentSeverity; likelihood: "Baixa" | "Média" | "Alta" | "Confirmada"; }; iocs: Array<{ type: "IP" | "Domain" | "Hash" | "File" | "Process" | "URL"; value: string; confidence: IOCConfidence; evidence: string; }>; possibleAttack: string; impact: string; immediateActions: string[]; investigation: string[]; recommendations: string[]; mitre: Array<{ id: string; reason: string; }>; priority: { level: IncidentPriority; justification: string; }; }
export interface IncidentAnalysisRecord { id: string; createdAt: string; input: IncidentInput; rawMarkdown: string; parsedData: ParsedReportData; structuredAnalysis?: StructuredIncidentAnalysis; analysisFormat?: "structured-json" | "legacy-markdown"; riskScore?: number; confidenceScore?: number; status?: IncidentStatus; actions?: ActionItem[]; timeline?: TimelineEvent[]; playbookCompleted?: string[]; caseManagement?: CaseManagement; }
export interface IncidentPreset { id: string; title: string; badge: string; tipo: string; criticidade: AssetCriticality; descricao: string; contextoAdicional: string; }
