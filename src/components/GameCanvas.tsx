/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Checkpoint, LevelData, Particle, PlayerCustomization } from '../game/types.ts';
import { createInitialPlayer, GRID_SIZE, PhysicsPlayer, updatePhysics } from '../game/physics.ts';
import { WebGLGameRenderer } from '../game/webglRenderer.ts';
import { soundEngine } from '../game/audio.ts';
import { updateLevelProgress } from '../game/levels.ts';
import { GameHUD } from './GameHUD.tsx';

interface GameCanvasProps {
  level: LevelData;
  isPractice: boolean;
  customization: PlayerCustomization;
  onExit: () => void;
  startWorldX?: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  isPractice: initialIsPractice,
  customization,
  onExit,
  startWorldX = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<WebGLGameRenderer | null>(null);

  // Decoupled Simulation Refs
  const isRunningRef = useRef<boolean>(true);
  const isPausedRef = useRef<boolean>(false);
  const jumpHeldRef = useRef<boolean>(false);
  const jumpPressedRef = useRef<boolean>(false);
  const playerRef = useRef<PhysicsPlayer>(createInitialPlayer());
  const cameraXRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const trailHistoryRef = useRef<{ x: number; y: number; alpha: number }[]>([]);
  const hitstopTimerRef = useRef<number>(0);
  const isVictoryRef = useRef<boolean>(false);

  // Active Level colors
  const currentBgColorRef = useRef<string>(level.bgColor);
  const currentGroundColorRef = useRef<string>(level.groundColor);

  // Practice mode checkpoints
  const [isPractice, setIsPractice] = useState<boolean>(initialIsPractice);
  const checkpointsRef = useRef<Checkpoint[]>([]);
  const [checkpointCount, setCheckpointCount] = useState<number>(0);

  // Metrics state (throttled to avoid 60Hz React re-renders)
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(1);
  const attemptsRef = useRef<number>(1);
  const [jumps, setJumps] = useState<number>(0);
  const jumpsRef = useRef<number>(0);
  const [collectedCoins, setCollectedCoins] = useState<Set<string>>(new Set());
  const collectedCoinsRef = useRef<Set<string>>(new Set());

