import db from '../models/index.js';

const { Website } = db;

const FULL_ACCESS_ROLES = ['Super Admin', 'Admin'];

/**
 * Determine whether a user can see every website (Admins) or only the ones
 * explicitly assigned to them (Managers / Users).
 */
export const hasFullAccess = (user) => FULL_ACCESS_ROLES.includes(user?.role?.name);

/**
 * Returns the list of website IDs a user is allowed to access.
 * - Admins / Super Admins  -> null  (meaning "no restriction / all websites")
 * - Managers / Users       -> array of assigned website IDs (possibly empty)
 */
export const getAccessibleWebsiteIds = async (user) => {
  if (hasFullAccess(user)) return null;

  const rows = await user.getAssignedWebsites({ attributes: ['id'], joinTableAttributes: [] });
  return rows.map((w) => w.id);
};

/**
 * Fetch the full website records a user can access, honouring the same rules.
 */
export const getAccessibleWebsites = async (user, options = {}) => {
  const ids = await getAccessibleWebsiteIds(user);
  if (ids === null) return Website.findAll(options);
  if (ids.length === 0) return [];
  return Website.findAll({ ...options, where: { ...(options.where || {}), id: ids } });
};

/**
 * Guard helper: can the given user access a specific website id?
 */
export const canAccessWebsite = async (user, websiteId) => {
  const ids = await getAccessibleWebsiteIds(user);
  if (ids === null) return true;
  return ids.includes(Number(websiteId));
};
