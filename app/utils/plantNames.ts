const PLANT_SHORT_NAMES: Record<string, string> = {
  NEM: "NEM",
  NGG3A: "NNG 3A",
  NNG3A: "NNG 3A",
  NK2: "NK2",
  NK3: "NK3",
  NP: "NPS",
  NPC: "NPS",
  XNN1: "XNN 1",
};

export type PlantBrand = {
  shortName: string;
  mark: string;
  accent: string;
  logo?: string;
};

const PLANT_BRANDS: Record<string, Omit<PlantBrand, "shortName">> = {
  NEM: { mark: "NE", accent: "#2b9dcc", logo: "/assets/images/plants/nem-logo.png" },
  NP: { mark: "NPS", accent: "#2b9dcc", logo: "/assets/images/plants/nps-logo.png" },
  NPC: { mark: "NPS", accent: "#2b9dcc", logo: "/assets/images/plants/nps-logo.png" },
  NK2: { mark: "N2", accent: "#2b9dcc", logo: "/assets/images/plants/nk2-logo.png" },
  NK3: { mark: "N3", accent: "#2b9dcc", logo: "/assets/images/plants/nk3-logo.png" },
  NGG3A: { mark: "3A", accent: "#2b9dcc", logo: "/assets/images/plants/nng3a-logo.png" },
  NNG3A: { mark: "3A", accent: "#2b9dcc", logo: "/assets/images/plants/nng3a-logo.png" },
  XNN1: { mark: "X1", accent: "#2b9dcc", logo: "/assets/images/plants/xnn1-logo.png" },
};

function normalizePlantCode(code?: string | null) {
  return String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function getPlantShortName(code?: string | null, apiName?: string | null) {
  const rawCode = String(code || "").trim();
  const canonical = PLANT_SHORT_NAMES[normalizePlantCode(rawCode)];
  if (canonical) return canonical;

  const providedName = String(apiName || "").trim();
  if (providedName && providedName.length <= 14) return providedName;
  return rawCode || providedName || "-";
}

export function getPlantBrand(code?: string | null, apiName?: string | null): PlantBrand {
  const normalizedCode = normalizePlantCode(code);
  const shortName = getPlantShortName(code, apiName);
  const brand = PLANT_BRANDS[normalizedCode];

  if (brand) return { shortName, ...brand };

  const fallbackMark = shortName.replace(/[^A-Z0-9]/gi, "").slice(0, 2).toUpperCase() || "HP";
  return { shortName, mark: fallbackMark, accent: "#38bdf8" };
}

export { PLANT_BRANDS, PLANT_SHORT_NAMES };
