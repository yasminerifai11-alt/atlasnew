// ─── Intel Library Data ─────────────────────────────────────────

export interface LibraryCategory {
  key: string;
  label: string;
  labelAr: string;
  color: string;
  icon: string;
}

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  { key: "news", label: "News & Media", labelAr: "الأخبار والإعلام", color: "#60a5fa", icon: "📰" },
  { key: "conflict", label: "Conflict & Security", labelAr: "النزاعات والأمن", color: "#ef4444", icon: "⚔" },
  { key: "energy", label: "Energy & Commodities", labelAr: "الطاقة والسلع", color: "#f59e0b", icon: "⚡" },
  { key: "maritime", label: "Maritime & Shipping", labelAr: "الشحن البحري", color: "#06b6d4", icon: "🚢" },
  { key: "aviation", label: "Aviation", labelAr: "الطيران", color: "#818cf8", icon: "✈" },
  { key: "satellite", label: "Satellite & Earth", labelAr: "الأقمار الصناعية", color: "#a3e635", icon: "🛰" },
  { key: "seismic", label: "Seismic & Disasters", labelAr: "الزلازل والكوارث", color: "#f97316", icon: "🌍" },
  { key: "cyber", label: "Cyber & Digital", labelAr: "الأمن الإلكتروني", color: "#a78bfa", icon: "🔒" },
  { key: "financial", label: "Financial & Markets", labelAr: "المال والأسواق", color: "#34d399", icon: "📊" },
  { key: "health", label: "Health & Humanitarian", labelAr: "الصحة والإنسانية", color: "#fb7185", icon: "🏥" },
  { key: "space", label: "Space & Satellites", labelAr: "الفضاء", color: "#e879f9", icon: "🚀" },
  { key: "government", label: "Government & Official", labelAr: "الحكومة والرسمي", color: "#94a3b8", icon: "🏛" },
  { key: "defense", label: "Defense & Military", labelAr: "الدفاع والعسكري", color: "#dc2626", icon: "🛡" },
];

export interface LibrarySource {
  id: string;
  name: string;
  category: string;
  type: "API" | "RSS" | "Scrape" | "Satellite" | "Report" | "Platform";
  tier: "active" | "premium";
  reliability: number;
  frequency: string;
  description: string;
  description_ar?: string;
  url?: string;
  lastSynced?: string;
  eventsToday?: number;
  note?: string;
  platform?: string;
  status?: string;
  twitter?: string;
}

