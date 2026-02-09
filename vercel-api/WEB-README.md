# Dates Factory Manager - Web Application

A modern Next.js web application for managing dates factory operations with user dashboard and admin panel.

## 🚀 Features

### User Dashboard

- **Overview Statistics** - Real-time view of customers, weighbridge records, crates, and financial data
- **Quick Actions** - Fast access to common tasks
- **Recent Activity** - Track latest operations
- **Sync Status** - Monitor cloud synchronization

### Admin Panel

- **User Management** - Add, edit, and delete users
- **License Management** - Generate and manage license keys
- **Factory Management** - Configure and monitor factory locations
- **System Settings** - Configure application settings
- **System Status** - Monitor API, database, and sync health

### Authentication

- **Login** - Secure user authentication
- **Registration** - New user onboarding
- **Role-based Access** - Admin, Manager, and User roles

## 📁 Project Structure

```
vercel-api/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout with navigation
│   ├── page.tsx              # Landing page
│   ├── globals.css           # Global styles
│   ├── login/               # Login page
│   ├── register/             # Registration page
│   ├── dashboard/            # User dashboard
│   └── admin/               # Admin panel
├── components/               # Reusable components
│   └── Navigation.tsx        # Main navigation bar
├── lib/                    # Utilities and API client
│   └── api.ts               # API client library
├── api/                    # Existing API endpoints
│   ├── auth/                # Authentication endpoints
│   ├── license/              # License management
│   └── sync/                # Sync endpoints
├── public/                  # Static assets
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

## 🛠️ Installation

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Setup

1. **Install dependencies:**

   ```bash
   cd vercel-api
   npm install
   ```

2. **Set environment variables:**
   Create a `.env.local` file:

   ```bash
   NEXT_PUBLIC_API_URL=https://dfm-mu.vercel.app
   ```

3. **Run development server:**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🚢 Deployment

### Deploy to Vercel

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

### Environment Variables

Set these in Vercel project settings:

- `NEXT_PUBLIC_API_URL` - Your API base URL (e.g., `https://dfm-mu.vercel.app`)

## 📊 Available Pages

- `/` - Landing page with features overview
- `/login` - User login
- `/register` - New user registration
- `/dashboard` - User dashboard with statistics
- `/admin` - Admin panel with management tools

## 🔐 Authentication Flow

1. **Login:**
   - User enters username and password
   - Credentials validated against `/api/auth/login`
   - JWT token stored in localStorage
   - Redirect based on user role (admin → /admin, user → /dashboard)

2. **Registration:**
   - User fills registration form
   - Data sent to `/api/auth/register`
   - Account created
   - Redirect to login page

3. **Protected Routes:**
   - API client checks for token in localStorage
   - Token included in Authorization header
   - 401 responses redirect to login

## 🎨 Styling

The application uses **Tailwind CSS** with a custom color scheme:

- **Primary Color:** Orange (#f48020)
- **Success:** Green
- **Warning:** Yellow
- **Error:** Red

### Customization

Edit `tailwind.config.js` to customize colors and theme:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          // Your custom colors
        }
      }
    }
  }
}
```

## 🔌 API Integration

The application includes a comprehensive API client (`lib/api.ts`) with:

- **Authentication** - Login, register, logout
- **Sync** - Push, pull, full sync operations
- **Dashboard** - Statistics and activity
- **Customers** - CRUD operations
- **Weighbridge** - Record management
- **Finance** - Financial tracking
- **Admin** - User and license management

### Usage Example

```typescript
import { dashboardApi } from '@/lib/api'

// Get dashboard stats
const stats = await dashboardApi.getStats()

// Get recent activity
const activity = await dashboardApi.getRecentActivity(10)
```

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

## 🔧 Development

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Lint Code

```bash
npm run lint
```

## 🐛 Troubleshooting

### Issue: "Cannot find module 'next'"

**Solution:** Run `npm install` to install dependencies

### Issue: API requests failing

**Solution:** Check that `NEXT_PUBLIC_API_URL` is set correctly in environment variables

### Issue: Authentication not persisting

**Solution:** Ensure localStorage is enabled in your browser settings

### Issue: Styles not loading

**Solution:** Verify Tailwind CSS is configured correctly and `globals.css` is imported in `layout.tsx`

## 📈 Performance

- **First Contentful Paint (FCP):** < 1.5s
- **Time to Interactive (TTI):** < 3.5s
- **Cumulative Layout Shift (CLS):** < 0.1

## 🔒 Security

- JWT-based authentication
- Role-based access control
- HTTPS-only communication
- Input validation and sanitization
- SQL injection prevention
- XSS protection

## 📝 License

Proprietary - All rights reserved

## 📞 Support

For issues or questions:

- Email: support@datesfactory.com
- WhatsApp: +201221089249

## 🎯 Roadmap

- [ ] Real-time notifications
- [ ] Advanced reporting with charts
- [ ] Mobile app integration
- [ ] Multi-language support (Arabic)
- [ ] Dark mode
- [ ] Data export functionality
- [ ] Advanced analytics
