
import create from 'zustand';
import { Unit } from '../data/units';
import weapons from '../data/weapons.json';
import units from '../data/units.json';
import events from '../data/events.json';

interface GameState {
  setupCompleted: boolean;
  currentTurn: number | null;
  units: Unit[];
  weapons: any[];
  randomEvents: any[];
  wind: number;
  selectedWeaponId: string | null;
  allUnits: Unit[];
  selectedUnitId: string | null;
  power: number;
  angle: number;
  ammo: Record<string, number>;
  cooldowns: Record<string, number>;
  gameOver: boolean;
  initializeGame: () => void;
  resetGame: () => void;
  nextTurn: () => void;
  selectWeapon: (weaponId: string) => void;
  selectUnit: (unitId: string) => void;
  setPower: (value: number) => void;
  setAngle: (value: number) => void;
  consumeAmmo: (weaponId: string) => boolean;
  setCooldown: (weaponId: string, ms: number) => void;
  tickCooldowns: (ms: number) => void;
  setGameOver: (v: boolean) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  setupCompleted: false,
  currentTurn: null,
  units: [],
  weapons: weapons,
  randomEvents: events,
  wind: 0,
  selectedWeaponId: null,
  allUnits: units as any,
  selectedUnitId: null,
  power: 50,
  angle: 45,
  ammo: { rocket: 99, plasma_ball: 50, cluster_bomb: 10, mirv: 5, nuke: 1, laser_beam: 20, black_hole: 2, teleport: 3, meteor_shower: 3 },
  cooldowns: {},
  gameOver: false,
  initializeGame: () => {
    const { selectedUnitId, allUnits } = get();
    const chosen = selectedUnitId
      ? allUnits.filter((u: any) => u.id === selectedUnitId)
      : allUnits.slice(0, 1);
    set(() => ({
      setupCompleted: true,
      currentTurn: 0,
      units: chosen as any,
      gameOver: false
    }));
  },
  resetGame: () => set(() => ({ setupCompleted: false, currentTurn: null, units: [], selectedUnitId: null })),
  nextTurn: () => set((state) => ({
    currentTurn: state.currentTurn !== null ? (state.currentTurn + 1) % (state.units.length) : 0,
    wind: (Math.random() - 0.5) * 2
  })),
  selectWeapon: (weaponId: string) => set(() => ({ selectedWeaponId: weaponId })),
  selectUnit: (unitId: string) => set(() => ({ selectedUnitId: unitId })),
  setPower: (value: number) => set(() => ({ power: Math.max(0, Math.min(100, value)) })),
  setAngle: (value: number) => set(() => ({ angle: Math.max(0, Math.min(90, value)) })),
  consumeAmmo: (weaponId: string) => {
    const a = { ...get().ammo };
    if (a[weaponId] === undefined) return true; // unlimited if not tracked
    if (a[weaponId] <= 0) return false;
    a[weaponId] -= 1;
    set({ ammo: a });
    return true;
  },
  setCooldown: (weaponId: string, ms: number) => {
    const cds = { ...get().cooldowns };
    cds[weaponId] = Math.max(cds[weaponId] || 0, ms);
    set({ cooldowns: cds });
  },
  tickCooldowns: (ms: number) => {
    const cds = { ...get().cooldowns };
    Object.keys(cds).forEach((k) => {
      cds[k] = Math.max(0, cds[k] - ms);
      if (cds[k] === 0) delete cds[k];
    });
    set({ cooldowns: cds });
  },
  setGameOver: (v: boolean) => set({ gameOver: v })
}));
