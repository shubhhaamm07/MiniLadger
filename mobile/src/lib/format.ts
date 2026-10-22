export function formatMoney(paise: number): string {
  const rupees = (paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return "₹" + rupees;
}

export function formatDate(dateText: string): string {
  return new Date(dateText + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isOverdue(dueDate: string, repaidAt: string | null): boolean {
  if (repaidAt) return false;

  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return dueDate < today;
}
