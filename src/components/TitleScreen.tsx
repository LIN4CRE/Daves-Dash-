/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Play, Hammer, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../game/audio.ts';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenEditor: () => void;
  onOpenIconKit: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenEditor,
  onOpenIconKit,
  isMuted,
  onToggleMute,
}) => {
  useEffect(() => {
    document.body.dataset.state = 'title';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        soundEngine.playJump();
        onStartGame();
      } else if (e.code === 'KeyM') {
        onToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, onToggleMute]);

  return (
    <div className="relative w-screen h-screen bg-[#070514] overflow-hidden flex flex-col justify-between items-center p-6 select-none">
      {/* Background Neon Grid & Parallax Deco */}
      <div className="absolute inset-0 bg-radial from-violet-950/40 via-purple-950/20 to-black pointer-events-none" />

      {/* Retro Grid floor line */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-950/40 to-transparent border-t border-cyan-500/30 pointer-events-none">
        <div className="w-full h-full opacity-20 bg-[radial-gradient(#00ffff_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Top Utility Controls */}
      <div className="w-full max-w-5xl flex justify-between items-center z-10 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400/80 uppercase px-3 py-1 bg-cyan-950/40 border border-cyan-500/20 rounded-full">
            WebGL Remake v2.1
          </span>
        </div>

        <button
          onClick={() => {
            soundEngine.playClick();
            onToggleMute();
          }}
          className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:bg-slate-800 text-slate-300 transition-colors shadow-lg"
          title="Toggle Audio [M]"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Center Stage: Title Lockup & Mascot */}
      <div className="flex flex-col items-center z-10 -mt-6">
        {/* Animated Flying Cube Mascot */}
        <div className="mb-6 animate-bounce">
          <div className="w-18 h-18 rounded-xl bg-cyan-400 border-4 border-yellow-300 shadow-[0_0_35px_rgba(34,211,238,0.7)] flex flex-col items-center justify-center p-2 rotate-6">
            <div className="flex gap-3 mb-1">
              <div className="w-3 h-3 bg-black rounded-xs" />
              <div className="w-3 h-3 bg-black rounded-xs" />
            </div>
            <div className="w-7 h-2 bg-black rounded-xs" />
          </div>
        </div>

        {/* Custom SVG Title Emblem */}
        <div className="relative mb-2">
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-500 drop-shadow-[0_8px_0_rgba(0,0,0,0.9)] stroke-white">
            DAVES DASH
          </h1>
          <span className="absolute -top-3 -right-6 text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-md bg-cyan-400 text-black uppercase tracking-wider rotate-12 shadow-lg">
            WebGL
          </span>
        </div>

        <p className="text-xs sm:text-sm text-cyan-300/80 font-bold uppercase tracking-widest mb-8">
          Rhythm · Precision · Level Creator
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md justify-center">
          {/* Main Start Play CTA */}
          <button
            data-start="true"
            onClick={() => {
              soundEngine.playJump();
              onStartGame();
            }}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 hover:brightness-110 text-black font-black text-lg uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all transform hover:scale-105 active:scale-95"
          >
            <Play size={24} className="fill-black" /> Play
          </button>

          {/* Level Creator Studio CTA */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenEditor();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-900/90 border-2 border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-extrabold text-sm uppercase tracking-wider shadow-lg hover:bg-cyan-950/30 transition-all transform hover:scale-105 active:scale-95"
          >
            <Hammer size={20} /> Level Editor
          </button>

          {/* Icon Kit Customizer CTA */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenIconKit();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-900/90 border-2 border-fuchsia-500/40 hover:border-fuchsia-400 text-fuchsia-300 font-extrabold text-sm uppercase tracking-wider shadow-lg hover:bg-fuchsia-950/30 transition-all transform hover:scale-105 active:scale-95"
          >
            <Sparkles size={20} /> Icon Kit
          </button>
        </div>
      </div>

      {/* Control Hint Footer (Clean borderless inline line) */}
      <footer className="z-10 pb-2 text-center">
        <p className="text-xs text-slate-400/90 font-mono tracking-wide">
          Space / Click Jump · Esc Pause · Hold Fly (Ship) · M Mute
        </p>
      </footer>
    </div>
  );
};
