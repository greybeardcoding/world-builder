# World Builder

A three-panel Electron application for content creation with a Tiptap-powered block editor system.

## Features

- **Three-Panel Layout**: Workspace (left), Content (middle), Properties (right)
- **Block Editor System**: Rich text editing with dynamic block creation and removal
- **Tabbed Interface**: Multiple document support in the main content area
- **Extensible Architecture**: Unified block system ready for application-specific blocks
- **Security-First**: Follows Electron security best practices

## Architecture

Built with **SOLID**, **ATOMIC**, and **YAGNI** principles:

- **SOLID**: Single responsibility classes and separation of concerns
- **ATOMIC**: Small, composable block components  
- **YAGNI**: Minimal viable implementation without over-engineering
- **Don't Reinvent**: Leverages proven Tiptap editor for rich text

## Technology Stack

- **Electron**: Cross-platform desktop application framework
- **Tiptap**: Modern rich text editor built on ProseMirror
- **Vanilla JS**: No heavy frameworks, clean and maintainable
- **CSS Grid**: Responsive three-panel layout

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
git clone <repository-url>
cd world-builder
npm install
```

### Development

```bash
# Start the Electron application
npm start

# Run unit tests (open in browser)
npm test
```

## Project Structure

```
world-builder/
├── main.js              # Electron main process
├── preload.js           # Secure API bridge
├── index.html           # Application UI
├── styles.css           # Application styling
├── block-editor.js      # Block system implementation
├── tests/               # Unit tests
├── conversations/       # Development archives (gitignored)
└── CLAUDE.md           # Development notes
```

## Block System

The application uses a unified block-based content editor across all three panels:

- **Left Panel**: Account, menu, and file tree blocks
- **Middle Panel**: Rich text content blocks with Tiptap integration
- **Right Panel**: Document metadata and outline blocks

### Creating Custom Blocks

```javascript
// Add new block type
App.blockSystem.createBlock('custom-type');

// Use BlockFactory for predefined types
BlockFactory.createTextBlock(App.blockSystem);
BlockFactory.createHeadingBlock(App.blockSystem);
```

## Security

This application follows Electron security best practices:

- `nodeIntegration: false` and `contextIsolation: true`
- Secure API exposure via `contextBridge`
- No direct Node.js access from renderer process
- Disabled `eval()` to prevent code injection

## Testing

Unit tests are available in `tests/block-editor.test.html`. Open this file in a browser to run the test suite covering:

- Block creation and removal
- Block type handling
- Editor instance management
- Data retrieval methods

## Contributing

This project follows security-first development principles. All contributions must:

- Maintain Electron security best practices
- Include unit tests for new functionality
- Follow the established architectural patterns
- Use modern JavaScript practices

## License

[Add your license information here]