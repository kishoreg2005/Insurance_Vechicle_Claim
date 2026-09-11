import React, { useState } from 'react';
import { Car, Check, Info } from 'lucide-react';

const CAR_PARTS = [
  { id: 'Front Bumper', label: 'Front Bumper', category: 'Front', path: 'M 75,25 Q 125,12 175,25 L 170,42 Q 125,32 80,42 Z' },
  { id: 'Headlight', label: 'Headlight / Front Lights', category: 'Front', path: 'M 60,32 Q 72,25 78,35 L 75,44 Q 65,42 60,32 Z M 172,35 Q 178,25 190,32 Q 185,42 175,44 Z' },
  { id: 'Hood', label: 'Hood / Bonnet', category: 'Front', path: 'M 76,46 Q 125,36 174,46 L 168,102 Q 125,98 82,102 Z' },
  { id: 'Windshield', label: 'Front Windshield', category: 'Cabin', path: 'M 82,105 Q 125,101 168,105 L 160,140 Q 125,136 90,140 Z' },
  { id: 'Side Mirror', label: 'Side Mirrors', category: 'Cabin', path: 'M 48,110 Q 56,110 58,122 L 50,126 Z M 202,110 Q 194,110 192,122 L 200,126 Z' },
  { id: 'Roof', label: 'Roof Panel', category: 'Cabin', path: 'M 88,143 Q 125,140 162,143 L 158,225 Q 125,223 92,225 Z' },
  { id: 'Front Left Door', label: 'Front Left Door', category: 'Sides', path: 'M 58,108 L 86,108 L 88,168 L 60,168 Z' },
  { id: 'Front Right Door', label: 'Front Right Door', category: 'Sides', path: 'M 164,108 L 192,108 L 190,168 L 162,168 Z' },
  { id: 'Rear Left Door', label: 'Rear Left Door', category: 'Sides', path: 'M 60,172 L 88,172 L 90,230 L 62,230 Z' },
  { id: 'Rear Right Door', label: 'Rear Right Door', category: 'Sides', path: 'M 162,172 L 190,172 L 188,230 L 160,230 Z' },
  { id: 'Trunk', label: 'Trunk / Rear Hatch', category: 'Rear', path: 'M 90,230 Q 125,228 160,230 L 166,270 Q 125,274 84,270 Z' },
  { id: 'Taillight', label: 'Taillights', category: 'Rear', path: 'M 64,272 Q 74,274 82,272 L 80,282 Q 70,283 62,280 Z M 168,272 Q 176,274 186,272 L 188,280 Q 180,283 170,282 Z' },
  { id: 'Rear Bumper', label: 'Rear Bumper', category: 'Rear', path: 'M 78,276 Q 125,280 172,276 L 176,295 Q 125,302 74,295 Z' },
];

export default function InteractiveCarSelector({ selectedPart, onSelectPart }) {
  const [hoveredPart, setHoveredPart] = useState(null);

  const activePartObj = CAR_PARTS.find((p) => p.id === selectedPart);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-600/20 text-primary-400 rounded-lg">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Interactive Vehicle Part Selector</h3>
            <p className="text-xs text-slate-400">Click a part on the vehicle schematic or select below</p>
          </div>
        </div>
        {selectedPart && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-500/20 border border-primary-500/30 text-primary-300 rounded-full text-xs font-medium">
            <Check className="w-3.5 h-3.5" /> Selected: {selectedPart}
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-center">
        {/* SVG Top-Down Schematic */}
        <div className="md:col-span-6 flex flex-col items-center justify-center p-3 bg-slate-950/70 border border-slate-800/60 rounded-xl relative">
          <div className="absolute top-3 left-3 text-[10px] uppercase font-mono tracking-widest text-slate-500">
            FRONT
          </div>
          <div className="absolute bottom-3 left-3 text-[10px] uppercase font-mono tracking-widest text-slate-500">
            REAR
          </div>

          <svg viewBox="40 10 170 300" className="w-52 h-72 drop-shadow-md select-none">
            {/* Vehicle Base Chassis Silhouette */}
            <path
              d="M 75,25 Q 125,8 175,25 Q 200,35 200,100 L 202,230 Q 195,295 125,300 Q 55,295 48,230 L 50,100 Q 50,35 75,25 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="2"
            />

            {/* Render Each Clickable Part */}
            {CAR_PARTS.map((part) => {
              const isSelected = selectedPart === part.id;
              const isHovered = hoveredPart === part.id;

              let fillColor = '#334155';
              let strokeColor = '#475569';

              if (isSelected) {
                fillColor = '#2563eb';
                strokeColor = '#60a5fa';
              } else if (isHovered) {
                fillColor = '#3b82f6';
                strokeColor = '#93c5fd';
              }

              return (
                <path
                  key={part.id}
                  d={part.path}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? '2' : '1'}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    filter: isSelected ? 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.7))' : undefined,
                  }}
                  onMouseEnter={() => setHoveredPart(part.id)}
                  onMouseLeave={() => setHoveredPart(null)}
                  onClick={() => onSelectPart(part.id)}
                />
              );
            })}
          </svg>

          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-primary-400" />
            Hovering: <span className="text-white font-medium">{hoveredPart || selectedPart || 'None'}</span>
          </p>
        </div>

        {/* Quick Selection Buttons by Category */}
        <div className="md:col-span-6 space-y-3">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Quick Part Selection:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CAR_PARTS.map((part) => {
              const isSelected = selectedPart === part.id;
              return (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => onSelectPart(part.id)}
                  onMouseEnter={() => setHoveredPart(part.id)}
                  onMouseLeave={() => setHoveredPart(null)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-400 shadow-md shadow-primary-600/30'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                  {part.label}
                </button>
              );
            })}
          </div>

          {activePartObj && (
            <div className="mt-4 p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1">
              <span className="text-primary-400 font-semibold uppercase tracking-wider text-[10px]">
                Selected Area
              </span>
              <p className="text-white font-medium text-sm">{activePartObj.label}</p>
              <p className="text-slate-400">
                Ready for AI damage scanning. Upload clear photos of this area for optimal detection accuracy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
