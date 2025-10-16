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
  // Get ammo counts and current player index from the store. Ammo is a
  // per‑player array of weaponId→count mappings. When ammo is zero
  // players cannot select that weapon. If ammo is undefined treat
  // it as zero.
  const currentTurn = useGameStore((state) => state.currentTurn);
  const ammo = useGameStore((state) => state.ammo);

  return (
    <div className="weapon-select">
      <h3>Weapon</h3>
      <ul>
        {weapons.map((weapon: Weapon) => {
          // Determine how many shots the current player has for this weapon
          const playerAmmo = ammo[currentTurn]?.[weapon.id] ?? 0;
          const isSelected = selectedWeapon === weapon.id;
          const isDisabled = playerAmmo <= 0;
          return (
            <li
              key={weapon.id}
              className={`${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => {
                if (!isDisabled) setSelectedWeapon(weapon.id);
              }}
              style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
            >
              {weapon.name} ({playerAmmo})
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WeaponSelect;