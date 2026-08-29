const API_URL = (import.meta.env.VITE_ATTENDANCE_API_URL || '').replace(/\/$/, '');

export async function getAttendance(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const response = await fetch(`${API_URL}/api/attendance${query}`);
  if (!response.ok) throw new Error('Unable to load attendance');
  const data = await response.json();
  return data.records;
}
