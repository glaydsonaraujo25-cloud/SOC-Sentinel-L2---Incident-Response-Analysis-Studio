# SOC Sentinel L2

**AI-Assisted Incident Response & Threat Analysis Studio**

SOC Sentinel L2 é um laboratório web de operações SOC e resposta a incidentes. O projeto combina análise assistida por IA, evidências, MITRE ATT&CK, Threat Intelligence, playbooks, timeline, métricas e gerenciamento de casos em uma interface voltada a estudos e demonstração de workflows defensivos.

> Projeto educacional e de portfólio. As conclusões geradas por IA devem ser validadas por um analista humano antes de qualquer decisão operacional.

## Principais recursos

- Análise estruturada de incidentes com Google Gemini.
- Risk Score e Confidence Score de 0 a 100.
- Upload opcional de evidências `.log`, `.txt`, `.json` e `.csv`.
- Extração local de IPv4, URLs, domínios, hashes e timestamps.
- Correlação de timestamps com a timeline do incidente.
- Classificação e validação local de técnicas MITRE ATT&CK.
- Enriquecimento opcional de IOCs via VirusTotal e AbuseIPDB.
- Playbooks de Incident Response com progresso persistente.
- Case Management com responsável, SLA, notas e audit trail.
- Dashboard SOC com severidade, prioridades, MTTR estimado, taxa de fechamento, confiança média e tendências.
- Histórico pesquisável com filtros por prioridade, severidade e status.
- Exportação de relatórios em Markdown, JSON, CSV de IOCs e PDF via impressão.
- Geração de ticket a partir do incidente.

## Arquitetura

```text
Browser / React
      |
      | POST /api/analyze-incident
      v
Vercel Serverless Function
      |
      v
Google Gemini
      |
      v
Structured JSON Analysis
      |
      +--> MITRE validation
      +--> Risk / Confidence scoring
      +--> Timeline / Playbooks
      +--> Case Management
      +--> Threat Intelligence (optional)
```

As chaves de serviços externos ficam exclusivamente no backend/serverless e não são enviadas ao navegador.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Motion
- Google GenAI SDK
- Express para desenvolvimento local
- Vercel Functions em produção

## Executando localmente

Pré-requisitos: Node.js e npm.

```bash
npm install
```

Crie um arquivo `.env` na raiz:

```env
GEMINI_API_KEY=sua_chave
VIRUSTOTAL_API_KEY=sua_chave_opcional
ABUSEIPDB_API_KEY=sua_chave_opcional
```

Inicie o ambiente:

```bash
npm run dev
```

Para verificar TypeScript:

```bash
npm run lint
```

Para gerar o build:

```bash
npm run build
```

## Deploy na Vercel

Configure as Environment Variables do projeto:

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `GEMINI_API_KEY` | Sim | Motor de análise assistida por IA |
| `VIRUSTOTAL_API_KEY` | Não | Reputação de IP, domínio e hash |
| `ABUSEIPDB_API_KEY` | Não | Reputação complementar de endereços IP |

A análise principal continua funcionando mesmo sem as chaves opcionais de Threat Intelligence.

## Fluxo de investigação

1. O analista descreve o incidente e sua criticidade.
2. Evidências podem ser anexadas opcionalmente.
3. Indicadores e timestamps são extraídos localmente.
4. O backend envia o contexto ao Gemini com proteção para tratar evidências como dados não confiáveis, e não como instruções.
5. O modelo retorna uma análise JSON estruturada.
6. O SOC Sentinel valida e apresenta classificação, prioridade, IOCs, MITRE ATT&CK, ações e recomendações.
7. O caso pode seguir pelo ciclo `Novo → Triagem → Investigando → Contido → Erradicado → Recuperado → Fechado`.
8. Timeline, playbook, notas, SLA e auditoria acompanham a investigação.

## Segurança e privacidade

- API keys permanecem no backend.
- Evidências são tratadas como conteúdo não confiável no prompt da IA.
- O backend possui validação e limites de payload/requisições.
- Conteúdo bruto dos arquivos de evidência não é persistido no `localStorage`; apenas metadados e achados extraídos são mantidos.
- Threat Intelligence é opcional.
- O projeto deixa explícita a necessidade de validação humana.

## Limitações atuais

- O histórico é armazenado no navegador (`localStorage`), portanto não existe sincronização entre dispositivos.
- O MTTR do dashboard é uma estimativa baseada nos eventos armazenados localmente.
- O catálogo MITRE local não substitui a base oficial completa.
- Threat Intelligence depende das cotas e permissões dos provedores configurados.
- O projeto não deve ser tratado como SIEM/SOAR de produção.

## Roadmap

- Persistência em banco de dados.
- Autenticação e perfis de analista.
- Sincronização de casos entre usuários.
- Cobertura ampliada do MITRE ATT&CK.
- Testes automatizados e CI.
- Integrações adicionais com ferramentas defensivas.

## Uso responsável

SOC Sentinel L2 foi projetado para aprendizado, demonstração e análise defensiva. A IA auxilia o processo de investigação; ela não substitui procedimentos de Incident Response, validação de evidências ou julgamento de um profissional de segurança.
