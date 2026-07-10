# Starting the Application

## Quick Start

### Windows (CMD)
```cmd
start-app.cmd
```

### Windows (PowerShell)
```powershell
.\start-app.ps1
```

### macOS/Linux (Bash)
```bash
./start-app.sh
```

## What the Startup Script Does

The startup scripts automatically:

1. **Cleanup existing processes**
   - Checks if Node.js is already running on port 3000
   - Terminates any running Node processes to prevent port conflicts
   - Waits 2 seconds for clean shutdown

2. **Verify prerequisites**
   - Checks that `package.json` exists
   - Verifies `src/index.ts` is present
   - Confirms `extraction-rules/invoice.json` is available

3. **Build application**
   - Runs `npm run build` (TypeScript → JavaScript)
   - Post-processes path aliases with `tsc-alias`
   - Clears old build artifacts

4. **Start dev server**
   - Runs `npm run dev` (starts Express on port 3000)
   - Logs startup messages to console
   - Keeps terminal open for Ctrl+C shutdown

## Accessing the Application

After startup, you can access:

- **API Server**: http://localhost:3000
  - Example: `curl http://localhost:3000/api/extract/rules`
  
- **Frontend**: http://localhost:5173
  - React application (if frontend server is running)

## Troubleshooting

### "Port 3000 already in use"
- The script will automatically kill previous Node processes
- If still getting this error, manually run:
  ```cmd
  taskkill /F /IM node.exe
  ```

### "Build failed"
- Check Node.js version: `node --version` (should be 18+)
- Verify npm installation: `npm --version`
- Clear node_modules: `rm -r node_modules && npm install`

### "Module not found" errors
- Run `npm install` to ensure all dependencies are installed
- Clear TypeScript cache: `rm -r dist && npm run build`

## Processes Started

After running the startup script:
- **Node.js process** on port 3000 (Express API server)
- **npm dev script** (runs TypeScript watch + server)

To stop the application: Press `Ctrl+C` in the terminal

## Environment

The application requires:
- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Port 3000**: Must be available (or configure in `.env`)

## File Locations

- **Extraction Rules**: `extraction-rules/`
- **Source Documents**: `source-documents/`
- **Results**: `results/json/`
- **Application Code**: `src/`

---

**Last Updated**: 2026-07-07
**Status**: Production Ready
