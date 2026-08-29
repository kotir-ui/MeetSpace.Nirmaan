CREATE TABLE employees (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(100),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE attendance_records (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id),
  attendance_date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status VARCHAR(30) NOT NULL DEFAULT 'Present',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);
CREATE INDEX attendance_records_date_idx ON attendance_records(attendance_date);
