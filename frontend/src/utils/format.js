// Value formatting for platform metrics based on their unit.

const compact = (n) =>
  new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

export function formatValue(value, unit) {
  const v = Number(value) || 0;
  switch (unit) {
    case 'percent':
      return `${v.toFixed(1)}%`;
    case 'rating':
      return `${v.toFixed(2)}★`;
    case 'score':
      return v.toFixed(1);
    case 'currency':
      if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
      if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
      return `₹${compact(v)}`;
    case 'duration':
      if (v >= 60) {
        const m = Math.floor(v / 60);
        const s = Math.round(v % 60);
        return `${m}m ${s}s`;
      }
      return `${v.toFixed(2)}s`;
    case 'number':
    default:
      return compact(v);
  }
}

export function formatFull(value, unit) {
  const v = Number(value) || 0;
  if (unit === 'percent') return `${v.toFixed(1)}%`;
  if (unit === 'rating') return `${v.toFixed(2)}★`;
  if (unit === 'currency') return `₹${new Intl.NumberFormat('en-IN').format(Math.round(v))}`;
  if (unit === 'number') return new Intl.NumberFormat('en-IN').format(Math.round(v));
  return formatValue(v, unit);
}

export const CATEGORY_COLORS = {
  education: '#2563eb',
  skills: '#7c3aed',
  volunteer: '#059669',
  csr: '#d97706',
  hiring: '#dc2626',
  health: '#0891b2',
  psychometric: '#db2777',
  project: '#4f46e5',
  generic: '#64748b',
};
