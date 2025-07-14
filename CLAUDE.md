# Claude Code Instructions

## Important Notes
- **NEVER delete the conversations/ folder** - contains important user archives and designs
- **Do not delete untracked files unless specifically directed to**
- **Always move files to recycling bin instead of permanent deletion** - use `trash` command or similar
- Always ask before removing user data or documentation

## Security Requirements
- **ALWAYS follow Electron security best practices**
- **Security must be baked in from the beginning, not bolted on later**
- **NEVER use nodeIntegration: true or contextIsolation: false**
- **Always use contextBridge for secure API exposure between main and renderer**
- **Create secure proxies for any Electron APIs the renderer needs**

## Project Structure
This is a vanilla Electron application with:
- `main.js` - Electron main process
- `index.html` - Application UI
- `package.json` - Dependencies and scripts

## Commands
- `npm start` - Launch the Electron application
- `npm install` - Install dependencies

## Development Notes
- Started as Next.js but converted to vanilla Electron for reliability
- Images and CSS load correctly with this setup
- Foundation is stable for incremental development