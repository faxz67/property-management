/**
 * One-off migration script: create expenses table
 */
const { sequelize } = require('../config/database');

async function up() {
  const qi = sequelize.getQueryInterface();
  await qi.createTable('expenses', {
    id: { type: require('sequelize').INTEGER, autoIncrement: true, primaryKey: true },
    property_id: { type: require('sequelize').INTEGER, allowNull: false },
    admin_id: { type: require('sequelize').INTEGER, allowNull: false },
    month: { type: require('sequelize').STRING(7), allowNull: false },
    category: { type: require('sequelize').STRING(100), allowNull: false },
    amount: { type: require('sequelize').DECIMAL(12,2), allowNull: false, defaultValue: 0 },
    notes: { type: require('sequelize').TEXT, allowNull: true },
    created_at: { type: require('sequelize').DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    updated_at: { type: require('sequelize').DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') }
  });
  // idempotent indexes
  try { await qi.addIndex('expenses', ['property_id']); } catch (e) { /* ignore duplicate */ }
  try { await qi.addIndex('expenses', ['admin_id']); } catch (e) { /* ignore duplicate */ }
  try { await qi.addIndex('expenses', ['month']); } catch (e) { /* ignore duplicate */ }
  try { await qi.addIndex('expenses', ['category']); } catch (e) { /* ignore duplicate */ }
}

async function down() {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('expenses');
}

if (require.main === module) {
  up().then(() => {
    console.log('✅ expenses table created');
    process.exit(0);
  }).catch(err => {
    console.error('❌ expenses migration failed', err);
    process.exit(1);
  });
}

module.exports = { up, down };


