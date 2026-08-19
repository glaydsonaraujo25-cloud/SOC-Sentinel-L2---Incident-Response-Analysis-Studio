import React, { useMemo } from "react";
import { IncidentAnalysisRecord } from "../types";
import { BookOpenCheck, CheckCircle2, Circle } from "lucide-react";

interface PlaybookPanelProps {
  record: IncidentAnalysisRecord;
  onUpdateRecord: (record: IncidentAnalysisRecord) => void;
}

type Playbook = { name: string; description: string; steps: string[] };

const PLAYBOOKS: Record<string, Playbook> = {
  phishing: {
    name: "Phishing / Credential Theft",
    description: "Contenção de campanha de phishing e possível comprometimento de credenciais.",
    steps: [
      "Preservar o e-mail original e coletar headers completos.",
      "Extrair e bloquear URLs, domínios e remetentes maliciosos.",
      "Identificar destinatários e verificar quem clicou ou enviou credenciais.",
      "Revogar sessões ativas e redefinir credenciais de usuários afetados.",
      "Revisar MFA, regras de caixa de e-mail e logins anômalos.",
      "Buscar mensagens semelhantes em todo o ambiente e removê-las.",
    ],
  },
  ransomware: {
    name: "Ransomware / Malware",
    description: "Resposta inicial para malware, ransomware e execução maliciosa em endpoints.",
    steps: [
      "Isolar hosts afetados via EDR sem desligá-los abruptamente.",
      "Coletar memória, artefatos e telemetria antes da erradicação.",
      "Identificar patient zero e vetor inicial de acesso.",
      "Bloquear hashes, domínios, IPs e infraestrutura C2 identificada.",
      "Investigar movimentação lateral e uso de credenciais privilegiadas.",
      "Validar integridade e disponibilidade dos backups antes da recuperação.",
    ],
  },
  credentials: {
    name: "Credential Compromise",
    description: "Tratamento de credenciais expostas, roubadas ou utilizadas indevidamente.",
    steps: [
      "Revogar sessões, tokens e refresh tokens do usuário afetado.",
      "Redefinir senha e invalidar credenciais relacionadas.",
      "Revisar eventos de autenticação, MFA e dispositivos registrados.",
      "Investigar acessos anômalos e alterações de privilégios.",
      "Verificar persistência em e-mail, cloud, VPN e aplicações corporativas.",
      "Aplicar MFA resistente a phishing quando disponível.",
    ],
  },
  generic: {
    name: "General Incident Response",
    description: "Playbook base para triagem, contenção e preservação de evidências.",
    steps: [
      "Confirmar escopo, ativos afetados e criticidade do incidente.",
      "Preservar evidências e registrar horário de cada ação tomada.",
      "Conter indicadores e ativos comprometidos de forma proporcional.",
      "Coletar logs relevantes de endpoint, rede, identidade e cloud.",
      "Validar hipóteses antes de tratar inferências como fatos.",
      "Documentar causa raiz, impacto, recuperação e ações preventivas.",
    ],
  },
};

function selectPlaybook(record: IncidentAnalysisRecord): Playbook {
  const text = `${record.input.tipo} ${record.parsedData.category} ${record.rawMarkdown}`.toLowerCase();
  if (text.includes("phishing") || text.includes("spearphishing")) return PLAYBOOKS.phishing;
  if (text.includes("ransomware") || text.includes("malware")) return PLAYBOOKS.ransomware;
  if (text.includes("credential") || text.includes("credencial") || text.includes("valid accounts")) return PLAYBOOKS.credentials;
  return PLAYBOOKS.generic;
}

export const PlaybookPanel: React.FC<PlaybookPanelProps> = ({ record, onUpdateRecord }) => {
  const playbook = useMemo(() => selectPlaybook(record), [record.id, record.input.tipo, record.parsedData.category]);
  const completed = record.playbookCompleted || [];

  const toggle = (index: number) => {
    const id = `${playbook.name}-${index}`;
    const next = completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id];
    onUpdateRecord({ ...record, playbookCompleted: next });
  };

  const done = playbook.steps.filter((_, index) => completed.includes(`${playbook.name}-${index}`)).length;
  const percent = Math.round((done / playbook.steps.length) * 100);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan-400">
            <BookOpenCheck className="w-4 h-4" />
            <span>IR Playbook recomendado</span>
          </div>
          <h3 className="text-base font-bold text-slate-100 mt-1">{playbook.name}</h3>
          <p className="text-xs text-slate-500 mt-1">{playbook.description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl font-bold text-slate-100">{percent}%</div>
          <div className="text-[10px] font-mono text-slate-500">{done}/{playbook.steps.length} etapas</div>
        </div>
      </div>

      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>

      <div className="space-y-2">
        {playbook.steps.map((step, index) => {
          const id = `${playbook.name}-${index}`;
          const checked = completed.includes(id);
          return (
            <button key={id} onClick={() => toggle(index)} className={`w-full text-left flex items-start gap-3 rounded-lg border p-3 transition-colors ${checked ? "border-emerald-900 bg-emerald-950/20" : "border-slate-800 bg-slate-950/50 hover:border-slate-700"}`}>
              {checked ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />}
              <span className={`text-xs leading-relaxed ${checked ? "text-slate-500 line-through" : "text-slate-300"}`}>{step}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
