/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelData, LevelObject } from './types.ts';

/**
 * Generates official campaign levels
 */
export const OFFICIAL_LEVELS: LevelData[] = [
  {
    id: 'stereo_rush',
    name: 'Stereo Rush',
    author: 'Dave',
    difficulty: 'easy',
    stars: 1,
    songId: 'stereo_rush',
    bpm: 130,
    bgColor: '#16082e', // Deep violet neon
    groundColor: '#30135c',
    length: 120, // grid units (~4800 px)
    coins: 3,
    objects: [
      // Starting rhythm jumps
      { id: 'sr-1', type: 'spike', x: 12, y: 0 },
      { id: 'sr-2', type: 'spike', x: 18, y: 0 },
      
      // Step up platforms
      { id: 'sr-3', type: 'block', x: 23, y: 0 },
      { id: 'sr-4', type: 'block', x: 24, y: 1 },
      { id: 'sr-5', type: 'block', x: 25, y: 1 },
      { id: 'sr-6', type: 'spike', x: 25, y: 0 },
      { id: 'sr-7', type: 'block', x: 26, y: 1 },
      { id: 'sr-8', type: 'spike', x: 28, y: 0 },

      // Pad jump section
      { id: 'sr-9', type: 'pad_jump', x: 33, y: 0 },
      { id: 'sr-10', type: 'spike', x: 35, y: 0 },
      { id: 'sr-11', type: 'spike', x: 36, y: 0 },
      { id: 'sr-12', type: 'block', x: 37, y: 3 },
      { id: 'sr-13', type: 'block', x: 38, y: 3 },
      { id: 'sr-14', type: 'coin', x: 38, y: 5 }, // Secret Coin 1!

      // Stepped descent
      { id: 'sr-15', type: 'block', x: 42, y: 2 },
      { id: 'sr-16', type: 'block', x: 44, y: 1 },
      { id: 'sr-17', type: 'spike', x: 46, y: 0 },

      // Color trigger transition to cyan
      { id: 'sr-trig-1', type: 'trigger_color', x: 48, y: 0, targetColor: '#07243b', targetElement: 'bg' },

      // Double spike jump
      { id: 'sr-18', type: 'spike', x: 50, y: 0 },
      { id: 'sr-19', type: 'spike', x: 51, y: 0 },

      // Ship Portal Transition!
      { id: 'sr-20', type: 'portal_ship', x: 55, y: 2 },

      // Ship cavern flight
      { id: 'sr-21', type: 'block', x: 60, y: 0 },
      { id: 'sr-22', type: 'block', x: 61, y: 0 },
      { id: 'sr-23', type: 'block', x: 60, y: 9 },
      { id: 'sr-24', type: 'block', x: 61, y: 9 },

      { id: 'sr-25', type: 'spike_down', x: 65, y: 9 },
      { id: 'sr-26', type: 'spike', x: 67, y: 0 },
      { id: 'sr-27', type: 'coin', x: 66, y: 5 }, // Secret Coin 2 (mid air)

      { id: 'sr-28', type: 'block', x: 72, y: 4 },
      { id: 'sr-29', type: 'block', x: 73, y: 4 },
      { id: 'sr-30', type: 'sawblade_small', x: 76, y: 2 },
      { id: 'sr-31', type: 'sawblade_small', x: 79, y: 6 },

      // Return to Cube Portal
      { id: 'sr-32', type: 'portal_cube', x: 86, y: 1 },

      // Finale rhythm jumps
      { id: 'sr-33', type: 'pad_jump', x: 91, y: 0 },
      { id: 'sr-34', type: 'spike', x: 93, y: 0 },
      { id: 'sr-35', type: 'spike', x: 94, y: 0 },
      { id: 'sr-36', type: 'block', x: 95, y: 2 },
      { id: 'sr-37', type: 'block', x: 96, y: 2 },
      { id: 'sr-38', type: 'spike', x: 98, y: 0 },
      { id: 'sr-39', type: 'spike', x: 99, y: 0 },
      { id: 'sr-40', type: 'spike', x: 100, y: 0 }, // Triple spike finale!
      { id: 'sr-41', type: 'coin', x: 104, y: 3 }, // Secret Coin 3!
      { id: 'sr-42', type: 'block', x: 104, y: 1 },
    ],
  },
  {
    id: 'back_on_track',
    name: 'Back on Track',
    author: 'Dave',
    difficulty: 'normal',
    stars: 2,
    songId: 'back_on_track',
    bpm: 140,
    bgColor: '#1d0c26',
    groundColor: '#451a5c',
    length: 125,
    coins: 3,
    objects: [
      { id: 'bot-1', type: 'spike', x: 10, y: 0 },
      { id: 'bot-2', type: 'pad_bounce', x: 15, y: 0 },
      { id: 'bot-3', type: 'block', x: 18, y: 2 },
      { id: 'bot-4', type: 'block', x: 19, y: 2 },
      { id: 'bot-5', type: 'spike', x: 22, y: 0 },
      { id: 'bot-6', type: 'pad_jump', x: 26, y: 0 },
      { id: 'bot-7', type: 'block', x: 28, y: 3 },
      { id: 'bot-8', type: 'block', x: 29, y: 3 },
      { id: 'bot-9', type: 'coin', x: 29, y: 5 },
      { id: 'bot-10', type: 'spike', x: 32, y: 0 },
      { id: 'bot-11', type: 'spike', x: 33, y: 0 },
      { id: 'bot-12', type: 'block', x: 36, y: 1 },
      { id: 'bot-13', type: 'block', x: 37, y: 2 },
      { id: 'bot-14', type: 'block', x: 38, y: 3 },
      { id: 'bot-15', type: 'pad_jump', x: 42, y: 0 },
      { id: 'bot-16', type: 'spike', x: 44, y: 0 },
      { id: 'bot-17', type: 'spike', x: 45, y: 0 },
      { id: 'bot-18', type: 'portal_ship', x: 50, y: 2 },
      { id: 'bot-19', type: 'spike_down', x: 58, y: 9 },
      { id: 'bot-20', type: 'sawblade_medium', x: 64, y: 3 },
      { id: 'bot-21', type: 'coin', x: 64, y: 7 },
      { id: 'bot-22', type: 'sawblade_medium', x: 72, y: 5 },
      { id: 'bot-23', type: 'portal_cube', x: 80, y: 1 },
      { id: 'bot-24', type: 'pad_jump', x: 86, y: 0 },
      { id: 'bot-25', type: 'block', x: 89, y: 3 },
      { id: 'bot-26', type: 'spike', x: 92, y: 0 },
      { id: 'bot-27', type: 'pad_bounce', x: 96, y: 0 },
      { id: 'bot-28', type: 'block', x: 99, y: 2 },
      { id: 'bot-29', type: 'coin', x: 105, y: 2 },
      { id: 'bot-30', type: 'spike', x: 104, y: 0 },
      { id: 'bot-31', type: 'spike', x: 105, y: 0 },
    ],
  },
  {
    id: 'polargeist',
    name: 'Polargeist',
    author: 'Dave',
    difficulty: 'hard',
    stars: 3,
    songId: 'polargeist',
    bpm: 150,
    bgColor: '#062624', // Cyan/Emerald theme
    groundColor: '#0a4744',
    length: 130,
    coins: 3,
    objects: [
      { id: 'pg-1', type: 'spike', x: 10, y: 0 },
      { id: 'pg-2', type: 'ring_jump', x: 15, y: 2 },
      { id: 'pg-3', type: 'spike', x: 15, y: 0 },
      { id: 'pg-4', type: 'spike', x: 16, y: 0 },
      { id: 'pg-5', type: 'block', x: 19, y: 1 },
      { id: 'pg-6', type: 'ring_jump', x: 23, y: 3 },
      { id: 'pg-7', type: 'spike', x: 23, y: 0 },
      { id: 'pg-8', type: 'spike', x: 24, y: 0 },
      { id: 'pg-9', type: 'block', x: 27, y: 2 },
      { id: 'pg-10', type: 'coin', x: 27, y: 4 },
      { id: 'pg-11', type: 'ring_bounce', x: 32, y: 2 },
      { id: 'pg-12', type: 'spike', x: 32, y: 0 },
      { id: 'pg-13', type: 'pad_jump', x: 38, y: 0 },
      { id: 'pg-14', type: 'spike', x: 40, y: 0 },
      { id: 'pg-15', type: 'ring_jump', x: 42, y: 3 },
      { id: 'pg-16', type: 'block', x: 45, y: 2 },
      { id: 'pg-17', type: 'portal_ship', x: 52, y: 2 },
      { id: 'pg-18', type: 'sawblade_small', x: 60, y: 2 },
      { id: 'pg-19', type: 'sawblade_small', x: 64, y: 7 },
      { id: 'pg-20', type: 'coin', x: 67, y: 4 },
      { id: 'pg-21', type: 'sawblade_medium', x: 74, y: 4 },
      { id: 'pg-22', type: 'portal_cube', x: 82, y: 1 },
      { id: 'pg-23', type: 'ring_jump', x: 88, y: 2 },
      { id: 'pg-24', type: 'spike', x: 88, y: 0 },
      { id: 'pg-25', type: 'ring_jump', x: 93, y: 2 },
      { id: 'pg-26', type: 'spike', x: 93, y: 0 },
      { id: 'pg-27', type: 'pad_jump', x: 98, y: 0 },
      { id: 'pg-28', type: 'spike', x: 100, y: 0 },
      { id: 'pg-29', type: 'spike', x: 101, y: 0 },
      { id: 'pg-30', type: 'spike', x: 102, y: 0 },
      { id: 'pg-31', type: 'coin', x: 108, y: 1 },
    ],
  },
  {
    id: 'dry_out',
    name: 'Dry Out',
    author: 'Dave',
    difficulty: 'harder',
    stars: 4,
    songId: 'dry_out',
    bpm: 145,
    bgColor: '#331505', // Deep copper/crimson theme
    groundColor: '#632808',
    length: 135,
    coins: 3,
    objects: [
      { id: 'do-1', type: 'spike', x: 10, y: 0 },
      { id: 'do-2', type: 'block', x: 14, y: 1 },
      { id: 'do-3', type: 'spike', x: 18, y: 0 },
      { id: 'do-4', type: 'ring_jump', x: 22, y: 2 },
      { id: 'do-5', type: 'spike', x: 22, y: 0 },

      // Gravity Flip Portal (Upside down!)
      { id: 'do-6', type: 'portal_gravity_inv', x: 28, y: 2 },
      { id: 'do-7', type: 'spike_down', x: 34, y: 9 },
      { id: 'do-8', type: 'block', x: 38, y: 8 },
      { id: 'do-9', type: 'coin', x: 38, y: 6 },
      { id: 'do-10', type: 'spike_down', x: 42, y: 9 },

      // Gravity Normal Portal
      { id: 'do-11', type: 'portal_gravity_norm', x: 48, y: 5 },
      { id: 'do-12', type: 'spike', x: 54, y: 0 },
      { id: 'do-13', type: 'portal_ship', x: 59, y: 2 },
      { id: 'do-14', type: 'sawblade_medium', x: 67, y: 4 },
      { id: 'do-15', type: 'coin', x: 72, y: 7 },
      { id: 'do-16', type: 'sawblade_small', x: 76, y: 2 },
      { id: 'do-17', type: 'portal_cube', x: 84, y: 1 },
      { id: 'do-18', type: 'pad_gravity', x: 90, y: 0 },
      { id: 'do-19', type: 'spike_down', x: 94, y: 9 },
      { id: 'do-20', type: 'portal_gravity_norm', x: 100, y: 6 },
      { id: 'do-21', type: 'spike', x: 106, y: 0 },
      { id: 'do-22', type: 'spike', x: 107, y: 0 },
      { id: 'do-23', type: 'coin', x: 112, y: 2 },
    ],
  },
  {
    id: 'electroman',
    name: 'Electroman',
    author: 'Dave',
    difficulty: 'insane',
    stars: 5,
    songId: 'electroman',
    bpm: 160,
    bgColor: '#051838', // Electric Blue
    groundColor: '#0a3275',
    length: 140,
    coins: 3,
    objects: [
      { id: 'em-1', type: 'portal_speed_2x', x: 5, y: 1 }, // Fast speed right away!
      { id: 'em-2', type: 'spike', x: 12, y: 0 },
      { id: 'em-3', type: 'spike', x: 13, y: 0 },
      { id: 'em-4', type: 'ring_jump', x: 18, y: 2 },
      { id: 'em-5', type: 'sawblade_small', x: 18, y: 0 },
      { id: 'em-6', type: 'block', x: 22, y: 1 },
      { id: 'em-7', type: 'pad_jump', x: 26, y: 0 },
      { id: 'em-8', type: 'spike', x: 28, y: 0 },
      { id: 'em-9', type: 'spike', x: 29, y: 0 },
      { id: 'em-10', type: 'coin', x: 29, y: 4 },
      { id: 'em-11', type: 'portal_ship', x: 34, y: 2 },
      { id: 'em-12', type: 'sawblade_medium', x: 42, y: 2 },
      { id: 'em-13', type: 'sawblade_medium', x: 48, y: 6 },
      { id: 'em-14', type: 'coin', x: 54, y: 5 },
      { id: 'em-15', type: 'sawblade_small', x: 58, y: 1 },
      { id: 'em-16', type: 'sawblade_small', x: 62, y: 8 },
      { id: 'em-17', type: 'portal_cube', x: 68, y: 1 },
      { id: 'em-18', type: 'ring_jump', x: 74, y: 2 },
      { id: 'em-19', type: 'spike', x: 74, y: 0 },
      { id: 'em-20', type: 'ring_gravity', x: 80, y: 3 },
      { id: 'em-21', type: 'spike_down', x: 85, y: 9 },
      { id: 'em-22', type: 'portal_gravity_norm', x: 92, y: 5 },
      { id: 'em-23', type: 'pad_jump', x: 98, y: 0 },
      { id: 'em-24', type: 'spike', x: 100, y: 0 },
      { id: 'em-25', type: 'spike', x: 101, y: 0 },
      { id: 'em-26', type: 'spike', x: 102, y: 0 },
      { id: 'em-27', type: 'coin', x: 108, y: 3 },
    ],
  },
];

