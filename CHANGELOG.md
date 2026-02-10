# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.12] - 2026-02-10

### Fixed

- **Invisible Window Issue**: Added 10-second window show timeout and resilient initialization to ensure application window always appears even if background services fail.
- **Main Process Stability**: Implemented global error handlers for `uncaughtException` and `unhandledRejection` to prevent silent crashes.
- **Startup Resilience**: Improved error handling during database initialization and auto-updater configuration to prevent startup blocks.
- **CI/CD Compliance**: Fixed TypeScript and linting errors that were blocking build verification.

### Added

- **Production Logging**: Added a structured logging utility with timestamps and error stack traces for easier production debugging.

## [1.1.4] - 2025-01-28

### Added

- **Complete Cloud Sync System**: Offline-first bidirectional synchronization with automatic background sync
- **Web Dashboard**: Remote access via Next.js web application with JWT authentication
- **Multi-Platform Support**: Native installers for Windows, macOS, and Linux
- **Arabic Interface**: Full RTL (Right-to-Left) language support with Arabic translations
- **Telegram Integration**: Send notifications and updates via Telegram bot
- **Excel Export**: Export all data (customers, weighbridge, crates, finance) to Excel format
- **Machine ID Licensing**: License key system tied to machine hardware ID
- **Web Authentication**: Secure web-based access with bcrypt password hashing and JWT tokens
- **Admin Panel**: Platform-wide administration dashboard for managing all factories
- **SQLite Database**: Embedded database with SQL.js for local data storage

### Changed

- Built with React 19, TypeScript 5.9, and Electron 39 for modern performance
- Zustand for efficient state management
- Tailwind CSS + shadcn/ui for modern, responsive UI design
- Optimized build process with ASAR compression and maximum compression settings
- Filtered Electron locales to only English and Arabic to reduce bundle size

### Technical Details

- **Desktop App**: Electron-based desktop application with React renderer
- **Web App**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend API**: Vercel serverless API with Neon PostgreSQL
- **Database**: SQLite (local) + PostgreSQL (cloud)
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Build**: electron-builder with multi-platform support (Windows NSIS, macOS DMG, Linux AppImage/deb)
- **Testing**: 21/21 tests passed (100% success rate)

### Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens signed with secret key
- Route protection via middleware
- Factory data isolation by machine ID
- Token expiration (7 days)

### Documentation

- Comprehensive README with setup instructions
- API documentation for all endpoints
- Web implementation guide included
- Development setup guide

## [1.0.0] - Initial Release

### Added

- Initial release of Dates Factory Manager V2
- Basic CRUD operations for customers, weighbridge, crates, and finance
- Local SQLite database storage
- Arabic interface with RTL support
- Modern React-based UI

---

**Note**: Version 1.1.4 represents the first public GitHub release with complete feature set including cloud sync, web dashboard, and multi-platform support.
