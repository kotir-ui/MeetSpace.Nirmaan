import { checkIn, listAttendance } from '../services/attendance.service.js';

export function getAttendance(req, res) {
  res.json({ ok: true, records: listAttendance(req.query.date) });
}

export function createCheckIn(req, res) {
  const { employee, checkIn: checkInTime } = req.body;
  if (!employee || !checkInTime) {
    return res.status(400).json({ ok: false, error: 'employee and checkIn are required' });
  }

  const record = checkIn({ ...req.body, checkIn: checkInTime });
  return res.status(201).json({ ok: true, record });
}
