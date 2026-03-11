/**
 * Region/country definitions and map viewport targets
 * Shared by Sidebar (filtering) and EventMap (pan/zoom)
 */

export interface RegionGroup {
  key: string;
  label: string;
  labelAr: string;
  countries: CountryEntry[];
  /** Map center [lng, lat] when this group is selected */
  center: [number, number];
  zoom: number;
}

export interface CountryEntry {
  key: string;
  label: string;
  labelAr: string;
  /** Strings to match against event.country / event.region */
  matchTerms: string[];
  center: [number, number];
  zoom: number;
}

export const GLOBAL_VIEW = { center: [48, 25] as [number, number], zoom: 4 };

export const REGION_GROUPS: RegionGroup[] = [
  {
    key: "GCC",
    label: "GCC",
    labelAr: "دول التعاون",
    center: [50, 24],
    zoom: 5,
    countries: [
      { key: "KW", label: "Kuwait", labelAr: "الكويت", matchTerms: ["Kuwait"], center: [47.98, 29.37], zoom: 7 },
      { key: "SA", label: "Saudi Arabia", labelAr: "السعودية", matchTerms: ["Saudi Arabia", "Saudi"], center: [45.08, 23.88], zoom: 5.5 },
      { key: "AE", label: "UAE", labelAr: "الإمارات", matchTerms: ["United Arab Emirates", "UAE", "Dubai", "Abu Dhabi"], center: [54.37, 24.47], zoom: 7 },
      { key: "QA", label: "Qatar", labelAr: "قطر", matchTerms: ["Qatar"], center: [51.18, 25.35], zoom: 8 },
      { key: "BH", label: "Bahrain", labelAr: "البحرين", matchTerms: ["Bahrain"], center: [50.55, 26.07], zoom: 9 },
      { key: "OM", label: "Oman", labelAr: "عُمان", matchTerms: ["Oman"], center: [57.53, 21.47], zoom: 6 },
    ],
  },
  {
    key: "LEVANT",
    label: "Levant",
    labelAr: "الشام",
    center: [39, 34],
    zoom: 5.5,
    countries: [
      { key: "IQ", label: "Iraq", labelAr: "العراق", matchTerms: ["Iraq", "Iraqi"], center: [43.68, 33.22], zoom: 6 },
      { key: "SY", label: "Syria", labelAr: "سوريا", matchTerms: ["Syria", "Syrian"], center: [38.99, 34.8], zoom: 6.5 },
      { key: "LB", label: "Lebanon", labelAr: "لبنان", matchTerms: ["Lebanon", "Lebanese"], center: [35.86, 33.87], zoom: 8 },
      { key: "JO", label: "Jordan", labelAr: "الأردن", matchTerms: ["Jordan", "Jordanian"], center: [36.24, 31.96], zoom: 7 },
    ],
  },
  {
    key: "GULF_WATERS",
    label: "Gulf Waters",
    labelAr: "المياه الخليجية",
    center: [50, 22],
    zoom: 5,
    countries: [
      { key: "RED_SEA", label: "Red Sea", labelAr: "البحر الأحمر", matchTerms: ["Red Sea", "Bab el-Mandeb"], center: [39, 18], zoom: 5.5 },
      { key: "PERSIAN_GULF", label: "Persian Gulf", labelAr: "الخليج العربي", matchTerms: ["Persian Gulf", "Arabian Gulf"], center: [51, 27], zoom: 6 },
      { key: "HORMUZ", label: "Strait of Hormuz", labelAr: "مضيق هرمز", matchTerms: ["Strait of Hormuz", "Hormuz"], center: [56.3, 26.6], zoom: 7.5 },
      { key: "ADEN", label: "Gulf of Aden", labelAr: "خليج عدن", matchTerms: ["Gulf of Aden", "Aden"], center: [47, 12], zoom: 6 },
    ],
  },
  {
    key: "IRAN",
    label: "Iran",
    labelAr: "إيران",
    center: [53.69, 32.43],
    zoom: 5.5,
    countries: [
      { key: "IR", label: "Iran", labelAr: "إيران", matchTerms: ["Iran", "Iranian", "Tehran", "Bushehr", "Fordow", "Natanz"], center: [53.69, 32.43], zoom: 5.5 },
    ],
  },
  {
    key: "NORTH_AFRICA",
    label: "North Africa",
    labelAr: "شمال أفريقيا",
    center: [30, 25],
    zoom: 4.5,
    countries: [
      { key: "EG", label: "Egypt", labelAr: "مصر", matchTerms: ["Egypt", "Egyptian", "Suez"], center: [30.8, 26.82], zoom: 6 },
      { key: "LY", label: "Libya", labelAr: "ليبيا", matchTerms: ["Libya", "Libyan"], center: [17.23, 26.33], zoom: 5.5 },
      { key: "SD", label: "Sudan", labelAr: "السودان", matchTerms: ["Sudan", "Sudanese"], center: [30.22, 12.86], zoom: 5.5 },
      { key: "YE", label: "Yemen", labelAr: "اليمن", matchTerms: ["Yemen", "Yemeni", "Houthi"], center: [48.52, 15.55], zoom: 6 },
    ],
  },
];

/** Flat list of all countries for quick lookup */
export const ALL_COUNTRIES = REGION_GROUPS.flatMap((g) =>
  g.countries.map((c) => ({ ...c, groupKey: g.key, groupLabel: g.label }))
);

/**
 * Check if an event matches a region/country filter.
 * filterValue can be "GLOBAL", a group key like "GCC", or a country key like "KW".
 */
export function matchesFilter(
  event: { country: string; region: string },
  filterValue: string
): boolean {
  if (filterValue === "GLOBAL") return true;

  // Check if it's a country key
  const country = ALL_COUNTRIES.find((c) => c.key === filterValue);
  if (country) {
    return country.matchTerms.some(
      (term) =>
        event.country.toLowerCase().includes(term.toLowerCase()) ||
        event.region.toLowerCase().includes(term.toLowerCase())
    );
  }

  // Check if it's a region group
  const group = REGION_GROUPS.find((g) => g.key === filterValue);
  if (group) {
    return group.countries.some((c) =>
      c.matchTerms.some(
        (term) =>
          event.country.toLowerCase().includes(term.toLowerCase()) ||
          event.region.toLowerCase().includes(term.toLowerCase())
      )
    );
  }

  return true;
}

/**
 * Get the map viewport for a given filter value
 */
export function getFilterViewport(filterValue: string): { center: [number, number]; zoom: number } {
  if (filterValue === "GLOBAL") return GLOBAL_VIEW;

  const country = ALL_COUNTRIES.find((c) => c.key === filterValue);
  if (country) return { center: country.center, zoom: country.zoom };

  const group = REGION_GROUPS.find((g) => g.key === filterValue);
  if (group) return { center: group.center, zoom: group.zoom };

  return GLOBAL_VIEW;
}

/**
 * Get display label for a filter value
 */
export function getFilterLabel(filterValue: string, lang: "en" | "ar" = "en"): string {
  if (filterValue === "GLOBAL") return lang === "ar" ? "عالمي" : "GLOBAL";

  const country = ALL_COUNTRIES.find((c) => c.key === filterValue);
  if (country) return lang === "ar" ? country.labelAr : country.label;

  const group = REGION_GROUPS.find((g) => g.key === filterValue);
  if (group) return lang === "ar" ? group.labelAr : group.label;

  return filterValue;
}