  // UI Modal States
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getIsMuted());

  // Add / Delete Checkpoints in Practice Mode
  const handleAddCheckpoint = useCallback(() => {
    if (!isPractice || playerRef.current.isDead) return;
    const cp: Checkpoint = {
      x: playerRef.current.x,
      y: playerRef.current.y,
      vx: playerRef.current.vx,
      vy: playerRef.current.vy,
      rotation: playerRef.current.rotation,
      mode: playerRef.current.mode,
      gravity: playerRef.current.gravity,
      speed: playerRef.current.speed,
      cameraX: cameraXRef.current,
      bgColor: currentBgColorRef.current,
      groundColor: currentGroundColorRef.current,
    };
    checkpointsRef.current.push(cp);
    setCheckpointCount(checkpointsRef.current.length);
  }, [isPractice]);

  const handleRemoveCheckpoint = useCallback(() => {
    if (checkpointsRef.current.length > 0) {
      checkpointsRef.current.pop();
      setCheckpointCount(checkpointsRef.current.length);
    }
  }, []);

  // Respawn / Restart logic
  const restartLevel = useCallback(() => {
    attemptsRef.current += 1;
    setAttempts(attemptsRef.current);
    isVictoryRef.current = false;
    setIsGameOver(false);
    setIsVictory(false);
    setIsPaused(false);
    isPausedRef.current = false;

    // In practice mode, respawn at latest checkpoint if one exists
    if (isPractice && checkpointsRef.current.length > 0) {
      const lastCp = checkpointsRef.current[checkpointsRef.current.length - 1];
      playerRef.current = createInitialPlayer(lastCp);
      cameraXRef.current = lastCp.cameraX;
      currentBgColorRef.current = lastCp.bgColor;
      currentGroundColorRef.current = lastCp.groundColor;
    } else {
      playerRef.current = createInitialPlayer();
      if (startWorldX > 0) {
        playerRef.current.x = startWorldX;
      }
      cameraXRef.current = playerRef.current.x;
      currentBgColorRef.current = level.bgColor;
      currentGroundColorRef.current = level.groundColor;
    }

    particlesRef.current = [];
    trailHistoryRef.current = [];
    hitstopTimerRef.current = 0;
    document.body.dataset.state = 'playing';

    // Start background music
    soundEngine.playMusic(level.songId, level.bpm);
  }, [isPractice, level, startWorldX]);

  // Main Simulation & Rendering Loop (mounted once)
  useEffect(() => {
    document.body.dataset.state = 'playing';
    soundEngine.playMusic(level.songId, level.bpm);

    // Initial position if custom start requested
    if (startWorldX > 0) {
      playerRef.current.x = startWorldX;
      cameraXRef.current = startWorldX;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    rendererRef.current = new WebGLGameRenderer(canvas);
    soundEngine.setBeatCallback(() => {
      rendererRef.current?.setBeatPulse(1.0);
    });

    let lastTime = performance.now();
    let animFrameId: number;

    const gameLoop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent tunneling

      if (isRunningRef.current && !isPausedRef.current) {
        // Handle hitstop / death timer
        if (hitstopTimerRef.current > 0) {
          hitstopTimerRef.current -= dt;
          if (hitstopTimerRef.current <= 0) {
            // After hitstop beat, show game over modal
            document.body.dataset.state = 'gameover';
            setIsGameOver(true);
          }
        } else if (!playerRef.current.isDead && !isVictoryRef.current) {
          // --- Run Physics Tick ---
          const { player, events } = updatePhysics(
            playerRef.current,
            dt,
            jumpHeldRef.current,
            jumpPressedRef.current,
            level.objects
          );
          playerRef.current = player;
          jumpPressedRef.current = false; // consume single-frame edge

          // Camera smoothly tracks player
          cameraXRef.current = player.x;

          // Process physics events
          if (events.jumped) {
            soundEngine.playJump();
            jumpsRef.current += 1;
            setJumps(jumpsRef.current);

            // Jump burst particles
            for (let i = 0; i < 4; i++) {
              particlesRef.current.push({
                x: player.x + (Math.random() - 0.5) * 20,
                y: player.y,
                vx: (Math.random() - 0.5) * 120,
                vy: (Math.random() - 0.5) * 80,
                size: 4 + Math.random() * 3,
                color: customization.primaryColor,
                alpha: 0.8,
                life: 0,
                maxLife: 0.25,
                rotation: Math.random() * Math.PI,
                vRot: (Math.random() - 0.5) * 10,
                shape: 'square',
              });
            }
          }

          if (events.padHit) {
            soundEngine.playPad();
            jumpsRef.current += 1;
            setJumps(jumpsRef.current);
          }

          if (events.ringHit) {
            soundEngine.playRing();
            jumpsRef.current += 1;
            setJumps(jumpsRef.current);
          }

          if (events.portalHit) {
            soundEngine.playPortal();
          }

          if (events.coinCollected) {
            if (!collectedCoinsRef.current.has(events.coinCollected)) {
              soundEngine.playCoin();
              collectedCoinsRef.current.add(events.coinCollected);
              setCollectedCoins(new Set(collectedCoinsRef.current));
            }
          }

          if (events.colorTrigger) {
            if (events.colorTrigger.element === 'bg') {
              currentBgColorRef.current = events.colorTrigger.color;
            } else {
              currentGroundColorRef.current = events.colorTrigger.color;
            }
          }

          // Player Death
          if (events.died) {
            soundEngine.playDeath();
            soundEngine.stopMusic();
            hitstopTimerRef.current = 0.5; // brief freeze before modal

            // Spawn 32 explosive geometric shards
            for (let i = 0; i < 32; i++) {
              const angle = (i / 32) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
              const spd = 200 + Math.random() * 450;
              particlesRef.current.push({
                x: player.x,
                y: player.y + 18,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: 6 + Math.random() * 8,
                color: i % 2 === 0 ? customization.primaryColor : customization.secondaryColor,
                alpha: 1.0,
                life: 0,
                maxLife: 0.6 + Math.random() * 0.4,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 20,
                shape: 'shard',
              });
            }
          }

          // Check Victory Condition (Cross Level End Goal)
          const levelEndWorldX = level.length * GRID_SIZE;
          if (player.x >= levelEndWorldX && !isVictoryRef.current) {
            isVictoryRef.current = true;
            soundEngine.stopMusic();
            soundEngine.playVictory();
            document.body.dataset.state = 'gameover';
            setIsVictory(true);

            // Update persistent progress
            updateLevelProgress(level.id, {
              bestPercent: 100,
              practicePercent: isPractice ? 100 : undefined,
              coinsCollected: Array.from(collectedCoinsRef.current).map((_, i) => i),
              completed: true,
            });
          }

          // Update Progress Percentage
          const pct = Math.min(100, Math.max(0, (player.x / levelEndWorldX) * 100));
          setProgressPercent(pct);
          if (!isPractice) {
            updateLevelProgress(level.id, { bestPercent: pct });
          } else {
            updateLevelProgress(level.id, { practicePercent: pct });
          }

          // Update Trail buffer
          trailHistoryRef.current.push({ x: player.x, y: player.y, alpha: 1.0 });
          if (trailHistoryRef.current.length > 18) {
            trailHistoryRef.current.shift();
          }
        }

        // Advance active particles
        for (let p = particlesRef.current.length - 1; p >= 0; p--) {
          const part = particlesRef.current[p];
          part.life += dt;
          if (part.life >= part.maxLife) {
            particlesRef.current.splice(p, 1);
            continue;
          }
          part.x += part.vx * dt;
          part.y += part.vy * dt;
          part.rotation += part.vRot * dt;
          part.alpha = 1 - part.life / part.maxLife;
        }

        // Fade trail
        for (let t = 0; t < trailHistoryRef.current.length; t++) {
          trailHistoryRef.current[t].alpha -= dt * 3.5;
        }
      }

      // Render Current Frame
      if (rendererRef.current && canvasRef.current) {
        const width = canvasRef.current.parentElement?.clientWidth || window.innerWidth;
        const height = canvasRef.current.parentElement?.clientHeight || window.innerHeight;
        rendererRef.current.resize(width, height);

        rendererRef.current.render(
          dt,
          playerRef.current,
          cameraXRef.current,
          level.objects,
          particlesRef.current,
          currentBgColorRef.current,
          currentGroundColorRef.current,
          customization,
          trailHistoryRef.current,
          level.length,
          isPractice,
          checkpointsRef.current.map(c => ({ x: c.x, y: c.y }))
        );
      }

      animFrameId = requestAnimationFrame(gameLoop);
    };

    animFrameId = requestAnimationFrame(gameLoop);

    // Global Key Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (isGameOver || isVictoryRef.current) {
          restartLevel();
          return;
        }
        if (!jumpHeldRef.current) {
          jumpPressedRef.current = true;
        }
        jumpHeldRef.current = true;
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (!isGameOver && !isVictoryRef.current) {
          isPausedRef.current = !isPausedRef.current;
          setIsPaused(isPausedRef.current);
          if (isPausedRef.current) {
            document.body.dataset.state = 'paused';
            soundEngine.stopMusic();
          } else {
            document.body.dataset.state = 'playing';
            soundEngine.playMusic(level.songId, level.bpm);
          }
        }
      } else if (e.code === 'KeyZ') {
        handleAddCheckpoint();
      } else if (e.code === 'KeyX') {
        handleRemoveCheckpoint();
      } else if (e.code === 'KeyM') {
        const muted = soundEngine.toggleMute();
        setIsMuted(muted);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        jumpHeldRef.current = false;
        jumpPressedRef.current = false;
      }
    };

    // Pointer / Touch Listeners for Jump
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        if (isGameOver || isVictoryRef.current) {
          restartLevel();
          return;
        }
        if (!jumpHeldRef.current) {
          jumpPressedRef.current = true;
        }
        jumpHeldRef.current = true;
      }
    };

    const handleMouseUp = () => {
      jumpHeldRef.current = false;
      jumpPressedRef.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (isGameOver || isVictoryRef.current) {
        restartLevel();
        return;
      }
      if (!jumpHeldRef.current) {
        jumpPressedRef.current = true;
      }
      jumpHeldRef.current = true;
    };

    const handleTouchEnd = () => {
      jumpHeldRef.current = false;
      jumpPressedRef.current = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      cancelAnimationFrame(animFrameId);
      soundEngine.stopMusic();
      soundEngine.setBeatCallback(null);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [level, isPractice, customization, restartLevel, handleAddCheckpoint, handleRemoveCheckpoint, isGameOver, startWorldX]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      {/* 60 FPS WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* World-Matched Game HUD */}
      <GameHUD
        level={level}
        progressPercent={progressPercent}
        attempts={attempts}
        jumps={jumps}
        coinsCount={collectedCoins.size}
        isPractice={isPractice}
        checkpointCount={checkpointCount}
        isPaused={isPaused}
        isGameOver={isGameOver}
        isVictory={isVictory}
        isMuted={isMuted}
        onPause={() => {
          isPausedRef.current = true;
          setIsPaused(true);
          document.body.dataset.state = 'paused';
          soundEngine.stopMusic();
        }}
        onResume={() => {
          isPausedRef.current = false;
          setIsPaused(false);
          document.body.dataset.state = 'playing';
          soundEngine.playMusic(level.songId, level.bpm);
        }}
        onRestart={restartLevel}
        onExitToMenu={() => {
          soundEngine.stopMusic();
          onExit();
        }}
        onToggleMute={() => {
          const muted = soundEngine.toggleMute();
          setIsMuted(muted);
        }}
        onAddCheckpoint={handleAddCheckpoint}
        onRemoveCheckpoint={handleRemoveCheckpoint}
      />
    </div>
  );
};
