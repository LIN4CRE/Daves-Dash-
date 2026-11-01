/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { PlayerCustomization } from '../game/types.ts';
import { soundEngine } from '../game/audio.ts';

interface IconKitProps {
  customization: PlayerCustomization;
  onUpdate: (updated: PlayerCustomization) => void;
  onBack: () => void;
}

const PRIMARY_COLORS = [
  '#22c55e', // Green (Classic)
  '#06b6d4', // Cyan
  '#f59e0b', // Amber/Gold
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#f97316', // Orange
  '#e2e8f0', // White/Silver
];

const SECONDARY_COLORS = [
  '#00ffff', // Electric Cyan
  '#ffff00', // Electric Yellow
  '#ff007f', // Neon Magenta
  '#10b981', // Emerald
  '#ffffff', // Pure White
  '#000000', // Midnight Black
  '#a855f7', // Purple
  '#3b82f6', // Sapphire Blue
];

const CUBE_SKINS = [
  { id: 0, name: 'Classic Dave', desc: 'The iconic smiling jumper' },
  { id: 1, name: 'Grinning Dave', desc: 'Toothy grin of confidence' },
  { id: 2, name: 'Cyber Visor', desc: 'High-tech illuminated optic band' },
  { id: 3, name: 'Ninja', desc: 'Stealth headband and sharp gaze' },
  { id: 4, name: 'Robo-Eye', desc: 'Bionic cybernetic scanner' },
  { id: 5, name: 'Glitch Core', desc: 'Shifting rotated geometry' },
];

const TRAILS = [
  { id: 'default', name: 'Solid Neon', color: 'from-cyan-400 to-transparent' },
  { id: 'rainbow', name: 'Rainbow Surge', color: 'from-red-500 via-yellow-400 to-blue-500' },
  { id: 'fire', name: 'Fire Streak', color: 'from-orange-500 via-yellow-300 to-transparent' },
  { id: 'void', name: 'Void Glow', color: 'from-purple-500 to-indigo-900' },
];

