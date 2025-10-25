/**
 * Migration Script: Add Payment-related Columns to Bills Table
 * 
 * Adds the following columns to the bills table:
 * - rent_amount: Montant du loyer
 * - charges: Charges
 * - total_amount: Montant total (loyer + charges)
 * - payment_date: Date de paiement
 * 
 * This script is idempotent - it can be run multiple times safely
 */

const { sequelize } = require('../config/database');
const { DataTypes, QueryTypes } = require('sequelize');

async function addBillPaymentColumns() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Check if columns already exist
    const columns = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bills'
    `, { type: QueryTypes.SELECT });

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Existing columns:', existingColumns);

    // Add rent_amount column
    if (!existingColumns.includes('rent_amount')) {
      console.log('➕ Adding rent_amount column...');
      await sequelize.queryInterface.addColumn('bills', 'rent_amount', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        after: 'amount'
      });
      console.log('✅ Added rent_amount column');
    } else {
      console.log('⏭️  rent_amount column already exists');
    }

    // Add charges column
    if (!existingColumns.includes('charges')) {
      console.log('➕ Adding charges column...');
      await sequelize.queryInterface.addColumn('bills', 'charges', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
        after: 'rent_amount'
      });
      console.log('✅ Added charges column');
    } else {
      console.log('⏭️  charges column already exists');
    }

    // Add total_amount column
    if (!existingColumns.includes('total_amount')) {
      console.log('➕ Adding total_amount column...');
      await sequelize.queryInterface.addColumn('bills', 'total_amount', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        after: 'charges'
      });
      console.log('✅ Added total_amount column');
    } else {
      console.log('⏭️  total_amount column already exists');
    }

    // Add payment_date column
    if (!existingColumns.includes('payment_date')) {
      console.log('➕ Adding payment_date column...');
      await sequelize.queryInterface.addColumn('bills', 'payment_date', {
        type: DataTypes.DATEONLY,
        allowNull: true,
        after: 'status'
      });
      console.log('✅ Added payment_date column');
    } else {
      console.log('⏭️  payment_date column already exists');
    }

    // Migrate existing data: copy amount to total_amount if not already set
    console.log('🔄 Migrating existing data...');
    await sequelize.query(`
      UPDATE bills 
      SET 
        rent_amount = amount,
        charges = 0,
        total_amount = amount
      WHERE total_amount IS NULL
    `);
    console.log('✅ Data migration completed');

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
addBillPaymentColumns();

