/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Sparkles } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
  allTimeBest: number;
  onOpenExpansions: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  allTimeBest,
  onOpenExpansions,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 sm:p-12 pointer-events-none">
      {/* Top Bar with record */}
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center space-x-2 text-zinc-400 font-mono text-xs uppercase tracking-widest bg-zinc-900/80 px-3.5 py-1.5 rounded border border-zinc-800">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>RECORDE HISTÓRICO: <strong className="text-zinc-100 tabular-nums">{Math.floor(allTimeBest)}m</strong></span>
        </div>

        <button
          onClick={onOpenExpansions}
          className="pointer-events-auto flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 px-3.5 py-1.5 rounded border border-zinc-700/80 transition-colors shadow-sm"
          aria-label="Abrir Upgrades e Cosméticos"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Arsenal & Skins</span>
        </button>
      </div>

      {/* Hero Center Title Lockup */}
      <div className="flex flex-col items-center text-center max-w-xl mx-auto my-auto space-y-6">
        {/* Bespoke inline Greek Myth Emblem SVG */}
        <div className="w-24 h-24 mb-2 opacity-90 drop-shadow-md">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <circle cx="50" cy="50" r="44" stroke="#71717a" strokeWidth="2.5" strokeDasharray="6 4" />
            {/* Incline slope line */}
            <path d="M15 80 L85 28" stroke="#d4d4d8" strokeWidth="3.5" strokeLinecap="round" />
            {/* Boulder */}
            <circle cx="54" cy="42" r="16" fill="#27272a" stroke="#fbbf24" strokeWidth="2.5" />
            <path d="M48 38 L60 46 M54 32 L54 52" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
            {/* Sisyphus silhouette pushing */}
            <circle cx="34" cy="52" r="4.5" fill="#e4e4e7" />
            <path d="M34 56 L39 64 L30 73" stroke="#e4e4e7" strokeWidth="3" strokeLinecap="round" />
            <path d="M37 60 L48 50" stroke="#e4e4e7" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <div className="space-y-2">
          <p className="text-amber-500/90 font-mono text-xs uppercase tracking-[0.3em]">
            MITO GREGO · ARCADE INFINITO
          </p>
          <h1
            className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-100 uppercase drop-shadow-lg"
            style={{ fontFamily: '"Cinzel", serif' }}
          >
            SÍSIFO
          </h1>
          <p className="text-zinc-400 text-sm max-w-md mx-auto italic font-serif">
            &ldquo;A luta contra os cumes basta para preencher o coração de um homem. É preciso imaginar Sísifo feliz.&rdquo;
          </p>
        </div>

        {/* Primary CTA */}
        <div className="pt-2">
          <button
            data-start="true"
            onClick={onStart}
            className="pointer-events-auto inline-flex items-center space-x-3 px-8 py-3.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-zinc-950 font-bold uppercase tracking-wider rounded transition-transform active:scale-95 shadow-lg shadow-amber-950/40 text-base font-mono cursor-pointer"
            aria-label="Iniciar escalada da montanha"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>INICIAR ESCALADA</span>
          </button>
        </div>
      </div>

      {/* Flat Control Hints Footer */}
      <div className="w-full text-center">
        <p className="text-zinc-400 font-mono text-xs tracking-wider">
          SPAM QUALQUER TECLA OU CLIQUE DO MOUSE · MULTI-DEDOS SOMA FORÇA · ESC PAUSAR
        </p>
      </div>
    </div>
  );
};
