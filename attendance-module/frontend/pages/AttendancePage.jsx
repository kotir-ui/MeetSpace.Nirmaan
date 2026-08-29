export default function AttendancePage({ records, loading }) {
  const present = records.filter((record) => record.status === 'Present').length;
  return <main className="shell">
    <header><div><p className="eyebrow">OPERATIONS / PEOPLE</p><h1>Attendance</h1><p className="muted">A clear view of today’s team presence.</p></div><button>Export report</button></header>
    <section className="stats"><article><span>Present today</span><strong>{present}</strong></article><article><span>Total records</span><strong>{records.length}</strong></article><article><span>Attendance rate</span><strong>{records.length ? Math.round((present / records.length) * 100) : 0}%</strong></article></section>
    <section className="panel"><div className="panel-title"><div><h2>Today’s attendance</h2><p className="muted">Friday, 28 August 2026</p></div><span className="live">● Live</span></div>
      {loading ? <p className="muted">Loading records...</p> : <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Check in</th><th>Check out</th><th>Status</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td>{record.employee}</td><td>{record.checkIn || '—'}</td><td>{record.checkOut || '—'}</td><td><span className={`status ${record.status.toLowerCase().replace(' ', '-')}`}>{record.status}</span></td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}