export const LIBRARY_SOURCES: LibrarySource[] = [
  // ── News & Media (18) ──
  { id: "reuters", name: "Reuters", category: "news", type: "RSS", tier: "active", reliability: 98, frequency: "Real-time", description: "Tier 1 wire service — breaking news, geopolitical developments", description_ar: "وكالة أنباء من الدرجة الأولى — أخبار عاجلة وتطورات جيوسياسية", url: "feeds.reuters.com", lastSynced: "2m ago", eventsToday: 23 },
  { id: "bbc", name: "BBC News", category: "news", type: "RSS", tier: "active", reliability: 97, frequency: "Real-time", description: "BBC World Service — global coverage with strong ME bureaux", description_ar: "بي بي سي العالمية — تغطية شاملة مع مكاتب قوية في الشرق الأوسط", url: "feeds.bbci.co.uk", lastSynced: "4m ago", eventsToday: 18 },
  { id: "aljazeera", name: "Al Jazeera", category: "news", type: "RSS", tier: "active", reliability: 93, frequency: "Real-time", description: "Qatar-based — strongest MENA coverage, Arabic source network", description_ar: "قطرية — أقوى تغطية لمنطقة الشرق الأوسط وشمال أفريقيا", url: "aljazeera.com", lastSynced: "6m ago", eventsToday: 14 },
  { id: "mee", name: "Middle East Eye", category: "news", type: "RSS", tier: "active", reliability: 88, frequency: "Hourly", description: "Regional news focused on MENA and Turkey", description_ar: "أخبار إقليمية تركز على الشرق الأوسط وشمال أفريقيا وتركيا", url: "middleeasteye.net", lastSynced: "15m ago", eventsToday: 7 },
  { id: "afp", name: "AFP", category: "news", type: "RSS", tier: "active", reliability: 96, frequency: "Real-time", description: "Agence France-Presse — global wire service", description_ar: "وكالة فرانس برس — وكالة أنباء عالمية", url: "afp.com", lastSynced: "3m ago", eventsToday: 19 },
  { id: "apnews", name: "AP News", category: "news", type: "RSS", tier: "active", reliability: 97, frequency: "Real-time", description: "Associated Press — independent wire service", description_ar: "أسوشيتد برس — وكالة أنباء مستقلة", url: "apnews.com", lastSynced: "5m ago", eventsToday: 16 },
  { id: "thenational", name: "The National", category: "news", type: "RSS", tier: "active", reliability: 85, frequency: "Hourly", description: "UAE-based — Gulf perspective, regional analysis", description_ar: "إماراتية — منظور خليجي وتحليل إقليمي", url: "thenationalnews.com", lastSynced: "22m ago", eventsToday: 9 },
  { id: "arabnews", name: "Arab News", category: "news", type: "RSS", tier: "active", reliability: 84, frequency: "Hourly", description: "Saudi Arabia's first English-language daily", description_ar: "أول صحيفة يومية سعودية باللغة الإنجليزية", url: "arabnews.com", lastSynced: "18m ago", eventsToday: 8 },
  { id: "alarabiya", name: "Al Arabiya", category: "news", type: "RSS", tier: "active", reliability: 89, frequency: "Real-time", description: "Saudi-owned — Arabic/English news network", description_ar: "سعودية — شبكة إخبارية بالعربية والإنجليزية", url: "alarabiya.net", lastSynced: "8m ago", eventsToday: 12 },
  { id: "cnn", name: "CNN", category: "news", type: "RSS", tier: "active", reliability: 90, frequency: "Real-time", description: "US cable news — breaking news and analysis", description_ar: "أخبار أمريكية — عاجل وتحليلات", url: "cnn.com", lastSynced: "7m ago", eventsToday: 15 },
  { id: "france24", name: "France 24", category: "news", type: "RSS", tier: "active", reliability: 91, frequency: "Real-time", description: "French international news — Francophone Africa, MENA", description_ar: "أخبار فرنسية دولية — أفريقيا الفرنكوفونية والشرق الأوسط", url: "france24.com", lastSynced: "10m ago", eventsToday: 11 },
  { id: "dw", name: "DW News", category: "news", type: "RSS", tier: "active", reliability: 90, frequency: "Hourly", description: "Deutsche Welle — German international broadcaster", description_ar: "دويتشه فيله — هيئة البث الدولية الألمانية", url: "dw.com", lastSynced: "14m ago", eventsToday: 6 },
  { id: "asharq", name: "Asharq Al-Awsat", category: "news", type: "RSS", tier: "active", reliability: 86, frequency: "Hourly", description: "Pan-Arab daily — Saudi-owned, London-based", description_ar: "صحيفة عربية يومية — سعودية الملكية ومقرها لندن", url: "aawsat.com", lastSynced: "20m ago", eventsToday: 5 },
  { id: "skynews", name: "Sky News Arabia", category: "news", type: "RSS", tier: "active", reliability: 87, frequency: "Real-time", description: "Abu Dhabi-based Arabic news channel", description_ar: "قناة إخبارية عربية مقرها أبوظبي", url: "skynewsarabia.com", lastSynced: "9m ago", eventsToday: 10 },
  { id: "cnbc", name: "CNBC", category: "news", type: "RSS", tier: "active", reliability: 92, frequency: "Real-time", description: "Business/financial news with markets focus", description_ar: "أخبار مالية واقتصادية مع تركيز على الأسواق", url: "cnbc.com", lastSynced: "6m ago", eventsToday: 13 },
  { id: "ft", name: "Financial Times", category: "news", type: "RSS", tier: "premium", reliability: 97, frequency: "Hourly", description: "Premium business/financial journalism", description_ar: "صحافة مالية واقتصادية متميزة" },
  { id: "guardian", name: "The Guardian", category: "news", type: "RSS", tier: "active", reliability: 91, frequency: "Hourly", description: "British daily — investigative reporting, global coverage", description_ar: "صحيفة بريطانية يومية — تحقيقات استقصائية وتغطية عالمية", url: "theguardian.com", lastSynced: "12m ago", eventsToday: 8 },
  { id: "wsj", name: "Wall Street Journal", category: "news", type: "RSS", tier: "premium", reliability: 96, frequency: "Hourly", description: "Premium financial/business journalism", description_ar: "صحافة مالية وتجارية متميزة" },
  { id: "nyt", name: "New York Times", category: "news", type: "RSS", tier: "premium", reliability: 96, frequency: "Real-time", description: "US paper of record — global investigative journalism", description_ar: "صحيفة أمريكية مرجعية — صحافة استقصائية عالمية" },
  { id: "nikkei", name: "Nikkei Asia", category: "news", type: "RSS", tier: "active", reliability: 90, frequency: "Hourly", description: "Asian business and geopolitics coverage", description_ar: "تغطية الأعمال والجغرافيا السياسية الآسيوية", url: "asia.nikkei.com", lastSynced: "25m ago", eventsToday: 5 },
  { id: "tass", name: "TASS", category: "news", type: "RSS", tier: "active", reliability: 78, frequency: "Real-time", description: "Russian state news agency — official Moscow positions", description_ar: "وكالة أنباء الدولة الروسية — المواقف الرسمية لموسكو", url: "tass.com", lastSynced: "15m ago", eventsToday: 9 },
  { id: "xinhua", name: "Xinhua News", category: "news", type: "RSS", tier: "active", reliability: 79, frequency: "Real-time", description: "Chinese state news agency — official Beijing perspectives", description_ar: "وكالة أنباء الدولة الصينية — المنظور الرسمي لبكين", url: "xinhuanet.com", lastSynced: "20m ago", eventsToday: 11 },
  { id: "haaretz", name: "Haaretz", category: "news", type: "RSS", tier: "active", reliability: 88, frequency: "Real-time", description: "Israeli daily — security, politics, defense reporting", description_ar: "صحيفة إسرائيلية يومية — تقارير أمنية وسياسية ودفاعية", url: "haaretz.com", lastSynced: "14m ago", eventsToday: 7 },
  { id: "timesofisrael", name: "Times of Israel", category: "news", type: "RSS", tier: "active", reliability: 85, frequency: "Real-time", description: "Israeli English-language — real-time conflict reporting", description_ar: "إسرائيلية بالإنجليزية — تقارير نزاعات فورية", url: "timesofisrael.com", lastSynced: "8m ago", eventsToday: 10 },
  { id: "dailysabah", name: "Daily Sabah", category: "news", type: "RSS", tier: "active", reliability: 82, frequency: "Hourly", description: "Turkish English-language daily — Ankara perspective", description_ar: "صحيفة تركية يومية بالإنجليزية — منظور أنقرة", url: "dailysabah.com", lastSynced: "30m ago", eventsToday: 4 },
  { id: "tehrantimes", name: "Tehran Times", category: "news", type: "RSS", tier: "active", reliability: 75, frequency: "Hourly", description: "Iranian English-language — official Tehran positions", description_ar: "صحيفة إيرانية بالإنجليزية — المواقف الرسمية لطهران", url: "tehrantimes.com", lastSynced: "35m ago", eventsToday: 3 },
  { id: "scmp", name: "South China Morning Post", category: "news", type: "RSS", tier: "active", reliability: 89, frequency: "Real-time", description: "Hong Kong-based — Asia-Pacific geopolitics", description_ar: "مقرها هونغ كونغ — جغرافيا سياسية لآسيا والمحيط الهادئ", url: "scmp.com", lastSynced: "18m ago", eventsToday: 8 },
  { id: "trt", name: "TRT World", category: "news", type: "RSS", tier: "active", reliability: 83, frequency: "Real-time", description: "Turkish public broadcaster — MENA and Central Asia coverage", description_ar: "هيئة البث العامة التركية — تغطية الشرق الأوسط وآسيا الوسطى", url: "trtworld.com", lastSynced: "22m ago", eventsToday: 6 },
  { id: "dawn", name: "Dawn News", category: "news", type: "RSS", tier: "active", reliability: 84, frequency: "Hourly", description: "Pakistan's oldest English daily — South Asia security", description_ar: "أقدم صحيفة إنجليزية في باكستان — أمن جنوب آسيا", url: "dawn.com", lastSynced: "40m ago", eventsToday: 4 },
  { id: "almonitor", name: "Al-Monitor", category: "news", type: "RSS", tier: "active", reliability: 90, frequency: "Hourly", description: "MENA policy and politics — expert analysis network", description_ar: "سياسة وشؤون الشرق الأوسط — شبكة تحليل الخبراء", url: "al-monitor.com", lastSynced: "28m ago", eventsToday: 5 },

  // ── Conflict & Security (14) ──
  { id: "gdelt", name: "GDELT Project", category: "conflict", type: "API", tier: "active", reliability: 85, frequency: "15 min", description: "Global events database — monitors news from every country in real-time", description_ar: "قاعدة بيانات عالمية للأحداث واللغة والنبرة — يرصد وسائل الإعلام من كل دولة في الوقت الفعلي", url: "api.gdeltproject.org", lastSynced: "8m ago", eventsToday: 47 },
  { id: "acled", name: "ACLED", category: "conflict", type: "API", tier: "premium", reliability: 92, frequency: "Hourly", description: "Armed Conflict Location & Event Data — political violence tracking", description_ar: "بيانات مواقع وأحداث النزاعات المسلحة — تتبع العنف السياسي" },
  { id: "liveuamap", name: "LiveUAMap", category: "conflict", type: "Scrape", tier: "premium", reliability: 80, frequency: "Real-time", description: "Crowd-sourced conflict mapping — geolocated military activity", description_ar: "خرائط نزاعات تشاركية — نشاط عسكري محدد الموقع جغرافياً" },
  { id: "opensanctions", name: "OpenSanctions", category: "conflict", type: "API", tier: "premium", reliability: 87, frequency: "Daily", description: "Sanctions lists, PEPs, and entities of interest", description_ar: "قوائم العقوبات والشخصيات السياسية البارزة والكيانات المعنية" },
  { id: "janes-conflict", name: "Jane's Intelligence", category: "conflict", type: "API", tier: "premium", reliability: 96, frequency: "Daily", description: "Military intelligence — threat assessments, order of battle", description_ar: "استخبارات عسكرية — تقييم التهديدات وترتيب القوات" },
  { id: "iiss-conflict", name: "IISS", category: "conflict", type: "Report", tier: "premium", reliability: 95, frequency: "Monthly", description: "Strategic assessments — armed conflict survey, strategic comments", description_ar: "تقييمات استراتيجية — مسح النزاعات المسلحة وتعليقات استراتيجية" },
  { id: "crisisgroup", name: "Crisis Group", category: "conflict", type: "RSS", tier: "active", reliability: 94, frequency: "Weekly", description: "Conflict prevention — crisis alerts, watchlists, briefings", description_ar: "منع النزاعات — تنبيهات الأزمات وقوائم المراقبة والإحاطات", url: "crisisgroup.org", lastSynced: "1h ago", eventsToday: 2 },
  { id: "sipri-conflict", name: "SIPRI Conflict Data", category: "conflict", type: "API", tier: "active", reliability: 93, frequency: "Quarterly", description: "Stockholm Peace Research Institute — conflict patterns", description_ar: "معهد ستوكهولم لأبحاث السلام — أنماط النزاعات", url: "sipri.org", lastSynced: "3d ago", eventsToday: 0 },
  { id: "rand", name: "RAND Reports", category: "conflict", type: "RSS", tier: "premium", reliability: 91, frequency: "Weekly", description: "Policy research — security, defense, and foreign policy analysis", description_ar: "أبحاث سياسات — تحليل الأمن والدفاع والسياسة الخارجية" },
  { id: "ucdp", name: "UCDP", category: "conflict", type: "API", tier: "active", reliability: 90, frequency: "Monthly", description: "Uppsala Conflict Data Program — organized violence datasets", description_ar: "برنامج أوبسالا لبيانات النزاعات — مجموعات بيانات العنف المنظم", url: "ucdp.uu.se", lastSynced: "5d ago", eventsToday: 0 },
  { id: "gtd", name: "Global Terrorism Database", category: "conflict", type: "API", tier: "premium", reliability: 89, frequency: "Quarterly", description: "START — comprehensive terrorism event database", description_ar: "START — قاعدة بيانات شاملة لأحداث الإرهاب" },
  { id: "anthropic", name: "Anthropic Claude AI", category: "conflict", type: "API", tier: "active", reliability: 95, frequency: "Per event", description: "AI enrichment — bilingual analysis, consequence chains", description_ar: "إثراء بالذكاء الاصطناعي — تحليل ثنائي اللغة وسلاسل التداعيات", url: "api.anthropic.com", lastSynced: "1m ago", eventsToday: 35 },
  { id: "conflictalert", name: "Conflict Alert", category: "conflict", type: "RSS", tier: "active", reliability: 86, frequency: "Daily", description: "IEP — real-time conflict monitoring and peace metrics", description_ar: "IEP — رصد النزاعات فورياً ومقاييس السلام", url: "visionofhumanity.org", lastSynced: "4h ago", eventsToday: 1 },
  { id: "csis", name: "CSIS Analysis", category: "conflict", type: "RSS", tier: "premium", reliability: 93, frequency: "Weekly", description: "Center for Strategic Studies — strategic and policy analysis", description_ar: "مركز الدراسات الاستراتيجية — تحليل استراتيجي وسياسي" },
  { id: "bellingcat", name: "Bellingcat", category: "conflict", type: "Scrape", tier: "active", reliability: 91, frequency: "Daily", description: "Open-source investigations — geolocation, weapons analysis", description_ar: "تحقيقات مفتوحة المصدر — تحديد المواقع وتحليل الأسلحة", url: "bellingcat.com", lastSynced: "2h ago", eventsToday: 1 },
  { id: "osintframework", name: "OSINT Framework", category: "conflict", type: "Platform", tier: "active", reliability: 83, frequency: "Real-time", description: "Meta-OSINT tool aggregation — search, social, geolocation", description_ar: "تجميع أدوات الاستخبارات المفتوحة — البحث والاجتماعي وتحديد المواقع", url: "osintframework.com", lastSynced: "1h ago", eventsToday: 0 },
  { id: "saferworld", name: "Saferworld", category: "conflict", type: "Report", tier: "active", reliability: 87, frequency: "Monthly", description: "Conflict sensitivity and peacebuilding research", description_ar: "أبحاث حساسية النزاعات وبناء السلام", url: "saferworld.org.uk", lastSynced: "10d ago", eventsToday: 0 },
  { id: "rulac", name: "RULAC Geneva", category: "conflict", type: "API", tier: "premium", reliability: 94, frequency: "Weekly", description: "Rule of Law in Armed Conflicts — legal classification of conflicts", description_ar: "سيادة القانون في النزاعات المسلحة — التصنيف القانوني للنزاعات" },
  { id: "coi-tracker", name: "COI Tracker", category: "conflict", type: "Scrape", tier: "active", reliability: 81, frequency: "Daily", description: "Country of origin information for conflict zones", description_ar: "معلومات بلد المنشأ لمناطق النزاع", url: "ecoi.net", lastSynced: "6h ago", eventsToday: 2 },
  { id: "menaconflict", name: "MENA Conflict Monitor", category: "conflict", type: "RSS", tier: "active", reliability: 86, frequency: "Daily", description: "Regional conflict tracking across MENA states", description_ar: "تتبع النزاعات الإقليمية عبر دول الشرق الأوسط وشمال أفريقيا", url: "menaconflict.org", lastSynced: "4h ago", eventsToday: 3 },
  { id: "chatham", name: "Chatham House", category: "conflict", type: "Report", tier: "premium", reliability: 93, frequency: "Weekly", description: "Royal Institute — geopolitical risk and conflict analysis", description_ar: "المعهد الملكي — تحليل المخاطر الجيوسياسية والنزاعات" },
  { id: "brookings", name: "Brookings Foreign Policy", category: "conflict", type: "RSS", tier: "active", reliability: 92, frequency: "Weekly", description: "Policy research — Middle East, security, governance", description_ar: "أبحاث سياسات — الشرق الأوسط والأمن والحوكمة", url: "brookings.edu", lastSynced: "1d ago", eventsToday: 1 },
  { id: "soufancenter", name: "Soufan Center", category: "conflict", type: "RSS", tier: "active", reliability: 90, frequency: "Weekly", description: "Terrorism and counterterrorism intelligence briefs", description_ar: "إحاطات استخباراتية عن الإرهاب ومكافحة الإرهاب", url: "thesoufancenter.org", lastSynced: "2d ago", eventsToday: 0 },

  // ── Energy & Commodities (12) ──
  { id: "eia", name: "EIA Energy Data", category: "energy", type: "API", tier: "active", reliability: 99, frequency: "Daily", description: "US Energy Information Administration — oil, gas, prices", description_ar: "بيانات الطاقة الأمريكية — إنتاج النفط والتخزين والأسعار الفورية", url: "api.eia.gov", lastSynced: "1h ago", eventsToday: 2 },
  { id: "icis", name: "ICIS Energy", category: "energy", type: "API", tier: "premium", reliability: 96, frequency: "Daily", description: "Energy commodity intelligence — LNG, gas, carbon", description_ar: "استخبارات سلع الطاقة — الغاز المسال والغاز والكربون" },
  { id: "platts", name: "S&P Global Platts", category: "energy", type: "API", tier: "premium", reliability: 98, frequency: "Real-time", description: "Benchmark energy pricing — Brent, Dubai crude, LNG", description_ar: "أسعار الطاقة المرجعية — برنت وخام دبي والغاز المسال" },
  { id: "opec", name: "OPEC MOMR", category: "energy", type: "Report", tier: "active", reliability: 85, frequency: "Monthly", description: "Monthly Oil Market Report — quotas, compliance", description_ar: "تقرير سوق النفط الشهري — الحصص والالتزام", url: "opec.org", lastSynced: "5d ago", eventsToday: 0 },
  { id: "iea", name: "IEA Oil Market Report", category: "energy", type: "Report", tier: "premium", reliability: 93, frequency: "Monthly", description: "Supply/demand balance, strategic reserves", description_ar: "توازن العرض والطلب والاحتياطيات الاستراتيجية" },
  { id: "argus", name: "Argus Media", category: "energy", type: "API", tier: "premium", reliability: 95, frequency: "Daily", description: "Energy and commodity price reporting", description_ar: "تقارير أسعار الطاقة والسلع" },
  { id: "rystad", name: "Rystad Energy", category: "energy", type: "API", tier: "premium", reliability: 92, frequency: "Daily", description: "Oil & gas analytics — production forecasts, cost analysis", description_ar: "تحليلات النفط والغاز — توقعات الإنتاج وتحليل التكاليف" },
  { id: "oilprice", name: "OilPrice.com", category: "energy", type: "RSS", tier: "active", reliability: 82, frequency: "Real-time", description: "Oil and energy news aggregation", description_ar: "تجميع أخبار النفط والطاقة", url: "oilprice.com", lastSynced: "12m ago", eventsToday: 6 },
  { id: "jodi", name: "JODI Oil Data", category: "energy", type: "API", tier: "active", reliability: 90, frequency: "Monthly", description: "Joint Organisations Data Initiative — oil statistics", description_ar: "مبادرة البيانات المشتركة بين المنظمات — إحصاءات النفط", url: "jodidata.org", lastSynced: "7d ago", eventsToday: 0 },
  { id: "gecf", name: "GECF Gas Data", category: "energy", type: "Report", tier: "active", reliability: 88, frequency: "Monthly", description: "Gas Exporting Countries Forum — gas market outlook", description_ar: "منتدى الدول المصدرة للغاز — توقعات سوق الغاز", url: "gecf.org", lastSynced: "14d ago", eventsToday: 0 },
  { id: "woodmac", name: "Wood Mackenzie", category: "energy", type: "API", tier: "premium", reliability: 94, frequency: "Daily", description: "Energy research — upstream, downstream, power", description_ar: "أبحاث الطاقة — المنبع والمصب والكهرباء" },
  { id: "kpler", name: "Kpler Cargo Tracking", category: "energy", type: "API", tier: "premium", reliability: 93, frequency: "Real-time", description: "Commodity cargo tracking — oil, LNG, dry bulk flows", description_ar: "تتبع شحنات السلع — تدفقات النفط والغاز المسال والسائبة الجافة" },
  { id: "irena", name: "IRENA Data", category: "energy", type: "API", tier: "active", reliability: 91, frequency: "Monthly", description: "International Renewable Energy Agency — capacity and investment data", description_ar: "الوكالة الدولية للطاقة المتجددة — بيانات القدرة والاستثمار", url: "irena.org", lastSynced: "5d ago", eventsToday: 0 },
  { id: "entsog", name: "ENTSOG Gas Flows", category: "energy", type: "API", tier: "active", reliability: 93, frequency: "Hourly", description: "European gas transmission — real-time pipeline flows", description_ar: "نقل الغاز الأوروبي — تدفقات خطوط الأنابيب الفورية", url: "entsog.eu", lastSynced: "30m ago", eventsToday: 4 },
  { id: "gasdata", name: "GIIGNL LNG Data", category: "energy", type: "Report", tier: "premium", reliability: 90, frequency: "Quarterly", description: "International Group of LNG Importers — global LNG trade", description_ar: "المجموعة الدولية لمستوردي الغاز المسال — تجارة الغاز المسال العالمية" },
  { id: "vortexa", name: "Vortexa Energy", category: "energy", type: "API", tier: "premium", reliability: 92, frequency: "Real-time", description: "Cargo and refinery analytics — crude and product flows", description_ar: "تحليلات الشحنات والمصافي — تدفقات النفط الخام والمنتجات" },
  { id: "nuclearenergy", name: "IAEA PRIS", category: "energy", type: "API", tier: "active", reliability: 97, frequency: "Daily", description: "Power Reactor Information System — nuclear plant status", description_ar: "نظام معلومات المفاعلات — حالة المحطات النووية", url: "pris.iaea.org", lastSynced: "12h ago", eventsToday: 0 },
  { id: "ember", name: "Ember Climate", category: "energy", type: "API", tier: "active", reliability: 88, frequency: "Monthly", description: "Global electricity generation data and carbon tracking", description_ar: "بيانات توليد الكهرباء العالمية وتتبع الكربون", url: "ember-climate.org", lastSynced: "3d ago", eventsToday: 0 },
  { id: "adnoc-data", name: "ADNOC Market Data", category: "energy", type: "API", tier: "premium", reliability: 89, frequency: "Daily", description: "Abu Dhabi oil production and Murban crude pricing", description_ar: "إنتاج النفط في أبوظبي وتسعير خام مربان" },

  // ── Maritime & Shipping (8) ──
  { id: "marinetraffic", name: "MarineTraffic AIS", category: "maritime", type: "API", tier: "premium", reliability: 95, frequency: "Real-time", description: "Full AIS vessel tracking — maritime domain awareness", description_ar: "تتبع السفن عبر AIS — الوعي بالمجال البحري" },
  { id: "lloyds", name: "Lloyd's List Intelligence", category: "maritime", type: "API", tier: "premium", reliability: 97, frequency: "Daily", description: "Premium maritime intelligence — shipping risk, sanctions", description_ar: "استخبارات بحرية متميزة — مخاطر الشحن والعقوبات" },
  { id: "ukmto", name: "UKMTO", category: "maritime", type: "RSS", tier: "active", reliability: 97, frequency: "As needed", description: "UK Maritime Trade Operations — Gulf/Red Sea advisories", description_ar: "عمليات التجارة البحرية البريطانية — تحذيرات الخليج والبحر الأحمر", url: "ukmto.org", lastSynced: "3h ago", eventsToday: 1 },
  { id: "imb", name: "IMB Piracy Centre", category: "maritime", type: "RSS", tier: "active", reliability: 96, frequency: "Daily", description: "ICC — piracy attacks, boarding incidents, threat areas", description_ar: "ICC — هجمات القرصنة وحوادث الصعود ومناطق التهديد", url: "icc-ccs.org", lastSynced: "6h ago", eventsToday: 0 },
  { id: "windward", name: "Windward", category: "maritime", type: "API", tier: "premium", reliability: 91, frequency: "Real-time", description: "AI maritime intelligence — dark activity detection", description_ar: "استخبارات بحرية بالذكاء الاصطناعي — كشف النشاط المظلم" },
  { id: "vesselfinder", name: "VesselFinder", category: "maritime", type: "API", tier: "active", reliability: 88, frequency: "Real-time", description: "Live vessel tracking — port calls, routes", description_ar: "تتبع السفن مباشرة — المرافئ والمسارات", url: "vesselfinder.com", lastSynced: "5m ago", eventsToday: 4 },
  { id: "seaintel", name: "Sea-Intelligence", category: "maritime", type: "Report", tier: "premium", reliability: 90, frequency: "Weekly", description: "Container shipping analytics — schedule reliability", description_ar: "تحليلات شحن الحاويات — موثوقية الجداول الزمنية" },
  { id: "dryad", name: "Dryad Global", category: "maritime", type: "RSS", tier: "active", reliability: 92, frequency: "Daily", description: "Maritime security — threat assessments, risk ratings", description_ar: "أمن بحري — تقييمات التهديدات وتصنيفات المخاطر", url: "dryadglobal.com", lastSynced: "2h ago", eventsToday: 2 },
  { id: "imo", name: "IMO GISIS", category: "maritime", type: "API", tier: "active", reliability: 96, frequency: "Daily", description: "International Maritime Organization — safety, port state control", description_ar: "المنظمة البحرية الدولية — السلامة ورقابة دولة الميناء", url: "gisis.imo.org", lastSynced: "6h ago", eventsToday: 1 },
  { id: "exactearth", name: "exactEarth AIS", category: "maritime", type: "API", tier: "premium", reliability: 93, frequency: "Real-time", description: "Satellite AIS — global vessel detection including dark ships", description_ar: "AIS عبر الأقمار الصناعية — كشف السفن عالمياً بما فيها المظلمة" },
  { id: "recaap", name: "ReCAAP ISC", category: "maritime", type: "RSS", tier: "active", reliability: 91, frequency: "Weekly", description: "Asian piracy and armed robbery reports — Malacca Strait focus", description_ar: "تقارير القرصنة في آسيا — التركيز على مضيق ملقا", url: "recaap.org", lastSynced: "2d ago", eventsToday: 0 },
  { id: "mdat-goa", name: "MDAT-GoA", category: "maritime", type: "RSS", tier: "active", reliability: 95, frequency: "As needed", description: "Maritime Domain Awareness for Trade — Gulf of Aden advisories", description_ar: "الوعي البحري التجاري — تحذيرات خليج عدن", url: "mdat.goa.org", lastSynced: "5h ago", eventsToday: 1 },
  { id: "portwatch", name: "IMF PortWatch", category: "maritime", type: "API", tier: "active", reliability: 89, frequency: "Daily", description: "IMF port disruption tracking and trade flow analysis", description_ar: "تتبع اضطرابات الموانئ وتحليل تدفقات التجارة من صندوق النقد", url: "portwatch.imf.org", lastSynced: "3h ago", eventsToday: 2 },
  { id: "spire-maritime", name: "Spire Maritime", category: "maritime", type: "API", tier: "premium", reliability: 92, frequency: "Real-time", description: "Satellite-powered vessel tracking and predictive analytics", description_ar: "تتبع السفن بالأقمار الصناعية والتحليلات التنبؤية" },
  { id: "drewry", name: "Drewry Shipping", category: "maritime", type: "Report", tier: "premium", reliability: 90, frequency: "Weekly", description: "Container shipping indices — WCI benchmark rates", description_ar: "مؤشرات شحن الحاويات — أسعار WCI المرجعية" },
  { id: "hellenicshipping", name: "Hellenic Shipping News", category: "maritime", type: "RSS", tier: "active", reliability: 84, frequency: "Daily", description: "Global shipping and maritime industry news", description_ar: "أخبار الشحن والصناعة البحرية العالمية", url: "hellenicshippingnews.com", lastSynced: "1h ago", eventsToday: 3 },
  { id: "suezcanal", name: "Suez Canal Authority", category: "maritime", type: "API", tier: "active", reliability: 94, frequency: "Daily", description: "Transit statistics, convoy schedules, toll data", description_ar: "إحصاءات العبور وجداول القوافل وبيانات الرسوم", url: "suezcanal.gov.eg", lastSynced: "4h ago", eventsToday: 1 },

  // ── Aviation (5) ──
  { id: "flightaware", name: "FlightAware", category: "aviation", type: "API", tier: "premium", reliability: 94, frequency: "Real-time", description: "Global flight tracking — military and civilian aviation", description_ar: "تتبع الرحلات عالمياً — الطيران العسكري والمدني" },
  { id: "flightradar24", name: "FlightRadar24", category: "aviation", type: "API", tier: "premium", reliability: 89, frequency: "Real-time", description: "ADS-B flight tracking and aviation data", description_ar: "تتبع الرحلات عبر ADS-B وبيانات الطيران" },
  { id: "opensky", name: "OpenSky Network", category: "aviation", type: "API", tier: "active", reliability: 88, frequency: "Real-time", description: "Open airspace monitoring and anomaly detection", description_ar: "مراقبة المجال الجوي المفتوح وكشف الشذوذ", url: "opensky-network.org", lastSynced: "10m ago", eventsToday: 3 },
  { id: "iata", name: "IATA Alerts", category: "aviation", type: "RSS", tier: "active", reliability: 95, frequency: "Daily", description: "International Air Transport Association — safety, advisories", description_ar: "الاتحاد الدولي للنقل الجوي — السلامة والتحذيرات", url: "iata.org", lastSynced: "4h ago", eventsToday: 1 },
  { id: "eurocontrol", name: "Eurocontrol", category: "aviation", type: "API", tier: "premium", reliability: 93, frequency: "Real-time", description: "European air traffic management data", description_ar: "بيانات إدارة حركة الملاحة الجوية الأوروبية" },
  { id: "icao", name: "ICAO Safety Data", category: "aviation", type: "API", tier: "active", reliability: 97, frequency: "Monthly", description: "International Civil Aviation Organization — safety reports and NOTAMs", description_ar: "منظمة الطيران المدني الدولي — تقارير السلامة والإشعارات", url: "icao.int", lastSynced: "2d ago", eventsToday: 0 },
  { id: "asn", name: "Aviation Safety Network", category: "aviation", type: "Scrape", tier: "active", reliability: 93, frequency: "Real-time", description: "Aircraft accidents and incidents database worldwide", description_ar: "قاعدة بيانات حوادث ووقائع الطيران عالمياً", url: "aviation-safety.net", lastSynced: "3h ago", eventsToday: 1 },
  { id: "adsbexchange", name: "ADS-B Exchange", category: "aviation", type: "API", tier: "active", reliability: 86, frequency: "Real-time", description: "Unfiltered ADS-B data — military aircraft tracking", description_ar: "بيانات ADS-B غير مفلترة — تتبع الطائرات العسكرية", url: "adsbexchange.com", lastSynced: "2m ago", eventsToday: 8 },
  { id: "planefinder", name: "PlaneFinder", category: "aviation", type: "API", tier: "active", reliability: 85, frequency: "Real-time", description: "Global flight tracking with historical playback", description_ar: "تتبع الرحلات عالمياً مع إعادة عرض تاريخية", url: "planefinder.net", lastSynced: "5m ago", eventsToday: 4 },
  { id: "gcaa", name: "UAE GCAA", category: "aviation", type: "RSS", tier: "active", reliability: 92, frequency: "Daily", description: "UAE General Civil Aviation Authority — airspace advisories", description_ar: "الهيئة العامة للطيران المدني الإماراتية — تحذيرات المجال الجوي", url: "gcaa.gov.ae", lastSynced: "8h ago", eventsToday: 0 },
  { id: "gaca", name: "Saudi GACA", category: "aviation", type: "RSS", tier: "active", reliability: 91, frequency: "Daily", description: "Saudi General Authority of Civil Aviation — safety bulletins", description_ar: "الهيئة العامة للطيران المدني السعودية — نشرات السلامة", url: "gaca.gov.sa", lastSynced: "10h ago", eventsToday: 0 },
  { id: "aireon", name: "Aireon Space-Based ADS-B", category: "aviation", type: "API", tier: "premium", reliability: 94, frequency: "Real-time", description: "Space-based global aircraft surveillance — oceanic tracking", description_ar: "مراقبة الطائرات الفضائية عالمياً — تتبع المحيطات" },
  { id: "cirium", name: "Cirium Aviation Data", category: "aviation", type: "API", tier: "premium", reliability: 93, frequency: "Real-time", description: "Flight status, fleet analytics, and schedule data", description_ar: "حالة الرحلات وتحليلات الأسطول وبيانات الجداول" },

  // ── Satellite & Earth (4) ──
  { id: "nasafirms", name: "NASA FIRMS", category: "satellite", type: "API", tier: "active", reliability: 92, frequency: "6 hours", description: "Satellite fire detection via VIIRS/MODIS", description_ar: "معلومات الحرائق عبر الأقمار الصناعية — رصد الحرارة والحرائق عبر VIIRS وMODIS", url: "firms.modaps.eosdis.nasa.gov", lastSynced: "2h ago", eventsToday: 8 },
  { id: "nasaeonet", name: "NASA EONET", category: "satellite", type: "API", tier: "active", reliability: 95, frequency: "Hourly", description: "Earth Observatory Natural Event Tracker", description_ar: "متتبع الأحداث الطبيعية عبر الأقمار — حرائق وعواصف وبراكين", url: "eonet.gsfc.nasa.gov", lastSynced: "45m ago", eventsToday: 5 },
  { id: "sentinel", name: "Sentinel Hub", category: "satellite", type: "Satellite", tier: "premium", reliability: 94, frequency: "5 days", description: "ESA Copernicus — change detection, monitoring", description_ar: "كوبرنيكوس ESA — كشف التغيرات والمراقبة" },
  { id: "planetlabs", name: "Planet Labs", category: "satellite", type: "API", tier: "premium", reliability: 91, frequency: "Daily", description: "High-resolution daily satellite imagery", description_ar: "صور أقمار صناعية يومية عالية الدقة" },
  { id: "landsat", name: "Landsat 9", category: "satellite", type: "API", tier: "active", reliability: 95, frequency: "16 days", description: "USGS/NASA — multispectral Earth observation since 1972", description_ar: "USGS/NASA — رصد أرضي متعدد الأطياف منذ 1972", url: "earthexplorer.usgs.gov", lastSynced: "2d ago", eventsToday: 0 },
  { id: "goes", name: "NOAA GOES", category: "satellite", type: "API", tier: "active", reliability: 97, frequency: "15 min", description: "Geostationary weather satellites — storm and fire detection", description_ar: "أقمار صناعية جغرافية ثابتة — كشف العواصف والحرائق", url: "goes.noaa.gov", lastSynced: "15m ago", eventsToday: 6 },
  { id: "eumetsat", name: "EUMETSAT", category: "satellite", type: "API", tier: "active", reliability: 96, frequency: "30 min", description: "European meteorological satellites — Meteosat imagery", description_ar: "الأقمار الصناعية الأوروبية للأرصاد الجوية — صور ميتيوسات", url: "eumetsat.int", lastSynced: "30m ago", eventsToday: 4 },
  { id: "blackbridge", name: "Planet RapidEye", category: "satellite", type: "Satellite", tier: "premium", reliability: 89, frequency: "Daily", description: "5-band multispectral — agriculture and environmental monitoring", description_ar: "متعدد الأطياف بخمس نطاقات — مراقبة زراعية وبيئية" },
  { id: "iceye", name: "ICEYE SAR", category: "satellite", type: "Satellite", tier: "premium", reliability: 92, frequency: "Daily", description: "Synthetic aperture radar — all-weather day/night imaging", description_ar: "رادار الفتحة الاصطناعية — تصوير في جميع الأحوال ليلاً ونهاراً" },
  { id: "airbus-sat", name: "Airbus Defence & Space", category: "satellite", type: "Satellite", tier: "premium", reliability: 94, frequency: "Daily", description: "Pleiades and SPOT imagery — 30cm to 1.5m resolution", description_ar: "صور بلياديس وسبوت — دقة من 30 سم إلى 1.5 متر" },
  { id: "umbra", name: "Umbra SAR", category: "satellite", type: "Satellite", tier: "premium", reliability: 88, frequency: "Daily", description: "Commercial SAR constellation — 25cm resolution radar imagery", description_ar: "كوكبة رادار تجارية — صور رادارية بدقة 25 سم" },
  { id: "capella", name: "Capella Space SAR", category: "satellite", type: "Satellite", tier: "premium", reliability: 90, frequency: "Hourly", description: "On-demand SAR imaging — rapid tasking for change detection", description_ar: "تصوير رادار عند الطلب — مهام سريعة لكشف التغيرات" },
  { id: "copernicus-ems", name: "Copernicus EMS", category: "satellite", type: "API", tier: "active", reliability: 95, frequency: "As needed", description: "Emergency mapping service — disaster damage assessment", description_ar: "خدمة رسم خرائط الطوارئ — تقييم أضرار الكوارث", url: "emergency.copernicus.eu", lastSynced: "1d ago", eventsToday: 1 },
  { id: "worldview", name: "Maxar WorldView Legion", category: "satellite", type: "Satellite", tier: "premium", reliability: 96, frequency: "Multiple daily", description: "Next-gen EO — 30cm resolution, 15 revisits per day", description_ar: "الجيل التالي من الرصد — دقة 30 سم و15 زيارة يومياً" },
  { id: "gibs", name: "NASA GIBS", category: "satellite", type: "API", tier: "active", reliability: 93, frequency: "Daily", description: "Global Imagery Browse Services — Worldview satellite composites", description_ar: "خدمات تصفح الصور العالمية — مركبات صور الأقمار الصناعية", url: "gibs.earthdata.nasa.gov", lastSynced: "3h ago", eventsToday: 2 },

  // ── Seismic & Disasters (4) ──
  { id: "usgs", name: "USGS Earthquakes", category: "seismic", type: "API", tier: "active", reliability: 99, frequency: "5 min", description: "Real-time global seismic monitoring", description_ar: "رصد الزلازل فورياً — الشدة والعمق والموقع لجميع الأحداث الزلزالية العالمية", url: "earthquake.usgs.gov", lastSynced: "3m ago", eventsToday: 12 },
  { id: "emsc", name: "EMSC", category: "seismic", type: "RSS", tier: "active", reliability: 98, frequency: "Real-time", description: "European-Mediterranean seismic monitoring", description_ar: "رصد زلزالي أوروبي-متوسطي", url: "emsc-csem.org", lastSynced: "5m ago", eventsToday: 9 },
  { id: "gdacs", name: "GDACS Disasters", category: "seismic", type: "RSS", tier: "active", reliability: 97, frequency: "Real-time", description: "UN disaster alert and coordination system", description_ar: "نظام التنبيه والتنسيق العالمي للكوارث — إنذار مبكر للكوارث الطبيعية", url: "gdacs.org", lastSynced: "12m ago", eventsToday: 3 },
  { id: "ptwc", name: "Pacific Tsunami Warning", category: "seismic", type: "RSS", tier: "active", reliability: 99, frequency: "As needed", description: "NOAA — tsunami warnings and watches", description_ar: "NOAA — تحذيرات ومراقبة أمواج التسونامي", url: "tsunami.gov", lastSynced: "1h ago", eventsToday: 0 },
  { id: "iris", name: "IRIS Seismology", category: "seismic", type: "API", tier: "active", reliability: 96, frequency: "Real-time", description: "IRIS — seismographic network data and earthquake catalogs", description_ar: "IRIS — بيانات شبكة أجهزة الرصد الزلزالي وكتالوجات الزلازل", url: "iris.edu", lastSynced: "8m ago", eventsToday: 7 },
  { id: "gfz", name: "GFZ Potsdam", category: "seismic", type: "API", tier: "active", reliability: 95, frequency: "Real-time", description: "German Research Centre for Geosciences — seismic monitoring", description_ar: "مركز الأبحاث الألماني لعلوم الأرض — الرصد الزلزالي", url: "geofon.gfz-potsdam.de", lastSynced: "10m ago", eventsToday: 5 },
  { id: "jma", name: "JMA Earthquakes", category: "seismic", type: "API", tier: "active", reliability: 98, frequency: "Real-time", description: "Japan Meteorological Agency — seismic and tsunami alerts", description_ar: "وكالة الأرصاد اليابانية — تنبيهات الزلازل والتسونامي", url: "jma.go.jp", lastSynced: "5m ago", eventsToday: 4 },
  { id: "ingv", name: "INGV Italy", category: "seismic", type: "API", tier: "active", reliability: 94, frequency: "Real-time", description: "Italian seismology institute — Mediterranean earthquake data", description_ar: "المعهد الإيطالي لعلم الزلازل — بيانات زلازل المتوسط", url: "ingv.it", lastSynced: "12m ago", eventsToday: 3 },
  { id: "ifrc", name: "IFRC GO Platform", category: "seismic", type: "API", tier: "active", reliability: 94, frequency: "As needed", description: "Red Cross/Crescent — disaster response coordination", description_ar: "الصليب الأحمر/الهلال الأحمر — تنسيق الاستجابة للكوارث", url: "go.ifrc.org", lastSynced: "2h ago", eventsToday: 1 },
  { id: "pdc", name: "PDC DisasterAWARE", category: "seismic", type: "Platform", tier: "premium", reliability: 93, frequency: "Real-time", description: "Pacific Disaster Center — multi-hazard early warning", description_ar: "مركز كوارث المحيط الهادئ — إنذار مبكر متعدد المخاطر" },
  { id: "reliefweb-disaster", name: "ReliefWeb Disasters", category: "seismic", type: "RSS", tier: "active", reliability: 93, frequency: "Real-time", description: "UN-curated disaster page — global natural hazard alerts", description_ar: "صفحة الكوارث المنسقة أممياً — تنبيهات المخاطر الطبيعية العالمية", url: "reliefweb.int/disasters", lastSynced: "1h ago", eventsToday: 2 },
  { id: "volcanodiscovery", name: "VolcanoDiscovery", category: "seismic", type: "Scrape", tier: "active", reliability: 87, frequency: "Daily", description: "Volcanic activity monitoring and eruption alerts worldwide", description_ar: "مراقبة النشاط البركاني وتنبيهات الثورات حول العالم", url: "volcanodiscovery.com", lastSynced: "4h ago", eventsToday: 1 },
  { id: "ncm-uae", name: "UAE NCM", category: "seismic", type: "RSS", tier: "active", reliability: 92, frequency: "Real-time", description: "UAE National Center of Meteorology — weather and seismic alerts", description_ar: "المركز الوطني للأرصاد الإماراتي — تنبيهات الطقس والزلازل", url: "ncm.ae", lastSynced: "30m ago", eventsToday: 2 },

  // ── Cyber & Digital (6) ──
  { id: "cisa", name: "CISA Alerts", category: "cyber", type: "RSS", tier: "active", reliability: 99, frequency: "As needed", description: "Critical vulnerability and threat advisories", description_ar: "تحذيرات الثغرات الحرجة والتهديدات الأمنية", url: "us-cert.cisa.gov", lastSynced: "2h ago", eventsToday: 2 },
  { id: "netblocks", name: "NetBlocks", category: "cyber", type: "RSS", tier: "active", reliability: 94, frequency: "As needed", description: "Internet freedom — verified shutdowns and disruptions", description_ar: "مرصد حرية الإنترنت — انقطاعات واضطرابات موثقة", url: "netblocks.org", lastSynced: "1h ago", eventsToday: 0 },
  { id: "otx", name: "OTX AlienVault", category: "cyber", type: "API", tier: "premium", reliability: 82, frequency: "Hourly", description: "Open Threat Exchange — cyber threat indicators", description_ar: "منصة تبادل التهديدات المفتوحة — مؤشرات التهديدات السيبرانية" },
  { id: "recordedfuture", name: "Recorded Future", category: "cyber", type: "API", tier: "premium", reliability: 91, frequency: "Real-time", description: "Threat intelligence — dark web, nation-state actors", description_ar: "استخبارات التهديدات — الويب المظلم والجهات الفاعلة الحكومية" },
  { id: "mandiant", name: "Mandiant", category: "cyber", type: "API", tier: "premium", reliability: 94, frequency: "Daily", description: "Google — threat intelligence, incident response", description_ar: "جوجل — استخبارات التهديدات والاستجابة للحوادث" },
  { id: "kaspersky", name: "Kaspersky Threat Intel", category: "cyber", type: "API", tier: "premium", reliability: 88, frequency: "Daily", description: "Threat data feeds — malware, APT tracking", description_ar: "تغذيات بيانات التهديدات — البرمجيات الخبيثة وتتبع APT" },
  { id: "virustotal", name: "VirusTotal", category: "cyber", type: "API", tier: "active", reliability: 90, frequency: "Real-time", description: "Google — malware analysis and threat intelligence sharing", description_ar: "جوجل — تحليل البرمجيات الخبيثة ومشاركة استخبارات التهديدات", url: "virustotal.com", lastSynced: "5m ago", eventsToday: 12 },
  { id: "shodan", name: "Shodan", category: "cyber", type: "API", tier: "active", reliability: 87, frequency: "Real-time", description: "Internet-connected device search — exposed infrastructure detection", description_ar: "بحث الأجهزة المتصلة بالإنترنت — كشف البنية التحتية المكشوفة", url: "shodan.io", lastSynced: "10m ago", eventsToday: 6 },
  { id: "crowdstrike", name: "CrowdStrike Intel", category: "cyber", type: "API", tier: "premium", reliability: 95, frequency: "Real-time", description: "Adversary intelligence — nation-state and eCrime tracking", description_ar: "استخبارات الخصوم — تتبع الدول والجريمة الإلكترونية" },
  { id: "mitre-attack", name: "MITRE ATT&CK", category: "cyber", type: "API", tier: "active", reliability: 97, frequency: "Monthly", description: "Adversary tactics and techniques knowledge base", description_ar: "قاعدة معرفة تكتيكات وتقنيات الخصوم", url: "attack.mitre.org", lastSynced: "3d ago", eventsToday: 0 },
  { id: "nvd", name: "NVD NIST", category: "cyber", type: "API", tier: "active", reliability: 98, frequency: "Daily", description: "National Vulnerability Database — CVE scoring and analysis", description_ar: "قاعدة بيانات الثغرات الوطنية — تسجيل وتحليل CVE", url: "nvd.nist.gov", lastSynced: "1h ago", eventsToday: 3 },
  { id: "greynoise", name: "GreyNoise", category: "cyber", type: "API", tier: "active", reliability: 85, frequency: "Real-time", description: "Internet scanner detection — separate noise from threats", description_ar: "كشف الماسحات الإلكترونية — فصل الضوضاء عن التهديدات", url: "greynoise.io", lastSynced: "15m ago", eventsToday: 4 },
  { id: "censys", name: "Censys", category: "cyber", type: "API", tier: "premium", reliability: 89, frequency: "Daily", description: "Internet-wide scanning — certificate and host analysis", description_ar: "مسح شامل للإنترنت — تحليل الشهادات والمضيفين" },
  { id: "shadowserver", name: "Shadowserver Foundation", category: "cyber", type: "RSS", tier: "active", reliability: 91, frequency: "Daily", description: "Cybersecurity threat reports — botnet tracking, scanning", description_ar: "تقارير تهديدات الأمن السيبراني — تتبع شبكات البوت والمسح", url: "shadowserver.org", lastSynced: "6h ago", eventsToday: 1 },
  { id: "abuseipdb", name: "AbuseIPDB", category: "cyber", type: "API", tier: "active", reliability: 83, frequency: "Real-time", description: "IP address abuse reporting and reputation database", description_ar: "قاعدة بيانات الإبلاغ عن إساءة استخدام عناوين IP وسمعتها", url: "abuseipdb.com", lastSynced: "8m ago", eventsToday: 9 },
  { id: "paloalto", name: "Palo Alto Unit 42", category: "cyber", type: "RSS", tier: "premium", reliability: 93, frequency: "Weekly", description: "Threat research — ransomware, APT campaigns, zero-days", description_ar: "أبحاث التهديدات — برامج الفدية وحملات APT وثغرات اليوم الصفر" },

  // ── Financial & Markets (6) ──
  { id: "bloomberg", name: "Bloomberg Terminal", category: "financial", type: "API", tier: "premium", reliability: 99, frequency: "Real-time", description: "Institutional financial data — commodities, CDS, FX", description_ar: "بيانات مالية مؤسسية — السلع ومقايضات التخلف الائتماني والعملات" },
  { id: "eikon", name: "Reuters Eikon", category: "financial", type: "API", tier: "premium", reliability: 96, frequency: "Real-time", description: "Financial and news data — energy trading, risk pricing", description_ar: "بيانات مالية وإخبارية — تداول الطاقة وتسعير المخاطر" },
  { id: "ice", name: "ICE Brent Futures", category: "financial", type: "API", tier: "active", reliability: 99, frequency: "Real-time", description: "Brent crude oil futures, forward curves", description_ar: "عقود خام برنت الآجلة ومنحنيات الأسعار المستقبلية", url: "theice.com", lastSynced: "1m ago", eventsToday: 8 },
  { id: "refinitiv", name: "Refinitiv", category: "financial", type: "API", tier: "premium", reliability: 95, frequency: "Real-time", description: "LSEG — market data, news analytics", description_ar: "LSEG — بيانات الأسواق وتحليلات الأخبار" },
  { id: "cme", name: "CME Group", category: "financial", type: "API", tier: "active", reliability: 98, frequency: "Real-time", description: "Futures and options — WTI, natgas, metals", description_ar: "العقود الآجلة والخيارات — WTI والغاز الطبيعي والمعادن", url: "cmegroup.com", lastSynced: "2m ago", eventsToday: 5 },
  { id: "gulfex", name: "Gulf Exchange Data", category: "financial", type: "API", tier: "active", reliability: 90, frequency: "Daily", description: "GCC stock exchange data — Tadawul, ADX, DFM", description_ar: "بيانات بورصات الخليج — تداول وأبوظبي ودبي المالي", url: "gulfexchanges.com", lastSynced: "30m ago", eventsToday: 3 },

  // ── Health & Humanitarian (3) ──
  { id: "who", name: "WHO Disease Alerts", category: "health", type: "RSS", tier: "active", reliability: 99, frequency: "Daily", description: "Disease Outbreak News — official notifications worldwide", description_ar: "تنبيهات منظمة الصحة العالمية — إشعارات رسمية بتفشي الأمراض حول العالم", url: "who.int", lastSynced: "3h ago", eventsToday: 1 },
  { id: "ocha", name: "OCHA ReliefWeb", category: "health", type: "API", tier: "active", reliability: 95, frequency: "Hourly", description: "UN humanitarian reports — crisis updates", description_ar: "تقارير المساعدات الإنسانية للأمم المتحدة — تحديثات الأزمات وتقارير الأوضاع", url: "reliefweb.int", lastSynced: "20m ago", eventsToday: 6 },
  { id: "unicef", name: "UNICEF Alerts", category: "health", type: "RSS", tier: "active", reliability: 96, frequency: "Daily", description: "Child welfare — emergency updates, humanitarian response", description_ar: "رعاية الطفل — تحديثات الطوارئ والاستجابة الإنسانية", url: "unicef.org", lastSynced: "5h ago", eventsToday: 1 },

  // ── Space & Satellites (2) ──
  { id: "maxar", name: "Maxar Satellite", category: "space", type: "API", tier: "premium", reliability: 97, frequency: "Daily", description: "High-res imagery — base monitoring, damage assessment", description_ar: "صور عالية الدقة — مراقبة القواعد وتقييم الأضرار" },
  { id: "planetsky", name: "Planet Labs SkySat", category: "space", type: "API", tier: "premium", reliability: 91, frequency: "Daily", description: "Sub-meter resolution — rapid revisit tasking", description_ar: "دقة أقل من متر — مهام إعادة الزيارة السريعة" },

  // ── Government & Official (4) ──
  { id: "unsc", name: "UN Security Council", category: "government", type: "RSS", tier: "active", reliability: 99, frequency: "Daily", description: "Press releases, resolutions, sanctions", description_ar: "بيانات صحفية وقرارات وعقوبات مجلس الأمن الدولي", url: "un.org", lastSynced: "4h ago", eventsToday: 0 },
  { id: "usstatedept", name: "US State Dept", category: "government", type: "RSS", tier: "active", reliability: 99, frequency: "As needed", description: "Travel advisories and worldwide caution alerts", description_ar: "تحذيرات السفر وتنبيهات الحذر العالمية", url: "travel.state.gov", lastSynced: "6h ago", eventsToday: 1 },
  { id: "eeas", name: "EU External Action", category: "government", type: "RSS", tier: "active", reliability: 94, frequency: "Daily", description: "EU foreign policy — sanctions, statements, missions", description_ar: "السياسة الخارجية للاتحاد الأوروبي — عقوبات وبيانات وبعثات", url: "eeas.europa.eu", lastSynced: "8h ago", eventsToday: 0 },
  { id: "ukfcdo", name: "UK FCDO", category: "government", type: "RSS", tier: "active", reliability: 96, frequency: "As needed", description: "UK foreign affairs — travel advisories, policy", description_ar: "الشؤون الخارجية البريطانية — تحذيرات السفر والسياسات", url: "gov.uk", lastSynced: "5h ago", eventsToday: 1 },

  // ── Defense & Military (5) ──
  { id: "gfp", name: "Global Firepower", category: "defense", type: "Scrape", tier: "active", reliability: 88, frequency: "Annual", description: "145 countries — military strength ranking", description_ar: "145 دولة — تصنيف القوة العسكرية", url: "globalfirepower.com", lastSynced: "7d ago", eventsToday: 0 },
  { id: "iiss-defense", name: "IISS Military Balance", category: "defense", type: "Report", tier: "premium", reliability: 97, frequency: "Annual", description: "170 countries — authoritative military capabilities", description_ar: "170 دولة — قدرات عسكرية موثوقة" },
  { id: "sipri-arms", name: "SIPRI Arms Transfers", category: "defense", type: "API", tier: "active", reliability: 95, frequency: "Quarterly", description: "Arms transfers, defense spending data", description_ar: "نقل الأسلحة وبيانات الإنفاق الدفاعي", url: "sipri.org", lastSynced: "14d ago", eventsToday: 0 },
  { id: "acled-military", name: "ACLED Military Events", category: "defense", type: "API", tier: "premium", reliability: 92, frequency: "Daily", description: "Geolocated armed engagement data", description_ar: "بيانات الاشتباكات المسلحة المحددة جغرافياً" },
  { id: "heritage", name: "Heritage Military Index", category: "defense", type: "Report", tier: "premium", reliability: 85, frequency: "Annual", description: "US military strength — capabilities, force readiness", description_ar: "القوة العسكرية الأمريكية — القدرات والجاهزية القتالية" },
];

