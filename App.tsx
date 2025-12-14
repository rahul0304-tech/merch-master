/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, Box, Image as ImageIcon, Wand2, Layers, Plus, Trash2, Download, History, Sparkles, Shirt, Move, Maximize, RotateCcw, Zap, Cpu, ArrowRight, Globe, Scan, Camera, Aperture, Repeat, SprayCan, Triangle, Package, Menu, X, Check, MousePointer2, Undo2, Redo2, ZoomIn, ZoomOut, MoveUp, MoveDown, BringToFront, SendToBack, ChevronsUp, ChevronsDown, ChevronUp, ChevronDown, RotateCw, Sun, Grid3x3, PaintBucket, Palette, Loader2, MessageSquarePlus, Pencil, Droplets, Contrast, Settings } from 'lucide-react';
import { Button } from './components/Button';
import { FileUploader } from './components/FileUploader';
import { CameraAngleSelector } from './components/CameraAngleSelector';
import { generateMockup, generateAsset, generateRealtimeComposite } from './services/geminiService';
import { Asset, GeneratedMockup, AppView, LoadingState, PlacedLayer } from './types';
import { useApiKey } from './hooks/useApiKey';
import ApiKeyDialog from './components/ApiKeyDialog';

// --- Constants ---

const PROMPT_TEMPLATES = [
  { label: 'Embroidery', prompt: 'Render the logo with a realistic embroidery effect, showing detailed thread texture, stitching patterns, and slight fabric puckering around the edges.' },
  { label: 'Screen Print', prompt: 'Apply a screen print texture to the logo, with a slightly matte finish, realistic ink thickness, and minor weathering details suitable for fabric.' },
  { label: 'Gold Foil', prompt: 'Render the logo as a metallic gold foil stamp, with high reflectivity, realistic specular highlights, and a slightly depressed texture into the material.' },
  { label: 'Debossed', prompt: 'Create a deep debossed effect where the logo is pressed into the material, creating realistic depth, soft inner shadows, and highlights on the rim.' },
  { label: 'Woven Label', prompt: 'Render the logo as a sewn-on woven fabric label, with visible textile texture, stitching threads around the perimeter, and slight shadow depth.' },
  { label: 'Glossy Vinyl', prompt: 'Render the logo as a high-gloss vinyl decal applied to the surface, with sharp reflections, vibrant colors, and a slight edge thickness.' },
  { label: 'Matte Finish', prompt: 'Apply a flat matte finish to the design, removing all specular highlights and creating a soft, velvety texture that absorbs light.' },
  { label: 'Distressed', prompt: 'Apply a vintage distressed look to the print, with cracked ink, faded areas, and substrate texture showing through the design for a worn-in feel.' },
  { label: 'Metallic', prompt: 'Render the design with a metallic sheen, simulating a brushed metal surface with anisotropic reflections and high contrast highlights.' },
  { label: 'Puff Ink', prompt: 'Simulate 3D puff ink printing, giving the logo significant raised volume with rounded edges and a soft, foam-like texture.' },
];

const STOCK_ASSETS: Asset[] = [
  {
    id: 'stock-tshirt-white',
    type: 'product',
    name: 'White Cotton T-Shirt',
    mimeType: 'image/svg+xml',
    data: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjZjRmNGY1IiBkPSJNMzY1LjMsMTAyaC01NC45Yy01LjYsMC0xMC44LTMuMy0xMy4zLTguNGwtNy41LTE2LjljLTMuNi04LjEtMTEuNi0xMy4zLTIwLjUtMTMuM2gtNjYuMmMtOC45LDAtMTYuOSw1LjItMjAuNSwxMy4zbC03LjUsMTYuOWMtMi41LDUuMS03LjcsOC40LTEzLjMsOC40aC01NC45Yy0xNi41LDAtMzEuNSw4LjktMzkuNiwyMy41bC0zOC42LDY5LjVjLTUuMiw5LjMtMy4xLDIwLjksNC44LDI3LjlsNDYuMSw0MS4xYzkuNCw4LjQsMjQuMSw2LjMsMzAuNi00LjVsMTYuNy0yNy43VjQxNmMwLDI2LjUsMjEuNSw0OCw0OCw0OGgxNjJjMjYuNSwwLDQ4LTIxLjUsNDgtNDhWMjMwLjdsMTYuNywyNy43YzYuNSwxMC44LDIxLjIsMTIuOSwzMC42LDQuNWw0Ni4xLTQxLjFjNy45LTcuMSwxMC0xOC42LDQuOC0yNy45bC0zOC42LTY5LjVDMzk2LjgsMTEwLjksMzgxLjgsMTAyLDM2NS4zLDEwMnoiLz48L3N2Zz4='
  },
  {
    id: 'stock-hoodie-black',
    type: 'product',
    name: 'Black Hoodie',
    mimeType: 'image/svg+xml',
    data: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjMjcyNzJhIiBkPSJNMTI4LDY0QzEyOCw2NCwxNDAsMTYsMjU2LDE2czEyOCw0OCwxMjgsNDhWMzg0SDEyOFoiLz48cGF0aCBmaWxsPSIjMmUyZTMyIiBkPSJNMzc4LDExMmwtNDIsNjR2MjcySDE3NlYxNzZsLTQyLTY0Qzk2LDE2MCw2NCwyNTYsNjQsMjU2bDgwLDMyTDk2LDQ5NmgzMjBsLTQ4LTIwOGw4MC0zMlM0MTYsMTYwLDM3OCwxMTJaIi8+PC9zdmc+'
  },
  {
    id: 'stock-logo-abstract',
    type: 'logo',
    name: 'Abstract Geo',
    mimeType: 'image/svg+xml',
    data: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NSIgZmlsbD0iIzMzMyIvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZmZhNTAwIiB0cmFuc2Zvcm09InJvdGF0ZSg0NSA1MCA1MCkiLz48L3N2Zz4='
  },
  {
    id: 'stock-logo-badge',
    type: 'logo',
    name: 'Retro Badge',
    mimeType: 'image/svg+xml',
    data: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBmaWxsPSIjNDg0OGVhIiBkPSJNNTAsMTBMOTAsMzBWNzBINTBMMTAsNzBWMzBaIi8+PHRleHQgeD0iNTAiIHk9IjU1IiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPkhZUEU8L3RleHQ+PC9zdmc+'
  }
];

// --- Intro Animation Component ---

