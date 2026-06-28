const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"] as const;

/**
 * Render Latin digits as Persian digits for customer-facing UI.
 * Shared helper — use everywhere numbers are shown on the public menu.
 */
export function faNum(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)] ?? d);
}

// fa-IR groups with the Arabic thousands separator (٬) and renders Persian digits.
const TOMAN_FMT = new Intl.NumberFormat("fa-IR", { useGrouping: true });

/**
 * Format a whole-toman amount for customer-facing UI: grouped thousands + Persian digits +
 * the «تومان» suffix, e.g. 12000 → «۱۲٬۰۰۰ تومان». Shared — use everywhere a price is shown.
 */
export function faToman(amount: number): string {
  return `${TOMAN_FMT.format(amount)} تومان`;
}
