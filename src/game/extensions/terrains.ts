/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TerrainType } from '../types';

export const TERRAINS: TerrainType[] = [
  {
    id: 'asphodel_gravel',
    name: 'Cascalho de Asfódelo',
    description: 'Encosta clássica das planícies do submundo. Terreno áspero e fúnebre.',
    slopeAngleDeg: 26,
    frictionFactor: 1.0,
    skyGradient: ['#09090b', '#18181b'],
    mountainColor: '#27272a',
    groundColor: '#3f3f46',
    groundAccentColor: '#71717a',
    unlockedAtMeters: 0,
  },
  {
    id: 'sulfur_crags',
    name: 'Escarpa de Enxofre',
    description: 'Vapores tóxicos e rochas pontiagudas sob o calor sulfuroso do abismo.',
    slopeAngleDeg: 28,
    frictionFactor: 0.9,
    skyGradient: ['#1c1005', '#431407'],
    mountainColor: '#291e13',
    groundColor: '#78350f',
    groundAccentColor: '#b45309',
    unlockedAtMeters: 60,
  },
  {
    id: 'phlegethon_abyss',
    name: 'Margem do Flegetonte',
    description: 'Borda escaldante do rio de fogo infernal. A pedra queima com brasas.',
    slopeAngleDeg: 30,
    frictionFactor: 0.85,
    skyGradient: ['#2e0808', '#7f1d1d'],
    mountainColor: '#450a0a',
    groundColor: '#991b1b',
    groundAccentColor: '#dc2626',
    unlockedAtMeters: 150,
  },
  {
    id: 'styx_shores',
    name: 'Pico dos Lamentos',
    description: 'O topo inacessível que sempre recua ao infinito. Vento gélido e pedras glaciais.',
    slopeAngleDeg: 32,
    frictionFactor: 0.8,
    skyGradient: ['#022c22', '#064e3b'],
    mountainColor: '#065f46',
    groundColor: '#047857',
    groundAccentColor: '#10b981',
    unlockedAtMeters: 300,
  },
];

export class TerrainManager {
  private activeTerrainId: string = 'asphodel_gravel';

  constructor() {
    this.loadState();
  }

  public getTerrains(): TerrainType[] {
    return TERRAINS;
  }

  public getActiveTerrain(): TerrainType {
    return TERRAINS.find((t) => t.id === this.activeTerrainId) || TERRAINS[0];
  }

  public selectTerrain(id: string, maxDistance: number): boolean {
    const t = TERRAINS.find((item) => item.id === id);
    if (!t) return false;
    if (maxDistance < t.unlockedAtMeters) return false;
    this.activeTerrainId = id;
    this.saveState();
    return true;
  }

  public isUnlocked(terrain: TerrainType, maxDistance: number): boolean {
    return maxDistance >= terrain.unlockedAtMeters;
  }

  public getUnlockedCount(maxDistance: number): number {
    return TERRAINS.filter((t) => maxDistance >= t.unlockedAtMeters).length;
  }

  private saveState(): void {
    try {
      localStorage.setItem('sisyphus_selected_terrain', this.activeTerrainId);
    } catch {
      // Ignore
    }
  }

  private loadState(): void {
    try {
      const saved = localStorage.getItem('sisyphus_selected_terrain');
      if (saved && TERRAINS.some((t) => t.id === saved)) {
        this.activeTerrainId = saved;
      }
    } catch {
      // Ignore
    }
  }
}
