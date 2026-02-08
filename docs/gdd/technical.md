# Technical Considerations

Electron architecture, performance optimization, save system, and platform targets.

## Electron Desktop Application

The game is built as an Electron desktop application, providing several key advantages:

- **Cross-Platform** -- Single codebase deploys to Windows, macOS, and Linux
- **Web Technologies** -- Built with HTML5, JavaScript/TypeScript, and CSS for rapid development
- **Native Integration** -- Access to file system, system tray, and desktop notifications
- **Auto-Updates** -- Built-in update system for seamless patches and content delivery

## Electron Architecture Benefits

- Leverages Chromium rendering engine for consistent UI across platforms
- Node.js backend enables efficient file I/O and save management
- Multi-process architecture separates game logic from rendering
- WebGL support for 2D sprite rendering and visual effects
- Hardware acceleration for smooth animations and transitions

## Performance Optimization

- Worker threads for heavy computation (combat calculations, loot generation)
- Avoid blocking main process -- offload to renderer or background processes
- Stream-based file reading for large save files to prevent memory bloat
- Lazy loading for asset collections (transmog library, achievement database)
- Native modules (optional) for performance-critical systems like checksum verification
- Minimize synchronous IPC calls between main and renderer processes

## Save System

- Auto-save every 5 minutes using Node.js file system
- Local save files stored in user data directory (platform-agnostic)
- Optional cloud save via Steam Cloud or custom backend
- Manual save/export for backups (JSON format)
- Save file includes: Character data, progress flags, inventory, achievements, Paragon progress
- Compression for large save files (gzip or similar)

## Platform Targets

- **Primary:** PC Desktop (Windows, macOS, Linux via Electron)
- **Future Consideration:** Mobile port using Cordova/Capacitor (requires UI redesign)
- **Future Consideration:** Web version (limited features, browser constraints)
