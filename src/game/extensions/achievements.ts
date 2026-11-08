/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Achievement, AchievementStats } from '../types';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  // --- DISTANCE CLIMBING MILESTONES (10m to 100.000m) ---
  {
    id: 'first_steps',
    title: 'O Primeiro Esforço',
    description: 'Empurre a pedra por 10 metros na encosta do Tártaro.',
    icon: 'mountain',
    category: 'distance',
    condition: (s) => s.maxDistance >= 10,
    unlocked: false,
  },
  {
    id: 'departure_asphodel',
    title: 'Adeus ao Asfódelo',
    description: 'Supere os primeiros 50 metros da encosta sombria.',
    icon: 'mountain',
    category: 'distance',
    condition: (s) => s.maxDistance >= 50,
    unlocked: false,
  },
  {
    id: 'camus_triumph',
    title: 'O Homem Feliz (Camus)',
    description: 'Alcance 100 metros de altitude ladeira acima.',
    icon: 'trophy',
    category: 'distance',
    condition: (s) => s.maxDistance >= 100,
    unlocked: false,
  },
  {
    id: 'immortal_struggle',
    title: 'Lenda do Submundo',
    description: 'Supere a barreira dos 250 metros na montanha infinita.',
    icon: 'crown',
    category: 'distance',
    condition: (s) => s.maxDistance >= 250,
    unlocked: false,
  },
  {
    id: 'erebus_crossing',
    title: 'Travessia do Érebo',
    description: 'Alcance 500 metros de altitude através da escuridão densa.',
    icon: 'mountain',
    category: 'distance',
    condition: (s) => s.maxDistance >= 500,
    unlocked: false,
  },
  {
    id: 'first_kilometer',
    title: 'O Primeiro Quilômetro',
    description: 'Conquiste 1.000 metros de elevação contínua na rampa eterna.',
    icon: 'trophy',
    category: 'distance',
    condition: (s) => s.maxDistance >= 1000,
    unlocked: false,
  },
  {
    id: 'ascent_of_titans',
    title: 'Ascensão dos Titãs',
    description: 'Atinja 2.500 metros de altitude desafiando as profundezas.',
    icon: 'crown',
    category: 'distance',
    condition: (s) => s.maxDistance >= 2500,
    unlocked: false,
  },
  {
    id: 'cloud_piercer',
    title: 'Perfurador das Nuvens',
    description: 'Atinja 5.000 metros de altitude contra as correntes celestes.',
    icon: 'mountain',
    category: 'distance',
    condition: (s) => s.maxDistance >= 5000,
    unlocked: false,
  },
  {
    id: 'olympus_gaze',
    title: 'O Olhar do Olimpo',
    description: 'Alcance a monumental marca de 10.000 metros escalados.',
    icon: 'trophy',
    category: 'distance',
    condition: (s) => s.maxDistance >= 10000,
    unlocked: false,
  },
  {
    id: 'zenith_crags',
    title: 'Escarpa do Zênite',
    description: 'Conquiste 25.000 metros na colina sem fim.',
    icon: 'mountain',
    category: 'distance',
    condition: (s) => s.maxDistance >= 25000,
    unlocked: false,
  },
  {
    id: 'infinite_climb',
    title: 'O Cume do Impossível',
    description: 'Atinja 50.000 metros de altitude com persistência absoluta.',
    icon: 'crown',
    category: 'distance',
    condition: (s) => s.maxDistance >= 50000,
    unlocked: false,
  },
  {
    id: 'centenary_summit',
    title: 'A Grande Ascensão dos 100.000m',
    description: 'Rompa os limites mitológicos atingindo inacreditáveis 100.000 metros!',
    icon: 'crown',
    category: 'distance',
    condition: (s) => s.maxDistance >= 100000,
    unlocked: false,
  },

  // --- UPGRADES & ARSENAL PROGRESSION ---
  {
    id: 'first_upgrade',
    title: 'Ferreiro de Hades',
    description: 'Compre seu primeiro aprimoramento de atributo no arsenal.',
    icon: 'shield',
    category: 'upgrades',
    condition: (s) => s.totalUpgradesPurchased >= 1,
    unlocked: false,
  },
  {
    id: 'five_upgrades',
    title: 'Preparação Heroica',
    description: 'Acumule 5 níveis de aprimoramentos comprados.',
    icon: 'shield',
    category: 'upgrades',
    condition: (s) => s.totalUpgradesPurchased >= 5,
    unlocked: false,
  },
  {
    id: 'ten_upgrades',
    title: 'Musculatura Forjada em Ferro',
    description: 'Acumule 10 níveis de aprimoramentos no total.',
    icon: 'shield',
    category: 'upgrades',
    condition: (s) => s.totalUpgradesPurchased >= 10,
    unlocked: false,
  },
  {
    id: 'twenty_upgrades',
    title: 'Poder de Semideus',
    description: 'Acumule 20 níveis de aprimoramentos no arsenal.',
    icon: 'crown',
    category: 'upgrades',
    condition: (s) => s.totalUpgradesPurchased >= 20,
    unlocked: false,
  },
  {
    id: 'max_strength',
    title: 'Hércules do Tártaro',
    description: 'Eleve a Musculatura Titânica ao nível máximo (Nível 10).',
    icon: 'flame',
    category: 'upgrades',
    condition: (s) => s.strengthLevel >= 10,
    unlocked: false,
  },
  {
    id: 'max_friction',
    title: 'Grip Impenetrável',
    description: 'Eleve o Grip de Calcário ao nível máximo (Nível 8).',
    icon: 'shield',
    category: 'upgrades',
    condition: (s) => s.frictionLevel >= 8,
    unlocked: false,
  },
  {
    id: 'max_endurance',
    title: 'Determinação Absurda',
    description: 'Eleve a Vontade Absurda ao nível máximo (Nível 6).',
    icon: 'trophy',
    category: 'upgrades',
    condition: (s) => s.enduranceLevel >= 6,
    unlocked: false,
  },
  {
    id: 'max_resonance',
    title: 'Mestre da Polifonia',
    description: 'Eleve a Sincronia Polifônica ao nível máximo (Nível 5).',
    icon: 'zap',
    category: 'upgrades',
    condition: (s) => s.resonanceLevel >= 5,
    unlocked: false,
  },
  {
    id: 'arsenal_master',
    title: 'Arsenal Supremo',
    description: 'Maximize todas as 4 árvores de aprimoramentos do jogo.',
    icon: 'crown',
    category: 'upgrades',
    condition: (s) => s.maxedUpgradeTiersCount >= 4,
    unlocked: false,
  },

  // --- INPUT, CADENCE & MULTI-FINGER SPEED ---
  {
    id: 'speed_demon',
    title: 'Frenesi Digital',
    description: 'Atinja uma frequência de 10 inputs por segundo.',
    icon: 'zap',
    category: 'cadence',
    condition: (s) => s.inputsPerSecond >= 10,
    unlocked: false,
  },
  {
    id: 'multi_finger_slam',
    title: 'Tempestade de Dedos',
    description: 'Atinja 16 inputs por segundo combinando teclado e mouse.',
    icon: 'flame',
    category: 'cadence',
    condition: (s) => s.inputsPerSecond >= 16,
    unlocked: false,
  },
  {
    id: 'sonic_cadence',
    title: 'Velocidade Sônica',
    description: 'Supere a barreira de 22 inputs por segundo!',
    icon: 'zap',
    category: 'cadence',
    condition: (s) => s.inputsPerSecond >= 22,
    unlocked: false,
  },
  {
    id: 'total_inputs_100',
    title: 'Centena de Golpes',
    description: 'Execute 100 inputs totais de empurrão.',
    icon: 'flame',
    category: 'cadence',
    condition: (s) => s.totalInputs >= 100,
    unlocked: false,
  },
  {
    id: 'total_inputs_1000',
    title: 'Mil Impulsos Heroicos',
    description: 'Execute 1.000 inputs acumulados de esforço.',
    icon: 'trophy',
    category: 'cadence',
    condition: (s) => s.totalInputs >= 1000,
    unlocked: false,
  },
  {
    id: 'total_inputs_5000',
    title: 'Dedos de Titã',
    description: 'Execute 5.000 inputs acumulados na jornada.',
    icon: 'crown',
    category: 'cadence',
    condition: (s) => s.totalInputs >= 5000,
    unlocked: false,
  },
  {
    id: 'total_inputs_10000',
    title: 'A Maratona Infinita',
    description: 'Supere a colossal marca de 10.000 inputs dados na encosta.',
    icon: 'crown',
    category: 'cadence',
    condition: (s) => s.totalInputs >= 10000,
    unlocked: false,
  },

  // --- WEATHER & ATMOSPHERIC TRIALS ---
  {
    id: 'storm_conqueror',
    title: 'Domador da Tempestade',
    description: 'Suba e alcance mais de 30 metros durante uma Tempestade de Raios violenta.',
    icon: 'zap',
    category: 'weather',
    condition: (s) => s.currentWeather === 'storm' && s.currentDistance >= 30,
    unlocked: false,
  },
  {
    id: 'fog_dancer',
    title: 'Passos no Estige',
    description: 'Mantenha velocidade positiva de subida sob a escorregadia Névoa do Rio Estige.',
    icon: 'mountain',
    category: 'weather',
    condition: (s) => s.currentWeather === 'fog' && s.velocity > 1.2,
    unlocked: false,
  },
  {
    id: 'zephyr_surfer',
    title: 'Cavaleiro de Zéfiro',
    description: 'Aproveite o vento a favor de Zéfiro atingindo velocidade superior a 3.5 m/s.',
    icon: 'flame',
    category: 'weather',
    condition: (s) => s.currentWeather === 'zephyr' && s.velocity >= 3.5,
    unlocked: false,
  },
  {
    id: 'rockfall_endurer',
    title: 'Resistência ao Cascalho',
    description: 'Empurre com vigor e alcance 40 metros durante a Chuva de Pedriscos.',
    icon: 'mountain',
    category: 'weather',
    condition: (s) => s.currentWeather === 'rockfall' && s.currentDistance >= 40,
    unlocked: false,
  },

  // --- ROLLBACK & SISYPHUS THEME ---
  {
    id: 'rollback_survivor',
    title: 'Inércia Desafiada',
    description: 'Recupere a subida após acumular mais de 15 metros de recuo.',
    icon: 'rotate-ccw',
    category: 'perseverance',
    condition: (s) => s.metersRolledBack >= 15 && s.currentDistance > 10,
    unlocked: false,
  },
  {
    id: 'abyssal_rebound',
    title: 'Retorno do Abismo',
    description: 'Recupere o controle da rocha após sofrer mais de 50 metros de recuo.',
    icon: 'rotate-ccw',
    category: 'perseverance',
    condition: (s) => s.metersRolledBack >= 50 && s.currentDistance > 20,
    unlocked: false,
  },
  {
    id: 'eternal_return',
    title: 'O Eterno Retorno (Nietzsche)',
    description: 'Acumule mais de 100 metros de recuo total e continue empurrando sem cessar!',
    icon: 'trophy',
    category: 'perseverance',
    condition: (s) => s.metersRolledBack >= 100,
    unlocked: false,
  },

  // --- CUSTOMIZATION & EXPLORATION ---
  {
    id: 'geology_collector',
    title: 'Geólogo do Submundo',
    description: 'Desbloqueie pelo menos 3 skins cósmicas da pedra.',
    icon: 'crown',
    category: 'customization',
    condition: (s) => s.unlockedSkinsCount >= 3,
    unlocked: false,
  },
  {
    id: 'midas_touch',
    title: 'O Toque de Midas',
    description: 'Equipe e empurre a lendária skin Ouro de Midas.',
    icon: 'trophy',
    category: 'customization',
    condition: (s) => s.activeSkinId === 'midas_gold',
    unlocked: false,
  },
  {
    id: 'realm_walker',
    title: 'Caminhante dos Reinos',
    description: 'Desbloqueie todos os 4 terrenos do submundo mitológico.',
    icon: 'mountain',
    category: 'customization',
    condition: (s) => s.unlockedTerrainsCount >= 4,
    unlocked: false,
  },
  {
    id: 'styx_pinnacle',
    title: 'Pico dos Lamentos',
    description: 'Conquiste e alcance o terreno Pico dos Lamentos (300m).',
    icon: 'crown',
    category: 'customization',
    condition: (s) => s.activeTerrainId === 'styx_shores' || s.maxDistance >= 300,
    unlocked: false,
  },
];

