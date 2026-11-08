/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherCondition, WeatherKind } from './types';

export const WEATHER_CONDITIONS: Record<WeatherKind, WeatherCondition> = {
  calm: {
    id: 'calm',
    name: 'Calmaria Fúnebre',
    description: 'O ar pesado do Tártaro repousa em silêncio. Atmosfera de penitência estática.',
    gameplayClue: 'Condições basais normais.',
    difficultyImpact: 'neutral',
    durationSeconds: 24,
    gravityMultiplier: 1.0,
    frictionMultiplier: 1.0,
    pushMultiplier: 1.0,
    windForce: 0,
    ambientParticleType: 'none',
  },
  fog: {
    id: 'fog',
    name: 'Névoa do Rio Estige',
    description: 'Névoa espectral condensa sobre as rochas, reduzindo drasticamente a tração do solo.',
    gameplayClue: 'Atrito reduzido (-25%): a pedra escorrega muito mais se você parar!',
    difficultyImpact: 'harder',
    durationSeconds: 20,
    gravityMultiplier: 1.02,
    frictionMultiplier: 0.75,
    pushMultiplier: 1.05,
    windForce: -8,
    ambientParticleType: 'fog',
  },
  storm: {
    id: 'storm',
    name: 'Tempestade de Raios',
    description: 'Raios cortam o céu do abismo com vendaval contrário violento empurrando tudo para baixo.',
    gameplayClue: 'Vento contra violento e +20% gravidade: escalada extremamente difícil!',
    difficultyImpact: 'harder',
    durationSeconds: 18,
    gravityMultiplier: 1.20,
    frictionMultiplier: 1.10,
    pushMultiplier: 0.88,
    windForce: -36,
    ambientParticleType: 'rain',
  },
  rockfall: {
    id: 'rockfall',
    name: 'Chuva de Pedriscos',
    description: 'Pequenas rochas e cinzas vulcânicas despencam do pico, tornando a encosta irregular.',
    gameplayClue: 'Solo acidentado (+30% atrito): cada metro exige mais vigor nos dedos.',
    difficultyImpact: 'harder',
    durationSeconds: 16,
    gravityMultiplier: 1.08,
    frictionMultiplier: 1.30,
    pushMultiplier: 0.90,
    windForce: -16,
    ambientParticleType: 'falling_stones',
  },
  zephyr: {
    id: 'zephyr',
    name: 'Sopro de Zéfiro',
    description: 'Uma corrente divina ascendente empurra a rocha ladeira acima com ímpeto favorável.',
    gameplayClue: 'Vento a favor (+25% de impulso, -15% de gravidade): momento ideal para sprint!',
    difficultyImpact: 'easier',
    durationSeconds: 15,
    gravityMultiplier: 0.85,
    frictionMultiplier: 0.95,
    pushMultiplier: 1.25,
    windForce: 32,
    ambientParticleType: 'updraft',
  },
};

export const WEATHER_CYCLE: WeatherKind[] = ['calm', 'storm', 'fog', 'zephyr', 'rockfall'];

export class DynamicWeatherSystem {
  private currentWeather: WeatherCondition;
  private timeRemaining: number;
  private cycleIndex: number = 0;
  private onWeatherChange?: (weather: WeatherCondition) => void;

  constructor(initialKind: WeatherKind = 'calm', onWeatherChange?: (weather: WeatherCondition) => void) {
    this.currentWeather = WEATHER_CONDITIONS[initialKind];
    this.timeRemaining = this.currentWeather.durationSeconds;
    this.onWeatherChange = onWeatherChange;
  }

  public setWeatherChangeCallback(callback: (weather: WeatherCondition) => void): void {
    this.onWeatherChange = callback;
  }

  public getCurrentWeather(): WeatherCondition {
    return this.currentWeather;
  }

  public getActiveWeather(): WeatherCondition {
    return this.currentWeather;
  }

  public getTimeRemaining(): number {
    return Math.max(0, this.timeRemaining);
  }

  public getCycleIndex(): number {
    return this.cycleIndex;
  }

  public getCycleProgress(): number {
    const total = this.currentWeather.durationSeconds;
    return Math.min(1.0, Math.max(0, 1 - this.timeRemaining / total));
  }

  public update(dt: number): boolean {
    this.timeRemaining -= dt;

    if (this.timeRemaining <= 0) {
      this.advanceWeather();
      return true; // Indicates weather changed this frame
    }
    return false;
  }

  public step(dt: number): boolean {
    return this.update(dt);
  }

  public setWeather(kind: WeatherKind): void {
    this.currentWeather = WEATHER_CONDITIONS[kind];
    this.timeRemaining = this.currentWeather.durationSeconds;
    const idx = WEATHER_CYCLE.indexOf(kind);
    if (idx !== -1) {
      this.cycleIndex = idx;
    }
    if (this.onWeatherChange) {
      this.onWeatherChange(this.currentWeather);
    }
  }

  public advanceWeather(): WeatherCondition {
    this.cycleIndex = (this.cycleIndex + 1) % WEATHER_CYCLE.length;
    const nextKind = WEATHER_CYCLE[this.cycleIndex];
    this.setWeather(nextKind);
    return this.currentWeather;
  }

  public applyModifiers(base: {
    strengthMultiplier: number;
    frictionMultiplier: number;
    enduranceMultiplier: number;
    multiFingerBonus: number;
  }) {
    return {
      ...base,
      weatherGravityMultiplier: this.currentWeather.gravityMultiplier,
      weatherFrictionMultiplier: this.currentWeather.frictionMultiplier,
      weatherPushMultiplier: this.currentWeather.pushMultiplier,
      weatherWindForce: this.currentWeather.windForce,
    };
  }
}
