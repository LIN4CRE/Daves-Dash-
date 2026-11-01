/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Square, RotateCw, Trash2, Copy, ZoomIn, ZoomOut, Save,
  Download, Upload, Settings, ArrowLeft, Undo, Redo, Eye, Plus, Sparkles
} from 'lucide-react';
import { LevelData, LevelObject, ObjectCategory, ObjectType } from '../game/types.ts';
import { GRID_SIZE } from '../game/physics.ts';
import { soundEngine } from '../game/audio.ts';
import { saveCustomLevel } from '../game/levels.ts';

interface LevelEditorProps {
  initialLevel: LevelData;
  onExit: () => void;
  onPlaytest: (level: LevelData, startX: number) => void;
}

interface PaletteItem {
  type: ObjectType;
  label: string;
  iconText: string;
  category: ObjectCategory;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Blocks
  { type: 'block', label: 'Solid Block', iconText: '■', category: 'blocks' },
  { type: 'block_metal', label: 'Metal Block', iconText: '▣', category: 'blocks' },
  { type: 'block_outline', label: 'Outline Block', iconText: '□', category: 'blocks' },
  { type: 'slab', label: 'Half Slab', iconText: '▬', category: 'blocks' },
  { type: 'pillar', label: 'Pillar Tile', iconText: '▮', category: 'blocks' },

  // Hazards
  { type: 'spike', label: 'Spike Up', iconText: '▲', category: 'hazards' },
  { type: 'spike_down', label: 'Spike Down', iconText: '▼', category: 'hazards' },
  { type: 'spike_left', label: 'Spike Left', iconText: '◄', category: 'hazards' },
  { type: 'spike_right', label: 'Spike Right', iconText: '►', category: 'hazards' },
  { type: 'half_spike', label: 'Half Spike', iconText: '△', category: 'hazards' },
  { type: 'sawblade_small', label: 'Sawblade S', iconText: '⚙', category: 'hazards' },
  { type: 'sawblade_medium', label: 'Sawblade M', iconText: '✹', category: 'hazards' },

  // Jump Pads & Rings
  { type: 'pad_jump', label: 'Yellow Pad', iconText: '⬬', category: 'jump' },
  { type: 'pad_bounce', label: 'Pink Pad', iconText: '⬬', category: 'jump' },
  { type: 'pad_gravity', label: 'Blue Pad', iconText: '⬬', category: 'jump' },
  { type: 'ring_jump', label: 'Yellow Orb', iconText: '◯', category: 'jump' },
  { type: 'ring_bounce', label: 'Pink Orb', iconText: '◯', category: 'jump' },
  { type: 'ring_gravity', label: 'Blue Orb', iconText: '◯', category: 'jump' },
  { type: 'ring_green', label: 'Green Orb', iconText: '◯', category: 'jump' },

  // Portals
  { type: 'portal_ship', label: 'Ship Portal', iconText: '🚀', category: 'portals' },
  { type: 'portal_cube', label: 'Cube Portal', iconText: '🟩', category: 'portals' },
  { type: 'portal_gravity_inv', label: 'Gravity Invert', iconText: '🔄', category: 'portals' },
  { type: 'portal_gravity_norm', label: 'Gravity Normal', iconText: '🔃', category: 'portals' },
  { type: 'portal_speed_1x', label: 'Speed 1x', iconText: '▶', category: 'portals' },
  { type: 'portal_speed_2x', label: 'Speed 2x', iconText: '▶▶', category: 'portals' },
  { type: 'portal_speed_3x', label: 'Speed 3x', iconText: '▶▶▶', category: 'portals' },

  // Special
  { type: 'coin', label: 'Secret Coin', iconText: '🪙', category: 'special' },
  { type: 'trigger_color', label: 'Color Trigger', iconText: '🎨', category: 'special' },
];

