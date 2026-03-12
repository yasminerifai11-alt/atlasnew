// ─── Intel Library Data ─────────────────────────────────────────

export interface LibraryCategory {
  key: string;
  label: string;
  labelAr: string;
  color: string;
  icon: string;
}

export const LIBRARY_CATEGORIES: LibraryCategory[] = [
  { key: "News & Media", label: "News & Media", labelAr: "الأخبار والإعلام", color: "#60a5fa", icon: "📰" },
  { key: "Think Tanks & Analysis", label: "Think Tanks & Analysis", labelAr: "مراكز الأبحاث والتحليل", color: "#a78bfa", icon: "🧠" },
  { key: "Conflict & Security", label: "Conflict & Security", labelAr: "النزاعات والأمن", color: "#ef4444", icon: "⚔" },
  { key: "Energy & Commodities", label: "Energy & Commodities", labelAr: "الطاقة والسلع", color: "#f59e0b", icon: "⚡" },
  { key: "Maritime & Shipping", label: "Maritime & Shipping", labelAr: "الشحن البحري", color: "#06b6d4", icon: "🚢" },
  { key: "Aviation", label: "Aviation", labelAr: "الطيران", color: "#818cf8", icon: "✈" },
  { key: "Satellite & Imagery", label: "Satellite & Imagery", labelAr: "الأقمار الصناعية والصور", color: "#a3e635", icon: "🛰" },
  { key: "Seismic & Disasters", label: "Seismic & Disasters", labelAr: "الزلازل والكوارث", color: "#f97316", icon: "🌍" },
  { key: "Cyber & Digital", label: "Cyber & Digital", labelAr: "الأمن الإلكتروني", color: "#a78bfa", icon: "🔒" },
  { key: "Financial & Markets", label: "Financial & Markets", labelAr: "المال والأسواق", color: "#34d399", icon: "📊" },
  { key: "Health & Humanitarian", label: "Health & Humanitarian", labelAr: "الصحة والإنسانية", color: "#fb7185", icon: "🏥" },
  { key: "Space & Weather", label: "Space & Weather", labelAr: "الفضاء والطقس", color: "#e879f9", icon: "🚀" },
  { key: "Government & Official", label: "Government & Official", labelAr: "الحكومة والرسمي", color: "#94a3b8", icon: "🏛" },
  { key: "Defense & Military", label: "Defense & Military", labelAr: "الدفاع والعسكري", color: "#dc2626", icon: "🛡" },
  { key: "Social Media & Live", label: "Social Media & Live", labelAr: "وسائل التواصل والمباشر", color: "#38bdf8", icon: "📱" },
  { key: "Live Webcams", label: "Live Webcams", labelAr: "كاميرات مباشرة", color: "#fbbf24", icon: "📹" },
];

export interface LibrarySource {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  region?: string;
  type?: string; // "social" | "webcam" | "official" or undefined
  platform?: string; // "X" | "Telegram"
  tier: "free" | "premium";
  status: "LIVE" | "PREMIUM";
  reliability: number;
  frequency?: string;
  description?: string;
  description_ar?: string;
  url?: string;
  lastSynced?: string;
  eventsToday?: number;
  note?: string;
  twitter?: string;
}

