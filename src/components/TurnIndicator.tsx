
import React from 'react';
import { useGameStore } from '../state/useGameStore';

const TurnIndicator: React.FC = () => {
  const { currentTurn } = useGameStore();
  return <div className="turn-indicator">Current Turn: {currentTurn}</div>;
};

export default TurnIndicator;
