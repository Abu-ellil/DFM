# DFM V2 - Dates Factory Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-39.2.6-blue)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.2.1-cyan)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)

A comprehensive desktop application for managing dates factory operations, featuring cloud sync, web dashboard access, and multi-platform support.

## Features

### Core Functionality
- **Customer Management**: Track customer information and history
- **Weighbridge Operations**: Record and manage weighbridge transactions
- **Crates Tracking**: Monitor crate inventory and movements
- **Finance Management**: Track financial transactions and reports
- **Excel Export**: Export all data to Excel format (.xlsx)

### Advanced Features
- **Cloud Sync**: Offline-first bidirectional synchronization with automatic background sync
- **Web Dashboard**: Remote access via modern Next.js web application
- **Telegram Integration**: Send notifications and updates via Telegram bot
- **Machine ID Licensing**: Secure license key system tied to hardware
- **Multi-Language**: Full Arabic (RTL) and English interface support

### Technical Highlights
- Built with **Electron 39**, **React 19**, and **TypeScript 5.9**
- **SQLite** database with **SQL.js** for embedded storage
- **Zustand** for state management
- **Tailwind CSS + shadcn/ui** for modern UI
- **Vercel** serverless API with **Neon PostgreSQL**
- JWT-based authentication with bcrypt password hashing

## Screenshots

![Desktop Application](docs/images/desktop-app.png)
*Desktop Application - Arabic Interface*

![Web Dashboard](docs/images/web-dashboard.png)
*Web Dashboard - Factory Overview*

## Installation

### Download Installers

