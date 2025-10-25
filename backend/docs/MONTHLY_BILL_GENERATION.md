# Monthly Bill Generation Feature

## Overview
The Monthly Bill Generation feature automatically generates French bills for all active tenants on the 1st of every month. This feature includes automatic cron job scheduling, French language support, and comprehensive bill management.

## Features

### ✅ Automatic Bill Generation
- **Schedule**: Runs on the 1st of every month at 9:00 AM (Europe/Paris timezone)
- **Language**: All bills generated in French (`language = 'fr'`)
- **Duplicate Prevention**: Prevents duplicate bills for the same tenant and month
- **Data Isolation**: Each admin only sees bills for their own tenants

### ✅ French Bill Content
Each bill includes:
- **Tenant Information**: Name, email, phone
- **Property Information**: Title, address, city
- **Bill Details**: Rent amount, utility charges (if applicable), total amount
- **Dates**: Bill date (1st of month), due date (15th of month)
- **French Descriptions**: All content in French language

### ✅ Database Schema
The `bills` table includes:
- `id` - Primary key
- `tenant_id` - Reference to tenant
- `property_id` - Reference to property
- `admin_id` - Reference to admin (for data isolation)
- `amount` - Total bill amount
- `month` - Month in YYYY-MM format
- `bill_date` - Date when bill was generated (1st of month)
- `due_date` - Payment due date (15th of month)
- `status` - PENDING, PAID, OVERDUE, RECEIPT_SENT
- `language` - 'fr' for French bills
- `description` - French description of the bill

## API Endpoints

### 🔐 Authentication Required
All endpoints require valid JWT token authentication.

### 📋 Bill Management
```
GET    /api/bills                    - Get all bills for current admin
GET    /api/bills/:id                - Get specific bill
POST   /api/bills                    - Create manual bill
PUT    /api/bills/:id                - Update bill
DELETE /api/bills/:id                - Delete bill
GET    /api/bills/stats              - Get bill statistics
```

### 🤖 Bill Generation (SUPER_ADMIN only)
```
POST   /api/bills/generate-monthly   - Generate bills for all admins
```

### 👤 Admin-Specific Generation
```
POST   /api/bills/generate-admin     - Generate bills for current admin only
GET    /api/bills/generation-stats   - Get generation statistics for a month
```

### 🕐 Cron Job Management
```
GET    /api/cron/status              - Get cron job status
```

### 🧪 Development Testing
```
POST   /api/test/generate-bills      - Test bill generation (dev only)
```

## Usage Examples

### Generate Bills for Current Month
```bash
# SUPER_ADMIN can generate for all admins
POST /api/bills/generate-monthly
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{}

# Regular admin can generate for themselves only
POST /api/bills/generate-admin
Authorization: Bearer <admin_token>
Content-Type: application/json

{}
```

### Generate Bills for Specific Month
```bash
POST /api/bills/generate-monthly
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "month": "2025-12"
}
```

### Get Generation Statistics
```bash
GET /api/bills/generation-stats?month=2025-10
Authorization: Bearer <admin_token>
```

## Cron Job Configuration

### Monthly Bill Generation
- **Schedule**: `0 9 1 * *` (1st of every month at 9:00 AM)
- **Timezone**: Europe/Paris
- **Function**: Generates bills for all active tenants

### Daily Overdue Check
- **Schedule**: `0 10 * * *` (Daily at 10:00 AM)
- **Timezone**: Europe/Paris
- **Function**: Updates overdue bills status

## French Bill Template

### Sample French Bill Content
```
FACTURE DE LOYER
Facture mensuelle - Octobre 2025

INFORMATIONS LOCATAIRE:
Nom: Jean Dupont
Email: jean.dupont@email.com
Téléphone: +33 1 23 45 67 89

INFORMATIONS BIEN IMMOBILIER:
Nom: Appartement Paris 15ème
Adresse: 123 Rue de la Paix
Ville: Paris

DÉTAIL DE LA FACTURE:
Loyer mensuel: €1,200.00
Charges d'utilitaires: €50.00
TOTAL À PAYER: €1,250.00

Date d'échéance: 15/10/2025
```

## Data Isolation

### Admin Access Control
- **SUPER_ADMIN**: Can generate bills for all admins via `/api/bills/generate-monthly`
- **Regular ADMIN**: Can only generate bills for their own tenants via `/api/bills/generate-admin`
- **Bill Visibility**: Each admin only sees bills for their own tenants

### Database Filtering
All bill queries automatically filter by `admin_id` to ensure data isolation:
```javascript
const whereClause = { admin_id: req.admin.id };
```

## Error Handling

### Duplicate Prevention
- Checks for existing bills before creation
- Returns `billsSkipped` count in statistics
- Logs skipped bills with tenant information

### Error Logging
- Comprehensive error logging for failed bill generation
- Detailed error messages for debugging
- Graceful handling of database errors

## Testing

### Manual Testing
```bash
# Test bill generation (development only)
POST /api/test/generate-bills
Content-Type: application/json

{
  "month": "2025-10"
}
```

### Expected Response
```json
{
  "success": true,
  "message": "Monthly bill generation completed for 2025-10",
  "statistics": {
    "totalTenants": 5,
    "billsGenerated": 5,
    "billsSkipped": 0,
    "errors": 0,
    "month": "2025-10",
    "billDate": "2025-10-01",
    "dueDate": "2025-10-15"
  }
}
```

## Monitoring

### Cron Job Status
```bash
GET /api/cron/status
```

Response:
```json
{
  "success": true,
  "data": {
    "initialized": true,
    "jobs": {
      "monthlyBillGeneration": {
        "running": true,
        "scheduled": true,
        "nextDate": "2025-11-01T09:00:00.000Z"
      },
      "overdueBillCheck": {
        "running": true,
        "scheduled": true,
        "nextDate": "2025-10-11T10:00:00.000Z"
      }
    }
  }
}
```

## Security Features

### Authentication
- All endpoints require valid JWT tokens
- Role-based access control (SUPER_ADMIN vs ADMIN)

### Data Protection
- Complete data isolation between admins
- Secure bill generation with proper validation
- Protected cron job endpoints

## Performance

### Optimization
- Efficient database queries with proper indexing
- Batch processing for multiple tenants
- Minimal memory footprint for cron jobs

### Scalability
- Handles large numbers of tenants efficiently
- Database connection pooling
- Graceful error handling for high-volume scenarios

## Maintenance

### Database Migration
The feature includes a migration script to add required columns:
```bash
node scripts/addBillColumns.js
```

### Logging
- Comprehensive logging for all bill generation activities
- Error tracking and debugging information
- Performance metrics and statistics

## Future Enhancements

### Potential Features
- Email notifications for generated bills
- PDF generation for bills
- Multiple language support
- Customizable due dates
- Utility charge calculations
- Payment tracking integration

---

## Quick Start

1. **Start the server** - Cron jobs initialize automatically
2. **Create tenants and properties** - Ensure active tenants exist
3. **Test generation** - Use `/api/test/generate-bills` for testing
4. **Monitor status** - Check `/api/cron/status` for job health
5. **View bills** - Access generated bills via `/api/bills`

The system is now ready for automatic monthly bill generation! 🎉
