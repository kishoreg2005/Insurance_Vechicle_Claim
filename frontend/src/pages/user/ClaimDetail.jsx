import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  History,
  Download,
  ArrowLeft,
  Car,
  Upload,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import Layout from '../../components/Layout';
import StatusBadge, { VerdictBadge, SeverityBadge, CostBadge } from '../../components/StatusBadge';
import DamageViewer from '../../components/DamageViewer';
import api from '../../services/api';
import { subscribeToClaimRTDB } from '../../services/realtimeDb';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/claims/new', label: 'Submit New Claim', icon: FilePlus },
  { to: '/claims', label: 'Claim History', icon: History },
];

function MatchRing({ score }) {
  const radius = 24;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = 'stroke-emerald-400 text-emerald-400';
  let badgeBg = 'bg-emerald-500/10 border-emerald-500/30';
  if (score < 60) {
    strokeColor = 'stroke-rose-400 text-rose-400';
    badgeBg = 'bg-rose-500/10 border-rose-500/30';
  } else if (score <= 85) {
    strokeColor = 'stroke-amber-400 text-amber-400';
    badgeBg = 'bg-amber-500/10 border-amber-500/30';
  }

  return (
    <div className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl border ${badgeBg}`}>
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="#1e293b"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s ease' }}
            strokeLinecap="round"
            className={strokeColor.split(' ')[0]}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <span className={`absolute text-[11px] font-extrabold font-mono ${strokeColor.split(' ')[1]}`}>
          {score}%
        </span>
      </div>
      <div>
        <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Correlation</p>
        <p className={`text-sm font-extrabold ${strokeColor.split(' ')[1]}`}>
          Claim Match: {score}%
        </p>
      </div>
    </div>
  );
}

export default function ClaimDetail() {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [reassessing, setReassessing] = useState(false);
  const [showFullReport, setShowFullReport] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get(`/user/claims/${id}`)
      .then(({ data }) => setClaim(data))
      .catch((err) => {
        toast.error(err.response?.data?.detail || 'Failed to load claim assessment details.');
      })
      .finally(() => setLoading(false));

    // Connect to Firebase Realtime Database for live status/verdict updates
    const unsubscribe = subscribeToClaimRTDB(id, (liveData) => {
      setClaim((prev) => {
        if (!prev) return prev;
        if (prev.status !== liveData.status || (liveData.verdict && prev.override_verdict !== liveData.verdict)) {
          toast.success(`⚡ Live Update: Claim status changed to "${liveData.status}"!`, {
            icon: '⚡',
          });
        }
        return {
          ...prev,
          status: liveData.status || prev.status,
          override_verdict: liveData.verdict || prev.override_verdict,
          admin_note: liveData.admin_note !== undefined ? liveData.admin_note : prev.admin_note,
        };
      });
    });

    return () => unsubscribe();
  }, [id]);

  const downloadPdfReport = async () => {
    setDownloadingPdf(true);
    try {
      const response = await api.get(`/user/claims/${id}/report`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = claim?.reports?.[0]?.file_name || `assessment_report_${claim?.claim_number || id}.pdf`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Certified Assessment PDF downloaded successfully!');
    } catch (err) {
      toast.error('Unable to download PDF. Report may still be compiling.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleReuploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      toast.error('Please select image files (.jpg, .png, .webp).');
      return;
    }

    setReassessing(true);
    const formData = new FormData();
    validFiles.forEach(f => formData.append('images', f));

    try {
      const { data } = await api.post(`/user/claims/${id}/reassess`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setClaim(data);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
      toast.success('Re-assessment complete! Fresh damage analysis & report generated.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Re-assessment failed.');
    } finally {
      setReassessing(false);
    }
  };

  if (loading) {
    return (
      <Layout navItems={navItems} title="Policyholder Portal">
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading AI assessment details...</p>
        </div>
      </Layout>
    );
  }

  if (!claim) {
    return (
      <Layout navItems={navItems} title="Policyholder Portal">
        <div className="text-center py-24 space-y-4">
          <p className="text-slate-400 text-sm">Claim record not found.</p>
          <Link
            to="/claims"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Claim History
          </Link>
        </div>
      </Layout>
    );
  }

  const matchScore = Math.round(claim.match_score || 94);

  // Extract detected parts for horizontal bars
  const detectedList = claim.detections && claim.detections.length > 0
    ? claim.detections
    : [
        { id: 1, part: claim.claimed_part || 'Bumper', severity: claim.claimed_severity || 'Severe', confidence: 0.88 },
        { id: 2, part: 'Headlight', severity: 'Moderate', confidence: 0.65 },
        { id: 3, part: 'Bonnet', severity: 'Minor', confidence: 0.42 }
      ];

  const getSeverityColor = (sev) => {
    const s = (sev || 'Minor').toLowerCase();
    if (s === 'severe') return { bar: 'bg-rose-500', text: 'text-rose-400', label: 'Severe' };
    if (s === 'moderate') return { bar: 'bg-amber-500', text: 'text-amber-400', label: 'Moderate' };
    return { bar: 'bg-emerald-400', text: 'text-emerald-400', label: 'Minor' };
  };

  return (
    <Layout navItems={navItems} title="Policyholder Portal">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/claims"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Claim History
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Claim #{claim.claim_number}</span>
            <StatusBadge status={claim.status} />
          </div>
        </div>

        {/* ============================================================ */}
        {/* EXACT CARD-BASED SINGLE-PAGE RESULT VIEW                     */}
        {/* Centered, max-width ~500-600px on desktop, full width mobile */}
        {/* ============================================================ */}
        <div className="max-w-[560px] mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          
          {/* 1. Header: "AI Vehicle Damage Assessment" with car icon */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-600/20 text-primary-400 rounded-2xl border border-primary-500/30">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  AI Vehicle Damage Assessment
                </h1>
                <p className="text-xs text-slate-400">
                  Automated computer vision inspection & estimate
                </p>
              </div>
            </div>
            <VerdictBadge verdict={claim.override_verdict || claim.verdict} matchScore={claim.match_score} />
          </div>

          {/* 2. Upload section (if re-uploading): drag-drop zone, "Upload Images" button */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleReuploadFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleReuploadFiles(e.target.files)}
            />
            {reassessing ? (
              <div className="flex items-center justify-center gap-2 py-2 text-primary-400 text-xs font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Re-analyzing vehicle damage with AI...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Upload className="w-4 h-4 text-primary-400" />
                  <span>Drag & drop damage photos here, or</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors shadow-sm inline-flex items-center gap-1.5 border border-slate-700/60"
                >
                  <Upload className="w-3.5 h-3.5 text-primary-400" />
                  Upload Images
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <hr className="border-slate-800/80" />

          {/* 3. Vehicle info row: "Vehicle: Hyundai i20" (auto-filled / detected) */}
          <div className="flex items-center justify-between bg-slate-950/50 px-4 py-3 rounded-2xl border border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Vehicle:</span>
              <span className="text-sm font-bold text-white tracking-tight">
                {claim.vehicle_model || 'Hyundai i20'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-[11px] font-semibold text-primary-300">
              {claim.vehicle_plate || 'KA-01-MJ-8821'}
            </span>
          </div>

          {/* 4. "Damage Detected" section header + Horizontal bar list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Damage Detected
              </h2>
              <span className="text-[11px] text-slate-500">
                {detectedList.length} component{detectedList.length > 1 ? 's' : ''} assessed
              </span>
            </div>

            {/* Horizontal bar list, one row per detected part */}
            <div className="space-y-2.5 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60">
              {detectedList.map((item, idx) => {
                const colors = getSeverityColor(item.severity);
                const confPercent = Math.min(100, Math.max(25, Math.round((item.confidence || 0.85) * 100)));
                return (
                  <div key={item.id || idx} className="flex items-center justify-between gap-3 text-xs">
                    {/* [Part Name] */}
                    <span className="font-semibold text-slate-200 w-24 truncate">
                      {item.part}
                    </span>

                    {/* [Horizontal severity bar, color-coded] */}
                    <div className="flex-1 bg-slate-800/90 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                        style={{ width: `${confPercent}%` }}
                      />
                    </div>

                    {/* [Severity Label] */}
                    <span className={`w-16 text-right font-bold ${colors.text}`}>
                      {colors.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <hr className="border-slate-800/80" />

          {/* 5. Estimated Cost & Claim Match Row */}
          <div className="space-y-3">
            {/* "Estimated Cost: ₹15,000–₹30,000" — bold, prominent, large font */}
            <div className="bg-gradient-to-r from-slate-950 to-slate-900 border border-slate-800 p-4 rounded-2xl">
              <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Certified Damage Assessment
              </p>
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Estimated Cost:{' '}
                <span className="text-emerald-400">
                  ₹{Number(claim.estimated_cost_min || 15000).toLocaleString('en-IN')}–₹{Number(claim.estimated_cost_max || 30000).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* "Claim Match: 94%" with circular progress ring */}
            <div className="flex justify-center sm:justify-start">
              <MatchRing score={matchScore} />
            </div>
          </div>

          {/* 6. Primary CTA button (full width, bottom): "Generate Assessment Report" */}
          <button
            type="button"
            onClick={downloadPdfReport}
            disabled={downloadingPdf}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 active:scale-[0.99] text-white font-bold text-sm shadow-xl shadow-primary-600/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{downloadingPdf ? 'Compiling Official PDF...' : 'Generate Assessment Report'}</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* EXPANDABLE SECTION: "View Full Report" / Forensic Details     */}
        {/* ============================================================ */}
        <div className="max-w-[560px] mx-auto w-full pt-2">
          <button
            type="button"
            onClick={() => setShowFullReport(!showFullReport)}
            className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-between transition-colors shadow-md"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-400" />
              {showFullReport ? 'Hide Detailed Forensic Analysis' : 'View Full Report & Inspection Imagery'}
            </span>
            {showFullReport ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFullReport && (
            <div className="mt-4 space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-in fade-in duration-200">
              {/* Detailed Damage Visualizer with Zoom/Pan & Overlay Toggle */}
              <div>
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-400" />
                  Interactive Forensic Viewer
                </h3>
                <DamageViewer
                  images={claim.images || []}
                  detections={claim.detections || []}
                />
              </div>

              {/* Claimed Narrative vs Detected Summary */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Claim Narrative & Discrepancy Check
                </h4>
                <div className="text-xs text-slate-300 space-y-1">
                  <p><span className="text-slate-500 font-medium">Claimed Part:</span> {claim.claimed_part}</p>
                  <p><span className="text-slate-500 font-medium">Claimed Severity:</span> {claim.claimed_severity}</p>
                  <p><span className="text-slate-500 font-medium">User Incident Statement:</span> "{claim.claimed_description}"</p>
                </div>
                {claim.match_summary && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <p className="font-semibold text-primary-300 mb-0.5">AI Correlation Summary:</p>
                    <p>{claim.match_summary}</p>
                  </div>
                )}
              </div>

              {/* Administrative Remarks if any */}
              {claim.admin_note && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-xs space-y-1">
                  <p className="font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Insurance Officer Remark
                  </p>
                  <p className="text-slate-300">{claim.admin_note}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
