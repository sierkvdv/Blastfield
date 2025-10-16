import React, { useState } from 'react';
import { useGameStore } from '../state/useGameStore';
import type { Unit } from '../types';

/**
 * TeamSetup allows players to select which units will participate in the
 * match. It lists all available unit types and lets the user choose
 * two of them. Once two units are selected the Start Game button
 * becomes enabled and clicking it calls initializeGame with the chosen
 * unit IDs.
 */
const TeamSetup: React.FC = () => {
  // Pull additional state and actions from the store to support team size selection.
  const { allUnits, initializeGame, unitsPerTeam, setUnitsPerTeam } = useGameStore();
  const [selected, setSelected] = useState<string[]>([]);

  // Toggle selection of a unit ID. Limit the number of selected units to unitsPerTeam * 2.
  const toggleSelect = (unitId: string) => {
    setSelected((prev: string[]) => {
      if (prev.includes(unitId)) {
        return prev.filter((id: string) => id !== unitId);
      }
      const maxSelect = unitsPerTeam * 2;
      if (prev.length >= maxSelect) {
        return prev;
      }
      return [...prev, unitId];
    });
  };

  // Start the game once enough units are selected based on the chosen team size.
  const startGame = () => {
    const required = unitsPerTeam * 2;
    if (selected.length >= required) {
      initializeGame(selected);
    }
  };

  return (
    <div className="team-setup">
      <h2>Select Your Units</h2>
      {/* Allow players to choose between 1v1 and 2v2 modes via radio buttons. */}
      <div className="team-size-select">
        <label>
          <input
            type="radio"
            name="teamSize"
            value={1}
            checked={unitsPerTeam === 1}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setUnitsPerTeam(value);
              // Trim selection if it exceeds the new limit.
              setSelected((prev) => prev.slice(0, value * 2));
            }}
          />
          1v1
        </label>
        <label style={{ marginLeft: '10px' }}>
          <input
            type="radio"
            name="teamSize"
            value={2}
            checked={unitsPerTeam === 2}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setUnitsPerTeam(value);
              setSelected((prev) => prev.slice(0, value * 2));
            }}
          />
          2v2
        </label>
      </div>
      <div className="unit-grid">
        {allUnits.map((unit: Unit) => (
          <button
            key={unit.id}
            className={`unit-button ${selected.includes(unit.id) ? 'selected' : ''}`}
            onClick={() => toggleSelect(unit.id)}
          >
            {unit.name}
          </button>
        ))}
      </div>
      <button
        className="start-button"
        onClick={startGame}
        disabled={selected.length < unitsPerTeam * 2}
      >
        Start Game
      </button>
    </div>
  );
};

export default TeamSetup;