export const growth = (current, previous) => {
  const c = Number(current) || 0;
  const p = Number(previous) || 0;
  if (p === 0) return c === 0 ? 0 : 100;
  return Number((((c - p) / p) * 100).toFixed(2));
};

// Fiscal year quarters (April start):
//   Q1: Apr, May, Jun  | Q2: Jul, Aug, Sep
//   Q3: Oct, Nov, Dec  | Q4: Jan, Feb, Mar (of the following calendar year)
export const QUARTER_MONTHS = {
  1: [4, 5, 6],
  2: [7, 8, 9],
  3: [10, 11, 12],
  4: [1, 2, 3],
};

export const QUARTER_LABELS = {
  1: 'Q1 (Apr-Jun)',
  2: 'Q2 (Jul-Sep)',
  3: 'Q3 (Oct-Dec)',
  4: 'Q4 (Jan-Mar)',
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Fiscal quarter (1-4) a calendar month belongs to.
export const fiscalQuarterOfMonth = (month) => {
  if (month >= 4 && month <= 6) return 1;
  if (month >= 7 && month <= 9) return 2;
  if (month >= 10 && month <= 12) return 3;
  return 4; // Jan-Mar
};

// The fiscal year a given calendar (year, month) belongs to.
// Apr-Dec -> fiscalYear = calendarYear; Jan-Mar -> fiscalYear = calendarYear - 1.
export const fiscalYearOf = (calendarYear, month) => (month >= 4 ? calendarYear : calendarYear - 1);

// Calendar year a fiscal month maps to, for a given fiscal year.
export const calendarYearForFiscalMonth = (fiscalYear, month) =>
  month >= 4 ? fiscalYear : fiscalYear + 1;

// Backwards-compatible alias (now fiscal-aware).
export const quarterOfMonth = fiscalQuarterOfMonth;

export const formatDuration = (seconds) => {
  const s = Number(seconds) || 0;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
};
