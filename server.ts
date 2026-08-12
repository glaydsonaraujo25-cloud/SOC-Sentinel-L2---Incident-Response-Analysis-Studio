import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini API client on server side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Endpoint for Incident Analysis
app.post("/api/analyze-incident", async (req, res) => {
  try {
    const { descricao, tipo, criticidade, contextoAdicional } = req.body;

    if (!descricao || !tipo || !criticidade) {
      return res.status(400).json({
        error: "Campos obrigatórios ausentes: descrição, tipo e criticidade são necessários.",
      });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Você é um Analista SOC Nível 2 altamente experiente, especialista em segurança cibernética, forense computacional, resposta a incidentes e inteligência de ameaças.
Analise o incidente fornecido com rigor técnico e responda estritamente no formato solicitado.

Sua resposta deve conter EXATAMENTE estas 10 seções em Markdown e na exata ordem abaixo em português do Brasil:

## Resumo
Explique o ocorrido em poucas linhas de forma concisa, clara e objetiva para liderança e time de segurança.

## Classificação
Informe expressamente:
- Categoria: [Categoria técnica do incidente, ex: Malware / Ransomware, Credential Harvesting, Web Exploitation, Cloud Compromise, Lateral Movement]
- Severidade: [Baixa, Média, Alta ou Crítica]
- Probabilidade de comprometimento: [Baixa, Média, Alta ou Confirmada]

## Indicadores de Comprometimento (IOCs)
Liste de forma clara e categorizada:
- Endereços IP: [IPs externos/suspicios ou N/A]
- Domínios: [Domínios maliciosos/C2/phishing ou N/A]
- Hashes: [MD5/SHA256 de artefatos maliciosos ou N/A]
- Arquivos: [Caminhos e nomes de arquivos executados ou N/A]
- Processos: [Processos e linhas de comando executadas ou N/A]
- URLs: [URLs maliciosas ou N/A]
Se algum tipo de IOC não estiver presente no relato, informe expressamente "Nenhum identificado" ou "Não informado".

## Possível ataque
Explique detalhadamente qual técnica, vetor de ataque, ferramenta ou vulnerabilidade provavelmente foi explorada, detalhando a cadeia de destruição/infecção (Kill Chain).

## Impacto
Explique quais sistemas, redes, ativos, dados sensíveis (PII, credenciais, segredos) ou processos de negócios podem ter sido afetados ou exfiltrados.

## Ações imediatas
Liste em marcadores numerados/com hífens PELO MENOS 5 ações práticas e imediatas que o time do SOC / Incident Response deve executar sem demora (ex: isolar host via EDR, bloquear IPs/domínios no firewall/proxy, revogar tokens de sessão no Entra ID/Okta, redefinir senhas, coletar dump de memória/triage forense, revogar chaves de API).

## Investigação
Explique detalhadamente quais logs específicos devem ser analisados para contenção e análise profunda (ex: Event ID 4624/4672/4688 no Windows, Sysmon Event ID 1/3/7/10, logs de EDR/Antivírus, logs de DNS, Proxy, NGFW, AWS CloudTrail / Azure Activity Logs, M365 Unified Audit Log).

## Recomendações
Sugira melhorias estruturais, táticas e preventivas para impedir a reincidência deste incidente (hardening de GPO, políticas de acesso condicional/MFA FIDO2, EDR tuning, microsegmentação, scanner de vulnerabilidades, treinamentos).

## MITRE ATT&CK
Informe as técnicas do MITRE ATT&CK com seus respectivos códigos (ex: T1059.001 - PowerShell, T1003.001 - LSASS Memory, T1566.001 - Spearphishing Attachment, etc.) que estão relacionadas a este evento e explique brevemente por que cada uma se aplica ao caso.

## Prioridade
Informe expressamente a prioridade de resposta como P1, P2, P3 ou P4 e apresente uma justificativa técnica detalhada baseada no impacto, criticidade do ativo e severidade da ameaça.`;

    const userPrompt = `Análise de Incidente de Segurança Cibernética (SOC Nível 2):

Descrição:
${descricao}

Tipo:
${tipo}

Criticidade do ativo:
${criticidade}

${contextoAdicional ? `Contexto Adicional / Logs / Telemetria:\n${contextoAdicional}` : ''}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for consistent structured SOC analysis
      },
    });

    const reportText = response.text || "";

    return res.json({
      report: reportText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erro na análise do incidente:", error);
    return res.status(500).json({
      error: "Ocorreu um erro ao processar a análise do incidente com o modelo de IA.",
      details: error?.message || String(error),
    });
  }
});

// Start Express and integrate Vite in development mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server SOC Sentinel running on http://localhost:${PORT}`);
  });
}

startServer();
