import db from '../models/index.js';
import { getSettings, buildFreshnessRows } from './freshnessService.js';
import { sendFreshnessReminder } from './notificationService.js';

const { User, Role } = db;

// How often the scheduler wakes up to evaluate reminders.
const TICK_MS = Number(process.env.REMINDER_TICK_MS) || 60 * 60 * 1000; // hourly

// Per-severity cadence keys on the settings row.
const CADENCE_KEY = {
  warning: 'warning_email_every',
  high: 'high_email_every',
  critical: 'critical_email_every',
  inactive: 'inactive_email_every',
};

// In-memory record of the last time we emailed a recipient about a website.
// Keyed by `${userId}:${websiteId}` -> timestamp (ms). Suitable for a single
// node process; move to a table for multi-instance deployments.
const lastSent = new Map();

const isDue = (key, cadenceDays) => {
  const prev = lastSent.get(key);
  if (!prev) return true;
  return Date.now() - prev >= cadenceDays * 86400000;
};

/**
 * Evaluate every alerting website and email its assigned users (plus admins)
 * according to the configured per-severity cadence.
 */
export const runReminderSweep = async () => {
  const settings = await getSettings();
  if (!settings.reminders_enabled) return { sent: 0, skipped: 'disabled' };

  // Admins receive reminders for every website.
  const admins = await User.findAll({
    where: { status: 'active' },
    include: [{ model: Role, as: 'role', where: { name: ['Super Admin', 'Admin'] } }],
  });

  // Build the global freshness picture once (admin view = all websites).
  const adminUser = admins[0];
  if (!adminUser) return { sent: 0, skipped: 'no-admin' };
  const rows = await buildFreshnessRows(adminUser);

  let sent = 0;
  for (const row of rows) {
    const cadenceKey = CADENCE_KEY[row.severity];
    if (!cadenceKey) continue; // healthy websites need no reminder
    const cadenceDays = settings[cadenceKey] || 1;

    // Recipients: assigned users + all admins (deduped by id).
    const recipients = new Map();
    row.assigned_users.forEach((u) => recipients.set(u.id, u));
    admins.forEach((a) => recipients.set(a.id, { id: a.id, name: a.name, email: a.email }));

    for (const recipient of recipients.values()) {
      const key = `${recipient.id}:${row.website_id}`;
      if (!isDue(key, cadenceDays)) continue;
      try {
        await sendFreshnessReminder({ recipient, row, settings });
        lastSent.set(key, Date.now());
        sent += 1;
      } catch (err) {
        console.error('Reminder send failed:', err.message);
      }
    }
  }
  return { sent };
};

let timer = null;

/**
 * Start the recurring reminder scheduler. Safe to call once at boot.
 */
export const startReminderScheduler = () => {
  if (timer) return;
  // Kick off shortly after boot, then on the configured interval.
  setTimeout(() => {
    runReminderSweep().catch((e) => console.error('Reminder sweep error:', e.message));
  }, 15000);
  timer = setInterval(() => {
    runReminderSweep().catch((e) => console.error('Reminder sweep error:', e.message));
  }, TICK_MS);
  console.log(`⏰ Freshness reminder scheduler started (every ${Math.round(TICK_MS / 60000)} min)`);
};

export const stopReminderScheduler = () => {
  if (timer) clearInterval(timer);
  timer = null;
};
