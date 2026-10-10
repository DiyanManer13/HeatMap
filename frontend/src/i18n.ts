export type Language = "en" | "hi";
export type RiderLanguage = "en" | "hi" | "mr";

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

export const riderText: Record<RiderLanguage, Record<string, string>> = {
  en: {
    language: "Language", heatDose: "Heat dose", fetchingRoad: "Loading road route…", walk: "walk",
    pauseCredit: "Pause credit", scanDialog: "Rest hub QR scanner", closeScanner: "Close scanner",
    scanHub: "Scan rest-hub QR",
    cameraStarting: "Allow camera access in your browser to start scanning…", cameraScanning: "Camera on · scan the QR displayed at this rest point.",
    cameraUnavailable: "Camera access is blocked or unavailable. Enable it in browser site settings and try again.", qrInvalid: "This is not a Pause Pay rest-point QR.",
    qrWrongHub: "This QR belongs to a different rest point.", expectedCode: "Expected code",
    serverNotVerified: "This browser demo does not verify the hub with a server.",
    offline: "Offline", lastLocation: "Last location saved. Reconnecting…", goOnline: "Go online",
    restingAt: "Resting at", checkinVerified: "QR read in demo · Dose cooling down",
    left: "left", followRoute: "Follow the route to", qrAtHub: "Scan the Pause Pay code assigned to this suggested stop.",
    atHub: "At the hub · Check in", cannotReach: "I cannot reach this point",
    onWayPickup: "On the way to pickup", away: "min away", arrivedRestaurant: "Arrived at restaurant",
    delivering: "Delivering to customer", markDelivered: "Mark delivered", newOrder: "New order",
    shadedRoute: "Shaded route assigned", pickup: "Pickup", accept: "Accept",
    heatLimitReached: "Heat warning reached", breakTime: "Time for a break", navigateRest: "Navigate to rest point",
    skipBreak: "Continue without a break", critical: "Critical level", stopNow: "Stop and rest",
    seriousRisk: "Your heat dose is critically high. Rest as soon as possible.", forceBreak: "Start rest",
    ignoreRisk: "Continue at high risk", requestBreak: "Request a safe break", emergency: "Emergency",
    headingTo: "Heading to", pickedUp: "Order picked up. Riding to customer.", earned: "earned. Looking for next order…",
    restShared: "Rest suggestion shared", demoCheckin: "QR scanned. Demo check-in recorded; server did not verify this hub.",
    emergencyAlert: "Emergency services alert is a demo action.", order: "Order",
  },
  hi: {
    language: "भाषा", heatDose: "गर्मी का असर", fetchingRoad: "सड़क का रास्ता लोड हो रहा है…", walk: "पैदल",
    pauseCredit: "ब्रेक क्रेडिट", scanDialog: "आराम केंद्र QR स्कैनर", closeScanner: "स्कैनर बंद करें",
    scanHub: "आराम केंद्र QR स्कैन करें",
    cameraStarting: "स्कैन शुरू करने के लिए ब्राउज़र में कैमरा अनुमति दें…", cameraScanning: "कैमरा चालू · इस आराम स्थान का QR स्कैन करें।",
    cameraUnavailable: "कैमरा बंद है या उपलब्ध नहीं। ब्राउज़र साइट सेटिंग में अनुमति देकर फिर कोशिश करें।", qrInvalid: "यह Pause Pay आराम-स्थान QR नहीं है।",
    qrWrongHub: "यह QR किसी दूसरे आराम स्थान का है।", expectedCode: "अपेक्षित कोड",
    serverNotVerified: "यह ब्राउज़र डेमो सर्वर से केंद्र की पुष्टि नहीं करता।",
    offline: "ऑफ़लाइन", lastLocation: "आख़िरी लोकेशन सेव है। फिर से जुड़ रहे हैं…", goOnline: "ऑनलाइन हों",
    restingAt: "यहाँ आराम कर रहे हैं:", checkinVerified: "डेमो में QR पढ़ा · गर्मी का असर कम हो रहा है",
    left: "बाकी", followRoute: "इस रास्ते से जाएँ:", qrAtHub: "इस सुझाए गए स्थान के लिए बनाया Pause Pay कोड स्कैन करें।",
    atHub: "केंद्र पर · चेक-इन करें", cannotReach: "मैं यहाँ नहीं पहुँच सकता/सकती",
    onWayPickup: "पिकअप के रास्ते में", away: "मिनट दूर", arrivedRestaurant: "रेस्तराँ पहुँच गए",
    delivering: "ग्राहक तक डिलीवरी", markDelivered: "डिलीवरी पूरी करें", newOrder: "नया ऑर्डर",
    shadedRoute: "छायादार रास्ता चुना गया", pickup: "पिकअप", accept: "स्वीकार करें",
    heatLimitReached: "गर्मी की चेतावनी सीमा पहुँची", breakTime: "अब आराम करें", navigateRest: "आराम की जगह तक जाएँ",
    skipBreak: "बिना आराम जारी रखें", critical: "गंभीर स्तर", stopNow: "रुकें और आराम करें",
    seriousRisk: "गर्मी का असर बहुत ज़्यादा है। जल्द से जल्द आराम करें।", forceBreak: "आराम शुरू करें",
    ignoreRisk: "ज़्यादा जोखिम के साथ जारी रखें", requestBreak: "सुरक्षित ब्रेक माँगें", emergency: "आपातकाल",
    headingTo: "जा रहे हैं:", pickedUp: "ऑर्डर ले लिया। ग्राहक के पास जा रहे हैं।", earned: "कमाए। अगला ऑर्डर ढूँढ रहे हैं…",
    restShared: "आराम का सुझाव साझा किया", demoCheckin: "QR स्कैन हुआ। डेमो चेक-इन दर्ज; सर्वर ने केंद्र की पुष्टि नहीं की।",
    emergencyAlert: "आपातकालीन सूचना डेमो क्रिया है।", order: "ऑर्डर",
  },
  mr: {
    language: "भाषा", heatDose: "उष्णतेचा परिणाम", fetchingRoad: "रस्त्याचा मार्ग लोड होत आहे…", walk: "पायी",
    pauseCredit: "विश्रांती भत्ता", scanDialog: "विश्रांती ठिकाण QR स्कॅनर", closeScanner: "स्कॅनर बंद करा",
    scanHub: "विश्रांती ठिकाणाचा QR स्कॅन करा",
    cameraStarting: "स्कॅन सुरू करण्यासाठी ब्राउझरमध्ये कॅमेरा परवानगी द्या…", cameraScanning: "कॅमेरा सुरू · या विश्रांती ठिकाणाचा QR स्कॅन करा.",
    cameraUnavailable: "कॅमेरा बंद आहे किंवा उपलब्ध नाही. ब्राउझर साइट सेटिंगमध्ये परवानगी देऊन पुन्हा प्रयत्न करा.", qrInvalid: "हा Pause Pay विश्रांती ठिकाणाचा QR नाही.",
    qrWrongHub: "हा QR वेगळ्या विश्रांती ठिकाणाचा आहे.", expectedCode: "अपेक्षित कोड",
    serverNotVerified: "हा ब्राउझर डेमो सर्व्हरकडून ठिकाणाची पडताळणी करत नाही.",
    offline: "ऑफलाइन", lastLocation: "शेवटचे ठिकाण जतन केले. पुन्हा जोडत आहोत…", goOnline: "ऑनलाइन व्हा",
    restingAt: "येथे विश्रांती:", checkinVerified: "डेमोमध्ये QR वाचला · उष्णतेचा परिणाम कमी होत आहे",
    left: "बाकी", followRoute: "या मार्गाने जा:", qrAtHub: "या सुचवलेल्या ठिकाणासाठीचा Pause Pay कोड स्कॅन करा.",
    atHub: "ठिकाणी पोहोचलात · चेक-इन करा", cannotReach: "मी या ठिकाणी पोहोचू शकत नाही",
    onWayPickup: "पिकअपसाठी जात आहात", away: "मिनिटे दूर", arrivedRestaurant: "रेस्टॉरंटमध्ये पोहोचलात",
    delivering: "ग्राहकाला डिलिव्हरी", markDelivered: "डिलिव्हरी पूर्ण करा", newOrder: "नवीन ऑर्डर",
    shadedRoute: "सावलीचा मार्ग निवडला", pickup: "पिकअप", accept: "स्वीकारा",
    heatLimitReached: "उष्णतेची सूचना मर्यादा गाठली", breakTime: "आता विश्रांती घ्या", navigateRest: "विश्रांतीच्या ठिकाणी जा",
    skipBreak: "विश्रांतीशिवाय पुढे जा", critical: "गंभीर पातळी", stopNow: "थांबा आणि विश्रांती घ्या",
    seriousRisk: "उष्णतेचा परिणाम खूप जास्त आहे. शक्य तितक्या लवकर विश्रांती घ्या.", forceBreak: "विश्रांती सुरू करा",
    ignoreRisk: "जास्त धोका पत्करून पुढे जा", requestBreak: "सुरक्षित विश्रांती मागा", emergency: "आपत्कालीन मदत",
    headingTo: "जात आहात:", pickedUp: "ऑर्डर घेतली. ग्राहकाकडे जात आहात.", earned: "कमावले. पुढची ऑर्डर शोधत आहोत…",
    restShared: "विश्रांतीची सूचना पाठवली", demoCheckin: "QR स्कॅन झाला. डेमो चेक-इन नोंदले; सर्व्हरने ठिकाणाची पडताळणी केली नाही.",
    emergencyAlert: "आपत्कालीन सूचना ही डेमो कृती आहे.", order: "ऑर्डर",
  },
};

export const copy = (language: Language) => language === "hi" ? hindi : english;
