# All Hands - Project Guidance

## Project Overview

**All Hands** is a cooperative, real-time multiplayer card game designed for local party play. It's a bridge simulator that's also a deck builder, and also a roguelike. The game runs on a central "host" computer (the viewscreen), while players join the game using their smartphones as controllers.

Each player takes on the role of a specific crew member on a starship. You manage a hand of cards specific to your station. Good communication is essential!

**Current Status:** The project is currently under active development and is not yet playable.

## Architecture

### Technology Stack
- **Build System:** npm workspaces (monorepo)
- **Language:** TypeScript
- **Game Server:** Colyseus.js (WebSocket-based real-time multiplayer framework)
- **UI Framework:** React 19
- **Desktop App:** Electron
- **Build Tools:** Vite, TypeScript Compiler
- **Testing:** Vitest
- **Linting:** ESLint with TypeScript, React, and stylistic plugins
- **Component Development:** Storybook

### Package Structure

The project is organized as an npm workspace with the following packages:

#### 1. **engine** (`packages/engine`)
- The core game logic and server implementation
- Uses Colyseus.js to run the game and manage state synchronization
- Implements the game room, state management, AI ships, and game rules
- Key components:
  - `GameRoom.ts` - Main Colyseus room handling game logic
  - `state/` - Colyseus state schema definitions for synchronized game state
  - `classes/` - Game entities (ships, systems, etc.)
  - `ai/` - AI behavior for computer-controlled enemy ships
  - `cards/` - Card gameplay mechanics
- **No UI** - purely server-side logic
- Dependencies: `@colyseus/core`, `colyseus`, `express`

#### 2. **player-ui** (`packages/player-ui`)
- The interface for individual players (runs on smartphones)
- Each player sees their own unique view based on their role
- Built with React and Vite
- Uses `colyseus.js` client to connect to the game server
- Dependencies: React, `colyseus.js`, `common-data`, `common-ui`

#### 3. **game-ui** (`packages/game-ui`)
- The "main screen" interface visible to all players
- Displays the shared game view (space, ships, etc.)
- Built with React and Vite
- Uses `colyseus.js` client to connect to the game server
- Includes QR code generation for easy player joining
- Dependencies: React, `colyseus.js`, `common-data`, `common-ui`, `react-qr-code`

#### 4. **game-app** (`packages/game-app`)
- Electron application wrapper
- Hosts both the game server (engine) and game-ui
- Serves player-ui over HTTP for players to access via their devices
- Main entry point for running the complete game
- Dependencies: `electron`, `engine`, `common-data`

#### 5. **common-ui** (`packages/common-ui`)
- Shared React components used by both player-ui and game-ui
- UI utilities and common visual elements
- Dependencies: React, `@base-ui-components/react`, `colyseus.js`

#### 6. **common-data** (`packages/common-data`)
- Shared TypeScript types, utilities, and constants
- Used by all other packages to ensure type consistency
- Contains card definitions, game configuration types, utility functions
- Pure data/types - no framework dependencies

### Data Flow
1. **game-app** (Electron) starts the **engine** (Colyseus server)
2. **game-ui** connects to engine via WebSocket and displays the main screen
3. Players access **player-ui** via their smartphones (HTTP served by game-app)
4. **player-ui** instances connect to engine via WebSocket
5. **engine** manages all game state and synchronizes it to all connected clients
6. All packages share types from **common-data** for type safety

## Game Mechanics

### Current Gameplay
- **Cooperative multiplayer:** 1 crew of 4 players cooperate together
- **Role-based:** Each player takes on a different crew role (stations on the ship)
  - **Helm:** Navigation and ship movement
  - **Sensors:** Detection and scanning
  - **Tactical:** Weapons and combat
  - **Engineer:** Ship systems and repairs
- **Card-based:** Players play cards specific to their station to control the ship
- **Single player ship:** Players fly a single ship together
- **AI enemies:** Other ships are computer-controlled enemies

### Future Plans
- Multiple player ships (competing or cooperating)
- Additional game modes
- More varied gameplay scenarios

## Development

### Prerequisites
- Node.js and npm
- TypeScript knowledge
- Familiarity with React for UI work
- Understanding of Colyseus.js for game server work

### Common Commands

From the root directory:

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Start the game (requires prior build)
npm run start

# Development mode (runs game and auto-launches player UIs)
npm run dev

# Lint all code
npm run lint

# Run tests
npm run test

# Run Storybook for component development
npm run storybook

