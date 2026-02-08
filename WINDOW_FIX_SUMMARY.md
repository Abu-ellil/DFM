# Window Not Showing After Installation - Fix Summary

## Problem

After installing the Electron app on Windows, the application appears in Task Manager but doesn't open as a visible window.

## Root Causes Identified

1. **No Global Error Handling**: Uncaught exceptions in the main process would crash the app silently without any user feedback.

2. **Database Initialization Failure**: If database initialization failed, the app would throw an error before creating the window, leaving the app running in background without a UI.

3. **Window Show Dependency**: The window was created with `show: false` and only shown when the `ready-to-show` event fired. If there was an error loading the renderer content, this event would never fire, leaving the window invisible.

4. **No Logging Mechanism**: There was no way to diagnose what was happening during startup in production builds.

5. **Missing Error Handling**: Errors during window creation and content loading were not properly handled or communicated to the user.

## Changes Made

### 1. Added Global Error Handlers

```typescript
// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  logToConsole('UNCAUGHT EXCEPTION:', error)
  dialog.showErrorBox('Unexpected Error', error.message)
})

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logToConsole('UNHANDLED REJECTION:', reason)
})
```

### 2. Added Logging Utility

```typescript
function logToConsole(message: string, data?: any): void {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}`
  console.log(logMessage)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}
```

This helps diagnose issues in production by logging all key events with timestamps.

### 3. Added Window Show Timeout

```typescript
// Set up timeout to show window even if ready-to-show doesn't fire
windowShowTimeout = setTimeout(() => {
  logToConsole('Window show timeout triggered, showing window anyway')
  if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show()
  }
}, 5000) // 5 second timeout
```

This ensures the window appears even if the renderer fails to load.

### 4. Improved Error Handling in createWindow()

- Database initialization errors no longer prevent window creation
- Telegram bot startup errors don't block the app
- Window creation errors are caught and displayed to user
- Content loading errors are caught and handled
- Added `did-fail-load` event handler to detect renderer load failures

### 5. Enhanced App Initialization

```typescript
app
  .whenReady()
  .then(async () => {
    try {
      // All initialization code wrapped in try-catch
      await createWindow()
      // ...
    } catch (error) {
      dialog.showErrorBox('Startup Error', error.message)
    }
  })
  .catch((error) => {
    dialog.showErrorBox('Startup Error', error.message)
  })
```

### 6. Added Cleanup on Quit

```typescript
app.on('before-quit', () => {
  // Clear window show timeout
  if (windowShowTimeout) {
    clearTimeout(windowShowTimeout)
    windowShowTimeout = null
  }
})
```

## How to Rebuild the App

1. **Clean previous build**:

   ```bash
   cd DFM
   rm -rf release out
   ```

2. **Build the application**:

   ```bash
   npm run build:win
   ```

3. **Test the build**:
   - Navigate to the `release` directory
   - Run the installer or portable executable
   - Check if the window appears
   - If issues persist, check the console logs (you can view them by opening DevTools with F12 in development, or check Windows Event Viewer)

## Testing Checklist

- [ ] App window appears after installation
- [ ] App window appears when launched from Start Menu
- [ ] App window appears when launched from desktop shortcut
- [ ] App shows error dialogs if startup fails
- [ ] App continues to work even if database has issues
- [ ] App continues to work even if Telegram bot fails to start
- [ ] App window shows even if renderer has loading issues

## Debugging If Issues Persist

If the window still doesn't show after these fixes:

1. **Check for console logs**:
   - In development, open DevTools with F12
   - In production, logs are printed to the console (not visible in GUI)

2. **Check Windows Event Viewer**:
   - Open Event Viewer (eventvwr.msc)
   - Navigate to Windows Logs → Application
   - Look for errors from "DFM" or "electron"

3. **Run from command line**:

   ```bash
   cd "C:\Program Files\DFM"
   .\DFM.exe
   ```

   This will show console output in the terminal.

4. **Check for missing files**:
   - Verify `out/renderer/index.html` exists in the installed app directory
   - Verify `out/main/index.js` exists
   - Verify `out/preload/index.js` exists

5. **Check antivirus/security software**:
   - Some security software may block Electron apps
   - Try temporarily disabling antivirus to test

## Common Issues and Solutions

### Issue: "Failed to load window content"

**Solution**: The renderer HTML file is missing or corrupted. Rebuild the app.

### Issue: "Database initialization failed"

**Solution**: The app will still show the window, but with limited functionality. Check database permissions and disk space.

### Issue: Window appears but is blank

**Solution**: Renderer JavaScript error. Check console logs for specific error messages.

### Issue: App crashes immediately

**Solution**: Check Windows Event Viewer for crash details. Likely a missing dependency or incompatible library.

## Additional Recommendations

1. **Add error reporting service**: Consider integrating a service like Sentry to capture errors in production.

2. **Add startup logging to file**: Write logs to a file in the app data directory for easier debugging.

3. **Add health check endpoint**: Create a simple way to verify the app is running correctly.

4. **Improve error messages**: Make error messages more user-friendly and actionable.

5. **Add recovery mode**: Implement a way to reset the app to default settings if startup fails repeatedly.

## Files Modified

- `DFM/src/main/index.ts`: Added error handling, logging, and timeout mechanisms

## Next Steps

After rebuilding and testing:

1. If the window shows successfully, the fix is working
2. If issues persist, check the console logs for specific error messages
3. Share the logs with the development team for further diagnosis
