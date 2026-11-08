/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UpgradeTier, DynamicModifiers } from '../types';

export const INITIAL_UPGRADES: UpgradeTier[] = [
  {
    id: 'strength',
    name: 'Musculatura Titânica',
    description: 'Aumenta a força de cada empurrão individual.',
    attribute: 'strength',
    level: 0,
    maxLevel: 10,
    costInMeters: 25,
    multiplierPerLevel: 0.12, // +12% push force per level
  },
  {
    id: 'friction',
    name: 'Grip de Calcário',
    description: 'Melhora a tração da pedra na encosta, reduzindo a queda ao parar.',
    attribute: 'friction',
    level: 0,
    maxLevel: 8,
    costInMeters: 40,
    multiplierPerLevel: 0.15, // +15% friction
  },
  {
    id: 'endurance',
    name: 'Vontade Absurda (Camus)',
    description: 'Mitiga a gravidade implacável do Tártaro pela resiliência mental.',
    attribute: 'endurance',
    level: 0,
    maxLevel: 6,
    costInMeters: 75,
    multiplierPerLevel: 0.10, // reduces perceived gravity effect
  },
  {
    id: 'resonance',
    name: 'Sincronia Polifônica',
    description: 'Bônus de impacto amplificado ao usar múltiplos dedos simultâneos.',
    attribute: 'resonance',
    level: 0,
    maxLevel: 5,
    costInMeters: 100,
    multiplierPerLevel: 0.20, // +20% multi-finger synergy
  },
];

export class UpgradeSystem {
  private upgrades: Map<string, UpgradeTier> = new Map();

  constructor(initialTiers: UpgradeTier[] = INITIAL_UPGRADES) {
    initialTiers.forEach((t) => this.upgrades.set(t.id, { ...t }));
    this.loadState();
  }

  public getUpgrades(): UpgradeTier[] {
    return Array.from(this.upgrades.values());
  }

  public getUpgrade(id: string): UpgradeTier | undefined {
    return this.upgrades.get(id);
  }

  public canPurchase(id: string, availableMeters: number): boolean {
    const up = this.upgrades.get(id);
    if (!up) return false;
    if (up.level >= up.maxLevel) return false;
    const currentCost = this.calculateCost(up);
    return availableMeters >= currentCost;
  }

  public calculateCost(up: UpgradeTier): number {
    return Math.round(up.costInMeters * Math.pow(1.65, up.level));
  }

  public purchase(id: string, availableMeters: number): { success: boolean; costPaid: number } {
    const up = this.upgrades.get(id);
    if (!up || !this.canPurchase(id, availableMeters)) {
      return { success: false, costPaid: 0 };
    }

    const cost = this.calculateCost(up);
    up.level += 1;
    this.saveState();
    return { success: true, costPaid: cost };
  }

  public computeModifiers(): DynamicModifiers {
    let strength = 1.0;
    let friction = 1.0;
    let endurance = 1.0;
    let resonance = 1.15;

    const strengthUp = this.upgrades.get('strength');
    if (strengthUp) strength += strengthUp.level * strengthUp.multiplierPerLevel;

    const frictionUp = this.upgrades.get('friction');
    if (frictionUp) friction += frictionUp.level * frictionUp.multiplierPerLevel;

    const enduranceUp = this.upgrades.get('endurance');
    if (enduranceUp) endurance += enduranceUp.level * enduranceUp.multiplierPerLevel;

    const resonanceUp = this.upgrades.get('resonance');
    if (resonanceUp) resonance += resonanceUp.level * resonanceUp.multiplierPerLevel;

    return {
      strengthMultiplier: strength,
      frictionMultiplier: friction,
      enduranceMultiplier: endurance,
      multiFingerBonus: resonance,
    };
  }

  private saveState(): void {
    try {
      const data: Record<string, number> = {};
      this.upgrades.forEach((u, k) => {
        data[k] = u.level;
      });
      localStorage.setItem('sisyphus_upgrades', JSON.stringify(data));
    } catch {
      // Ignore
    }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem('sisyphus_upgrades');
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const [key, level] of Object.entries(parsed)) {
          const up = this.upgrades.get(key);
          if (up && typeof level === 'number') {
            up.level = Math.min(up.maxLevel, Math.max(0, level));
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  public reset(): void {
    this.upgrades.forEach((u) => {
      u.level = 0;
    });
    this.saveState();
  }

  public getTotalPurchasedLevels(): number {
    let sum = 0;
    this.upgrades.forEach((u) => {
      sum += u.level;
    });
    return sum;
  }

  public getMaxedTiersCount(): number {
    let count = 0;
    this.upgrades.forEach((u) => {
      if (u.level >= u.maxLevel) {
        count++;
      }
    });
    return count;
  }

  public getLevel(id: string): number {
    return this.upgrades.get(id)?.level ?? 0;
  }
}
