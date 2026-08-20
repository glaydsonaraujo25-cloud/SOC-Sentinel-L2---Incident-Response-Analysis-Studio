# SOC Sentinel L2

**AI-Assisted Incident Response & Threat Analysis Studio**

SOC Sentinel L2 é um laboratório web de operações SOC e resposta a incidentes. O projeto combina análise assistida por IA, evidências, MITRE ATT&CK, Threat Intelligence, playbooks, timeline, métricas, gerenciamento de casos e persistência opcional em nuvem.

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
- Autenticação opcional de analistas com Supabase Auth.
- Persistência em PostgreSQL/Supabase com Row Level Security.
- Cache local separado por usuário e fallback automático para `localStorage`.
- Exportação de relatórios em Markdown, JSON, CSV de IOCs e PDF via impressão.
- Geração de ticket a partir do incidente.

## Arquitetura

```text
Browser / React
      |
      +--> Supabase Auth (optional)
      |        |
      |        v
      |    PostgreSQL + RLS
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

A chave pública/publicável do Supabase pode ser usada no cliente porque o acesso aos dados é protegido por autenticação e RLS. Chaves privilegiadas como `service_role` nunca devem ser expostas no navegador.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Motion
- Google GenAI SDK
- Supabase Auth + PostgreSQL
- Express para desenvolvimento local
- Vercel Functions em produção
- GitHub Actions para TypeScript check e build

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

# Opcionais: habilitam login e sincronização
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publicavel
```

Sem as variáveis `VITE_SUPABASE_*`, o app continua operando integralmente em modo local.

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

## Configuração do Supabase

O repositório inclui a migration:

```text
supabase/migrations/001_incidents.sql
```

Ela cria a tabela `public.incidents`, índices e políticas de Row Level Security. Cada registro possui `user_id`, e as políticas usam `auth.uid()` para restringir SELECT, INSERT, UPDATE e DELETE ao proprietário autenticado.

Depois de criar um projeto no Supabase:

1. Execute a migration SQL no projeto.
2. Habilite Email/Password no Supabase Auth conforme sua política de cadastro.
3. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` na Vercel.
4. Faça um novo deploy.

Ao entrar com uma conta, o histórico daquele usuário é sincronizado com o banco. Ao sair, o app volta ao histórico local. O cache local também é separado por ID de usuário para reduzir risco de exposição entre contas no mesmo navegador.

## Deploy na Vercel

Configure as Environment Variables do projeto:

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `GEMINI_API_KEY` | Sim | Motor de análise assistida por IA |
| `VIRUSTOTAL_API_KEY` | Não | Reputação de IP, domínio e hash |
| `ABUSEIPDB_API_KEY` | Não | Reputação complementar de endereços IP |
| `VITE_SUPABASE_URL` | Não | URL do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Não | Chave publicável para Auth/Data API protegida por RLS |

A análise principal continua funcionando sem Supabase ou sem as chaves opcionais de Threat Intelligence.

## Fluxo de investigação

1. O analista descreve o incidente e sua criticidade.
2. Evidências podem ser anexadas opcionalmente.
3. Indicadores e timestamps são extraídos localmente.
4. O backend envia o contexto ao Gemini com proteção para tratar evidências como dados não confiáveis, e não como instruções.
5. O modelo retorna uma análise JSON estruturada.
6. O SOC Sentinel valida e apresenta classificação, prioridade, IOCs, MITRE ATT&CK, ações e recomendações.
7. O caso pode seguir pelo ciclo `Novo → Triagem → Investigando → Contido → Erradicado → Recuperado → Fechado`.
8. Timeline, playbook, notas, SLA e auditoria acompanham a investigação.
9. Quando autenticado, o caso é salvo no Supabase e mantido em cache local por usuário.

## Segurança e privacidade

- Chaves privadas dos serviços de IA/Threat Intelligence permanecem no backend.
- O cliente Supabase usa apenas chave publicável e RLS.
- A tabela `incidents` possui políticas por `auth.uid()`.
- Evidências são tratadas como conteúdo não confiável no prompt da IA.
- O backend possui validação e limites de payload/requisições.
- Conteúdo bruto dos arquivos de evidência não é persistido; apenas metadados e achados extraídos são mantidos.
- Cache local é separado entre modo local e usuários autenticados.
- Threat Intelligence e persistência em nuvem são opcionais.
- O projeto deixa explícita a necessidade de validação humana.

## Limitações atuais

- Não existe ainda gerenciamento de equipes/organizações compartilhadas; os casos em nuvem são privados por usuário.
- O MTTR do dashboard é uma estimativa baseada nos eventos registrados.
- O catálogo MITRE local não substitui a base oficial completa.
- Threat Intelligence depende das cotas e permissões dos provedores configurados.
- O projeto não deve ser tratado como SIEM/SOAR de produção.

## Roadmap

- Perfis e papéis de acesso para L1, L2 e administrador.
- Equipes/organizações e compartilhamento controlado de casos.
- Cobertura ampliada do MITRE ATT&CK.
- Testes automatizados de regras de negócio e endpoints.
- Integrações adicionais com ferramentas defensivas.

## Uso responsável

SOC Sentinel L2 foi projetado para aprendizado, demonstração e análise defensiva. A IA auxilia o processo de investigação; ela não substitui procedimentos de Incident Response, validação de evidências ou julgamento de um profissional de segurança.
