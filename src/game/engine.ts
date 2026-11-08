/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GameState,
  SimulationState,
  ScoreState,
  RawInputEvent,
  StoneSkin,
  TerrainType,
  WeatherCondition,
  DynamicModifiers,
  Achievement,
  AchievementStats,
} from './types';
import {
  DEFAULT_PHYSICS_CONFIG,
  createInitialSimulationState,
  stepPhysics,
  enqueuePushImpulse,
} from './physics';
import { createInitialScoreState, updateScoreState, loadAllTimeBest } from './scoring';
import { ParallelInputProcessor } from './input';
import { UpgradeSystem } from './extensions/upgrades';
import { SkinManager } from './extensions/skins';
import { TerrainManager } from './extensions/terrains';
import { AchievementSystem } from './extensions/achievements';
import { DynamicWeatherSystem } from './weather';
import { AudioManager } from './audio';
import { GameRenderer } from './renderer';

export interface EngineSnapshot {
  gameState: GameState;
  score: ScoreState;
  velocity: number;
  inputsPerSec: number;
  activeSkin: StoneSkin;
  activeTerrain: TerrainType;
  isRollingBackward: boolean;
  totalInputs: number;
  isMuted: boolean;
  currentSlopeAngleDeg: number;
  slopeSteepnessMultiplier: number;
  activeWeather: WeatherCondition;
  weatherTimeRemaining: number;
  weatherCycleProgress: number;
}

export type SnapshotListener = (snapshot: EngineSnapshot) => void;

export class SisyphusEngine {
  private canvas: HTMLCanvasElement;
  private renderer: GameRenderer;
  private audio: AudioManager;
  private inputProcessor: ParallelInputProcessor;
  public upgradeSystem: UpgradeSystem;
  public skinManager: SkinManager;
  public terrainManager: TerrainManager;
  public achievementSystem: AchievementSystem;
  public weatherSystem: DynamicWeatherSystem;

  private gameState: GameState = 'title';
  private simState: SimulationState;
  private scoreState: ScoreState;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private snapshotListeners: Set<SnapshotListener> = new Set();
  private lastSnapshotTime: number = 0;
  private wasRollingBack: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new GameRenderer(canvas);
    this.audio = new AudioManager();
    this.inputProcessor = new ParallelInputProcessor();
    this.upgradeSystem = new UpgradeSystem();
    this.skinManager = new SkinManager();
    this.terrainManager = new TerrainManager();
    this.achievementSystem = new AchievementSystem();
    this.weatherSystem = new DynamicWeatherSystem('calm');

    // Weather audio and camera shake callbacks
    this.renderer.setThunderCallback(() => {
      this.audio.playThunder();
    });

    this.weatherSystem.setWeatherChangeCallback((w) => {
      if (w.id === 'storm') {
        this.audio.playThunder();
      } else if (w.id === 'rockfall') {
        this.audio.playStoneClatter();
      } else if (w.id === 'zephyr') {
        this.audio.playAchievementChime();
      }
      this.notifyListeners();
    });

