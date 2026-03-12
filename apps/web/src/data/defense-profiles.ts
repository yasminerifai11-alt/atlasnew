/**
 * Defense Intelligence — Country military profiles
 * Sources: Global Firepower Index, IISS Military Balance, SIPRI
 */

export interface DefenseCapabilities {
  air_power: number;
  land_power: number;
  naval_power: number;
  cyber_power: number;
  missile_systems: number;
}

export interface DefenseProfile {
  country: string;
  iso3: string;
  gfp_rank: number;
  gfp_score: number;
  gfp_trend: "UP" | "STABLE" | "DOWN";
  defense_budget_usd: number; // billions
  defense_budget_gdp_pct: number;
  capabilities: DefenseCapabilities;
  key_assets: string[];
  key_assets_ar: string[];
  alliances: string[];
  alliances_ar: string[];
  threat_posture: string;
  threat_posture_ar: string;
  current_readiness: "HIGH" | "ELEVATED" | "NORMAL" | "REDUCED";
  recent_activity: string;
  recent_activity_ar: string;
}

export const DEFENSE_PROFILES: Record<string, DefenseProfile> = {
  SAU: {
    country: "Saudi Arabia",
    iso3: "SAU",
    gfp_rank: 22,
    gfp_score: 0.3987,
    gfp_trend: "UP",
    defense_budget_usd: 80.3,
    defense_budget_gdp_pct: 4.3,
    capabilities: {
      air_power: 85,
      land_power: 72,
      naval_power: 45,
      cyber_power: 55,
      missile_systems: 78,
    },
    key_assets: [
      "F-15SA Strike Eagle (152)",
      "Eurofighter Typhoon (72)",
      "Patriot PAC-3 batteries (96)",
      "THAAD system (deployed)",
      "AH-64 Apache helicopters (36)",
      "M1A2 Abrams tanks (400+)",
    ],
    key_assets_ar: [
      "مقاتلات F-15SA (152)",
      "يوروفايتر تايفون (72)",
      "منظومات باتريوت PAC-3 (96)",
      "منظومة ثاد (منتشرة)",
      "مروحيات أباتشي AH-64 (36)",
      "دبابات أبرامز M1A2 (400+)",
    ],
    alliances: ["GCC Collective Defense", "Arab League", "US Strategic Partner"],
    alliances_ar: ["الدفاع الجماعي الخليجي", "جامعة الدول العربية", "شريك استراتيجي أمريكي"],
    threat_posture: "DEFENSIVE / DETERRENCE",
    threat_posture_ar: "دفاعي / ردع",
    current_readiness: "ELEVATED",
    recent_activity: "Continued procurement of advanced air defense systems. Joint exercises with US forces. Active operations along Yemen border.",
    recent_activity_ar: "استمرار اقتناء منظومات دفاع جوي متقدمة. تدريبات مشتركة مع القوات الأمريكية. عمليات نشطة على الحدود اليمنية.",
  },
  ARE: {
    country: "UAE",
    iso3: "ARE",
    gfp_rank: 35,
    gfp_score: 0.5765,
    gfp_trend: "UP",
    defense_budget_usd: 24.8,
    defense_budget_gdp_pct: 4.1,
    capabilities: {
      air_power: 80,
      land_power: 70,
      naval_power: 55,
      cyber_power: 72,
      missile_systems: 65,
    },
    key_assets: [
      "F-16E/F Block 60 (80)",
      "Dassault Rafale (ordered)",
      "Patriot PAC-3 batteries",
      "THAAD system (deployed)",
      "Leclerc MBT (388)",
      "Baynunah-class corvettes",
    ],
    key_assets_ar: [
      "مقاتلات F-16E/F بلوك 60 (80)",
      "رافال (طلبية جديدة)",
      "منظومات باتريوت PAC-3",
      "منظومة ثاد (منتشرة)",
      "دبابات لوكلير (388)",
      "كورفيتات فئة بينونة",
    ],
    alliances: ["GCC Collective Defense", "Arab League", "US Strategic Partner", "Abraham Accords"],
    alliances_ar: ["الدفاع الجماعي الخليجي", "جامعة الدول العربية", "شريك استراتيجي أمريكي", "اتفاقيات إبراهيم"],
    threat_posture: "DEFENSIVE",
    threat_posture_ar: "دفاعي",
    current_readiness: "ELEVATED",
    recent_activity: "Rafale acquisition underway. Advanced cyber defense capabilities through DarkMatter. Expanding naval presence in Red Sea.",
    recent_activity_ar: "جارٍ اقتناء مقاتلات رافال. قدرات دفاع إلكتروني متقدمة عبر داركماتر. توسيع التواجد البحري في البحر الأحمر.",
  },
  KWT: {
    country: "Kuwait",
    iso3: "KWT",
    gfp_rank: 71,
    gfp_score: 1.4721,
    gfp_trend: "STABLE",
    defense_budget_usd: 9.2,
    defense_budget_gdp_pct: 5.6,
    capabilities: {
      air_power: 62,
      land_power: 58,
      naval_power: 35,
      cyber_power: 45,
      missile_systems: 52,
    },
    key_assets: [
      "F/A-18C/D Hornet (40)",
      "Eurofighter Typhoon (ordered 28)",
      "Patriot PAC-3 batteries",
      "M1A2 Abrams tanks (218)",
      "US Camp Arifjan base",
      "Ali Al Salem Air Base (US)",
    ],
    key_assets_ar: [
      "مقاتلات F/A-18 هورنت (40)",
      "يوروفايتر تايفون (طلبية 28)",
      "منظومات باتريوت PAC-3",
      "دبابات أبرامز M1A2 (218)",
      "قاعدة عريفجان الأمريكية",
      "قاعدة علي السالم الجوية (أمريكية)",
    ],
    alliances: ["GCC Collective Defense", "Arab League", "US Bases Host (Camp Arifjan, Ali Al Salem)"],
    alliances_ar: ["الدفاع الجماعي الخليجي", "جامعة الدول العربية", "مضيف قواعد أمريكية (عريفجان، علي السالم)"],
    threat_posture: "DEFENSIVE",
    threat_posture_ar: "دفاعي",
    current_readiness: "ELEVATED",
    recent_activity: "Eurofighter Typhoon delivery underway. Enhanced border surveillance systems. Joint exercises with US and GCC forces.",
    recent_activity_ar: "جارٍ تسليم مقاتلات يوروفايتر تايفون. تعزيز أنظمة مراقبة الحدود. تدريبات مشتركة مع القوات الأمريكية والخليجية.",
  },
  QAT: {
    country: "Qatar",
    iso3: "QAT",
    gfp_rank: 78,
    gfp_score: 1.7263,
    gfp_trend: "UP",
    defense_budget_usd: 6.7,
    defense_budget_gdp_pct: 3.1,
    capabilities: {
      air_power: 65,
      land_power: 55,
      naval_power: 40,
      cyber_power: 60,
      missile_systems: 50,
    },
    key_assets: [
      "Dassault Rafale (36)",
      "F-15QA Advanced Eagle (36)",
      "Patriot PAC-3 batteries",
      "US CENTCOM HQ (Al Udeid)",
      "NH90 helicopters",
      "Leopard 2A7+ tanks (ordered)",
    ],
    key_assets_ar: [
      "مقاتلات رافال (36)",
      "مقاتلات F-15QA (36)",
      "منظومات باتريوت PAC-3",
      "مقر القيادة المركزية الأمريكية (العديد)",
      "مروحيات NH90",
      "دبابات ليوبارد 2A7+ (طلبية)",
    ],
    alliances: ["GCC Collective Defense", "Arab League", "US CENTCOM Host (Al Udeid)"],
    alliances_ar: ["الدفاع الجماعي الخليجي", "جامعة الدول العربية", "مضيف القيادة المركزية الأمريكية (العديد)"],
    threat_posture: "DEFENSIVE",
    threat_posture_ar: "دفاعي",
    current_readiness: "NORMAL",
    recent_activity: "F-15QA fleet reaching full operational capability. Al Udeid Air Base expansion. Cyber defense modernization program.",
    recent_activity_ar: "أسطول F-15QA يصل للقدرة التشغيلية الكاملة. توسيع قاعدة العديد الجوية. برنامج تحديث الدفاع الإلكتروني.",
  },
  BHR: {
    country: "Bahrain",
    iso3: "BHR",
    gfp_rank: 95,
    gfp_score: 2.1845,
    gfp_trend: "STABLE",
    defense_budget_usd: 1.4,
    defense_budget_gdp_pct: 3.7,
    capabilities: {
      air_power: 50,
      land_power: 48,
      naval_power: 55,
      cyber_power: 42,
      missile_systems: 40,
    },
    key_assets: [
      "F-16C/D Block 40 (22)",
      "F/A-18E/F (ordered)",
      "US 5th Fleet HQ (NSA Bahrain)",
      "AH-1E Cobra helicopters",
      "Patriot batteries (limited)",
    ],
    key_assets_ar: [
      "مقاتلات F-16 بلوك 40 (22)",
      "مقاتلات F/A-18E/F (طلبية)",
      "مقر الأسطول الخامس الأمريكي",
      "مروحيات كوبرا AH-1E",
      "منظومات باتريوت (محدودة)",
    ],
    alliances: ["GCC Collective Defense", "Arab League", "US 5th Fleet Host"],
    alliances_ar: ["الدفاع الجماعي الخليجي", "جامعة الدول العربية", "مضيف الأسطول الخامس الأمريكي"],
    threat_posture: "DEFENSIVE",
    threat_posture_ar: "دفاعي",
    current_readiness: "NORMAL",
    recent_activity: "F/A-18E/F Super Hornet procurement in progress. Enhanced maritime surveillance with US 5th Fleet coordination.",
    recent_activity_ar: "جارٍ اقتناء مقاتلات سوبر هورنت. تعزيز المراقبة البحرية بالتنسيق مع الأسطول الخامس الأمريكي.",
  },
  OMN: {
    country: "Oman",
    iso3: "OMN",
    gfp_rank: 68,
    gfp_score: 1.3892,
    gfp_trend: "STABLE",
    defense_budget_usd: 6.8,
    defense_budget_gdp_pct: 8.2,
    capabilities: {
      air_power: 60,
      land_power: 65,
      naval_power: 58,
      cyber_power: 38,
      missile_systems: 45,
    },
    key_assets: [
      "Eurofighter Typhoon (12)",
      "F-16C/D Block 50 (12)",
      "Strait of Hormuz coastal defense",
      "Khareef-class corvettes (3)",
      "Challenger 2 MBT (38)",
    ],
    key_assets_ar: [
      "يوروفايتر تايفون (12)",
      "مقاتلات F-16 بلوك 50 (12)",
      "دفاع ساحلي عند مضيق هرمز",
      "كورفيتات فئة خريف (3)",
      "دبابات تشالنجر 2 (38)",
    ],
    alliances: ["GCC Collective Defense", "Arab League", "UK Historical Ties"],
    alliances_ar: ["الدفاع الجماعي الخليجي", "جامعة الدول العربية", "روابط تاريخية بريطانية"],
    threat_posture: "NEUTRAL / DEFENSIVE",
    threat_posture_ar: "محايد / دفاعي",
    current_readiness: "NORMAL",
    recent_activity: "Strategic coastal defense upgrades along Strait of Hormuz. Maintains diplomatic neutrality while modernizing naval capabilities.",
    recent_activity_ar: "تحديثات استراتيجية للدفاع الساحلي على طول مضيق هرمز. الحفاظ على الحياد الدبلوماسي مع تحديث القدرات البحرية.",
  },
  IRN: {
    country: "Iran",
    iso3: "IRN",
    gfp_rank: 14,
    gfp_score: 0.2269,
    gfp_trend: "UP",
    defense_budget_usd: 10.3,
    defense_budget_gdp_pct: 2.3,
    capabilities: {
      air_power: 65,
      land_power: 82,
      naval_power: 70,
      cyber_power: 78,
      missile_systems: 92,
    },
    key_assets: [
      "Shahab-3 ballistic missiles",
      "Khorramshahr-4 MRBM",
      "Shahed-136 attack drones",
      "Fateh-110 precision missiles",
      "Ghadir-class submarines (23)",
      "IRGC asymmetric warfare units",
    ],
    key_assets_ar: [
      "صواريخ شهاب-3 الباليستية",
      "صواريخ خرمشهر-4 متوسطة المدى",
      "طائرات شاهد-136 المسيّرة",
      "صواريخ فاتح-110 الدقيقة",
      "غواصات فئة غدير (23)",
      "وحدات حرب غير متماثلة للحرس الثوري",
    ],
    alliances: ["Russia (arms supplier)", "China (trade partner)", "Axis of Resistance"],
    alliances_ar: ["روسيا (مورّد أسلحة)", "الصين (شريك تجاري)", "محور المقاومة"],
    threat_posture: "OFFENSIVE / ASYMMETRIC",
    threat_posture_ar: "هجومي / حرب غير متماثلة",
    current_readiness: "HIGH",
    recent_activity: "Missile and drone capability significantly exceeds official rankings. Active proxy operations across the region. Advanced cyber warfare units targeting Gulf infrastructure.",
    recent_activity_ar: "القدرات الصاروخية وطائرات الدرونز تتجاوز التصنيفات الرسمية بشكل كبير. عمليات وكلاء نشطة عبر المنطقة. وحدات حرب إلكترونية متقدمة تستهدف البنية التحتية الخليجية.",
  },
  IRQ: {
    country: "Iraq",
    iso3: "IRQ",
    gfp_rank: 57,
    gfp_score: 1.0266,
    gfp_trend: "STABLE",
    defense_budget_usd: 4.6,
    defense_budget_gdp_pct: 2.1,
    capabilities: {
      air_power: 45,
      land_power: 62,
      naval_power: 15,
      cyber_power: 30,
      missile_systems: 25,
    },
    key_assets: [
      "F-16IQ Block 52 (34)",
      "M1A1 Abrams tanks (140)",
      "US-trained Counter-Terrorism Service",
      "Popular Mobilization Forces (PMF)",
      "T-90S tanks (ordered)",
    ],
    key_assets_ar: [
      "مقاتلات F-16IQ بلوك 52 (34)",
      "دبابات أبرامز M1A1 (140)",
      "جهاز مكافحة الإرهاب (مدرب أمريكياً)",
      "قوات الحشد الشعبي",
      "دبابات T-90S (طلبية)",
    ],
    alliances: ["US (training partner)", "Iran (PMF influence)", "Arab League"],
    alliances_ar: ["أمريكا (شريك تدريب)", "إيران (نفوذ عبر الحشد الشعبي)", "جامعة الدول العربية"],
    threat_posture: "REBUILDING",
    threat_posture_ar: "إعادة بناء",
    current_readiness: "REDUCED",
    recent_activity: "Ongoing military modernization with US assistance. PMF integration into state forces remains incomplete. Counter-ISIS operations continue in northern regions.",
    recent_activity_ar: "تحديث عسكري مستمر بمساعدة أمريكية. دمج الحشد الشعبي في القوات النظامية لا يزال ناقصاً. عمليات مكافحة داعش مستمرة في المناطق الشمالية.",
  },
  ISR: {
    country: "Israel",
    iso3: "ISR",
    gfp_rank: 17,
    gfp_score: 0.2596,
    gfp_trend: "UP",
    defense_budget_usd: 27.5,
    defense_budget_gdp_pct: 5.3,
    capabilities: {
      air_power: 95,
      land_power: 88,
      naval_power: 65,
      cyber_power: 98,
      missile_systems: 95,
    },
    key_assets: [
      "F-35I Adir (50+)",
      "Iron Dome (10+ batteries)",
      "Arrow 3 (exo-atmospheric)",
      "David's Sling (medium range)",
      "Nuclear capability (undeclared)",
      "Unit 8200 cyber intelligence",
    ],
    key_assets_ar: [
      "مقاتلات F-35I أدير (50+)",
      "القبة الحديدية (10+ بطاريات)",
      "صواريخ آرو 3 (خارج الغلاف الجوي)",
      "مقلاع داود (متوسط المدى)",
      "قدرة نووية (غير معلنة)",
      "الوحدة 8200 للاستخبارات الإلكترونية",
    ],
    alliances: ["US (strategic partner)", "Abraham Accords Partners", "NATO cooperation"],
    alliances_ar: ["أمريكا (شريك استراتيجي)", "شركاء اتفاقيات إبراهيم", "تعاون مع الناتو"],
    threat_posture: "OFFENSIVE / DETERRENCE",
    threat_posture_ar: "هجومي / ردع",
    current_readiness: "HIGH",
    recent_activity: "Active military operations in Gaza and southern Lebanon. Multi-layered missile defense tested against Iranian strikes. Unit 8200 conducting offensive cyber operations.",
    recent_activity_ar: "عمليات عسكرية نشطة في غزة وجنوب لبنان. اختبار الدفاع الصاروخي متعدد الطبقات ضد ضربات إيرانية. الوحدة 8200 تنفذ عمليات إلكترونية هجومية.",
  },
};

