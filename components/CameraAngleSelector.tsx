/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Box, Axis3d } from 'lucide-react';

interface CameraAngleSelectorProps {
  selectedAngles: string[];
  onChange: (angles: string[]) => void;
}

export const CameraAngleSelector: React.FC<CameraAngleSelectorProps> = ({
  selectedAngles,
  onChange,
}) => {
  const toggleAngle = (angle: string) => {
    if (selectedAngles.includes(angle)) {
      onChange(selectedAngles.filter((a) => a !== angle));
    } else {
      onChange([...selectedAngles, angle]);
    }
  };

  const isSelected = (angle: string) => selectedAngles.includes(angle);

  // Helper for circular button styles
  const btnClass = (angle: string, colorClass: string) => `
    absolute w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-200 shadow-sm z-10
    ${isSelected(angle) 
      ? 'bg-black text-white border-black scale-110 shadow-md' 
      : `bg-white text-zinc-600 hover:scale-105 hover:border-black ${colorClass}`}
  `;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <Axis3d size={12} /> Camera Angles
        </label>
        <span className="text-[10px] text-zinc-400">{selectedAngles.length} selected</span>
      </div>

      <div className="flex gap-4">
        {/* Visual Gizmo */}
        <div className="relative w-32 h-32 bg-zinc-50 rounded-full border border-zinc-100 flex-shrink-0 mx-auto">
          {/* Connecting Lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-px bg-zinc-200 absolute rotate-0"></div>
            <div className="w-full h-px bg-zinc-200 absolute rotate-90"></div>
          </div>

          {/* Center - Front */}
          <button
            onClick={() => toggleAngle('Front')}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-200 z-20
              ${isSelected('Front') ? 'bg-black text-white border-black' : 'bg-white text-zinc-900 border-zinc-300 hover:border-zinc-400'}`}
          >
            F
          </button>

          {/* Top (Y+) */}
          <button
            onClick={() => toggleAngle('Top')}
            className={btnClass('Top', 'border-blue-200 hover:border-blue-400')}
            style={{ top: '-4px', left: '50%', transform: 'translateX(-50%)' }}
            title="Top View"
          >
            T
          </button>

          {/* Bottom (Y-) */}
          <button
            onClick={() => toggleAngle('Bottom')}
            className={btnClass('Bottom', 'border-blue-200 hover:border-blue-400')}
            style={{ bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }}
            title="Bottom View"
          >
            B
          </button>

          {/* Left (X-) */}
          <button
            onClick={() => toggleAngle('Left')}
            className={btnClass('Left', 'border-red-200 hover:border-red-400')}
            style={{ left: '-4px', top: '50%', transform: 'translateY(-50%)' }}
            title="Left View"
          >
            L
          </button>

          {/* Right (X+) */}
          <button
            onClick={() => toggleAngle('Right')}
            className={btnClass('Right', 'border-red-200 hover:border-red-400')}
            style={{ right: '-4px', top: '50%', transform: 'translateY(-50%)' }}
            title="Right View"
          >
            R
          </button>
        </div>

        {/* List / Presets */}
        <div className="flex flex-col gap-2 justify-center flex-1">
          <button
            onClick={() => toggleAngle('Isometric')}
            className={`px-3 py-2 rounded-lg text-xs font-medium border text-left flex items-center gap-2 transition-all
              ${isSelected('Isometric') ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black/30'}`}
          >
            <Box size={14} /> 3/4 Isometric
          </button>
          <button
            onClick={() => toggleAngle('Back')}
            className={`px-3 py-2 rounded-lg text-xs font-medium border text-left flex items-center gap-2 transition-all
              ${isSelected('Back') ? 'bg-black text-white border-black' : 'bg-white text-zinc-600 border-zinc-200 hover:border-black/30'}`}
          >
            <div className="w-3.5 h-3.5 border border-current rounded-sm"></div> Back View
          </button>
        </div>
      </div>
      
      {/* Selection Summary */}
      <div className="flex flex-wrap gap-1 min-h-[1.5rem]">
        {selectedAngles.length === 0 && <span className="text-[10px] text-zinc-400 italic">Default: Front view</span>}
        {selectedAngles.map(angle => (
          <span key={angle} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] rounded border border-zinc-200">
            {angle}
          </span>
        ))}
      </div>
    </div>
  );
};