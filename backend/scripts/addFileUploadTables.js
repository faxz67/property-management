/**
 * Migration script to add property_photos and tenant_documents tables
 * This enables file upload functionality for properties and tenants
 */

const { sequelize, PropertyPhoto, TenantDocument } = require('../models');

async function addFileUploadTables() {
  try {
    console.log('🔄 Starting migration: Adding file upload tables...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Create property_photos table
    await PropertyPhoto.sync({ force: false });
    console.log('✅ property_photos table created/verified');

    // Create tenant_documents table
    await TenantDocument.sync({ force: false });
    console.log('✅ tenant_documents table created/verified');

    console.log('✅ Migration completed successfully!');
    console.log('📝 Summary:');
    console.log('   - property_photos table: Ready');
    console.log('   - tenant_documents table: Ready');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
addFileUploadTables();

