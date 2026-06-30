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
  | "fallbackNotice"
  | "tagline"
  | "seeUnsafe"
  | "reportItHere"
  | "emergencyNote"
  | "reportSafetyIssue"
  | "trackMyReport"
  | "homeExamples"
  | "privacyNotice"
  | "helpLabel"
  | "internalLogin";

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
    fallbackNotice: "Translation missing. Showing English for now.",
    tagline: "Report safety issue fast",
    seeUnsafe: "See something unsafe?",
    reportItHere: "Report it here.",
    emergencyNote:
      "Immediate danger? Move away from the area and inform Supervisor / EHS / Security immediately. Use this app to report after you are safe.",
    reportSafetyIssue: "Report Safety Issue",
    trackMyReport: "Track My Report",
    homeExamples: "Examples: oil spill, blocked walkway, unsafe stacking, broken plug, missing guard.",
    privacyNotice: "Privacy Notice",
    helpLabel: "Help",
    internalLogin: "Internal Login"
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
    submitReport: "Hantar laporan",
    tagline: "Lapor isu keselamatan dengan cepat",
    seeUnsafe: "Nampak sesuatu yang tidak selamat?",
    reportItHere: "Laporkan di sini.",
    emergencyNote:
      "Bahaya serta-merta? Beredar dari kawasan itu dan maklumkan Penyelia / EHS / Keselamatan dengan segera. Guna aplikasi ini untuk melapor selepas anda selamat.",
    reportSafetyIssue: "Lapor Isu Keselamatan",
    trackMyReport: "Semak Laporan Saya",
    homeExamples: "Contoh: tumpahan minyak, laluan terhalang, susunan tidak selamat, plag rosak, pengadang hilang.",
    privacyNotice: "Notis Privasi",
    helpLabel: "Bantuan",
    internalLogin: "Log Masuk Dalaman"
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
    submitReport: "रिपोर्ट पठाउनुहोस्",
    tagline: "सुरक्षा समस्या छिटो रिपोर्ट गर्नुहोस्",
    seeUnsafe: "केही असुरक्षित देख्नुभयो?",
    reportItHere: "यहाँ रिपोर्ट गर्नुहोस्।",
    emergencyNote:
      "तत्काल खतरा? क्षेत्रबाट टाढा जानुहोस् र तुरुन्तै सुपरभाइजर / EHS / सुरक्षालाई जानकारी दिनुहोस्। सुरक्षित भएपछि यो एप प्रयोग गरेर रिपोर्ट गर्नुहोस्।",
    reportSafetyIssue: "सुरक्षा समस्या रिपोर्ट गर्नुहोस्",
    trackMyReport: "मेरो रिपोर्ट हेर्नुहोस्",
    homeExamples: "उदाहरण: तेल पोखिएको, बाटो छेकिएको, असुरक्षित थुप्रो, बिग्रिएको प्लग, हराएको गार्ड।",
    privacyNotice: "गोपनीयता सूचना",
    helpLabel: "सहायता",
    internalLogin: "आन्तरिक लगइन"
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
    submitReport: "အစီရင်ခံစာ ပို့ပါ",
    tagline: "ဘေးအန္တရာယ်ကို မြန်မြန်တင်ပြပါ",
    seeUnsafe: "မလုံခြုံတာ တွေ့ပါသလား?",
    reportItHere: "ဒီမှာ တင်ပြပါ။",
    emergencyNote:
      "ချက်ချင်း အန္တရာယ်ရှိပါသလား? နေရာမှ ဖယ်ခွာပြီး ကြီးကြပ်သူ / EHS / လုံခြုံရေး ကို ချက်ချင်းအသိပေးပါ။ ဘေးကင်းပြီးမှ ဤအက်ပ်ဖြင့် တင်ပြပါ။",
    reportSafetyIssue: "ဘေးအန္တရာယ် တင်ပြပါ",
    trackMyReport: "ကျွန်ုပ်၏ အစီရင်ခံစာ ကြည့်ရန်",
    homeExamples: "ဥပမာ: ဆီဖိတ်ခြင်း၊ လမ်းကြောင်းပိတ်ဆို့ခြင်း၊ မလုံခြုံစွာ စုပုံခြင်း၊ ပျက်နေသော ပလပ်၊ ပျောက်နေသော အကာ။",
    privacyNotice: "ကိုယ်ရေးအချက်အလက် မူဝါဒ",
    helpLabel: "အကူအညီ",
    internalLogin: "အတွင်းပိုင်း ဝင်ရောက်ရန်"
  },
  bn: {
    appName: "CARE Hazard Line",
    welcome: "স্বাগতম। নিরাপদে দ্রুত ঝুঁকি রিপোর্ট করুন।",
    chooseLanguage: "আপনার ভাষা নির্বাচন করুন।",
    reportHazard: "ঝুঁকি রিপোর্ট করুন",
    checkStatus: "রিপোর্টের অবস্থা দেখুন",
    getHelp: "সাহায্য",
    changeLanguage: "ভাষা পরিবর্তন করুন",
    describeHazard: "সহজ কথায় ঝুঁকি লিখুন।",
    photoRequired: "ছবি দেওয়া বাধ্যতামূলক। নিরাপদ জায়গা থেকে ছবি তুলুন।",
    chooseLocation: "লোকেশন নির্বাচন করুন।",
    reviewAi: "জমা দেওয়ার আগে AI সারাংশ দেখুন।",
    submitReport: "রিপোর্ট জমা দিন",
    tagline: "নিরাপত্তা সমস্যা দ্রুত রিপোর্ট করুন",
    seeUnsafe: "অনিরাপদ কিছু দেখছেন?",
    reportItHere: "এখানে রিপোর্ট করুন।",
    emergencyNote:
      "তাৎক্ষণিক বিপদ? এলাকা থেকে সরে যান এবং অবিলম্বে সুপারভাইজার / EHS / নিরাপত্তাকে জানান। নিরাপদ হওয়ার পরে এই অ্যাপ দিয়ে রিপোর্ট করুন।",
    reportSafetyIssue: "নিরাপত্তা সমস্যা রিপোর্ট করুন",
    trackMyReport: "আমার রিপোর্ট দেখুন",
    homeExamples: "উদাহরণ: তেল পড়া, পথ আটকানো, অনিরাপদ স্তূপ, ভাঙা প্লাগ, অনুপস্থিত গার্ড।",
    privacyNotice: "গোপনীয়তা নোটিশ",
    helpLabel: "সাহায্য",
    internalLogin: "অভ্যন্তরীণ লগইন"
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