// ─── Feed Items ────────────────────────────────────────────────

export interface FeedItem {
  id: string;
  source: string;
  sourceId: string;
  category: string;
  headline: string;
  headline_ar: string;
  url: string;
  timestamp: number; // ms offset from now (negative = past)
}

function hrs(h: number) { return -h * 3600000; }
function mins(m: number) { return -m * 60000; }

export const FEED_ITEMS: FeedItem[] = [
  // ── News & Media ──
  { id: "n1", source: "Reuters", sourceId: "reuters", category: "news", headline: "Iran warns of 'decisive response' to new US sanctions package", headline_ar: "إيران تحذر من 'رد حاسم' على حزمة العقوبات الأمريكية الجديدة", url: "reuters.com", timestamp: mins(12) },
  { id: "n2", source: "BBC News", sourceId: "bbc", category: "news", headline: "Saudi Arabia announces $50bn green hydrogen investment plan", headline_ar: "السعودية تعلن خطة استثمارية بـ50 مليار دولار للهيدروجين الأخضر", url: "bbc.co.uk", timestamp: mins(28) },
  { id: "n3", source: "Al Jazeera", sourceId: "aljazeera", category: "news", headline: "Red Sea shipping reroutes cost global trade $12bn in Q1", headline_ar: "تحويلات مسار الشحن في البحر الأحمر تكلف التجارة العالمية 12 مليار دولار", url: "aljazeera.com", timestamp: mins(45) },
  { id: "n4", source: "AFP", sourceId: "afp", category: "news", headline: "Qatar mediates new round of hostage negotiations", headline_ar: "قطر تتوسط في جولة جديدة من مفاوضات الرهائن", url: "afp.com", timestamp: hrs(1.2) },
  { id: "n5", source: "AP News", sourceId: "apnews", category: "news", headline: "UAE signs defense cooperation pact with South Korea", headline_ar: "الإمارات توقع اتفاقية تعاون دفاعي مع كوريا الجنوبية", url: "apnews.com", timestamp: hrs(1.5) },
  { id: "n6", source: "Al Arabiya", sourceId: "alarabiya", category: "news", headline: "OPEC+ ministers to meet this week on production quotas", headline_ar: "وزراء أوبك+ يجتمعون هذا الأسبوع لبحث حصص الإنتاج", url: "alarabiya.net", timestamp: hrs(2) },
  { id: "n7", source: "CNBC", sourceId: "cnbc", category: "news", headline: "Brent crude rises above $82 amid supply concerns", headline_ar: "خام برنت يرتفع فوق 82 دولاراً وسط مخاوف بشأن الإمدادات", url: "cnbc.com", timestamp: hrs(2.5) },
  { id: "n8", source: "The National", sourceId: "thenational", category: "news", headline: "Abu Dhabi sovereign fund increases Asia tech allocation by 30%", headline_ar: "صندوق أبوظبي السيادي يزيد مخصصات التكنولوجيا الآسيوية بنسبة 30%", url: "thenationalnews.com", timestamp: hrs(3) },
  { id: "n9", source: "CNN", sourceId: "cnn", category: "news", headline: "Pentagon confirms additional naval deployment to Gulf region", headline_ar: "البنتاغون يؤكد نشر بحري إضافي في منطقة الخليج", url: "cnn.com", timestamp: hrs(3.5) },
  { id: "n10", source: "Middle East Eye", sourceId: "mee", category: "news", headline: "Iraq parliament debates new oil revenue sharing law", headline_ar: "البرلمان العراقي يناقش قانون جديد لتقاسم عائدات النفط", url: "middleeasteye.net", timestamp: hrs(4) },

  // ── Conflict & Security ──
  { id: "c1", source: "GDELT Project", sourceId: "gdelt", category: "conflict", headline: "Conflict tone index drops 14% across Levant region in 48 hours", headline_ar: "مؤشر حدة النزاع ينخفض 14% في منطقة الشام خلال 48 ساعة", url: "gdeltproject.org", timestamp: mins(18) },
  { id: "c2", source: "Crisis Group", sourceId: "crisisgroup", category: "conflict", headline: "CrisisWatch Alert: Houthi escalation in Red Sea reaches new phase", headline_ar: "تنبيه CrisisWatch: تصعيد الحوثيين في البحر الأحمر يدخل مرحلة جديدة", url: "crisisgroup.org", timestamp: hrs(1) },
  { id: "c3", source: "Anthropic Claude AI", sourceId: "anthropic", category: "conflict", headline: "AI Analysis: 73% probability of follow-on strikes within 72h window", headline_ar: "تحليل AI: احتمال 73% لضربات متتابعة خلال نافذة 72 ساعة", url: "atlascommand.ai", timestamp: mins(35) },
  { id: "c4", source: "GDELT Project", sourceId: "gdelt", category: "conflict", headline: "Media attention on Iran nuclear program surges 340% this week", headline_ar: "اهتمام إعلامي بالبرنامج النووي الإيراني يقفز 340% هذا الأسبوع", url: "gdeltproject.org", timestamp: hrs(2) },
  { id: "c5", source: "Conflict Alert", sourceId: "conflictalert", category: "conflict", headline: "Global Peace Index: MENA instability score worsens by 8 points", headline_ar: "مؤشر السلام العالمي: تدهور استقرار الشرق الأوسط بـ8 نقاط", url: "visionofhumanity.org", timestamp: hrs(4) },
  { id: "c6", source: "SIPRI Conflict Data", sourceId: "sipri-conflict", category: "conflict", headline: "Arms imports to Gulf states increased 23% YoY — SIPRI report", headline_ar: "واردات الأسلحة لدول الخليج ترتفع 23% سنوياً — تقرير SIPRI", url: "sipri.org", timestamp: hrs(8) },
  { id: "c7", source: "Anthropic Claude AI", sourceId: "anthropic", category: "conflict", headline: "Consequence chain: Red Sea disruption → Suez Canal revenues ↓18% → Egypt fiscal pressure", headline_ar: "سلسلة التداعيات: اضطراب البحر الأحمر → إيرادات قناة السويس ↓18% → ضغوط مالية على مصر", url: "atlascommand.ai", timestamp: hrs(1.5) },

  // ── Energy & Commodities ──
  { id: "e1", source: "EIA Energy Data", sourceId: "eia", category: "energy", headline: "US crude inventories fell 4.2M barrels — larger than expected", headline_ar: "مخزونات النفط الأمريكية تنخفض 4.2 مليون برميل — أكبر من المتوقع", url: "eia.gov", timestamp: mins(28) },
  { id: "e2", source: "OilPrice.com", sourceId: "oilprice", category: "energy", headline: "Saudi Aramco cuts April OSP for Asian buyers by $0.50/bbl", headline_ar: "أرامكو السعودية تخفض سعر البيع الرسمي لآسيا بـ0.50 دولار للبرميل", url: "oilprice.com", timestamp: hrs(1) },
  { id: "e3", source: "EIA Energy Data", sourceId: "eia", category: "energy", headline: "Natural gas spot prices spike 12% on cold weather forecast", headline_ar: "أسعار الغاز الطبيعي ترتفع 12% بسبب توقعات الطقس البارد", url: "eia.gov", timestamp: hrs(2) },
  { id: "e4", source: "OPEC MOMR", sourceId: "opec", category: "energy", headline: "OPEC production compliance at 102% — voluntary cuts holding", headline_ar: "التزام أوبك بالإنتاج عند 102% — التخفيضات الطوعية مستمرة", url: "opec.org", timestamp: hrs(6) },
  { id: "e5", source: "OilPrice.com", sourceId: "oilprice", category: "energy", headline: "Kuwait announces discovery of new light crude field in northern region", headline_ar: "الكويت تعلن اكتشاف حقل نفط خفيف جديد في المنطقة الشمالية", url: "oilprice.com", timestamp: hrs(8) },
  { id: "e6", source: "JODI Oil Data", sourceId: "jodi", category: "energy", headline: "Global oil demand reaches 103.5 mb/d — new record", headline_ar: "الطلب العالمي على النفط يصل 103.5 مليون برميل يومياً — رقم قياسي", url: "jodidata.org", timestamp: hrs(12) },

  // ── Maritime & Shipping ──
  { id: "m1", source: "Dryad Global", sourceId: "dryad", category: "maritime", headline: "Threat level raised to HIGH for Bab el-Mandeb transit", headline_ar: "رفع مستوى التهديد إلى مرتفع لعبور باب المندب", url: "dryadglobal.com", timestamp: mins(42) },
  { id: "m2", source: "UKMTO", sourceId: "ukmto", category: "maritime", headline: "UKMTO advisory: Unidentified drone activity reported near Strait of Hormuz", headline_ar: "تحذير UKMTO: رصد نشاط طائرات مسيّرة مجهولة قرب مضيق هرمز", url: "ukmto.org", timestamp: hrs(3) },
  { id: "m3", source: "VesselFinder", sourceId: "vesselfinder", category: "maritime", headline: "12 tankers rerouting via Cape of Good Hope — up from 3 last month", headline_ar: "12 ناقلة تغير مسارها عبر رأس الرجاء الصالح — ارتفاع من 3 الشهر الماضي", url: "vesselfinder.com", timestamp: hrs(1.5) },
  { id: "m4", source: "IMB Piracy Centre", sourceId: "imb", category: "maritime", headline: "IMB reports 2 attempted boardings in Gulf of Aden this week", headline_ar: "IMB تبلغ عن محاولتي صعود على متن سفن في خليج عدن هذا الأسبوع", url: "icc-ccs.org", timestamp: hrs(6) },
  { id: "m5", source: "Dryad Global", sourceId: "dryad", category: "maritime", headline: "Insurance premiums for Red Sea transit up 300% since January", headline_ar: "أقساط التأمين لعبور البحر الأحمر ترتفع 300% منذ يناير", url: "dryadglobal.com", timestamp: hrs(10) },

  // ── Aviation ──
  { id: "a1", source: "OpenSky Network", sourceId: "opensky", category: "aviation", headline: "Anomalous military transponder activity detected over eastern Syria", headline_ar: "رصد نشاط عسكري غير اعتيادي للمستجيبات فوق شرق سوريا", url: "opensky-network.org", timestamp: hrs(1) },
  { id: "a2", source: "IATA Alerts", sourceId: "iata", category: "aviation", headline: "NOTAM issued: Tehran FIR airspace restrictions extended 48 hours", headline_ar: "إشعار صدر: تمديد قيود المجال الجوي لطهران 48 ساعة", url: "iata.org", timestamp: hrs(4) },
  { id: "a3", source: "OpenSky Network", sourceId: "opensky", category: "aviation", headline: "Commercial flight diversions around Iraq up 15% this month", headline_ar: "تحويلات الرحلات التجارية حول العراق ترتفع 15% هذا الشهر", url: "opensky-network.org", timestamp: hrs(8) },

  // ── Satellite & Earth ──
  { id: "s1", source: "NASA FIRMS", sourceId: "nasafirms", category: "satellite", headline: "Thermal anomaly detected near Kharg Island oil terminal — Iran", headline_ar: "رصد شذوذ حراري قرب محطة نفط جزيرة خارك — إيران", url: "firms.modaps.eosdis.nasa.gov", timestamp: hrs(2) },
  { id: "s2", source: "NASA EONET", sourceId: "nasaeonet", category: "satellite", headline: "Dust storm tracking: Large plume moving from Iraq toward Kuwait/Saudi", headline_ar: "تتبع عاصفة رملية: سحابة كبيرة تتحرك من العراق نحو الكويت/السعودية", url: "eonet.gsfc.nasa.gov", timestamp: hrs(5) },
  { id: "s3", source: "NASA FIRMS", sourceId: "nasafirms", category: "satellite", headline: "Wildfire cluster detected in southeastern Turkey — 3 hotspots", headline_ar: "رصد تجمع حرائق في جنوب شرق تركيا — 3 بؤر ساخنة", url: "firms.modaps.eosdis.nasa.gov", timestamp: hrs(8) },

  // ── Seismic & Disasters ──
  { id: "q1", source: "USGS Earthquakes", sourceId: "usgs", category: "seismic", headline: "M4.2 earthquake detected 47km NE of Bushehr, Iran — near nuclear facility", headline_ar: "زلزال بقوة 4.2 على بعد 47 كم شمال شرق بوشهر — قرب المنشأة النووية", url: "earthquake.usgs.gov", timestamp: mins(55) },
  { id: "q2", source: "EMSC", sourceId: "emsc", category: "seismic", headline: "Seismic swarm: 6 events M2.5+ near Dead Sea Transform in 12 hours", headline_ar: "نشاط زلزالي: 6 أحداث بقوة 2.5+ قرب صدع البحر الميت خلال 12 ساعة", url: "emsc-csem.org", timestamp: hrs(2) },
  { id: "q3", source: "GDACS Disasters", sourceId: "gdacs", category: "seismic", headline: "GDACS Green Alert: M5.1 earthquake in Hindu Kush, Afghanistan", headline_ar: "تنبيه أخضر GDACS: زلزال 5.1 في هندوكوش، أفغانستان", url: "gdacs.org", timestamp: hrs(6) },
  { id: "q4", source: "USGS Earthquakes", sourceId: "usgs", category: "seismic", headline: "No tsunami threat: M6.0 Pacific event — standard monitoring continues", headline_ar: "لا خطر تسونامي: حدث بقوة 6.0 في المحيط الهادئ — المراقبة مستمرة", url: "earthquake.usgs.gov", timestamp: hrs(12) },

  // ── Cyber & Digital ──
  { id: "y1", source: "CISA Alerts", sourceId: "cisa", category: "cyber", headline: "CISA advisory: Critical vulnerability in industrial control systems — CVE-2026-1847", headline_ar: "تحذير CISA: ثغرة حرجة في أنظمة التحكم الصناعي — CVE-2026-1847", url: "us-cert.cisa.gov", timestamp: hrs(2) },
  { id: "y2", source: "NetBlocks", sourceId: "netblocks", category: "cyber", headline: "Internet connectivity in western Iran dropped 40% — investigating cause", headline_ar: "انخفاض الاتصال بالإنترنت في غرب إيران 40% — جارٍ التحقيق", url: "netblocks.org", timestamp: hrs(4) },
  { id: "y3", source: "CISA Alerts", sourceId: "cisa", category: "cyber", headline: "Joint advisory: APT group targeting GCC energy sector SCADA systems", headline_ar: "تحذير مشترك: مجموعة APT تستهدف أنظمة SCADA في قطاع الطاقة الخليجي", url: "us-cert.cisa.gov", timestamp: hrs(8) },

  // ── Financial & Markets ──
  { id: "f1", source: "ICE Brent Futures", sourceId: "ice", category: "financial", headline: "Brent front-month up $1.40 to $82.60 — backwardation steepening", headline_ar: "عقود برنت الآجلة ترتفع 1.40$ إلى 82.60$ — تعمق التراجع الزمني", url: "theice.com", timestamp: mins(15) },
  { id: "f2", source: "CME Group", sourceId: "cme", category: "financial", headline: "WTI options volume surges 45% — unusual call activity at $85 strike", headline_ar: "حجم خيارات WTI يرتفع 45% — نشاط غير اعتيادي لعقود الشراء عند 85$", url: "cmegroup.com", timestamp: hrs(1) },
  { id: "f3", source: "Gulf Exchange Data", sourceId: "gulfex", category: "financial", headline: "Tadawul up 1.2% led by Aramco — foreign inflows accelerate", headline_ar: "تداول يرتفع 1.2% بقيادة أرامكو — تسارع التدفقات الأجنبية", url: "gulfexchanges.com", timestamp: hrs(3) },
  { id: "f4", source: "ICE Brent Futures", sourceId: "ice", category: "financial", headline: "Sovereign CDS spreads for Iraq widen 15bp on security concerns", headline_ar: "هوامش عقود التأمين السيادية للعراق تتسع 15 نقطة أساس", url: "theice.com", timestamp: hrs(5) },

  // ── Health & Humanitarian ──
  { id: "h1", source: "WHO Disease Alerts", sourceId: "who", category: "health", headline: "WHO monitoring: Respiratory illness cluster reported in southern Iraq", headline_ar: "مراقبة WHO: تجمع أمراض تنفسية في جنوب العراق", url: "who.int", timestamp: hrs(6) },
  { id: "h2", source: "OCHA ReliefWeb", sourceId: "ocha", category: "health", headline: "Yemen humanitarian update: 4.5M people in acute food insecurity", headline_ar: "تحديث إنساني لليمن: 4.5 مليون شخص يعانون من انعدام أمن غذائي حاد", url: "reliefweb.int", timestamp: hrs(3) },
  { id: "h3", source: "UNICEF Alerts", sourceId: "unicef", category: "health", headline: "UNICEF: Gaza water infrastructure operating at 12% capacity", headline_ar: "يونيسف: البنية التحتية للمياه في غزة تعمل بـ12% من طاقتها", url: "unicef.org", timestamp: hrs(8) },

  // ── Space & Satellites ──
  { id: "sp1", source: "Maxar Satellite", sourceId: "maxar", category: "space", headline: "Satellite imagery shows construction activity at Iranian missile site", headline_ar: "صور الأقمار الصناعية تظهر أعمال بناء في موقع صاروخي إيراني", url: "maxar.com", timestamp: hrs(4) },
  { id: "sp2", source: "Planet Labs SkySat", sourceId: "planetsky", category: "space", headline: "Change detection: New military vehicle staging at base in eastern Syria", headline_ar: "كشف تغيرات: تمركز مركبات عسكرية جديدة في قاعدة شرق سوريا", url: "planet.com", timestamp: hrs(12) },

  // ── Government & Official ──
  { id: "g1", source: "US State Dept", sourceId: "usstatedept", category: "government", headline: "US State Department raises travel advisory for Lebanon to Level 4", headline_ar: "الخارجية الأمريكية ترفع تحذير السفر للبنان إلى المستوى الرابع", url: "travel.state.gov", timestamp: hrs(6) },
  { id: "g2", source: "UN Security Council", sourceId: "unsc", category: "government", headline: "UNSC Resolution 2740: Extended arms embargo on Houthi forces", headline_ar: "قرار مجلس الأمن 2740: تمديد حظر الأسلحة على الحوثيين", url: "un.org", timestamp: hrs(10) },
  { id: "g3", source: "EU External Action", sourceId: "eeas", category: "government", headline: "EU announces new sanctions package targeting Iranian drone components", headline_ar: "الاتحاد الأوروبي يعلن حزمة عقوبات جديدة تستهدف مكونات المسيّرات الإيرانية", url: "eeas.europa.eu", timestamp: hrs(14) },

  // ── Defense & Military ──
  { id: "d1", source: "Global Firepower", sourceId: "gfp", category: "defense", headline: "Saudi Arabia rises to #22 in Global Firepower Index — 3rd in MENA", headline_ar: "السعودية ترتفع إلى المركز 22 في مؤشر القوة النارية — الثالثة في الشرق الأوسط", url: "globalfirepower.com", timestamp: hrs(24) },
  { id: "d2", source: "SIPRI Arms Transfers", sourceId: "sipri-arms", category: "defense", headline: "UAE defense procurement: $3.2B in new contracts signed Q1 2026", headline_ar: "مشتريات الإمارات الدفاعية: توقيع عقود بقيمة 3.2 مليار دولار في الربع الأول 2026", url: "sipri.org", timestamp: hrs(48) },
  { id: "d3", source: "Global Firepower", sourceId: "gfp", category: "defense", headline: "Iran missile arsenal assessment: 3,000+ ballistic missiles in inventory", headline_ar: "تقييم الترسانة الصاروخية الإيرانية: أكثر من 3,000 صاروخ بالستي", url: "globalfirepower.com", timestamp: hrs(72) },
];

