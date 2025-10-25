/**
 * One-off migration script: create budgets table
 */
const { sequelize } = require('../config/database');

async function up() {
  const qi = sequelize.getQueryInterface();
  await qi.createTable('budgets', {
    id: { type: require('sequelize').INTEGER, autoIncrement: true, primaryKey: true },
    property_id: { type: require('sequelize').INTEGER, allowNull: false },
    month: { type: require('sequelize').STRING(7), allowNull: false },
    budgeted_income: { type: require('sequelize').DECIMAL(12,2), allowNull: false, defaultValue: 0 },
    budgeted_expenses: { type: require('sequelize').DECIMAL(12,2), allowNull: false, defaultValue: 0 },
    created_at: { type: require('sequelize').DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: require('sequelize').DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
  });
  // idempotent indexes/constraints
  try { await qi.addIndex('budgets', ['property_id']); } catch (e) { /* ignore duplicate */ }
  try { await qi.addIndex('budgets', ['month']); } catch (e) { /* ignore duplicate */ }
  try {
    await qi.addConstraint('budgets', {
      fields: ['property_id', 'month'],
      type: 'unique',
      name: 'uniq_budgets_property_month'
    });
  } catch (e) { /* ignore duplicate */ }
}

async function down() {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('budgets');
}

if (require.main === module) {
  up().then(() => {
    console.log('✅ budgets table created');
    process.exit(0);
  }).catch(err => {
    console.error('❌ budgets migration failed', err);
    process.exit(1);
  });
}

module.exports = { up, down };


