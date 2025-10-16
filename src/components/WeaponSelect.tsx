import React from 'react';
import { useGameStore } from '../state/useGameStore';
import type { Weapon } from '../types';

/**
 * WeaponSelect displays all available weapons and allows the player to
 * choose one. Clicking on a weapon will set it as the currently
 * selected weapon in the global store. The selected weapon is
 * highlighted in the list.
 */
const WeaponSelect: React.FC = () => {
  const weapons = useGameStore((state) => state.weapons);
  const selectedWeapon = useGameStore((state) => state.selectedWeapon);
  const setSelectedWeapon = useGameStore((state) => state.setSelectedWeapon);

  return (
    <div className="weapon-select">
      <h3>Weapon</h3>
      <ul>
        {weapons.map((weapon: Weapon) => (
          <li
            key={weapon.id}
            className={selectedWeapon === weapon.id ? 'selected' : ''}
            onClick={() => setSelectedWeapon(weapon.id)}
            style={{ cursor: 'pointer' }}
          >
            {weapon.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WeaponSelect;