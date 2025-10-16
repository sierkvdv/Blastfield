
import React from 'react';
import { useGameStore } from '../state/useGameStore';

const PowerBar: React.FC = () => {
  const { power, angle, setPower, setAngle } = useGameStore();
  return (
    <div className="power-bar">
      <label>Power: {power}</label>
      <input
        type="range"
        min="0"
        max="100"
        value={power}
        onChange={(e) => setPower(Number(e.target.value))}
      />
      <label style={{ marginLeft: 12 }}>Angle: {angle}°</label>
      <input
        type="range"
        min="0"
        max="90"
        value={angle}
        onChange={(e) => setAngle(Number(e.target.value))}
      />
    </div>
  );
};

export default PowerBar;
