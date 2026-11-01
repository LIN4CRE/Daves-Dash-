/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TitleScreen } from './components/TitleScreen.tsx';
import { LevelSelect } from './components/LevelSelect.tsx';
import { GameCanvas } from './components/GameCanvas.tsx';
import { LevelEditor } from './components/LevelEditor.tsx';
import { IconKit } from './components/IconKit.tsx';
import { LevelData, PlayerCustomization } from './game/types.ts';
import { createEmptyCustomLevel, OFFICIAL_LEVELS } from './game/levels.ts';
import { soundEngine } from './game/audio.ts';

type AppView = 'title' | 'level_select' | 'playing' | 'editor' | 'icon_kit';

const DEFAULT_CUSTOMIZATION: PlayerCustomization = {
  cubeIcon: 0,
  shipIcon: 0,
  primaryColor: '#22c55e', // Classic green
  secondaryColor: '#00ffff', // Cyan glow
  trail: 'default',
  deathEffect: 'default',
};

const CUSTOMIZATION_STORAGE_KEY = 'daves_dash_customization';

export default function App() {
  const [view, setView] = useState<AppView>('title');
  const [activeLevel, setActiveLevel] = useState<LevelData>(OFFICIAL_LEVELS[0]);
  const [isPractice, setIsPractice] = useState<boolean>(false);
  const [playtestStartX, setPlaytestStartX] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getIsMuted());

  // Return destination after exiting 'playing'
  const [returnToView, setReturnToView] = useState<'level_select' | 'editor'>('level_select');

  // Customization state
  const [customization, setCustomization] = useState<PlayerCustomization>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CUSTOMIZATION;
    } catch {
      return DEFAULT_CUSTOMIZATION;
    }
  });

  const handleUpdateCustomization = (updated: PlayerCustomization) => {
    setCustomization(updated);
    try {
      localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save customization:', e);
    }
  };

  // Support ?autostart=1 parameter for direct verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setActiveLevel(OFFICIAL_LEVELS[0]);
      setIsPractice(false);
      setReturnToView('level_select');
      setView('playing');
    }
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white select-none">
      {/* Title Screen View */}
      {view === 'title' && (
        <TitleScreen
          onStartGame={() => setView('level_select')}
          onOpenEditor={() => {
            setActiveLevel(createEmptyCustomLevel('Custom Course'));
            setView('editor');
          }}
          onOpenIconKit={() => setView('icon_kit')}
          isMuted={isMuted}
          onToggleMute={() => {
            const m = soundEngine.toggleMute();
            setIsMuted(m);
          }}
        />
      )}

      {/* Level Select View */}
      {view === 'level_select' && (
        <LevelSelect
          onSelectLevel={(lvl, practice) => {
            setActiveLevel(lvl);
            setIsPractice(practice);
            setPlaytestStartX(0);
            setReturnToView('level_select');
            setView('playing');
          }}
          onOpenEditor={customLvl => {
            setActiveLevel(customLvl || createEmptyCustomLevel('My Custom Level'));
            setView('editor');
          }}
          onBack={() => setView('title')}
        />
      )}

      {/* Playing Active Game View */}
      {view === 'playing' && (
        <GameCanvas
          level={activeLevel}
          isPractice={isPractice}
          customization={customization}
          startWorldX={playtestStartX}
          onExit={() => setView(returnToView)}
        />
      )}

      {/* Custom Level Editor View */}
      {view === 'editor' && (
        <LevelEditor
          initialLevel={activeLevel}
          onExit={() => setView('level_select')}
          onPlaytest={(editedLevel, startX) => {
            setActiveLevel(editedLevel);
            setIsPractice(true); // playtesting defaults to practice checkpoints
            setPlaytestStartX(startX);
            setReturnToView('editor');
            setView('playing');
          }}
        />
      )}

      {/* Icon Kit Customizer View */}
      {view === 'icon_kit' && (
        <IconKit
          customization={customization}
          onUpdate={handleUpdateCustomization}
          onBack={() => setView('title')}
        />
      )}
    </div>
  );
}
