import React from 'react';
import { useGameStore } from '../state/useGameStore';

/**
 * PowerBar contains controls for adjusting the firing angle and power,
 * and a button to fire the currently selected weapon. It reflects
 * values from the global store and writes changes back via setters.
 */
const PowerBar: React.FC = () => {
  const angle = useGameStore((state) => state.angle);
  const power = useGameStore((state) => state.power);
  const setAngle = useGameStore((state) => state.setAngle);
  const setPower = useGameStore((state) => state.setPower);
  const setFiring = useGameStore((state) => state.setFiring);

  return (
    <div className="power-bar">
      <div className="control-group">
        <label>Angle: {Math.round(angle)}°</label>
        <input
          type="range"
          min="0"
          max="90"
          value={angle}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAngle(parseFloat(e.target.value))}
        />
      </div>
      <div className="control-group">
        <label>Power: {Math.round(power)}</label>
        <input
          type="range"
          min="10"
          max="100"
          value={power}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPower(parseFloat(e.target.value))}
        />
      </div>
      <button className="fire-button" onClick={() => setFiring(true)}>
        Fire
      </button>
    </div>
  );
};

export default PowerBar;