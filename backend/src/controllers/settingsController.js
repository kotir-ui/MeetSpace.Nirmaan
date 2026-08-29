import db from '../models/index.js';
import { logActivity } from '../utils/activity.js';

const { AppSetting } = db;

// Feature toggles the Super Admin can flip on/off. Defaults to enabled.
export const FEATURE_DEFAULTS = {
  change_password_enabled: true,
  forgot_password_enabled: true,
  admin_reset_enabled: true,
};

export const getSettingsMap = async () => {
  const rows = await AppSetting.findAll({ raw: true });
  const map = { ...FEATURE_DEFAULTS };
  for (const r of rows) {
    if (r.key in map) map[r.key] = !!r.value;
  }
  return map;
};

export const isFeatureEnabled = async (key) => {
  const map = await getSettingsMap();
  return !!map[key];
};

// GET /api/settings — authenticated users read the toggle map.
export const getSettings = async (req, res, next) => {
  try {
    res.json(await getSettingsMap());
  } catch (err) {
    next(err);
  }
};

// PUT /api/settings — Super Admin updates one or more toggles: { key: bool, ... }.
export const updateSettings = async (req, res, next) => {
  try {
    const body = req.body || {};
    const keys = Object.keys(body).filter((k) => k in FEATURE_DEFAULTS);
    if (!keys.length) return res.status(400).json({ message: 'No valid settings provided' });

    for (const key of keys) {
      const value = !!body[key];
      const [row, created] = await AppSetting.findOrCreate({ where: { key }, defaults: { key, value } });
      if (!created) {
        row.value = value;
        await row.save();
      }
    }
    await logActivity(req, 'UPDATE', 'settings', `Updated settings: ${keys.join(', ')}`);
    res.json(await getSettingsMap());
  } catch (err) {
    next(err);
  }
};
