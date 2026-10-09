export const formatNumber = (val) => {
  if (val == null || val === "") return "-";

  const num = Number(val);
  if (Number.isNaN(num)) return "-";

  // 1234567 -> "1.234.567"
  return Math.trunc(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};
