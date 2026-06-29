import type { LanguageCode } from "@/types/domain";

const languageLabels: Record<LanguageCode, string> = {
  en: "English",
  ms: "Bahasa Melayu",
  ne: "नेपाली",
  my: "မြန်မာ",
  bn: "বাংলা"
};

const helpWords = ["help", "tolong", "bantuan", "sahayata", "सहायता", "အကူအညီ", "সাহায্য"];

export function normalizeWhatsAppPhone(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export function cleanText(value?: string | null) {
  return (value ?? "").trim();
}

export function isHelpText(text?: string) {
  const lower = cleanText(text).toLowerCase();
  return helpWords.some((word) => lower.includes(word));
}

export function parseLanguage(text?: string): LanguageCode | null {
  const lower = cleanText(text).toLowerCase();
  if (["1", "en", "english"].includes(lower)) return "en";
  if (["2", "ms", "bm", "bahasa", "bahasa melayu", "melayu"].includes(lower)) return "ms";
  if (["3", "ne", "nepali", "नेपाली"].includes(lower)) return "ne";
  if (["4", "my", "myanmar", "burmese", "မြန်မာ"].includes(lower)) return "my";
  if (["5", "bn", "bangla", "bengali", "bangladesh", "বাংলা"].includes(lower)) return "bn";
  return null;
}

export function parseReporterCategory(text?: string): "employee" | "visitor" | null {
  const lower = cleanText(text).toLowerCase();
  if (["1", "employee", "staff", "worker", "pekerja", "kakitangan"].includes(lower)) return "employee";
  if (["2", "visitor", "pelawat", "contractor", "vendor"].includes(lower)) return "visitor";
  return null;
}

export function parseMainMenu(text?: string): "report" | "status" | "help" | "language" | null {
  const lower = cleanText(text).toLowerCase();
  if (["1", "report", "report hazard", "lapor", "lapor hazard", "hazard"].includes(lower)) return "report";
  if (["2", "status", "track", "check status", "semak", "semak status"].includes(lower)) return "status";
  if (["3", "help", "tolong", "bantuan"].includes(lower)) return "help";
  if (["4", "language", "change language", "bahasa", "tukar bahasa"].includes(lower)) return "language";
  return null;
}

export function parseConsent(text?: string): boolean | null {
  const lower = cleanText(text).toLowerCase();
  if (["1", "yes", "y", "ok", "agree", "setuju", "i understand"].includes(lower)) return true;
  if (["2", "no", "n", "tak", "tidak"].includes(lower)) return false;
  return null;
}

export function parseUrgency(text?: string): "low" | "medium" | "high" | "urgent" | null {
  const lower = cleanText(text).toLowerCase();
  if (["1", "urgent", "yes", "yes urgent", "immediate", "bahaya", "danger"].includes(lower)) return "urgent";
  if (["2", "high", "not sure", "unsure", "tak pasti"].includes(lower)) return "high";
  if (["3", "medium", "no", "action needed", "not urgent"].includes(lower)) return "medium";
  if (["4", "low"].includes(lower)) return "low";
  return null;
}

export function parseAiConfirmation(text?: string): "confirm" | "edit" | "status" | null {
  const lower = cleanText(text).toLowerCase();
  if (["1", "yes", "confirm", "submit", "betul", "correct"].includes(lower)) return "confirm";
  if (["2", "edit", "wrong", "no", "correct it", "salah"].includes(lower)) return "edit";
  if (["status", "track"].includes(lower)) return "status";
  return null;
}

export function languageMenu() {
  return [
    "CARE Hazard Line",
    "Please choose language / Sila pilih bahasa:",
    "1. English",
    "2. Bahasa Melayu",
    "3. Nepali / नेपाली",
    "4. Myanmar / မြန်မာ",
    "5. Bangla / বাংলা"
  ].join("\n");
}

export function mainMenu(language: LanguageCode, name?: string | null) {
  const greeting = name ? `Hi ${name}.` : "Hi.";
  if (language === "ms") {
    return [
      greeting,
      "Apa yang anda mahu buat?",
      "1. Lapor hazard",
      "2. Semak status laporan",
      "3. Bantuan",
      "4. Tukar bahasa"
    ].join("\n");
  }

  return [
    greeting,
    "What would you like to do?",
    "1. Report hazard",
    "2. Check report status",
    "3. Help",
    "4. Change language"
  ].join("\n");
}

export function helpMessage(language: LanguageCode) {
  if (language === "ms") {
    return [
      "Bantuan ringkas:",
      "1. Tulis isu dengan ayat pendek.",
      "2. Hantar gambar dari tempat selamat.",
      "3. Beri lokasi.",
      "4. Semak ringkasan AI.",
      "5. Taip MENU untuk kembali."
    ].join("\n");
  }

  return [
    "Simple help:",
    "1. Type the issue in simple words.",
    "2. Send one photo from a safe place.",
    "3. Give the location.",
    "4. Check the AI summary.",
    "5. Type MENU to return."
  ].join("\n");
}

export function promptForName(profileName?: string) {
  return [
    "First-time setup.",
    profileName ? `Is this your name? ${profileName}` : "Please type your full name.",
    profileName ? "Reply YES to use this name, or type your correct name." : "Example: Ahmad bin Ali"
  ].join("\n");
}

export function promptForCategory() {
  return ["Are you reporting as:", "1. Employee", "2. Visitor"].join("\n");
}

export function promptForConsent() {
  return [
    "Privacy notice:",
    "We will use your name, phone number, report details and photo for EHS hazard reporting, action tracking and safety improvement.",
    "Your identity is visible to EHS only by default.",
    "Reply 1 or YES to continue."
  ].join("\n");
}

export function promptForDescription(language: LanguageCode) {
  if (language === "ms") {
    return [
      "Terangkan hazard dengan ayat ringkas.",
      "Contoh: pallet halang laluan, minyak tumpah, kabel rosak."
    ].join("\n");
  }

  return [
    "Describe the hazard in simple words.",
    "Example: pallet blocking walkway, oil spill, damaged cable."
  ].join("\n");
}

export function promptForPhoto() {
  return [
    "Please send one photo of the hazard.",
    "Take the photo from a safe position. Do not put yourself in danger."
  ].join("\n");
}

export function promptForLocation() {
  return [
    "Where is the hazard?",
    "Example: Loading Area, Warehouse, Paintshop, Fabrication, Testing, Office, Guard House."
  ].join("\n");
}

export function promptForUrgency() {
  return [
    "Is anyone in immediate danger now?",
    "1. Yes, urgent",
    "2. Not sure / high risk",
    "3. No, but action needed",
    "4. Low risk"
  ].join("\n");
}

export function aiReviewMessage(summary: {
  hazardSummary: string;
  suggestedCategory: string;
  urgencyLevel: string;
  recommendedImmediateAction: string;
  suggestedOwnerDepartment: string;
}) {
  return [
    "I understood your report as:",
    "",
    `Hazard: ${summary.hazardSummary}`,
    `Category: ${summary.suggestedCategory}`,
    `Urgency: ${summary.urgencyLevel}`,
    `Immediate action: ${summary.recommendedImmediateAction}`,
    `Suggested owner: ${summary.suggestedOwnerDepartment}`,
    "",
    "Is this correct?",
    "1. Yes, submit",
    "2. Edit description"
  ].join("\n");
}

export function languageLabel(language: LanguageCode) {
  return languageLabels[language] ?? language;
}
