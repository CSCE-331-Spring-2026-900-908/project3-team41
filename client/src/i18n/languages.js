export const LANGUAGES = [
  { code: "en", label: "English", googleCode: "en" },
  { code: "es", label: "Español", googleCode: "es" },
  { code: "fr", label: "French", googleCode: "fr" },
  { code: "de", label: "German", googleCode: "de" },
  { code: "it", label: "Italian", googleCode: "it" },
  { code: "pt", label: "Portuguese", googleCode: "pt" },
  { code: "nl", label: "Dutch", googleCode: "nl" },
  { code: "sv", label: "Swedish", googleCode: "sv" },
  { code: "ja", label: "Japanese", googleCode: "ja" },
  { code: "ko", label: "Korean", googleCode: "ko" },
  { code: "zh-CN", label: "Chinese (Simplified)", googleCode: "zh-CN" },
];

export function normalizeLangCode(input) {
  const raw = String(input || "").trim();
  if (!raw) return "en";

  // Examples: "en-US" -> "en", "zh-CN" -> "zh-CN".
  const lower = raw.toLowerCase();
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("es")) return "es";
  if (lower.startsWith("fr")) return "fr";
  if (lower.startsWith("de")) return "de";
  if (lower.startsWith("it")) return "it";
  if (lower.startsWith("pt")) return "pt";
  if (lower.startsWith("nl")) return "nl";
  if (lower.startsWith("sv")) return "sv";
  if (lower.startsWith("ja")) return "ja";
  if (lower.startsWith("ko")) return "ko";
  if (lower.startsWith("zh")) return "zh-CN";

  // Fall back to the raw code if it matches one of ours.
  return LANGUAGES.some((l) => l.code === raw) ? raw : "en";
}

export function getGoogleTargetLang(langCode) {
  const match = LANGUAGES.find((l) => l.code === langCode);
  return match ? match.googleCode : "en";
}

