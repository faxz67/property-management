const { sequelize } = require('../config/database');

async function up() {
  try {
    console.log('🔄 Updating expenses.property_id to allow NULL...');
    await sequelize.query(`
      ALTER TABLE expenses 
      MODIFY COLUMN property_id INT NULL;
    `);
    console.log('✅ expenses.property_id is now nullable');
  } catch (error) {
    console.error('❌ Failed to update property_id:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  up().then(() => {
    console.log('✅ Migration completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { up };

