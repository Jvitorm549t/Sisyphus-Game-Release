/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SisyphusEngine, EngineSnapshot } from './game/engine';
import { TitleScreen } from './components/TitleScreen';
import { HudOverlay } from './components/HudOverlay';
import { PauseModal } from './components/PauseModal';
import { ExpansionsModal } from './components/ExpansionsModal';
import { AchievementToast } from './components/AchievementToast';
import { Achievement } from './game/types';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SisyphusEngine | null>(null);

  const [snapshot, setSnapshot] = useState<EngineSnapshot | null>(null);
  const [showExpansions, setShowExpansions] = useState(false);
  const [activeToast, setActiveToast] = useState<Achievement | null>(null);

  // Initialize engine and listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new SisyphusEngine(canvas);
    engineRef.current = engine;

    // Achievement callback
    engine.achievementSystem.setUnlockCallback((ach) => {
      setActiveToast(ach);
    });

    // Subscribe to engine state snapshots
    const unsubscribe = engine.subscribe((snap) => {
      setSnapshot(snap);
    });

    // Initial resize
    const handleResize = () => {
      if (canvas) {
        engine.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Check ?autostart=1
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.startGame();
    }

    engine.init();

    // Global Key Listeners for Universal Spam Input
    const onKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scrolling on space/arrows during game
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
      }
      engine.handleKeyDown(e.key);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      engine.handleKeyUp(e.key);
    };

    const onBlur = () => {
      engine.clearHeldInputs();
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      engine.destroy();
    };
  }, []);

  // Pointer / Tap Handlers on the Canvas Viewport
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (engineRef.current) {
      engineRef.current.handlePointerDown(e.button);
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (engineRef.current) {
      engineRef.current.handlePointerUp(e.button);
    }
  }, []);

  // Actions
  const handleStart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.togglePause();
    }
  }, []);

  const handleResume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resetClimb();
    }
  }, []);

  const handleTitle = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setGameState('title');
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.toggleMute();
    }
  }, []);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none bg-zinc-950 font-sans"
      data-testid="game-container"
    >
      {/* 2D Simulation Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="absolute inset-0 w-full h-full cursor-pointer touch-none block"
        data-testid="sisyphus-canvas"
      />

      {/* Screen: Title Stage */}
      {snapshot?.gameState === 'title' && (
        <TitleScreen
          onStart={handleStart}
          allTimeBest={snapshot.score.allTimeBest}
          onOpenExpansions={() => setShowExpansions(true)}
        />
      )}

      {/* Screen: Live Playing HUD Overlay */}
      {snapshot && snapshot.gameState !== 'title' && (
        <HudOverlay
          snapshot={snapshot}
          onPause={handlePause}
          onRestart={handleRestart}
          onToggleMute={handleToggleMute}
          onOpenExpansions={() => setShowExpansions(true)}
        />
      )}

      {/* Modal: Pause State */}
      {snapshot?.gameState === 'paused' && (
        <PauseModal
          snapshot={snapshot}
          onResume={handleResume}
          onRestart={handleRestart}
          onTitle={handleTitle}
          onOpenExpansions={() => setShowExpansions(true)}
        />
      )}

      {/* Modal: Upgrades, Skins, Terrains, Achievements */}
      {showExpansions && engineRef.current && snapshot && (
        <ExpansionsModal
          engine={engineRef.current}
          availableMeters={snapshot.score.maxDistance}
          onClose={() => setShowExpansions(false)}
        />
      )}

      {/* Achievement Unlocked Toast Notification */}
      <AchievementToast
        achievement={activeToast}
        onDismiss={() => setActiveToast(null)}
      />
    </div>
  );
}
