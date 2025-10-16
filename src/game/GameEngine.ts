
import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import { useGameStore } from '../state/useGameStore';
import Terrain from './Terrain';
import Player from './Player';
import Projectile from './Projectile';
import { handleRandomEvents } from '../utils/randomEvents';

const GameEngine: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);

  const { currentTurn, units, wind, randomEvents } = useGameStore();

  useEffect(() => {
    // Initialize PixiJS app
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000
    });
    appRef.current = app;

    // Attach view to DOM
    if (canvasRef.current) {
      canvasRef.current.appendChild(app.view as any);
    }

    // Initialize Matter.js engine and world
    const engine = Matter.Engine.create();
    engineRef.current = engine;

    // Create terrain and players
    const terrain = new Terrain(app, engine);
    units.forEach((unit) => {
      new Player(app, engine, unit);
    });

    // Game loop
    const ticker = app.ticker.add(() => {
      Matter.Engine.update(engine, ticker.deltaMS);
    });

    // Cleanup on unmount
    return () => {
      app.destroy(true);
      Matter.Engine.clear(engine);
    };
  }, []);

  useEffect(() => {
    // Handle random events at the start of each turn
    if (currentTurn !== null) {
      handleRandomEvents(randomEvents);
    }
  }, [currentTurn]);

  return <div ref={canvasRef}></div>;
};

export default GameEngine;