/**
 * Get the rank tier label for a GFP rank
 */
export function getRankTier(rank: number): { label: string; labelAr: string; stars: number } {
  if (rank <= 15) return { label: "Major Global Power", labelAr: "قوة عالمية كبرى", stars: 5 };
  if (rank <= 30) return { label: "Strong Regional Power", labelAr: "قوة إقليمية قوية", stars: 4 };
  if (rank <= 50) return { label: "Regional Power", labelAr: "قوة إقليمية", stars: 3 };
  if (rank <= 75) return { label: "Developing Military", labelAr: "قوة عسكرية نامية", stars: 2 };
  return { label: "Limited Capability", labelAr: "قدرات محدودة", stars: 1 };
}

/**
 * Get the readiness color
 */
export function getReadinessColor(readiness: string): string {
  switch (readiness) {
    case "HIGH": return "#dc2626";
    case "ELEVATED": return "#f59e0b";
    case "NORMAL": return "#22c55e";
    case "REDUCED": return "#6b7280";
    default: return "#64748b";
  }
}

/**
 * Get readiness label
 */
export function getReadinessLabel(readiness: string, isAr: boolean): string {
  const labels: Record<string, { en: string; ar: string }> = {
    HIGH: { en: "HIGH", ar: "مرتفع" },
    ELEVATED: { en: "ELEVATED", ar: "متقدم" },
    NORMAL: { en: "NORMAL", ar: "طبيعي" },
    REDUCED: { en: "REDUCED", ar: "منخفض" },
  };
  const entry = labels[readiness];
  return entry ? (isAr ? entry.ar : entry.en) : readiness;
}