export const LIBRARY_SOURCES: LibrarySource[] = [
// NEWS & MEDIA — GLOBAL
// Wire Services
{id:"reuters",name:"Reuters",category:"News & Media",subcategory:"Wire Service",region:"Global",tier:"free",status:"LIVE",reliability:96,frequency:"Real-time",description:"Global breaking news and financial reporting",description_ar:"أخبار عالمية عاجلة وتقارير مالية",url:"https://feeds.reuters.com/reuters/topNews"},
{id:"ap",name:"AP News",category:"News & Media",subcategory:"Wire Service",region:"Global",tier:"free",status:"LIVE",reliability:96,frequency:"Real-time",description:"Associated Press global newswire"},
{id:"afp",name:"AFP",category:"News & Media",subcategory:"Wire Service",region:"Global",tier:"free",status:"LIVE",reliability:95,frequency:"Real-time",description:"Agence France-Presse international wire"},
{id:"bloomberg",name:"Bloomberg",category:"News & Media",subcategory:"Financial News",region:"Global",tier:"free",status:"LIVE",reliability:97,frequency:"Real-time",description:"Financial markets and global news"},
// International Broadcast
{id:"bbc",name:"BBC World",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:95,frequency:"Real-time"},
{id:"cnn",name:"CNN World",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time"},
{id:"aljazeera",name:"Al Jazeera",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:90,frequency:"Real-time"},
{id:"france24",name:"France 24",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:91,frequency:"Real-time"},
{id:"dw",name:"DW News",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:90,frequency:"Real-time"},
{id:"euronews",name:"Euronews",category:"News & Media",region:"Europe",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time"},
{id:"cnbc",name:"CNBC",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:87,frequency:"Real-time"},
{id:"skynews",name:"Sky News",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time"},
{id:"nhk",name:"NHK World",category:"News & Media",region:"Asia",tier:"free",status:"LIVE",reliability:92,frequency:"Real-time"},
{id:"cgtn",name:"CGTN",category:"News & Media",region:"Asia",tier:"free",status:"LIVE",reliability:75,frequency:"Real-time",note:"State media — verify"},
{id:"rt",name:"RT English",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:55,frequency:"Real-time",note:"State media — verify"},
// Print & Digital
{id:"ft",name:"Financial Times",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:95,frequency:"Real-time"},
{id:"wsj",name:"Wall Street Journal",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:94,frequency:"Real-time"},
{id:"economist",name:"The Economist",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:94,frequency:"Weekly"},
{id:"foreignaffairs",name:"Foreign Affairs",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:93,frequency:"Daily"},
{id:"foreignpolicy",name:"Foreign Policy",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:91,frequency:"Daily"},
{id:"guardian",name:"The Guardian",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time"},
{id:"lemonde",name:"Le Monde",category:"News & Media",region:"Europe",tier:"free",status:"LIVE",reliability:90,frequency:"Real-time"},
{id:"spiegel",name:"Der Spiegel",category:"News & Media",region:"Europe",tier:"free",status:"LIVE",reliability:89,frequency:"Daily"},
{id:"elpais",name:"El País",category:"News & Media",region:"Europe",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time"},
{id:"scmp",name:"South China Morning Post",category:"News & Media",region:"Asia",tier:"free",status:"LIVE",reliability:84,frequency:"Real-time"},
{id:"nikkei",name:"Nikkei Asia",category:"News & Media",region:"Asia",tier:"free",status:"LIVE",reliability:91,frequency:"Real-time"},
{id:"politico",name:"Politico",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:87,frequency:"Real-time"},
{id:"axios",name:"Axios",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time"},
{id:"haaretz",name:"Haaretz",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time"},
// Middle East Media
{id:"alarabiya",name:"Al Arabiya",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:85,frequency:"Real-time"},
{id:"asharq",name:"Asharq News",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:86,frequency:"Real-time"},
{id:"asharqbiz",name:"Asharq Business",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:85,frequency:"Real-time"},
{id:"arabnews",name:"Arab News",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:84,frequency:"Real-time"},
{id:"thenational",name:"The National",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:85,frequency:"Real-time"},
{id:"mee",name:"Middle East Eye",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:82,frequency:"Real-time"},
{id:"iraninternational",name:"Iran International",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:80,frequency:"Real-time"},
{id:"rudaw",name:"Rudaw",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:82,frequency:"Real-time"},
{id:"gulfnews",name:"Gulf News",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:83,frequency:"Real-time"},
{id:"khaleejtimes",name:"Khaleej Times",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:82,frequency:"Real-time"},
{id:"saudigazette",name:"Saudi Gazette",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:80,frequency:"Real-time"},
{id:"omandomobserver",name:"Oman Observer",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:80,frequency:"Daily"},
{id:"presstv",name:"Press TV",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:50,frequency:"Real-time",note:"Iranian state media — verify"},
{id:"irna",name:"IRNA",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:55,frequency:"Real-time",note:"Iranian state media — verify"},
{id:"tasnim",name:"Tasnim News",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:52,frequency:"Real-time",note:"Iranian state media — verify"},
{id:"farsnews",name:"Fars News",category:"News & Media",region:"Middle East",tier:"free",status:"LIVE",reliability:50,frequency:"Real-time",note:"Iranian state media — verify"},
{id:"xinhua",name:"Xinhua",category:"News & Media",region:"Asia",tier:"free",status:"LIVE",reliability:70,frequency:"Real-time",note:"Chinese state media — verify"},
{id:"tass",name:"TASS",category:"News & Media",region:"Global",tier:"free",status:"LIVE",reliability:58,frequency:"Real-time",note:"Russian state media — verify"},
// Africa Media
{id:"vanguard",name:"Vanguard Nigeria",category:"News & Media",region:"Africa",tier:"free",status:"LIVE",reliability:80,frequency:"Real-time"},
{id:"dailytrust",name:"Daily Trust",category:"News & Media",region:"Africa",tier:"free",status:"LIVE",reliability:79,frequency:"Daily"},
{id:"news24",name:"News24",category:"News & Media",region:"Africa",tier:"free",status:"LIVE",reliability:82,frequency:"Real-time"},
{id:"jeuneafrique",name:"Jeune Afrique",category:"News & Media",region:"Africa",tier:"free",status:"LIVE",reliability:83,frequency:"Daily"},
{id:"africanews",name:"Africanews",category:"News & Media",region:"Africa",tier:"free",status:"LIVE",reliability:79,frequency:"Real-time"},
{id:"bbcafrica",name:"BBC Africa",category:"News & Media",region:"Africa",tier:"free",status:"LIVE",reliability:92,frequency:"Real-time"},
// Asia Pacific Media
{id:"ndtv",name:"NDTV",category:"News & Media",region:"Asia",tier:"free",status:"LIVE",reliability:82,frequency:"Real-time"},
{id:"thehindu",name:"The Hindu",category:"News & Media",region:"Asia",tier:"free",status:"LIVE",reliability:84,frequency:"Real-time"},
{id:"bangkokpost",name:"Bangkok Post",category:"News & Media",region:"Asia",tier:"free",status:"LIVE",reliability:82,frequency:"Real-time"},
{id:"yonhap",name:"Yonhap News",category:"News & Media",region:"Asia",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time"},
{id:"japantoday",name:"Japan Today",category:"News & Media",region:"Asia",tier:"free",status:"LIVE",reliability:85,frequency:"Real-time"},
{id:"asahi",name:"Asahi Shimbun",category:"News & Media",region:"Asia",tier:"free",status:"LIVE",reliability:89,frequency:"Real-time"},
{id:"cna",name:"CNA Singapore",category:"News & Media",region:"Asia",tier:"free",status:"LIVE",reliability:86,frequency:"Real-time"},
// Eastern Europe
{id:"kyivindependent",name:"Kyiv Independent",category:"News & Media",region:"Europe",tier:"free",status:"LIVE",reliability:82,frequency:"Real-time"},
{id:"meduza",name:"Meduza",category:"News & Media",region:"Europe",tier:"free",status:"LIVE",reliability:80,frequency:"Daily"},
{id:"moscotimes",name:"Moscow Times",category:"News & Media",region:"Europe",tier:"free",status:"LIVE",reliability:79,frequency:"Daily"},
{id:"politicoeurope",name:"Politico Europe",category:"News & Media",region:"Europe",tier:"free",status:"LIVE",reliability:87,frequency:"Real-time"},
// Latin America
{id:"infobae",name:"Infobae",category:"News & Media",region:"Latin America",tier:"free",status:"LIVE",reliability:78,frequency:"Real-time"},
{id:"oglobo",name:"O Globo",category:"News & Media",region:"Latin America",tier:"free",status:"LIVE",reliability:80,frequency:"Real-time"},
{id:"france24latam",name:"France 24 LatAm",category:"News & Media",region:"Latin America",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time"},
// THINK TANKS & ANALYSIS
{id:"brookings",name:"Brookings",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:89,frequency:"Daily"},
{id:"bulletinatomic",name:"Bulletin of Atomic Scientists",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:92,frequency:"Daily"},
{id:"carnegie",name:"Carnegie Endowment",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:90,frequency:"Daily"},
{id:"chathamhouse",name:"Chatham House",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:91,frequency:"Daily"},
{id:"csis",name:"CSIS",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:89,frequency:"Daily"},
{id:"cnas",name:"CNAS",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:87,frequency:"Daily"},
{id:"rand",name:"RAND",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:91,frequency:"Daily"},
{id:"atlanticcouncil",name:"Atlantic Council",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Daily"},
{id:"iiss",name:"IISS",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:92,frequency:"Daily"},
{id:"wilsoncenter",name:"Wilson Center",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Daily"},
{id:"stimson",name:"Stimson Center",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:87,frequency:"Daily"},
{id:"rusi",name:"RUSI",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:90,frequency:"Daily"},
{id:"ecfr",name:"ECFR",category:"Think Tanks & Analysis",region:"Europe",tier:"free",status:"LIVE",reliability:86,frequency:"Daily"},
{id:"fpri",name:"FPRI",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:86,frequency:"Daily"},
{id:"gmf",name:"GMF",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:85,frequency:"Daily"},
{id:"mei",name:"Middle East Institute",category:"Think Tanks & Analysis",region:"Middle East",tier:"free",status:"LIVE",reliability:87,frequency:"Daily"},
{id:"lowy",name:"Lowy Institute",category:"Think Tanks & Analysis",region:"Asia",tier:"free",status:"LIVE",reliability:88,frequency:"Daily"},
{id:"nti",name:"NTI",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:93,frequency:"Daily"},
{id:"armscontrol",name:"Arms Control Association",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:91,frequency:"Daily"},
{id:"crisisgroup",name:"Crisis Group",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:89,frequency:"Daily"},
{id:"warontherocks",name:"War on the Rocks",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:87,frequency:"Daily"},
{id:"responsiblestatecraft",name:"Responsible Statecraft",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:82,frequency:"Daily"},
{id:"euiss",name:"EU ISS",category:"Think Tanks & Analysis",region:"Europe",tier:"free",status:"LIVE",reliability:87,frequency:"Daily"},
{id:"jamestown",name:"Jamestown Foundation",category:"Think Tanks & Analysis",region:"Global",tier:"free",status:"LIVE",reliability:85,frequency:"Daily"},
// CONFLICT & SECURITY
{id:"acled",name:"ACLED",category:"Conflict & Security",region:"Global",tier:"free",status:"LIVE",reliability:94,frequency:"Daily",description:"Armed conflict location and event data — gold standard for conflict mapping",description_ar:"بيانات مواقع النزاعات المسلحة والأحداث"},
{id:"gdelt",name:"GDELT Project",category:"Conflict & Security",region:"Global",tier:"free",status:"LIVE",reliability:85,frequency:"15 min",description:"Global events language and tone monitor",description_ar:"مراقبة الأحداث العالمية واللغة والنبرة"},
{id:"bellingcat",name:"Bellingcat",category:"Conflict & Security",region:"Global",tier:"free",status:"LIVE",reliability:88,description:"Open source investigation and verification",description_ar:"التحقيق والتحقق من المصادر المفتوحة"},
{id:"oryx",name:"Oryx OSINT",category:"Conflict & Security",region:"Global",tier:"free",status:"LIVE",reliability:90,description:"Military equipment losses verified by imagery",description_ar:"خسائر المعدات العسكرية موثقة بالصور"},
{id:"thewarzone",name:"The War Zone",category:"Conflict & Security",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Daily"},
{id:"defensenews",name:"Defense News",category:"Conflict & Security",region:"Global",tier:"free",status:"LIVE",reliability:87,frequency:"Daily"},
{id:"defenseone",name:"Defense One",category:"Conflict & Security",region:"Global",tier:"free",status:"LIVE",reliability:86,frequency:"Daily"},
{id:"breakingdefense",name:"Breaking Defense",category:"Conflict & Security",region:"Global",tier:"free",status:"LIVE",reliability:85,frequency:"Daily"},
{id:"usni",name:"USNI News",category:"Conflict & Security",region:"Global",tier:"free",status:"LIVE",reliability:90,frequency:"Daily",description:"US Naval Institute — definitive naval intelligence"},
{id:"militarytimes",name:"Military Times",category:"Conflict & Security",region:"Global",tier:"free",status:"LIVE",reliability:83,frequency:"Daily"},
{id:"taskandpurpose",name:"Task & Purpose",category:"Conflict & Security",region:"Global",tier:"free",status:"LIVE",reliability:84,frequency:"Daily"},
{id:"navalnews",name:"Naval News",category:"Conflict & Security",region:"Global",tier:"free",status:"LIVE",reliability:85,frequency:"Daily"},
{id:"insightcrime",name:"InSight Crime",category:"Conflict & Security",region:"Latin America",tier:"free",status:"LIVE",reliability:85,frequency:"Daily"},
{id:"janes",name:"Janes Defence",category:"Conflict & Security",region:"Global",tier:"premium",status:"PREMIUM",reliability:95},
{id:"stratfor",name:"Stratfor",category:"Conflict & Security",region:"Global",tier:"premium",status:"PREMIUM",reliability:88},
{id:"controlrisks",name:"Control Risks",category:"Conflict & Security",region:"Global",tier:"premium",status:"PREMIUM",reliability:90},
{id:"oxfordanalytica",name:"Oxford Analytica",category:"Conflict & Security",region:"Global",tier:"premium",status:"PREMIUM",reliability:91},
{id:"osintdefender",name:"OSINTdefender",category:"Conflict & Security",type:"social",platform:"X",region:"Global",tier:"free",status:"LIVE",reliability:82,frequency:"Real-time",description:"OSINT aggregator — conflict verification"},
// ENERGY & COMMODITIES
{id:"eia",name:"EIA Energy Data",category:"Energy & Commodities",region:"Global",tier:"free",status:"LIVE",reliability:99,frequency:"Daily",description:"US energy data — oil production storage and prices",description_ar:"بيانات الطاقة الأمريكية — إنتاج النفط والتخزين والأسعار"},
{id:"iea",name:"IEA",category:"Energy & Commodities",region:"Global",tier:"free",status:"LIVE",reliability:97,frequency:"Monthly",description:"International Energy Agency — global energy outlook"},
{id:"opec",name:"OPEC",category:"Energy & Commodities",region:"Middle East",tier:"free",status:"LIVE",reliability:95,frequency:"Monthly"},
{id:"oilgasjournal",name:"Oil & Gas Journal",category:"Energy & Commodities",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Daily"},
{id:"rigzone",name:"Rigzone",category:"Energy & Commodities",region:"Global",tier:"free",status:"LIVE",reliability:85,frequency:"Daily"},
{id:"lngworldnews",name:"LNG World News",category:"Energy & Commodities",region:"Global",tier:"free",status:"LIVE",reliability:86,frequency:"Daily"},
{id:"oilprice",name:"OilPrice.com",category:"Energy & Commodities",region:"Global",tier:"free",status:"LIVE",reliability:82,frequency:"Real-time"},
{id:"naturalgasworld",name:"Natural Gas World",category:"Energy & Commodities",region:"Global",tier:"free",status:"LIVE",reliability:83,frequency:"Daily"},
{id:"miningcom",name:"Mining.com",category:"Energy & Commodities",region:"Global",tier:"free",status:"LIVE",reliability:82,frequency:"Daily"},
{id:"platts",name:"S&P Global Platts",category:"Energy & Commodities",region:"Global",tier:"premium",status:"PREMIUM",reliability:96},
{id:"argusmedia",name:"Argus Media",category:"Energy & Commodities",region:"Global",tier:"premium",status:"PREMIUM",reliability:94},
// MARITIME & SHIPPING
{id:"marinetraffic",name:"MarineTraffic AIS",category:"Maritime & Shipping",region:"Global",tier:"free",status:"LIVE",reliability:93,frequency:"Real-time",description:"Live global vessel tracking and port activity",description_ar:"تتبع السفن العالمي المباشر ونشاط الموانئ"},
{id:"vesselfinder",name:"VesselFinder",category:"Maritime & Shipping",region:"Global",tier:"free",status:"LIVE",reliability:90,frequency:"Real-time"},
{id:"fleetmon",name:"FleetMon",category:"Maritime & Shipping",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time"},
{id:"portwatch",name:"PortWatch IMF",category:"Maritime & Shipping",region:"Global",tier:"free",status:"LIVE",reliability:91,frequency:"Daily",description:"IMF port activity and trade flow monitor"},
{id:"gcaptain",name:"gCaptain",category:"Maritime & Shipping",region:"Global",tier:"free",status:"LIVE",reliability:87,frequency:"Daily"},
{id:"bimco",name:"BIMCO",category:"Maritime & Shipping",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Daily"},
{id:"globalfishingwatch",name:"Global Fishing Watch",category:"Maritime & Shipping",region:"Global",tier:"free",status:"LIVE",reliability:87,frequency:"15 min",description:"Vessel behavior and dark vessel detection"},
{id:"lloydsintel",name:"Lloyd's List Intelligence",category:"Maritime & Shipping",region:"Global",tier:"premium",status:"PREMIUM",reliability:94},
{id:"dryadglobal",name:"Dryad Global",category:"Maritime & Shipping",region:"Global",tier:"premium",status:"PREMIUM",reliability:89,description:"Maritime security and piracy intelligence"},
// AVIATION
{id:"flightradar",name:"Flightradar24",category:"Aviation",region:"Global",tier:"free",status:"LIVE",reliability:95,frequency:"Real-time",description:"Live commercial aviation tracking globally",description_ar:"تتبع الطيران التجاري المباشر عالمياً"},
{id:"flightaware",name:"FlightAware",category:"Aviation",region:"Global",tier:"free",status:"LIVE",reliability:93,frequency:"Real-time"},
{id:"opensky",name:"OpenSky Network",category:"Aviation",region:"Global",tier:"free",status:"LIVE",reliability:91,frequency:"Real-time",description:"Includes military and unfiltered ADS-B data"},
{id:"adsbexchange",name:"ADS-B Exchange",category:"Aviation",region:"Global",tier:"free",status:"LIVE",reliability:92,frequency:"Real-time",description:"Unfiltered — shows military aircraft other trackers hide"},
{id:"radarbox",name:"RadarBox",category:"Aviation",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time"},
{id:"aviationherald",name:"Aviation Herald",category:"Aviation",region:"Global",tier:"free",status:"LIVE",reliability:90,frequency:"As needed",description:"Aviation incidents and accidents database"},
{id:"notam",name:"NOTAM System",category:"Aviation",region:"Global",tier:"free",status:"LIVE",reliability:97,frequency:"Real-time",description:"Airspace restrictions and closures in real time"},
// SATELLITE & IMAGERY
{id:"nasafirms",name:"NASA FIRMS",category:"Satellite & Imagery",region:"Global",tier:"free",status:"LIVE",reliability:92,frequency:"6 hours",description:"Fire and thermal anomaly detection via VIIRS and MODIS",description_ar:"رصد الحرائق والشذوذ الحراري عبر الأقمار الصناعية"},
{id:"nasaeonet",name:"NASA EONET",category:"Satellite & Imagery",region:"Global",tier:"free",status:"LIVE",reliability:95,frequency:"Hourly",description:"Natural event tracker — wildfires storms volcanoes"},
{id:"nasaworldview",name:"NASA Worldview",category:"Satellite & Imagery",region:"Global",tier:"free",status:"LIVE",reliability:98,frequency:"Daily",description:"Full earth satellite imagery updated daily"},
{id:"sentinelhub",name:"Sentinel Hub ESA",category:"Satellite & Imagery",region:"Global",tier:"free",status:"LIVE",reliability:96,frequency:"6 hours",description:"European satellite imagery and change detection"},
{id:"copernicus",name:"Copernicus Emergency",category:"Satellite & Imagery",region:"Global",tier:"free",status:"LIVE",reliability:95,frequency:"As needed",description:"EU emergency mapping — activates in crises"},
{id:"noaasatellite",name:"NOAA Satellites",category:"Satellite & Imagery",region:"Global",tier:"free",status:"LIVE",reliability:97,frequency:"Real-time"},
{id:"zoomearth",name:"Zoom Earth",category:"Satellite & Imagery",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Daily",description:"Near real-time satellite imagery viewer"},
{id:"windy",name:"Windy Satellite",category:"Satellite & Imagery",region:"Global",tier:"free",status:"LIVE",reliability:90,frequency:"Real-time"},
{id:"planet",name:"Planet Labs",category:"Satellite & Imagery",region:"Global",tier:"premium",status:"PREMIUM",reliability:95,description:"Daily high-resolution imagery of entire earth"},
{id:"maxar",name:"Maxar Technologies",category:"Satellite & Imagery",region:"Global",tier:"premium",status:"PREMIUM",reliability:97,description:"Highest resolution commercial satellite imagery"},
{id:"blacksky",name:"BlackSky",category:"Satellite & Imagery",region:"Global",tier:"premium",status:"PREMIUM",reliability:94,description:"Rapid revisit satellite monitoring"},
// SEISMIC & DISASTERS
{id:"usgs",name:"USGS Earthquakes",category:"Seismic & Disasters",region:"Global",tier:"free",status:"LIVE",reliability:99,frequency:"Real-time",description:"Real-time global seismic monitoring",description_ar:"رصد الزلازل العالمي الفوري"},
{id:"emsc",name:"EMSC",category:"Seismic & Disasters",region:"Global",tier:"free",status:"LIVE",reliability:98,frequency:"Real-time",description:"European seismic monitoring with felt reports"},
{id:"gdacs",name:"GDACS",category:"Seismic & Disasters",region:"Global",tier:"free",status:"LIVE",reliability:97,frequency:"Real-time",description:"UN disaster alert coordination system"},
{id:"noaaweather",name:"NOAA Weather Alerts",category:"Seismic & Disasters",region:"Global",tier:"free",status:"LIVE",reliability:97,frequency:"Real-time"},
{id:"volcanodiscovery",name:"Volcano Discovery",category:"Seismic & Disasters",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Daily"},
{id:"tsunami",name:"Pacific Tsunami Warning",category:"Seismic & Disasters",region:"Global",tier:"free",status:"LIVE",reliability:99,frequency:"Real-time"},
{id:"reliefweb",name:"ReliefWeb",category:"Seismic & Disasters",region:"Global",tier:"free",status:"LIVE",reliability:93,frequency:"Hourly"},
{id:"ocha",name:"OCHA",category:"Seismic & Disasters",region:"Global",tier:"free",status:"LIVE",reliability:94,frequency:"Hourly"},
// CYBER & DIGITAL
{id:"cisa",name:"CISA Alerts",category:"Cyber & Digital",region:"Global",tier:"free",status:"LIVE",reliability:98,frequency:"As needed",description:"US critical infrastructure cyber advisories",description_ar:"تنبيهات الأمن السيبراني للبنية التحتية الحيوية"},
{id:"netblocks",name:"NetBlocks",category:"Cyber & Digital",region:"Global",tier:"free",status:"LIVE",reliability:94,frequency:"Real-time",description:"Internet shutdown and disruption monitoring"},
{id:"cloudflareadar",name:"Cloudflare Radar",category:"Cyber & Digital",region:"Global",tier:"free",status:"LIVE",reliability:95,frequency:"Real-time",description:"Global internet traffic and outage detection"},
{id:"krebssecurity",name:"Krebs on Security",category:"Cyber & Digital",region:"Global",tier:"free",status:"LIVE",reliability:90,frequency:"As needed"},
{id:"therecord",name:"The Record",category:"Cyber & Digital",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Daily"},
{id:"hackernews",name:"Hacker News",category:"Cyber & Digital",region:"Global",tier:"free",status:"LIVE",reliability:82,frequency:"Real-time"},
{id:"ransomwarelive",name:"Ransomware.live",category:"Cyber & Digital",region:"Global",tier:"free",status:"LIVE",reliability:85,frequency:"Real-time",description:"Live ransomware attack tracker and victim monitor"},
{id:"cybersecuritydive",name:"Cybersecurity Dive",category:"Cyber & Digital",region:"Global",tier:"free",status:"LIVE",reliability:84,frequency:"Daily"},
{id:"recordedfuture",name:"Recorded Future",category:"Cyber & Digital",region:"Global",tier:"premium",status:"PREMIUM",reliability:93},
{id:"mandiant",name:"Mandiant",category:"Cyber & Digital",region:"Global",tier:"premium",status:"PREMIUM",reliability:94},
// FINANCIAL & MARKETS
{id:"gulfexchanges",name:"Gulf Exchange Data",category:"Financial & Markets",region:"Middle East",tier:"free",status:"LIVE",reliability:94,frequency:"Real-time",description:"Tadawul ADX DFM KSE BHB MSX live data",description_ar:"بيانات تداول والأسواق الخليجية المباشرة"},
{id:"yahoofinance",name:"Yahoo Finance",category:"Financial & Markets",region:"Global",tier:"free",status:"LIVE",reliability:90,frequency:"Real-time"},
{id:"marketwatch",name:"MarketWatch",category:"Financial & Markets",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time"},
{id:"worldbank",name:"World Bank",category:"Financial & Markets",region:"Global",tier:"free",status:"LIVE",reliability:99,frequency:"Daily"},
{id:"imf",name:"IMF Data",category:"Financial & Markets",region:"Global",tier:"free",status:"LIVE",reliability:99,frequency:"Daily"},
{id:"federalreserve",name:"Federal Reserve",category:"Financial & Markets",region:"Global",tier:"free",status:"LIVE",reliability:99,frequency:"As needed"},
{id:"ecb",name:"ECB",category:"Financial & Markets",region:"Europe",tier:"free",status:"LIVE",reliability:99,frequency:"As needed"},
{id:"sec",name:"SEC",category:"Financial & Markets",region:"Global",tier:"free",status:"LIVE",reliability:98,frequency:"As needed"},
{id:"ustreasurydata",name:"US Treasury",category:"Financial & Markets",region:"Global",tier:"free",status:"LIVE",reliability:98,frequency:"As needed"},
// HEALTH & HUMANITARIAN
{id:"who",name:"WHO Disease Alerts",category:"Health & Humanitarian",region:"Global",tier:"free",status:"LIVE",reliability:99,frequency:"Daily",description:"Official global disease outbreak notifications",description_ar:"إشعارات رسمية بتفشي الأمراض حول العالم"},
{id:"cdc",name:"CDC",category:"Health & Humanitarian",region:"Global",tier:"free",status:"LIVE",reliability:98,frequency:"Daily"},
{id:"ecdc",name:"ECDC",category:"Health & Humanitarian",region:"Europe",tier:"free",status:"LIVE",reliability:97,frequency:"Daily",description:"European Centre for Disease Prevention"},
{id:"promed",name:"ProMED",category:"Health & Humanitarian",region:"Global",tier:"free",status:"LIVE",reliability:90,frequency:"Daily",description:"Program for monitoring emerging diseases"},
{id:"unicef",name:"UNICEF",category:"Health & Humanitarian",region:"Global",tier:"free",status:"LIVE",reliability:96,frequency:"Daily"},
{id:"wfp",name:"WFP",category:"Health & Humanitarian",region:"Global",tier:"free",status:"LIVE",reliability:95,frequency:"Daily"},
{id:"faogiews",name:"FAO GIEWS",category:"Health & Humanitarian",region:"Global",tier:"free",status:"LIVE",reliability:93,frequency:"Daily",description:"Global food security and agriculture early warning"},
{id:"unhcr",name:"UNHCR",category:"Health & Humanitarian",region:"Global",tier:"free",status:"LIVE",reliability:95,frequency:"Daily"},
// SPACE & WEATHER
{id:"nasa",name:"NASA",category:"Space & Weather",region:"Global",tier:"free",status:"LIVE",reliability:99,frequency:"Daily"},
{id:"esa",name:"ESA",category:"Space & Weather",region:"Global",tier:"free",status:"LIVE",reliability:98,frequency:"Daily"},
{id:"noaaspace",name:"NOAA Space Weather",category:"Space & Weather",region:"Global",tier:"free",status:"LIVE",reliability:97,frequency:"Real-time",description:"Solar flares geomagnetic storms and space weather"},
{id:"spaceweather",name:"Spaceweather.com",category:"Space & Weather",region:"Global",tier:"free",status:"LIVE",reliability:88,frequency:"Daily"},
{id:"spacenews",name:"SpaceNews",category:"Space & Weather",region:"Global",tier:"free",status:"LIVE",reliability:87,frequency:"Daily"},
{id:"windycom",name:"Windy.com",category:"Space & Weather",region:"Global",tier:"free",status:"LIVE",reliability:91,frequency:"Real-time",description:"Global weather and wind pattern visualization"},
// GOVERNMENT & OFFICIAL
{id:"unsc",name:"UN Security Council",category:"Government & Official",type:"official",region:"Global",tier:"free",status:"LIVE",reliability:99,frequency:"As needed"},
{id:"unnews",name:"UN News",category:"Government & Official",type:"official",region:"Global",tier:"free",status:"LIVE",reliability:97,frequency:"Daily"},
{id:"nato",name:"NATO",category:"Government & Official",type:"official",region:"Global",tier:"free",status:"LIVE",reliability:97,frequency:"As needed"},
{id:"iaea",name:"IAEA",category:"Government & Official",type:"official",region:"Global",tier:"free",status:"LIVE",reliability:98,frequency:"As needed"},
{id:"opcw",name:"OPCW",category:"Government & Official",type:"official",region:"Global",tier:"free",status:"LIVE",reliability:97,frequency:"As needed"},
{id:"imo",name:"IMO",category:"Government & Official",type:"official",region:"Global",tier:"free",status:"LIVE",reliability:96,frequency:"As needed"},
{id:"icao",name:"ICAO",category:"Government & Official",type:"official",region:"Global",tier:"free",status:"LIVE",reliability:97,frequency:"As needed"},
{id:"wto",name:"WTO",category:"Government & Official",type:"official",region:"Global",tier:"free",status:"LIVE",reliability:96,frequency:"As needed"},
{id:"eueeas",name:"EU External Action",category:"Government & Official",type:"official",region:"Europe",tier:"free",status:"LIVE",reliability:95,frequency:"Daily"},
{id:"whitehouse",name:"White House",category:"Government & Official",type:"official",region:"USA",tier:"free",status:"LIVE",reliability:97,frequency:"Daily",twitter:"@WhiteHouse"},
{id:"statedept",name:"US State Department",category:"Government & Official",type:"official",region:"USA",tier:"free",status:"LIVE",reliability:97,frequency:"Daily",twitter:"@StateDept"},
{id:"pentagon",name:"Pentagon",category:"Government & Official",type:"official",region:"USA",tier:"free",status:"LIVE",reliability:96,frequency:"Daily",twitter:"@DeptofDefense"},
{id:"centcom",name:"CENTCOM",category:"Government & Official",type:"official",region:"USA",tier:"free",status:"LIVE",reliability:95,frequency:"Daily",twitter:"@CENTCOM",description:"US Central Command — Middle East operations"},
{id:"us5thfleet",name:"US 5th Fleet",category:"Government & Official",type:"official",region:"Middle East",tier:"free",status:"LIVE",reliability:94,frequency:"Daily",twitter:"@US5thFleet",description:"Gulf naval command from Bahrain"},
{id:"ukfco",name:"UK Foreign Office",category:"Government & Official",type:"official",region:"UK",tier:"free",status:"LIVE",reliability:95,frequency:"Daily",twitter:"@FCDOGovUK"},
{id:"ukmod",name:"UK MOD",category:"Government & Official",type:"official",region:"UK",tier:"free",status:"LIVE",reliability:95,frequency:"Daily",twitter:"@DefenceHQ"},
{id:"ksamoto",name:"Saudi MFA",category:"Government & Official",type:"official",region:"Saudi Arabia",tier:"free",status:"LIVE",reliability:90,frequency:"Daily",twitter:"@KSAmofaEN"},
{id:"spa",name:"Saudi Press Agency",category:"Government & Official",type:"official",region:"Saudi Arabia",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time",twitter:"@SPAEnglish"},
{id:"uaemfa",name:"UAE MFA",category:"Government & Official",type:"official",region:"UAE",tier:"free",status:"LIVE",reliability:90,frequency:"Daily",twitter:"@mofauae"},
{id:"wam",name:"WAM UAE News Agency",category:"Government & Official",type:"official",region:"UAE",tier:"free",status:"LIVE",reliability:88,frequency:"Real-time",twitter:"@wamnews"},
{id:"kuwaitmofa",name:"Kuwait MFA",category:"Government & Official",type:"official",region:"Kuwait",tier:"free",status:"LIVE",reliability:88,frequency:"Daily",twitter:"@MOFAKuwait"},
{id:"kuna",name:"Kuwait News Agency KUNA",category:"Government & Official",type:"official",region:"Kuwait",tier:"free",status:"LIVE",reliability:87,frequency:"Real-time",twitter:"@KUNA_ENGLISH"},
{id:"qatarmofa",name:"Qatar MFA",category:"Government & Official",type:"official",region:"Qatar",tier:"free",status:"LIVE",reliability:88,frequency:"Daily",twitter:"@MofaQatar_EN"},
{id:"qna",name:"Qatar News Agency QNA",category:"Government & Official",type:"official",region:"Qatar",tier:"free",status:"LIVE",reliability:87,frequency:"Real-time",twitter:"@QNAEnglish"},
{id:"bahrainmofa",name:"Bahrain MFA",category:"Government & Official",type:"official",region:"Bahrain",tier:"free",status:"LIVE",reliability:87,frequency:"Daily",twitter:"@MofaBahrain"},
{id:"bna",name:"Bahrain News Agency BNA",category:"Government & Official",type:"official",region:"Bahrain",tier:"free",status:"LIVE",reliability:85,frequency:"Real-time",twitter:"@BNA_English"},
{id:"omanmofa",name:"Oman MFA",category:"Government & Official",type:"official",region:"Oman",tier:"free",status:"LIVE",reliability:87,frequency:"Daily",twitter:"@OmanMFA"},
{id:"ona",name:"Oman News Agency ONA",category:"Government & Official",type:"official",region:"Oman",tier:"free",status:"LIVE",reliability:85,frequency:"Real-time",twitter:"@ONA_En"},
{id:"kremlin",name:"Kremlin English",category:"Government & Official",type:"official",region:"Russia",tier:"free",status:"LIVE",reliability:65,frequency:"Daily",twitter:"@KremlinRussia_E",note:"State source — verify"},
{id:"mfachina",name:"MFA China",category:"Government & Official",type:"official",region:"China",tier:"free",status:"LIVE",reliability:68,frequency:"Daily",twitter:"@MFA_China",note:"State source — verify"},
// DEFENSE & MILITARY
{id:"iaeadef",name:"IAEA Nuclear Monitor",category:"Defense & Military",region:"Global",tier:"free",status:"LIVE",reliability:97,frequency:"As needed"},
{id:"globalfirepower",name:"Global Firepower",category:"Defense & Military",region:"Global",tier:"free",status:"LIVE",reliability:85,frequency:"Daily"},
{id:"sipri",name:"SIPRI",category:"Defense & Military",region:"Global",tier:"free",status:"LIVE",reliability:95,frequency:"Daily",description:"Arms transfers and military expenditure data"},
{id:"ukmodintel",name:"UK MOD Intelligence",category:"Defense & Military",region:"Global",tier:"free",status:"LIVE",reliability:93,frequency:"Daily",description:"Daily Ukraine and global defense updates"},
{id:"idf",name:"IDF Updates",category:"Defense & Military",type:"official",region:"Middle East",tier:"free",status:"LIVE",reliability:85,frequency:"Real-time",twitter:"@IDF"},
{id:"janesdef",name:"Janes Defence",category:"Defense & Military",region:"Global",tier:"premium",status:"PREMIUM",reliability:95},
// SOCIAL MEDIA & LIVE
{id:"unsg",name:"@antonioguterres",category:"Social Media & Live",type:"social",platform:"X",region:"Global",tier:"free",status:"LIVE",reliability:95,description:"UN Secretary-General"},
{id:"whotwitter",name:"@WHO",category:"Social Media & Live",type:"social",platform:"X",region:"Global",tier:"free",status:"LIVE",reliability:95},
{id:"natotwitter",name:"@NATO",category:"Social Media & Live",type:"social",platform:"X",region:"Global",tier:"free",status:"LIVE",reliability:95},
{id:"iaeaTwitter",name:"@iaeaorg",category:"Social Media & Live",type:"social",platform:"X",region:"Global",tier:"free",status:"LIVE",reliability:96},
{id:"mbs",name:"@MohamedBinSalman",category:"Social Media & Live",type:"social",platform:"X",region:"Saudi Arabia",tier:"free",status:"LIVE",reliability:90,description:"Saudi Crown Prince"},
{id:"mbz",name:"@MohamedBinZayed",category:"Social Media & Live",type:"social",platform:"X",region:"UAE",tier:"free",status:"LIVE",reliability:90,description:"UAE President"},
{id:"hhshkmohd",name:"@HHShkMohd",category:"Social Media & Live",type:"social",platform:"X",region:"UAE",tier:"free",status:"LIVE",reliability:88,description:"Dubai Ruler and UAE PM"},
{id:"tamim",name:"@TamimBinHamad",category:"Social Media & Live",type:"social",platform:"X",region:"Qatar",tier:"free",status:"LIVE",reliability:88,description:"Emir of Qatar"},
{id:"aramcotwitter",name:"@Saudi_Aramco",category:"Social Media & Live",type:"social",platform:"X",region:"Saudi Arabia",tier:"free",status:"LIVE",reliability:87},
{id:"piftwitter",name:"@PIFSaudi",category:"Social Media & Live",type:"social",platform:"X",region:"Saudi Arabia",tier:"free",status:"LIVE",reliability:87,description:"Saudi Sovereign Fund"},
{id:"qatarenergytwitter",name:"@QatarEnergy",category:"Social Media & Live",type:"social",platform:"X",region:"Qatar",tier:"free",status:"LIVE",reliability:88},
{id:"adnoctwitter",name:"@adnoc",category:"Social Media & Live",type:"social",platform:"X",region:"UAE",tier:"free",status:"LIVE",reliability:87},
{id:"centcomtwitter",name:"@CENTCOM",category:"Social Media & Live",type:"social",platform:"X",region:"Middle East",tier:"free",status:"LIVE",reliability:93,description:"US Central Command"},
{id:"us5thfleettwitter",name:"@US5thFleet",category:"Social Media & Live",type:"social",platform:"X",region:"Middle East",tier:"free",status:"LIVE",reliability:92,description:"Gulf naval command"},
{id:"idftwitter",name:"@IDF",category:"Social Media & Live",type:"social",platform:"X",region:"Middle East",tier:"free",status:"LIVE",reliability:85,description:"Israel Defense Forces"},
{id:"mfarussia",name:"@mfa_russia",category:"Social Media & Live",type:"social",platform:"X",region:"Russia",tier:"free",status:"LIVE",reliability:60,note:"State source — verify"},
{id:"kremlintwitter",name:"@KremlinRussia_E",category:"Social Media & Live",type:"social",platform:"X",region:"Russia",tier:"free",status:"LIVE",reliability:58,note:"State source — verify"},
{id:"osintdef",name:"@OSINTdefender",category:"Social Media & Live",type:"social",platform:"X",region:"Global",tier:"free",status:"LIVE",reliability:82,description:"OSINT conflict verification"},
{id:"ukraineweapons",name:"Ukraine Weapons Tracker",category:"Social Media & Live",type:"social",platform:"Telegram",region:"Europe",tier:"free",status:"LIVE",reliability:75,description:"Military equipment tracking"},
{id:"middleeastobserver",name:"Middle East Observer",category:"Social Media & Live",type:"social",platform:"Telegram",region:"Middle East",tier:"free",status:"LIVE",reliability:70},
// LIVE WEBCAMS
{id:"fujairahcam",name:"Fujairah Port Cam",category:"Live Webcams",type:"webcam",region:"UAE",tier:"free",status:"LIVE",reliability:80,description:"Key oil terminal outside Hormuz"},
{id:"dubaiportcam",name:"Dubai Jebel Ali Port",category:"Live Webcams",type:"webcam",region:"UAE",tier:"free",status:"LIVE",reliability:80,description:"World's 9th largest port live feed"},
{id:"suezcanal",name:"Suez Canal Live",category:"Live Webcams",type:"webcam",region:"Egypt",tier:"free",status:"LIVE",reliability:78,description:"Live Suez Canal vessel traffic"},
{id:"bosphorus",name:"Bosphorus Strait",category:"Live Webcams",type:"webcam",region:"Turkey",tier:"free",status:"LIVE",reliability:82,description:"Live Turkish Straits vessel monitoring"},
{id:"singaporeport",name:"Singapore Port",category:"Live Webcams",type:"webcam",region:"Asia",tier:"free",status:"LIVE",reliability:80,description:"World's 2nd busiest port"},
{id:"riyadhcam",name:"Riyadh City Cam",category:"Live Webcams",type:"webcam",region:"Saudi Arabia",tier:"free",status:"LIVE",reliability:75},
{id:"dubaicam",name:"Dubai Skyline Cam",category:"Live Webcams",type:"webcam",region:"UAE",tier:"free",status:"LIVE",reliability:78},
{id:"kuwaitcam",name:"Kuwait City Cam",category:"Live Webcams",type:"webcam",region:"Kuwait",tier:"free",status:"LIVE",reliability:75},
{id:"beirutcam",name:"Beirut Port Cam",category:"Live Webcams",type:"webcam",region:"Lebanon",tier:"free",status:"LIVE",reliability:70},
{id:"earthcam",name:"Earthcam Network",category:"Live Webcams",type:"webcam",region:"Global",tier:"free",status:"LIVE",reliability:85,description:"500+ live webcams globally"},
{id:"windycams",name:"Windy Webcams",category:"Live Webcams",type:"webcam",region:"Global",tier:"free",status:"LIVE",reliability:83,description:"Thousands of weather webcams globally"},
];

// ─── Feed Items ─────────────────────────────────────────────────

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
  { id: "n1", source: "Reuters", sourceId: "reuters", category: "News & Media", headline: "Iran warns of 'decisive response' to new US sanctions package", headline_ar: "إيران تحذر من 'رد حاسم' على حزمة العقوبات الأمريكية الجديدة", url: "reuters.com", timestamp: mins(12) },
  { id: "n2", source: "BBC World", sourceId: "bbc", category: "News & Media", headline: "Saudi Arabia announces $50bn green hydrogen investment plan", headline_ar: "السعودية تعلن خطة استثمارية بـ50 مليار دولار للهيدروجين الأخضر", url: "bbc.co.uk", timestamp: mins(28) },
  { id: "n3", source: "Al Jazeera", sourceId: "aljazeera", category: "News & Media", headline: "Red Sea shipping reroutes cost global trade $12bn in Q1", headline_ar: "تحويلات مسار الشحن في البحر الأحمر تكلف التجارة العالمية 12 مليار دولار", url: "aljazeera.com", timestamp: mins(45) },
  { id: "n4", source: "AFP", sourceId: "afp", category: "News & Media", headline: "Qatar mediates new round of hostage negotiations", headline_ar: "قطر تتوسط في جولة جديدة من مفاوضات الرهائن", url: "afp.com", timestamp: hrs(1.2) },
  { id: "n5", source: "AP News", sourceId: "ap", category: "News & Media", headline: "UAE signs defense cooperation pact with South Korea", headline_ar: "الإمارات توقع اتفاقية تعاون دفاعي مع كوريا الجنوبية", url: "apnews.com", timestamp: hrs(1.5) },
  { id: "n6", source: "Al Arabiya", sourceId: "alarabiya", category: "News & Media", headline: "OPEC+ ministers to meet this week on production quotas", headline_ar: "وزراء أوبك+ يجتمعون هذا الأسبوع لبحث حصص الإنتاج", url: "alarabiya.net", timestamp: hrs(2) },
  { id: "n7", source: "CNBC", sourceId: "cnbc", category: "News & Media", headline: "Brent crude rises above $82 amid supply concerns", headline_ar: "خام برنت يرتفع فوق 82 دولاراً وسط مخاوف بشأن الإمدادات", url: "cnbc.com", timestamp: hrs(2.5) },
  { id: "n8", source: "The National", sourceId: "thenational", category: "News & Media", headline: "Abu Dhabi sovereign fund increases Asia tech allocation by 30%", headline_ar: "صندوق أبوظبي السيادي يزيد مخصصات التكنولوجيا الآسيوية بنسبة 30%", url: "thenationalnews.com", timestamp: hrs(3) },
  { id: "n9", source: "CNN World", sourceId: "cnn", category: "News & Media", headline: "Pentagon confirms additional naval deployment to Gulf region", headline_ar: "البنتاغون يؤكد نشر بحري إضافي في منطقة الخليج", url: "cnn.com", timestamp: hrs(3.5) },
  { id: "n10", source: "Middle East Eye", sourceId: "mee", category: "News & Media", headline: "Iraq parliament debates new oil revenue sharing law", headline_ar: "البرلمان العراقي يناقش قانون جديد لتقاسم عائدات النفط", url: "middleeasteye.net", timestamp: hrs(4) },

  // ── Conflict & Security ──
  { id: "c1", source: "GDELT Project", sourceId: "gdelt", category: "Conflict & Security", headline: "Conflict tone index drops 14% across Levant region in 48 hours", headline_ar: "مؤشر حدة النزاع ينخفض 14% في منطقة الشام خلال 48 ساعة", url: "gdeltproject.org", timestamp: mins(18) },
  { id: "c2", source: "ACLED", sourceId: "acled", category: "Conflict & Security", headline: "CrisisWatch Alert: Houthi escalation in Red Sea reaches new phase", headline_ar: "تنبيه CrisisWatch: تصعيد الحوثيين في البحر الأحمر يدخل مرحلة جديدة", url: "acleddata.com", timestamp: hrs(1) },
  { id: "c3", source: "Bellingcat", sourceId: "bellingcat", category: "Conflict & Security", headline: "AI Analysis: 73% probability of follow-on strikes within 72h window", headline_ar: "تحليل AI: احتمال 73% لضربات متتابعة خلال نافذة 72 ساعة", url: "bellingcat.com", timestamp: mins(35) },
  { id: "c4", source: "GDELT Project", sourceId: "gdelt", category: "Conflict & Security", headline: "Media attention on Iran nuclear program surges 340% this week", headline_ar: "اهتمام إعلامي بالبرنامج النووي الإيراني يقفز 340% هذا الأسبوع", url: "gdeltproject.org", timestamp: hrs(2) },
  { id: "c5", source: "Defense News", sourceId: "defensenews", category: "Conflict & Security", headline: "Global Peace Index: MENA instability score worsens by 8 points", headline_ar: "مؤشر السلام العالمي: تدهور استقرار الشرق الأوسط بـ8 نقاط", url: "defensenews.com", timestamp: hrs(4) },
  { id: "c6", source: "USNI News", sourceId: "usni", category: "Conflict & Security", headline: "Arms imports to Gulf states increased 23% YoY — SIPRI report", headline_ar: "واردات الأسلحة لدول الخليج ترتفع 23% سنوياً — تقرير SIPRI", url: "news.usni.org", timestamp: hrs(8) },
  { id: "c7", source: "Oryx OSINT", sourceId: "oryx", category: "Conflict & Security", headline: "Consequence chain: Red Sea disruption → Suez Canal revenues ↓18% → Egypt fiscal pressure", headline_ar: "سلسلة التداعيات: اضطراب البحر الأحمر → إيرادات قناة السويس ↓18% → ضغوط مالية على مصر", url: "oryxspioenkop.com", timestamp: hrs(1.5) },

  // ── Energy & Commodities ──
  { id: "e1", source: "EIA Energy Data", sourceId: "eia", category: "Energy & Commodities", headline: "US crude inventories fell 4.2M barrels — larger than expected", headline_ar: "مخزونات النفط الأمريكية تنخفض 4.2 مليون برميل — أكبر من المتوقع", url: "eia.gov", timestamp: mins(28) },
  { id: "e2", source: "OilPrice.com", sourceId: "oilprice", category: "Energy & Commodities", headline: "Saudi Aramco cuts April OSP for Asian buyers by $0.50/bbl", headline_ar: "أرامكو السعودية تخفض سعر البيع الرسمي لآسيا بـ0.50 دولار للبرميل", url: "oilprice.com", timestamp: hrs(1) },
  { id: "e3", source: "EIA Energy Data", sourceId: "eia", category: "Energy & Commodities", headline: "Natural gas spot prices spike 12% on cold weather forecast", headline_ar: "أسعار الغاز الطبيعي ترتفع 12% بسبب توقعات الطقس البارد", url: "eia.gov", timestamp: hrs(2) },
  { id: "e4", source: "OPEC", sourceId: "opec", category: "Energy & Commodities", headline: "OPEC production compliance at 102% — voluntary cuts holding", headline_ar: "التزام أوبك بالإنتاج عند 102% — التخفيضات الطوعية مستمرة", url: "opec.org", timestamp: hrs(6) },
  { id: "e5", source: "OilPrice.com", sourceId: "oilprice", category: "Energy & Commodities", headline: "Kuwait announces discovery of new light crude field in northern region", headline_ar: "الكويت تعلن اكتشاف حقل نفط خفيف جديد في المنطقة الشمالية", url: "oilprice.com", timestamp: hrs(8) },
  { id: "e6", source: "IEA", sourceId: "iea", category: "Energy & Commodities", headline: "Global oil demand reaches 103.5 mb/d — new record", headline_ar: "الطلب العالمي على النفط يصل 103.5 مليون برميل يومياً — رقم قياسي", url: "iea.org", timestamp: hrs(12) },

  // ── Maritime & Shipping ──
  { id: "m1", source: "MarineTraffic AIS", sourceId: "marinetraffic", category: "Maritime & Shipping", headline: "Threat level raised to HIGH for Bab el-Mandeb transit", headline_ar: "رفع مستوى التهديد إلى مرتفع لعبور باب المندب", url: "marinetraffic.com", timestamp: mins(42) },
  { id: "m2", source: "gCaptain", sourceId: "gcaptain", category: "Maritime & Shipping", headline: "UKMTO advisory: Unidentified drone activity reported near Strait of Hormuz", headline_ar: "تحذير UKMTO: رصد نشاط طائرات مسيّرة مجهولة قرب مضيق هرمز", url: "gcaptain.com", timestamp: hrs(3) },
  { id: "m3", source: "VesselFinder", sourceId: "vesselfinder", category: "Maritime & Shipping", headline: "12 tankers rerouting via Cape of Good Hope — up from 3 last month", headline_ar: "12 ناقلة تغير مسارها عبر رأس الرجاء الصالح — ارتفاع من 3 الشهر الماضي", url: "vesselfinder.com", timestamp: hrs(1.5) },
  { id: "m4", source: "BIMCO", sourceId: "bimco", category: "Maritime & Shipping", headline: "IMB reports 2 attempted boardings in Gulf of Aden this week", headline_ar: "IMB تبلغ عن محاولتي صعود على متن سفن في خليج عدن هذا الأسبوع", url: "bimco.org", timestamp: hrs(6) },
  { id: "m5", source: "PortWatch IMF", sourceId: "portwatch", category: "Maritime & Shipping", headline: "Insurance premiums for Red Sea transit up 300% since January", headline_ar: "أقساط التأمين لعبور البحر الأحمر ترتفع 300% منذ يناير", url: "portwatch.imf.org", timestamp: hrs(10) },

  // ── Aviation ──
  { id: "a1", source: "OpenSky Network", sourceId: "opensky", category: "Aviation", headline: "Anomalous military transponder activity detected over eastern Syria", headline_ar: "رصد نشاط عسكري غير اعتيادي للمستجيبات فوق شرق سوريا", url: "opensky-network.org", timestamp: hrs(1) },
  { id: "a2", source: "NOTAM System", sourceId: "notam", category: "Aviation", headline: "NOTAM issued: Tehran FIR airspace restrictions extended 48 hours", headline_ar: "إشعار صدر: تمديد قيود المجال الجوي لطهران 48 ساعة", url: "notam.faa.gov", timestamp: hrs(4) },
  { id: "a3", source: "OpenSky Network", sourceId: "opensky", category: "Aviation", headline: "Commercial flight diversions around Iraq up 15% this month", headline_ar: "تحويلات الرحلات التجارية حول العراق ترتفع 15% هذا الشهر", url: "opensky-network.org", timestamp: hrs(8) },

  // ── Satellite & Imagery ──
  { id: "s1", source: "NASA FIRMS", sourceId: "nasafirms", category: "Satellite & Imagery", headline: "Thermal anomaly detected near Kharg Island oil terminal — Iran", headline_ar: "رصد شذوذ حراري قرب محطة نفط جزيرة خارك — إيران", url: "firms.modaps.eosdis.nasa.gov", timestamp: hrs(2) },
  { id: "s2", source: "NASA EONET", sourceId: "nasaeonet", category: "Satellite & Imagery", headline: "Dust storm tracking: Large plume moving from Iraq toward Kuwait/Saudi", headline_ar: "تتبع عاصفة رملية: سحابة كبيرة تتحرك من العراق نحو الكويت/السعودية", url: "eonet.gsfc.nasa.gov", timestamp: hrs(5) },
  { id: "s3", source: "NASA FIRMS", sourceId: "nasafirms", category: "Satellite & Imagery", headline: "Wildfire cluster detected in southeastern Turkey — 3 hotspots", headline_ar: "رصد تجمع حرائق في جنوب شرق تركيا — 3 بؤر ساخنة", url: "firms.modaps.eosdis.nasa.gov", timestamp: hrs(8) },

  // ── Seismic & Disasters ──
  { id: "q1", source: "USGS Earthquakes", sourceId: "usgs", category: "Seismic & Disasters", headline: "M4.2 earthquake detected 47km NE of Bushehr, Iran — near nuclear facility", headline_ar: "زلزال بقوة 4.2 على بعد 47 كم شمال شرق بوشهر — قرب المنشأة النووية", url: "earthquake.usgs.gov", timestamp: mins(55) },
  { id: "q2", source: "EMSC", sourceId: "emsc", category: "Seismic & Disasters", headline: "Seismic swarm: 6 events M2.5+ near Dead Sea Transform in 12 hours", headline_ar: "نشاط زلزالي: 6 أحداث بقوة 2.5+ قرب صدع البحر الميت خلال 12 ساعة", url: "emsc-csem.org", timestamp: hrs(2) },
  { id: "q3", source: "GDACS", sourceId: "gdacs", category: "Seismic & Disasters", headline: "GDACS Green Alert: M5.1 earthquake in Hindu Kush, Afghanistan", headline_ar: "تنبيه أخضر GDACS: زلزال 5.1 في هندوكوش، أفغانستان", url: "gdacs.org", timestamp: hrs(6) },
  { id: "q4", source: "USGS Earthquakes", sourceId: "usgs", category: "Seismic & Disasters", headline: "No tsunami threat: M6.0 Pacific event — standard monitoring continues", headline_ar: "لا خطر تسونامي: حدث بقوة 6.0 في المحيط الهادئ — المراقبة مستمرة", url: "earthquake.usgs.gov", timestamp: hrs(12) },

  // ── Cyber & Digital ──
  { id: "y1", source: "CISA Alerts", sourceId: "cisa", category: "Cyber & Digital", headline: "CISA advisory: Critical vulnerability in industrial control systems — CVE-2026-1847", headline_ar: "تحذير CISA: ثغرة حرجة في أنظمة التحكم الصناعي — CVE-2026-1847", url: "us-cert.cisa.gov", timestamp: hrs(2) },
  { id: "y2", source: "NetBlocks", sourceId: "netblocks", category: "Cyber & Digital", headline: "Internet connectivity in western Iran dropped 40% — investigating cause", headline_ar: "انخفاض الاتصال بالإنترنت في غرب إيران 40% — جارٍ التحقيق", url: "netblocks.org", timestamp: hrs(4) },
  { id: "y3", source: "CISA Alerts", sourceId: "cisa", category: "Cyber & Digital", headline: "Joint advisory: APT group targeting GCC energy sector SCADA systems", headline_ar: "تحذير مشترك: مجموعة APT تستهدف أنظمة SCADA في قطاع الطاقة الخليجي", url: "us-cert.cisa.gov", timestamp: hrs(8) },

  // ── Financial & Markets ──
  { id: "f1", source: "Gulf Exchange Data", sourceId: "gulfexchanges", category: "Financial & Markets", headline: "Brent front-month up $1.40 to $82.60 — backwardation steepening", headline_ar: "عقود برنت الآجلة ترتفع 1.40$ إلى 82.60$ — تعمق التراجع الزمني", url: "theice.com", timestamp: mins(15) },
  { id: "f2", source: "Yahoo Finance", sourceId: "yahoofinance", category: "Financial & Markets", headline: "WTI options volume surges 45% — unusual call activity at $85 strike", headline_ar: "حجم خيارات WTI يرتفع 45% — نشاط غير اعتيادي لعقود الشراء عند 85$", url: "finance.yahoo.com", timestamp: hrs(1) },
  { id: "f3", source: "Gulf Exchange Data", sourceId: "gulfexchanges", category: "Financial & Markets", headline: "Tadawul up 1.2% led by Aramco — foreign inflows accelerate", headline_ar: "تداول يرتفع 1.2% بقيادة أرامكو — تسارع التدفقات الأجنبية", url: "gulfexchanges.com", timestamp: hrs(3) },
  { id: "f4", source: "MarketWatch", sourceId: "marketwatch", category: "Financial & Markets", headline: "Sovereign CDS spreads for Iraq widen 15bp on security concerns", headline_ar: "هوامش عقود التأمين السيادية للعراق تتسع 15 نقطة أساس", url: "marketwatch.com", timestamp: hrs(5) },

  // ── Health & Humanitarian ──
  { id: "h1", source: "WHO Disease Alerts", sourceId: "who", category: "Health & Humanitarian", headline: "WHO monitoring: Respiratory illness cluster reported in southern Iraq", headline_ar: "مراقبة WHO: تجمع أمراض تنفسية في جنوب العراق", url: "who.int", timestamp: hrs(6) },
  { id: "h2", source: "UNHCR", sourceId: "unhcr", category: "Health & Humanitarian", headline: "Yemen humanitarian update: 4.5M people in acute food insecurity", headline_ar: "تحديث إنساني لليمن: 4.5 مليون شخص يعانون من انعدام أمن غذائي حاد", url: "unhcr.org", timestamp: hrs(3) },
  { id: "h3", source: "UNICEF", sourceId: "unicef", category: "Health & Humanitarian", headline: "UNICEF: Gaza water infrastructure operating at 12% capacity", headline_ar: "يونيسف: البنية التحتية للمياه في غزة تعمل بـ12% من طاقتها", url: "unicef.org", timestamp: hrs(8) },

  // ── Space & Weather ──
  { id: "sp1", source: "NASA", sourceId: "nasa", category: "Space & Weather", headline: "Satellite imagery shows construction activity at Iranian missile site", headline_ar: "صور الأقمار الصناعية تظهر أعمال بناء في موقع صاروخي إيراني", url: "nasa.gov", timestamp: hrs(4) },
  { id: "sp2", source: "NOAA Space Weather", sourceId: "noaaspace", category: "Space & Weather", headline: "Geomagnetic storm watch: G2 conditions expected next 48 hours", headline_ar: "مراقبة عاصفة مغناطيسية: توقع ظروف G2 خلال 48 ساعة القادمة", url: "swpc.noaa.gov", timestamp: hrs(12) },

  // ── Government & Official ──
  { id: "g1", source: "US State Department", sourceId: "statedept", category: "Government & Official", headline: "US State Department raises travel advisory for Lebanon to Level 4", headline_ar: "الخارجية الأمريكية ترفع تحذير السفر للبنان إلى المستوى الرابع", url: "travel.state.gov", timestamp: hrs(6) },
  { id: "g2", source: "UN Security Council", sourceId: "unsc", category: "Government & Official", headline: "UNSC Resolution 2740: Extended arms embargo on Houthi forces", headline_ar: "قرار مجلس الأمن 2740: تمديد حظر الأسلحة على الحوثيين", url: "un.org", timestamp: hrs(10) },
  { id: "g3", source: "EU External Action", sourceId: "eueeas", category: "Government & Official", headline: "EU announces new sanctions package targeting Iranian drone components", headline_ar: "الاتحاد الأوروبي يعلن حزمة عقوبات جديدة تستهدف مكونات المسيّرات الإيرانية", url: "eeas.europa.eu", timestamp: hrs(14) },

  // ── Defense & Military ──
  { id: "d1", source: "Global Firepower", sourceId: "globalfirepower", category: "Defense & Military", headline: "Saudi Arabia rises to #22 in Global Firepower Index — 3rd in MENA", headline_ar: "السعودية ترتفع إلى المركز 22 في مؤشر القوة النارية — الثالثة في الشرق الأوسط", url: "globalfirepower.com", timestamp: hrs(24) },
  { id: "d2", source: "SIPRI", sourceId: "sipri", category: "Defense & Military", headline: "UAE defense procurement: $3.2B in new contracts signed Q1 2026", headline_ar: "مشتريات الإمارات الدفاعية: توقيع عقود بقيمة 3.2 مليار دولار في الربع الأول 2026", url: "sipri.org", timestamp: hrs(48) },
  { id: "d3", source: "Global Firepower", sourceId: "globalfirepower", category: "Defense & Military", headline: "Iran missile arsenal assessment: 3,000+ ballistic missiles in inventory", headline_ar: "تقييم الترسانة الصاروخية الإيرانية: أكثر من 3,000 صاروخ بالستي", url: "globalfirepower.com", timestamp: hrs(72) },
];

// ─── Baselines and Anomaly Data ────────────────────────────────

export const CATEGORY_BASELINES: Record<string, number> = {
  "News & Media": 35, "Think Tanks & Analysis": 5, "Conflict & Security": 8, "Energy & Commodities": 6,
  "Maritime & Shipping": 4, "Aviation": 3, "Satellite & Imagery": 2, "Seismic & Disasters": 5,
  "Cyber & Digital": 4, "Financial & Markets": 5, "Health & Humanitarian": 2, "Space & Weather": 1,
  "Government & Official": 3, "Defense & Military": 2, "Social Media & Live": 10, "Live Webcams": 1,
};

export const STATIC_ANOMALIES: Record<string, { en: string; ar: string }> = {
  "News & Media": {
    en: "74 items in last hour — 2.1x normal volume. Reuters, BBC, Al Jazeera all publishing simultaneously on Iran sanctions story. Volume spike started 43 minutes ago.",
    ar: "74 عنصراً في الساعة الأخيرة — 2.1 ضعف الحجم الطبيعي. رويترز وبي بي سي والجزيرة تنشر في وقت واحد عن قصة العقوبات الإيرانية. بدأ ارتفاع الحجم منذ 43 دقيقة.",
  },
  "Think Tanks & Analysis": {
    en: "Normal volume. 4 analysis pieces published today. Carnegie and Brookings both released MENA assessments. No unusual clustering detected.",
    ar: "حجم طبيعي. 4 تحليلات نُشرت اليوم. كارنيغي وبروكينغز أصدرا تقييمات للشرق الأوسط. لا تجمع غير عادي.",
  },
  "Conflict & Security": {
    en: "Quiet period. 3 items in last hour, 0.4x normal. Last significant event: Houthi drone intercept 2h ago. GDELT conflict index stable.",
    ar: "فترة هدوء. 3 عناصر في الساعة الأخيرة، 0.4 ضعف الطبيعي. آخر حدث مهم: اعتراض طائرة حوثية مسيّرة منذ ساعتين. مؤشر GDELT للنزاعات مستقر.",
  },
  "Energy & Commodities": {
    en: "EIA weekly data dropped 28 minutes ago — triggering spike to 8 items in 10 minutes. Brent price moved +1.8% simultaneously. Watch for follow-on analysis next 30 min.",
    ar: "بيانات EIA الأسبوعية صدرت منذ 28 دقيقة — أثارت ارتفاعاً إلى 8 عناصر في 10 دقائق. سعر برنت تحرك +1.8% في نفس الوقت. راقب التحليلات التابعة خلال 30 دقيقة.",
  },
  "Maritime & Shipping": {
    en: "AIS data showing 3 vessels rerouting away from Red Sea in last 6 hours. MarineTraffic volume up 40%. Consistent with Houthi threat escalation pattern.",
    ar: "بيانات AIS تظهر تحويل 3 سفن بعيداً عن البحر الأحمر في آخر 6 ساعات. حجم MarineTraffic ارتفع 40%. متسق مع نمط تصعيد تهديدات الحوثيين.",
  },
  "Aviation": {
    en: "Normal volume. 3 items in last hour. NOTAM extensions over Tehran FIR noted. No anomalous military transponder activity in past 4 hours.",
    ar: "حجم طبيعي. 3 عناصر في الساعة الأخيرة. تمديد إشعارات فوق إقليم طهران. لا نشاط عسكري شاذ في المستجيبات خلال 4 ساعات.",
  },
  "Satellite & Imagery": {
    en: "NASA FIRMS flagged thermal anomaly near Kharg Island 2h ago. EONET tracking dust storm from Iraq. Standard observation volume.",
    ar: "NASA FIRMS رصد شذوذاً حرارياً قرب جزيرة خارك منذ ساعتين. EONET يتتبع عاصفة رملية من العراق. حجم مراقبة طبيعي.",
  },
  "Seismic & Disasters": {
    en: "USGS logged 4 events M3.0+ in last 24h. None in GCC region. One M4.2 near Bushehr Iran — flagged due to proximity to nuclear facility. Standard activity otherwise.",
    ar: "USGS سجل 4 أحداث بقوة 3.0+ في آخر 24 ساعة. لا شيء في منطقة الخليج. حدث بقوة 4.2 قرب بوشهر — مؤشر بسبب القرب من المنشأة النووية. نشاط طبيعي فيما عدا ذلك.",
  },
  "Cyber & Digital": {
    en: "CISA issued 2 advisories in last 4 hours — above average. Joint advisory on APT targeting GCC SCADA. NetBlocks showing 40% Iran connectivity drop.",
    ar: "CISA أصدرت تحذيرين في آخر 4 ساعات — فوق المعدل. تحذير مشترك عن APT يستهدف SCADA الخليجي. NetBlocks يظهر انخفاض 40% في اتصال إيران.",
  },
  "Financial & Markets": {
    en: "Normal volume. Markets open in London. Oil correlation with conflict events: strong (0.82). WTI options volume unusual — 45% above average at $85 strike.",
    ar: "حجم طبيعي. الأسواق مفتوحة في لندن. ارتباط النفط بأحداث النزاع: قوي (0.82). حجم خيارات WTI غير اعتيادي — 45% فوق المعدل عند سعر 85$.",
  },
  "Health & Humanitarian": {
    en: "Low volume. WHO monitoring respiratory cluster in southern Iraq. OCHA reports 4.5M in acute food insecurity in Yemen. No pandemic-level signals.",
    ar: "حجم منخفض. WHO تراقب تجمع أمراض تنفسية في جنوب العراق. OCHA تبلغ عن 4.5 مليون في انعدام أمن غذائي حاد باليمن. لا إشارات على مستوى وبائي.",
  },
  "Space & Weather": {
    en: "2 updates. Geomagnetic storm watch issued. Satellite construction monitoring at Iranian sites continues. Standard observation tempo.",
    ar: "تحديثان. صدر تحذير عاصفة مغناطيسية. مراقبة البناء بالأقمار الصناعية في المواقع الإيرانية مستمرة. إيقاع مراقبة طبيعي.",
  },
  "Government & Official": {
    en: "US State Dept raised Lebanon to Level 4. UNSC extended Houthi arms embargo. EU new sanctions on Iranian drone components. Standard diplomatic tempo.",
    ar: "الخارجية الأمريكية رفعت لبنان للمستوى 4. مجلس الأمن مدد حظر أسلحة الحوثيين. عقوبات أوروبية جديدة على مكونات المسيّرات الإيرانية. إيقاع دبلوماسي طبيعي.",
  },
  "Defense & Military": {
    en: "Low frequency category. Saudi Arabia rose to #22 in GFP Index. UAE signed $3.2B Q1 defense contracts. Iran arsenal assessment updated.",
    ar: "فئة منخفضة التكرار. السعودية ترتفع للمركز 22 في مؤشر GFP. الإمارات وقعت عقوداً دفاعية بـ3.2 مليار دولار. تقييم ترسانة إيران مُحدّث.",
  },
  "Social Media & Live": {
    en: "High volume. 45 posts tracked in last hour. @CENTCOM and @IDF both active. @OSINTdefender reporting on Red Sea developments. 2 Telegram channels flagged new content.",
    ar: "حجم مرتفع. 45 منشوراً تم تتبعه في الساعة الأخيرة. @CENTCOM و @IDF نشطان. @OSINTdefender يغطي تطورات البحر الأحمر. قناتا تيليغرام نشرتا محتوى جديد.",
  },
  "Live Webcams": {
    en: "All 11 webcam feeds operational. Fujairah Port and Suez Canal showing normal vessel traffic. Dubai Jebel Ali port activity elevated — 12% above daily average.",
    ar: "جميع البثات الـ11 للكاميرات تعمل. ميناء الفجيرة وقناة السويس تظهران حركة سفن طبيعية. نشاط ميناء جبل علي مرتفع — 12% فوق المعدل اليومي.",
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