    this.simState = createInitialSimulationState();
    const best = loadAllTimeBest();
    this.scoreState = createInitialScoreState(best);
  }

  public init(): void {
    if (typeof document !== 'undefined') {
      document.body.dataset.state = this.gameState;
    }
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public destroy(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.inputProcessor.clear();
  }

  public subscribe(listener: SnapshotListener): () => void {
    this.snapshotListeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.snapshotListeners.delete(listener);
    };
  }

  public getSnapshot(): EngineSnapshot {
    return {
      gameState: this.gameState,
      score: { ...this.scoreState },
      velocity: this.simState.velocity,
      inputsPerSec: this.inputProcessor.getInputsPerSecond(),
      activeSkin: this.skinManager.getActiveSkin(),
      activeTerrain: this.terrainManager.getActiveTerrain(),
      isRollingBackward: this.simState.isRollingBackward,
      totalInputs: this.inputProcessor.getTotalInputs(),
      isMuted: this.audio.getMuted(),
      currentSlopeAngleDeg: this.simState.currentSlopeAngleDeg,
      slopeSteepnessMultiplier: this.simState.slopeSteepnessMultiplier,
      activeWeather: this.weatherSystem.getCurrentWeather(),
      weatherTimeRemaining: this.weatherSystem.getTimeRemaining(),
      weatherCycleProgress: this.weatherSystem.getCycleProgress(),
    };
  }

  private notifyListeners(): void {
    const snap = this.getSnapshot();
    this.snapshotListeners.forEach((l) => l(snap));
  }

  public setGameState(state: GameState): void {
    this.gameState = state;
    if (typeof document !== 'undefined') {
      document.body.dataset.state = state;
    }
    if (state === 'playing') {
      this.inputProcessor.clear();
    }
    this.notifyListeners();
  }

  public startGame(): void {
    this.setGameState('playing');
  }

  public togglePause(): void {
    if (this.gameState === 'playing') {
      this.setGameState('paused');
    } else if (this.gameState === 'paused') {
      this.setGameState('playing');
    }
  }

  public resetClimb(): void {
    this.simState = createInitialSimulationState();
    this.scoreState = createInitialScoreState(this.scoreState.allTimeBest);
    this.inputProcessor.clear();
    this.setGameState('playing');
    this.notifyListeners();
  }

  public toggleMute(): boolean {
    const muted = this.audio.toggleMute();
    this.notifyListeners();
    return muted;
  }

  public resize(width: number, height: number): void {
    this.renderer.resize(width, height);
  }

  // --- Input Handlers (Universal Spam Mechanism) ---

  public handleKeyDown(keyId: string, timestamp: number = performance.now()): void {
    if (this.gameState === 'title') {
      if (keyId === 'Enter' || keyId === ' ' || keyId === 'Space') {
        this.startGame();
        return;
      }
    }

    if (keyId === 'Escape' || keyId === 'p' || keyId === 'P') {
      if (this.gameState === 'playing' || this.gameState === 'paused') {
        this.togglePause();
        return;
      }
    }

    if (keyId === 'm' || keyId === 'M') {
      this.toggleMute();
      return;
    }

    if (this.gameState !== 'playing') return;

    const event: RawInputEvent = {
      id: `key_${keyId}`,
      type: 'keyboard',
      timestamp,
    };

    const registered = this.inputProcessor.registerInput(event, DEFAULT_PHYSICS_CONFIG.basePushImpulse);
    if (registered) {
      this.audio.playPush(this.inputProcessor.getInputsPerSecond(timestamp));
    }
  }

  public handleKeyUp(keyId: string): void {
    this.inputProcessor.releaseKey(`key_${keyId}`);
  }

  public handlePointerDown(buttonId: number = 0, timestamp: number = performance.now()): void {
    if (this.gameState === 'title') {
      this.startGame();
      return;
    }
    if (this.gameState !== 'playing') return;

    const event: RawInputEvent = {
      id: `mouse_${buttonId}`,
      type: 'mouse',
      timestamp,
    };

    const registered = this.inputProcessor.registerInput(event, DEFAULT_PHYSICS_CONFIG.basePushImpulse);
    if (registered) {
      this.audio.playPush(this.inputProcessor.getInputsPerSecond(timestamp));
    }
  }

  public handlePointerUp(buttonId: number = 0): void {
    this.inputProcessor.releaseKey(`mouse_${buttonId}`);
  }

  public clearHeldInputs(): void {
    this.inputProcessor.clear();
  }

  // --- Main Simulation Loop ---

  private loop = (currentTime: number): void => {
    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Clamped dt to prevent tunnelling or frame-skip spikes
    const dt = Math.min(rawDt, 0.05);

    if (this.gameState === 'playing') {
      // 1. Advance dynamic weather system
      this.weatherSystem.update(dt);
      const activeWeather = this.weatherSystem.getCurrentWeather();

      // 2. Consume accumulated parallel push impulses from multi-finger input queue
      const impulses = this.inputProcessor.flushImpulses(DEFAULT_PHYSICS_CONFIG.basePushImpulse);
      for (const imp of impulses) {
        this.simState = enqueuePushImpulse(this.simState, imp, currentTime);
      }

      // 3. Fetch active dynamic modifiers & terrain slope modulated by dynamic weather
      const baseModifiers = this.upgradeSystem.computeModifiers();
      const modifiers: DynamicModifiers = {
        ...baseModifiers,
        weatherGravityMultiplier: activeWeather.gravityMultiplier,
        weatherFrictionMultiplier: activeWeather.frictionMultiplier,
        weatherPushMultiplier: activeWeather.pushMultiplier,
        weatherWindForce: activeWeather.windForce,
      };

      const activeTerrain = this.terrainManager.getActiveTerrain();
      const physicsConfig = {
        ...DEFAULT_PHYSICS_CONFIG,
        slopeAngleDeg: activeTerrain.slopeAngleDeg,
        rollingFriction: DEFAULT_PHYSICS_CONFIG.rollingFriction * activeTerrain.frictionFactor,
      };

      // 4. Step pure physics with weather and slope steepness
      this.simState = stepPhysics(this.simState, dt, physicsConfig, modifiers);

      // 5. Update pure scoring state
      this.scoreState = updateScoreState(this.scoreState, this.simState.distance);

      // Check rollback alert sound
      if (this.simState.isRollingBackward && !this.wasRollingBack) {
        this.audio.playRollbackSting();
      }
      this.wasRollingBack = this.simState.isRollingBackward;

      // Update rolling ambient rumble
      this.audio.updateRollingSound(this.simState.velocity);

      // 6. Evaluate achievements
      this.evaluateAchievements(currentTime);
    } else {
      this.audio.updateRollingSound(0);
    }

    // 7. Update rendering particles & screen shake
    this.renderer.updateParticles(dt);

    // 8. Render Canvas 2D scene with weather effects
    const activeSkin = this.skinManager.getActiveSkin();
    const activeTerrain = this.terrainManager.getActiveTerrain();
    const inputsPerSec = this.inputProcessor.getInputsPerSecond(currentTime);
    const currentWeather = this.weatherSystem.getCurrentWeather();

    this.renderer.render(this.simState, activeSkin, activeTerrain, inputsPerSec, dt, currentWeather);

    // 9. Throttle HUD state updates to ~12 FPS so React reconciles without 60Hz frame tax
    if (currentTime - this.lastSnapshotTime > 80) {
      this.lastSnapshotTime = currentTime;
      this.notifyListeners();
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  public evaluateAchievements(currentTime: number = performance.now()): Achievement[] {
    const stats: AchievementStats = {
      maxDistance: this.scoreState.maxDistance,
      currentDistance: this.scoreState.currentDistance,
      inputsPerSecond: this.inputProcessor.getInputsPerSecond(currentTime),
      metersRolledBack: this.scoreState.metersRolledBack,
      totalInputs: this.inputProcessor.getTotalInputs(),
      totalUpgradesPurchased: this.upgradeSystem.getTotalPurchasedLevels(),
      strengthLevel: this.upgradeSystem.getLevel('strength'),
      frictionLevel: this.upgradeSystem.getLevel('friction'),
      enduranceLevel: this.upgradeSystem.getLevel('endurance'),
      resonanceLevel: this.upgradeSystem.getLevel('resonance'),
      maxedUpgradeTiersCount: this.upgradeSystem.getMaxedTiersCount(),
      unlockedSkinsCount: this.skinManager.getUnlockedCount(this.scoreState.maxDistance),
      unlockedTerrainsCount: this.terrainManager.getUnlockedCount(this.scoreState.maxDistance),
      currentWeather: this.weatherSystem.getCurrentWeather().id,
      velocity: this.simState.velocity,
      activeSkinId: this.skinManager.getActiveSkin().id,
      activeTerrainId: this.terrainManager.getActiveTerrain().id,
    };

    const newlyUnlocked = this.achievementSystem.checkAchievements(stats);
    if (newlyUnlocked.length > 0) {
      this.audio.playAchievementChime();
      this.notifyListeners();
    }
    return newlyUnlocked;
  }
}
