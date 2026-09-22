import React, { useState } from 'react';
import { Eye, Layers, SplitSquareVertical, Sparkles, AlertCircle } from 'lucide-react';

const severityBadgeStyles = {
  Minor:    'bg-green-50 text-green-700 border-green-200',
  Moderate: 'bg-amber-50 text-amber-700 border-amber-200',
  Severe:   'bg-red-50 text-red-700 border-red-200',
};

export default function DamageViewer({ images = [], detections = [] }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState('overlay'); // 'overlay', 'original', 'split'
  const [activeDetectionId, setActiveDetectionId] = useState(null);

  if (!images || images.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center text-[#6B7280]">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-[#9CA3AF]" />
        <p className="text-sm">No inspection images available for this claim.</p>
      </div>
    );
  }

  const currentImage = images[selectedImageIndex] || images[0];
  const origSrc    = currentImage.image_path || currentImage.original;
  const overlaySrc = currentImage.overlay_image_path || currentImage.overlay || origSrc;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm">
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-[#F7FAFD] border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#EAF4FF] text-[#1268E8] rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#06244F]">AI Computer Vision Damage Viewer</h3>
            <p className="text-xs text-[#6B7280]">YOLOv8-seg neural net segmentations & damage bounding boxes</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-white p-1 rounded-lg border border-[#E5E7EB] text-xs gap-0.5">
          {[
            { id: 'overlay',  label: 'AI Overlay',   Icon: Layers },
            { id: 'original', label: 'Original',     Icon: Eye },
            { id: 'split',    label: 'Side-by-Side', Icon: SplitSquareVertical },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewMode(id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                viewMode === id
                  ? 'bg-[#1268E8] text-white shadow-sm'
                  : 'text-[#6B7280] hover:text-[#06244F] hover:bg-[#F7FAFD]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="relative bg-[#F7FAFD] p-4 flex items-center justify-center min-h-[360px] max-h-[540px] overflow-hidden">
        {viewMode === 'split' ? (
          <div className="grid grid-cols-2 gap-3 w-full h-full">
            <div className="relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-white">
              <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-white/90 text-[#6B7280] text-[11px] font-medium rounded border border-[#E5E7EB] shadow-sm">
                Original Image
              </span>
              <img src={origSrc} alt="Original" className="w-full h-80 object-contain rounded-lg" />
            </div>
            <div className="relative rounded-xl overflow-hidden border border-[#EAF4FF] bg-white">
              <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-[#EAF4FF]/90 text-[#1268E8] text-[11px] font-medium rounded border border-[#1268E8]/20 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> AI Detection Overlay
              </span>
              <img src={overlaySrc} alt="AI Overlay" className="w-full h-80 object-contain rounded-lg" />
            </div>
          </div>
        ) : (
          <div className="relative max-w-full max-h-full rounded-xl overflow-hidden border border-[#E5E7EB] bg-white shadow-sm">
            <img
              src={viewMode === 'overlay' ? overlaySrc : origSrc}
              alt="Vehicle Inspection"
              className="max-h-[460px] w-auto object-contain rounded-xl mx-auto"
            />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-white/90 text-[#06244F] text-xs font-medium rounded-lg border border-[#E5E7EB] shadow-sm">
                {viewMode === 'overlay' ? 'AI Damage Mask & BBoxes' : 'Original Inspection Photo'}
              </span>
              <span className="px-2 py-1 bg-[#1268E8] text-white text-[11px] font-mono rounded-lg shadow-sm">
                Photo {selectedImageIndex + 1} of {images.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="p-3 bg-[#F7FAFD] border-t border-[#E5E7EB] flex items-center gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedImageIndex(idx)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all shrink-0 w-20 h-14 ${
                selectedImageIndex === idx
                  ? 'border-[#1268E8] ring-2 ring-[#1268E8]/20'
                  : 'border-[#E5E7EB] opacity-60 hover:opacity-100'
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

      {/* Detected Damages Breakdown */}
      <div className="p-4 bg-white border-t border-[#E5E7EB]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-[#06244F] uppercase tracking-wider flex items-center gap-2">
            <span>Detected Damages ({detections.length})</span>
            <span className="text-[10px] lowercase text-[#9CA3AF] font-normal">(click item to inspect)</span>
          </h4>
        </div>

        {detections.length === 0 ? (
          <p className="text-xs text-[#9CA3AF] italic">No localized damage detected in this frame.</p>
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
                      ? 'bg-[#EAF4FF] border-[#1268E8] shadow-sm ring-1 ring-[#1268E8]/20'
                      : 'bg-[#F7FAFD] hover:bg-[#EAF4FF]/50 border-[#E5E7EB]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#06244F]">{det.part}</p>
                      <p className="text-xs text-[#6B7280]">{det.damage_type}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                      {sev}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                    <span className="text-[#6B7280]">
                      Conf: <strong className="text-[#1F2937]">{Math.round((det.confidence || 0.9) * 100)}%</strong>
                    </span>
                    {(det.cost_min || det.cost_max) && (
                      <span className="text-green-700 font-mono font-medium">
                        ₹{det.cost_min?.toLocaleString('en-IN')} – ₹{det.cost_max?.toLocaleString('en-IN')}
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