export const LevelEditor: React.FC<LevelEditorProps> = ({
  initialLevel,
  onExit,
  onPlaytest,
}) => {
  const [level, setLevel] = useState<LevelData>(() => JSON.parse(JSON.stringify(initialLevel)));
  const [activeCategory, setActiveCategory] = useState<ObjectCategory>('blocks');
  const [selectedType, setSelectedType] = useState<ObjectType>('block');
  const [editorMode, setEditorMode] = useState<'build' | 'edit' | 'delete'>('build');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // Viewport / Camera state
  const [cameraX, setCameraX] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [gridSnap, setGridSnap] = useState<boolean>(true);
  const [hoverGridPos, setHoverGridPos] = useState<{ x: number; y: number } | null>(null);

  // Settings Modal
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // History for Undo/Redo
  const [history, setHistory] = useState<LevelObject[][]>([JSON.parse(JSON.stringify(initialLevel.objects))]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; camX: number }>({ mouseX: 0, camX: 0 });

  const recordHistory = (newObjects: LevelObject[]) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push(JSON.parse(JSON.stringify(newObjects)));
    if (updated.length > 30) updated.shift();
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      soundEngine.playClick();
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setLevel(l => ({ ...l, objects: JSON.parse(JSON.stringify(prev)) }));
      setSelectedObjectId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      soundEngine.playClick();
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setLevel(l => ({ ...l, objects: JSON.parse(JSON.stringify(next)) }));
      setSelectedObjectId(null);
    }
  };

  // Convert mouse screen coordinates to grid coordinates
  const screenToGrid = useCallback((screenX: number, screenY: number, width: number, height: number) => {
    const groundScreenY = height - 120;
    const worldX = (screenX - 160) / zoom + cameraX;
    const worldY = (groundScreenY - screenY) / zoom;
    const gx = Math.floor(worldX / GRID_SIZE);
    const gy = Math.floor(worldY / GRID_SIZE);
    return { gx: Math.max(0, gx), gy: Math.max(0, gy) };
  }, [cameraX, zoom]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 1000);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const groundScreenY = height - 120;
    const ceilingScreenY = 60;

    // Background fill
    ctx.fillStyle = level.bgColor;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    const step = GRID_SIZE * zoom;
    const startX = (-(cameraX * zoom) + 160) % step;

    for (let x = startX; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = groundScreenY; y >= ceilingScreenY; y -= step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Floor & Baseline
    ctx.fillStyle = level.groundColor;
    ctx.fillRect(0, groundScreenY, width, height - groundScreenY);

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundScreenY);
    ctx.lineTo(width, groundScreenY);
    ctx.stroke();

    // Helper: grid to screen
    const gridToScreen = (gx: number, gy: number) => {
      const sx = (gx * GRID_SIZE - cameraX) * zoom + 160;
      const sy = groundScreenY - (gy * GRID_SIZE) * zoom;
      return { sx, sy };
    };

    // Draw placed objects
    level.objects.forEach(obj => {
      const { sx, sy } = gridToScreen(obj.x, obj.y);
      const isSelected = obj.id === selectedObjectId;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(zoom, zoom);

      if (obj.rotation) {
        ctx.translate(GRID_SIZE / 2, -GRID_SIZE / 2);
        ctx.rotate((obj.rotation * Math.PI) / 180);
        ctx.translate(-GRID_SIZE / 2, GRID_SIZE / 2);
      }

      // Selection box
      if (isSelected) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5 / zoom;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-2, -GRID_SIZE - 2, GRID_SIZE + 4, GRID_SIZE + 4);
        ctx.setLineDash([]);
      }

      // Draw based on type
      if (obj.type.startsWith('block') || obj.type === 'pillar') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, -GRID_SIZE, GRID_SIZE, GRID_SIZE);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, -GRID_SIZE + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        ctx.fillStyle = '#0891b2';
        ctx.fillRect(8, -GRID_SIZE + 8, GRID_SIZE - 16, GRID_SIZE - 16);
      } else if (obj.type === 'slab') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE / 2);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, -GRID_SIZE / 2 + 1, GRID_SIZE - 2, GRID_SIZE / 2 - 2);
      } else if (obj.type.startsWith('spike')) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        if (obj.type === 'spike_down') {
          ctx.moveTo(2, -GRID_SIZE);
          ctx.lineTo(GRID_SIZE / 2, 0);
          ctx.lineTo(GRID_SIZE - 2, -GRID_SIZE);
        } else {
          ctx.moveTo(2, 0);
          ctx.lineTo(GRID_SIZE / 2, -GRID_SIZE);
          ctx.lineTo(GRID_SIZE - 2, 0);
        }
        ctx.closePath();
        ctx.fill();
      } else if (obj.type.startsWith('sawblade')) {
        const r = obj.type === 'sawblade_small' ? 18 : 32;
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(GRID_SIZE / 2, -GRID_SIZE / 2, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(GRID_SIZE / 2, -GRID_SIZE / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type.startsWith('pad_')) {
        const color = obj.type === 'pad_jump' ? '#facc15' : obj.type === 'pad_bounce' ? '#f472b6' : '#38bdf8';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(GRID_SIZE / 2, -7, GRID_SIZE * 0.45, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type.startsWith('ring_')) {
        const color = obj.type === 'ring_jump' ? '#eab308' : obj.type === 'ring_bounce' ? '#ec4899' : obj.type === 'ring_gravity' ? '#0ea5e9' : '#22c55e';
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(GRID_SIZE / 2, -GRID_SIZE / 2, 14, 0, Math.PI * 2);
        ctx.stroke();
      } else if (obj.type.startsWith('portal_')) {
        const portalColor = obj.type === 'portal_ship' ? '#ec4899' : obj.type === 'portal_cube' ? '#22c55e' : '#38bdf8';
        ctx.strokeStyle = portalColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(6, -GRID_SIZE * 2, 28, GRID_SIZE * 2);
      } else if (obj.type === 'coin') {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(GRID_SIZE / 2, -GRID_SIZE / 2, 14, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'trigger_color') {
        ctx.strokeStyle = obj.targetColor || '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, -GRID_SIZE + 4, GRID_SIZE - 8, GRID_SIZE - 8);
      }

      ctx.restore();
    });

    // Draw Ghost Preview when hovering in Build Mode
    if (editorMode === 'build' && hoverGridPos) {
      const { sx, sy } = gridToScreen(hoverGridPos.x, hoverGridPos.y);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(zoom, zoom);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, -GRID_SIZE, GRID_SIZE, GRID_SIZE);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, -GRID_SIZE, GRID_SIZE, GRID_SIZE);
      ctx.restore();
    }
  }, [level, cameraX, zoom, editorMode, hoverGridPos, selectedObjectId]);

  // Pointer interactions on canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Right click or space held -> pan canvas
    if (e.button === 2 || e.shiftKey) {
      isDraggingRef.current = true;
      dragStartRef.current = { mouseX, camX: cameraX };
      return;
    }

    const { gx, gy } = screenToGrid(mouseX, mouseY, canvas.width, canvas.height);

    if (editorMode === 'build') {
      // Place object
      soundEngine.playClick();
      const newObj: LevelObject = {
        id: `obj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: selectedType,
        x: gx,
        y: gy,
      };

      // Remove any existing object on exact same tile
      const filtered = level.objects.filter(o => !(o.x === gx && o.y === gy));
      const newObjects = [...filtered, newObj];
      setLevel(l => ({ ...l, objects: newObjects }));
      recordHistory(newObjects);
    } else if (editorMode === 'edit') {
      // Select object on tile
      const clicked = level.objects.find(o => o.x === gx && o.y === gy);
      if (clicked) {
        soundEngine.playClick();
        setSelectedObjectId(clicked.id);
      } else {
        setSelectedObjectId(null);
      }
    } else if (editorMode === 'delete') {
      // Delete object on tile
      const clicked = level.objects.find(o => o.x === gx && o.y === gy);
      if (clicked) {
        soundEngine.playClick();
        const newObjects = level.objects.filter(o => o.id !== clicked.id);
        setLevel(l => ({ ...l, objects: newObjects }));
        recordHistory(newObjects);
        if (selectedObjectId === clicked.id) setSelectedObjectId(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = (dragStartRef.current.mouseX - mouseX) / zoom;
      setCameraX(Math.max(0, dragStartRef.current.camX + dx));
      return;
    }

    const { gx, gy } = screenToGrid(mouseX, mouseY, canvas.width, canvas.height);
    setHoverGridPos({ x: gx, y: gy });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Transform actions on selected object
  const handleRotateSelected = () => {
    if (!selectedObjectId) return;
    soundEngine.playClick();
    const newObjects = level.objects.map(obj => {
      if (obj.id === selectedObjectId) {
        const curRot = obj.rotation || 0;
        return { ...obj, rotation: (curRot + 90) % 360 };
      }
      return obj;
    });
    setLevel(l => ({ ...l, objects: newObjects }));
    recordHistory(newObjects);
  };

  const handleDuplicateSelected = () => {
    if (!selectedObjectId) return;
    const target = level.objects.find(o => o.id === selectedObjectId);
    if (!target) return;
    soundEngine.playClick();

    const newObj: LevelObject = {
      ...target,
      id: `obj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      x: target.x + 1,
    };
    const newObjects = [...level.objects, newObj];
    setLevel(l => ({ ...l, objects: newObjects }));
    setSelectedObjectId(newObj.id);
    recordHistory(newObjects);
  };

  const handleDeleteSelected = () => {
    if (!selectedObjectId) return;
    soundEngine.playClick();
    const newObjects = level.objects.filter(o => o.id !== selectedObjectId);
    setLevel(l => ({ ...l, objects: newObjects }));
    setSelectedObjectId(null);
    recordHistory(newObjects);
  };

  const handleSave = () => {
    soundEngine.playVictory();
    saveCustomLevel(level);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(level, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${level.name.toLowerCase().replace(/\s+/g, '_')}.davesdash.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && imported.objects && Array.isArray(imported.objects)) {
          setLevel(imported);
          recordHistory(imported.objects);
          soundEngine.playVictory();
        }
      } catch (err) {
        console.error('Failed to import JSON level:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b14] text-white select-none overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#0d1424] border-b border-cyan-500/20 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playClick();
              onExit();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold uppercase tracking-wider text-slate-300 transition-colors"
            title="Exit to Menu"
          >
            <ArrowLeft size={16} /> Exit
          </button>
          <input
            type="text"
            value={level.name}
            onChange={e => setLevel({ ...level, name: e.target.value })}
            className="bg-slate-900 border border-slate-700 focus:border-cyan-400 px-3 py-1 rounded text-sm font-bold text-cyan-300 outline-none w-48"
            placeholder="Level Name"
          />
          <span className="text-xs text-slate-400 font-mono">
            Objs: {level.objects.length} | Cam: {Math.round(cameraX / GRID_SIZE)}
          </span>
        </div>

        {/* Center: Playtest & History */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundEngine.playJump();
              onPlaytest(level, 0);
            }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm uppercase shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
          >
            <Play size={16} className="fill-black" /> Playtest
          </button>
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            title="Undo"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            title="Redo"
          >
            <Redo size={16} />
          </button>
        </div>

        {/* Right: Camera Zoom, Settings, Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-mono text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(1.8, z + 0.2))}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Level Settings"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={handleExportJSON}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Export JSON"
          >
            <Download size={16} />
          </button>

          <label className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer" title="Import JSON">
            <Upload size={16} />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase shadow-md shadow-cyan-600/30 transition-colors"
          >
            <Save size={14} /> Save
          </button>
        </div>
      </header>

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 bg-black overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={e => e.preventDefault()}
          className="w-full h-full block"
        />

        {/* Viewport Floating Panner & Mode Switcher */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 bg-slate-900/90 border border-slate-700/80 rounded-lg p-2 shadow-xl backdrop-blur-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-1">Tools</div>
          <button
            onClick={() => {
              soundEngine.playClick();
              setEditorMode('build');
            }}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-2 transition-colors ${
              editorMode === 'build' ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Plus size={14} /> Build
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setEditorMode('edit');
            }}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-2 transition-colors ${
              editorMode === 'edit' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Square size={14} /> Edit
          </button>
          <button
            onClick={() => {
              soundEngine.playClick();
              setEditorMode('delete');
            }}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-2 transition-colors ${
              editorMode === 'delete' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>

        {/* Camera Navigation Scrub Bar */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 shadow-lg">
            <span>Scroll Level:</span>
            <button
              onClick={() => setCameraX(x => Math.max(0, x - GRID_SIZE * 5))}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 font-bold"
            >
              ◀ -5
            </button>
            <input
              type="range"
              min={0}
              max={level.length * GRID_SIZE}
              value={cameraX}
              onChange={e => setCameraX(Number(e.target.value))}
              className="w-48 accent-cyan-400 cursor-pointer"
            />
            <button
              onClick={() => setCameraX(x => x + GRID_SIZE * 5)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 font-bold"
            >
              +5 ▶
            </button>
          </div>

          {/* Transform actions if an object is selected */}
          {selectedObjectId && (
            <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/95 border border-amber-500/60 rounded-lg p-2 shadow-xl animate-in fade-in">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Selected:</span>
              <button
                onClick={handleRotateSelected}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                title="Rotate 90 degrees"
              >
                <RotateCw size={13} /> 90°
              </button>
              <button
                onClick={handleDuplicateSelected}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                title="Duplicate Object"
              >
                <Copy size={13} /> Dup
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-xs font-bold text-rose-200"
                title="Delete Object"
              >
                <Trash2 size={13} /> Del
              </button>
            </div>
          )}
        </div>

        {/* Save confirmation toast */}
        {saveSuccessNotice && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-emerald-500 text-black font-extrabold text-sm shadow-xl flex items-center gap-2 animate-bounce">
            <Sparkles size={16} /> Level Saved Successfully!
          </div>
        )}
      </div>

      {/* Bottom Object Palette Dock (Web Dashers style) */}
      <footer className="flex flex-col bg-[#0b101c] border-t border-cyan-500/20 z-10">
        {/* Category Tabs */}
        <div className="flex border-b border-slate-800 px-4 bg-[#080d17]">
          {(['blocks', 'hazards', 'jump', 'portals', 'special'] as ObjectCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => {
                soundEngine.playClick();
                setActiveCategory(cat);
              }}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
                activeCategory === cat
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Object Items Carousel */}
        <div className="flex items-center gap-2 p-3 overflow-x-auto">
          {PALETTE_ITEMS.filter(item => item.category === activeCategory).map(item => {
            const isSelected = selectedType === item.type && editorMode === 'build';
            return (
              <button
                key={item.type}
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedType(item.type);
                  setEditorMode('build');
                }}
                className={`flex flex-col items-center justify-center min-w-16 h-16 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-900/40 text-cyan-200 shadow-md shadow-cyan-500/20 scale-105'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className="text-xl leading-none mb-1">{item.iconText}</span>
                <span className="text-[10px] font-bold text-center leading-tight truncate px-1 max-w-[64px]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </footer>

      {/* Level Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-cyan-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h2 className="text-lg font-extrabold uppercase text-cyan-300 tracking-wider">Level Settings</h2>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 uppercase font-bold">Soundtrack Theme</label>
              <select
                value={level.songId}
                onChange={e => setLevel({ ...level, songId: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
              >
                <option value="stereo_rush">Stereo Rush (130 BPM)</option>
                <option value="back_on_track">Back on Track (140 BPM)</option>
                <option value="polargeist">Polargeist (150 BPM)</option>
                <option value="dry_out">Dry Out (145 BPM)</option>
                <option value="electroman">Electroman (160 BPM)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 uppercase font-bold">Background Color</label>
                <input
                  type="color"
                  value={level.bgColor}
                  onChange={e => setLevel({ ...level, bgColor: e.target.value })}
                  className="w-full h-9 rounded cursor-pointer bg-transparent border border-slate-700"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 uppercase font-bold">Ground Color</label>
                <input
                  type="color"
                  value={level.groundColor}
                  onChange={e => setLevel({ ...level, groundColor: e.target.value })}
                  className="w-full h-9 rounded cursor-pointer bg-transparent border border-slate-700"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 uppercase font-bold">Level Length (Blocks)</label>
              <input
                type="number"
                min={40}
                max={500}
                value={level.length}
                onChange={e => setLevel({ ...level, length: Number(e.target.value) })}
                className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-sm uppercase transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
