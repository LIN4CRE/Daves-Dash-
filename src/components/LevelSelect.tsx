/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Play, Plus, Trash2, Edit3, Compass } from 'lucide-react';
import { LevelData } from '../game/types.ts';
import { getLevelProgress, OFFICIAL_LEVELS, getCustomLevels, deleteCustomLevel } from '../game/levels.ts';
import { soundEngine } from '../game/audio.ts';

interface LevelSelectProps {
  onSelectLevel: (level: LevelData, isPractice: boolean) => void;
  onOpenEditor: (level?: LevelData) => void;
  onBack: () => void;
}

export const LevelSelect: React.FC<LevelSelectProps> = ({
  onSelectLevel,
  onOpenEditor,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'official' | 'custom'>('official');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [customLevels, setCustomLevels] = useState<LevelData[]>(() => getCustomLevels());

  const currentLevels = activeTab === 'official' ? OFFICIAL_LEVELS : customLevels;
  const level = currentLevels[currentIndex] || currentLevels[0];

  const progress = level ? getLevelProgress(level.id) : { bestPercent: 0, practicePercent: 0, coinsCollected: [], completed: false };

  const handleNext = () => {
    soundEngine.playClick();
    setCurrentIndex(i => (i + 1) % currentLevels.length);
  };

  const handlePrev = () => {
    soundEngine.playClick();
    setCurrentIndex(i => (i - 1 + currentLevels.length) % currentLevels.length);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playClick();
    deleteCustomLevel(id);
    const updated = getCustomLevels();
    setCustomLevels(updated);
    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }
  };

  const getDifficultyFace = (diff: string) => {
    switch (diff) {
      case 'easy':
        return { emoji: '🔵', color: 'from-blue-500 to-cyan-400', label: 'Easy' };
      case 'normal':
        return { emoji: '🟢', color: 'from-emerald-500 to-green-400', label: 'Normal' };
      case 'hard':
        return { emoji: '🟡', color: 'from-amber-500 to-yellow-400', label: 'Hard' };
      case 'harder':
        return { emoji: '🔴', color: 'from-rose-500 to-red-600', label: 'Harder' };
      case 'insane':
        return { emoji: '🟣', color: 'from-fuchsia-600 to-purple-800', label: 'Insane' };
      case 'demon':
      default:
        return { emoji: '😈', color: 'from-red-600 to-black', label: 'Demon' };
    }
  };

  const diffInfo = level ? getDifficultyFace(level.difficulty) : getDifficultyFace('normal');

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b16] text-white select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#0d1424] border-b border-cyan-500/20">
        <button
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold uppercase tracking-wider text-xs transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('official');
              setCurrentIndex(0);
            }}
            className={`px-5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all ${
              activeTab === 'official' ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Campaign
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setActiveTab('custom');
              setCurrentIndex(0);
              setCustomLevels(getCustomLevels());
            }}
            className={`px-5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all ${
              activeTab === 'custom' ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Custom Levels ({customLevels.length})
          </button>
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenEditor();
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase shadow-md shadow-emerald-500/30 transition-colors"
        >
          <Plus size={16} /> Create
        </button>
      </header>

      {/* Main Carousel Display */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Parallax Background Aura */}
        <div className="absolute inset-0 bg-radial from-cyan-950/20 via-transparent to-transparent pointer-events-none" />

        {currentLevels.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Compass size={48} className="text-slate-500" />
            <h2 className="text-xl font-bold text-slate-300">No Custom Levels Yet</h2>
            <p className="text-sm text-slate-400 max-w-sm">
              Use the built-in Level Editor to design, test, and share your own obstacle courses!
            </p>
            <button
              onClick={() => onOpenEditor()}
              className="mt-2 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold uppercase tracking-wider"
            >
              Open Level Editor
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-6 w-full max-w-3xl justify-between z-10">
            {/* Left Carousel Arrow */}
            <button
              onClick={handlePrev}
              className="p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:scale-110 transition-transform shadow-xl border border-slate-700"
            >
              <ChevronLeft size={28} />
            </button>

            {/* Central Level Card */}
            <div className="flex-1 flex flex-col items-center bg-[#0d1629] border-2 border-cyan-500/30 rounded-2xl p-8 shadow-2xl relative">
              {/* Difficulty Emblem */}
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${diffInfo.color} flex items-center justify-center text-4xl shadow-lg mb-4 transform hover:scale-105 transition-transform`}
              >
                {diffInfo.emoji}
              </div>

              <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-1">
                {level.name}
              </h2>

              <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mb-6 uppercase tracking-wider">
                <span>By {level.author}</span>
                <span>•</span>
                <span className="text-amber-400">{level.stars} Stars</span>
                <span>•</span>
                <span className="text-cyan-400">{level.bpm} BPM</span>
              </div>

              {/* Secret Coins Slot (3 coins) */}
              <div className="flex gap-3 mb-6">
                {[0, 1, 2].map(idx => {
                  const collected = progress.coinsCollected.includes(idx);
                  return (
                    <div
                      key={idx}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        collected
                          ? 'bg-amber-400 text-black border-yellow-200 shadow-md shadow-amber-400/50 scale-110'
                          : 'bg-slate-900 border-slate-700 text-slate-600'
                      }`}
                    >
                      🪙
                    </div>
                  );
                })}
              </div>

              {/* Progress Bars */}
              <div className="w-full max-w-md flex flex-col gap-3 mb-8">
                {/* Normal Progress */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-300 uppercase">Normal Mode</span>
                    <span className="text-cyan-400 font-mono">{progress.bestPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                      style={{ width: `${progress.bestPercent}%` }}
                    />
                  </div>
                </div>

                {/* Practice Progress */}
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-300 uppercase">Practice Mode</span>
                    <span className="text-emerald-400 font-mono">{progress.practicePercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                      style={{ width: `${progress.practicePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4">
                {/* Practice Mode Toggle */}
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setIsPracticeMode(!isPracticeMode);
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-extrabold uppercase tracking-wider transition-all ${
                    isPracticeMode
                      ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300 shadow-lg shadow-emerald-500/20'
                      : 'border-slate-700 bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  Practice: {isPracticeMode ? 'ON [Z/X]' : 'OFF'}
                </button>

                {/* Big Play Button */}
                <button
                  onClick={() => {
                    soundEngine.playJump();
                    onSelectLevel(level, isPracticeMode);
                  }}
                  className="flex items-center gap-2.5 px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 hover:brightness-110 text-black font-black text-base uppercase tracking-wider shadow-xl shadow-amber-500/40 hover:scale-105 transition-all"
                >
                  <Play size={20} className="fill-black" /> Play
                </button>

                {/* Custom Level Edit or Delete */}
                {activeTab === 'custom' && (
                  <>
                    <button
                      onClick={() => onOpenEditor(level)}
                      className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Edit in Level Creator"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={e => handleDeleteCustom(level.id, e)}
                      className="p-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50"
                      title="Delete Level"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right Carousel Arrow */}
            <button
              onClick={handleNext}
              className="p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:scale-110 transition-transform shadow-xl border border-slate-700"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Counter */}
      <footer className="text-center py-3 text-xs text-slate-500 font-mono bg-[#090d18]">
        {currentLevels.length > 0 && `${currentIndex + 1} of ${currentLevels.length}`}
      </footer>
    </div>
  );
};
