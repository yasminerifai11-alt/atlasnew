/**
 * Seeded country intelligence data — used as fallback when API is unavailable.
 * Covers the primary countries of interest: Kuwait, Saudi Arabia, UAE, Iran.
 */

export interface SeededCountryIntel {
  situation_en: string;
  situation_ar: string;
  gcc_significance_en: string;
  gcc_significance_ar: string;
  watch_next_en: string[];
  watch_next_ar: string[];
  forecast_24h_en: string;
  forecast_24h_ar: string;
  forecast_48h_en: string;
  forecast_48h_ar: string;
  forecast_72h_en: string;
  forecast_72h_ar: string;
  recommendations_en: string[];
  recommendations_ar: string[];
  infrastructure_en: string;
  infrastructure_ar: string;
  instability_score: number;
  risk_level: string;
}

export const SEEDED_COUNTRY_INTEL: Record<string, SeededCountryIntel> = {
  KWT: {
    situation_en:
      "Kuwait maintains elevated security posture along the northern border with Iraq. Naval patrols in the Persian Gulf have increased following recent maritime incidents near Mina Al-Ahmadi terminal. Internal security remains stable with no active civil unrest indicators. The Amir's recent diplomatic engagements signal continued mediation role between GCC members and Iran.",
    situation_ar:
      "تحافظ الكويت على وضع أمني مرتفع على الحدود الشمالية مع العراق. زادت الدوريات البحرية في الخليج العربي بعد حوادث بحرية حديثة قرب ميناء الأحمدي. يبقى الأمن الداخلي مستقراً دون مؤشرات على اضطرابات مدنية. تشير التحركات الدبلوماسية الأخيرة لسمو الأمير إلى استمرار دور الوساطة بين دول مجلس التعاون وإيران.",
    gcc_significance_en:
      "Kuwait's geographic position between Iraq and Saudi Arabia makes it a critical buffer state. Any destabilization directly threatens the northern flank of GCC defense architecture. Mina Al-Ahmadi and Mina Abdullah terminals handle 2.4M bpd — disruption would impact global oil supply within 48 hours.",
    gcc_significance_ar:
      "الموقع الجغرافي للكويت بين العراق والسعودية يجعلها دولة عازلة حاسمة. أي زعزعة استقرار تهدد الجناح الشمالي لمنظومة دفاع مجلس التعاون مباشرة. يتعامل ميناء الأحمدي وميناء عبدالله مع ٢.٤ مليون برميل يومياً — أي تعطيل سيؤثر على إمدادات النفط العالمية خلال ٤٨ ساعة.",
    watch_next_en: [
      "Iraqi militia movements in Basra governorate near Kuwaiti border crossing at Safwan",
      "Iranian naval exercises in northern Gulf — potential proximity to Kuwaiti waters",
      "Parliamentary sessions on defense budget allocation and US basing agreement renewal",
    ],
    watch_next_ar: [
      "تحركات الميليشيات العراقية في محافظة البصرة قرب معبر صفوان الحدودي الكويتي",
      "المناورات البحرية الإيرانية في شمال الخليج — احتمال الاقتراب من المياه الكويتية",
      "جلسات مجلس الأمة بشأن ميزانية الدفاع وتجديد اتفاقية القواعد الأمريكية",
    ],
    forecast_24h_en: "Stable. No imminent threats detected. Naval monitoring continues in northern Gulf sector.",
    forecast_24h_ar: "مستقر. لا تهديدات وشيكة. تستمر المراقبة البحرية في القطاع الشمالي من الخليج.",
    forecast_48h_en: "Watch for Iranian IRGCN patrol patterns near Failaka Island shipping lane. Iraqi border activity nominal.",
    forecast_48h_ar: "مراقبة أنماط دوريات الحرس الثوري البحري بالقرب من ممر الشحن عند جزيرة فيلكا. النشاط على الحدود العراقية طبيعي.",
    forecast_72h_en: "Parliamentary defense vote may shift Kuwait's defense procurement timeline. Regional diplomatic signals suggest continued de-escalation.",
    forecast_72h_ar: "تصويت مجلس الأمة على الدفاع قد يغير الجدول الزمني لمشتريات الدفاع. الإشارات الدبلوماسية الإقليمية تشير لاستمرار خفض التصعيد.",
    recommendations_en: [
      "Maintain elevated maritime surveillance around Mina Al-Ahmadi",
      "Coordinate with US CENTCOM on northern Gulf patrol schedules",
      "Brief leadership on Iraqi political developments affecting border security",
      "Pre-position emergency response assets at Bubiyan Island facility",
      "Monitor Iranian diplomatic messaging for shifts in Gulf policy",
    ],
    recommendations_ar: [
      "الحفاظ على المراقبة البحرية المرتفعة حول ميناء الأحمدي",
      "التنسيق مع القيادة المركزية الأمريكية بشأن جداول الدوريات في شمال الخليج",
      "إحاطة القيادة بالتطورات السياسية العراقية المؤثرة على أمن الحدود",
      "تمركز أصول الاستجابة الطارئة مسبقاً في منشأة جزيرة بوبيان",
      "مراقبة الرسائل الدبلوماسية الإيرانية لرصد تحولات سياسة الخليج",
    ],
    infrastructure_en: "Critical: Mina Al-Ahmadi (2.4M bpd), Mina Abdullah refinery, Az-Zour LNG, Camp Arifjan (US), Ali Al Salem Air Base. All operational, no current threats.",
    infrastructure_ar: "حرج: ميناء الأحمدي (٢.٤ مليون برميل/يوم)، مصفاة ميناء عبدالله، الزور للغاز المسال، معسكر عريفجان (أمريكي)، قاعدة علي السالم الجوية. جميعها تعمل بشكل طبيعي، لا تهديدات حالية.",
    instability_score: 57,
    risk_level: "ELEVATED",
  },

  SAU: {
    situation_en:
      "Saudi Arabia faces a multi-vector threat environment. Houthi drone and missile attacks continue to target Aramco facilities along the western coast, with recent intercepts near Yanbu industrial complex. Vision 2030 megaprojects (NEOM, Red Sea Project) create expanded attack surfaces. Eastern Province remains the most sensitive area due to Ghawar field concentration and Shia population dynamics. Crown Prince's diplomatic outreach to Iran has reduced but not eliminated direct threat vectors.",
    situation_ar:
      "تواجه السعودية بيئة تهديد متعددة المحاور. تستمر هجمات الحوثيين بالطائرات المسيّرة والصواريخ على منشآت أرامكو على الساحل الغربي، مع اعتراضات حديثة قرب مجمع ينبع الصناعي. مشاريع رؤية ٢٠٣٠ الكبرى (نيوم، مشروع البحر الأحمر) توسع أسطح الهجوم. تبقى المنطقة الشرقية الأكثر حساسية بسبب تركّز حقل الغوار وديناميكيات السكان الشيعة. التواصل الدبلوماسي لولي العهد مع إيران قلّل لكن لم يلغِ محاور التهديد المباشر.",
    gcc_significance_en:
      "Saudi Arabia is the GCC's strategic anchor. Its 10.5M bpd production capacity and leadership of OPEC+ make energy disruption a global event. Riyadh's defense spending ($75B+) underwrites regional deterrence. Any internal instability would cascade across all Gulf states within hours through financial markets and security dependencies.",
    gcc_significance_ar:
      "السعودية هي المرتكز الاستراتيجي لمجلس التعاون. قدرتها الإنتاجية البالغة ١٠.٥ مليون برميل يومياً وقيادتها لأوبك+ تجعل أي تعطيل للطاقة حدثاً عالمياً. إنفاق الرياض الدفاعي (٧٥+ مليار دولار) يموّل الردع الإقليمي. أي عدم استقرار داخلي سينتقل لجميع دول الخليج خلال ساعات عبر الأسواق المالية والتبعيات الأمنية.",
    watch_next_en: [
      "Houthi drone launch patterns from Saada and Marib — increased frequency targeting Yanbu and Jeddah port",
      "Iranian proxy coordination signals in Eastern Province — monitor social media and encrypted channels",
      "NEOM construction security perimeter — expanded workforce creates insider threat vectors",
    ],
    watch_next_ar: [
      "أنماط إطلاق الحوثيين للمسيّرات من صعدة ومأرب — تصاعد وتيرة الاستهداف لينبع وميناء جدة",
      "إشارات تنسيق الوكلاء الإيرانيين في المنطقة الشرقية — مراقبة وسائل التواصل والقنوات المشفرة",
      "محيط أمن بناء نيوم — القوى العاملة الموسعة تخلق محاور تهديد داخلي",
    ],
    forecast_24h_en: "Elevated threat. Houthi UAV launch detected in past 12 hours. Patriot batteries on high alert around Aramco Ras Tanura.",
    forecast_24h_ar: "تهديد مرتفع. رُصد إطلاق مسيّرة حوثية خلال الـ١٢ ساعة الماضية. بطاريات باتريوت في حالة تأهب قصوى حول أرامكو رأس تنورة.",
    forecast_48h_en: "Possible Houthi retaliatory strike following coalition airstrikes in Marib. Red Sea shipping advisory may be issued.",
    forecast_48h_ar: "ضربة حوثية انتقامية محتملة بعد غارات التحالف في مأرب. قد يصدر تحذير للشحن في البحر الأحمر.",
    forecast_72h_en: "Diplomatic window with Iran through Oman backchannel. If talks fail, expect escalation in maritime incidents.",
    forecast_72h_ar: "نافذة دبلوماسية مع إيران عبر القناة الخلفية العمانية. في حال فشل المحادثات، توقع تصعيداً في الحوادث البحرية.",
    recommendations_en: [
      "Reinforce Patriot/THAAD coverage around Yanbu industrial complex",
      "Increase maritime patrol density in Red Sea between Jeddah and NEOM",
      "Coordinate with Bahrain-based US 5th Fleet on eastern Gulf surveillance",
      "Brief Vision 2030 security teams on drone threat countermeasures",
      "Activate diplomatic backchannel through Muscat to de-escalate Houthi tempo",
    ],
    recommendations_ar: [
      "تعزيز تغطية باتريوت/ثاد حول مجمع ينبع الصناعي",
      "زيادة كثافة الدوريات البحرية في البحر الأحمر بين جدة ونيوم",
      "التنسيق مع الأسطول الأمريكي الخامس في البحرين بشأن مراقبة شرق الخليج",
      "إحاطة فرق أمن رؤية ٢٠٣٠ بإجراءات مكافحة تهديد المسيّرات",
      "تفعيل القناة الدبلوماسية الخلفية عبر مسقط لخفض وتيرة هجمات الحوثيين",
    ],
    infrastructure_en: "Critical: Ghawar field (3.8M bpd), Ras Tanura terminal, Yanbu refinery complex, NEOM megaproject, Jeddah Islamic Port, King Abdulaziz Naval Base. Houthi threat to western assets remains HIGH.",
    infrastructure_ar: "حرج: حقل الغوار (٣.٨ مليون برميل/يوم)، محطة رأس تنورة، مجمع مصفاة ينبع، مشروع نيوم، ميناء جدة الإسلامي، قاعدة الملك عبدالعزيز البحرية. تهديد الحوثيين للأصول الغربية يبقى مرتفعاً.",
    instability_score: 62,
    risk_level: "HIGH",
  },

  ARE: {
    situation_en:
      "The UAE maintains one of the most robust security postures in the Gulf. Abu Dhabi's THAAD and Patriot integrated air defense network has proven effective against Houthi ballistic missile attacks. Dubai's position as a global logistics hub creates unique cyber and supply chain vulnerabilities. The normalization with Palestine (Abraham Accords) has enhanced intelligence sharing but also made the UAE a target for Iranian proxy operations. Jebel Ali port handles 15% of global container traffic — a single disruption event would cascade globally.",
    situation_ar:
      "تحافظ الإمارات على أحد أقوى الأوضاع الأمنية في الخليج. أثبتت شبكة أبوظبي المتكاملة للدفاع الجوي (ثاد وباتريوت) فعاليتها ضد هجمات الحوثيين بالصواريخ الباليستية. موقع دبي كمركز لوجستي عالمي يخلق ثغرات سيبرانية وسلسلة إمداد فريدة. التطبيع مع فلسطين (اتفاقيات إبراهيم) عزز تبادل الاستخبارات لكن جعل الإمارات أيضاً هدفاً لعمليات الوكلاء الإيرانيين. يتعامل ميناء جبل علي مع ١٥٪ من حركة الحاويات العالمية — أي تعطيل واحد سيتسلسل عالمياً.",
    gcc_significance_en:
      "The UAE is the GCC's economic diversification success story and its most globally connected node. Dubai International and Al Maktoum airports handle 90M+ passengers annually. The UAE's military modernization (F-35 discussions, indigenous drone program) raises the capability floor for the entire GCC. A successful attack on Jebel Ali would disrupt supply chains from Europe to East Asia.",
    gcc_significance_ar:
      "الإمارات هي قصة نجاح التنويع الاقتصادي في مجلس التعاون ونقطتها الأكثر ارتباطاً عالمياً. يتعامل مطار دبي الدولي ومطار آل مكتوم مع أكثر من ٩٠ مليون مسافر سنوياً. تحديث الإمارات العسكري (مباحثات إف-٣٥، برنامج المسيّرات المحلي) يرفع مستوى القدرة لمجلس التعاون بأكمله. هجوم ناجح على جبل علي سيعطل سلاسل الإمداد من أوروبا لشرق آسيا.",
    watch_next_en: [
      "Cyber threat indicators targeting Dubai Financial Centre and ADNOC systems — state-sponsored APT groups active",
      "Houthi long-range UAV capability upgrades — extended range threatens Abu Dhabi directly",
      "Iranian intelligence operations exploiting UAE trade networks for sanctions evasion",
    ],
    watch_next_ar: [
      "مؤشرات التهديد السيبراني التي تستهدف مركز دبي المالي وأنظمة أدنوك — مجموعات تهديد متقدمة مدعومة من دول نشطة",
      "ترقيات قدرة المسيّرات الحوثية بعيدة المدى — المدى الممتد يهدد أبوظبي مباشرة",
      "عمليات الاستخبارات الإيرانية التي تستغل شبكات التجارة الإماراتية للتهرب من العقوبات",
    ],
    forecast_24h_en: "Moderate. Enhanced cyber monitoring active. No immediate kinetic threat indicators.",
    forecast_24h_ar: "معتدل. المراقبة السيبرانية المعززة نشطة. لا مؤشرات تهديد حركي فوري.",
    forecast_48h_en: "Monitor Houthi signals intelligence for targeting data on UAE-flagged vessels in Bab el-Mandeb strait.",
    forecast_48h_ar: "مراقبة استخبارات الإشارات الحوثية لبيانات استهداف السفن الإماراتية في مضيق باب المندب.",
    forecast_72h_en: "Regional stability trending positive. Abraham Accords intelligence integration continues to mature. Watch for Iranian counter-moves.",
    forecast_72h_ar: "الاستقرار الإقليمي يتجه إيجابياً. تكامل استخبارات اتفاقيات إبراهيم يستمر بالنضوج. مراقبة التحركات الإيرانية المضادة.",
    recommendations_en: [
      "Enhance cyber defense around Jebel Ali port management systems",
      "Coordinate with Palestinian intelligence on shared Iranian threat vectors",
      "Maintain THAAD readiness at Al Dhafra Air Base",
      "Brief ADNOC security on latest Houthi drone technical capabilities",
      "Strengthen maritime domain awareness in Strait of Hormuz approaches",
    ],
    recommendations_ar: [
      "تعزيز الدفاع السيبراني حول أنظمة إدارة ميناء جبل علي",
      "التنسيق مع الاستخبارات الفلسطينية بشأن محاور التهديد الإيراني المشتركة",
      "الحفاظ على جاهزية ثاد في قاعدة الظفرة الجوية",
      "إحاطة أمن أدنوك بأحدث القدرات التقنية لمسيّرات الحوثيين",
      "تعزيز الوعي بالمجال البحري في مداخل مضيق هرمز",
    ],
    infrastructure_en: "Critical: Jebel Ali port (15% global containers), ADNOC offshore fields, Barakah nuclear plant, Al Dhafra Air Base (US/FR), Dubai International Airport. Cyber threats ELEVATED.",
    infrastructure_ar: "حرج: ميناء جبل علي (١٥٪ حاويات عالمية)، حقول أدنوك البحرية، محطة براكة النووية، قاعدة الظفرة الجوية (أمريكية/فرنسية)، مطار دبي الدولي. التهديدات السيبرانية مرتفعة.",
    instability_score: 58,
    risk_level: "ELEVATED",
  },

  IRN: {
    situation_en:
      "Iran operates the most complex threat matrix in the Middle East. The IRGC maintains proxy networks across Iraq (PMF), Lebanon (Hezbollah), Yemen (Houthis), Syria, and Gaza. Natanz and Fordow enrichment facilities continue operations with uranium enrichment at 60% — weeks from weapons-grade capability. Economic pressure from sanctions drives internal instability. The IRGCN's fast-attack craft swarms in the Strait of Hormuz remain the most immediate conventional threat to Gulf shipping. Recent protests indicate growing domestic fragility.",
    situation_ar:
      "تدير إيران أعقد مصفوفة تهديد في الشرق الأوسط. يحتفظ الحرس الثوري بشبكات وكلاء عبر العراق (الحشد الشعبي) ولبنان (حزب الله) واليمن (الحوثيين) وسوريا وغزة. تستمر عمليات منشأتي نطنز وفردو لتخصيب اليورانيوم عند ٦٠٪ — أسابيع من القدرة على إنتاج سلاح نووي. الضغط الاقتصادي من العقوبات يدفع عدم الاستقرار الداخلي. أسراب زوارق الهجوم السريع للحرس الثوري البحري في مضيق هرمز تبقى التهديد التقليدي الأكثر مباشرة للشحن الخليجي. الاحتجاجات الأخيرة تشير لهشاشة داخلية متزايدة.",
    gcc_significance_en:
      "Iran is the primary strategic threat to the GCC. Its ballistic missile arsenal can reach every Gulf capital within 7-12 minutes. The Strait of Hormuz chokepoint (21M bpd) gives Iran asymmetric leverage over the global economy. IRGC proxy operations in Iraq, Bahrain, and eastern Saudi Arabia create persistent destabilization vectors. Nuclear breakout would fundamentally reshape the regional security architecture.",
    gcc_significance_ar:
      "إيران هي التهديد الاستراتيجي الأساسي لمجلس التعاون. ترسانتها من الصواريخ الباليستية تصل لكل عاصمة خليجية خلال ٧-١٢ دقيقة. نقطة اختناق مضيق هرمز (٢١ مليون برميل/يوم) تمنح إيران نفوذاً غير متماثل على الاقتصاد العالمي. عمليات وكلاء الحرس الثوري في العراق والبحرين وشرق السعودية تخلق محاور زعزعة استقرار مستمرة. الاختراق النووي سيعيد تشكيل هندسة الأمن الإقليمي جذرياً.",
    watch_next_en: [
      "IAEA inspection access at Fordow — any denial signals potential breakout acceleration",
      "IRGCN fast-boat exercises in Strait of Hormuz — pattern changes indicate rehearsal for disruption",
      "Proxy coordination between Houthis and Iraqi PMF — synchronized attacks stretch GCC defenses",
    ],
    watch_next_ar: [
      "وصول مفتشي الوكالة الدولية للطاقة الذرية إلى فردو — أي رفض يشير لتسريع محتمل للاختراق النووي",
      "مناورات الزوارق السريعة للحرس الثوري في مضيق هرمز — تغيرات النمط تشير لتمرين على التعطيل",
      "تنسيق الوكلاء بين الحوثيين والحشد الشعبي العراقي — الهجمات المتزامنة تمدد دفاعات مجلس التعاون",
    ],
    forecast_24h_en: "Critical watch. IRGCN activity elevated in Strait of Hormuz. Three fast-attack craft spotted near Larak Island.",
    forecast_24h_ar: "مراقبة حرجة. نشاط الحرس الثوري البحري مرتفع في مضيق هرمز. رُصدت ثلاث زوارق هجوم سريع قرب جزيرة لارك.",
    forecast_48h_en: "JCPOA talks in Vienna stalled. Hardliner rhetoric increasing — possible provocative naval action to demonstrate leverage.",
    forecast_48h_ar: "محادثات الاتفاق النووي في فيينا متوقفة. الخطاب المتشدد يتصاعد — إجراء بحري استفزازي محتمل لإظهار النفوذ.",
    forecast_72h_en: "Supreme Leader health rumors circulating — succession uncertainty could trigger internal power struggles and external provocations.",
    forecast_72h_ar: "شائعات عن صحة المرشد الأعلى متداولة — عدم يقين الخلافة قد يطلق صراعات سلطة داخلية واستفزازات خارجية.",
    recommendations_en: [
      "Maintain maximum maritime surveillance in Strait of Hormuz with allied naval assets",
      "Pre-position CENTCOM rapid response assets for Hormuz contingency",
      "Enhance SIGINT collection on IRGCN communications in Gulf sector",
      "Coordinate with IAEA for real-time monitoring of enrichment activities",
      "Activate GCC joint air defense network for potential ballistic missile launch",
    ],
    recommendations_ar: [
      "الحفاظ على أقصى مراقبة بحرية في مضيق هرمز مع الأصول البحرية الحليفة",
      "تمركز أصول الاستجابة السريعة للقيادة المركزية مسبقاً لطوارئ هرمز",
      "تعزيز جمع استخبارات الإشارات عن اتصالات الحرس الثوري البحري في قطاع الخليج",
      "التنسيق مع الوكالة الدولية للطاقة الذرية للمراقبة الفورية لأنشطة التخصيب",
      "تفعيل شبكة الدفاع الجوي المشتركة لمجلس التعاون لإطلاق صاروخ باليستي محتمل",
    ],
    infrastructure_en: "Threat sources: Natanz & Fordow enrichment, Bushehr reactor, Bandar Abbas naval base, Chabahar port, Kharg Island terminal (90% of Iran's oil exports). Internal vulnerability: aging oil infrastructure, power grid under stress.",
    infrastructure_ar: "مصادر التهديد: تخصيب نطنز وفردو، مفاعل بوشهر، قاعدة بندر عباس البحرية، ميناء تشابهار، محطة جزيرة خرج (٩٠٪ من صادرات إيران النفطية). ثغرة داخلية: بنية نفطية متقادمة، شبكة كهرباء تحت ضغط.",
    instability_score: 85,
    risk_level: "CRITICAL",
  },
};