// ─── Baselines and Anomaly Data ────────────────────────────────

export const CATEGORY_BASELINES: Record<string, number> = {
  news: 35, conflict: 8, energy: 6, maritime: 4, aviation: 3,
  satellite: 2, seismic: 5, cyber: 4, financial: 5, health: 2,
  space: 1, government: 3, defense: 2,
};

export const STATIC_ANOMALIES: Record<string, { en: string; ar: string }> = {
  news: {
    en: "74 items in last hour — 2.1x normal volume. Reuters, BBC, Al Jazeera all publishing simultaneously on Iran sanctions story. Volume spike started 43 minutes ago.",
    ar: "74 عنصراً في الساعة الأخيرة — 2.1 ضعف الحجم الطبيعي. رويترز وبي بي سي والجزيرة تنشر في وقت واحد عن قصة العقوبات الإيرانية. بدأ ارتفاع الحجم منذ 43 دقيقة.",
  },
  conflict: {
    en: "Quiet period. 3 items in last hour, 0.4x normal. Last significant event: Houthi drone intercept 2h ago. GDELT conflict index stable.",
    ar: "فترة هدوء. 3 عناصر في الساعة الأخيرة، 0.4 ضعف الطبيعي. آخر حدث مهم: اعتراض طائرة حوثية مسيّرة منذ ساعتين. مؤشر GDELT للنزاعات مستقر.",
  },
  energy: {
    en: "EIA weekly data dropped 28 minutes ago — triggering spike to 8 items in 10 minutes. Brent price moved +1.8% simultaneously. Watch for follow-on analysis next 30 min.",
    ar: "بيانات EIA الأسبوعية صدرت منذ 28 دقيقة — أثارت ارتفاعاً إلى 8 عناصر في 10 دقائق. سعر برنت تحرك +1.8% في نفس الوقت. راقب التحليلات التابعة خلال 30 دقيقة.",
  },
  maritime: {
    en: "AIS data showing 3 vessels rerouting away from Red Sea in last 6 hours. MarineTraffic volume up 40%. Consistent with Houthi threat escalation pattern.",
    ar: "بيانات AIS تظهر تحويل 3 سفن بعيداً عن البحر الأحمر في آخر 6 ساعات. حجم MarineTraffic ارتفع 40%. متسق مع نمط تصعيد تهديدات الحوثيين.",
  },
  aviation: {
    en: "Normal volume. 3 items in last hour. NOTAM extensions over Tehran FIR noted. No anomalous military transponder activity in past 4 hours.",
    ar: "حجم طبيعي. 3 عناصر في الساعة الأخيرة. تمديد إشعارات فوق إقليم طهران. لا نشاط عسكري شاذ في المستجيبات خلال 4 ساعات.",
  },
  satellite: {
    en: "NASA FIRMS flagged thermal anomaly near Kharg Island 2h ago. EONET tracking dust storm from Iraq. Standard observation volume.",
    ar: "NASA FIRMS رصد شذوذاً حرارياً قرب جزيرة خارك منذ ساعتين. EONET يتتبع عاصفة رملية من العراق. حجم مراقبة طبيعي.",
  },
  seismic: {
    en: "USGS logged 4 events M3.0+ in last 24h. None in GCC region. One M4.2 near Bushehr Iran — flagged due to proximity to nuclear facility. Standard activity otherwise.",
    ar: "USGS سجل 4 أحداث بقوة 3.0+ في آخر 24 ساعة. لا شيء في منطقة الخليج. حدث بقوة 4.2 قرب بوشهر — مؤشر بسبب القرب من المنشأة النووية. نشاط طبيعي فيما عدا ذلك.",
  },
  cyber: {
    en: "CISA issued 2 advisories in last 4 hours — above average. Joint advisory on APT targeting GCC SCADA. NetBlocks showing 40% Iran connectivity drop.",
    ar: "CISA أصدرت تحذيرين في آخر 4 ساعات — فوق المعدل. تحذير مشترك عن APT يستهدف SCADA الخليجي. NetBlocks يظهر انخفاض 40% في اتصال إيران.",
  },
  financial: {
    en: "Normal volume. Markets open in London. Oil correlation with conflict events: strong (0.82). WTI options volume unusual — 45% above average at $85 strike.",
    ar: "حجم طبيعي. الأسواق مفتوحة في لندن. ارتباط النفط بأحداث النزاع: قوي (0.82). حجم خيارات WTI غير اعتيادي — 45% فوق المعدل عند سعر 85$.",
  },
  health: {
    en: "Low volume. WHO monitoring respiratory cluster in southern Iraq. OCHA reports 4.5M in acute food insecurity in Yemen. No pandemic-level signals.",
    ar: "حجم منخفض. WHO تراقب تجمع أمراض تنفسية في جنوب العراق. OCHA تبلغ عن 4.5 مليون في انعدام أمن غذائي حاد باليمن. لا إشارات على مستوى وبائي.",
  },
  space: {
    en: "2 imagery updates. Maxar detected construction at Iranian missile site. Planet Labs flagged vehicle staging in eastern Syria. Premium-only sources.",
    ar: "تحديثان للصور. ماكسار رصد أعمال بناء في موقع صاروخي إيراني. Planet Labs رصد تمركز مركبات في شرق سوريا. مصادر متميزة فقط.",
  },
  government: {
    en: "US State Dept raised Lebanon to Level 4. UNSC extended Houthi arms embargo. EU new sanctions on Iranian drone components. Standard diplomatic tempo.",
    ar: "الخارجية الأمريكية رفعت لبنان للمستوى 4. مجلس الأمن مدد حظر أسلحة الحوثيين. عقوبات أوروبية جديدة على مكونات المسيّرات الإيرانية. إيقاع دبلوماسي طبيعي.",
  },
  defense: {
    en: "Low frequency category. Saudi Arabia rose to #22 in GFP Index. UAE signed $3.2B Q1 defense contracts. Iran arsenal assessment updated.",
    ar: "فئة منخفضة التكرار. السعودية ترتفع للمركز 22 في مؤشر GFP. الإمارات وقعت عقوداً دفاعية بـ3.2 مليار دولار. تقييم ترسانة إيران مُحدّث.",
  },
};

