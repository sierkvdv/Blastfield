
# BlastField: Legends

BlastField: Legends is a modern browser-based artillery game inspired by classics like Scorched Earth and Worms. Featuring turn-based gameplay, destructible terrain, multiple unit types with unique abilities, a wide array of weapons, and random events, the game can be played locally with up to two players per team (1v1 or 2v2).

## Features
- Turn-based artillery combat with destructible terrain
- Multiple unit types (Tank, Drone, Walker, Subterra, Hover) each with unique special abilities
- Dozens of weapons across categories: Explosives, Energy, Utility, and Chaos
- Random events such as meteor showers and supply drops
- Local multiplayer support for up to four players split between two teams

## Installation
1. Install dependencies:
    ```bash
    npm install
    ```
2. Run the development server:
    ```bash
    npm run dev
    ```
   The application will be available at `http://localhost:5173` by default.

3. Build the project for production:
    ```bash
    npm run build
    ```

## Deployment
The project is pre-configured for deployment on Vercel. After building the project, deploy the `dist` directory. You can directly connect this repository to Vercel and it will auto-detect the build command (`npm run build`) and output directory (`dist`).

## Project Structure
The main folders and files include:
- `public/` - Static assets and favicon
- `src/` - Source code
  - `game/` - Core game logic including rendering, physics, terrain, player handling, projectiles, and effects
  - `state/` - Game state management using Zustand
  - `data/` - JSON definitions for weapons, units, and events
  - `components/` - React components for the HUD, weapon selection, team setup, turn indicator, and power bar
  - `utils/` - Utility functions
  - `styles/` - Global CSS
- `package.json` - Project configuration and dependencies
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration

Enjoy building and playing BlastField: Legends!
