# Web Application Deployment Guide

This guide will help you deploy the Dates Factory Manager web application to Vercel.

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18+ installed
- ✅ Vercel account (free at https://vercel.com)
- ✅ Git repository with your code
- ✅ Environment variables ready

## 🚀 Deployment Steps

### Step 1: Install Dependencies

```bash
cd vercel-api
npm install
```

This will install all required packages including Next.js, React, and Tailwind CSS.

### Step 2: Set Environment Variables

Create a `.env.local` file for local development:

```bash
NEXT_PUBLIC_API_URL=https://dfm-mu.vercel.app
```

For production deployment, you'll set these in Vercel dashboard.

### Step 3: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to test the application:

- Landing page at `/`
- Login at `/login`
- Register at `/register`
- Dashboard at `/dashboard`
- Admin panel at `/admin`

### Step 4: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**

   ```bash
   vercel login
   ```

3. **Deploy:**

   ```bash
   vercel deploy --prod
   ```

4. **Follow the prompts:**
   - Set up and deploy? → `Y`
   - Which scope? → Select your account
   - Link to existing project? → `N` (for new project)
   - What's your project's name? → `dfm-mu-web`
   - In which directory is your code located? → `./`
   - Want to modify these settings? → `N`

#### Option B: Using Vercel Dashboard

1. **Go to Vercel Dashboard:**
   https://vercel.com/new

2. **Import Repository:**
   - Select your Git repository
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `./vercel-api` (if deploying from parent)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

4. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add: `NEXT_PUBLIC_API_URL` = `https://dfm-mu.vercel.app`
   - Click "Save"

5. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete

### Step 5: Configure Domain (Optional)

#### Use Default Vercel Domain

Your app will be available at:

```
https://your-project-name.vercel.app
```

#### Use Custom Domain

1. **Go to Vercel Dashboard** → Your Project → Settings → Domains
2. **Add Domain:** Enter your custom domain (e.g., `app.datesfactory.com`)
3. **Update DNS:** Follow Vercel's instructions to update DNS records
4. **Wait:** DNS propagation may take up to 24 hours

## 🔧 Environment Variables

### Required Variables

| Variable              | Description            | Example                     |
| --------------------- | ---------------------- | --------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL for API calls | `https://dfm-mu.vercel.app` |

### Setting Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Click "Add New"
3. Enter variable name and value
4. Select environments (Production, Preview, Development)
5. Click "Save"
6. **Redeploy** to apply changes

## 🧪 Testing After Deployment

### 1. Test Landing Page

Visit your deployed URL and verify:

- ✅ Page loads without errors
- ✅ All features are visible
- ✅ Links work correctly
- ✅ Responsive design works

### 2. Test Authentication

- **Login:**

  ```bash
  # Test with valid credentials
  curl -X POST https://your-app.vercel.app/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test123"}'
  ```

- **Register:**
  ```bash
  curl -X POST https://your-app.vercel.app/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"username":"newuser","email":"user@test.com","password":"pass123","factoryName":"Test Factory"}'
  ```

### 3. Test Dashboard

- Login with valid credentials
- Navigate to `/dashboard`
- Verify statistics display
- Test refresh functionality

### 4. Test Admin Panel

- Login with admin credentials
- Navigate to `/admin`
- Test all tabs (Overview, Users, Licenses, Factories, Settings)
- Verify data displays correctly

## 📊 Monitoring

### View Logs

```bash
vercel logs --prod
```

Or in Vercel Dashboard:

- Your Project → Logs

### View Analytics

Go to Vercel Dashboard → Your Project → Analytics

Monitor:

- Page views
- Unique visitors
- Top pages
- Performance metrics

## 🔄 Updates and Redeployment

### Make Changes

1. Update code locally
2. Test changes: `npm run dev`
3. Commit to Git
4. Deploy: `vercel deploy --prod`

### Automatic Deployments

If connected to Git:

- Push to main branch → Automatic production deployment
- Push to other branches → Preview deployment

## 🐛 Troubleshooting

### Issue: Build Fails

**Error:** `Module not found`

**Solution:**

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Issue: Environment Variables Not Working

**Error:** API requests failing

**Solution:**

1. Check variable names (must start with `NEXT_PUBLIC_`)
2. Verify values are correct
3. Redeploy after adding variables
4. Check browser console for errors

### Issue: Styles Not Loading

**Error:** Unstyled pages

**Solution:**

1. Verify `globals.css` is imported in `layout.tsx`
2. Check Tailwind configuration
3. Clear browser cache
4. Rebuild: `npm run build`

### Issue: 404 Errors

**Error:** Page not found

**Solution:**

1. Check file structure matches Next.js App Router
2. Verify page files are in `app/` directory
3. Check file names (lowercase, no spaces)
4. Ensure `page.tsx` exists in each route folder

### Issue: Authentication Fails

**Error:** Login not working

**Solution:**

1. Verify API endpoints exist in `api/` directory
2. Check API URL in environment variables
3. Test API directly with curl
4. Check browser console for error messages
5. Verify localStorage is enabled

## 📈 Performance Optimization

### Enable Image Optimization

Next.js automatically optimizes images. Use the `Image` component:

```tsx
import Image from 'next/image'

;<Image src="/logo.png" alt="Logo" width={200} height={200} />
```

### Enable Font Optimization

Use `next/font/google` for optimized fonts:

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
```

### Enable Analytics

Add Vercel Analytics:

```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 🔒 Security Checklist

Before going to production:

- [ ] Environment variables are set (not hardcoded)
- [ ] HTTPS is enforced
- [ ] Authentication is working
- [ ] Input validation is in place
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled (if needed)
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date
- [ ] Secrets are not in Git

## 📝 Post-Deployment

### 1. Set Up Monitoring

- Configure error tracking (Sentry, LogRocket, etc.)
- Set up uptime monitoring
- Configure performance monitoring

### 2. Set Up Backups

- Database backups (if applicable)
- Configuration backups
- Code repository backups

### 3. Documentation

- Update user documentation
- Document API endpoints
- Create troubleshooting guide

### 4. Support

- Set up support channels
- Create FAQ
- Prepare contact information

## 🎯 Next Steps

After successful deployment:

1. **Monitor First Week**
   - Check logs daily
   - Monitor performance
   - Gather user feedback

2. **Collect Metrics**
   - Track user engagement
   - Monitor conversion rates
   - Analyze usage patterns

3. **Plan Improvements**
   - Based on user feedback
   - Based on analytics
   - Based on performance data

4. **Scale as Needed**
   - Upgrade Vercel plan if needed
   - Add more features
   - Expand to more users

## 📞 Support

If you encounter issues during deployment:

1. Check Vercel deployment logs
2. Review this guide's troubleshooting section
3. Check Vercel documentation: https://vercel.com/docs
4. Contact support: support@datesfactory.com
5. WhatsApp: +201221089249

## ✅ Deployment Checklist

Before marking deployment as complete:

- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Application tested locally
- [ ] Build succeeds without errors
- [ ] Deployed to Vercel
- [ ] Production URL accessible
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Dashboard functions properly
- [ ] Admin panel works
- [ ] API endpoints responding
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Monitoring configured
- [ ] Documentation updated

Congratulations! Your web application is now live! 🎉
