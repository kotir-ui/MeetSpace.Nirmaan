import dotenv from 'dotenv';
import db from '../models/index.js';

dotenv.config();

const {
  sequelize,
  WebsiteDailyAnalytics,
  WebsiteMonthlyReport,
  WebsiteQuarterlyReport,
  WebsiteYearlyReport,
  MetricEntry,
  DashboardSummary,
} = db;

// Tables holding time-series / computed analytics + report data.
// Users, roles, websites, assignments, alert settings and audit logs are kept.
const DATA_MODELS = [
  ['Daily analytics', WebsiteDailyAnalytics],
  ['Monthly reports', WebsiteMonthlyReport],
  ['Quarterly reports', WebsiteQuarterlyReport],
  ['Yearly reports', WebsiteYearlyReport],
  ['Metric entries', MetricEntry],
  ['Dashboard summaries', DashboardSummary],
];

const clear = async () => {
  await sequelize.authenticate();
  console.log(`✅ Connected to "${process.env.DB_NAME}"`);

  // Disable FK checks so child tables can be truncated in any order.
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    for (const [label, model] of DATA_MODELS) {
      if (!model) continue;
      await model.destroy({ where: {}, truncate: true, force: true });
      console.log(`🧹 Cleared ${label}`);
    }
  } finally {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  console.log('\n🎉 Portal data cleared. Users, websites and assignments were preserved.');
  process.exit(0);
};

clear().catch((err) => {
  console.error('❌ Clear failed:', err);
  process.exit(1);
});
