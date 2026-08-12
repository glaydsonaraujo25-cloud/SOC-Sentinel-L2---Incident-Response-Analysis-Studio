import React, { useState } from "react";
import { IncidentAnalysisRecord } from "../types";
import { Copy, Check, X, Ticket, Send } from "lucide-react";

interface TicketModalProps {
  record: IncidentAnalysisRecord;
  onClose: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({ record, onClose }) => {
  const [copied, setCopied] = useState(false);
  const { input, parsedData } = record;

  const ticketSubject = `[SOC-INCIDENT] [${parsedData.priority}] - ${input.tipo} (${input.criticidade})`;

  const ticketBody = `=====================================================
SOC INCIDENT RESPONSE ESCALATION TICKET
=====================================================
Ticket ID: INC-${record.id.substring(0, 8).toUpperCase()}
Data de Registro: ${new Date(record.createdAt).toLocaleString('pt-BR')}
Prioridade de Resposta: ${parsedData.priority}
Severidade do Ativo: ${parsedData.severity}
Criticidade do Ativo: ${input.criticidade}
Categoria do Incidente: ${parsedData.category}

-----------------------------------------------------
1. RESUMO EXECUTIVO
-----------------------------------------------------
${parsedData.summary}

-----------------------------------------------------
2. VETOR DE ATAQUE / TÉCNICA PROVÁVEL
-----------------------------------------------------
${parsedData.possibleAttack}

-----------------------------------------------------
3. INDICADORES DE COMPROMETIMENTO (IOCs)
-----------------------------------------------------
${
  parsedData.iocs.length > 0
    ? parsedData.iocs.map((i) => `[${i.type}] ${i.value}`).join("\n")
    : "Nenhum IOC direto identificado."
}

-----------------------------------------------------
4. AÇÕES IMEDIATAS DE CONTENÇÃO (CHECKLIST SOC)
-----------------------------------------------------
${parsedData.immediateActions.map((a, idx) => `[ ] ${idx + 1}. ${a.text}`).join("\n")}

-----------------------------------------------------
5. LOGS E TELEMETRIA PARA INVESTIGAÇÃO
-----------------------------------------------------
${parsedData.investigationLogs}

-----------------------------------------------------
6. MITRE ATT&CK TECHNIQUES
-----------------------------------------------------
${parsedData.mitreTechniques.map((m) => `${m.id} - ${m.name} (${m.tactic})`).join("\n")}

-----------------------------------------------------
7. JUSTIFICATIVA DE PRIORIDADE (${parsedData.priority})
-----------------------------------------------------
${parsedData.priorityJustification}
=====================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${ticketSubject}\n\n${ticketBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-100 font-bold text-base">
            <Ticket className="w-5 h-5 text-cyan-400" />
            <span>Formato do Ticket de Escalhação (Jira / ServiceNow / OpsGenie)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase">Assunto do Ticket:</label>
            <input
              type="text"
              readOnly
              value={ticketSubject}
              className="w-full bg-slate-950 border border-slate-800 text-cyan-300 p-2.5 rounded-lg outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1 uppercase">Corpo do Chamado:</label>
            <textarea
              readOnly
              rows={16}
              value={ticketBody}
              className="w-full bg-slate-950 border border-slate-800 text-slate-300 p-3 rounded-lg outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <span className="text-xs text-slate-400">
            Copie o formato acima para colar diretamente na sua ferramenta de ITSM/SIEM.
          </span>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Chamado</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
