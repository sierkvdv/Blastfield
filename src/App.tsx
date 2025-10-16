
import React from 'react';
import GameEngine from './game/GameEngine';
import HUD from './components/HUD';
import TeamSetup from './components/TeamSetup';
import { useGameStore } from './state/useGameStore';

const App: React.FC = () => {
  const { setupCompleted } = useGameStore();

  return (
    <div>
      {!setupCompleted && <TeamSetup />}
      {setupCompleted && <HUD />}
      <div id="game-canvas-container">
        {setupCompleted && <GameEngine />}
      </div>
    </div>
  );
};

export default App;