const IntroSequence = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'enter' | 'wait' | 'spray' | 'admire' | 'exit' | 'prism' | 'explode'>('enter');

  useEffect(() => {
    // Cinematic Timeline
    const schedule = [
      { t: 100, fn: () => setPhase('enter') },      // Bot walks in
      { t: 1800, fn: () => setPhase('wait') },      // Stops, looks around
      { t: 2400, fn: () => setPhase('spray') },     // Spray can enters & sprays
      { t: 4000, fn: () => setPhase('admire') },    // Spray done, bot looks at self
      { t: 5000, fn: () => setPhase('exit') },      // Bot runs away
      { t: 5600, fn: () => setPhase('prism') },     // Logo forms
      { t: 7800, fn: () => setPhase('explode') },   // Boom
      { t: 8500, fn: () => onComplete() }           // Done
    ];

    const timers = schedule.map(s => setTimeout(s.fn, s.t));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-white flex items-center justify-center overflow-hidden font-sans select-none
      ${phase === 'explode' ? 'animate-[fadeOut_1s_ease-out_forwards] pointer-events-none' : ''}
    `}>
      {/* Flash Overlay for Explosion */}
      <div className={`absolute inset-0 bg-white pointer-events-none z-50 transition-opacity duration-300 ease-out ${phase === 'explode' ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]"></div>

      {/* STAGE AREA - Scaled for mobile */}
      <div className="relative w-full max-w-4xl h-96 flex items-center justify-center scale-[0.6] md:scale-100">

        {/* --- CHARACTER: THE BOX BOT --- */}
        {(phase !== 'prism' && phase !== 'explode') && (
          <div className={`relative z-10 flex flex-col items-center transition-transform will-change-transform
             ${phase === 'enter' ? 'animate-[hopIn_1.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]' : ''}
             ${phase === 'exit' ? 'animate-[anticipateSprint_0.8s_ease-in_forwards]' : ''}
          `}>
             {/* Body */}
             <div className={`w-32 h-36 bg-white rounded-xl relative overflow-hidden shadow-2xl transition-all duration-300 border-4
                ${phase === 'spray' || phase === 'admire' || phase === 'exit' 
                  ? 'border-black shadow-[0_0_40px_rgba(0,0,0,0.1)]' 
                  : 'border-zinc-200'}
             `}>
                
                {/* Blank Package Tape (Hidden after spray) */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-full bg-zinc-100 border-x border-zinc-200 transition-opacity duration-200 ${phase === 'spray' || phase === 'admire' || phase === 'exit' ? 'opacity-0' : 'opacity-100'}`}></div>

                {/* Face Screen */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-10 bg-zinc-900 rounded-md flex items-center justify-center gap-4 overflow-hidden border border-zinc-700 shadow-inner z-20">
                   {/* Eyes */}
                   <div className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${phase === 'spray' ? 'scale-y-10 bg-yellow-400' : 'animate-pulse'}`}></div>
                   <div className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${phase === 'spray' ? 'scale-y-10 bg-yellow-400' : 'animate-pulse'}`}></div>
                </div>

                {/* BRAND REVEAL: Logo & Color Gradient */}
                <div className={`absolute inset-0 bg-black transition-opacity duration-500 ${phase === 'spray' || phase === 'admire' || phase === 'exit' ? 'opacity-100' : 'opacity-0'}`}></div>
                
                {/* White Flash on Transform */}
                <div className={`absolute inset-0 bg-white mix-blend-overlay pointer-events-none ${phase === 'spray' ? 'animate-[flash_0.2s_ease-out]' : 'opacity-0'}`}></div>

                {/* Logo Icon */}
                <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-all duration-500 transform z-20
                   ${phase === 'spray' || phase === 'admire' || phase === 'exit' ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-4'}
                `}>
                   <div className="w-10 h-10 bg-white text-black rounded flex items-center justify-center shadow-lg">
                      <Package size={24} strokeWidth={3} />
                   </div>
                </div>
             </div>

             {/* Legs */}
             <div className="flex gap-10 -mt-1 z-0">
                <div className={`w-3 h-8 bg-zinc-800 rounded-b-full origin-top ${phase === 'enter' ? 'animate-[legMove_0.2s_infinite_alternate]' : ''} ${phase === 'exit' ? 'animate-[legMove_0.1s_infinite_alternate]' : ''}`}></div>
                <div className={`w-3 h-8 bg-zinc-800 rounded-b-full origin-top ${phase === 'enter' ? 'animate-[legMove_0.2s_infinite_alternate-reverse]' : ''} ${phase === 'exit' ? 'animate-[legMove_0.1s_infinite_alternate-reverse]' : ''}`}></div>
             </div>
          </div>
        )}

        {/* --- SPRAY CAN ACTOR --- */}
        {phase === 'spray' && (
          <div className="absolute z-20 animate-[swoopIn_0.4s_cubic-bezier(0.17,0.67,0.83,0.67)_forwards]" style={{ right: '22%', top: '5%' }}>
             <div className="relative animate-[shake_0.15s_infinite]">
                <SprayCan size={80} className="text-zinc-400 fill-zinc-800 rotate-[-15deg] drop-shadow-2xl" />
                
                {/* Spray Nozzle Mist */}
                <div className="absolute top-0 -left-4 w-6 h-6 bg-black rounded-full blur-md animate-ping"></div>
                
                {/* Particle Stream */}
                <div className="absolute top-4 -left-8 w-40 h-40 pointer-events-none overflow-visible">
                   {[...Array(20)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute w-2 h-2 bg-black rounded-full animate-[sprayParticle_0.4s_linear_forwards]"
                        style={{ 
                           top: Math.random() * 20, 
                           left: 0,
                           animationDelay: `${Math.random() * 0.3}s`,
                        }}
                      />
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* --- FINALE --- */}
        {(phase === 'prism' || phase === 'explode') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
             {/* Logo Icon */}
             <div className={`relative w-32 h-32 animate-[spinAppear_1.5s_cubic-bezier(0.34,1.56,0.64,1)_forwards]`}>
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_50px_rgba(0,0,0,0.1)]">
                   <defs>
                      <linearGradient id="prismStroke" x1="0" y1="0" x2="1" y2="1">
                         <stop offset="0%" stopColor="#000000" />
                         <stop offset="100%" stopColor="#333333" />
                      </linearGradient>
                   </defs>
                   <path 
                      d="M50 10 L90 85 L10 85 Z" 
                      fill="none" 
                      stroke="url(#prismStroke)" 
                      strokeWidth="4" 
                      strokeLinejoin="round"
                      className="animate-[drawStroke_1s_ease-out_forwards]"
                   />
                   <path 
                      d="M50 10 L50 85 M50 50 L90 85 M50 50 L10 85" 
                      stroke="url(#prismStroke)" 
                      strokeWidth="1.5" 
                      className="opacity-20"
                   />
                </svg>
             </div>
             
             {/* Text Reveal */}
             <div className="text-center animate-[popIn_0.8s_cubic-bezier(0.17,0.67,0.83,0.67)_0.5s_forwards] opacity-0">
                <h1 className="text-5xl font-black text-black tracking-tighter mb-2">MerchMaster</h1>
                <p className="text-sm text-zinc-500 font-mono tracking-[0.3em] uppercase">AI Product Design</p>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

// --- UI Components ---

const NavButton = ({ icon, label, active, onClick, number }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, number?: number }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 group
      ${active ? 'bg-black/5 text-black shadow-sm border border-black/5 backdrop-blur-md' : 'text-zinc-500 hover:bg-black/5 hover:text-black'}`}
  >
    <span className={`${active ? 'text-black' : 'text-zinc-400 group-hover:text-black'} transition-colors`}>
      {icon}
    </span>
    <span className="font-medium text-sm tracking-wide flex-1 text-left">{label}</span>
    {number && (
      <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded min-w-[1.5rem] text-center transition-colors ${active ? 'bg-black text-white' : 'bg-black/5 text-zinc-500'}`}>
        {number}
      </span>
    )}
  </button>
);