export class AchievementSystem {
  private achievements: Achievement[] = [];
  private onUnlockedCallback?: (ach: Achievement) => void;

  constructor(callback?: (ach: Achievement) => void) {
    this.onUnlockedCallback = callback;
    this.achievements = INITIAL_ACHIEVEMENTS.map((a) => ({ ...a }));
    this.loadState();
  }

  public setUnlockCallback(callback: (ach: Achievement) => void): void {
    this.onUnlockedCallback = callback;
  }

  public getAchievements(): Achievement[] {
    return this.achievements;
  }

  public getUnlockedCount(): number {
    return this.achievements.filter((a) => a.unlocked).length;
  }

  public getTotalCount(): number {
    return this.achievements.length;
  }

  public checkAchievements(stats: AchievementStats): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    for (const ach of this.achievements) {
      if (!ach.unlocked && ach.condition(stats)) {
        ach.unlocked = true;
        ach.unlockedAt = Date.now();
        newlyUnlocked.push(ach);
        if (this.onUnlockedCallback) {
          this.onUnlockedCallback(ach);
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      this.saveState();
    }

    return newlyUnlocked;
  }

  private saveState(): void {
    try {
      const unlockedIds = this.achievements.filter((a) => a.unlocked).map((a) => a.id);
      localStorage.setItem('sisyphus_achievements', JSON.stringify(unlockedIds));
    } catch {
      // Ignore
    }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem('sisyphus_achievements');
      if (raw) {
        const ids: string[] = JSON.parse(raw);
        if (Array.isArray(ids)) {
          this.achievements.forEach((a) => {
            if (ids.includes(a.id)) {
              a.unlocked = true;
            }
          });
        }
      }
    } catch {
      // Ignore
    }
  }

  public reset(): void {
    this.achievements.forEach((a) => {
      a.unlocked = false;
      delete a.unlockedAt;
    });
    this.saveState();
  }
}
