/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Checkpoint, GameMode, GravityDirection, LevelObject, SpeedMultiplier } from './types.ts';

export const GRID_SIZE = 40; // 1 block = 40x40 pixels
export const PLAYER_SIZE = 36; // Player is slightly smaller than 1 block for fair clearance
export const BASE_SPEED = 420; // 1x speed in pixels per second (~10.5 blocks/sec)

export interface PhysicsPlayer {
  x: number;
  y: number; // In pixels from ground up (ground = 0)
  vx: number;
  vy: number;
  rotation: number; // In degrees
  isGrounded: boolean;
  mode: GameMode;
  gravity: GravityDirection;
  speed: SpeedMultiplier;
  isDead: boolean;
  activeOrbId?: string;
}

export function getSpeedPixelsPerSecond(speed: SpeedMultiplier): number {
  switch (speed) {
    case 1: return BASE_SPEED;
    case 2: return BASE_SPEED * 1.25;
    case 3: return BASE_SPEED * 1.5;
    default: return BASE_SPEED;
  }
}

/**
 * Checks AABB intersection between two rectangles
 */
export function checkAABB(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  );
}

/**
 * Checks if a point is inside a triangle
 */
export function isPointInTriangle(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number
): boolean {
  const areaOrig = Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1));
  const area1 = Math.abs((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py));
  const area2 = Math.abs((x2 - px) * (y3 - py) - (x3 - px) * (y2 - py));
  const area3 = Math.abs((x3 - px) * (y1 - py) - (x1 - px) * (y3 - py));
  return Math.abs(area1 + area2 + area3 - areaOrig) < 1.0;
}

/**
 * Checks circle collision
 */
export function checkCircleCollision(
  px: number, py: number, pr: number,
  cx: number, cy: number, cr: number
): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return (dx * dx + dy * dy) < (pr + cr) * (pr + cr);
}

/**
 * Snaps an angle in degrees to the nearest multiple of 90 degrees
 */
export function snapTo90Degrees(angle: number): number {
  const normalized = ((angle % 360) + 360) % 360;
  const nearest = Math.round(normalized / 90) * 90;
  return nearest % 360;
}

/**
 * Performs a single physics tick
 */