const WorkflowStepper = ({ currentView, onViewChange }: { currentView: AppView, onViewChange: (view: AppView) => void }) => {
  const steps = [
    { id: 'assets', label: 'Upload Assets', number: 1 },
    { id: 'studio', label: 'Design Mockup', number: 2 },
    { id: 'gallery', label: 'Download Result', number: 3 },
  ];

  const viewOrder = ['assets', 'studio', 'gallery'];
  const currentIndex = viewOrder.indexOf(currentView);
  const progress = Math.max(0, (currentIndex / (steps.length - 1)) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto mb-12 hidden md:block animate-fade-in px-4">
      <div className="relative">
         {/* Background Track */}
         <div className="absolute top-1/2 left-0 right-0 h-1 bg-black/5 -translate-y-1/2 rounded-full backdrop-blur-sm"></div>
         
         {/* Active Progress Bar */}
         <div 
            className="absolute top-1/2 left-0 h-1 bg-black -translate-y-1/2 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
         ></div>

         <div className="relative flex justify-between w-full">
            {steps.map((step, index) => {
               const isCompleted = currentIndex > index;
               const isCurrent = currentIndex === index;
               
               return (
                  <button 
                    key={step.id}
                    onClick={() => onViewChange(step.id as AppView)}
                    className={`group flex flex-col items-center focus:outline-none relative z-10 cursor-pointer`}
                  >
                     <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 backdrop-blur-md
                        ${isCurrent 
                           ? 'border-black bg-white text-black shadow-lg scale-110' 
                           : isCompleted 
                              ? 'border-black bg-black text-white' 
                              : 'border-black/10 bg-white/50 text-zinc-400 group-hover:border-black/20 group-hover:text-zinc-600'}
                     `}>
                        {isCompleted ? (
                           <Check size={18} strokeWidth={3} />
                        ) : (
                           <span className="text-sm font-bold font-mono">{step.number}</span>
                        )}
                     </div>
                     <span className={`
                        absolute top-14 text-xs font-medium tracking-wider transition-all duration-300 whitespace-nowrap
                        ${isCurrent ? 'text-black opacity-100 transform translate-y-0' : isCompleted ? 'text-zinc-500 opacity-80' : 'text-zinc-400 opacity-60 group-hover:opacity-100'}
                     `}>
                        {step.label}
                     </span>
                  </button>
               )
            })}
         </div>
      </div>
    </div>
  )
};

// Helper component for Asset Sections
const AssetSection = ({ 
  title, 
  icon, 
  type, 
  assets, 
  onAdd, 
  onRemove,
  onRename,
  validateApiKey,
  onApiError
}: { 
  title: string, 
  icon: React.ReactNode, 
  type: 'logo' | 'product', 
  assets: Asset[], 
  onAdd: (a: Asset) => void, 
  onRemove: (id: string) => void,
  onRename: (id: string, newName: string) => void,
  validateApiKey: () => Promise<boolean>,
  onApiError: (e: any) => void
}) => {
  const [mode, setMode] = useState<'upload' | 'generate'>('upload');
  const [genPrompt, setGenPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleGenerate = async () => {
    if (!genPrompt) return;
    
    // Validate API key first
    if (!(await validateApiKey())) return;

    setIsGenerating(true);
    try {
      const b64 = await generateAsset(genPrompt, type);
      onAdd({
        id: Math.random().toString(36).substring(7),
        type,
        name: `AI Generated ${type}`,
        data: b64,
        mimeType: 'image/png'
      });
      setGenPrompt('');
    } catch (e: any) {
      console.error(e);
      onApiError(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const startEditing = (asset: Asset) => {
    setEditingId(asset.id);
    setEditName(asset.name);
  };

  const saveName = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2 text-black">{icon} {title}</h2>
          <span className="text-xs bg-black/5 px-2 py-1 rounded text-zinc-500 border border-black/5">{assets.length} items</span>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 overflow-y-auto max-h-[400px] pr-2">
          {assets.map(asset => (
            <div key={asset.id} className="flex flex-col gap-2">
              <div className="relative group aspect-square bg-white rounded-lg overflow-hidden border border-black/5 hover:border-black/30 transition-colors shadow-sm">
                  <img src={asset.data} className="w-full h-full object-contain p-2" alt={asset.name} />
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => onRemove(asset.id)} className="p-1.5 bg-red-500 text-white rounded-full backdrop-blur-md shadow-sm hover:scale-110 transition-transform">
                       <Trash2 size={12} />
                     </button>
                  </div>
              </div>
              
              {/* Renaming UI */}
              <div className="h-8">
                 {editingId === asset.id ? (
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={saveName}
                      onKeyDown={(e) => e.key === 'Enter' && saveName()}
                      autoFocus
                      className="w-full text-xs p-1 border border-black/20 rounded focus:ring-1 focus:ring-black focus:outline-none"
                    />
                 ) : (
                    <div className="flex items-center justify-between group/text">
                       <span className="text-xs text-zinc-600 truncate max-w-[80%]" title={asset.name}>{asset.name}</span>
                       <button onClick={() => startEditing(asset)} className="opacity-0 group-hover/text:opacity-100 text-zinc-400 hover:text-black transition-opacity">
                          <Pencil size={12} />
                       </button>
                    </div>
                 )}
              </div>
            </div>
          ))}
          {assets.length === 0 && (
            <div className="col-span-2 sm:col-span-3 flex flex-col items-center justify-center h-32 text-zinc-400 border border-dashed border-black/10 rounded-lg bg-black/5">
              <p className="text-sm">No {type}s yet</p>
            </div>
          )}
      </div>

      {/* Creation Area */}
      <div className="mt-auto pt-4 border-t border-black/5">
        <div className="flex gap-4 mb-4">
           <button 
             onClick={() => setMode('upload')}
             className={`text-sm font-medium pb-1 border-b-2 transition-colors ${mode === 'upload' ? 'border-black text-black' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
           >
             Upload
           </button>
           <button 
             onClick={() => setMode('generate')}
             className={`text-sm font-medium pb-1 border-b-2 transition-colors ${mode === 'generate' ? 'border-black text-black' : 'border-transparent text-zinc-500 hover:text-zinc-800'}`}
           >
             Generate with AI
           </button>
        </div>

        {mode === 'upload' ? (
           <FileUploader label={`Upload ${type}`} onFileSelect={(f) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                onAdd({
                  id: Math.random().toString(36).substring(7),
                  type,
                  name: f.name.split('.')[0], // Initial name from filename
                  data: e.target?.result as string,
                  mimeType: f.type
                });
              };
              reader.readAsDataURL(f);
           }} />
        ) : (
           <div className="space-y-3">
              <textarea 
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder={`Describe the ${type} you want to create...`}
                className="w-full bg-white border border-black/10 rounded-lg p-3 text-base text-black focus:ring-2 focus:ring-black resize-none h-24 placeholder:text-zinc-400 focus:outline-none focus:bg-white transition-colors"
              />
              <Button 
                onClick={handleGenerate} 
                isLoading={isGenerating} 
                disabled={!genPrompt}
                className="w-full"
                icon={<Sparkles size={16} />}
              >
                Generate {type}
              </Button>
           </div>
        )}
      </div>
    </div>
  );
};


// --- App Component ---

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState<AppView>('dashboard');
  const [assets, setAssets] = useState<Asset[]>(STOCK_ASSETS);
  const [generatedMockups, setGeneratedMockups] = useState<GeneratedMockup[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMockup, setSelectedMockup] = useState<GeneratedMockup | null>(null); // State for lightbox

  // Form states for generation
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [placedLogos, setPlacedLogos] = useState<PlacedLayer[]>([]);
  
  // Selection & View State
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const showGridRef = useRef(false); // Ref for event listener access
  const [canvasBackground, setCanvasBackground] = useState<string>('transparent');
  const [selectedAngles, setSelectedAngles] = useState<string[]>(['Front']); // New state for camera angles

  // AI Generation Modal State
  const [showAssetGenModal, setShowAssetGenModal] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [isGeneratingAsset, setIsGeneratingAsset] = useState(false);
  
  // Undo/Redo History State
  const [history, setHistory] = useState<PlacedLayer[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState<LoadingState>({ isGenerating: false, message: '' });
  
  // Settings / API Key State
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState(localStorage.getItem('gemini_api_key') || '');

  // Sync ref
  useEffect(() => {
    showGridRef.current = showGrid;
  }, [showGrid]);

  // API Key Management
  const { showApiKeyDialog, setShowApiKeyDialog, validateApiKey, handleApiKeyDialogContinue } = useApiKey();

  // Helper to check for any valid key (Local or Managed)
  const checkApiKey = async (): Promise<boolean> => {
     if (localStorage.getItem('gemini_api_key')) return true;
     return await validateApiKey();
  };
  
  const handleSaveKey = () => {
     localStorage.setItem('gemini_api_key', userApiKey);
     setShowSettings(false);
  };

  // API Error Handling Logic
  const handleApiError = (error: any) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    let shouldOpenDialog = false;

    // Check for specific Server-side Error Signatures
    if (errorMessage.includes('Requested entity was not found')) {
      console.warn('Model not found - likely a billing/key issue');
      shouldOpenDialog = true;
    } else if (
      errorMessage.includes('API_KEY_INVALID') ||
      errorMessage.includes('API key not valid') ||
      errorMessage.includes('PERMISSION_DENIED') || 
      errorMessage.includes('403')
    ) {
      console.warn('Invalid API Key or Permissions');
      shouldOpenDialog = true;
    }

    if (shouldOpenDialog) {
      setShowApiKeyDialog(true);
    } else {
      alert(`Operation failed: ${errorMessage}`);
    }
  };

  // Interaction State (Replacing simple dragging)
  const canvasRef = useRef<HTMLDivElement>(null);
  const [interactionState, setInteractionState] = useState<{
    mode: 'IDLE' | 'DRAG' | 'RESIZE' | 'ROTATE';
    layerId: string | null;
    startX: number;
    startY: number;
    initialValues: { x: number; y: number; scale: number; rotation: number };
    // For Rotation
    centerX?: number;
    centerY?: number;
    initialAngle?: number;
    // For Resize
    initialDist?: number;
  }>({ mode: 'IDLE', layerId: null, startX: 0, startY: 0, initialValues: { x: 0, y: 0, scale: 1, rotation: 0 } });

  // Refs for history tracking during continuous events
  const placedLogosRef = useRef(placedLogos);
  placedLogosRef.current = placedLogos;
  const wheelTimeoutRef = useRef<number | null>(null);

  // Demo assets on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 9000);
    return () => clearTimeout(timer);
  }, []);

  // -- HISTORY ACTIONS --

  const addToHistory = useCallback((newState: PlacedLayer[]) => {
    setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(newState);
        return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);
  
  // Manually commit history (e.g., after slider change)
  const commitHistory = () => {
     addToHistory(placedLogosRef.current);
  };

  const undo = () => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setPlacedLogos(history[newIndex]);
          // If selected layer no longer exists, deselect
          if (selectedLayerId && !history[newIndex].find(l => l.uid === selectedLayerId)) {
              setSelectedLayerId(null);
          }
      }
  };

  const redo = () => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setPlacedLogos(history[newIndex]);
      }
  };
  
  // Keyboard Shortcuts for Undo/Redo & Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'studio') return;
      
      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      
      // Delete Selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
          // Check if not focusing on input
          if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
              removeLogoFromCanvas(selectedLayerId);
          }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, historyIndex, history, selectedLayerId]);


  // -- LAYER MANAGEMENT --

  const addLogoToCanvas = (assetId: string) => {
    // Add new instance of logo to canvas at center
    const newLayer: PlacedLayer = {
      uid: Math.random().toString(36).substr(2, 9),
      assetId,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      brightness: 1,
      contrast: 1,
      saturation: 1
    };
    const newLogos = [...placedLogos, newLayer];
    setPlacedLogos(newLogos);
    addToHistory(newLogos);
    setSelectedLayerId(newLayer.uid); // Select newly added
  };

  const removeLogoFromCanvas = (uid: string, e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    const newLogos = placedLogos.filter(l => l.uid !== uid);
    setPlacedLogos(newLogos);
    addToHistory(newLogos);
    if (selectedLayerId === uid) setSelectedLayerId(null);
  };
  
  const handleRenameAsset = (id: string, newName: string) => {
     setAssets(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
  };

  const updateSelectedLayer = (updates: Partial<PlacedLayer>) => {
      if (!selectedLayerId) return;
      setPlacedLogos(prev => prev.map(l => 
          l.uid === selectedLayerId ? { ...l, ...updates } : l
      ));
  };
  
  const resetSelectedLayer = () => {
      updateSelectedLayer({ 
        x: 50, y: 50, scale: 1, rotation: 0, opacity: 1, 
        brightness: 1, contrast: 1, saturation: 1 
      });
      commitHistory();
  };

  const changeZOrder = (direction: 'up' | 'down' | 'front' | 'back') => {
      if (!selectedLayerId) return;
      const index = placedLogos.findIndex(l => l.uid === selectedLayerId);
      if (index === -1) return;
      
      const newLogos = [...placedLogos];
      const item = newLogos.splice(index, 1)[0];
      
      if (direction === 'up') {
          // Move forward (higher index)
          const newIndex = Math.min(newLogos.length, index + 1);
          newLogos.splice(newIndex, 0, item);
      } else if (direction === 'down') {
           // Move backward (lower index)
          const newIndex = Math.max(0, index - 1);
          newLogos.splice(newIndex, 0, item);
      } else if (direction === 'front') {
          newLogos.push(item);
      } else if (direction === 'back') {
          newLogos.unshift(item);
      }
      
      setPlacedLogos(newLogos);
      addToHistory(newLogos);
  };

  // -- IN-STUDIO ASSET GENERATION --
  const handleStudioAssetGenerate = async () => {
    if (!genPrompt) return;
    if (!(await checkApiKey())) return;

    setIsGeneratingAsset(true);
    try {
      const b64 = await generateAsset(genPrompt, 'logo');
      const newAsset: Asset = {
        id: Math.random().toString(36).substring(7),
        type: 'logo',
        name: `Generated: ${genPrompt}`,
        data: b64,
        mimeType: 'image/png'
      };
      setAssets(prev => [...prev, newAsset]);
      // Automatically add to canvas
      addLogoToCanvas(newAsset.id);
      
      setGenPrompt('');
      setShowAssetGenModal(false);
    } catch (e: any) {
      console.error(e);
      handleApiError(e);
    } finally {
      setIsGeneratingAsset(false);
    }
  };
  
  // -- CANVAS INTERACTION --

  // Helper to get coordinates
  const getClientCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e) {
       return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const handleInteractionStart = (
      e: React.MouseEvent | React.TouchEvent, 
      layer: PlacedLayer, 
      mode: 'DRAG' | 'RESIZE' | 'ROTATE'
    ) => {
    e.preventDefault();
    e.stopPropagation();
    
    const { x, y } = getClientCoords(e);
    
    // Select the layer if not already
    if (selectedLayerId !== layer.uid) {
        setSelectedLayerId(layer.uid);
    }

    const startState = {
        mode,
        layerId: layer.uid,
        startX: x,
        startY: y,
        initialValues: { x: layer.x, y: layer.y, scale: layer.scale, rotation: layer.rotation }
    };

    // Additional math for Rotation & Resize
    if (mode === 'ROTATE' || mode === 'RESIZE') {
        const element = (e.target as HTMLElement).closest('.layer-container');
        if (element) {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // For Rotation: Initial Angle
            const initialAngle = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI;
            
            // For Resize: Initial Distance from center (or use corner, but center is simpler for uniform scaling)
            const initialDist = Math.hypot(x - centerX, y - centerY);

            setInteractionState({
                ...startState,
                centerX,
                centerY,
                initialAngle,
                initialDist
            });
            return;
        }
    }
    
    setInteractionState(startState);
  };

  const handleWheel = (e: React.WheelEvent, layerId: string) => {
     e.stopPropagation();
     // Simple scale on scroll
     const delta = e.deltaY > 0 ? -0.1 : 0.1;
     
     setPlacedLogos(prev => {
         const newLogos = prev.map(l => {
            if (l.uid !== layerId) return l;
            const newScale = Math.max(0.2, Math.min(3.0, l.scale + delta));
            return { ...l, scale: newScale };
         });
         return newLogos;
     });
     
     // Debounce history commit
     if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
     wheelTimeoutRef.current = window.setTimeout(() => {
        // Use ref to get the very latest state after render
        addToHistory(placedLogosRef.current);
     }, 500);
  };

  // Global mouse/touch move for dragging
  useEffect(() => {
    let hasMoved = false;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (interactionState.mode === 'IDLE' || !interactionState.layerId || !canvasRef.current) return;
      hasMoved = true;

      const { x, y } = getClientCoords(e);
      const rect = canvasRef.current.getBoundingClientRect();

      // --- DRAG ---
      if (interactionState.mode === 'DRAG') {
          const deltaX = (x - interactionState.startX) / canvasZoom; 
          const deltaY = (y - interactionState.startY) / canvasZoom;
          const displayedWidth = rect.width / canvasZoom;
          const displayedHeight = rect.height / canvasZoom;
          const deltaXPercent = (deltaX / displayedWidth) * 100;
          const deltaYPercent = (deltaY / displayedHeight) * 100;

          let newX = interactionState.initialValues.x + deltaXPercent;
          let newY = interactionState.initialValues.y + deltaYPercent;

          if (showGridRef.current) {
              const gridSize = 5; 
              newX = Math.round(newX / gridSize) * gridSize;
              newY = Math.round(newY / gridSize) * gridSize;
          }
          newX = Math.max(0, Math.min(100, newX));
          newY = Math.max(0, Math.min(100, newY));

          setPlacedLogos(prev => prev.map(l => l.uid === interactionState.layerId ? { ...l, x: newX, y: newY } : l));
      } 
      // --- ROTATE ---
      else if (interactionState.mode === 'ROTATE' && interactionState.centerX !== undefined && interactionState.initialAngle !== undefined) {
          const currentAngle = Math.atan2(y - interactionState.centerY!, x - interactionState.centerX!) * 180 / Math.PI;
          const deltaAngle = currentAngle - interactionState.initialAngle;
          const newRotation = (interactionState.initialValues.rotation + deltaAngle) % 360;
          
          setPlacedLogos(prev => prev.map(l => l.uid === interactionState.layerId ? { ...l, rotation: newRotation } : l));
      }
      // --- RESIZE ---
      else if (interactionState.mode === 'RESIZE' && interactionState.centerX !== undefined && interactionState.initialDist !== undefined) {
          const currentDist = Math.hypot(x - interactionState.centerX!, y - interactionState.centerY!);
          const scaleFactor = currentDist / interactionState.initialDist;
          const newScale = Math.max(0.1, Math.min(5.0, interactionState.initialValues.scale * scaleFactor));

          setPlacedLogos(prev => prev.map(l => l.uid === interactionState.layerId ? { ...l, scale: newScale } : l));
      }
    };

    const handleEnd = () => {
      if (interactionState.mode !== 'IDLE' && hasMoved) {
        addToHistory(placedLogosRef.current);
      }
      setInteractionState(prev => ({ ...prev, mode: 'IDLE', layerId: null }));
    };

    if (interactionState.mode !== 'IDLE') {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [interactionState, addToHistory, canvasZoom]);

  const handleZoom = (direction: 'in' | 'out') => {
      setCanvasZoom(prev => {
          if (direction === 'in') return Math.min(prev + 0.2, 3);
          return Math.max(prev - 0.2, 0.4);
      });
  };

  const handleGenerate = async () => {
    // We don't return early for empty selections here so we can give better user feedback
    if (!selectedProductId && placedLogos.length === 0) {
        // Although button is disabled, safety check
        return;
    }
    
    const product = assets.find(a => a.id === selectedProductId);
    if (!product) {
        alert("Selected product not found. Please select a product.");
        // Deselect the invalid ID so the UI updates
        setSelectedProductId(null);
        return;
    }

    // Prepare all layers
    const layers = placedLogos.map(layer => {
        const asset = assets.find(a => a.id === layer.assetId);
        return asset ? { asset, placement: layer } : null;
    }).filter(Boolean) as { asset: Asset, placement: PlacedLayer }[];

    if (layers.length === 0) {
         alert("No valid logos found on canvas. Please add a logo.");
         return;
    }

    // Check API Key before proceeding
    if (!(await checkApiKey())) {
      return;
    }

    const currentPrompt = prompt;

    setLoading({ isGenerating: true, message: 'Analyzing composite geometry...' });
    try {
      const resultImage = await generateMockup(product, layers, currentPrompt, selectedAngles);
      
      const newMockup: GeneratedMockup = {
        id: Math.random().toString(36).substring(7),
        imageUrl: resultImage,
        prompt: currentPrompt,
        createdAt: Date.now(),
        layers: placedLogos, // Save the layout
        productId: selectedProductId
      };
      
      setGeneratedMockups(prev => [newMockup, ...prev]);
      setView('gallery');
    } catch (e: any) {
      console.error(e);
      handleApiError(e);
    } finally {
      setLoading({ isGenerating: false, message: '' });
    }
  };

  if (showIntro) {
    return <IntroSequence onComplete={() => setShowIntro(false)} />;
  }

  // Find selected layer object for UI binding
  const selectedLayer = placedLogos.find(l => l.uid === selectedLayerId);

  return (
    <div className="min-h-screen text-zinc-900 font-sans flex overflow-hidden relative selection:bg-black selection:text-white">
      
      {/* API Key Dialog */}
      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-black/10">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold flex items-center gap-2"><Settings size={18}/> Settings</h3>
                 <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-black/5 rounded-full"><X size={20}/></button>
              </div>
              <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Custom API Key</label>
                  <p className="text-xs text-zinc-500 mb-2">Enter your Gemini API key to override the default system key. This is saved locally in your browser.</p>
                  <input 
                    type="password" 
                    value={userApiKey}
                    onChange={(e) => setUserApiKey(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black focus:outline-none"
                    placeholder="AIzaSy..."
                  />
              </div>
              <div className="flex gap-3 justify-end">
                 <Button variant="ghost" onClick={() => setShowSettings(false)}>Cancel</Button>
                 <Button onClick={handleSaveKey}>
                    Save Key
                 </Button>
              </div>
           </div>
        </div>
      )}
      
      {/* AI Logo Generation Modal */}
      {showAssetGenModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-black/10">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles size={18} className="text-purple-600"/> Generate Logo</h3>
                 <button onClick={() => setShowAssetGenModal(false)} className="p-1 hover:bg-black/5 rounded-full"><X size={20}/></button>
              </div>
              <p className="text-sm text-zinc-500 mb-4">Describe the logo you want to create. It will be automatically added to your canvas.</p>
              <textarea 
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="E.g. A minimalist geometric fox head, orange and black..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black focus:outline-none resize-none h-32 mb-4"
              />
              <div className="flex gap-3 justify-end">
                 <Button variant="ghost" onClick={() => setShowAssetGenModal(false)}>Cancel</Button>
                 <Button onClick={handleStudioAssetGenerate} isLoading={isGeneratingAsset} disabled={!genPrompt}>
                    Generate & Add
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* Sidebar Navigation (Desktop) */}
      <aside className="w-64 glass-panel border-r-0 hidden md:flex flex-col m-4 rounded-2xl">
        <div className="h-20 flex items-center px-6">
          <Package className="text-black mr-3" strokeWidth={2.5} />
          <span className="font-bold text-lg tracking-tight text-black">MerchMaster</span>
        </div>

        <div className="p-4 space-y-2 flex-1">
          <NavButton 
            icon={<Layout size={18} />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            onClick={() => setView('dashboard')} 
          />
          <NavButton 
            icon={<Box size={18} />} 
            label="Assets" 
            active={view === 'assets'} 
            number={1}
            onClick={() => setView('assets')} 
          />
          <NavButton 
            icon={<Wand2 size={18} />} 
            label="Studio" 
            active={view === 'studio'} 
            number={2}
            onClick={() => setView('studio')} 
          />
          <NavButton 
            icon={<ImageIcon size={18} />} 
            label="Gallery" 
            active={view === 'gallery'} 
            number={3}
            onClick={() => setView('gallery')} 
          />
        </div>

        <div className="p-4 border-t border-black/5">
          <div className="p-4 rounded-xl bg-black/5 border border-black/5 text-center">
             <Button size="sm" variant="outline" className="w-full text-xs bg-transparent border-black/20 hover:bg-black/5 hover:text-black text-zinc-600">Documentation</Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 glass-panel border-b-0 flex items-center justify-between px-4 z-50">
        <div className="flex items-center">
          <Package className="text-black mr-2" />
          <span className="font-bold text-lg text-black">MerchMaster</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-600 hover:text-black">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-white/95 backdrop-blur-xl p-4 animate-fade-in flex flex-col">
          <div className="space-y-2">
            <NavButton 
              icon={<Layout size={18} />} 
              label="Dashboard" 
              active={view === 'dashboard'} 
              onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }} 
            />
            <NavButton 
              icon={<Box size={18} />} 
              label="Assets" 
              active={view === 'assets'} 
              number={1}
              onClick={() => { setView('assets'); setIsMobileMenuOpen(false); }} 
            />
            <NavButton 
              icon={<Wand2 size={18} />} 
              label="Studio" 
              active={view === 'studio'} 
              number={2}
              onClick={() => { setView('studio'); setIsMobileMenuOpen(false); }} 
            />
            <NavButton 
              icon={<ImageIcon size={18} />} 
              label="Gallery" 
              active={view === 'gallery'} 
              number={3}
              onClick={() => { setView('gallery'); setIsMobileMenuOpen(false); }} 
            />
          </div>
          
          <div className="mt-auto pb-8 border-t border-zinc-200 pt-6">
              <p className="text-xs text-zinc-400 text-center mb-4">MerchMaster Mobile v1.0</p>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedMockup && (
        <div 
          className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" 
          onClick={() => setSelectedMockup(null)}
        >
          <div className="relative max-w-6xl w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button 
              onClick={() => setSelectedMockup(null)}
              className="absolute top-4 right-4 md:top-0 md:-right-12 p-3 bg-black/5 text-black rounded-full hover:bg-black/10 transition-colors z-50 border border-black/10 backdrop-blur-md"
            >
              <X size={24} />
            </button>

            {/* Image Container */}
            <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
              <img 
                src={selectedMockup.imageUrl} 
                alt="Full size preview" 
                className="max-w-full max-h-[85vh] object-contain" 
              />
            </div>

            {/* Caption / Actions */}
            <div className="mt-6 glass-panel px-8 py-4 rounded-full flex items-center gap-6 shadow-2xl bg-white">
               <p className="text-sm text-zinc-600 max-w-[200px] md:max-w-md truncate font-medium">
                 {selectedMockup.prompt || "Generated Mockup"}
               </p>
               <div className="h-6 w-px bg-black/10"></div>
               <a 
                 href={selectedMockup.imageUrl} 
                 download={`mockup-${selectedMockup.id}.png`}
                 className="text-black hover:text-zinc-600 text-sm font-bold flex items-center gap-2"
               >
                 <Download size={18} />
                 Download High-Res
               </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative pt-16 md:pt-0">
        {/* Top Bar (Desktop) */}
        <div className="sticky top-0 z-40 h-20 flex items-center justify-between px-8 md:px-12 pointer-events-none">
           <div className="pointer-events-auto glass-panel px-4 py-2 rounded-full mt-4 flex items-center gap-2 border-black/5 bg-white/50">
              <span className="text-xs font-mono text-zinc-400 opacity-50">APP</span> 
              <span className="text-xs text-zinc-400">/</span> 
              <span className="text-xs font-bold text-black capitalize tracking-wide">{view}</span>
           </div>
           <div className="pointer-events-auto glass-panel px-4 py-2 rounded-full mt-4 flex items-center gap-4 border-black/5 bg-white/50">
              <div className="flex items-center gap-2 text-xs font-medium text-black">
                <Sparkles size={14}/>
                <span>PRO</span>
              </div>
              <div className="w-px h-4 bg-black/10"></div>
              <button onClick={() => setShowSettings(true)} className="text-zinc-500 hover:text-black transition-colors" title="Settings / API Key">
                  <Settings size={16} />
              </button>
           </div>
        </div>

        <div className="max-w-7xl mx-auto p-6 md:p-12 md:pt-6">
           
           {/* --- DASHBOARD VIEW --- */}
           {view === 'dashboard' && (
              <div className="animate-fade-in space-y-12">
                 <div className="text-center py-16 relative">
                    {/* Background glow spot */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-zinc-100 blur-[100px] rounded-full pointer-events-none"></div>

                    <h1 className="relative text-5xl md:text-7xl font-black mb-8 text-black tracking-tight leading-tight">
                       Create Realistic <br/>
                       <span className="text-zinc-500">Merchandise Mockups</span>
                    </h1>
                    <p className="relative text-zinc-500 text-xl max-w-2xl mx-auto mb-12 font-light leading-relaxed">
                       Upload your logos and products, and let our AI composite them perfectly with realistic lighting, shadows, and warping.
                    </p>
                    <div className="relative">
                      <Button size="lg" onClick={() => setView('assets')} icon={<ArrowRight size={20} />} className="rounded-full px-8 py-4 text-lg">
                        Start Creating
                      </Button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                       { icon: <Box className="text-black" />, title: 'Asset Management', desc: 'Organize logos and product bases.' },
                       { icon: <Wand2 className="text-zinc-600" />, title: 'AI Compositing', desc: 'Smart blending and surface mapping.' },
                       { icon: <Download className="text-zinc-400" />, title: 'High-Res Export', desc: 'Production-ready visuals.' }
                    ].map((feat, i) => (
                       <div key={i} className="glass-panel p-8 rounded-3xl hover:bg-black/5 transition-colors group">
                          <div className="mb-6 p-4 bg-black/5 w-fit rounded-2xl group-hover:scale-110 transition-transform duration-300 border border-black/5">{feat.icon}</div>
                          <h3 className="text-xl font-bold mb-3 text-black">{feat.title}</h3>
                          <p className="text-zinc-500 leading-relaxed">{feat.desc}</p>
                       </div>
                    ))}
                 </div>
                 
                 <footer className="mt-20 pt-8 border-t border-black/5 text-center">
                    <p className="text-zinc-400 text-sm max-w-2xl mx-auto leading-relaxed">
                       "By using this app, you confirm that you have the necessary rights to any content that you upload. Do not generate content that infringes on others’ intellectual property or privacy rights. Your use of this generative AI service is subject to our Prohibited Use Policy.
                       <br className="hidden md:block" />
                       Please note that uploads from Google Workspace may be used to develop and improve Google products and services in accordance with our terms."
                    </p>
                 </footer>
              </div>
           )}

           {/* --- ASSETS VIEW --- */}
           {view === 'assets' && (
              <div className="animate-fade-in">
                <WorkflowStepper currentView="assets" onViewChange={setView} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Products Section */}
                  <AssetSection 
                    title="Products" 
                    icon={<Box size={20} />}
                    type="product"
                    assets={assets.filter(a => a.type === 'product')}
                    onAdd={(a) => setAssets(prev => [...prev, a])}
                    onRemove={(id) => setAssets(prev => prev.filter(a => a.id !== id))}
                    onRename={handleRenameAsset}
                    validateApiKey={checkApiKey}
                    onApiError={handleApiError}
                  />

                  {/* Logos Section */}
                  <AssetSection 
                    title="Logos & Graphics" 
                    icon={<Layers size={20} />}
                    type="logo"
                    assets={assets.filter(a => a.type === 'logo')}
                    onAdd={(a) => setAssets(prev => [...prev, a])}
                    onRemove={(id) => setAssets(prev => prev.filter(a => a.id !== id))}
                    onRename={handleRenameAsset}
                    validateApiKey={checkApiKey}
                    onApiError={handleApiError}
                  />
                </div>

                <div className="mt-8 flex justify-end">
                   <Button onClick={() => setView('studio')} disabled={assets.length < 2} icon={<ArrowRight size={16} />}>
                      Continue to Studio
                   </Button>
                </div>
              </div>
           )}

           {/* --- STUDIO VIEW --- */}
           {view === 'studio' && (
             <div className="animate-fade-in h-[calc(100vh-10rem)] md:h-[calc(100vh-14rem)] flex flex-col-reverse lg:flex-row gap-4 lg:gap-8">
                {/* Left Controls (Bottom on Mobile) */}
                <div className="w-full lg:w-80 flex flex-col gap-6 glass-panel p-6 rounded-3xl overflow-y-auto flex-1 lg:flex-none no-scrollbar">
                   {/* SECTION 1: Product Selection */}
                   <div>
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">1. Select Product</h3>
                      <div className="grid grid-cols-3 gap-3">
                         {assets.filter(a => a.type === 'product').map(a => (
                            <div 
                               key={a.id} 
                               onClick={() => setSelectedProductId(selectedProductId === a.id ? null : a.id)}
                               className={`aspect-square rounded-xl border-2 cursor-pointer p-2 transition-all duration-200 ${selectedProductId === a.id ? 'border-black bg-black/5' : 'border-black/5 hover:border-black/20 bg-white'}`}
                            >
                               <img src={a.data} className="w-full h-full object-contain" alt={a.name} />
                            </div>
                         ))}
                         {assets.filter(a => a.type === 'product').length === 0 && <p className="text-xs text-zinc-400 col-span-3 text-center py-4 bg-black/5 rounded-xl border border-dashed border-black/10">No products uploaded</p>}
                      </div>
                      
                      {/* Background Controls */}
                      <div className="mt-4">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Palette size={10} /> Canvas Background</label>
                          <div className="flex gap-2 items-center">
                              <input 
                                type="color" 
                                value={canvasBackground === 'transparent' ? '#ffffff' : canvasBackground} 
                                onChange={(e) => setCanvasBackground(e.target.value)}
                                className="w-8 h-8 rounded-full border-0 cursor-pointer overflow-hidden"
                              />
                              <button onClick={() => setCanvasBackground('transparent')} className={`w-8 h-8 rounded-full border border-black/10 flex items-center justify-center bg-white ${canvasBackground === 'transparent' ? 'ring-2 ring-black' : ''}`} title="Transparent">
                                <span className="w-full h-px bg-red-500 rotate-45"></span>
                              </button>
                              <button onClick={() => setCanvasBackground('linear-gradient(to right, #e2e2e2, #c9d6ff)')} className={`w-8 h-8 rounded-full border border-black/10 bg-gradient-to-r from-gray-200 to-blue-100 ${canvasBackground.includes('linear') ? 'ring-2 ring-black' : ''}`} title="Gradient 1"></button>
                          </div>
                      </div>
                   </div>

                   <div className="h-px bg-black/5 w-full"></div>

                   {/* SECTION 2: Add Logos */}
                   <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">2. Add Logos</h3>
                        <div className="flex gap-2">
                             <button onClick={() => setShowAssetGenModal(true)} className="text-[10px] font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles size={10} /> GENERATE</button>
                             {placedLogos.length > 0 && (
                                <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full">{placedLogos.length} ON CANVAS</span>
                             )}
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 mb-3">Click to add. Drag to move. Scroll to resize.</p>
                      <div className="grid grid-cols-3 gap-3">
                         {assets.filter(a => a.type === 'logo').map(a => (
                            <div 
                               key={a.id} 
                               onClick={() => addLogoToCanvas(a.id)}
                               className={`relative aspect-square rounded-xl border-2 cursor-pointer p-2 transition-all border-black/5 hover:border-black/20 bg-white hover:bg-black/5`}
                            >
                               <img src={a.data} className="w-full h-full object-contain" alt={a.name} />
                               {/* Count badge */}
                               {placedLogos.filter(l => l.assetId === a.id).length > 0 && (
                                   <div className="absolute -top-2 -right-2 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold border border-white shadow-lg">
                                       {placedLogos.filter(l => l.assetId === a.id).length}
                                   </div>
                               )}
                            </div>
                         ))}
                         {assets.filter(a => a.type === 'logo').length === 0 && <p className="text-xs text-zinc-400 col-span-3 text-center py-4 bg-black/5 rounded-xl border border-dashed border-black/10">No logos uploaded</p>}
                      </div>
                   </div>
                   
                   {/* CONDITIONAL SECTION: Edit Selected Layer */}
                   {selectedLayer && (
                       <div className="animate-slide-up">
                            <div className="h-px bg-black/5 w-full mb-6"></div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-black uppercase tracking-widest flex items-center gap-2">
                                    <Move size={12} /> Selected Layer
                                </h3>
                                <button onClick={() => setSelectedLayerId(null)} className="text-[10px] text-zinc-400 hover:text-black hover:underline">Deselect</button>
                            </div>
                            
                            <div className="space-y-4 p-4 bg-black/5 rounded-xl border border-black/5">
                                {/* Opacity Control */}
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Opacity</label>
                                        <span className="text-[10px] font-mono">{Math.round((selectedLayer.opacity ?? 1) * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" max="1" step="0.05" 
                                        value={selectedLayer.opacity ?? 1} 
                                        onChange={(e) => updateSelectedLayer({ opacity: parseFloat(e.target.value) })}
                                        onMouseUp={commitHistory}
                                        onTouchEnd={commitHistory}
                                        className="w-full h-1 bg-zinc-300 rounded-lg appearance-none cursor-pointer accent-black"
                                    />
                                </div>
                                
                                {/* Rotation Control */}
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Rotation</label>
                                        <span className="text-[10px] font-mono">{Math.round(selectedLayer.rotation)}°</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="range" 
                                            min="0" max="360" step="1" 
                                            value={selectedLayer.rotation} 
                                            onChange={(e) => updateSelectedLayer({ rotation: parseInt(e.target.value) })}
                                            onMouseUp={commitHistory}
                                            onTouchEnd={commitHistory}
                                            className="flex-1 h-1 bg-zinc-300 rounded-lg appearance-none cursor-pointer accent-black"
                                        />
                                        <button onClick={() => { updateSelectedLayer({ rotation: (selectedLayer.rotation + 90) % 360 }); commitHistory(); }} className="p-1 hover:bg-black/10 rounded">
                                            <RotateCw size={14} className="text-zinc-600"/>
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Image Adjustments */}
                                <div className="pt-2 border-t border-black/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Adjustments</label>
                                    </div>
                                    
                                    {/* Brightness */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sun size={12} className="text-zinc-400" />
                                        <input 
                                            type="range" 
                                            min="0" max="2" step="0.1" 
                                            value={selectedLayer.brightness ?? 1} 
                                            onChange={(e) => updateSelectedLayer({ brightness: parseFloat(e.target.value) })}
                                            onMouseUp={commitHistory}
                                            onTouchEnd={commitHistory}
                                            className="flex-1 h-1 bg-zinc-300 rounded-lg appearance-none cursor-pointer accent-black"
                                            title="Brightness"
                                        />
                                    </div>

                                    {/* Contrast */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <Contrast size={12} className="text-zinc-400" />
                                        <input 
                                            type="range" 
                                            min="0" max="2" step="0.1" 
                                            value={selectedLayer.contrast ?? 1} 
                                            onChange={(e) => updateSelectedLayer({ contrast: parseFloat(e.target.value) })}
                                            onMouseUp={commitHistory}
                                            onTouchEnd={commitHistory}
                                            className="flex-1 h-1 bg-zinc-300 rounded-lg appearance-none cursor-pointer accent-black"
                                            title="Contrast"
                                        />
                                    </div>

                                    {/* Saturation */}
                                    <div className="flex items-center gap-2">
                                        <Droplets size={12} className="text-zinc-400" />
                                        <input 
                                            type="range" 
                                            min="0" max="2" step="0.1" 
                                            value={selectedLayer.saturation ?? 1} 
                                            onChange={(e) => updateSelectedLayer({ saturation: parseFloat(e.target.value) })}
                                            onMouseUp={commitHistory}
                                            onTouchEnd={commitHistory}
                                            className="flex-1 h-1 bg-zinc-300 rounded-lg appearance-none cursor-pointer accent-black"
                                            title="Saturation"
                                        />
                                    </div>
                                </div>

                                {/* Z-Index & Actions */}
                                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-black/5">
                                    <button onClick={() => changeZOrder('front')} title="Bring to Front" className="flex flex-col items-center justify-center p-2 bg-white rounded border border-black/5 hover:border-black/20 hover:text-black text-zinc-500 transition-colors">
                                        <ChevronsUp size={16} />
                                    </button>
                                    <button onClick={() => changeZOrder('up')} title="Bring Forward" className="flex flex-col items-center justify-center p-2 bg-white rounded border border-black/5 hover:border-black/20 hover:text-black text-zinc-500 transition-colors">
                                        <ChevronUp size={16} />
                                    </button>
                                    <button onClick={() => changeZOrder('down')} title="Send Backward" className="flex flex-col items-center justify-center p-2 bg-white rounded border border-black/5 hover:border-black/20 hover:text-black text-zinc-500 transition-colors">
                                        <ChevronDown size={16} />
                                    </button>
                                    <button onClick={() => changeZOrder('back')} title="Send to Back" className="flex flex-col items-center justify-center p-2 bg-white rounded border border-black/5 hover:border-black/20 hover:text-black text-zinc-500 transition-colors">
                                        <ChevronsDown size={16} />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button onClick={resetSelectedLayer} className="flex items-center justify-center gap-2 p-2 bg-white rounded border border-black/5 hover:bg-zinc-50 text-xs font-medium text-zinc-700">
                                        <RotateCcw size={14} /> Reset
                                    </button>
                                    <button onClick={() => removeLogoFromCanvas(selectedLayer.uid)} className="flex items-center justify-center gap-2 p-2 bg-red-50 rounded border border-red-100 hover:bg-red-100 text-xs font-medium text-red-600">
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            </div>
                       </div>
                   )}

                   <div className="h-px bg-black/5 w-full"></div>

                   {/* SECTION 3: Instructions & Camera */}
                   <div>
                      <CameraAngleSelector 
                        selectedAngles={selectedAngles} 
                        onChange={setSelectedAngles} 
                      />
                      
                      <div className="h-px bg-black/5 w-full my-4"></div>

                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">4. Instructions</h3>
                      
                      {/* Prompt Templates */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold uppercase tracking-wider mr-1">
                          <MessageSquarePlus size={12} /> Templates:
                        </div>
                        {PROMPT_TEMPLATES.map((t) => (
                           <button
                             key={t.label}
                             onClick={() => setPrompt(t.prompt)}
                             className="px-2 py-1 text-[10px] font-medium bg-zinc-50 border border-zinc-200 rounded hover:bg-black hover:text-white hover:border-black transition-colors"
                             title={t.prompt}
                           >
                             {t.label}
                           </button>
                        ))}
                      </div>

                      <textarea 
                         className="w-full bg-white border border-black/10 rounded-xl p-4 text-sm text-black focus:ring-2 focus:ring-black focus:outline-none resize-none h-24 placeholder:text-zinc-400 transition-colors"
                         placeholder="E.g. Embed the logos into the fabric texture naturally..."
                         value={prompt}
                         onChange={(e) => setPrompt(e.target.value)}
                      />
                   </div>

                   <Button 
                      onClick={handleGenerate} 
                      isLoading={loading.isGenerating} 
                      disabled={!selectedProductId || placedLogos.length === 0} 
                      size="lg" 
                      className="mt-auto w-full"
                      icon={<Wand2 size={18} />}
                   >
                      Generate Mockup
                   </Button>
                </div>

                {/* Right Preview - Canvas (Top on Mobile) */}
                <div 
                   className="h-[45vh] lg:h-auto lg:flex-1 glass-panel rounded-3xl flex items-center justify-center relative overflow-hidden select-none flex-shrink-0" 
                   onClick={() => setSelectedLayerId(null)}
                   style={{ background: canvasBackground === 'transparent' ? '' : canvasBackground, backgroundColor: canvasBackground === 'transparent' ? '#f4f4f5' : '' }}
                >
                   {/* Grid Overlay */}
                   {showGrid && (
                      <div className="absolute inset-0 pointer-events-none opacity-20"
                           style={{
                               backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                               backgroundSize: `${5 * canvasZoom}% ${5 * canvasZoom}%`,
                               width: '200%', height: '200%', top: '-50%', left: '-50%' // Oversize for movement context if needed, but here simple fixed overlay
                           }}
                      ></div>
                   )}

                   {/* Canvas Toolbar (History + Zoom + Grid) */}
                   <div className="absolute top-4 right-4 z-30 flex gap-2" onClick={e => e.stopPropagation()}>
                      <div className="glass-panel p-1 rounded-lg flex border-black/10 bg-white/80 backdrop-blur-md">
                        <button 
                            onClick={() => setShowGrid(!showGrid)} 
                            className={`p-1.5 rounded disabled:opacity-30 transition-colors ${showGrid ? 'bg-black text-white' : 'hover:bg-black/5 text-black'}`}
                            title="Toggle Grid Snap"
                        >
                            <Grid3x3 size={16} />
                        </button>
                      </div>

                      <div className="glass-panel p-1 rounded-lg flex border-black/10 bg-white/80 backdrop-blur-md">
                        <button 
                            onClick={() => handleZoom('out')} 
                            className="p-1.5 hover:bg-black/5 rounded text-black disabled:opacity-30"
                            title="Zoom Out"
                        >
                            <ZoomOut size={16} />
                        </button>
                        <span className="flex items-center justify-center px-2 text-xs font-mono w-12">{Math.round(canvasZoom * 100)}%</span>
                        <button 
                            onClick={() => handleZoom('in')} 
                            className="p-1.5 hover:bg-black/5 rounded text-black disabled:opacity-30"
                            title="Zoom In"
                        >
                            <ZoomIn size={16} />
                        </button>
                      </div>

                      <div className="glass-panel p-1 rounded-lg flex border-black/10 bg-white/80 backdrop-blur-md">
                          <button 
                            onClick={undo} 
                            disabled={historyIndex === 0} 
                            className="p-1.5 hover:bg-black/5 rounded text-black disabled:opacity-30 transition-all"
                            title="Undo (Ctrl+Z)"
                          >
                            <Undo2 size={16} />
                          </button>
                          <div className="w-px bg-black/10 my-1 mx-0.5"></div>
                          <button 
                            onClick={redo} 
                            disabled={historyIndex === history.length - 1} 
                            className="p-1.5 hover:bg-black/5 rounded text-black disabled:opacity-30 transition-all"
                            title="Redo (Ctrl+Y)"
                          >
                            <Redo2 size={16} />
                          </button>
                      </div>
                   </div>

                   {loading.isGenerating && (
                      <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
                         <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(0,0,0,0.1)]"></div>
                         <p className="text-black font-mono animate-pulse tracking-wide">{loading.message}</p>
                      </div>
                   )}
                   
                   {selectedProductId ? (
                      <div 
                         ref={canvasRef}
                         className="relative w-full h-full max-h-[600px] p-8 transition-transform duration-200 ease-out origin-center layer-container"
                         style={{ transform: `scale(${canvasZoom})` }}
                      >
                         {/* Product Base */}
                         <img 
                            src={assets.find(a => a.id === selectedProductId)?.data} 
                            className="w-full h-full object-contain drop-shadow-2xl pointer-events-none select-none" 
                            alt="Preview" 
                            draggable={false}
                         />

                         {/* Overlay Layers */}
                         {placedLogos.map((layer) => {
                            const logoAsset = assets.find(a => a.id === layer.assetId);
                            if (!logoAsset) return null;
                            const isSelected = selectedLayerId === layer.uid;

                            return (
                               <div
                                  key={layer.uid}
                                  className={`absolute cursor-move group layer-item`}
                                  style={{
                                     left: `${layer.x}%`,
                                     top: `${layer.y}%`,
                                     transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                                     opacity: layer.opacity ?? 1,
                                     width: '15%',
                                     aspectRatio: '1/1',
                                     zIndex: interactionState.layerId === layer.uid ? 100 : undefined
                                  }}
                                  onMouseDown={(e) => handleInteractionStart(e, layer, 'DRAG')}
                                  onTouchStart={(e) => handleInteractionStart(e, layer, 'DRAG')}
                                  onWheel={(e) => handleWheel(e, layer.uid)}
                               >
                                  {/* Selection Border */}
                                  <div className={`absolute -inset-2 border-2 transition-all pointer-events-none rounded-sm
                                     ${isSelected ? 'border-black opacity-100' : 'border-black/0 group-hover:border-black/30 opacity-100'}
                                  `}></div>
                                  
                                  {/* Interaction Handles (Only when Selected) */}
                                  {isSelected && (
                                    <>
                                        {/* Resize Handles (Corners) */}
                                        <div className="absolute -top-2 -left-2 w-4 h-4 bg-white border border-black rounded-full cursor-nw-resize pointer-events-auto shadow-sm z-20" onMouseDown={(e) => handleInteractionStart(e, layer, 'RESIZE')} onTouchStart={(e) => handleInteractionStart(e, layer, 'RESIZE')}></div>
                                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-white border border-black rounded-full cursor-ne-resize pointer-events-auto shadow-sm z-20" onMouseDown={(e) => handleInteractionStart(e, layer, 'RESIZE')} onTouchStart={(e) => handleInteractionStart(e, layer, 'RESIZE')}></div>
                                        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border border-black rounded-full cursor-sw-resize pointer-events-auto shadow-sm z-20" onMouseDown={(e) => handleInteractionStart(e, layer, 'RESIZE')} onTouchStart={(e) => handleInteractionStart(e, layer, 'RESIZE')}></div>
                                        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border border-black rounded-full cursor-se-resize pointer-events-auto shadow-sm z-20" onMouseDown={(e) => handleInteractionStart(e, layer, 'RESIZE')} onTouchStart={(e) => handleInteractionStart(e, layer, 'RESIZE')}></div>
                                        
                                        {/* Rotation Handle (Top Center) */}
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-20" onMouseDown={(e) => handleInteractionStart(e, layer, 'ROTATE')} onTouchStart={(e) => handleInteractionStart(e, layer, 'ROTATE')}>
                                            <div className="w-6 h-6 bg-white border border-black rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 transition-transform">
                                                <RotateCw size={12} className="text-black" />
                                            </div>
                                            <div className="w-px h-2 bg-black"></div>
                                        </div>
                                    </>
                                  )}

                                  {/* Remove Button (Only visible on hover, or top right) */}
                                  <button 
                                    onClick={(e) => removeLogoFromCanvas(layer.uid, e)}
                                    onTouchEnd={(e) => removeLogoFromCanvas(layer.uid, e)}
                                    className={`absolute -top-4 -right-8 bg-red-500 text-white rounded-full p-1.5 transition-all hover:scale-110 shadow-lg z-50 backdrop-blur-md pointer-events-auto
                                       ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}
                                    `}
                                    title="Remove"
                                  >
                                    <X size={12} />
                                  </button>

                                  <img 
                                     src={logoAsset.data} 
                                     className="w-full h-full object-contain drop-shadow-lg pointer-events-none select-none"
                                     draggable={false}
                                     alt="layer"
                                     style={{
                                       filter: `brightness(${layer.brightness ?? 1}) contrast(${layer.contrast ?? 1}) saturate(${layer.saturation ?? 1})`
                                     }}
                                  />
                               </div>
                            );
                         })}
                      </div>
                   ) : (
                      <div className="text-center text-zinc-400">
                         <div className="w-24 h-24 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-6 border border-black/5">
                            <Shirt size={40} className="opacity-40 text-black" />
                         </div>
                         <p className="text-lg font-medium text-black">Select a product to start designing</p>
                      </div>
                   )}
                </div>
             </div>
           )}

           {/* --- GALLERY VIEW --- */}
           {view === 'gallery' && (
              <div className="animate-fade-in">
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-black tracking-tight">Generated Mockups</h2>
                    <Button variant="outline" onClick={() => setView('studio')} icon={<Plus size={16}/>}>New Mockup</Button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {generatedMockups.map(mockup => (
                       <div key={mockup.id} className="group glass-panel rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-500 border-black/5 bg-white">
                          <div className="aspect-square bg-zinc-50 relative overflow-hidden">
                             <img src={mockup.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Mockup" />
                             <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                <Button 
                                  size="sm" 
                                  variant="secondary" 
                                  icon={<Maximize size={16}/>}
                                  onClick={() => setSelectedMockup(mockup)}
                                  className="backdrop-blur-md bg-white/80 hover:bg-white border-black/10 text-black shadow-sm"
                                >
                                  View
                                </Button>
                                <a href={mockup.imageUrl} download={`mockup-${mockup.id}.png`}>
                                  <Button size="sm" variant="primary" icon={<Download size={16}/>}>Save</Button>
                                </a>
                             </div>
                          </div>
                          <div className="p-5">
                             <div className="flex justify-between items-start mb-2">
                                <p className="text-xs font-mono text-zinc-400">{new Date(mockup.createdAt).toLocaleDateString()}</p>
                                {mockup.layers && mockup.layers.length > 0 && (
                                     <span className="text-[10px] font-bold px-2 py-1 bg-black/5 rounded-full text-zinc-500 border border-black/5">{mockup.layers.length} LOGOS</span>
                                 )}
                             </div>
                             <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed">{mockup.prompt || "Auto-generated mockup"}</p>
                          </div>
                       </div>
                    ))}
                    {generatedMockups.length === 0 && (
                       <div className="col-span-full py-32 text-center glass-panel rounded-3xl border-dashed border-black/10 bg-white/50">
                          <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ImageIcon size={32} className="text-zinc-400" />
                          </div>
                          <h3 className="text-xl font-medium text-black mb-2">No mockups yet</h3>
                          <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Create your first photorealistic design in the Studio using our AI tools.</p>
                          <Button onClick={() => setView('studio')} size="lg">Go to Studio</Button>
                       </div>
                    )}
                 </div>
              </div>
           )}
        </div>
      </main>
    </div>
  );
}