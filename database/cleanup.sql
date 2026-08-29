-- Cleanup script for removing unwanted analytics & platform tables
-- Safety check: Run this to remove non-required tables from your MySQL database.

SET FOREIGN_KEY_CHECKS = 0;

-- Unwanted Analytics Tables
DROP TABLE IF EXISTS `website_daily_analytics`;
DROP TABLE IF EXISTS `website_monthly_reports`;
DROP TABLE IF EXISTS `website_quarterly_reports`;
DROP TABLE IF EXISTS `website_yearly_reports`;
DROP TABLE IF EXISTS `metric_entries`;
DROP TABLE IF EXISTS `website_metrics`;
DROP TABLE IF EXISTS `modules`;
DROP TABLE IF EXISTS `user_websites`;
DROP TABLE IF EXISTS `websites`;

-- Unwanted Platform Tables
DROP TABLE IF EXISTS `metric_period_values`;
DROP TABLE IF EXISTS `metric_facts`;
DROP TABLE IF EXISTS `dimension_facts`;
DROP TABLE IF EXISTS `metric_definitions`;
DROP TABLE IF EXISTS `insights`;
DROP TABLE IF EXISTS `dashboard_summaries`;
DROP TABLE IF EXISTS `user_portals`;
DROP TABLE IF EXISTS `portals`;

-- Unwanted Alert System Tables
DROP TABLE IF EXISTS `alert_dismissals`;
DROP TABLE IF EXISTS `alert_settings`;

SET FOREIGN_KEY_CHECKS = 1;
