// composables/useHelper.ts

export const formatDate = (
  date: Date | string | null | undefined
) => {
  if (!date) return "-";

  const d = date instanceof Date ? date : new Date(date);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
};

export const formatDisplay = (
  date: Date | string | null | undefined
) => {
  if (!date) return "-";

  const d = new Date(date);

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");

  return `${dd}-${mm}-${yyyy} ${hh}:${min}:${ss}`;
};

export const formatNumber = (
  val: number | string | null | undefined
) => {
  return val != null ? Number(val).toFixed(3) : "-";
};