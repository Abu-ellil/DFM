# License Key Registration Guide

## Problem

The license key created at https://dates-factory-manager-cloud.vercel.app/admin is not working in the desktop app because the Vercel API doesn't have a record of the license key mapping to the machine ID.

## Solution

You need to register the license key in the Vercel API database using the registration script.

## Steps

### 1. Get Your Machine ID

1. Open the desktop app
2. Go to the Activation Screen (you'll see it if the app is not activated)
3. Copy your Machine ID (16 characters)

### 2. Register the License Key

Run the registration script with your license key and machine ID:

```bash
cd vercel-api
node register-license.js <LICENSE_KEY> <MACHINE_ID> [FACTORY_NAME] [DURATION_CODE] [EXPIRY_DATE]
```

**Example:**

```bash
node register-license.js ABCD-1234-EFGH-5678-4D MYMACHINEID "My Factory" "4D" "2024-12-31T23:59:59Z"
```

**Parameters:**

- `LICENSE_KEY` - The license key you created at the admin panel (format: XXXX-XXXX-XXXX-XXXX-DD)
- `MACHINE_ID` - Your machine ID from the desktop app (16 characters)
- `FACTORY_NAME` - Factory name (optional)
- `DURATION_CODE` - Duration code (optional, e.g., "4D" for 4 days, "1Y" for 1 year)
- `EXPIRY_DATE` - Expiry date in ISO 8601 format (optional)

### 3. Activate the License in Desktop App

1. Open the desktop app
2. Go to the Activation Screen
3. Enter your license key
4. Click "تفعيل التطبيق" (Activate App)

## How It Works

1. **License Key Format**: `XXXX-XXXX-XXXX-XXXX-DD`
   - First 4 parts: Hash of `machineId|durationCode|SECRET_KEY`
   - Last part: Duration code (e.g., "4D", "1Y")

2. **Registration Process**:
   - The admin panel creates a license key
   - The license key is registered in the Vercel API database
   - The Vercel API stores the mapping between the license key and machine ID
   - The desktop app validates the license key locally
   - The sync API uses the license key to authenticate and identify the factory

3. **Sync Authentication**:
   - Desktop app sends license key in `Authorization: Bearer <license-key>` header
   - Vercel API looks up the machine ID from the database
   - Vercel API connects to the factory's Neon database

## Troubleshooting

### License key not found

Make sure you've registered the license key using the registration script:

```bash
node register-license.js <LICENSE_KEY> <MACHINE_ID>
```

### License key expired

If the license key has an expiry date and it has passed, you need to create a new license key or update the expiry date in the database.

### Invalid license key format

Make sure the license key follows the format: `XXXX-XXXX-XXXX-XXXX-DD` (5 parts, each 4 characters).

### Machine ID mismatch

The machine ID in the database must match the machine ID of the desktop app. You can get the machine ID from the Activation Screen in the desktop app.

## API Endpoint

You can also register license keys directly via the API:

```bash
curl -X POST https://dates-factory-manager-cloud.vercel.app/api/license/register \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "ABCD-1234-EFGH-5678-4D",
    "machineId": "MYMACHINEID",
    "factoryName": "My Factory",
    "durationCode": "4D",
    "expiryDate": "2024-12-31T23:59:59Z"
  }'
```

## Admin Panel Integration

If you have access to the admin panel code, you can integrate the license key registration directly:

```javascript
// When creating a license key in the admin panel
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
