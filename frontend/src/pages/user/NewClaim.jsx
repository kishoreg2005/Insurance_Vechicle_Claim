import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  History,
  Upload,
  X,
  Loader2,
  Sparkles,
  Car,
  AlertTriangle,
  FileCheck2,
  Cpu,
  Calculator,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import InteractiveCarSelector from '../../components/InteractiveCarSelector';
import api from '../../services/api';


const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/claims/new', label: 'Submit New Claim', icon: FilePlus, end: true },
  { to: '/claims', label: 'Claim History', icon: History },
];

const SEVERITY_LEVELS = [
  { id: 'Minor', label: 'Minor', desc: 'Cosmetic scratches, small dents, paint transfer (< ₹10k)' },
  { id: 'Moderate', label: 'Moderate', desc: 'Cracked bumper, deep dent, broken headlight (₹10k - ₹35k)' },
  { id: 'Severe', label: 'Severe', desc: 'Structural deformation, crumpled panels, multiple parts (> ₹35k)' },
];

const DEMO_MODELS = [
  'Hyundai i20',
  '2023 Honda Civic Sedan',
  '2024 Toyota RAV4 SUV',
  '2022 Hyundai Creta',
  '2023 BMW 330i M-Sport',
  '2021 Ford F-150 Truck',
  '2024 Tesla Model 3',
];

