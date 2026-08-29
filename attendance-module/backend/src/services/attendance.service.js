const records = [
  { id: 1, employee: 'Aarav Sharma', date: '2026-08-28', checkIn: '09:04', checkOut: '18:02', status: 'Present' },
  { id: 2, employee: 'Mira Patel', date: '2026-08-28', checkIn: '09:18', checkOut: null, status: 'Present' },
  { id: 3, employee: 'Dev Menon', date: '2026-08-28', checkIn: null, checkOut: null, status: 'On leave' }
];

export function listAttendance(date) {
  return date ? records.filter((record) => record.date === date) : [...records];
}

export function checkIn({ employee, date = new Date().toISOString().slice(0, 10), checkIn }) {
  const record = { id: records.length + 1, employee, date, checkIn, checkOut: null, status: 'Present' };
  records.push(record);
  return record;
}
