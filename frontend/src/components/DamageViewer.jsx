import React, { useState } from 'react';
import { Eye, Layers, Maximize2, SplitSquareVertical, Sparkles, AlertCircle, DollarSign, CheckCircle } from 'lucide-react';

const severityBadgeStyles = {
  Minor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  Moderate: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  Severe: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function DamageViewer({ images = [], detections = [] }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay', 'original', 'split'
  const [activeDetectionId, setActiveDetectionId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-500" />
        <p>No inspection images available for this claim.</p>
      </div>
    );
  }

  const currentImage = images[selectedImageIndex] || images[0];
  const origSrc = currentImage.image_path || currentImage.original;
  const overlaySrc = currentImage.overlay_image_path || currentImage.overlay || origSrc;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-600/20 text-primary-400 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Computer Vision Damage Viewer</h3>
            <p className="text-xs text-slate-400">
              YOLOv8-seg neural net segmentations & damage bounding boxes
            </p>
          </div>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('overlay')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'overlay'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> AI Overlay
          </button>
          <button
            type="button"
            onClick={() => setViewMode('original')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'original'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Original Photo
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'split'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" /> Side-by-Side
          </button>
        </div>
      </div>

      {/* Main Image Display Viewport */}
      <div className="relative bg-slate-950 p-4 flex items-center justify-center min-h-[360px] max-h-[540px] overflow-hidden">
        {viewMode === 'split' ? (
          <div className="grid grid-cols-2 gap-3 w-full h-full">
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-slate-950/80 backdrop-blur-sm text-slate-300 text-[11px] font-medium rounded border border-slate-700">
                Original Image
              </span>
              <img
                src={origSrc}
                alt="Original"
                className="w-full h-80 object-contain rounded-lg"
              />
            </div>
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-primary-950/80 backdrop-blur-sm text-primary-300 text-[11px] font-medium rounded border border-primary-700/50 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary-400" /> AI Detection Overlay
              </span>
              <img
                src={overlaySrc}
                alt="AI Overlay"
                className="w-full h-80 object-contain rounded-lg"
              />
            </div>
          </div>
        ) : (
          <div className="relative max-w-full max-h-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900/50">
            <img
              src={viewMode === 'overlay' ? overlaySrc : origSrc}
              alt="Vehicle Inspection"
              className="max-h-[460px] w-auto object-contain rounded-xl mx-auto shadow-2xl"
            />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-950/80 backdrop-blur-md text-white text-xs font-medium rounded-lg border border-slate-700/60 shadow-lg">
                {viewMode === 'overlay' ? 'AI Damage Mask & BBoxes' : 'Original Inspection Photo'}
              </span>
              <span className="px-2 py-1 bg-primary-600/80 text-white text-[11px] font-mono rounded-lg">
                Photo {selectedImageIndex + 1} of {images.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Multiple Images Thumbnail Strip */}
      {images.length > 1 && (
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedImageIndex(idx)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all shrink-0 w-20 h-14 ${
                selectedImageIndex === idx
                  ? 'border-primary-500 ring-2 ring-primary-500/30'
                  : 'border-slate-800 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img.overlay_image_path || img.image_path || img.original}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Detected Damages Breakdown List */}
      <div className="p-4 bg-slate-900/60 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>Detected Damages ({detections.length})</span>
            <span className="text-[10px] lowercase text-slate-400 font-normal">
              (click item to inspect)
            </span>
          </h4>
        </div>

        {detections.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No localized damage detected in this frame.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {detections.map((det, i) => {
              const isSelected = activeDetectionId === det.id || activeDetectionId === i;
              const sev = det.severity || 'Minor';
              const badgeStyle = severityBadgeStyles[sev] || severityBadgeStyles.Minor;

              return (
                <div
                  key={det.id || i}
                  onClick={() => setActiveDetectionId(isSelected ? null : det.id || i)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-950/40 border-primary-500 shadow-md ring-1 ring-primary-500/40'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{det.part}</p>
                      <p className="text-xs text-slate-400">{det.damage_type}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                      {sev}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Conf: <strong className="text-slate-200">{Math.round((det.confidence || 0.9) * 100)}%</strong>
                    </span>
                    {(det.cost_min || det.cost_max) && (
                      <span className="text-emerald-400 font-mono font-medium">
                        ${det.cost_min?.toLocaleString()} - ${det.cost_max?.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
