/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAABB,
  checkCircleCollision,
  snapTo90Degrees,
  getSpeedPixelsPerSecond,
  updatePhysics,
  createInitialPlayer,
  GRID_SIZE,
} from './physics.ts';
import { LevelObject } from './types.ts';

test('snapTo90Degrees snaps correctly to cardinal angles', () => {
  assert.equal(snapTo90Degrees(0), 0);
  assert.equal(snapTo90Degrees(44), 0);
  assert.equal(snapTo90Degrees(46), 90);
  assert.equal(snapTo90Degrees(134), 90);
  assert.equal(snapTo90Degrees(136), 180);
  assert.equal(snapTo90Degrees(269), 270);
  assert.equal(snapTo90Degrees(355), 0);
  assert.equal(snapTo90Degrees(-10), 0);
  assert.equal(snapTo90Degrees(-85), 270);
});

test('checkAABB correctly identifies bounding box overlaps', () => {
  // Overlapping
  assert.equal(checkAABB(0, 0, 40, 40, 20, 20, 40, 40), true);
  // Separate
  assert.equal(checkAABB(0, 0, 40, 40, 100, 100, 40, 40), false);
  // Touching edge only (non-overlapping)
  assert.equal(checkAABB(0, 0, 40, 40, 40, 0, 40, 40), false);
});

test('checkCircleCollision detects distance between circles', () => {
  // Overlapping circles
  assert.equal(checkCircleCollision(10, 10, 15, 20, 10, 15), true);
  // Far apart
  assert.equal(checkCircleCollision(0, 0, 5, 50, 50, 5), false);
});

test('getSpeedPixelsPerSecond scales with speed multipliers', () => {
  const s1 = getSpeedPixelsPerSecond(1);
  const s2 = getSpeedPixelsPerSecond(2);
  const s3 = getSpeedPixelsPerSecond(3);

  assert.ok(s1 > 0);
  assert.ok(s2 > s1);
  assert.ok(s3 > s2);
  assert.equal(s2, s1 * 1.25);
});

test('cube jump fires when grounded and jump is held', () => {
  const player = createInitialPlayer();
  assert.equal(player.isGrounded, true);
  assert.equal(player.vy, 0);

  const { player: updatedPlayer, events } = updatePhysics(player, 0.016, true, true, []);
  assert.equal(events.jumped, true);
  assert.ok(updatedPlayer.vy > 0);
  assert.equal(updatedPlayer.isGrounded, false);
});

test('player dies upon collision with spike hazard', () => {
  const player = createInitialPlayer();
  player.x = 100;
  player.y = 0;

  const spike: LevelObject = {
    id: 'spike-1',
    type: 'spike',
    x: 100 / GRID_SIZE,
    y: 0,
  };

  const { player: updatedPlayer, events } = updatePhysics(player, 0.016, false, false, [spike]);
  assert.equal(updatedPlayer.isDead, true);
  assert.equal(events.died, true);
});

test('jump pad launches player with high vertical impulse', () => {
  const player = createInitialPlayer();
  player.x = 200;
  player.y = 0;

  const pad: LevelObject = {
    id: 'pad-1',
    type: 'pad_jump',
    x: 200 / GRID_SIZE,
    y: 0,
  };

  const { player: updatedPlayer, events } = updatePhysics(player, 0.016, false, false, [pad]);
  assert.equal(events.padHit, true);
  assert.ok(updatedPlayer.vy > 700);
});

test('portal_ship transitions mode from cube to ship', () => {
  const player = createInitialPlayer();
  player.x = 300;
  player.y = 20;
  assert.equal(player.mode, 'cube');

  const portal: LevelObject = {
    id: 'portal-1',
    type: 'portal_ship',
    x: 300 / GRID_SIZE,
    y: 0,
  };

  const { player: updatedPlayer, events } = updatePhysics(player, 0.016, false, false, [portal]);
  assert.equal(events.portalHit, true);
  assert.equal(updatedPlayer.mode, 'ship');
});
