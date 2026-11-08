/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Sparkles } from 'lucide-react';
import { EngineSnapshot } from '../game/engine';
import { formatMeters } from '../game/scoring';

interface PauseModalProps {
  snapshot: EngineSnapshot;
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
  onOpenExpansions: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  snapshot,
  onResume,
  onRestart,
  onTitle,
  onOpenExpansions,
}) => {
  const { score, totalInputs, activeSkin } = snapshot;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-lg p-6 sm:p-8 shadow-2xl space-y-6 text-zinc-100">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-amber-500 font-mono text-xs uppercase tracking-widest">SUBMUNDO EM SUSPENSÃO</p>
          <h2
            className="text-3xl font-bold uppercase tracking-wider text-zinc-100"
            style={{ fontFamily: '"Cinzel", serif' }}
          >
            JOGO PAUSADO
          </h2>
          <p className="text-zinc-400 text-xs italic">
            Mesmo em repouso, o peso da rocha aguarda seu retorno.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 bg-zinc-950/80 p-3.5 rounded border border-zinc-800 text-center font-mono">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 uppercase">Altitude</span>
            <span className="text-lg font-bold text-zinc-200 tabular-nums">
              {formatMeters(score.currentDistance)}m
            </span>
          </div>
          <div className="flex flex-col border-x border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase">Recorde Run</span>
            <span className="text-lg font-bold text-amber-400 tabular-nums">
              {formatMeters(score.maxDistance)}m
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 uppercase">Inputs Totais</span>
            <span className="text-lg font-bold text-zinc-300 tabular-nums">
              {totalInputs}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-zinc-950 font-bold uppercase tracking-wider rounded font-mono flex items-center justify-center space-x-2 transition-transform active:scale-98 cursor-pointer shadow-md"
            aria-label="Continuar Escalada"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>CONTINUAR (ESC)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenExpansions}
              className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded border border-zinc-700 font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              aria-label="Abrir Upgrades"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Upgrades</span>
            </button>

            <button
              onClick={onRestart}
              className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded border border-zinc-700 font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              aria-label="Reiniciar do Pé da Montanha"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          </div>

          <button
            onClick={onTitle}
            className="w-full py-2 bg-transparent hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 rounded font-mono text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            aria-label="Voltar para a Tela Inicial"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Voltar ao Menu Inicial</span>
          </button>
        </div>
      </div>
    </div>
  );
};