# Package the Electron app for distribution
npm run package
```

### Development Workflow

1. **Making changes:** Edit files in the appropriate package
2. **Building:** TypeScript packages need to be compiled with `npm run build`
3. **Testing:** Run `npm run test` to execute Vitest tests
4. **Linting:** Run `npm run lint` to check and auto-fix code style issues
5. **Running:** Use `npm run dev` for development or `npm run start` for production mode

### Development Mode Details

The `npm run dev` command:
- Starts the Electron app with the game server
- Waits for the server to be ready (port 23552)
- Automatically launches 4 player browser windows using Playwright
- Each player window simulates a smartphone interface (412x945px)
- Player windows are positioned in a row for easy testing

This allows you to test the full multiplayer experience locally without needing actual smartphones.

### Testing

- **Framework:** Vitest
- **Test Types:**
  - **Unit Tests:** Traditional tests in `*.test.ts` files (Node environment)
  - **Storybook Tests:** Component tests via Storybook (browser environment with Playwright)
- **Running tests:** `npm run test` from root
- **Coverage:** Vitest with coverage-v8
- **Browser testing:** Available via `@vitest/browser` and Playwright

### Working with Colyseus

The engine uses Colyseus for real-time state synchronization:

- **State Schema:** Define game state using Colyseus schema classes (in `packages/engine/src/state/`)
- **Room:** Main game logic is in `GameRoom.ts`
- **Messages:** Use Colyseus message handlers for client-server communication
- **State Updates:** All state changes in the server automatically sync to clients

## Linting & Coding Standards

### Linting Configuration

The project uses ESLint with a comprehensive configuration (`eslint.config.js`):

- **TypeScript:** Strict TypeScript linting with `@typescript-eslint`
- **React:** React-specific rules including hooks and refresh plugins
- **Stylistic:** Code style rules via `@stylistic/eslint-plugin`
- **Import Order:** Enforced import organization
- **Accessibility:** JSX accessibility linting with `eslint-plugin-jsx-a11y`

Run linting with: `npm run lint` (includes auto-fix)

### Code Style Guidelines

#### General Style
- **Quotes:** Single quotes preferred (with escape avoidance)
- **Semicolons:** Required (always)
- **Indentation:** 4 spaces
- **Brace Style:** 1TBS (one true brace style)
- **Line Length:** No strict limit, but keep readable

#### TypeScript Specifics
- **Unused Variables:** Allowed if prefixed with underscore (`_variableName`)
- **Type Safety:** Strict mode enabled
- **No `var`:** Use `const` or `let`
- **Module System:** ESNext modules

#### Import Organization
Imports are automatically organized into groups (enforced by linting):
1. Built-in Node.js modules
2. External dependencies (npm packages)
3. Internal workspace packages
4. Parent directory imports
5. Sibling directory imports
6. Index imports
7. Type imports

Imports within groups are alphabetized (case-insensitive).

#### React Guidelines
- **Hooks:** Follow React hooks rules
- **JSX:** 4-space indentation for props
- **Accessibility:** Follow a11y best practices

#### Object/Array Formatting
- **Trailing Commas:** Required for multiline arrays, objects, imports, and enums
- **No trailing commas** for function parameters

### TypeScript Configuration

- **Base Config:** `tsconfig.base.json` - shared settings
- **Target:** ES2022
- **Module:** ESNext with bundler resolution
- **Strict Mode:** Enabled
- **Path Aliases:** Configured for workspace packages

### Special Considerations

1. **Story Files:** React hooks rules are disabled for `*.stories.tsx` files
2. **Server Packages:** `__dirname` and `process` are available as globals in `engine` and `game-app`
3. **Generated Files:** Some files are auto-generated and excluded from linting

## Additional Information

### File Structure Patterns
- Source code is in `src/` directories
- Built output goes to `dist/` directories
- Tests are co-located with source files (`.test.ts`, `.spec.ts`)
- Stories for components: `*.stories.tsx`

### Configuration Files
- **Server Config:** `packages/game-app/config/server.json`
- **Client Config:** `packages/game-app/config/client.json`
- **Scenario Data:** `packages/engine/scenarios/default.json`

### Git Workflow
- Build artifacts (`dist/`, `node_modules/`) are excluded via `.gitignore`
- Electron app can be packaged for distribution

### Key Dependencies to Know
- **Colyseus:** Real-time multiplayer framework
- **Electron:** Desktop app wrapper
- **React 19:** UI framework (latest version)
- **Vite:** Build tool and dev server
- **Base UI Components:** Accessible React components
- **dnd-kit:** Drag and drop for card interactions

### Performance Considerations
- State synchronization happens automatically via Colyseus
- Ping interval and latency can be simulated for testing
- The engine manages game state efficiently for real-time updates

### Debugging Tips
- **VS Code Launch Configuration:** Available in `.vscode/` for debugging
- **Server Port:** The game server runs on port 23552 by default
- **Player UI URL:** Access player interface at `http://localhost:23552/`
- **Colyseus Monitor:** Can be added for debugging state synchronization
- **Browser DevTools:** Available for debugging React components in player-ui and game-ui

### Troubleshooting Common Issues
1. **Port in Use:** If port 23552 is already in use, kill the existing process
2. **Build Errors:** Run `npm run build` in root to rebuild all packages
3. **Workspace Dependencies:** After changing common packages, rebuild dependent packages
4. **Type Errors:** Ensure all workspace packages are built (TypeScript needs compiled output)

### Future Architecture Considerations
- The architecture is designed to support multiple player ships in future updates
- Game modes may expand to include competitive or larger cooperative scenarios
- The modular package structure allows for easy extension

## Contributing Guidelines

### Before Submitting Changes
1. Run `npm run lint` to ensure code style compliance
2. Run `npm run test` to verify all tests pass
3. Run `npm run build` to ensure all packages build successfully
4. Test the changes in development mode (`npm run dev`)

### Code Review Considerations
- Keep changes focused and minimal
- Ensure backward compatibility with existing game state
- Document any new APIs or significant changes
- Consider multiplayer implications (state sync, latency, etc.)
- Test with multiple player windows when changing gameplay

### Package Dependencies
When adding dependencies:
- Add to the specific package that needs it (not root)
- Use workspace versions for internal packages (e.g., `"common-data": "1.0.0"`)
- Keep version consistency across packages for shared external dependencies
- Consider bundle size impact for UI packages