export function buildAnomalyPrompt(
  category: LibraryCategory,
  itemCount: number,
  baseline: number,
  mostActiveSource: string,
  recentHeadlines: string[],
  isAr: boolean,
): { system: string; user: string } {
  const system = isAr
    ? `أنت كاشف الإشارات لمكتبة Atlas Command الاستخباراتية.
تحلل حجم التغذية والأنماط. لا تلخص الأخبار. تكشف الشذوذ.
أخبر المستخدم إذا كان الحجم أعلى/أقل من الطبيعي، وأي المصادر الأكثر نشاطاً، وإذا كان هناك نمط غير عادي.
كن محدداً بالأرقام. 2-4 جمل كحد أقصى. اكتب بالعربية.`
    : `You are the signal detector for Atlas Command Intel Library.
You analyze feed volume and patterns. You do NOT summarize news. You detect anomalies.
Tell the user if volume is above/below normal, which sources are most active, and whether there is an unusual pattern worth noting.
Be specific with numbers. 2-4 sentences maximum. Write in English.`;

  const user = isAr
    ? `الفئة: ${category.labelAr}
عناصر الساعة الأخيرة: ${itemCount}
خط الأساس الطبيعي: ${baseline}/ساعة
أنشط مصدر: ${mostActiveSource}
آخر العناوين: ${recentHeadlines.join(" | ")}
اكشف الشذوذ وأنماط الإشارات.`
    : `Category: ${category.label}
Items in last hour: ${itemCount}
Normal baseline: ${baseline}/hour
Most active source: ${mostActiveSource}
Recent items: ${recentHeadlines.join(" | ")}
Detect anomalies and signal patterns.`;

  return { system, user };
}
