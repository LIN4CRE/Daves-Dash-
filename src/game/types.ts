/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameMode = 'cube' | 'ship';
export type GravityDirection = 1 | -1; // 1 = Normal (down), -1 = Inverted (up)
export type SpeedMultiplier = 1 | 2 | 3; // 1x, 2x, 3x speed

export type ObjectCategory = 'blocks' | 'hazards' | 'jump' | 'portals' | 'special';

export type ObjectType =
  // Blocks
  | 'block'
  | 'block_metal'
  | 'block_outline'
  | 'slab'
  | 'pillar'
  // Hazards
  | 'spike'
  | 'spike_down'
  | 'spike_left'
  | 'spike_right'
  | 'half_spike'
  | 'sawblade_small'
  | 'sawblade_medium'
  // Jump elements
  | 'pad_jump'       // Yellow jump pad
  | 'pad_gravity'    // Blue gravity flip pad
  | 'pad_bounce'     // Pink light bounce pad
  | 'ring_jump'      // Yellow jump orb
  | 'ring_gravity'   // Blue gravity flip orb
  | 'ring_bounce'    // Pink light jump orb
  | 'ring_green'     // Green gravity toggle orb
  // Portals
  | 'portal_ship'
  | 'portal_cube'
  | 'portal_gravity_inv'
  | 'portal_gravity_norm'
  | 'portal_speed_1x'
  | 'portal_speed_2x'
  | 'portal_speed_3x'
  // Special & Collectibles
  | 'coin'
  | 'trigger_color';

export interface LevelObject {
  id: string;
  type: ObjectType;
  x: number; // in grid units or pixels
  y: number; // in grid units (0 = ground level)
  rotation?: number; // degrees (0, 90, 180, 270)
  targetColor?: string; // for trigger_color
  targetElement?: 'bg' | 'ground';
}

export type LevelDifficulty = 'easy' | 'normal' | 'hard' | 'harder' | 'insane' | 'demon';

export interface LevelData {
  id: string;
  name: string;
  author: string;
  difficulty: LevelDifficulty;
  stars: number;
  songId: string;
  bpm: number;
  bgColor: string;
  groundColor: string;
  length: number; // total width in grid units
  objects: LevelObject[];
  coins: number;
}

export interface PlayerCustomization {
  cubeIcon: number;
  shipIcon: number;
  primaryColor: string;
  secondaryColor: string;
  trail: string;
  deathEffect: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
  shape?: 'square' | 'circle' | 'shard';
}

export interface Checkpoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  mode: GameMode;
  gravity: GravityDirection;
  speed: SpeedMultiplier;
  cameraX: number;
  bgColor: string;
  groundColor: string;
}

export interface GameState {
  playerX: number;
  playerY: number;
  playerVx: number;
  playerVy: number;
  playerRotation: number;
  isGrounded: boolean;
  mode: GameMode;
  gravity: GravityDirection;
  speed: SpeedMultiplier;
  isDead: boolean;
  deathTimer: number;
  progressPercent: number;
  attempts: number;
  jumps: number;
  collectedCoins: Set<string>;
  isPractice: boolean;
  checkpoints: Checkpoint[];
  hitstop: number;
}
