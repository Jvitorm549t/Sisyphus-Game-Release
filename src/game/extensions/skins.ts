/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoneSkin } from '../types';

export const STONE_SKINS: StoneSkin[] = [
  {
    id: 'corinthian_limestone',
    name: 'Calcário de Corinto',
    description: 'A rocha original do castigo mitológico. Áspera, antiga e pesada.',
    unlockedAtMeters: 0,
    primaryColor: '#78716c',
    secondaryColor: '#44403c',
    accentColor: '#a8a29e',
    patternType: 'cracks',
  },
  {
    id: 'tartarus_obsidian',
    name: 'Obsidiana do Tártaro',
    description: 'Vidro vulcânico das profundezas, polido pelas eras do submundo.',
    unlockedAtMeters: 50,
    primaryColor: '#1c1917',
    secondaryColor: '#0c0a09',
    accentColor: '#38bdf8', // Neon cyan soul fissures
    patternType: 'obsidian',
  },
  {
    id: 'underworld_magma',
    name: 'Magma de Flegetonte',
    description: 'Rocha ígnea pulsante com veios incandescentes de fogo primordial.',
    unlockedAtMeters: 120,
    primaryColor: '#292524',
    secondaryColor: '#1c1917',
    accentColor: '#f97316', // Fiery glowing core
    patternType: 'magma',
  },
  {
    id: 'midas_gold',
    name: 'Ouro de Midas',
    description: 'Trocada em desafio aos deuses. O brilho da ganância e da ilusão.',
    unlockedAtMeters: 250,
    primaryColor: '#eab308',
    secondaryColor: '#a16207',
    accentColor: '#fef08a', // Divine shimmer
    patternType: 'gold',
  },
];

export class SkinManager {
  private selectedSkinId: string = 'corinthian_limestone';

  constructor() {
    this.loadState();
  }

  public getSkins(): StoneSkin[] {
    return STONE_SKINS;
  }

  public getActiveSkin(): StoneSkin {
    return STONE_SKINS.find((s) => s.id === this.selectedSkinId) || STONE_SKINS[0];
  }

  public selectSkin(id: string, maxDistance: number): boolean {
    const skin = STONE_SKINS.find((s) => s.id === id);
    if (!skin) return false;
    if (maxDistance < skin.unlockedAtMeters) return false;
    this.selectedSkinId = id;
    this.saveState();
    return true;
  }

  public isUnlocked(skin: StoneSkin, maxDistance: number): boolean {
    return maxDistance >= skin.unlockedAtMeters;
  }

  public getUnlockedCount(maxDistance: number): number {
    return STONE_SKINS.filter((s) => maxDistance >= s.unlockedAtMeters).length;
  }

  private saveState(): void {
    try {
      localStorage.setItem('sisyphus_selected_skin', this.selectedSkinId);
    } catch {
      // Ignore
    }
  }

  private loadState(): void {
    try {
      const saved = localStorage.getItem('sisyphus_selected_skin');
      if (saved && STONE_SKINS.some((s) => s.id === saved)) {
        this.selectedSkinId = saved;
      }
    } catch {
      // Ignore
    }
  }
}
