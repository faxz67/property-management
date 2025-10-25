const { sequelize } = require('../config/database');

/**
 * Migration: add pdf_path column to bills table
 */
async function addPdfPathColumn() {
  try {
    console.log('🔄 Adding pdf_path column to bills table...');
    await sequelize.query(`
      ALTER TABLE bills 
      ADD COLUMN pdf_path VARCHAR(500) NULL
    `);
    console.log('✅ Added pdf_path column');
  } catch (error) {
    if (String(error.message || error).includes('Duplicate column name') || String(error.sqlMessage || '').includes('Duplicate column name')) {
      console.log('ℹ️  pdf_path column already exists. Skipping.');
      return;
    }
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  addPdfPathColumn().then(() => {
    console.log('🎉 Migration completed');
    process.exit(0);
  });
}

module.exports = addPdfPathColumn;

/**
 * Migration script to add bill_date and language columns to bills table
 */
async function addBillColumns() {
  try {
    console.log('🔄 Starting migration: Adding bill_date and language columns to bills table...');
    
    // Add bill_date column
    await sequelize.query(`
      ALTER TABLE bills 
      ADD COLUMN bill_date DATE NOT NULL DEFAULT (CURDATE())
    `);
    console.log('✅ Added bill_date column');
    
    // Add language column
    await sequelize.query(`
      ALTER TABLE bills 
      ADD COLUMN language ENUM('en', 'fr') NOT NULL DEFAULT 'fr'
    `);
    console.log('✅ Added language column');
    
    // Update existing bills to have proper bill_date (use created_at date)
    await sequelize.query(`
      UPDATE bills 
      SET bill_date = DATE(created_at)
      WHERE bill_date IS NULL OR bill_date = '0000-00-00'
    `);
    console.log('✅ Updated existing bills with proper bill_date');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Check if columns already exist
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  Columns already exist, skipping migration');
    } else {
      throw error;
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  addBillColumns()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addBillColumns;
