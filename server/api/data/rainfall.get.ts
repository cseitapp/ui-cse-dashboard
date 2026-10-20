import { energyDl } from "../utils/energyDl";

function formatToApiDate(value: string): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-");
    return `${day}/${month}/${year}`;
  }
  return trimmed;
}

function resolveBranchCodes(branchCodeParam?: string): string {
  const defaultBranches = ["NEM", "NK2", "NK3", "XNN1", "NP", "NGG3A"];
  const trimmed = String(branchCodeParam || "").trim();
  if (!trimmed || trimmed.toUpperCase() === "ALL") {
    return defaultBranches.join(",");
  }

  const requested = trimmed.split(",").map(b => b.trim()).filter(Boolean);
  const resolved = new Set<string>();

  for (const b of requested) {
    const upper = b.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (["NP", "NPC", "NPS"].includes(upper)) {
      resolved.add("NP");
    } else if (["NNG3A", "NGG3A"].includes(upper)) {
      resolved.add("NGG3A");
    } else if (upper) {
      resolved.add(upper);
    }
  }

  return resolved.size ? Array.from(resolved).join(",") : defaultBranches.join(",");
}

export default defineCachedEventHandler(async (event) => {
  const query = getQuery(event);
  const branchCode = resolveBranchCodes(String(query.branch_code || ""));
  const rawParam = String(query.parameter_id || "RainRt,Rain rateing").trim();
  const parameterId = rawParam.replace(/Rain_rateing/gi, "Rain rateing");
  const startDate = formatToApiDate(String(query.start_date || "01/07/2026"));
  const endDate = formatToApiDate(String(query.end_date || "31/12/2026"));

  try {
    const response = await energyDl.get("api/dashboard/branch", {
      params: {
        branch_code: branchCode,
        parameter_id: parameterId,
        start_date: startDate,
        end_date: endDate,
      },
    });

    return response.data;
  } catch (error: any) {
    const errorCode = error?.code || error?.cause?.code || "UNKNOWN_ERROR";
    console.error("Rainfall API Error:", errorCode, error?.message || "Request failed");

    throw createError({
      statusCode: 502,
      statusMessage: "Rainfall API unavailable",
      data: { code: errorCode },
    });
  }
}, {
  name: "dashboard-rainfall-branch-v1",
  maxAge: 120,
  staleMaxAge: 3600,
  swr: true,
  getKey: (event) => {
    const query = getQuery(event);
    return [
      resolveBranchCodes(String(query.branch_code || "")),
      query.parameter_id,
      formatToApiDate(String(query.start_date || "")),
      formatToApiDate(String(query.end_date || "")),
    ].map(value => String(value || "")).join(":");
  },
});