export const IconKit: React.FC<IconKitProps> = ({ customization, onUpdate, onBack }) => {
  const [activeTab, setActiveTab] = useState<'cube' | 'colors' | 'trail'>('cube');

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070913] text-white select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#0d1222] border-b border-cyan-500/20">
        <button
          onClick={() => {
            soundEngine.playClick();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold uppercase tracking-wider text-xs transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-xl font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
          <Sparkles size={20} className="text-yellow-400" /> Icon Kit
        </h1>
        <div className="w-16" />
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Live Hero Preview Stage */}
        <div className="w-full md:w-96 bg-[#0a0f1d] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col items-center justify-center p-8 relative">
          <div className="absolute inset-0 bg-radial from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

          {/* Floor line */}
          <div className="w-64 h-1 bg-cyan-500 shadow-lg shadow-cyan-500/50 mb-12" />

          {/* Floating animated preview cube */}
          <div className="relative -mt-24 mb-12 group">
            <div
              className="w-24 h-24 rounded-lg flex items-center justify-center relative transition-transform duration-300 hover:scale-110 shadow-2xl"
              style={{
                backgroundColor: customization.primaryColor,
                border: `5px solid ${customization.secondaryColor}`,
                boxShadow: `0 0 30px ${customization.secondaryColor}66`,
              }}
            >
              {/* Face Details */}
              {customization.cubeIcon === 0 && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-4">
                    <div className="w-4 h-4 bg-black rounded-sm" />
                    <div className="w-4 h-4 bg-black rounded-sm" />
                  </div>
                  <div className="w-10 h-3 bg-black rounded-sm" />
                </div>
              )}
              {customization.cubeIcon === 1 && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-4">
                    <div className="w-4 h-4 bg-black rounded-sm" />
                    <div className="w-4 h-4 bg-black rounded-sm" />
                  </div>
                  <div className="w-12 h-4 bg-white border-2 border-black flex">
                    <div className="w-3 border-r border-black" />
                    <div className="w-3 border-r border-black" />
                    <div className="w-3 border-r border-black" />
                  </div>
                </div>
              )}
              {customization.cubeIcon === 2 && (
                <div className="w-16 h-6 bg-cyan-300 shadow-md shadow-cyan-400 rounded-sm" />
              )}
              {customization.cubeIcon === 3 && (
                <div className="flex flex-col items-center gap-2 w-full px-2">
                  <div className="w-full h-7 bg-black flex items-center justify-center gap-3">
                    <div className="w-3 h-2 bg-white" />
                    <div className="w-3 h-2 bg-white" />
                  </div>
                </div>
              )}
              {customization.cubeIcon === 4 && (
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 bg-black rounded-sm" />
                  <div className="w-6 h-6 bg-red-500 rounded-full border border-black shadow-lg shadow-red-500/80" />
                </div>
              )}
              {customization.cubeIcon === 5 && (
                <div
                  className="w-8 h-8 rotate-45 shadow-lg"
                  style={{ backgroundColor: customization.secondaryColor }}
                />
              )}
            </div>

            {/* Trail preview effect */}
            <div className="absolute -left-12 top-8 w-12 h-8 bg-gradient-to-r from-transparent to-cyan-400/40 blur-xs rounded-full" />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-white tracking-wide">
              {CUBE_SKINS.find(s => s.id === customization.cubeIcon)?.name}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              {CUBE_SKINS.find(s => s.id === customization.cubeIcon)?.desc}
            </p>
          </div>
        </div>

        {/* Right: Customization Panels */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8">
          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-slate-800 pb-4 mb-6">
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('cube');
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-extrabold uppercase tracking-wider transition-all ${
                activeTab === 'cube'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Icons
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('colors');
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-extrabold uppercase tracking-wider transition-all ${
                activeTab === 'colors'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Colors
            </button>
            <button
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('trail');
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-extrabold uppercase tracking-wider transition-all ${
                activeTab === 'trail'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Trails
            </button>
          </div>

          {/* Tab 1: Cube Icons */}
          {activeTab === 'cube' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CUBE_SKINS.map(skin => {
                const isSelected = customization.cubeIcon === skin.id;
                return (
                  <button
                    key={skin.id}
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdate({ ...customization, cubeIcon: skin.id });
                    }}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/20 scale-102'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="w-16 h-16 rounded-md flex items-center justify-center mb-3 relative"
                      style={{
                        backgroundColor: customization.primaryColor,
                        border: `3px solid ${customization.secondaryColor}`,
                      }}
                    >
                      {skin.id === 0 && (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex gap-2.5">
                            <div className="w-2.5 h-2.5 bg-black" />
                            <div className="w-2.5 h-2.5 bg-black" />
                          </div>
                          <div className="w-6 h-2 bg-black" />
                        </div>
                      )}
                      {skin.id === 1 && (
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex gap-2.5">
                            <div className="w-2.5 h-2.5 bg-black" />
                            <div className="w-2.5 h-2.5 bg-black" />
                          </div>
                          <div className="w-8 h-2.5 bg-white border border-black" />
                        </div>
                      )}
                      {skin.id === 2 && (
                        <div className="w-10 h-3 bg-cyan-300 shadow-sm shadow-cyan-400" />
                      )}
                      {skin.id === 3 && (
                        <div className="w-full h-4 bg-black flex items-center justify-center gap-2">
                          <div className="w-2 h-1 bg-white" />
                          <div className="w-2 h-1 bg-white" />
                        </div>
                      )}
                      {skin.id === 4 && (
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 bg-black" />
                          <div className="w-3.5 h-3.5 bg-red-500 rounded-full" />
                        </div>
                      )}
                      {skin.id === 5 && (
                        <div className="w-5 h-5 rotate-45" style={{ backgroundColor: customization.secondaryColor }} />
                      )}
                    </div>
                    <span className="font-extrabold text-sm">{skin.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 2: Colors */}
          {activeTab === 'colors' && (
            <div className="flex flex-col gap-8">
              {/* Primary Color */}
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Primary Color (Body)
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {PRIMARY_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        soundEngine.playClick();
                        onUpdate({ ...customization, primaryColor: c });
                      }}
                      className="w-12 h-12 rounded-xl transition-transform hover:scale-110 flex items-center justify-center relative shadow-md"
                      style={{ backgroundColor: c }}
                    >
                      {customization.primaryColor === c && (
                        <Check size={20} className="text-black drop-shadow font-extrabold" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                  Secondary Color (Outline & Highlights)
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {SECONDARY_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        soundEngine.playClick();
                        onUpdate({ ...customization, secondaryColor: c });
                      }}
                      className="w-12 h-12 rounded-xl transition-transform hover:scale-110 flex items-center justify-center relative shadow-md"
                      style={{ backgroundColor: c }}
                    >
                      {customization.secondaryColor === c && (
                        <Check size={20} className={c === '#ffffff' ? 'text-black' : 'text-white'} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Trails */}
          {activeTab === 'trail' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRAILS.map(t => {
                const isSelected = customization.trail === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      soundEngine.playClick();
                      onUpdate({ ...customization, trail: t.id });
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/20'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-extrabold text-sm">{t.name}</span>
                      <div className={`w-32 h-2.5 rounded-full bg-gradient-to-r ${t.color} mt-2`} />
                    </div>
                    {isSelected && <Check size={20} className="text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
