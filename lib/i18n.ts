import type { LanguageCode } from "@/types/domain";

export const languages: Array<{ code: LanguageCode; label: string; nativeLabel: string }> = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ms", label: "Bahasa Melayu", nativeLabel: "Bahasa Melayu" },
  { code: "ne", label: "Nepali", nativeLabel: "नेपाली" },
  { code: "my", label: "Myanmar", nativeLabel: "မြန်မာ" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" }
];

type MessageKey =
  | "appName"
  | "welcome"
  | "chooseLanguage"
  | "reportHazard"
  | "checkStatus"
  | "getHelp"
  | "changeLanguage"
  | "describeHazard"
  | "photoRequired"
  | "chooseLocation"
  | "reviewAi"
  | "submitReport"
  | "fallbackNotice";

const messages: Record<LanguageCode, Partial<Record<MessageKey, string>>> = {
  en: {
    appName: "CARE Hazard Line",
    welcome: "Welcome. Report hazards quickly and safely.",
    chooseLanguage: "Choose your language.",
    reportHazard: "Report hazard",
    checkStatus: "Check report status",
    getHelp: "Get help",
    changeLanguage: "Change language",
    describeHazard: "Describe the hazard in simple words.",
    photoRequired: "Photo is required. Take the photo from a safe position.",
    chooseLocation: "Choose the location.",
    reviewAi: "Review the AI hazard summary before submitting.",
    submitReport: "Submit report",
    fallbackNotice: "Translation missing. Showing English for now."
  },
  ms: {
    appName: "CARE Hazard Line",
    welcome: "Selamat datang. Laporkan hazard dengan cepat dan selamat.",
    chooseLanguage: "Pilih bahasa anda.",
    reportHazard: "Lapor hazard",
    checkStatus: "Semak status laporan",
    getHelp: "Bantuan",
    changeLanguage: "Tukar bahasa",
    describeHazard: "Terangkan hazard dengan ayat ringkas.",
    photoRequired: "Gambar wajib dimuat naik. Ambil gambar dari tempat yang selamat.",
    chooseLocation: "Pilih lokasi.",
    reviewAi: "Semak ringkasan hazard AI sebelum hantar.",
    submitReport: "Hantar laporan"
  },
  ne: {
    appName: "CARE Hazard Line",
    welcome: "स्वागत छ। जोखिम छिटो र सुरक्षित रूपमा रिपोर्ट गर्नुहोस्।",
    chooseLanguage: "आफ्नो भाषा छान्नुहोस्।",
    reportHazard: "जोखिम रिपोर्ट गर्नुहोस्",
    checkStatus: "रिपोर्ट स्थिति जाँच गर्नुहोस्",
    getHelp: "सहायता",
    changeLanguage: "भाषा परिवर्तन गर्नुहोस्",
    describeHazard: "सरल शब्दमा जोखिम लेख्नुहोस्।",
    photoRequired: "फोटो आवश्यक छ। सुरक्षित ठाउँबाट फोटो लिनुहोस्।",
    chooseLocation: "स्थान छान्नुहोस्।",
    reviewAi: "पठाउनु अघि AI सारांश जाँच गर्नुहोस्।",
    submitReport: "रिपोर्ट पठाउनुहोस्"
  },
  my: {
    appName: "CARE Hazard Line",
    welcome: "ကြိုဆိုပါတယ်။ အန္တရာယ်ကို လုံခြုံစွာ အမြန်တင်ပြပါ။",
    chooseLanguage: "ဘာသာစကား ရွေးပါ။",
    reportHazard: "အန္တရာယ် တင်ပြပါ",
    checkStatus: "အစီရင်ခံစာ အခြေအနေ စစ်ဆေးပါ",
    getHelp: "အကူအညီ",
    changeLanguage: "ဘာသာစကား ပြောင်းပါ",
    describeHazard: "အန္တရာယ်ကို ရိုးရှင်းသော စကားလုံးများဖြင့် ရေးပါ။",
    photoRequired: "ဓာတ်ပုံ လိုအပ်ပါသည်။ လုံခြုံသောနေရာမှ ရိုက်ပါ။",
    chooseLocation: "နေရာရွေးပါ။",
    reviewAi: "မပို့မီ AI အကျဉ်းချုပ်ကို စစ်ဆေးပါ။",
    submitReport: "အစီရင်ခံစာ ပို့ပါ"
  },
  bn: {
    appName: "CARE Hazard Line",
    welcome: "স্বাগতম। নিরাপদে দ্রুত ঝুঁকি রিপোর্ট করুন।",
    chooseLanguage: "আপনার ভাষা নির্বাচন করুন।",
    reportHazard: "ঝুঁকি রিপোর্ট করুন",
    checkStatus: "রিপোর্টের অবস্থা দেখুন",
    getHelp: "সাহায্য",
    changeLanguage: "ভাষা পরিবর্তন করুন",
    describeHazard: "সহজ কথায় ঝুঁকি লিখুন।",
    photoRequired: "ছবি দেওয়া বাধ্যতামূলক। নিরাপদ জায়গা থেকে ছবি তুলুন।",
    chooseLocation: "লোকেশন নির্বাচন করুন।",
    reviewAi: "জমা দেওয়ার আগে AI সারাংশ দেখুন।",
    submitReport: "রিপোর্ট জমা দিন"
  }
};

export function t(language: LanguageCode | undefined, key: MessageKey): { text: string; usedFallback: boolean } {
  const selectedLanguage = language ?? "en";
  const text = messages[selectedLanguage]?.[key];

  if (text) {
    return { text, usedFallback: false };
  }

  return {
    text: messages.en[key] ?? key,
    usedFallback: selectedLanguage !== "en"
  };
}

export function getMessagesForLanguage(language: LanguageCode) {
  const output: Record<string, { text: string; usedFallback: boolean }> = {};
  const keys = Object.keys(messages.en) as MessageKey[];

  keys.forEach((key) => {
    output[key] = t(language, key);
  });

  return output;
}
