import { ExtractedIOC, IOCConfidence } from "../types";

export function validateIOCFormat(type: ExtractedIOC["type"], value: string): boolean {
  const trimmed = value.trim();

  if (type === "IP") {
    const parts = trimmed.split(".");
    return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
  }

  if (type === "Domain") {
    return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(trimmed);
  }

  if (type === "URL") {
    try {
      const url = new URL(trimmed);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  if (type === "Hash") {
    return /^(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})$/i.test(trimmed);
  }

  return trimmed.length > 1;
}

export function enrichIOC(
  ioc: Pick<ExtractedIOC, "type" | "value">,
  source: ExtractedIOC["source"],
): ExtractedIOC {
  const validFormat = validateIOCFormat(ioc.type, ioc.value);
  let confidence: IOCConfidence = "Média";

  if (source === "IOC Section" && validFormat) confidence = "Alta";
  else if (source === "Report Regex" && validFormat) confidence = "Média";
  else if (!validFormat) confidence = "Baixa";

  return {
    ...ioc,
    source,
    confidence,
    validFormat,
    notes: validFormat ? "Formato sintaticamente válido; reputação externa não consultada." : "Formato incomum ou inválido; revisar manualmente.",
  };
}
