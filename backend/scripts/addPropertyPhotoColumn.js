const { sequelize } = require('../config/database');

async function up() {
  try {
    console.log('🔄 Adding photo column to properties...');
    await sequelize.query(`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS photo VARCHAR(500) NULL;
    `);
    console.log('✅ photo column added (or already exists).');
  } catch (error) {
    console.error('❌ Failed to add photo column:', error);
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


