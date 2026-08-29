// Replace this middleware with the host portal's authentication adapter.
export function attendanceAuth(req, _res, next) {
  req.attendanceUser = req.headers['x-attendance-user'] || null;
  next();
}
