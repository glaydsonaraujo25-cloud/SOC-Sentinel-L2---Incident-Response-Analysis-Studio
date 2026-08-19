export interface MitreCatalogEntry {
  name: string;
  tactic: string;
}

// Curated Enterprise ATT&CK techniques commonly encountered in SOC triage.
// Unknown IDs are preserved by the UI but marked as not locally validated.
export const MITRE_CATALOG: Record<string, MitreCatalogEntry> = {
  "T1003": { name: "OS Credential Dumping", tactic: "Credential Access" },
  "T1003.001": { name: "LSASS Memory", tactic: "Credential Access" },
  "T1021.001": { name: "Remote Desktop Protocol", tactic: "Lateral Movement" },
  "T1021.002": { name: "SMB/Windows Admin Shares", tactic: "Lateral Movement" },
  "T1041": { name: "Exfiltration Over C2 Channel", tactic: "Exfiltration" },
  "T1053.005": { name: "Scheduled Task/Job: Scheduled Task", tactic: "Persistence / Privilege Escalation" },
  "T1055": { name: "Process Injection", tactic: "Defense Evasion / Privilege Escalation" },
  "T1059": { name: "Command and Scripting Interpreter", tactic: "Execution" },
  "T1059.001": { name: "PowerShell", tactic: "Execution" },
  "T1059.003": { name: "Windows Command Shell", tactic: "Execution" },
  "T1071.001": { name: "Web Protocols", tactic: "Command and Control" },
  "T1078": { name: "Valid Accounts", tactic: "Initial Access / Persistence / Privilege Escalation / Defense Evasion" },
  "T1078.002": { name: "Domain Accounts", tactic: "Initial Access / Persistence / Privilege Escalation / Defense Evasion" },
  "T1078.004": { name: "Cloud Accounts", tactic: "Initial Access / Persistence / Privilege Escalation / Defense Evasion" },
  "T1090": { name: "Proxy", tactic: "Command and Control" },
  "T1105": { name: "Ingress Tool Transfer", tactic: "Command and Control" },
  "T1110": { name: "Brute Force", tactic: "Credential Access" },
  "T1190": { name: "Exploit Public-Facing Application", tactic: "Initial Access" },
  "T1485": { name: "Data Destruction", tactic: "Impact" },
  "T1486": { name: "Data Encrypted for Impact", tactic: "Impact" },
  "T1543.003": { name: "Windows Service", tactic: "Persistence / Privilege Escalation" },
  "T1547.001": { name: "Registry Run Keys / Startup Folder", tactic: "Persistence / Privilege Escalation" },
  "T1555": { name: "Credentials from Password Stores", tactic: "Credential Access" },
  "T1566": { name: "Phishing", tactic: "Initial Access" },
  "T1566.001": { name: "Spearphishing Attachment", tactic: "Initial Access" },
  "T1566.002": { name: "Spearphishing Link", tactic: "Initial Access" },
};

export function getMitreTechniqueUrl(id: string) {
  const normalized = id.trim().toUpperCase();
  const [base, sub] = normalized.split(".");
  return sub
    ? `https://attack.mitre.org/techniques/${base}/${sub}/`
    : `https://attack.mitre.org/techniques/${base}/`;
}
