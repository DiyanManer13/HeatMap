export type Language = "en" | "hi";

type Dictionary = Record<string, string>;

const english: Dictionary = {
  title: "Pause Pay",
  subtitle: "Rest without losing a rupee.",
  run: "Run comparison",
  running: "Running simulation…",
  live: "Live connection",
  offline: "Waiting for API",
  seed: "Scenario seed",
  summary: "Dispatch comparison",
  baseline: "Nearest rider",
  heatAware: "Pause Pay",
  orders: "Completed orders",
  late: "Late deliveries",
  heatLimit: "Riders over heat limit",
  earnings: "Delivery earnings",
  credits: "Pause credits",
  efficiency: "Earnings per heat point",
  protect: "Protect earnings. Reduce exposure.",
  info: "A simulation tool for decision support — not medical advice.",
  howItWorks: "How it works",
  stepOne: "Same orders",
  stepTwo: "Heat-aware assignment",
  stepThree: "Soft limits and pause credits",
  empty: "Run a comparison to see the Pune dispatch results.",
  language: "Language",
  liveComparison: "Live comparison",
  play: "Play",
  pause: "Pause",
  heatwave: "Heatwave day",
  city: "City"
  ,overview: "Overview"
  ,riderSafety: "Rider safety"
  ,reports: "Reports"
  ,safetyTitle: "A break should not cost a rider their income."
  ,safetyBody: "Pause Pay records a voluntary shift, tracks cumulative exposure, and recommends rest without blocking work."
  ,consent: "Consent-first location tracking"
  ,softLimit: "Soft heat limits"
  ,privateData: "Rider-owned exposure data"
  ,reportTitle: "Daily compliance report"
  ,generateReport: "Generate report"
  ,reportReady: "Report generated from the current seeded simulation."
};

const hindi: Dictionary = {
  title: "Pause Pay",
  subtitle: "गर्मी के लिए न्यायपूर्ण डिलीवरी डिस्पैच · पुणे",
  run: "तुलना चलाएँ",
  running: "सिमुलेशन चल रहा है…",
  live: "लाइव कनेक्शन",
  offline: "API की प्रतीक्षा है",
  seed: "सिनेरियो सीड",
  summary: "डिस्पैच तुलना",
  baseline: "सबसे नज़दीकी राइडर",
  heatAware: "Pause Pay",
  orders: "पूरे हुए ऑर्डर",
  late: "देरी से डिलीवरी",
  heatLimit: "गर्मी सीमा पार राइडर",
  earnings: "डिलीवरी कमाई",
  credits: "ब्रेक क्रेडिट",
  efficiency: "हर हीट पॉइंट की कमाई",
  protect: "कमाई बचाएँ। गर्मी का असर घटाएँ।",
  info: "निर्णय सहायता के लिए सिमुलेशन टूल — चिकित्सा सलाह नहीं।",
  howItWorks: "यह कैसे काम करता है",
  stepOne: "एक जैसे ऑर्डर",
  stepTwo: "गर्मी के हिसाब से असाइनमेंट",
  stepThree: "सॉफ्ट लिमिट और ब्रेक क्रेडिट",
  empty: "पुणे डिस्पैच के नतीजे देखने के लिए तुलना चलाएँ।",
  language: "भाषा",
  liveComparison: "लाइव तुलना",
  play: "चलाएँ",
  pause: "रोकें",
  heatwave: "हीटवेव दिन",
  city: "शहर"
  ,overview: "ओवरव्यू"
  ,riderSafety: "राइडर सुरक्षा"
  ,reports: "रिपोर्ट"
  ,safetyTitle: "ब्रेक लेने से राइडर की कमाई कम नहीं होनी चाहिए।"
  ,safetyBody: "Pause Pay स्वैच्छिक शिफ्ट रिकॉर्ड करता है, गर्मी के असर को ट्रैक करता है और काम रोके बिना आराम की सलाह देता है।"
  ,consent: "सहमति-आधारित लोकेशन ट्रैकिंग"
  ,softLimit: "सॉफ्ट हीट लिमिट"
  ,privateData: "राइडर के अपने एक्सपोज़र डेटा"
  ,reportTitle: "दैनिक अनुपालन रिपोर्ट"
  ,generateReport: "रिपोर्ट बनाएँ"
  ,reportReady: "मौजूदा सीड सिमुलेशन से रिपोर्ट बनाई गई।"
};

export const copy = (language: Language) => language === "hi" ? hindi : english;
