/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Flag, X, Volume2, VolumeX, Sparkles, Trophy } from 'lucide-react';
import { LevelData } from '../game/types.ts';
import { soundEngine } from '../game/audio.ts';

interface GameHUDProps {
  level: LevelData;
  progressPercent: number;
  attempts: number;
  jumps: number;
  coinsCount: number;
  isPractice: boolean;
  checkpointCount: number;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  isMuted: boolean;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onExitToMenu: () => void;
  onToggleMute: () => void;
  onAddCheckpoint: () => void;
  onRemoveCheckpoint: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  level,
  progressPercent,
  attempts,
  jumps,
  coinsCount,
  isPractice,
  checkpointCount,
  isPaused,
  isGameOver,
  isVictory,
  isMuted,
  onPause,
  onResume,
  onRestart,
  onExitToMenu,
  onToggleMute,
  onAddCheckpoint,
  onRemoveCheckpoint,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 select-none">
      {/* Top Bar: Progress Bar & Level Info */}
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
        {/* Progress Bar Container */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-3.5 bg-black/70 rounded-full border border-cyan-500/40 overflow-hidden shadow-lg p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 rounded-full transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
          <span className="text-sm font-black font-mono text-cyan-300 w-12 text-right tabular-nums drop-shadow">
            {Math.round(progressPercent)}%
          </span>
        </div>

        {/* Level Name & Attempt Count */}
        <div className="flex justify-between w-full mt-1.5 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <span>{level.name}</span>
          {isPractice && (
            <span className="text-emerald-400 font-extrabold flex items-center gap-1">
              <Flag size={12} /> Practice Mode ({checkpointCount})
            </span>
          )}
          <span>Attempt {attempts}</span>
        </div>
      </div>

      {/* Top Right Utility Controls */}
      <div className="absolute top-4 right-4 pointer-events-auto flex items-center gap-2">
        <button
          onClick={onToggleMute}
          tabIndex={-1}
          className="p-2 rounded-lg bg-black/60 border border-slate-700/80 hover:bg-slate-800 text-slate-300 transition-colors shadow-lg"
          title="Toggle Mute [M]"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button
          onClick={onPause}
          tabIndex={-1}
          className="px-3 py-1.5 rounded-lg bg-black/60 border border-slate-700/80 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300 transition-colors shadow-lg"
          title="Pause Game [Esc / P]"
        >
          Pause
        </button>
      </div>

      {/* Practice Mode In-Game Checkpoint Buttons (Bottom Left) */}
      {isPractice && (
        <div className="pointer-events-auto flex items-center gap-2 mb-2">
          <button
            onClick={() => {
              soundEngine.playCheckpoint();
              onAddCheckpoint();
            }}
            tabIndex={-1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
            title="Place Checkpoint [Z]"
          >
            <Flag size={14} /> Place [Z]
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              onRemoveCheckpoint();
            }}
            tabIndex={-1}
            disabled={checkpointCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 disabled:opacity-40 text-white font-extrabold text-xs uppercase shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
            title="Delete Checkpoint [X]"
          >
            <X size={14} /> Delete [X]
          </button>
        </div>
      )}

      {/* Status Modal: PAUSED */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/80 pointer-events-auto flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border-2 border-cyan-500/40 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center gap-6">
            <h2 className="text-2xl font-black uppercase tracking-widest text-cyan-400">
              PAUSED
            </h2>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={onResume}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider shadow-lg transition-transform active:scale-95"
              >
                <Play size={18} className="fill-black" /> Resume [Esc]
              </button>
              <button
                onClick={onRestart}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold uppercase tracking-wider shadow-lg transition-transform active:scale-95"
              >
                <RotateCcw size={18} /> Restart
              </button>
              <button
                onClick={onExitToMenu}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider transition-colors"
              >
                <Home size={18} /> Level Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal: GAME OVER / DEFEAT */}
      {isGameOver && (
        <div className="fixed inset-0 bg-black/75 pointer-events-auto flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-[#0f172a] border-2 border-rose-500/50 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-3xl font-black uppercase tracking-wider text-rose-500 drop-shadow">
                CRASHED!
              </h2>
              <p className="text-xs text-slate-400 uppercase font-bold mt-1">
                Progress: <span className="text-cyan-400 tabular-nums">{Math.round(progressPercent)}%</span>
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 w-full bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Attempts</div>
                <div className="text-xl font-extrabold font-mono text-white tabular-nums">{attempts}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Jumps</div>
                <div className="text-xl font-extrabold font-mono text-white tabular-nums">{jumps}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                data-start="true"
                onClick={onRestart}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 text-black font-black uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-transform active:scale-95"
              >
                <RotateCcw size={18} /> Try Again [Space]
              </button>
              <button
                onClick={onExitToMenu}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-wider text-xs transition-colors"
              >
                <Home size={16} /> Exit to Levels
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal: VICTORY / LEVEL COMPLETE */}
      {isVictory && (
        <div className="fixed inset-0 bg-black/80 pointer-events-auto flex items-center justify-center p-4 z-50 animate-in zoom-in-95">
          <div className="bg-[#0f172a] border-2 border-yellow-400/60 rounded-2xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(250,204,21,0.3)] flex flex-col items-center gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-400 text-black flex items-center justify-center mb-3 shadow-lg shadow-yellow-400/50">
                <Trophy size={32} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-wider text-yellow-400">
                LEVEL COMPLETE!
              </h2>
              <span className="text-xs text-slate-300 font-bold uppercase tracking-wide mt-1">
                {level.name} (100%)
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 w-full bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center">
              <div>
                <div className="text-[9px] uppercase font-bold text-slate-400">Attempts</div>
                <div className="text-lg font-extrabold font-mono text-white tabular-nums">{attempts}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase font-bold text-slate-400">Jumps</div>
                <div className="text-lg font-extrabold font-mono text-white tabular-nums">{jumps}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase font-bold text-slate-400">Coins</div>
                <div className="text-lg font-extrabold font-mono text-amber-400 tabular-nums">{coinsCount}/3</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                data-start="true"
                onClick={onRestart}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 text-black font-black uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-transform active:scale-95"
              >
                <Sparkles size={18} /> Play Again [Space]
              </button>
              <button
                onClick={onExitToMenu}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-wider text-xs transition-colors"
              >
                <Home size={16} /> Level Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
