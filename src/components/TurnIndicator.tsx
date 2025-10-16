import React from 'react';
import { useGameStore } from '../state/useGameStore';

/**
 * TurnIndicator displays the index and name of the player whose turn it
 * currently is. It reads the list of active units from the global store
 * and uses the currentTurn index to look up the corresponding unit.
 */
const TurnIndicator: React.FC = () => {
  const currentTurn = useGameStore((state) => state.currentTurn);
  const units = useGameStore((state) => state.units);
  const playerName = units[currentTurn]?.name ?? '';
  return <div className="turn-indicator">Turn: {currentTurn + 1} – {playerName}</div>;
};

export default TurnIndicator;