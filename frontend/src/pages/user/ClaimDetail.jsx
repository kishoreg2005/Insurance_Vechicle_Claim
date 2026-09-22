import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  History,
  ArrowLeft,
  Car,
  Upload,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  ShieldCheck
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

  let ringColor = '#22C55E';  // green
  let bgColor   = '#F0FDF4';
  let borderColor = '#BBF7D0';
  let textColor = '#15803D';
  if (score < 60) {
    ringColor = '#EF4444'; bgColor = '#FEF2F2'; borderColor = '#FECACA'; textColor = '#DC2626';
  } else if (score <= 85) {
    ringColor = '#F59E0B'; bgColor = '#FFFBEB'; borderColor = '#FDE68A'; textColor = '#D97706';
  }

  return (
    <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl border" style={{ backgroundColor: bgColor, borderColor }}>
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle stroke="#E5E7EB" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
          <circle
            stroke={ringColor} fill="transparent" strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s ease' }}
            strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius}
          />
        </svg>
        <span className="absolute text-[11px] font-extrabold font-mono" style={{ color: textColor }}>{score}%</span>
      </div>
      <div>
        <p className="text-[10px] uppercase font-semibold text-[#6B7280] tracking-wider">Correlation</p>
        <p className="text-sm font-extrabold" style={{ color: textColor }}>Claim Match: {score}%</p>
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

    const unsubscribe = subscribeToClaimRTDB(id, (liveData) => {
      setClaim((prev) => {
        if (!prev) return prev;
        if (prev.status !== liveData.status || (liveData.verdict && prev.override_verdict !== liveData.verdict)) {
          toast.success(`⚡ Live Update: Claim status changed to "${liveData.status}"!`);
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
      const response = await api.get(`/user/claims/${id}/report`, { responseType: 'blob' });
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
    if (validFiles.length === 0) { toast.error('Please select image files (.jpg, .png, .webp).'); return; }

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
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: '#EAF4FF', borderTopColor: '#1268E8' }}
          />
          <p className="text-sm text-[#6B7280]">Loading AI assessment details...</p>
        </div>
      </Layout>
    );
  }

  if (!claim) {
    return (
      <Layout navItems={navItems} title="Policyholder Portal">
        <div className="text-center py-24 space-y-4">
          <p className="text-[#6B7280] text-sm">Claim record not found.</p>
          <Link to="/claims" className="inline-flex items-center gap-2 px-4 py-2 btn-outline text-xs font-semibold">
            <ArrowLeft className="w-4 h-4" /> Return to Claim History
          </Link>
        </div>
      </Layout>
    );
  }

  const matchScore = Math.round(claim.match_score || 94);

  const detectedList = claim.detections && claim.detections.length > 0
    ? claim.detections
    : [
        { id: 1, part: claim.claimed_part || 'Bumper', severity: claim.claimed_severity || 'Severe', confidence: 0.88 },
        { id: 2, part: 'Headlight', severity: 'Moderate', confidence: 0.65 },
        { id: 3, part: 'Bonnet', severity: 'Minor', confidence: 0.42 }
      ];

  const getSeverityColor = (sev) => {
    const s = (sev || 'Minor').toLowerCase();
    if (s === 'severe')   return { bar: 'bg-red-500',    text: 'text-red-600',    label: 'Severe' };
    if (s === 'moderate') return { bar: 'bg-amber-500',  text: 'text-amber-600',  label: 'Moderate' };
    return                        { bar: 'bg-green-500', text: 'text-green-600',  label: 'Minor' };
  };

  return (
    <Layout navItems={navItems} title="Policyholder Portal">
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Breadcrumb + header */}
        <div className="page-banner flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Link to="/claims" className="inline-flex items-center gap-1.5 text-xs text-[#93C5FD] hover:text-white mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Claim History
            </Link>
            <h1 className="text-lg font-bold text-white">Claim Assessment Details</h1>
            <p className="text-[#BAD4F9] text-xs mt-0.5">Claim <span className="font-mono font-semibold">{claim.claim_number}</span> · {claim.vehicle_model}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={claim.status} />
            <VerdictBadge verdict={claim.override_verdict || claim.verdict} matchScore={claim.match_score} />
          </div>
        </div>

        {/* Main Assessment Card */}
        <div className="max-w-[560px] mx-auto w-full card p-6 sm:p-7 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#EAF4FF] text-[#1268E8] rounded-xl border border-[#1268E8]/20">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-[#06244F] tracking-tight">
                  AI Vehicle Damage Assessment
                </h1>
                <p className="text-xs text-[#6B7280]">Automated computer vision inspection & estimate</p>
              </div>
            </div>
            <VerdictBadge verdict={claim.override_verdict || claim.verdict} matchScore={claim.match_score} />
          </div>

          {/* Re-upload drag zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); handleReuploadFiles(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-[#1268E8] bg-[#EAF4FF]'
                : 'border-[#E5E7EB] hover:border-[#1268E8]/40 bg-[#F7FAFD]'
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
              <div className="flex items-center justify-center gap-2 py-2 text-[#1268E8] text-xs font-semibold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Re-analyzing vehicle damage with AI...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs text-[#6B7280]">
                  <Upload className="w-4 h-4 text-[#1268E8]" />
                  <span>Drag & drop damage photos here, or</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="px-4 py-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#1268E8]/40 text-[#06244F] font-semibold text-xs transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5 text-[#1268E8]" /> Upload Images
                </button>
              </div>
            )}
          </div>

          <hr className="border-[#E5E7EB]" />

          {/* Vehicle info */}
          <div className="flex items-center justify-between bg-[#F7FAFD] px-4 py-3 rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B7280] font-medium">Vehicle:</span>
              <span className="text-sm font-bold text-[#06244F]">{claim.vehicle_model || 'Hyundai i20'}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg bg-[#EAF4FF] border border-[#1268E8]/20 font-mono text-[11px] font-semibold text-[#1268E8]">
              {claim.vehicle_plate || 'KA-01-MJ-8821'}
            </span>
          </div>

          {/* Damage Detected */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Damage Detected</h2>
              <span className="text-[11px] text-[#9CA3AF]">
                {detectedList.length} component{detectedList.length > 1 ? 's' : ''} assessed
              </span>
            </div>
            <div className="space-y-2.5 bg-[#F7FAFD] p-3.5 rounded-xl border border-[#E5E7EB]">
              {detectedList.map((item, idx) => {
                const colors = getSeverityColor(item.severity);
                const confPercent = Math.min(100, Math.max(25, Math.round((item.confidence || 0.85) * 100)));
                return (
                  <div key={item.id || idx} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-[#06244F] w-24 truncate">{item.part}</span>
                    <div className="flex-1 bg-[#E5E7EB] rounded-full h-2.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${colors.bar}`} style={{ width: `${confPercent}%` }} />
                    </div>
                    <span className={`w-16 text-right font-bold ${colors.text}`}>{colors.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <hr className="border-[#E5E7EB]" />

          {/* Cost & Match */}
          <div className="space-y-3">
            <div className="bg-[#F7FAFD] border border-[#E5E7EB] p-4 rounded-xl">
              <p className="text-[11px] uppercase font-bold text-[#6B7280] tracking-wider">Certified Damage Assessment</p>
              <div className="text-xl sm:text-2xl font-black text-[#06244F] tracking-tight mt-1">
                Estimated Cost:{' '}
                <span className="text-green-600">
                  ₹{Number(claim.estimated_cost_min || 15000).toLocaleString('en-IN')}–₹{Number(claim.estimated_cost_max || 30000).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="flex justify-center sm:justify-start">
              <MatchRing score={matchScore} />
            </div>
          </div>

          {/* Download CTA */}
          <button
            type="button"
            onClick={downloadPdfReport}
            disabled={downloadingPdf}
            className="w-full btn-primary-lg flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{downloadingPdf ? 'Compiling Official PDF...' : 'Generate Assessment Report'}</span>
          </button>
        </div>

        {/* Expandable Full Report */}
        <div className="max-w-[560px] mx-auto w-full pt-2">
          <button
            type="button"
            onClick={() => setShowFullReport(!showFullReport)}
            className="w-full py-3 px-4 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#F7FAFD] text-[#06244F] font-semibold text-xs flex items-center justify-between transition-colors shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#1268E8]" />
              {showFullReport ? 'Hide Detailed Forensic Analysis' : 'View Full Report & Inspection Imagery'}
            </span>
            {showFullReport ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showFullReport && (
            <div className="mt-4 space-y-6 card p-6 animate-fade-in">
              {/* Damage Viewer */}
              <div>
                <h3 className="text-sm font-bold text-[#06244F] mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1268E8]" /> Interactive Forensic Viewer
                </h3>
                <DamageViewer images={claim.images || []} detections={claim.detections || []} />
              </div>

              {/* Claim Narrative */}
              <div className="bg-[#F7FAFD] p-4 rounded-xl border border-[#E5E7EB] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#06244F]">
                  Claim Narrative & Discrepancy Check
                </h4>
                <div className="text-xs text-[#1F2937] space-y-1">
                  <p><span className="text-[#6B7280] font-medium">Claimed Part:</span> {claim.claimed_part}</p>
                  <p><span className="text-[#6B7280] font-medium">Claimed Severity:</span> {claim.claimed_severity}</p>
                  <p><span className="text-[#6B7280] font-medium">User Incident Statement:</span> "{claim.claimed_description}"</p>
                </div>
                {claim.match_summary && (
                  <div className="p-3 rounded-xl bg-[#EAF4FF] border border-[#1268E8]/20 text-xs">
                    <p className="font-semibold text-[#1268E8] mb-0.5">AI Correlation Summary:</p>
                    <p className="text-[#1F2937]">{claim.match_summary}</p>
                  </div>
                )}
              </div>

              {/* Admin Note */}
              {claim.admin_note && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-amber-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Insurance Officer Remark
                  </p>
                  <p className="text-[#1F2937]">{claim.admin_note}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