Download the appropriate installer for your platform from the [Releases](https://github.com/Abu-ellil/DFM-V2/releases) page:

- **Windows**: `DFM V2-1.1.4-setup.exe` (NSIS installer)
- **macOS**: `DFM V2-1.1.4.dmg` (Disk image)
- **Linux**: `DFM V2-1.1.4.AppImage` (Universal) or `DFM V2-1.1.4.deb` (Debian/Ubuntu)

### Windows Installation

1. Download `DFM V2-1.1.4-setup.exe`
2. Run the installer
3. Follow the installation wizard
4. Launch from Desktop or Start Menu

### macOS Installation

1. Download `DFM V2-1.1.4.dmg`
2. Open the disk image
3. Drag DFM V2 to Applications folder
4. Launch from Applications

### Linux Installation

**AppImage (Universal):**
```bash
chmod +x "DFM V2-1.1.4.AppImage"
./"DFM V2-1.1.4.AppImage"
```

**Debian/Ubuntu:**
```bash
sudo dpkg -i "DFM V2-1.1.4.deb"
sudo apt-get install -f  # Fix dependencies if needed
```

## Development

### Prerequisites

- Node.js 18+ and npm
- Git
- (Optional) For macOS builds: macOS with Xcode
- (Optional) For Linux builds: Docker or Linux dependencies

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/Abu-ellil/DFM-V2.git
cd DFM-V2
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run in development mode:**
```bash
npm run dev
```

4. **Build for production:**
```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

5. **Run tests:**
```bash
npm test
```

### Project Structure

```
DFM-V2/
├── src/
│   ├── main/           # Electron main process
│   │   ├── db.ts       # SQLite database
│   │   ├── sync/       # Cloud sync logic
│   │   └── index.ts    # Main entry point
│   ├── preload/        # Electron preload scripts
│   └── renderer/       # React frontend
│       ├── pages/      # Application pages
│       ├── components/ # Reusable components
│       └── store/      # Zustand state
├── build/              # Build resources (icons, etc.)
├── release/            # Built installers (output)
└── electron-builder.yml # Build configuration
```

## Cloud Sync Setup

The cloud sync feature enables automatic synchronization of data across devices and web dashboard access.

### Requirements

1. **Neon PostgreSQL Database**: Sign up at [https://neon.tech](https://neon.tech)
2. **Vercel Account**: Sign up at [https://vercel.com](https://vercel.com)
3. **License Key**: Contact support to obtain a license key

### Backend Setup (vercel-api)

1. **Navigate to the API directory:**
```bash
cd vercel-api
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```
CENTRAL_AUTH_DB_URL=postgresql://user:password@host/database
JWT_SECRET=your-secret-key-here
NEON_DB_URL=postgresql://user:password@host/database
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

4. **Deploy to Vercel:**
```bash
vercel link
vercel env add CENTRAL_AUTH_DB_URL
vercel env add JWT_SECRET
vercel env add NEON_DB_URL
vercel env add TELEGRAM_BOT_TOKEN
vercel --prod
```

### Web App Setup (web-app)

1. **Navigate to the web app directory:**
```bash
cd web-app
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your deployed API URL:
```
NEXT_PUBLIC_API_URL=https://your-vercel-app.vercel.app
```

4. **Deploy to Vercel:**
```bash
vercel link
vercel --prod
```

### Enable Cloud Sync in Desktop App

1. Open DFM V2 desktop application
2. Go to Settings → Cloud Sync
3. Enter your phone number and password
4. Click "Enable Cloud Sync"
5. Your web account will be automatically created

### Access Web Dashboard

1. Visit your deployed web app URL
2. Login with your phone number and password
3. Access your factory data from anywhere

## Usage

### Adding Customers

1. Navigate to "Customers" page
2. Click "Add Customer"
3. Fill in customer details
4. Save

### Recording Weighbridge Transactions

1. Go to "Weighbridge" page
2. Enter vehicle details and weight
3. Select customer
4. Save transaction

### Managing Crates

1. Access "Crates" page
2. Add new crate entries
3. Track crate movements
4. View inventory reports

### Exporting to Excel

1. Navigate to any data page (Customers, Weighbridge, etc.)
2. Click "Export to Excel" button
3. Choose save location
4. Export complete

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - Login with phone + password
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/register` - Register web user

### Factory Data Endpoints

- `GET /api/factories/:machineId/customers` - Get factory customers
- `GET /api/factories/:machineId/weighbridge` - Get weighbridge transactions
- `GET /api/factories/:machineId/crates` - Get crates entries
- `GET /api/factories/:machineId/finance` - Get finance transactions
- `GET /api/factories/:machineId/stats` - Get factory statistics

### Admin Endpoints

- `GET /api/admin/factories` - List all factories
- `GET /api/admin/users` - List all factory users
- `POST /api/admin/users` - Create new factory user
- `GET /api/admin/stats` - Get platform statistics

## Testing

The project includes comprehensive tests covering all major functionality:

- **Database Operations**: CRUD operations for all entities
- **Sync Flow**: Cloud synchronization logic
- **Authentication**: Login and token verification
- **API Endpoints**: All backend endpoints

Run tests:
```bash
npm test
```

## Troubleshooting

### Build Issues

**Windows:**
- Ensure Windows Build Tools are installed
- Run as Administrator if needed

**macOS:**
- Ensure Xcode command line tools are installed: `xcode-select --install`
- Code signing may be required for distribution

**Linux:**
- Install build dependencies: `sudo apt-get install build-essential`
- For AppImage, ensure `fuse` is installed

### Runtime Issues

**Database Errors:**
- Check file permissions for app data directory
- Ensure sufficient disk space

**Cloud Sync Issues:**
- Verify internet connection
- Check API URL in settings
- Ensure license key is valid

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/Abu-ellil/DFM-V2/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Abu-ellil/DFM-V2/discussions)
- **Email**: support@example.com

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Database powered by [Neon](https://neon.tech/)
- Hosting by [Vercel](https://vercel.com/)

## Roadmap

### Upcoming Features

- [ ] Password reset functionality via email/SMS
- [ ] Two-factor authentication (2FA)
- [ ] Real-time notifications
- [ ] Dark mode support
- [ ] Mobile app (React Native)
- [ ] Advanced reporting and analytics
- [ ] Multi-factory support
- [ ] API rate limiting
- [ ] Activity logging and audit trail

---

**DFM V2** - Modern Dates Factory Management Solution

Made with ❤️ for dates factory owners