export function updatePhysics(
  player: PhysicsPlayer,
  dt: number,
  jumpHeld: boolean,
  jumpPressed: boolean,
  objects: LevelObject[],
  ceilingY: number = 600
): {
  player: PhysicsPlayer;
  events: {
    jumped?: boolean;
    padHit?: boolean;
    ringHit?: boolean;
    portalHit?: boolean;
    coinCollected?: string;
    died?: boolean;
    colorTrigger?: { element: 'bg' | 'ground'; color: string };
  };
} {
  const events: {
    jumped?: boolean;
    padHit?: boolean;
    ringHit?: boolean;
    portalHit?: boolean;
    coinCollected?: string;
    died?: boolean;
    colorTrigger?: { element: 'bg' | 'ground'; color: string };
  } = {};

  if (player.isDead) {
    return { player, events };
  }

  // Horizontal motion
  player.vx = getSpeedPixelsPerSecond(player.speed);
  player.x += player.vx * dt;

  const grav = player.gravity; // 1 (down) or -1 (up)

  if (player.mode === 'cube') {
    // Cube Gravity and vertical speed
    const gravityAccel = 1600 * grav;
    player.vy -= gravityAccel * dt;

    // Terminal velocity
    const maxVy = 900;
    if (grav === 1) {
      if (player.vy < -maxVy) player.vy = -maxVy;
    } else {
      if (player.vy > maxVy) player.vy = maxVy;
    }

    // Cube Jump (if grounded and jump is held or pressed)
    if (player.isGrounded && jumpHeld) {
      player.vy = 640 * grav;
      player.isGrounded = false;
      events.jumped = true;
    }

    // Apply vertical displacement
    player.y += player.vy * dt;

    // Cube Rotation in air
    if (!player.isGrounded) {
      const rotSpeed = 480 * grav; // degrees per second
      player.rotation += rotSpeed * dt;
    } else {
      player.rotation = snapTo90Degrees(player.rotation);
    }
  } else if (player.mode === 'ship') {
    // Ship mode flight physics
    const shipLift = 900 * grav;
    const shipFall = 800 * grav;

    if (jumpHeld) {
      player.vy += shipLift * dt;
    } else {
      player.vy -= shipFall * dt;
    }

    // Clamp vertical velocity for ship
    const maxShipVy = 460;
    player.vy = Math.max(-maxShipVy, Math.min(maxShipVy, player.vy));
    player.y += player.vy * dt;

    // Ship pitch follows vertical velocity
    const targetAngle = Math.max(-45, Math.min(45, (player.vy / maxShipVy) * 40 * grav));
    player.rotation += (targetAngle - player.rotation) * Math.min(1, 14 * dt);
    player.isGrounded = false;
  }

  // Ground collision check (y = 0 is ground)
  const groundY = 0;
  if (grav === 1) {
    if (player.y <= groundY) {
      player.y = groundY;
      player.vy = 0;
      player.isGrounded = true;
      if (player.mode === 'cube') {
        player.rotation = snapTo90Degrees(player.rotation);
      }
    } else {
      player.isGrounded = false;
    }
  } else {
    // Inverted gravity ground is at the ceiling
    if (player.y >= ceilingY - PLAYER_SIZE) {
      player.y = ceilingY - PLAYER_SIZE;
      player.vy = 0;
      player.isGrounded = true;
      if (player.mode === 'cube') {
        player.rotation = snapTo90Degrees(player.rotation);
      }
    } else {
      player.isGrounded = false;
    }
  }

  // Ceiling clamp for ship / normal cube
  if (grav === 1 && player.y > ceilingY - PLAYER_SIZE) {
    player.y = ceilingY - PLAYER_SIZE;
    if (player.vy > 0) player.vy = 0;
  } else if (grav === -1 && player.y < groundY) {
    player.y = groundY;
    if (player.vy < 0) player.vy = 0;
  }

  // Check objects nearby (within active window)
  const playerBox = {
    x: player.x,
    y: player.y,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
  };

  for (let i = 0; i < objects.length; i++) {
    const obj = objects[i];
    const ox = obj.x * GRID_SIZE;
    const oy = obj.y * GRID_SIZE;

    // Filter objects far away
    if (ox < player.x - 200 || ox > player.x + 300) continue;

    // 1. Solid Blocks
    if (obj.type === 'block' || obj.type === 'block_metal' || obj.type === 'block_outline' || obj.type === 'slab' || obj.type === 'pillar') {
      const bh = obj.type === 'slab' ? GRID_SIZE / 2 : GRID_SIZE;
      const bw = GRID_SIZE;

      if (checkAABB(playerBox.x, playerBox.y, playerBox.w, playerBox.h, ox, oy, bw, bh)) {
        // Determine collision side
        const prevY = player.y - player.vy * dt;
        const prevX = player.x - player.vx * dt;

        if (grav === 1) {
          // Normal gravity: check landing on top
          const isLanding = prevY >= oy + bh - 10 && player.vy <= 0;
          if (isLanding) {
            player.y = oy + bh;
            player.vy = 0;
            player.isGrounded = true;
            if (player.mode === 'cube') player.rotation = snapTo90Degrees(player.rotation);
            continue;
          }

          // Bonk ceiling from below
          const isHittingCeiling = prevY + PLAYER_SIZE <= oy + 10 && player.vy > 0;
          if (isHittingCeiling) {
            player.y = oy - PLAYER_SIZE;
            player.vy = 0;
            continue;
          }
        } else {
          // Inverted gravity: landing is at the bottom of the block
          const isLandingInv = prevY + PLAYER_SIZE <= oy + 10 && player.vy >= 0;
          if (isLandingInv) {
            player.y = oy - PLAYER_SIZE;
            player.vy = 0;
            player.isGrounded = true;
            if (player.mode === 'cube') player.rotation = snapTo90Degrees(player.rotation);
            continue;
          }

          const isHittingFloor = prevY >= oy + bh - 10 && player.vy < 0;
          if (isHittingFloor) {
            player.y = oy + bh;
            player.vy = 0;
            continue;
          }
        }

        // Side crash -> Player dies!
        if (player.x + playerBox.w > ox + 6 && prevX + playerBox.w <= ox + 14) {
          player.isDead = true;
          events.died = true;
          return { player, events };
        }
      }
    }

    // 2. Hazards (Spikes & Sawblades)
    if (obj.type === 'spike' || obj.type === 'spike_down' || obj.type === 'spike_left' || obj.type === 'spike_right' || obj.type === 'half_spike') {
      // Inset spike bounding box for fairness
      const inset = obj.type === 'half_spike' ? 8 : 6;
      const spikeH = obj.type === 'half_spike' ? GRID_SIZE / 2 : GRID_SIZE;
      
      if (checkAABB(
        playerBox.x + 4, playerBox.y + 4, playerBox.w - 8, playerBox.h - 8,
        ox + inset, oy + (obj.type === 'spike_down' ? 0 : 4), GRID_SIZE - inset * 2, spikeH - 6
      )) {
        player.isDead = true;
        events.died = true;
        return { player, events };
      }
    }

    if (obj.type === 'sawblade_small' || obj.type === 'sawblade_medium') {
      const radius = obj.type === 'sawblade_small' ? 18 : 32;
      const cx = ox + GRID_SIZE / 2;
      const cy = oy + GRID_SIZE / 2;
      const px = player.x + PLAYER_SIZE / 2;
      const py = player.y + PLAYER_SIZE / 2;

      if (checkCircleCollision(px, py, PLAYER_SIZE * 0.4, cx, cy, radius * 0.75)) {
        player.isDead = true;
        events.died = true;
        return { player, events };
      }
    }

    // 3. Jump Pads (touch trigger)
    if (obj.type === 'pad_jump' || obj.type === 'pad_gravity' || obj.type === 'pad_bounce') {
      const padH = 14;
      const padY = grav === 1 ? oy : oy + GRID_SIZE - padH;
      if (checkAABB(playerBox.x, playerBox.y, playerBox.w, playerBox.h, ox + 4, padY, GRID_SIZE - 8, padH)) {
        if (obj.type === 'pad_jump') {
          player.vy = 840 * grav;
          player.isGrounded = false;
          events.padHit = true;
        } else if (obj.type === 'pad_bounce') {
          player.vy = 520 * grav;
          player.isGrounded = false;
          events.padHit = true;
        } else if (obj.type === 'pad_gravity') {
          player.gravity = (grav === 1 ? -1 : 1) as GravityDirection;
          player.vy = 680 * player.gravity;
          player.isGrounded = false;
          events.padHit = true;
        }
      }
    }

    // 4. Jump Rings / Orbs (active when jump is pressed inside radius)
    if (obj.type === 'ring_jump' || obj.type === 'ring_gravity' || obj.type === 'ring_bounce' || obj.type === 'ring_green') {
      const orbRadius = 38;
      const ocx = ox + GRID_SIZE / 2;
      const ocy = oy + GRID_SIZE / 2;
      const pcx = player.x + PLAYER_SIZE / 2;
      const pcy = player.y + PLAYER_SIZE / 2;

      const inRadius = checkCircleCollision(pcx, pcy, PLAYER_SIZE * 0.4, ocx, ocy, orbRadius);
      if (inRadius && (jumpPressed || (jumpHeld && player.activeOrbId !== obj.id))) {
        player.activeOrbId = obj.id;
        if (obj.type === 'ring_jump') {
          player.vy = 680 * grav;
          player.isGrounded = false;
          events.ringHit = true;
        } else if (obj.type === 'ring_bounce') {
          player.vy = 480 * grav;
          player.isGrounded = false;
          events.ringHit = true;
        } else if (obj.type === 'ring_gravity') {
          player.gravity = (grav === 1 ? -1 : 1) as GravityDirection;
          player.vy = 600 * player.gravity;
          player.isGrounded = false;
          events.ringHit = true;
        } else if (obj.type === 'ring_green') {
          player.gravity = (grav === 1 ? -1 : 1) as GravityDirection;
          player.vy = 640 * player.gravity;
          player.isGrounded = false;
          events.ringHit = true;
        }
      }
    }

    // 5. Portals
    if (obj.type.startsWith('portal_')) {
      const portalW = 30;
      const portalH = 90;
      if (checkAABB(playerBox.x, playerBox.y, playerBox.w, playerBox.h, ox + 5, oy - 20, portalW, portalH)) {
        if (obj.type === 'portal_ship' && player.mode !== 'ship') {
          player.mode = 'ship';
          events.portalHit = true;
        } else if (obj.type === 'portal_cube' && player.mode !== 'cube') {
          player.mode = 'cube';
          events.portalHit = true;
        } else if (obj.type === 'portal_gravity_inv' && player.gravity !== -1) {
          player.gravity = -1;
          events.portalHit = true;
        } else if (obj.type === 'portal_gravity_norm' && player.gravity !== 1) {
          player.gravity = 1;
          events.portalHit = true;
        } else if (obj.type === 'portal_speed_1x' && player.speed !== 1) {
          player.speed = 1;
          events.portalHit = true;
        } else if (obj.type === 'portal_speed_2x' && player.speed !== 2) {
          player.speed = 2;
          events.portalHit = true;
        } else if (obj.type === 'portal_speed_3x' && player.speed !== 3) {
          player.speed = 3;
          events.portalHit = true;
        }
      }
    }

    // 6. Collectible Secret Coins
    if (obj.type === 'coin') {
      const coinRadius = 18;
      const ccx = ox + GRID_SIZE / 2;
      const ccy = oy + GRID_SIZE / 2;
      const pcx = player.x + PLAYER_SIZE / 2;
      const pcy = player.y + PLAYER_SIZE / 2;

      if (checkCircleCollision(pcx, pcy, PLAYER_SIZE * 0.4, ccx, ccy, coinRadius)) {
        events.coinCollected = obj.id;
      }
    }

    // 7. Color Triggers
    if (obj.type === 'trigger_color' && obj.targetColor) {
      if (player.x >= ox && player.x - player.vx * dt < ox) {
        events.colorTrigger = {
          element: obj.targetElement || 'bg',
          color: obj.targetColor,
        };
      }
    }
  }

  return { player, events };
}

/**
 * Creates an initial fresh player state
 */
export function createInitialPlayer(checkpoint?: Checkpoint): PhysicsPlayer {
  if (checkpoint) {
    return {
      x: checkpoint.x,
      y: checkpoint.y,
      vx: checkpoint.vx,
      vy: checkpoint.vy,
      rotation: checkpoint.rotation,
      isGrounded: false,
      mode: checkpoint.mode,
      gravity: checkpoint.gravity,
      speed: checkpoint.speed,
      isDead: false,
    };
  }

  return {
    x: 0,
    y: 0,
    vx: BASE_SPEED,
    vy: 0,
    rotation: 0,
    isGrounded: true,
    mode: 'cube',
    gravity: 1,
    speed: 1,
    isDead: false,
  };
}
