/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Play, Pause, RefreshCw, Settings, 
  Car, Ambulance, Bike, Bus, 
  Circle as LightIcon, 
  Layers, Image as ImageIcon,
  ChevronRight, Map as MapIcon,
  Volume2, VolumeX,
  Plus, Minus,
  Box as CubeIcon,
  Eye,
  MousePointer2,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

import { TrafficEngine } from './simulation/TrafficEngine.ts';
import { BasicRenderer, SpriteRenderer, Renderer } from './simulation/Renderer.ts';
import { ScenarioType } from './simulation/types.ts';
import { SoundManager } from './simulation/SoundManager.ts';
import { Vehicle3D, TrafficLight3D } from './simulation/3DComponents.tsx';
import { CityEnvironment } from './simulation/CityEnvironment.tsx';
import { PlayerControls } from './simulation/PlayerControls.tsx';

export default function App() {
  const [engine] = useState(() => new TrafficEngine(ScenarioType.JUNCTION_4));
  const [renderer, setRenderer] = useState<Renderer>(() => new BasicRenderer());
  const [isGraphical, setIsGraphical] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [isDaytime, setIsDaytime] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [density, setDensity] = useState(0.5);
  const [scenario, setScenario] = useState(ScenarioType.JUNCTION_4);
  const [isMuted, setIsMuted] = useState(false);
  const [scale, setScale] = useState(1.0);
  const [showControlsHint, setShowControlsHint] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);

  // Update engine parameters
  useEffect(() => {
    engine.isManual = isManual;
    engine.density = density;
    SoundManager.getInstance().setMuted(isMuted);
  }, [engine, isManual, density, isMuted]);

  // Handle scenario change
  const handleScenarioChange = (newScenario: ScenarioType) => {
    setScenario(newScenario);
    engine.setScenario(newScenario);
    
    // Auto-scale based on scenario
    if (newScenario === ScenarioType.CITY_GRID) {
      setScale(0.6);
    } else {
      setScale(1.0);
    }
  };

  // Simulation loop (for 2D)
  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) {
      const dt = (time - lastTimeRef.current) / 1000;
      
      if (!isPaused) {
        engine.update(Math.min(dt, 0.1));
      }
      
      if (!is3D) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            renderer.render(
              ctx, 
              engine.vehicles, 
              engine.lights, 
              engine.scenarioData.lanes,
              scale
            );
          }
        }
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [engine, isPaused, renderer, scale, is3D]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animate]);

  const toggleRenderer = () => {
    setIsGraphical(!isGraphical);
    setRenderer(isGraphical ? new BasicRenderer() : new SpriteRenderer());
  };

  const toggle3D = () => {
    setIs3D(!is3D);
    if (!is3D) setShowControlsHint(true);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isManual) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Find nearest traffic light
    const nearestLight = engine.lights.find(l => {
      const dx = l.position.x - x;
      const dy = l.position.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 40;
    });
    
    if (nearestLight) {
      engine.toggleLight(nearestLight.id);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-500/20">
            <MapIcon className="w-6 h-6 text-zinc-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Smart City Traffic</h1>
            <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Simulation Engine v3.1 (3D Immersive)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-800 rounded-full p-1">
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className={`p-2 rounded-full transition-all ${!isPaused ? 'bg-emerald-500 text-zinc-950' : 'hover:bg-zinc-700'}`}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => engine.setScenario(scenario)}
              className="p-2 rounded-full hover:bg-zinc-700 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-zinc-800" />

          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full hover:bg-zinc-800 transition-all text-zinc-400"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 relative overflow-hidden">
        {/* Sidebar Controls */}
        <aside className="w-80 border-r border-zinc-800 bg-zinc-900/30 p-6 flex flex-col gap-8 z-10 overflow-y-auto">
          {/* Scenario Selection */}
          <section>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 block">Simulation Scenario</label>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(ScenarioType).map((type) => (
                <button
                  key={type}
                  onClick={() => handleScenarioChange(type)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    scenario === type 
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                      : 'bg-zinc-800/50 border-transparent hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <span className="text-sm font-medium">{type}</span>
                  {scenario === type && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </section>

          {/* Traffic Parameters */}
          <section className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Traffic Density</label>
                <span className="text-xs font-mono text-emerald-500">{Math.round(density * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.1" 
                value={density}
                onChange={(e) => setDensity(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <LightIcon className={`w-5 h-5 ${isManual ? 'text-amber-500' : 'text-zinc-500'}`} />
                <div>
                  <p className="text-sm font-medium">Manual Control</p>
                  <p className="text-[10px] text-zinc-500">Click lights to switch</p>
                </div>
              </div>
              <button 
                onClick={() => setIsManual(!isManual)}
                className={`w-10 h-5 rounded-full relative transition-colors ${isManual ? 'bg-amber-500' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isManual ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-3">
                <CubeIcon className={`w-5 h-5 ${is3D ? 'text-purple-500' : 'text-zinc-500'}`} />
                <div>
                  <p className="text-sm font-medium">3D Immersive</p>
                  <p className="text-[10px] text-zinc-500">WASD to move, Mouse to look</p>
                </div>
              </div>
              <button 
                onClick={toggle3D}
                className={`w-10 h-5 rounded-full relative transition-colors ${is3D ? 'bg-purple-500' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${is3D ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-3">
                {isDaytime ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-400" />}
                <div>
                  <p className="text-sm font-medium">Day/Night Mode</p>
                  <p className="text-[10px] text-zinc-500">Toggle environment lighting</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDaytime(!isDaytime)}
                className={`w-10 h-5 rounded-full relative transition-colors ${isDaytime ? 'bg-yellow-500' : 'bg-blue-900'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isDaytime ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {!is3D && (
              <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-3">
                  <ImageIcon className={`w-5 h-5 ${isGraphical ? 'text-blue-500' : 'text-zinc-500'}`} />
                  <div>
                    <p className="text-sm font-medium">Graphical Mode</p>
                    <p className="text-[10px] text-zinc-500">Enhanced sprites & FX</p>
                  </div>
                </div>
                <button 
                  onClick={toggleRenderer}
                  className={`w-10 h-5 rounded-full relative transition-colors ${isGraphical ? 'bg-blue-500' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isGraphical ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            )}
          </section>

          {/* Stats */}
          <section className="mt-auto pt-6 border-t border-zinc-800">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-800/50 p-3 rounded-xl">
                <p className="text-[10px] text-zinc-500 uppercase">Vehicles</p>
                <p className="text-xl font-bold font-mono">{engine.vehicles.length}</p>
              </div>
              <div className="bg-zinc-800/50 p-3 rounded-xl">
                <p className="text-[10px] text-zinc-500 uppercase">Active Lights</p>
                <p className="text-xl font-bold font-mono">{engine.lights.length}</p>
              </div>
            </div>
          </section>
        </aside>

        {/* Simulation Canvas Area */}
        <div className="flex-1 bg-zinc-950 relative overflow-hidden">
          {is3D ? (
            <div className="w-full h-full">
              <Canvas shadows camera={{ position: [0, 20, 100], fov: 60 }}>
                {!isDaytime && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
                <CityEnvironment lanes={engine.scenarioData.lanes} isDaytime={isDaytime} />
                {engine.vehicles.map(v => (
                  <Vehicle3D key={v.id} vehicle={v} />
                ))}
                {engine.lights.map(l => (
                  <TrafficLight3D key={l.id} light={l} />
                ))}
                <PlayerControls />
              </Canvas>
              
              {showControlsHint && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
                >
                  <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 p-8 rounded-3xl shadow-2xl">
                    <MousePointer2 className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Immersive Mode Active</h2>
                    <p className="text-zinc-400 mb-6">Click anywhere to lock cursor and start moving</p>
                    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                      <div className="p-2 bg-zinc-800 rounded-lg text-xs">W: Forward</div>
                      <div className="p-2 bg-zinc-800 rounded-lg text-xs">S: Backward</div>
                      <div className="p-2 bg-zinc-800 rounded-lg text-xs">A: Left</div>
                      <div className="p-2 bg-zinc-800 rounded-lg text-xs">D: Right</div>
                      <div className="p-2 bg-zinc-800 rounded-lg text-xs col-span-2">ESC: Unlock Mouse</div>
                    </div>
                    <button 
                      onClick={() => setShowControlsHint(false)}
                      className="mt-8 px-6 py-2 bg-purple-500 text-white rounded-full font-bold pointer-events-auto"
                    >
                      Got it!
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="w-full h-full cursor-crosshair">
              <canvas 
                ref={canvasRef}
                width={1200}
                height={1200}
                onClick={handleCanvasClick}
                className="w-full h-full object-contain"
              />
              
              {/* Zoom Controls Overlay */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                <button 
                  onClick={() => setScale(s => Math.min(s + 0.1, 2.0))}
                  className="p-3 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}
                  className="p-3 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all"
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Legend Overlay */}
          <div className="absolute top-6 right-6 p-4 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-3 text-xs">
              <div className="w-3 h-3 bg-blue-500 rounded-sm" />
              <span>Car / Bus</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="w-3 h-3 bg-red-500 rounded-sm" />
              <span>Motorcycle</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm" />
              <span>Bicycle</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="w-3 h-3 bg-white border border-zinc-700 rounded-sm" />
              <span>Emergency</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="px-6 py-2 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
        <div className="flex gap-4">
          <span>FPS: 60</span>
          <span>ENGINE: STABLE</span>
          <span>RENDERER: {is3D ? 'THREE_JS_3D' : (isGraphical ? 'SPRITE_2D' : 'BASIC_RECT')}</span>
        </div>
        <div>
          © 2026 SMART CITY SIMULATION LABS
        </div>
      </footer>
    </div>
  );
}
