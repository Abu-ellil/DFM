# Merge vercel-api into dfm-cloud

## ✅ Completed

### 1. Project Setup

- ✅ Created Next.js project structure
- ✅ Configured TypeScript, Tailwind CSS
- ✅ Set up App Router

### 2. API Routes Migration

- ✅ `src/app/api/auth/register/route.ts` - User registration
- ✅ `src/app/api/auth/login/route.ts` - User login
- ✅ `src/app/api/sync/push/route.ts` - Push changes to cloud
- ✅ `src/app/api/sync/pull/route.ts` - Pull changes from cloud
- ✅ `src/app/api/sync/restore/route.ts` - Restore data from cloud
- ✅ `src/app/api/sync/status/route.ts` - Health check

### 3. Shared Libraries

- ✅ `src/lib/neon.ts` - Neon database client (from vercel-api/src/lib/neon.ts)
- ✅ `src/lib/auth.ts` - License & auth utilities (from vercel-api/src/lib/auth.ts)
- ✅ `src/lib/types.ts` - TypeScript types (from vercel-api/src/lib/types.ts)

### 4. Web Dashboard (Basic)

- ✅ Home page (`src/app/page.tsx`)
- ✅ Dashboard page (`src/app/dashboard/page.tsx`)
- ✅ Layout and styling

### 5. Configuration

- ✅ `package.json` - Dependencies
- ✅ `tsconfig.json` - TypeScript config
- ✅ `next.config.mjs` - Next.js config
- ✅ `tailwind.config.js` - Tailwind config
- ✅ `postcss.config.js` - PostCSS config
- ✅ `.env.example` - Environment variables template
- ✅ `.gitignore` - Git ignore rules

## 📋 Next Steps

### 1. Install Dependencies

```bash
cd dfm-cloud
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your Neon database URL
```

### 3. Test Locally

```bash
npm run dev
```

### 4. Deploy to Vercel

```bash
# Using Vercel CLI
npm i -g vercel
vercel login
vercel --prod

# Or push to GitHub and deploy from Vercel dashboard
```

### 5. Update Electron App

Update `src/main/sync/api.ts` in the Electron app:

```typescript
// Old URL
const API_BASE = 'https://dates-factory-manager-cloud.vercel.app/api'

// New URL (after deployment)
const API_BASE = 'https://your-dfm-cloud.vercel.app/api'
```

## 🎯 Benefits

### Before (Separate)

```
vercel-api/          # Deployed separately
├── api/             # API endpoints
├── src/lib/         # Utilities
└── package.json

web-dashboard/       # Deployed separately (if exists)
├── pages/
└── package.json

Total: 2+ deployments, 2+ packages.json, duplicate code
```

### After (Unified)

```
dfm-cloud/          # Single deployment
├── src/app/api/    # API endpoints
├── src/app/        # Web dashboard
├── src/lib/        # Shared utilities
└── package.json    # Single package

Total: 1 deployment, 1 package.json, shared code
```

## 🔄 Comparison

| Feature       | vercel-api  | dfm-cloud |
| ------------- | ----------- | --------- |
| API Endpoints | ✅          | ✅        |
| Web Dashboard | ❌          | ✅        |
| Single Deploy | ❌          | ✅        |
| Shared Types  | ❌          | ✅        |
| Shared Utils  | ❌          | ✅        |
| Maintenance   | ⚠️ 2 repos  | ✅ 1 repo |
| Deployment    | ⚠️ Multiple | ✅ Single |

## 🚀 Deployment Commands

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Vercel Deployment

```bash
vercel --prod
```

## 📡 API Endpoints (Same as vercel-api)

All endpoints remain identical, just the base URL changes:

| Endpoint             | Old URL                                                    | New URL                                       |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| `/api/auth/register` | `dates-factory-manager-cloud.vercel.app/api/auth/register` | `your-dfm-cloud.vercel.app/api/auth/register` |
| `/api/auth/login`    | `dates-factory-manager-cloud.vercel.app/api/auth/login`    | `your-dfm-cloud.vercel.app/api/auth/login`    |
| `/api/sync/push`     | `dates-factory-manager-cloud.vercel.app/api/sync/push`     | `your-dfm-cloud.vercel.app/api/sync/push`     |
| `/api/sync/pull`     | `dates-factory-manager-cloud.vercel.app/api/sync/pull`     | `your-dfm-cloud.vercel.app/api/sync/pull`     |
| `/api/sync/restore`  | `dates-factory-manager-cloud.vercel.app/api/sync/restore`  | `your-dfm-cloud.vercel.app/api/sync/restore`  |
| `/api/sync/status`   | `dates-factory-manager-cloud.vercel.app/api/sync/status`   | `your-dfm-cloud.vercel.app/api/sync/status`   |

## ✨ Advantages

1. **Unified Deployment**: Deploy API and Dashboard together
2. **Code Reuse**: Share types, utilities, components
3. **Simplified Setup**: Single `package.json`, single build
4. **Better DX**: No need to switch between projects
5. **Cost Effective**: One Vercel project instead of multiple
6. **Easier Maintenance**: Update API and UI in one place

## 🧪 Testing After Deployment

```bash
# Health check
curl https://your-dfm-cloud.vercel.app/api/sync/status

# Register
curl -X POST https://your-dfm-cloud.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"0555555555","password":"password123","machine_id":"ABC1234567890123"}'

# Login
curl -X POST https://your-dfm-cloud.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0555555555","password":"password123"}'
```

## 📝 Notes

- The API endpoints are functionally identical to vercel-api
- All database tables and schemas remain the same
- The migration is complete and ready for deployment
- You can keep vercel-api for backward compatibility if needed
