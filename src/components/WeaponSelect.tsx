
import React from 'react';
import { useGameStore } from '../state/useGameStore';

const WeaponSelect: React.FC = () => {
  const { weapons, selectedWeaponId, selectWeapon } = useGameStore();

  const grouped = weapons.reduce((acc: Record<string, any[]>, w: any) => {
    const key = w.category || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(w);
    return acc;
  }, {});

  return (
    <div className="weapon-select">
      <h3>Select Weapon</h3>
      {Object.keys(grouped).map((cat) => (
        <div key={cat} className="weapon-category">
          <div className="weapon-category-title">{cat}</div>
          <ul>
            {grouped[cat].map((weapon) => (
              <li
                key={weapon.id}
                className={selectedWeaponId === weapon.id ? 'selected' : ''}
                onClick={() => selectWeapon(weapon.id)}
              >
                {weapon.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default WeaponSelect;
