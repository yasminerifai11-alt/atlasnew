/**
 * Atlas Command — Translation Utilities
 * Consistent Arabic/English field resolution and tag translation
 */

// ─── Localized Field Resolution ─────────────────────────────────

/**
 * Resolves the localized version of a field on an object.
 * When lang is 'ar', looks for `${field}_ar` first, falls back to `${field}`.
 */
export function getLocalizedField(
  obj: Record<string, any>,
  field: string,
  lang: string,
): string {
  if (lang === "ar") {
    const arField = obj[`${field}_ar`];
    if (arField && typeof arField === "string" && arField.trim() !== "") {
      return arField;
    }
  }
  return obj[field] || "";
}

// ─── Event Type / Sector Tag Translation ────────────────────────

const EVENT_TYPE_TAGS_AR: Record<string, string> = {
  NUCLEAR: "نووي",
  SECURITY: "أمني",
  MILITARY: "عسكري",
  MARITIME: "بحري",
  CYBER: "إلكتروني",
  ENERGY: "طاقة",
  GEOPOLITICAL: "جيوسياسي",
  ECONOMIC: "اقتصادي",
  AVIATION: "جوي",
  DISASTER: "كارثة",
  CONFLICT: "نزاع",
  DIPLOMATIC: "دبلوماسي",
  INTELLIGENCE: "استخباراتي",
  INFRASTRUCTURE: "بنية تحتية",
  STRIKE: "ضربة",
  SANCTIONS: "عقوبات",
  PROTEST: "احتجاجات",
  ELECTION: "انتخابات",
  HEALTH: "صحة",
  SPACE: "فضاء",
  FINANCIAL: "مالي",
  TRADE: "تجارة",
  HUMANITARIAN: "إنساني",
  TERRORISM: "إرهاب",
};

/**
 * Translates an event type/sector tag to Arabic when lang is 'ar'.
 * Returns the original tag if no translation is available.
 */
export function translateTag(tag: string, lang: string): string {
  if (lang === "ar") {
    return EVENT_TYPE_TAGS_AR[tag] || tag;
  }
  return tag;
}

// ─── Risk Level Translation ─────────────────────────────────────

const RISK_LEVELS_AR: Record<string, string> = {
  CRITICAL: "حرج",
  HIGH: "مرتفع",
  MEDIUM: "متوسط",
  LOW: "منخفض",
  ELEVATED: "مرتفع",
  GUARDED: "متحفظ",
  NOMINAL: "طبيعي",
};

/**
 * Translates a risk level label to Arabic when lang is 'ar'.
 */
export function translateRiskLevel(level: string, lang: string): string {
  if (lang === "ar") {
    return RISK_LEVELS_AR[level] || level;
  }
  return level;
}

// ─── Region Name Translation ────────────────────────────────────

const REGION_NAMES_AR: Record<string, string> = {
  "Red Sea": "البحر الأحمر",
  "Persian Gulf": "الخليج العربي",
  "Arabian Gulf": "الخليج العربي",
  "Strait of Hormuz": "مضيق هرمز",
  "Gulf of Aden": "خليج عدن",
  "Bab el-Mandeb": "باب المندب",
  "Eastern Mediterranean": "شرق المتوسط",
  "Levant": "الشام",
  "Horn of Africa": "القرن الأفريقي",
  "Central Asia": "آسيا الوسطى",
  "South Asia": "جنوب آسيا",
  "North Africa": "شمال أفريقيا",
  "GCC": "دول الخليج",
};

/**
 * Translates a region name to Arabic when lang is 'ar'.
 */
export function translateRegion(region: string, lang: string): string {
  if (lang === "ar") {
    return REGION_NAMES_AR[region] || region;
  }
  return region;
}

// ─── Map Label Layers ───────────────────────────────────────────

/**
 * List of MapLibre label layers to update for language switching.
 */
export const MAP_LABEL_LAYERS = [
  "country-label",
  "state-label",
  "settlement-label",
  "settlement-subdivision-label",
  "airport-label",
  "poi-label",
  "water-point-label",
  "water-line-label",
  "natural-point-label",
  "natural-line-label",
  "waterway-label",
  "road-label",
  "place_country",
  "place_state",
  "place_city",
  "place_town",
  "place_village",
  "place_other",
  "watername_ocean",
  "watername_sea",
  "watername_lake",
  "watername_river",
];

/**
 * Switches map label layers to Arabic or English.
 * Uses coalesce to fall back to default name if translated name unavailable.
 * Note: CartoDB/OpenMapTiles uses "name:ar" (colon) format, not "name_ar" (underscore).
 */
export function setMapLanguage(map: any, lang: string): void {
  // OpenMapTiles (CartoDB) uses "name:xx" with colon
  const nameFieldColon = lang === "ar" ? "name:ar" : "name:en";
  // Mapbox/MapTiler may use "name_xx" with underscore
  const nameFieldUnderscore = lang === "ar" ? "name_ar" : "name_en";

  const textFieldExpr = [
    "coalesce",
    ["get", nameFieldColon],
    ["get", nameFieldUnderscore],
    ["get", "name"],
  ];

  // Apply to all known label layers
  for (const layerId of MAP_LABEL_LAYERS) {
    try {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "text-field", textFieldExpr);
      }
    } catch {
      // Layer doesn't exist or doesn't support text-field — skip
    }
  }

  // Also apply to ALL symbol layers in the style for comprehensive coverage
  try {
    const allLayers = map.getStyle()?.layers || [];
    for (const layer of allLayers) {
      if (layer.type === "symbol") {
        try {
          map.setLayoutProperty(layer.id, "text-field", textFieldExpr);
        } catch {
          // skip — some symbol layers may not have text-field
        }
      }
    }
  } catch {
    // style not ready
  }
}
