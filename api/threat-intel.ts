type SupportedIOCType = "IP" | "Domain" | "Hash";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function verdictFromStats(stats: Record<string, number> | undefined) {
  const malicious = Number(stats?.malicious || 0);
  const suspicious = Number(stats?.suspicious || 0);
  const harmless = Number(stats?.harmless || 0);
  if (malicious > 0) return "Malicioso";
  if (suspicious > 0) return "Suspeito";
  if (harmless > 0) return "Limpo";
  return "Desconhecido";
}

async function queryVirusTotal(type: SupportedIOCType, value: string, apiKey: string) {
  const encoded = encodeURIComponent(value);
  const path = type === "IP" ? `ip_addresses/${encoded}` : type === "Domain" ? `domains/${encoded}` : `files/${encoded}`;
  const response = await fetch(`https://www.virustotal.com/api/v3/${path}`, {
    headers: { "x-apikey": apiKey },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`VirusTotal HTTP ${response.status}: ${body.slice(0, 180)}`);
  }

  const payload = await response.json() as any;
  const attrs = payload?.data?.attributes || {};
  const stats = attrs.last_analysis_stats || {};

  return {
    provider: "VirusTotal",
    verdict: verdictFromStats(stats),
    malicious: Number(stats.malicious || 0),
    suspicious: Number(stats.suspicious || 0),
    harmless: Number(stats.harmless || 0),
    country: attrs.country || undefined,
    asOwner: attrs.as_owner || undefined,
    lastCheckedAt: new Date().toISOString(),
    details: "Reputação agregada dos mecanismos disponíveis no VirusTotal.",
  };
}

async function queryAbuseIPDB(ip: string, apiKey: string) {
  const url = new URL("https://api.abuseipdb.com/api/v2/check");
  url.searchParams.set("ipAddress", ip);
  url.searchParams.set("maxAgeInDays", "90");

  const response = await fetch(url, {
    headers: { Key: apiKey, Accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AbuseIPDB HTTP ${response.status}: ${body.slice(0, 180)}`);
  }

  const payload = await response.json() as any;
  const data = payload?.data || {};
  const score = Number(data.abuseConfidenceScore || 0);
  const totalReports = Number(data.totalReports || 0);

  return {
    provider: "AbuseIPDB",
    verdict: score >= 50 ? "Malicioso" : score > 0 ? "Suspeito" : "Limpo",
    score,
    totalReports,
    country: data.countryCode || undefined,
    asOwner: data.isp || data.domain || undefined,
    lastCheckedAt: new Date().toISOString(),
    details: "Score de confiança de abuso observado nos últimos 90 dias.",
  };
}

export const maxDuration = 30;

export default {
  async fetch(request: Request) {
    if (request.method !== "POST") {
      return json({ error: "Método não permitido." }, 405);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json({ error: "JSON inválido." }, 400);
    }

    const type = String(body?.type || "") as SupportedIOCType;
    const value = String(body?.value || "").trim();

    if (!["IP", "Domain", "Hash"].includes(type) || !value) {
      return json({ error: "IOC inválido ou não suportado para enriquecimento externo." }, 400);
    }

    const vtKey = process.env.VIRUSTOTAL_API_KEY;
    const abuseKey = process.env.ABUSEIPDB_API_KEY;

    if (!vtKey && !(type === "IP" && abuseKey)) {
      return json({
        enabled: false,
        results: [],
        message: "Threat Intelligence externa está desativada. Configure VIRUSTOTAL_API_KEY e, opcionalmente, ABUSEIPDB_API_KEY na Vercel.",
      });
    }

    const results: any[] = [];
    const errors: string[] = [];

    if (vtKey) {
      try {
        results.push(await queryVirusTotal(type, value, vtKey));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Falha no VirusTotal");
      }
    }

    if (type === "IP" && abuseKey) {
      try {
        results.push(await queryAbuseIPDB(value, abuseKey));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Falha no AbuseIPDB");
      }
    }

    return json({
      enabled: true,
      results,
      errors,
      checkedAt: new Date().toISOString(),
    });
  },
};
