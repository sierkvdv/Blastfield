
import React from 'react';
import WeaponSelect from './WeaponSelect';
import TurnIndicator from './TurnIndicator';
import PowerBar from './PowerBar';
import { useGameStore } from '../state/useGameStore';

const HUD: React.FC = () => {
  const { ammo, cooldowns, selectedWeaponId } = useGameStore();
  const ammoCount = selectedWeaponId ? ammo[selectedWeaponId] ?? '∞' : '—';
  const cd = selectedWeaponId ? cooldowns[selectedWeaponId] || 0 : 0;
  const cooldownSec = cd > 0 ? (cd / 1000).toFixed(1) : null;

  return (
    <div className="hud">
      <TurnIndicator />
      <WeaponSelect />
      <PowerBar />
      <div style={{ marginLeft: 12 }}>
        <div>Ammo: {ammoCount}</div>
        {cooldownSec && <div>Cooldown: {cooldownSec}s</div>}
      </div>
    </div>
  );
};

export default HUD;
