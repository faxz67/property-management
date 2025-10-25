/**
 * Migration Script: Create Profits Table
 * 
 * Creates the profits table to track total profits for each admin
 * 
 * This script is idempotent - it can be run multiple times safely
 */

const { sequelize } = require('../config/database');
const { DataTypes, QueryTypes } = require('sequelize');

async function createProfitsTable() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Check if profits table exists
    const tables = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profits'
    `, { type: QueryTypes.SELECT });

    if (tables.length > 0) {
      console.log('⏭️  Profits table already exists');
      return;
    }

    console.log('📋 Creating profits table...');
    await sequelize.queryInterface.createTable('profits', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      admin_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'admins',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      total_profit: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      last_updated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });
    console.log('✅ Profits table created successfully');

    // Initialize profits for existing admins
    console.log('🔄 Initializing profits for existing admins...');
    await sequelize.query(`
      INSERT INTO profits (admin_id, total_profit, last_updated, created_at, updated_at)
      SELECT id, 0, NOW(), NOW(), NOW()
      FROM admins
      WHERE id NOT IN (SELECT admin_id FROM profits)
    `);
    console.log('✅ Profits initialized for all admins');

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('👋 Database connection closed');
  }
}

// Run the migration
createProfitsTable();