const LOCAL_STORAGE_KEY = 'daves_dash_custom_levels';
const PROGRESS_STORAGE_KEY = 'daves_dash_level_progress';

export function getCustomLevels(): LevelData[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomLevel(level: LevelData): void {
  try {
    const levels = getCustomLevels();
    const existingIndex = levels.findIndex(l => l.id === level.id);
    if (existingIndex >= 0) {
      levels[existingIndex] = level;
    } else {
      levels.push(level);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(levels));
  } catch (e) {
    console.error('Failed to save custom level:', e);
  }
}

export function deleteCustomLevel(levelId: string): void {
  try {
    const levels = getCustomLevels().filter(l => l.id !== levelId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(levels));
  } catch (e) {
    console.error('Failed to delete custom level:', e);
  }
}

export interface LevelProgress {
  bestPercent: number;
  practicePercent: number;
  coinsCollected: number[];
  completed: boolean;
}

export function getLevelProgress(levelId: string): LevelProgress {
  try {
    const raw = localStorage.getItem(`${PROGRESS_STORAGE_KEY}_${levelId}`);
    if (!raw) return { bestPercent: 0, practicePercent: 0, coinsCollected: [], completed: false };
    return JSON.parse(raw);
  } catch {
    return { bestPercent: 0, practicePercent: 0, coinsCollected: [], completed: false };
  }
}

export function updateLevelProgress(levelId: string, progress: Partial<LevelProgress>): void {
  try {
    const current = getLevelProgress(levelId);
    const updated: LevelProgress = {
      bestPercent: Math.max(current.bestPercent, progress.bestPercent ?? 0),
      practicePercent: Math.max(current.practicePercent, progress.practicePercent ?? 0),
      coinsCollected: Array.from(new Set([...current.coinsCollected, ...(progress.coinsCollected || [])])),
      completed: current.completed || (progress.completed ?? false),
    };
    localStorage.setItem(`${PROGRESS_STORAGE_KEY}_${levelId}`, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update level progress:', e);
  }
}

export function createEmptyCustomLevel(name: string = 'My New Level'): LevelData {
  return {
    id: `custom_${Date.now()}`,
    name,
    author: 'Player',
    difficulty: 'normal',
    stars: 2,
    songId: 'stereo_rush',
    bpm: 130,
    bgColor: '#130c24',
    groundColor: '#251547',
    length: 100,
    coins: 3,
    objects: [
      { id: 'start-spike', type: 'spike', x: 12, y: 0 },
      { id: 'start-pad', type: 'pad_jump', x: 20, y: 0 },
      { id: 'start-block', type: 'block', x: 23, y: 3 },
      { id: 'start-coin', type: 'coin', x: 23, y: 5 },
    ],
  };
}
