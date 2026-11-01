/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GRID_SIZE, PhysicsPlayer, PLAYER_SIZE } from './physics.ts';
import { LevelObject, Particle, PlayerCustomization } from './types.ts';

// WebGL Vertex Shader for 2D batched geometry
const VS_SOURCE = `
  attribute vec2 a_position;
  attribute vec4 a_color;
  uniform vec2 u_resolution;
  varying vec4 v_color;

  void main() {
    // Convert from pixel space to clip space (-1 to +1)
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;

    // Flip Y so 0,0 is top-left
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
    v_color = a_color;
  }
`;

// WebGL Fragment Shader
const FS_SOURCE = `
  precision mediump float;
  varying vec4 v_color;

  void main() {
    gl_FragColor = v_color;
  }
`;

function hexToRgba(hex: string, alpha: number = 1.0): [number, number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return [r, g, b, alpha];
}

export class WebGLGameRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;
  private posAttrib: number = -1;
  private colAttrib: number = -1;
  private resUniform: WebGLUniformLocation | null = null;

  // Vertex Arrays for current frame
  private positions: number[] = [];
  private colors: number[] = [];

  private beatPulse: number = 0;
  private animTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.initWebGL();
  }

  private initWebGL() {
    try {
      this.gl = this.canvas.getContext('webgl', {
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: false,
      }) || (this.canvas.getContext('experimental-webgl') as WebGLRenderingContext);
    } catch {
      this.gl = null;
    }

    if (!this.gl) {
      console.warn('WebGL not supported, rendering disabled');
      return;
    }

    const gl = this.gl;

    // Compile Shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VS_SOURCE);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FS_SOURCE);
    gl.compileShader(fs);

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    this.posAttrib = gl.getAttribLocation(this.program, 'a_position');
    this.colAttrib = gl.getAttribLocation(this.program, 'a_color');
    this.resUniform = gl.getUniformLocation(this.program, 'u_resolution');

    this.positionBuffer = gl.createBuffer();
    this.colorBuffer = gl.createBuffer();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  public setBeatPulse(amount: number = 1.0) {
    this.beatPulse = Math.max(this.beatPulse, amount);
  }

  public resize(width: number, height: number) {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      if (this.gl) {
        this.gl.viewport(0, 0, width, height);
      }
    }
  }

  // --- Geometry Batching Helpers ---

  private addTriangle(
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number,
    color: [number, number, number, number]
  ) {
    this.positions.push(x1, y1, x2, y2, x3, y3);
    for (let i = 0; i < 3; i++) {
      this.colors.push(color[0], color[1], color[2], color[3]);
    }
  }

  private addQuad(
    x: number, y: number, w: number, h: number,
    color: [number, number, number, number]
  ) {
    const x1 = x;
    const y1 = y;
    const x2 = x + w;
    const y2 = y + h;

    this.addTriangle(x1, y1, x2, y1, x1, y2, color);
    this.addTriangle(x2, y1, x2, y2, x1, y2, color);
  }

  private addRotatedQuad(
    cx: number, cy: number, w: number, h: number, angleRad: number,
    color: [number, number, number, number]
  ) {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const hw = w / 2;
    const hh = h / 2;

    const p1x = cx + (-hw * cos - -hh * sin);
    const p1y = cy + (-hw * sin + -hh * cos);

    const p2x = cx + (hw * cos - -hh * sin);
    const p2y = cy + (hw * sin + -hh * cos);

    const p3x = cx + (hw * cos - hh * sin);
    const p3y = cy + (hw * sin + hh * cos);

    const p4x = cx + (-hw * cos - hh * sin);
    const p4y = cy + (-hw * sin + hh * cos);

    this.addTriangle(p1x, p1y, p2x, p2y, p4x, p4y, color);
    this.addTriangle(p2x, p2y, p3x, p3y, p4x, p4y, color);
  }

  private addCircle(
    cx: number, cy: number, radius: number, segments: number,
    color: [number, number, number, number]
  ) {
    const step = (Math.PI * 2) / segments;
    for (let i = 0; i < segments; i++) {
      const a1 = i * step;
      const a2 = (i + 1) * step;
      this.addTriangle(
        cx, cy,
        cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius,
        cx + Math.cos(a2) * radius, cy + Math.sin(a2) * radius,
        color
      );
    }
  }

  public render(
    dt: number,
    player: PhysicsPlayer,
    cameraX: number,
    objects: LevelObject[],
    particles: Particle[],
    bgColorHex: string,
    groundColorHex: string,
    customization: PlayerCustomization,
    trailHistory: { x: number; y: number; alpha: number }[],
    levelLength: number,
    isPractice: boolean,
    checkpointPositions: { x: number; y: number }[]
  ) {
    this.animTime += dt;
    this.beatPulse = Math.max(0, this.beatPulse - dt * 2.5);

    const gl = this.gl;
    if (!gl || !this.program) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    if (width === 0 || height === 0) return;

    this.positions = [];
    this.colors = [];

    const groundScreenY = height - 120;
    const ceilingScreenY = 60;
    const playAreaHeight = groundScreenY - ceilingScreenY;

    // Helper: World to Screen Coordinate
    const worldToScreen = (wx: number, wy: number) => {
      const sx = wx - cameraX + 160; // Player kept at 160px from left
      const sy = groundScreenY - wy; // y = 0 is ground
      return { sx, sy };
    };

    // 1. Background Gradient & Parallax Grid
    const bgCol = hexToRgba(bgColorHex, 1.0);
    const bgBottomCol = hexToRgba('#05020a', 1.0);

    // Render multi-strip background gradient
    const bgStrips = 8;
    const stripH = groundScreenY / bgStrips;
    for (let s = 0; s < bgStrips; s++) {
      const t = s / bgStrips;
      const col: [number, number, number, number] = [
        bgCol[0] * (1 - t) + bgBottomCol[0] * t,
        bgCol[1] * (1 - t) + bgBottomCol[1] * t,
        bgCol[2] * (1 - t) + bgBottomCol[2] * t,
        1.0,
      ];
      this.addQuad(0, s * stripH, width, stripH + 1, col);
    }

    // Parallax Grid lines
    const gridColor: [number, number, number, number] = [
      1.0, 1.0, 1.0, 0.05 + this.beatPulse * 0.06,
    ];
    const bgTileSize = 80;
    const bgOffsetX = -(cameraX * 0.2) % bgTileSize;

    for (let x = bgOffsetX; x < width + bgTileSize; x += bgTileSize) {
      this.addQuad(x, 0, 1.5, groundScreenY, gridColor);
    }
    for (let y = 0; y < groundScreenY; y += bgTileSize) {
      this.addQuad(0, y, width, 1.5, gridColor);
    }

    // Parallax floating diamonds
    const diamondCol: [number, number, number, number] = [1.0, 1.0, 1.0, 0.04 + this.beatPulse * 0.04];
    for (let i = 0; i < 6; i++) {
      const dx = ((i * 240 - cameraX * 0.15) % (width + 200)) - 50;
      const dy = 80 + (i * 70) % (groundScreenY - 140);
      const dSize = 24 + (i % 3) * 16;
      this.addRotatedQuad(dx, dy, dSize, dSize, this.animTime * 0.3 + i, diamondCol);
    }

    // 2. Ground & Ceiling
    const groundCol = hexToRgba(groundColorHex, 1.0);
    this.addQuad(0, groundScreenY, width, height - groundScreenY, groundCol);
    this.addQuad(0, 0, width, ceilingScreenY, groundCol);

    // Glowing Cyan Baseline on Ground
    const baselineCol: [number, number, number, number] = [0.0, 1.0, 1.0, 1.0];
    this.addQuad(0, groundScreenY - 2, width, 4, baselineCol);

    // Glowing Magenta Baseline on Ceiling
    const ceilingLineCol: [number, number, number, number] = [1.0, 0.0, 0.65, 1.0];
    this.addQuad(0, ceilingScreenY - 2, width, 4, ceilingLineCol);

    // Ground diagonal grid pattern
    const groundDecoCol: [number, number, number, number] = [0.0, 0.0, 0.0, 0.3];
    const floorTileSize = 40;
    const floorOffsetX = -(cameraX) % floorTileSize;
    for (let fx = floorOffsetX; fx < width + floorTileSize; fx += floorTileSize) {
      this.addQuad(fx, groundScreenY, 3, height - groundScreenY, groundDecoCol);
    }

    // 3. Level Finish Line
    const endWorldX = levelLength * GRID_SIZE;
    const { sx: endScreenX } = worldToScreen(endWorldX, 0);
    if (endScreenX > -50 && endScreenX < width + 100) {
      const goalCol: [number, number, number, number] = [1.0, 0.84, 0.0, 0.8];
      this.addQuad(endScreenX, ceilingScreenY, 20, playAreaHeight, goalCol);
    }

    // 4. Practice Checkpoint Flags
    if (isPractice && checkpointPositions.length > 0) {
      const flagCol: [number, number, number, number] = [0.1, 0.8, 0.4, 1.0];
      const poleCol: [number, number, number, number] = [1.0, 1.0, 1.0, 1.0];
      checkpointPositions.forEach(cp => {
        const { sx, sy } = worldToScreen(cp.x, cp.y);
        if (sx > -60 && sx < width + 60) {
          this.addQuad(sx + 15, sy - 35, 3, 35, poleCol);
          this.addTriangle(sx + 18, sy - 35, sx + 36, sy - 25, sx + 18, sy - 15, flagCol);
        }
      });
    }

    // 5. Level Objects
    const blockBodyCol: [number, number, number, number] = [0.06, 0.09, 0.16, 1.0];
    const blockBorderCol: [number, number, number, number] = [0.02, 0.71, 0.83, 1.0];
    const blockInnerCol: [number, number, number, number] = [0.03, 0.57, 0.7, 1.0];
    const spikeCol: [number, number, number, number] = [0.94, 0.27, 0.27, 1.0];
    const sawCol: [number, number, number, number] = [0.96, 0.25, 0.37, 1.0];
    const coinCol: [number, number, number, number] = [0.98, 0.75, 0.14, 1.0];

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const ox = obj.x * GRID_SIZE;
      const oy = obj.y * GRID_SIZE;
      const { sx, sy } = worldToScreen(ox, oy);

      // Cull offscreen
      if (sx < -80 || sx > width + 80) continue;

      if (obj.type.startsWith('block') || obj.type === 'pillar') {
        // Outer Block border
        this.addQuad(sx, sy - GRID_SIZE, GRID_SIZE, GRID_SIZE, blockBorderCol);
        // Inner body
        this.addQuad(sx + 3, sy - GRID_SIZE + 3, GRID_SIZE - 6, GRID_SIZE - 6, blockBodyCol);
        // Center neon metallic inset
        this.addQuad(sx + 8, sy - GRID_SIZE + 8, GRID_SIZE - 16, GRID_SIZE - 16, blockInnerCol);
      } else if (obj.type === 'slab') {
        const h = GRID_SIZE / 2;
        this.addQuad(sx, sy - h, GRID_SIZE, h, blockBorderCol);
        this.addQuad(sx + 2, sy - h + 2, GRID_SIZE - 4, h - 4, blockInnerCol);
      } else if (obj.type === 'spike') {
        // Sharp Spike pointing UP
        this.addTriangle(
          sx + 2, sy,
          sx + GRID_SIZE / 2, sy - GRID_SIZE + 2,
          sx + GRID_SIZE - 2, sy,
          spikeCol
        );
      } else if (obj.type === 'spike_down') {
        // Spike pointing DOWN
        this.addTriangle(
          sx + 2, sy - GRID_SIZE,
          sx + GRID_SIZE / 2, sy - 2,
          sx + GRID_SIZE - 2, sy - GRID_SIZE,
          spikeCol
        );
      } else if (obj.type.startsWith('sawblade')) {
        const radius = obj.type === 'sawblade_small' ? 18 : 32;
        const cx = sx + GRID_SIZE / 2;
        const cy = sy - GRID_SIZE / 2;
        this.addCircle(cx, cy, radius, 12, sawCol);
        this.addCircle(cx, cy, radius * 0.35, 8, [1.0, 1.0, 1.0, 1.0]);
      } else if (obj.type.startsWith('pad_')) {
        const padColor: [number, number, number, number] =
          obj.type === 'pad_jump' ? [0.98, 0.8, 0.08, 1.0] :
          obj.type === 'pad_bounce' ? [0.96, 0.45, 0.71, 1.0] :
          [0.22, 0.74, 0.97, 1.0];
        this.addQuad(sx + 4, sy - 12, GRID_SIZE - 8, 12, padColor);
      } else if (obj.type.startsWith('ring_')) {
        const ringColor: [number, number, number, number] =
          obj.type === 'ring_jump' ? [0.92, 0.7, 0.03, 1.0] :
          obj.type === 'ring_bounce' ? [0.93, 0.28, 0.6, 1.0] :
          obj.type === 'ring_gravity' ? [0.05, 0.65, 0.91, 1.0] :
          [0.13, 0.77, 0.37, 1.0];
        const cx = sx + GRID_SIZE / 2;
        const cy = sy - GRID_SIZE / 2;
        this.addCircle(cx, cy, 15, 12, ringColor);
        this.addCircle(cx, cy, 7, 8, [1.0, 1.0, 1.0, 1.0]);
      } else if (obj.type.startsWith('portal_')) {
        const pColor: [number, number, number, number] =
          obj.type === 'portal_ship' ? [0.93, 0.28, 0.6, 1.0] :
          obj.type === 'portal_cube' ? [0.13, 0.77, 0.37, 1.0] :
          [0.22, 0.74, 0.97, 1.0];
        this.addQuad(sx + 8, sy - GRID_SIZE * 2, 24, GRID_SIZE * 2, pColor);
      } else if (obj.type === 'coin') {
        const cx = sx + GRID_SIZE / 2;
        const cy = sy - GRID_SIZE / 2;
        const coinW = Math.abs(16 * Math.cos(this.animTime * 3));
        this.addQuad(cx - coinW / 2, cy - 16, Math.max(3, coinW), 32, coinCol);
      }
    }

    // 6. Player Trail
    if (!player.isDead && trailHistory.length > 1) {
      const trailCol = hexToRgba(customization.primaryColor, 0.5);
      for (let t = 0; t < trailHistory.length; t++) {
        const pt = worldToScreen(trailHistory[t].x, trailHistory[t].y);
        const alpha = Math.max(0, trailHistory[t].alpha * 0.6);
        const col: [number, number, number, number] = [trailCol[0], trailCol[1], trailCol[2], alpha];
        this.addQuad(pt.sx + 4, pt.sy - PLAYER_SIZE + 4, PLAYER_SIZE - 8, PLAYER_SIZE - 8, col);
      }
    }

    // 7. Player Character
    if (!player.isDead) {
      const { sx: psx, sy: psy } = worldToScreen(player.x, player.y);
      const pc = hexToRgba(customization.primaryColor, 1.0);
      const sc = hexToRgba(customization.secondaryColor, 1.0);
      const half = PLAYER_SIZE / 2;
      const cx = psx + half;
      const cy = psy - half;
      const rotRad = (player.rotation * Math.PI) / 180;

      if (player.mode === 'cube') {
        // Outer border
        this.addRotatedQuad(cx, cy, PLAYER_SIZE, PLAYER_SIZE, rotRad, sc);
        // Inner body
        this.addRotatedQuad(cx, cy, PLAYER_SIZE - 6, PLAYER_SIZE - 6, rotRad, pc);

        // Face features
        const eyeCol: [number, number, number, number] = [0.0, 0.0, 0.0, 1.0];
        this.addRotatedQuad(cx - 6, cy - 4, 5, 5, rotRad, eyeCol);
        this.addRotatedQuad(cx + 6, cy - 4, 5, 5, rotRad, eyeCol);
        this.addRotatedQuad(cx, cy + 6, 14, 4, rotRad, eyeCol);
      } else {
        // Ship Mode Rocket
        this.addRotatedQuad(cx, cy, PLAYER_SIZE + 6, PLAYER_SIZE * 0.7, rotRad, pc);
        this.addRotatedQuad(cx + 6, cy, 12, 10, rotRad, sc);
        // Thruster exhaust flame
        const flameLength = 10 + Math.random() * 8;
        this.addRotatedQuad(cx - half - flameLength / 2, cy, flameLength, 6, rotRad, [1.0, 0.4, 0.1, 1.0]);
      }
    }

    // 8. Particles (Explosion shards, dust)
    for (let p = 0; p < particles.length; p++) {
      const part = particles[p];
      const { sx, sy } = worldToScreen(part.x, part.y);
      const pcol = hexToRgba(part.color, Math.max(0, part.alpha));
      this.addRotatedQuad(sx, sy, part.size, part.size, part.rotation, pcol);
    }

    // --- Flush to GPU ---
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);
    gl.uniform2f(this.resUniform, width, height);

    // Upload Positions
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.posAttrib);
    gl.vertexAttribPointer(this.posAttrib, 2, gl.FLOAT, false, 0, 0);

    // Upload Colors
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.colors), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.colAttrib);
    gl.vertexAttribPointer(this.colAttrib, 4, gl.FLOAT, false, 0, 0);

    // Draw Triangles
    const vertexCount = this.positions.length / 2;
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
  }
}
