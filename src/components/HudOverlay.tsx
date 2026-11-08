/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CloudLightning,
  CloudFog,
  Wind,
  Mountain,
  Sun,
} from 'lucide-react';
import { EngineSnapshot } from '../game/engine';
import { formatMeters } from '../game/scoring';
import { WeatherKind, WeatherCondition } from '../game/types';

interface HudOverlayProps {
  snapshot: EngineSnapshot;
  onPause: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onOpenExpansions: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  snapshot,
  onPause,
  onRestart,
  onToggleMute,
  onOpenExpansions,
}) => {
  const {
    score,
    velocity,
    inputsPerSec,
    isRollingBackward,
    isMuted,
    activeTerrain,
    currentSlopeAngleDeg,
    slopeSteepnessMultiplier,
    activeWeather,
    weatherTimeRemaining,
    weatherCycleProgress,
  } = snapshot;
  const currentM = Math.floor(score.currentDistance);
  const maxM = Math.floor(score.maxDistance);
  const bestM = Math.floor(score.allTimeBest);

  // Intensity ratio based on inputs per second (0 to 20 scale)
  const spamRatio = Math.min(1.0, inputsPerSec / 16);
  const isSteep = slopeSteepnessMultiplier > 1.2;

  const renderWeatherIcon = (kind: WeatherKind) => {
    switch (kind) {
      case 'storm':
        return <CloudLightning className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />;
      case 'fog':
        return <CloudFog className="w-3.5 h-3.5 text-slate-300 shrink-0" />;
      case 'rockfall':
        return <Mountain className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'zephyr':
        return <Wind className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'calm':
      default:
        return <Sun className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
    }
  };

  const getDifficultyBadge = (impact: WeatherCondition['difficultyImpact']) => {
    switch (impact) {
      case 'harder':
        return {
          text: 'MAIS DIFÍCIL',
          className: 'bg-red-950/80 text-red-300 border-red-700/60',
        };
      case 'easier':
        return {
          text: 'MAIS FÁCIL',
          className: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
        };
      case 'neutral':
      default:
        return {
          text: 'NORMAL',
          className: 'bg-zinc-800/80 text-zinc-300 border-zinc-700/60',
        };
    }
  };

  const diffBadge = getDifficultyBadge(activeWeather?.difficultyImpact ?? 'neutral');

  return (
    <div className="absolute inset-0 z-10 pointer-events-none p-5 sm:p-8 flex flex-col justify-between">
      {/* Top Header Cluster */}
      <div className="flex justify-between items-start w-full">
        {/* Left: Altitude & Metric Readouts */}
        <div className="flex flex-col space-y-2 bg-zinc-950/80 p-3.5 rounded border border-zinc-800/90 shadow-md">
          <div className="flex items-baseline space-x-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400">ALTITUDE</span>
            <span
              className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-zinc-100 tabular-nums"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatMeters(currentM)}
              <span className="text-amber-500 text-lg font-normal ml-1">m</span>
            </span>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono text-zinc-400 border-t border-zinc-800/60 pt-1.5">
            <div>
              <span className="text-zinc-400 mr-1">RUN:</span>
              <span className="text-zinc-200 font-semibold tabular-nums">{maxM}m</span>
            </div>
            <div>
              <span className="text-zinc-400 mr-1">RECORDE:</span>
              <span className="text-amber-400 font-semibold tabular-nums">{bestM}m</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-zinc-400 mr-1">DECLIVE:</span>
              <span className={`font-semibold tabular-nums ${isSteep ? 'text-amber-400' : 'text-zinc-300'}`}>
                {currentSlopeAngleDeg.toFixed(1)}°
              </span>
            </div>
          </div>
        </div>

        {/* Center: Input Frequency & Rollback Status Alert & Weather Status */}
        <div className="flex flex-col items-center space-y-1.5">
          {/* Rollback Warning */}
          {isRollingBackward && (
            <div className="flex items-center space-x-1.5 bg-red-950/90 border border-red-700/80 px-3 py-1 rounded text-red-200 text-xs font-mono tracking-wide animate-pulse shadow-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>DESLIZANDO LADEIRA ABAIXO!</span>
            </div>
          )}

          {/* Active Weather Banner */}
          {activeWeather && (
            <div className="flex items-center space-x-2 bg-zinc-950/85 px-3 py-1.5 rounded border border-zinc-800 shadow-sm text-xs font-mono">
              <div className="flex items-center space-x-1.5">
                {renderWeatherIcon(activeWeather.id)}
                <span className="text-zinc-200 font-semibold tracking-wide">{activeWeather.name}</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${diffBadge.className}`}>
                {diffBadge.text}
              </span>
              <span className="text-zinc-400 text-[11px] tabular-nums">
                {Math.ceil(weatherTimeRemaining)}s
              </span>
            </div>
          )}

          {/* Input Rate Gauge */}
          <div className="flex flex-col items-center bg-zinc-950/75 px-3 py-1.5 rounded border border-zinc-800 text-center">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">CADÊNCIA</span>
              <span className="text-amber-400 font-mono font-bold text-sm tabular-nums">
                {inputsPerSec} <span className="text-[10px] text-zinc-400 font-normal">inputs/s</span>
              </span>
            </div>

            {/* Visual meter bar */}
            <div className="w-28 sm:w-36 h-1.5 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-100"
                style={{ width: `${Math.round(spamRatio * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Quick Utility Control Cluster */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <button
            onClick={onOpenExpansions}
            tabIndex={-1}
            className="flex items-center space-x-1.5 px-3 py-2 bg-zinc-900/90 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white rounded border border-zinc-700 text-xs font-mono transition-colors shadow-sm cursor-pointer"
            aria-label="Abrir Upgrades e Arsenal"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Upgrades</span>
          </button>

          <button
            onClick={onToggleMute}
            tabIndex={-1}
            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white rounded border border-zinc-700 transition-colors shadow-sm cursor-pointer"
            aria-label={isMuted ? 'Ativar Áudio (M)' : 'Silenciar Áudio (M)'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-zinc-300" />}
          </button>

          <button
            onClick={onRestart}
            tabIndex={-1}
            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white rounded border border-zinc-700 transition-colors shadow-sm cursor-pointer"
            aria-label="Reiniciar Escalada da Base (R)"
          >
            <RotateCcw className="w-4 h-4 text-zinc-300" />
          </button>

          <button
            onClick={onPause}
            tabIndex={-1}
            className="p-2 bg-zinc-900/90 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-300 hover:text-white rounded border border-zinc-700 transition-colors shadow-sm cursor-pointer"
            aria-label="Pausar Jogo (Esc)"
          >
            <Pause className="w-4 h-4 text-zinc-300" />
          </button>
        </div>
      </div>

      {/* Bottom Hint Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end w-full text-zinc-400 text-xs font-mono gap-2">
        <div className="bg-zinc-950/80 px-3 py-1.5 rounded border border-zinc-800/80 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>TERRENO: <strong className="text-zinc-200">{activeTerrain.name}</strong></span>
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <span>CLIMA: <strong className="text-amber-300">{activeWeather?.name}</strong></span>
          <span className="text-zinc-500 text-[11px] hidden md:inline">({activeWeather?.gameplayClue})</span>
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <span>INCLINAÇÃO: <strong className={isSteep ? 'text-amber-400' : 'text-zinc-200'}>{currentSlopeAngleDeg.toFixed(1)}°</strong></span>
          <span className="text-zinc-600 hidden sm:inline">·</span>
          <span>GRAVIDADE: <strong className={isSteep ? 'text-amber-400' : 'text-zinc-200'}>{(slopeSteepnessMultiplier * (activeWeather?.gravityMultiplier ?? 1)).toFixed(2)}x</strong></span>
        </div>

        <div className="hidden lg:block bg-zinc-950/75 px-3 py-1 rounded border border-zinc-800/80">
          <span>SPAM LIVRE · PRESSIONE QUALQUER TECLA / CLIQUE PARA EMPURRAR</span>
        </div>
      </div>
    </div>
  );
};
