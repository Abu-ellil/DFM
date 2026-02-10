# Database Seed Script

This directory contains a seed script that populates the database with sample/demo data for testing purposes.

## Overview

The seed script (`seed-database.js`) creates realistic sample data for the Dates Factory Manager application, including:

- **15 Customers** - Arabic names and companies (individuals and businesses)
- **8 Date Types** - Various date varieties (Sukari, Majdool, etc.)
- **4 Crate Types** - Different crate sizes and weights
- **5 Supervisors** - Staff members
- **30 Daily Prices** - Price records for the last 30 days
- **~50 Weighbridge Records** - Weight transactions
- **~40 Crates Records** - Crate tracking records
- **~60 Finance Records** - Financial transactions
- **3 Auth Users** - Test user accounts (password: `password123`)

## Prerequisites

Before running the seed script, ensure you have:

1. Node.js 18+ installed
2. A Neon database account and project
3. The `NEON_DATABASE_URL` environment variable set

## Setup

1. **Copy the `.env.example` file to `.env`:**

   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file and add your Neon database URL:**

   ```env
   NEON_DATABASE_URL=postgresql://neondb_owner:your-password@ep-your-project-id.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

   Get your database URL from the [Neon Console](https://console.neon.tech).

## Running the Seed Script

### Option 1: Using npm script (Recommended)

```bash
npm run seed
```

### Option 2: Direct execution

```bash
node seed-database.js
```

## Test User Accounts

After running the seed script, you can log in with these test accounts:

| Phone Number | Password | Full Name | Factory Name |
|--------------|----------|-----------|--------------|
| 0500000001 | password123 | مدير النظام | مصنع التمور التجريبي |
| 0500000002 | password123 | أحمد المدير | مصنع النخيل |
| 0500000003 | password123 | محمد المشرف | مصنع الواحة |

## Sample Data Details

### Customers
The seed script creates 15 customers with realistic Arabic names including:
- Companies (شركة, مؤسسة)
- Individuals (فرد)
- Phone numbers

### Date Types
8 common date varieties:
- تمر سكري (Sukari)
- تمر مجدول (Majdool)
- تمر برحي (Barhi)
- تمر خضري (Khodri)
- تمر صفوي (Safawi)
- تمر عجوة (Ajwa)
- تمر مبروم (Mabroom)
- تمر سوقي (Sooqi)

### Crate Types
4 crate types with different weights:
- صندوق كبير (Large crate): 25.0 kg (default)
- صندوق متوسط (Medium crate): 15.0 kg
- صندوق صغير (Small crate): 10.0 kg
- صندوق خاص (Special crate): 30.0 kg

### Daily Prices
30 days of price records with realistic price variations around 150 SAR per qantar.

### Weighbridge Records
Approximately 50 weight transactions spread across the last 30 days with:
- Random customers and date types
- Net weights between 1000-5000 kg
- Prices between 130-170 SAR per qantar
- Crate counts between 10-100

### Crates Records
Approximately 40 crate tracking records with:
- Random customers and crate types
- Crates out: 10-200
- Crates returned: 0 to crates out

### Finance Records
Approximately 60 financial transactions with:
- Transaction types: دفع (payment), استلام (receipt), سداد (settlement), خصم (discount)
- Amounts between 1000-20000 SAR

## Re-running the Seed Script

You can safely re-run the seed script multiple times. It will:
- Create new records if they don't exist
- Skip duplicate entries (based on unique constraints)
- Update existing records if needed

## Troubleshooting

### "NEON_DATABASE_URL environment variable is not set"

Make sure you have created a `.env` file with your database URL:

```bash
cp .env.example .env
# Then edit .env and add your NEON_DATABASE_URL
```

### Connection Errors

Verify your Neon database URL is correct:
- Check the password
- Verify the project ID
- Ensure the database exists

### "Relation does not exist" Errors

The seed script automatically creates all required tables. If you encounter table errors, ensure you have the necessary permissions to create tables in your Neon database.

## Customizing the Seed Data

You can modify the sample data arrays at the top of `seed-database.js`:

```javascript
const sampleCustomers = [
  { name: 'Your Customer Name', type: 'شركة', phone: '0501234567' },
  // Add more customers...
]
```

## Cleaning the Database

To remove all seed data and start fresh, you can drop and recreate the tables:

```sql
DROP TABLE IF EXISTS weighbridge CASCADE;
DROP TABLE IF EXISTS crates CASCADE;
DROP TABLE IF EXISTS finance CASCADE;
DROP TABLE IF EXISTS daily_prices CASCADE;
DROP TABLE IF EXISTS crate_types CASCADE;
DROP TABLE IF EXISTS date_types CASCADE;
DROP TABLE IF EXISTS supervisors CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS auth_users CASCADE;
DROP TABLE IF EXISTS license_keys CASCADE;
```

Then re-run the seed script.

## Support

For issues or questions about the seed script, please refer to the main project documentation or create an issue in the project repository.
