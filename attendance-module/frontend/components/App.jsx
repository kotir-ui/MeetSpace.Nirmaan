import { useEffect, useState } from 'react';
import { getAttendance } from '../services/attendanceService.js';
import AttendancePage from '../pages/AttendancePage.jsx';

export default function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getAttendance().then(setRecords).finally(() => setLoading(false)); }, []);
  return <AttendancePage records={records} loading={loading} />;
}
