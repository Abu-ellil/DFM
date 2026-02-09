# License Key Authentication Fix

## Problem

The license key created at https://dates-factory-manager-cloud.vercel.app/admin was not working in the desktop app because:

1. The license key format uses a SHA256 hash that cannot be reversed to extract the machine ID
2. The Vercel API's `validateLicense()` function was trying to extract the machine ID from the hash, which is impossible
3. The sync endpoints use `withLicenseAuth` middleware, which calls `validateLicense()`, and this was failing

## Solution

Created a database-backed license key registration system:

1. **Database Table**: Created `license_keys` table to store the mapping between license keys and machine IDs
2. **Registration API**: Created `/api/license/register` endpoint to register license keys
3. **Updated Validation**: Modified `extractMachineIdFromLicense()` to query the database instead of trying to decode the hash
4. **Registration Script**: Created `register-license.js` script to easily register license keys

## Changes Made

### 1. Updated `vercel-api/src/lib/auth.ts`

- Added `initializeLicenseTable()` function to create the `license_keys` table
- Added `registerLicenseKey()` function to register license keys in the database
- Updated `extractMachineIdFromLicense()` to query the database for the machine ID
- Updated `extractFactoryName()` to query the database for the factory name
- Removed `getMachineIdFromLicenseKey()` function (no longer needed)

### 2. Created `vercel-api/api/license/register.ts`

- New API endpoint to register license keys
- Accepts license key, machine ID, factory name, duration code, and expiry date
- Validates license key format
- Stores the mapping in the database

### 3. Created `vercel-api/register-license.js`

- Command-line script to register license keys
- Usage: `node register-license.js <LICENSE_KEY> <MACHINE_ID> [FACTORY_NAME] [DURATION_CODE] [EXPIRY_DATE]`

### 4. Created `vercel-api/LICENSE_KEY_SETUP.md`

- Detailed instructions on how to register license keys
- Troubleshooting guide
- API endpoint documentation

## How to Use

### For Users

1. Get your machine ID from the desktop app's Activation Screen
2. Run the registration script:
   ```bash
   cd vercel-api
   node register-license.js <LICENSE_KEY> <MACHINE_ID>
   ```
3. Activate the license in the desktop app

### For Developers

If you have access to the admin panel code, integrate the registration:

```javascript
async function createLicenseKey(machineId, factoryName, durationCode) {
  // Generate the license key
  const licenseKey = generateLicenseKey(machineId, durationCode)

  // Register it in the Vercel API
  await fetch('https://dates-factory-manager-cloud.vercel.app/api/license/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      licenseKey,
      machineId,
      factoryName,
      durationCode,
      expiryDate: calculateExpiryDate(durationCode)
    })
  })

  return licenseKey
}
```

## Database Schema

```sql
CREATE TABLE license_keys (
  id SERIAL PRIMARY KEY,
  license_key VARCHAR(20) UNIQUE NOT NULL,
  machine_id VARCHAR(20) NOT NULL,
  factory_name VARCHAR(100),
  duration_code VARCHAR(5),
  expiry_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_license_keys_key ON license_keys(license_key);
CREATE INDEX idx_license_keys_machine_id ON license_keys(machine_id);
```

## License Key Format

Format: `XXXX-XXXX-XXXX-XXXX-DD`

- First 4 parts (16 characters): SHA256 hash of `machineId|durationCode|SECRET_KEY`, truncated to 16 characters
- Last part (2 characters): Duration code (e.g., "4D", "1Y")

## Authentication Flow

1. Desktop app generates a license key using the machine ID and secret key
2. License key is registered in the Vercel API database
3. Desktop app validates the license key locally (hash verification)
4. Desktop app sends license key in `Authorization: Bearer <license-key>` header for sync operations
5. Vercel API looks up the machine ID from the database
6. Vercel API connects to the factory's Neon database

## Testing

To test the fix:

1. Get your machine ID from the desktop app
2. Register a license key:
   ```bash
   cd vercel-api
   node register-license.js ABCD-1234-EFGH-5678-4D YOUR_MACHINE_ID
   ```
3. Activate the license in the desktop app
4. Try to sync data

## Deployment

The changes are ready to deploy to Vercel. The `license_keys` table will be automatically created on the first API call.

## Security Considerations

- The license key contains a hash that cannot be reversed
- The machine ID is stored in the database, not the hash
- The secret key is only used for local validation in the desktop app
- The Vercel API only needs the license key to look up the machine ID

## Future Improvements

1. Add admin panel integration to automatically register license keys when created
2. Add license key management API (list, update, delete)
3. Add license key usage tracking
4. Add rate limiting for license key registration
5. Add webhook notifications for license key events