/**
 * Get seeded intelligence for a country, localized.
 */
export function getSeededIntel(
  iso3: string,
  lang: "en" | "ar"
): {
  situation: string;
  gcc_significance: string;
  watch_next: string[];
  instability_score: number;
  risk_level: string;
} | null {
  const data = SEEDED_COUNTRY_INTEL[iso3];
  if (!data) return null;
  const isAr = lang === "ar";
  return {
    situation: isAr ? data.situation_ar : data.situation_en,
    gcc_significance: isAr ? data.gcc_significance_ar : data.gcc_significance_en,
    watch_next: isAr ? data.watch_next_ar : data.watch_next_en,
    instability_score: data.instability_score,
    risk_level: data.risk_level,
  };
}

/**
 * Get seeded full brief text for a country.
 */
export function getSeededFullBrief(iso3: string, lang: "en" | "ar"): string | null {
  const data = SEEDED_COUNTRY_INTEL[iso3];
  if (!data) return null;
  const isAr = lang === "ar";

  if (isAr) {
    return `الملخص التنفيذي
${data.situation_ar}

الأهمية الخليجية
${data.gcc_significance_ar}

الأحداث والإشارات الرئيسية
${data.watch_next_ar.map((w, i) => `${i + 1}. ${w}`).join("\n")}

تعرض البنية التحتية
${data.infrastructure_ar}

التوقعات
• ٢٤ ساعة: ${data.forecast_24h_ar}
• ٤٨ ساعة: ${data.forecast_48h_ar}
• ٧٢ ساعة: ${data.forecast_72h_ar}

الإجراءات الموصى بها
${data.recommendations_ar.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
  }

  return `EXECUTIVE SUMMARY
${data.situation_en}

GCC AND REGIONAL SIGNIFICANCE
${data.gcc_significance_en}

KEY EVENTS AND SIGNALS
${data.watch_next_en.map((w, i) => `${i + 1}. ${w}`).join("\n")}

INFRASTRUCTURE EXPOSURE
${data.infrastructure_en}

FORECAST
• 24 hours: ${data.forecast_24h_en}
• 48 hours: ${data.forecast_48h_en}
• 72 hours: ${data.forecast_72h_en}

RECOMMENDED ACTIONS
${data.recommendations_en.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
}
