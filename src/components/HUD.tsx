
import React from 'react';
import WeaponSelect from './WeaponSelect';
import TurnIndicator from './TurnIndicator';
import PowerBar from './PowerBar';

const HUD: React.FC = () => {
  return (
    <div className="hud">
      <TurnIndicator />
      <WeaponSelect />
      <PowerBar />
    </div>
  );
};

export default HUD;
