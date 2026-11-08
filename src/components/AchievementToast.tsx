/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Achievement } from '../game/types';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 transform pointer-events-none ${
        visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      }`}
    >
      <div className="flex items-center space-x-3 bg-zinc-900 border-2 border-amber-500/80 px-4 py-3 rounded-lg shadow-2xl text-zinc-100 max-w-sm">
        <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5 text-amber-400" />
        </div>
        <div className="space-y-0.5 font-mono">
          <p className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
            CONQUISTA DESBLOQUEADA!
          </p>
          <h4 className="text-xs font-bold text-zinc-100">{achievement.title}</h4>
          <p className="text-[11px] text-zinc-400 font-sans">{achievement.description}</p>
        </div>
      </div>
    </div>
  );
};
