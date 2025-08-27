// Centralized currency conversion utilities
// BNB official fixed rate: 1 EUR = 1.95583 BGN
// Requirement: All records dated on or before 2025-12-31 should be displayed in EUR, converted from their BGN value.

const BGN_PER_EUR = 1.95583;
const CUTOFF_ISO = '2025-12-31T23:59:59Z'; // inclusive cutoff

// Parse date safely; returns Date or null
function parseDateSafe(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
}

function shouldConvert(dateString) {
  const d = parseDateSafe(dateString);
  if (!d) return false; // no date => do not convert
  const cutoff = new Date(CUTOFF_ISO);
  return d.getTime() <= cutoff.getTime();
}

// Convert a numeric/string amount to EUR if the date is before/equal cutoff.
// Returns a Number (not formatted string). If amount is invalid, returns 0.
export function convertAmountByDate(amount, dateString) {
  const num = parseFloat(amount);
  if (!isFinite(num)) return 0;
  if (!shouldConvert(dateString)) return num; // already EUR or after cutoff
  return num / BGN_PER_EUR;
}

// Format a number to fixed 2 decimals as string (without currency sign)
export function formatAmount2(amount) {
  const num = parseFloat(amount);
  if (!isFinite(num)) return '0.00';
  return num.toFixed(2);
}

// Convenience: convert then format
export function convertAndFormat(amount, dateString) {
  return formatAmount2(convertAmountByDate(amount, dateString));
}

export const EUR_SIGN = '€';