export default function NewClaim() {
  const [vehicleModel, setVehicleModel] = useState('Hyundai i20 Asta');
  const [vehiclePlate, setVehiclePlate] = useState('KA-01-MJ-8821');
  const [activePolicy, setActivePolicy] = useState(null);
  const [claimedPart, setClaimedPart] = useState('Front Bumper');
  const [claimedSeverity, setClaimedSeverity] = useState('Minor');
  const [claimedDescription, setClaimedDescription] = useState(
    'Brushed against a parking garage pillar while parallel parking, causing a dent and scratches on the front bumper.'
  );

  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('active_policy');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setActivePolicy(parsed);
        if (parsed.vehicle_model) setVehicleModel(parsed.vehicle_model);
        if (parsed.vehicle_plate) setVehiclePlate(parsed.vehicle_plate);
      } catch {}
    }
  }, []);

  const handleFiles = (files) => {
    const newFiles = Array.from(files);
    if (photos.length + newFiles.length > 8) {
      toast.error('Maximum 8 photos allowed per claim assessment.');
      return;
    }
    setPhotos((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick helper to generate a sample canvas image for immediate demo testing
  const loadDemoPhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 800, 600);

    // Car silhouette
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(100, 280, 600, 180);
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(220, 280);
    ctx.lineTo(300, 180);
    ctx.lineTo(500, 180);
    ctx.lineTo(580, 280);
    ctx.closePath();
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(220, 460, 45, 0, Math.PI * 2);
    ctx.arc(580, 460, 45, 0, Math.PI * 2);
    ctx.fill();

    // Damage area illustration (dent / scratch marker)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(140, 360, 35, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('ACCIDENT DAMAGE ZONE', 190, 365);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText('SecureClaim Vehicle Verification Sample', 190, 395);

    canvas.toBlob((blob) => {
      const file = new File([blob], `demo_${claimedPart.toLowerCase().replace(/\s+/g, '_')}.jpg`, {
        type: 'image/jpeg',
      });
      handleFiles([file]);
      toast.success('Demo inspection photo generated & attached!');
    }, 'image/jpeg');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!claimedPart) {
      toast.error('Please select the damaged vehicle part.');
      return;
    }

    if (photos.length === 0) {
      toast.error('Please upload at least one photo or use "Attach Demo Photo".');
      return;
    }

    setSubmitting(true);
    setAnalysisStep(1);

    // Step simulation for visual WOW feedback
    const t1 = setTimeout(() => setAnalysisStep(2), 1200);
    const t2 = setTimeout(() => setAnalysisStep(3), 2600);
    const t3 = setTimeout(() => setAnalysisStep(4), 4000);

    const formData = new FormData();
    formData.append('claimed_part', claimedPart);
    formData.append('claimed_description', claimedDescription);
    formData.append('claimed_severity', claimedSeverity);
    formData.append('vehicle_model', vehicleModel);
    formData.append('vehicle_plate', vehiclePlate.toUpperCase());
    photos.forEach((photo) => formData.append('images', photo));

    try {
      const { data } = await api.post('/user/assess', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });



      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setAnalysisStep(5);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success('Claim verified and report generated!');
      setTimeout(() => {
        navigate(`/claims/${data.id}`);
      }, 900);
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Failed to submit claim.';
      toast.error(msg);
      setSubmitting(false);
      setAnalysisStep(0);
    }
  };

  return (
    <Layout navItems={navItems} title="Policyholder Portal">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-primary-600/20 text-primary-400 rounded-xl">
              <FilePlus className="w-6 h-6" />
            </div>
            Submit New Insurance Claim
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Upload accident photos for instant AI computer vision damage detection, cost estimation, and PDF report generation.
          </p>
        </div>

        {/* Active Policy Status Bar */}
        {activePolicy && (
          <div className="p-4 bg-slate-900/90 border border-primary-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  Claim Bound to Policy: <span className="font-mono text-primary-300">{activePolicy.policy_number}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase">
                    Active (1-Yr Term)
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Vehicle: <strong className="text-slate-200">{activePolicy.vehicle_model}</strong> ({activePolicy.vehicle_plate}) · Tier: {activePolicy.coverage_type}
                </p>
              </div>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-center">
              ✓ Automated AI Verification Enabled
            </span>
          </div>
        )}

        {/* AI Processing Modal Overlay */}
        {submitting && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                <Sparkles className="w-8 h-8 text-primary-400 absolute inset-0 m-auto animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">AI Neural Assessment Engine</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Processing vehicle damage with YOLOv8-seg and cross-checking claim
                </p>
              </div>

              <div className="space-y-3 text-left">
                {[
                  { step: 1, label: 'Uploading inspection photographs', icon: Upload },
                  { step: 2, label: 'Running YOLOv8-seg damage segmentation', icon: Cpu },
                  { step: 3, label: 'Calculating repair cost & labor hours', icon: Calculator },
                  { step: 4, label: 'Cross-checking claimed damage discrepancy', icon: ShieldCheck },
                  { step: 5, label: 'Compiling certified PDF assessment report', icon: FileCheck2 },
                ].map(({ step, label, icon: StepIcon }) => {
                  const isDone = analysisStep > step;
                  const isCurrent = analysisStep === step;

                  return (
                    <div
                      key={step}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-all ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-600/40 text-emerald-300'
                          : isCurrent
                          ? 'bg-primary-950/40 border-primary-500 text-primary-200 shadow-md ring-1 ring-primary-500/30'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-primary-400 animate-spin shrink-0" />
                      ) : (
                        <StepIcon className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <span className="font-medium">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Vehicle Identification */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-primary-400" />
              1. Vehicle Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Vehicle Model / Make
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                    placeholder="e.g. 2023 Honda Civic"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {DEMO_MODELS.slice(0, 3).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setVehicleModel(m)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  License Plate Number
                </label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                  placeholder="e.g. MH-12-AB-1234"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1.5">Format: XX-00-XX-0000</p>
              </div>
            </div>
          </div>

          {/* 2. Interactive Car Part Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              2. Damaged Vehicle Part Selection
            </label>
            <InteractiveCarSelector
              selectedPart={claimedPart}
              onSelectPart={(part) => setClaimedPart(part)}
            />
          </div>

          {/* 3. Claim Details & Severity */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              3. Claim Description & Reported Severity
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Reported Damage Severity
              </label>
              <div className="grid sm:grid-cols-3 gap-3">
                {SEVERITY_LEVELS.map((sev) => {
                  const isSelected = claimedSeverity === sev.id;
                  return (
                    <div
                      key={sev.id}
                      onClick={() => setClaimedSeverity(sev.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary-950/40 border-primary-500 shadow-md ring-1 ring-primary-500/40'
                          : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm text-white">{sev.label}</p>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">{sev.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Accident Damage Narrative
              </label>
              <textarea
                value={claimedDescription}
                onChange={(e) => setClaimedDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm min-h-[100px] resize-y"
                placeholder="Describe how the accident happened and what specific damage occurred..."
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The AI cross-check module compares this description against detected damage.
              </p>
            </div>
          </div>

          {/* 4. Photo Upload */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary-400" />
                4. Accident Photographs ({photos.length})
              </h2>
              <button
                type="button"
                onClick={loadDemoPhoto}
                className="px-3 py-1.5 bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border border-primary-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Attach Demo Photo
              </button>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-slate-700/80 hover:border-primary-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-950/40 hover:bg-primary-950/10 transition-colors"
            >
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">Click or drag accident photos here</p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPEG, PNG, WebP up to 15MB each (up to 8 photos)
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {previews.map((preview, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-800">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 w-7 h-7 bg-rose-600/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-primary-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-base tracking-wide"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Damage & Generating Report...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Submit Claim for AI Assessment
              </span>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
