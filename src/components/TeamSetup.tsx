
import React from 'react';
import { useGameStore } from '../state/useGameStore';

const TeamSetup: React.FC = () => {
  const { initializeGame, allUnits, selectedUnitId, selectUnit } = useGameStore();

  const handleStart = () => {
    initializeGame();
  };

  return (
    <div className="team-setup">
      <h2>Team Setup</h2>
      <p>Kies je unit:</p>
      <ul className="unit-list">
        {allUnits.map((u) => (
          <li
            key={u.id}
            className={`unit-item ${selectedUnitId === u.id ? 'selected' : ''}`}
            onClick={() => selectUnit(u.id)}
          >
            <div className="unit-name">{u.name}</div>
            <div className="unit-desc">{u.description}</div>
            <div className="unit-special">Special: {u.special}</div>
          </li>
        ))}
      </ul>
      <button onClick={handleStart} disabled={!selectedUnitId}>Start Game</button>
    </div>
  );
};

export default TeamSetup;
