import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, History, Upload, X, Loader2,
  Sparkles, Car, AlertTriangle, FileCheck2, Cpu, Calculator,
  ShieldCheck, CheckCircle2, MapPin, Clock, ChevronRight,
  ArrowLeft, ArrowRight, Camera, Info, AlertCircle, FileText
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

const STEPS = [
  { id: 1, label: 'Vehicle', icon: Car },
  { id: 2, label: 'Damage', icon: AlertTriangle },
  { id: 3, label: 'Photos', icon: Camera },
  { id: 4, label: 'Submit', icon: FileCheck2 },
];

const SEVERITY_LEVELS = [
  { id: 'Minor', label: 'Minor', desc: 'Cosmetic scratches, small dents, paint transfer', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', activeBorder: 'border-green-500', activeBg: 'bg-green-50' },
  { id: 'Moderate', label: 'Moderate', desc: 'Cracked bumper, deep dent, broken headlight', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', activeBorder: 'border-amber-500', activeBg: 'bg-amber-50' },
  { id: 'Severe', label: 'Severe', desc: 'Structural deformation, crumpled panels', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', activeBorder: 'border-red-500', activeBg: 'bg-red-50' },
];

const ACCIDENT_TYPES = ['Rear-end collision', 'Side impact', 'Front-end collision', 'Parking damage', 'Hail damage', 'Vandalism', 'Hit and run', 'Single-vehicle accident'];

const DEMO_MODELS = ['Hyundai i20', 'Hyundai Creta', 'Honda City', 'Maruti Swift', 'Toyota Innova', 'Mahindra XUV500', 'Tata Nexon'];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-6">
      {STEPS.map((s, i) => {
        const done = currentStep > s.id;
        const active = currentStep === s.id;
        const Icon = s.icon;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                done ? 'bg-green-500 border-green-500 text-white' :
                active ? 'bg-[#1268E8] border-[#1268E8] text-white shadow-md' :
                'bg-white border-[#E5E7EB] text-[#9CA3AF]'
              }`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${
                active ? 'text-[#1268E8]' : done ? 'text-green-600' : 'text-[#9CA3AF]'
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 sm:w-16 h-0.5 mb-4 mx-1 transition-all duration-500 ${done ? 'bg-green-400' : 'bg-[#E5E7EB]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function NewClaim() {
  const [step, setStep] = useState(1);
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [activePolicy, setActivePolicy] = useState(null);
  const [claimedPart, setClaimedPart] = useState('Front Bumper');
  const [claimedSeverity, setClaimedSeverity] = useState('Minor');
  const [claimedDescription, setClaimedDescription] = useState('Brushed against a parking garage pillar while parallel parking, causing a dent and scratches on the front bumper.');
  const [accidentType, setAccidentType] = useState('Parking damage');
  const [accidentDate, setAccidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [accidentLocation, setAccidentLocation] = useState('');
  const [policeComplaint, setPoliceComplaint] = useState(false);
  const [thirdParty, setThirdParty] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const fileRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('active_policy');
    const storedVeh = localStorage.getItem('registered_vehicle');
    let loadedModel = '';
    let loadedPlate = '';
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setActivePolicy(parsed);
        if (parsed.vehicle_model) loadedModel = parsed.vehicle_model;
        if (parsed.vehicle_plate) loadedPlate = parsed.vehicle_plate;
      } catch {}
    }
    if (storedVeh) {
      try {
        const v = JSON.parse(storedVeh);
        const title = v.make ? `${v.make} ${v.model}`.trim() : (v.model || '');
        if (title) loadedModel = title;
        if (v.plate) loadedPlate = v.plate.toUpperCase();
      } catch {}
    }
    setVehicleModel(loadedModel || 'Vehicle');
    setVehiclePlate(loadedPlate || 'N/A');
  }, []);

  const handleFiles = (files) => {
    const newFiles = Array.from(files);
    if (photos.length + newFiles.length > 8) {
      toast.error('Maximum 8 photos allowed per claim.');
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

  const loadDemoPhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 800, 600);
    ctx.fillStyle = '#1e293b'; ctx.fillRect(100, 280, 600, 180);
    ctx.fillStyle = '#334155';
    ctx.beginPath(); ctx.moveTo(220, 280); ctx.lineTo(300, 180); ctx.lineTo(500, 180); ctx.lineTo(580, 280); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.beginPath(); ctx.arc(220, 460, 45, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(580, 460, 45, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(140, 360, 35, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ef4444'; ctx.font = 'bold 18px sans-serif';
    ctx.fillText('ACCIDENT DAMAGE AREA', 190, 365);
    canvas.toBlob((blob) => {
      const file = new File([blob], `demo_damage.jpg`, { type: 'image/jpeg' });
      handleFiles([file]);
      toast.success('Demo photo attached!');
    }, 'image/jpeg');
  };

  const handleNext = () => {
    if (step === 1) {
      if (!vehicleModel.trim()) { toast.error('Please enter vehicle model.'); return; }
      if (!vehiclePlate.trim()) { toast.error('Please enter registration plate.'); return; }
    }
    if (step === 2) {
      if (!claimedPart) { toast.error('Please select the damaged part.'); return; }
      if (!claimedDescription.trim()) { toast.error('Please describe the accident.'); return; }
    }
    if (step === 3 && photos.length === 0) {
      toast.error('Please upload at least one photo or attach the demo photo.');
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.length === 0) { toast.error('Please upload at least one photo.'); return; }
    setSubmitting(true);
    setAnalysisStep(1);
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
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      setAnalysisStep(5);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      toast.success('Claim submitted & AI assessment complete!');
      setTimeout(() => navigate(`/claims/${data.id}`), 900);
    } catch (err) {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Failed to submit claim.';
      toast.error(msg);
      setSubmitting(false);
      setAnalysisStep(0);
    }
  };

  const AI_STEPS = [
    { step: 1, label: 'Uploading inspection photographs', icon: Upload },
    { step: 2, label: 'Running AI damage segmentation', icon: Cpu },
    { step: 3, label: 'Calculating repair cost estimate', icon: Calculator },
    { step: 4, label: 'Cross-checking claimed damage', icon: ShieldCheck },
    { step: 5, label: 'Generating certified PDF report', icon: FileCheck2 },
  ];

  return (
    <Layout navItems={navItems} title="New Claim">
      <div className="max-w-3xl mx-auto space-y-5 fade-in">

        {/* ── Page Banner ── */}
        <div className="page-banner flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <FilePlus className="w-5 h-5 text-[#93C5FD]" /> Submit New Insurance Claim
            </h1>
            <p className="text-[#BAD4F9] text-sm mt-1">
              Upload accident photos for instant AI damage detection and report generation.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-[#93C5FD] flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" /> AI Ready
          </span>
        </div>

        {/* ── Active Policy Notice ── */}
        {activePolicy && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-green-800">
                  Policy Active: <span className="font-mono">{activePolicy.policy_number}</span>
                </p>
                <p className="text-[11px] text-green-700">
                  {activePolicy.vehicle_model} · {activePolicy.vehicle_plate} · {activePolicy.coverage_type}
                </p>
              </div>
            </div>
            <span className="badge-green text-[10px] flex-shrink-0">✓ AI Enabled</span>
          </div>
        )}

        {/* ── Step Indicator ── */}
        <div className="card py-5">
          <StepIndicator currentStep={step} />

          {/* ─ Step 1: Vehicle Information ─ */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
                  <Car className="w-4 h-4 text-[#1268E8]" />
                </div>
                <h2 className="text-sm font-bold text-[#06244F]">Vehicle Information</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Vehicle Make & Model *</label>
                  <input type="text" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)}
                    className="input-field" placeholder="e.g. Hyundai Creta 2023" required />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {DEMO_MODELS.slice(0, 4).map((m) => (
                      <button key={m} type="button" onClick={() => setVehicleModel(m)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#F7FAFD] text-[#6B7280] hover:bg-[#EAF4FF] hover:text-[#1268E8] border border-[#E5E7EB] transition-colors">
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="input-label">Registration Plate *</label>
                  <input type="text" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    className="input-field font-mono uppercase" placeholder="e.g. TN-09-AB-1234" required />
                  <p className="text-[11px] text-[#9CA3AF] mt-1.5">Enter the vehicle registration number</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Accident Date</label>
                  <input type="date" value={accidentDate} onChange={(e) => setAccidentDate(e.target.value)}
                    className="input-field" max={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="input-label">Accident Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" value={accidentLocation} onChange={(e) => setAccidentLocation(e.target.value)}
                      className="input-field pl-9" placeholder="e.g. Chennai, OMR Road" />
                  </div>
                </div>
              </div>
              <div>
                <label className="input-label">Accident Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ACCIDENT_TYPES.map((type) => (
                    <button key={type} type="button" onClick={() => setAccidentType(type)}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                        accidentType === type ? 'bg-[#EAF4FF] border-[#1268E8] text-[#06244F]' : 'bg-[#F7FAFD] border-[#E5E7EB] text-[#6B7280] hover:border-[#1268E8]/40'
                      }`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={thirdParty} onChange={(e) => setThirdParty(e.target.checked)} className="w-4 h-4 rounded accent-[#1268E8]" />
                  <span className="text-sm text-[#374151]">Third-party involvement</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={policeComplaint} onChange={(e) => setPoliceComplaint(e.target.checked)} className="w-4 h-4 rounded accent-[#1268E8]" />
                  <span className="text-sm text-[#374151]">Police complaint filed</span>
                </label>
              </div>
            </div>
          )}

          {/* ─ Step 2: Damage Details ─ */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-sm font-bold text-[#06244F]">Damage Information</h2>
              </div>
              <div>
                <label className="input-label">Damaged Vehicle Part *</label>
                <InteractiveCarSelector selectedPart={claimedPart} onSelectPart={(part) => setClaimedPart(part)} />
              </div>
              <div>
                <label className="input-label">Reported Damage Severity *</label>
                <div className="grid sm:grid-cols-3 gap-3 mt-1">
                  {SEVERITY_LEVELS.map((sev) => {
                    const isSelected = claimedSeverity === sev.id;
                    return (
                      <div key={sev.id} onClick={() => setClaimedSeverity(sev.id)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected ? `${sev.activeBg} ${sev.activeBorder}` : `bg-[#F7FAFD] border-[#E5E7EB] hover:border-[#D1D5DB]`
                        }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className={`font-bold text-sm ${isSelected ? sev.color : 'text-[#374151]'}`}>{sev.label}</p>
                          {isSelected && <CheckCircle2 className="w-4 h-4" style={{ color: isSelected ? undefined : undefined }} />}
                        </div>
                        <p className="text-[11px] text-[#6B7280] leading-tight">{sev.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="input-label">Accident Description *</label>
                <textarea value={claimedDescription} onChange={(e) => setClaimedDescription(e.target.value)}
                  className="textarea-field min-h-[110px]" rows={4}
                  placeholder="Describe how the accident happened. Include details like speed, impact location, and visible damage..." required />
                <div className="flex items-start gap-2 mt-2 p-3 bg-[#EAF4FF] rounded-xl border border-[#1268E8]/20">
                  <Info className="w-4 h-4 text-[#1268E8] flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#374151]">
                    <strong>AI Cross-Check:</strong> The AI engine will compare this description against what it detects in the photos to generate a fraud-risk score.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─ Step 3: Photo Upload ─ */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
                    <Camera className="w-4 h-4 text-[#1268E8]" />
                  </div>
                  <h2 className="text-sm font-bold text-[#06244F]">Accident Photographs ({photos.length}/8)</h2>
                </div>
                <button type="button" onClick={loadDemoPhoto} className="btn-outline text-xs py-1.5 px-3">
                  <Sparkles className="w-3.5 h-3.5" /> Demo Photo
                </button>
              </div>

              <div onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                className="upload-zone">
                <Upload className="w-9 h-9 text-[#9CA3AF] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#374151]">Click or drag photos here</p>
                <p className="text-xs text-[#6B7280] mt-1.5">JPEG, PNG, WebP · Max 15MB each · Up to 8 photos</p>
                <div className="flex items-center justify-center gap-3 mt-3">
                  {['Front damage', 'Rear damage', 'Left side', 'Right side', 'Close-up'].map((label) => (
                    <span key={label} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#E5E7EB] text-[#6B7280]">{label}</span>
                  ))}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {previews.map((preview, i) => (
                    <div key={i} className="relative group rounded-xl overflow-hidden aspect-video bg-[#F7FAFD] border border-[#E5E7EB]">
                      <img src={preview} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => removePhoto(i)}
                          className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-medium">
                        Photo {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {photos.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">At least one photo is required for AI damage assessment. Use the "Demo Photo" button for testing.</p>
                </div>
              )}
            </div>
          )}

          {/* ─ Step 4: Review & Submit ─ */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4 text-[#1268E8]" />
                </div>
                <h2 className="text-sm font-bold text-[#06244F]">Review & Submit</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Vehicle', value: vehicleModel },
                  { label: 'Plate', value: vehiclePlate, mono: true },
                  { label: 'Damaged Part', value: claimedPart },
                  { label: 'Severity', value: claimedSeverity },
                  { label: 'Accident Type', value: accidentType },
                  { label: 'Accident Date', value: accidentDate },
                  { label: 'Photos Attached', value: `${photos.length} photo${photos.length !== 1 ? 's' : ''}` },
                  { label: 'Third-Party', value: thirdParty ? 'Yes' : 'No' },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex items-center justify-between p-3 bg-[#F7FAFD] rounded-xl border border-[#E5E7EB]">
                    <span className="text-xs text-[#6B7280] font-medium">{label}</span>
                    <span className={`text-xs font-bold text-[#06244F] ${mono ? 'font-mono' : ''}`}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-[#F7FAFD] rounded-xl border border-[#E5E7EB]">
                <p className="text-[10px] text-[#6B7280] font-semibold uppercase tracking-wide mb-1">Accident Description</p>
                <p className="text-xs text-[#374151] leading-relaxed italic">"{claimedDescription}"</p>
              </div>

              <div className="p-4 bg-[#EAF4FF] rounded-xl border border-[#1268E8]/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#1268E8] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#06244F]">AI Assessment Will Run Automatically</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5 leading-relaxed">
                    Upon submission: image validation → damage detection → severity scoring → cost estimation → fraud screening → PDF report generation.
                  </p>
                </div>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full py-3.5 px-6 bg-[#1268E8] hover:bg-[#0f58d4] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm">
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Damage & Generating Report...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Submit Claim for AI Assessment</>
                )}
              </button>
            </form>
          )}

          {/* ─ Step Navigation Buttons ─ */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#E5E7EB]">
              {step === 1 ? (
                <Link to="/dashboard" className="btn-ghost text-xs text-[#6B7280] flex items-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Dashboard
                </Link>
              ) : (
                <button type="button" onClick={() => { setStep(s => s - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="btn-secondary text-xs flex items-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#9CA3AF] font-medium">Step {step} of {STEPS.length}</span>
                <button type="button" onClick={handleNext} className="btn-primary text-xs flex items-center gap-1.5">
                  {step === 3 ? 'Review & Submit' : 'Continue'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── AI Processing Modal ── */}
        {submitting && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl p-8 max-w-md w-full space-y-5 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-full animate-spin" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: '#EAF4FF', borderTopColor: '#1268E8' }} />
                <Sparkles className="w-6 h-6 text-[#1268E8] absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#06244F]">AI Assessment Running</h3>
                <p className="text-xs text-[#6B7280] mt-1">Processing vehicle damage with computer vision</p>
              </div>
              <div className="space-y-2 text-left">
                {AI_STEPS.map(({ step: s, label, icon: StepIcon }) => {
                  const isDone = analysisStep > s;
                  const isCurrent = analysisStep === s;
                  return (
                    <div key={s} className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-all ${
                      isDone ? 'bg-green-50 border-green-200 text-green-700'
                      : isCurrent ? 'bg-[#EAF4FF] border-[#1268E8] text-[#1268E8]'
                      : 'bg-[#F7FAFD] border-[#E5E7EB] text-[#9CA3AF]'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                       : isCurrent ? <Loader2 className="w-4 h-4 text-[#1268E8] animate-spin flex-shrink-0" />
                       : <StepIcon className="w-4 h-4 text-[#D1D5DB] flex-shrink-0" />}
                      <span className="font-medium">{label}</span>
                      {isDone && <span className="ml-auto text-[10px] font-bold text-green-600">Done</span>}
                      {isCurrent && <span className="ml-auto text-[10px] font-bold text-[#1268E8]">Running...</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
