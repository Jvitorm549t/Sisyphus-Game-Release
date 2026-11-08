/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Shield,
  Palette,
  Map,
  Trophy,
  Check,
  Lock,
  ChevronUp,
  Mountain,
  Crown,
  Zap,
  Flame,
  RotateCcw,
} from 'lucide-react';
import { SisyphusEngine } from '../game/engine';
import { UpgradeTier, StoneSkin, TerrainType, Achievement, AchievementCategory } from '../game/types';
import { formatMeters } from '../game/scoring';

interface ExpansionsModalProps {
  engine: SisyphusEngine;
  onClose: () => void;
  availableMeters: number;
}

export const ExpansionsModal: React.FC<ExpansionsModalProps> = ({
  engine,
  onClose,
  availableMeters,
}) => {
  const [activeTab, setActiveTab] = useState<'upgrades' | 'skins' | 'terrains' | 'achievements'>('upgrades');
  const [selectedCategory, setSelectedCategory] = useState<'all' | AchievementCategory>('all');
  const [, setTick] = useState(0);

  const forceRefresh = () => setTick((t) => t + 1);

  const upgrades = engine.upgradeSystem.getUpgrades();
  const skins = engine.skinManager.getSkins();
  const activeSkin = engine.skinManager.getActiveSkin();
  const terrains = engine.terrainManager.getTerrains();
  const activeTerrain = engine.terrainManager.getActiveTerrain();
  const achievements = engine.achievementSystem.getAchievements();

  const handleBuyUpgrade = (id: string) => {
    const res = engine.upgradeSystem.purchase(id, availableMeters);
    if (res.success) {
      engine.evaluateAchievements();
      forceRefresh();
    }
  };

  const handleSelectSkin = (id: string) => {
    if (engine.skinManager.selectSkin(id, availableMeters)) {
      engine.evaluateAchievements();
      forceRefresh();
    }
  };

  const handleSelectTerrain = (id: string) => {
    if (engine.terrainManager.selectTerrain(id, availableMeters)) {
      engine.evaluateAchievements();
      forceRefresh();
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2
                className="text-xl font-bold uppercase tracking-wider text-zinc-100"
                style={{ fontFamily: '"Cinzel", serif' }}
              >
                Arsenal & Expansões
              </h2>
            </div>
            <p className="text-zinc-400 text-xs mt-0.5 font-mono">
              Distância Máxima Acumulada: <strong className="text-amber-400 tabular-nums">{formatMeters(availableMeters)}m</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
            aria-label="Fechar Arsenal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 font-mono text-xs">
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`flex-1 py-3 px-2 flex items-center justify-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upgrades'
                ? 'border-amber-500 text-amber-400 font-bold bg-zinc-900/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Upgrades</span>
          </button>

          <button
            onClick={() => setActiveTab('skins')}
            className={`flex-1 py-3 px-2 flex items-center justify-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'skins'
                ? 'border-amber-500 text-amber-400 font-bold bg-zinc-900/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Skins da Rocha</span>
          </button>

          <button
            onClick={() => setActiveTab('terrains')}
            className={`flex-1 py-3 px-2 flex items-center justify-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'terrains'
                ? 'border-amber-500 text-amber-400 font-bold bg-zinc-900/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Terrenos</span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-3 px-2 flex items-center justify-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'achievements'
                ? 'border-amber-500 text-amber-400 font-bold bg-zinc-900/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Conquistas</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono">
          {/* UPGRADES TAB */}
          {activeTab === 'upgrades' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-xs italic">
                Aprimore as faculdades físicas e espirituais de Sísifo para enfrentar a gravidade do Tártaro.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upgrades.map((up) => {
                  const cost = engine.upgradeSystem.calculateCost(up);
                  const isMax = up.level >= up.maxLevel;
                  const canBuy = !isMax && availableMeters >= cost;

                  return (
                    <div
                      key={up.id}
                      className="bg-zinc-950/70 border border-zinc-800 p-3.5 rounded flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-zinc-200">{up.name}</h4>
                          <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-amber-400 font-bold">
                            NV. {up.level}/{up.maxLevel}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs font-sans">{up.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                        <div className="text-xs">
                          {isMax ? (
                            <span className="text-amber-500 font-bold">NÍVEL MÁXIMO</span>
                          ) : (
                            <span className="text-zinc-400">
                              Custo: <strong className="text-zinc-100 tabular-nums">{cost}m</strong>
                            </span>
                          )}
                        </div>

                        {!isMax && (
                          <button
                            onClick={() => handleBuyUpgrade(up.id)}
                            disabled={!canBuy}
                            className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors flex items-center space-x-1 cursor-pointer ${
                              canBuy
                                ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Evoluir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SKINS TAB */}
          {activeTab === 'skins' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-xs italic">
                Escolha o acabamento material e o peso mítico da rocha de condenação.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skins.map((skin) => {
                  const unlocked = engine.skinManager.isUnlocked(skin, availableMeters);
                  const isSelected = activeSkin.id === skin.id;

                  return (
                    <div
                      key={skin.id}
                      className={`p-3.5 rounded border transition-all flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-500'
                          : 'bg-zinc-950/70 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Skin preview swatch */}
                        <div
                          className="w-10 h-10 rounded-full border-2 border-zinc-950 shrink-0 shadow-inner flex items-center justify-center"
                          style={{
                            background: `radial-gradient(circle at 35% 35%, ${skin.accentColor}, ${skin.primaryColor}, ${skin.secondaryColor})`,
                          }}
                        />
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-zinc-200">{skin.name}</h4>
                          <p className="text-zinc-400 text-xs font-sans">{skin.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                        <span className="text-[11px] text-zinc-400">
                          {unlocked ? (
                            <span className="text-emerald-400 font-semibold">Desbloqueada</span>
                          ) : (
                            <span className="text-zinc-400 flex items-center space-x-1">
                              <Lock className="w-3 h-3 text-zinc-400 inline" />
                              <span>Requer {skin.unlockedAtMeters}m</span>
                            </span>
                          )}
                        </span>

                        <button
                          onClick={() => handleSelectSkin(skin.id)}
                          disabled={!unlocked || isSelected}
                          className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors flex items-center space-x-1 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-zinc-950 cursor-default'
                              : unlocked
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                              : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Ativa</span>
                            </>
                          ) : (
                            <span>Equipar</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TERRAINS TAB */}
          {activeTab === 'terrains' && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-xs italic">
                Caminhe pelas diferentes encostas e abismos eternos do mundo inferior.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {terrains.map((terr) => {
                  const unlocked = engine.terrainManager.isUnlocked(terr, availableMeters);
                  const isSelected = activeTerrain.id === terr.id;

                  return (
                    <div
                      key={terr.id}
                      className={`p-3.5 rounded border transition-all flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? 'bg-amber-950/30 border-amber-500'
                          : 'bg-zinc-950/70 border-zinc-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-zinc-200">{terr.name}</h4>
                          <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                            Declive: {terr.slopeAngleDeg}°
                          </span>
                        </div>
                        <p className="text-zinc-400 text-xs font-sans">{terr.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
                        <span className="text-[11px] text-zinc-400">
                          {unlocked ? (
                            <span className="text-emerald-400 font-semibold">Liberado</span>
                          ) : (
                            <span className="text-zinc-400 flex items-center space-x-1">
                              <Lock className="w-3 h-3 text-zinc-400 inline" />
                              <span>Requer {terr.unlockedAtMeters}m</span>
                            </span>
                          )}
                        </span>

                        <button
                          onClick={() => handleSelectTerrain(terr.id)}
                          disabled={!unlocked || isSelected}
                          className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors flex items-center space-x-1 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-zinc-950 cursor-default'
                              : unlocked
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                              : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Ativo</span>
                            </>
                          ) : (
                            <span>Viajar</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab === 'achievements' && (() => {
            const unlockedCount = achievements.filter((a) => a.unlocked).length;
            const totalCount = achievements.length;
            const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

            const filteredAchievements = achievements.filter((ach) => {
              if (selectedCategory === 'all') return true;
              return ach.category === selectedCategory;
            });

            const renderAchIcon = (iconName: string, unlocked: boolean) => {
              const iconClass = `w-4 h-4 ${unlocked ? 'text-amber-400' : 'text-zinc-500'}`;
              switch (iconName) {
                case 'mountain':
                  return <Mountain className={iconClass} />;
                case 'crown':
                  return <Crown className={iconClass} />;
                case 'shield':
                  return <Shield className={iconClass} />;
                case 'zap':
                  return <Zap className={iconClass} />;
                case 'flame':
                  return <Flame className={iconClass} />;
                case 'rotate-ccw':
                  return <RotateCcw className={iconClass} />;
                case 'trophy':
                default:
                  return <Trophy className={iconClass} />;
              }
            };

            const categories: { id: 'all' | AchievementCategory; label: string }[] = [
              { id: 'all', label: 'Todas' },
              { id: 'distance', label: 'Altitude (até 100k)' },
              { id: 'upgrades', label: 'Arsenal' },
              { id: 'cadence', label: 'Dedos & Spam' },
              { id: 'weather', label: 'Clima' },
              { id: 'perseverance', label: 'Resiliência' },
              { id: 'customization', label: 'Skins & Reinos' },
            ];

            return (
              <div className="space-y-4">
                {/* Progress Card */}
                <div className="bg-zinc-950/70 p-3.5 rounded border border-zinc-800">
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <span className="text-zinc-300 font-semibold tracking-wider uppercase">
                      Progresso Mitológico
                    </span>
                    <span className="text-amber-400 font-bold tabular-nums">
                      {unlockedCount} / {totalCount} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded text-[11px] transition-colors cursor-pointer border ${
                        selectedCategory === cat.id
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold'
                          : 'bg-zinc-950/50 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Achievements List */}
                <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                  {filteredAchievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`p-3 rounded border flex items-center justify-between transition-colors ${
                        ach.unlocked
                          ? 'bg-zinc-950/80 border-amber-500/50'
                          : 'bg-zinc-950/30 border-zinc-800/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                            ach.unlocked ? 'bg-amber-500/20' : 'bg-zinc-800'
                          }`}
                        >
                          {renderAchIcon(ach.icon, ach.unlocked)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-bold text-zinc-100">{ach.title}</h4>
                            {ach.category && (
                              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 font-mono">
                                {ach.category}
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-400 text-[11px] font-sans mt-0.5">{ach.description}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-3">
                        {ach.unlocked ? (
                          <span className="text-[10px] text-amber-400 font-mono font-bold uppercase px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/30">
                            Conquistado
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono uppercase px-2 py-0.5 bg-zinc-900 rounded">
                            Bloqueado
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
