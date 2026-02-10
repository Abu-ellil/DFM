# Database Seed Scripts

This directory contains seed scripts that populate the database with sample/demo data for testing purposes.

## Overview

The seed scripts create realistic sample data for the Dates Factory Manager application, including:

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

Before running any seed script, ensure you have:

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

## Seed Scripts

### Option 1: Simple Sample Data Generator (Recommended for Testing)

Creates a sample data JSON file that can be used to populate the database:

```bash
npm run seed:simple
```

This script creates `sample-data.json` with all sample data in a structured format that can be used to:

- Manually import data into the database
- Understand the data structure
- Use as a reference for custom data

### Option 2: Full Database Seeder (For Production)

Uses the existing sync API to populate the database with sample data:

```bash
npm run seed
```

This script:

- Creates all required database tables
- Inserts realistic sample data
- Creates test user accounts

## Sample Data Details

### Customers

The seed scripts create 15 customers with realistic Arabic names including:

- Companies (شركة, مؤسسة)
- Individuals (فرد)

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

### Supervisors

5 staff members for supervision

### Daily Prices

30 days of price records with realistic price variations around 150 SAR per qantar

### Weighbridge Records

Approximately 50 weight transactions spread across the last 30 days:

- Random customers and date types
- Net weights between 1000-5000 kg
- Prices between 130-170 SAR per qantar
- Crate counts between 10-100

### Crates Records

Approximately 40 crate tracking records:

- Random customers and crate types
- Crates out: 10-200
- Crates returned: 0 to crates out

### Finance Records

Approximately 60 financial transactions:

- Transaction types: دفع (payment), استلام (receipt), سداد (settlement), خصم (discount)
- Amounts between 1000-20000 SAR

### Auth Users

3 test user accounts with password: `password123`

| Phone Number | Password    | Full Name   | Factory Name         |
| ------------ | ----------- | ----------- | -------------------- |
| 0500000001   | password123 | مدير النظام | مصنع التمور التجريبي |
| 0500000002   | password123 | أحمد المدير | مصنع النخيل          |
| 0500000003   | password123 | محمد المشرف | مصنع الواحة          |

## Re-running Seed Scripts

You can safely re-run the seed scripts multiple times. They will:

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

If you encounter connection errors, verify:

- Your Neon database URL is correct
- Your database project exists
- You have the correct permissions

### "relation does not exist" Errors

If you see table not found errors, the scripts will:

- Create tables automatically on first run
- Skip table creation on subsequent runs

## Customizing Sample Data

You can modify the sample data arrays at the top of the seed scripts to add your own data:

```javascript
const sampleCustomers = [
  { name: 'Your Customer Name', type: 'شركة', phone: '0501234567' }
  // Add more customers...
]
```

## Cleaning the Database

To remove all seed data and start fresh, you can drop and recreate tables:

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

For issues or questions about the seed scripts, please refer to the main project documentation or create an issue in the project repository.