/**
 * Check if US military presence exists in a country
 */
export function hasUSPresence(iso3: string): boolean {
  const usPresenceCountries = ["KWT", "QAT", "BHR", "ARE", "SAU", "IRQ"];
  return usPresenceCountries.includes(iso3);
}

/**
 * Calculate defense-adjusted risk score
 */
export function calculateDefenseAdjustedRisk(
  baseRisk: number,
  countryIso3: string,
  threatCountryIso3?: string,
): number {
  const defender = DEFENSE_PROFILES[countryIso3];
  if (!defender) return baseRisk;

  let adjusted = baseRisk;

  // If there's a specific threat country, compare capabilities
  if (threatCountryIso3) {
    const attacker = DEFENSE_PROFILES[threatCountryIso3];
    if (attacker) {
      const missileGap = attacker.capabilities.missile_systems - defender.capabilities.air_power;
      if (missileGap > 30) adjusted += 10;
      else if (missileGap > 15) adjusted += 5;

      const cyberGap = attacker.capabilities.cyber_power - defender.capabilities.cyber_power;
      if (cyberGap > 30) adjusted += 8;
      else if (cyberGap > 15) adjusted += 4;
    }
  }

  // US presence deterrent effect
  if (hasUSPresence(countryIso3)) {
    adjusted -= 10;
  }

  // Readiness factor
  if (defender.current_readiness === "HIGH") adjusted -= 5;
  else if (defender.current_readiness === "REDUCED") adjusted += 5;

  return Math.max(0, Math.min(100, adjusted));
}

/** Capability key labels */
export const CAPABILITY_KEYS: { key: keyof DefenseCapabilities; label: string; labelAr: string }[] = [
  { key: "air_power", label: "AIR POWER", labelAr: "القوة الجوية" },
  { key: "land_power", label: "LAND POWER", labelAr: "القوة البرية" },
  { key: "naval_power", label: "NAVAL POWER", labelAr: "القوة البحرية" },
  { key: "cyber_power", label: "CYBER", labelAr: "الإلكتروني" },
  { key: "missile_systems", label: "MISSILE SYS", labelAr: "صاروخي" },
];
