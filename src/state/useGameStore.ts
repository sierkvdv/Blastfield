import create from 'zustand';
import type { Unit, Weapon } from '../types';
import unitsData from '../data/units.json';
import weaponsData from '../data/weapons.json';
import eventsData from '../data/events.json';

/**
 * Zustand store to manage global game state. This store encapsulates
 * information about the match such as which units are playing,
 * whose turn it is, what the wind strength is, and values needed
 * to control firing (angle, power, selected weapon and firing flag).
 */
interface GameState {
  /** Whether the initial team selection / setup has been completed. */
  setupCompleted: boolean;
  /** Index into the `units` array indicating whose turn it is. */
  currentTurn: number;
  /** Array of active units taking part in the current match. */
  units: Unit[];
  /** All available unit definitions loaded from JSON. */
  allUnits: Unit[];
  /** All weapon definitions loaded from JSON. */
  weapons: Weapon[];
  /** ID of the weapon selected by the current player. */
  selectedWeapon: string;
  /** Angle of the aiming reticule in degrees (0 = right, 90 = up). */
  angle: number;
  /** Power of the shot on a 0‑100 scale. */
  power: number;
  /** When true the GameEngine should spawn a projectile on behalf of the current player. */
  firing: boolean;
  /** Current wind strength (negative values blow left, positive values blow right). */
  wind: number;
  /** Number of units per team (1 for 1v1, 2 for 2v2). */
  unitsPerTeam: number;
  /** Update the number of units per team (1 or 2). */
  setUnitsPerTeam: (n: number) => void;
  /** Pool of random event definitions loaded from JSON. */
  randomEvents: any[];
  /** Initialise a new game. Accepts a list of unit IDs to spawn; if omitted the first two units are used. */
  initializeGame: (selectedUnitIds?: string[]) => void;
  /** Advance to the next player's turn and randomise the wind. */
  nextTurn: () => void;
  /** Adjust the current firing angle. */
  setAngle: (angle: number) => void;
  /** Adjust the current firing power. */
  setPower: (power: number) => void;
  /** Change the currently selected weapon. */
  setSelectedWeapon: (weaponId: string) => void;
  /** Trigger or reset the firing flag. When set to true the GameEngine should fire a projectile then reset the flag to false. */
  setFiring: (flag: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  setupCompleted: false,
  currentTurn: 0,
  units: [],
  allUnits: unitsData as unknown as Unit[],
  weapons: weaponsData as unknown as Weapon[],
  selectedWeapon: (weaponsData as any)[0]?.id ?? '',
  angle: 45,
  power: 50,
  firing: false,
  wind: 0,
  // Default to 1 unit per team (1v1). Can be updated to 2 via setUnitsPerTeam.
  unitsPerTeam: 1,
  setUnitsPerTeam: (n: number) => {
    // Clamp the requested team size between 1 and 2.
    const val = Math.max(1, Math.min(2, n));
    set(() => ({ unitsPerTeam: val }));
  },
  randomEvents: eventsData as any[],
  initializeGame: (selectedUnitIds?: string[]) => {
    const all = unitsData as unknown as Unit[];
    let chosen: Unit[];
    if (selectedUnitIds && selectedUnitIds.length > 0) {
      // Map provided IDs to units and filter out undefined entries
      chosen = selectedUnitIds
        .map((id) => all.find((u) => u.id === id))
        .filter(Boolean) as Unit[];
    } else {
      // If no selection was made, default to the first unitsPerTeam * 2 units
      const count = get().unitsPerTeam * 2;
      chosen = all.slice(0, count) as Unit[];
    }
    // Required number of units equals the number of teams (always 2) times the units per team
    const requiredCount = get().unitsPerTeam * 2;
    // If fewer than required units were selected, duplicate the first selected unit to fill
    while (chosen.length < requiredCount) {
      chosen.push(chosen[0] ?? all[0]);
    }
    // Trim any extra selections beyond the required count
    chosen = chosen.slice(0, requiredCount);
    set(() => ({
      units: chosen,
      setupCompleted: true,
      currentTurn: 0,
      // Randomise initial wind between -1 and 1
      wind: (Math.random() - 0.5) * 2
    }));
  },
  nextTurn: () => {
    const state = get();
    const nextIndex = (state.currentTurn + 1) % state.units.length;
    set(() => ({
      currentTurn: nextIndex,
      // Randomise wind each turn
      wind: (Math.random() - 0.5) * 2
    }));
  },
  setAngle: (angle: number) => {
    // Clamp angle between 0 and 90 degrees to prevent shooting into the ground
    const clamped = Math.max(0, Math.min(90, angle));
    set(() => ({ angle: clamped }));
  },
  setPower: (power: number) => {
    // Clamp power between 10 and 100 to avoid zero velocity
    const clamped = Math.max(10, Math.min(100, power));
    set(() => ({ power: clamped }));
  },
  setSelectedWeapon: (weaponId: string) => {
    set(() => ({ selectedWeapon: weaponId }));
  },
  setFiring: (flag: boolean) => {
    set(() => ({ firing: flag }));
  }
}));
