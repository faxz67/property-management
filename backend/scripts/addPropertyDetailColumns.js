const { sequelize } = require('../config/database');

async function up() {
  try {
    console.log('🔄 Adding property detail columns...');
    await sequelize.query(`
      ALTER TABLE properties
      ADD COLUMN IF NOT EXISTS number_of_halls TINYINT UNSIGNED NULL DEFAULT 0 AFTER photo,
      ADD COLUMN IF NOT EXISTS number_of_kitchens TINYINT UNSIGNED NULL DEFAULT 0 AFTER number_of_halls,
      ADD COLUMN IF NOT EXISTS number_of_bathrooms TINYINT UNSIGNED NULL DEFAULT 0 AFTER number_of_kitchens,
      ADD COLUMN IF NOT EXISTS number_of_parking_spaces TINYINT UNSIGNED NULL DEFAULT 0 AFTER number_of_bathrooms,
      ADD COLUMN IF NOT EXISTS number_of_rooms TINYINT UNSIGNED NULL DEFAULT 0 AFTER number_of_parking_spaces,
      ADD COLUMN IF NOT EXISTS number_of_gardens TINYINT UNSIGNED NULL DEFAULT 0 AFTER number_of_rooms;
    `);
    console.log('✅ Property detail columns added (or already exist).');
  } catch (error) {
    console.error('❌ Failed to add property detail columns:', error);
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


