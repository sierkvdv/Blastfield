// Global type definitions for the BlastField game.

export interface Unit {
  /**
   * Unique identifier for the unit type. For example `tank` or `drone`.
   */
  id: string;
  /**
   * Display name of the unit.
   */
  name: string;
  /**
   * Short description of the unit’s play style or characteristics.
   */
  description: string;
  /**
   * Name of the special ability this unit can perform.
   */
  special: string;
  /**
   * Collection of numeric stats used to balance gameplay. These values
   * determine the unit’s health pool, armour mitigation and movement speed.
   */
  stats: {
    armor: number;
    speed: number;
    health: number;
  };
  /**
   * Colour used when rendering the unit body. Stored as a decimal
   * representation of a hexadecimal RGB value (e.g. 0x00FF00 → 65280).
   */
  color: number;
  /**
   * Name of the shape used to draw the unit body. Recognised values are
   * `rectangle`, `circle`, `roundedRect`, `ellipse` and `triangle`. When
   * adding new shapes ensure the Player class supports them.
   */
  shape: string;
}

export interface Weapon {
  /**
   * Unique identifier for the weapon. For example `rocket` or `nuke`.
   */
  id: string;
  /**
   * Human readable name of the weapon displayed in the UI.
   */
  name: string;
  /**
   * Amount of damage dealt to units caught in the explosion.
   */
  damage: number;
  /**
   * Radius of the explosion in pixels. Used to determine the area of
   * effect and to draw the explosion graphic.
   */
  radius: number;
  /**
   * Keyword describing secondary behaviour of the weapon. Some values
   * trigger additional effects such as cluster spawns or beam weapons.
   */
  effect: string;
  /**
   * Category bucket used to group weapons in the selection menu.
   */
  category: string;
  /**
   * Colour used when rendering the projectile. Stored as a decimal
   * representation of a hexadecimal RGB value.
   */
  color: number;
  /**
   * Colour used for the explosion animation. Stored as a decimal
   * representation of a hexadecimal RGB value.
   */
  explosionColor: number;
}
