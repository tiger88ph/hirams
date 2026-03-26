import { getPhilippinesTime } from "./timeZone";

function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++; // skip Sunday (0) and Saturday (6)
  }
  return result;
}

export function getDueDateColor(dateStr) {
  if (!dateStr || dateStr === "—" || dateStr === "--") return null;

  const due = new Date(dateStr);
  if (isNaN(due)) return null;

  const now = getPhilippinesTime(); // ← PHT instead of new Date()

  if (due < now) return "red";

  const warningThreshold = addBusinessDays(now, 3);
  if (due <= warningThreshold) return "orange";

  return null;
}