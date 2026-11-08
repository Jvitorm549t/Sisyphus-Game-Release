/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export interface PhysicsConfig {
  slopeAngleDeg: number;       // Angle of the Tartarus hill slope (e.g., 25 degrees)
  gravity: number;             // Downward acceleration constant
  rollingFriction: number;     // Friction coefficient resisting motion
  stoneRadius: number;         // Radius of the boulder in canvas units
  stoneMass: number;           // Mass of the stone impacting inertia
  basePushImpulse: number;     // Base force delivered per valid player input
  maxRollbackSpeed: number;    // Terminal backwards speed down the hill
  maxForwardSpeed: number;     // Maximum forward uphill speed cap
  maxAdditionalSlopeDeg?: number; // Maximum added steepness as altitude climbs
}

export interface DynamicModifiers {
  strengthMultiplier: number;  // Multiplier on push force (from upgrades)
  frictionMultiplier: number;  // Multiplier on grip/friction
  enduranceMultiplier: number; // Reduces gravity impact
  multiFingerBonus: number;    // Bonus multiplier when simultaneous inputs detected
  weatherGravityMultiplier?: number;  // Multiplier from dynamic weather
  weatherFrictionMultiplier?: number; // Multiplier on slope friction from weather
  weatherPushMultiplier?: number;     // Multiplier on player push strength from weather
  weatherWindForce?: number;          // Continuous wind force (+ uphill, - downhill)
}

export type WeatherKind = 'calm' | 'fog' | 'storm' | 'rockfall' | 'zephyr';

export interface WeatherCondition {
  id: WeatherKind;
  name: string;
  description: string;
  gameplayClue: string;
  difficultyImpact: 'harder' | 'easier' | 'neutral';
  durationSeconds: number;
  gravityMultiplier: number;
  frictionMultiplier: number;
  pushMultiplier: number;
  windForce: number;
  ambientParticleType: 'none' | 'fog' | 'rain' | 'falling_stones' | 'updraft';
}

export interface SimulationState {
  distance: number;            // Current position along the slope in meters
  velocity: number;            // Velocity along the slope (+ uphill, - downhill)
  acceleration: number;        // Instantaneous acceleration
  stoneAngle: number;          // Angular rotation of stone in radians
  pushForceQueue: number[];    // Accumulated parallel impulses waiting for step
  lastInputTimestamp: number;  // Timestamp of the most recent push input
  isRollingBackward: boolean;  // True if stone is actively sliding downhill
  totalMetersPushed: number;   // Cumulative positive distance made
  activeInputBurstCount: number; // Rapid inputs within short window (for combo/particles)
  currentSlopeAngleDeg: number; // Dynamic slope steepness angle in degrees
  slopeSteepnessMultiplier: number; // Relative gravity pull factor compared to baseline
}

export interface ScoreState {
  currentDistance: number;     // Live meters on current climb
  maxDistance: number;         // Furthest distance reached in this run
  allTimeBest: number;         // Persistent high score across sessions
  metersRolledBack: number;    // Total rollback distance experienced
}

export interface RawInputEvent {
  id: string;                  // Unique key or mouse button identifier
  type: 'keyboard' | 'mouse' | 'touch';
  timestamp: number;
}

export interface StoneSkin {
  id: string;
  name: string;
  description: string;
  unlockedAtMeters: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  patternType: 'cracks' | 'obsidian' | 'gold' | 'magma';
}

export interface TerrainType {
  id: string;
  name: string;
  description: string;
  slopeAngleDeg: number;
  frictionFactor: number;
  skyGradient: [string, string];
  mountainColor: string;
  groundColor: string;
  groundAccentColor: string;
  unlockedAtMeters: number;
}

export interface UpgradeTier {
  id: string;
  name: string;
  description: string;
  attribute: 'strength' | 'friction' | 'endurance' | 'resonance';
  level: number;
  maxLevel: number;
  costInMeters: number;
  multiplierPerLevel: number;
}

export interface AchievementStats {
  maxDistance: number;
  currentDistance: number;
  inputsPerSecond: number;
  metersRolledBack: number;
  totalInputs: number;
  totalUpgradesPurchased: number;
  strengthLevel: number;
  frictionLevel: number;
  enduranceLevel: number;
  resonanceLevel: number;
  maxedUpgradeTiersCount: number;
  unlockedSkinsCount: number;
  unlockedTerrainsCount: number;
  currentWeather: WeatherKind;
  velocity: number;
  activeSkinId: string;
  activeTerrainId: string;
}

export type AchievementCategory =
  | 'distance'
  | 'upgrades'
  | 'cadence'
  | 'weather'
  | 'perseverance'
  | 'customization';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category?: AchievementCategory;
  condition: (stats: AchievementStats) => boolean;
  unlocked: boolean;
  unlockedAt?: number;
}
