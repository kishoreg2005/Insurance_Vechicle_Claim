import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Sliders,
  Users,
  Download,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  FileText,
  DollarSign,
  User,
  Save,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import StatusBadge, { VerdictBadge, SeverityBadge, CostBadge } from '../../components/StatusBadge';
import DamageViewer from '../../components/DamageViewer';
import api from '../../services/api';
import { syncClaimToRTDB } from '../../services/realtimeDb';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/claims', label: 'Claims Review', icon: ClipboardList, end: true },
  { to: '/admin/rules', label: 'Cost & Severity Rules', icon: Sliders },
  { to: '/admin/users', label: 'Policyholders', icon: Users },
];

export default function AdminClaimDetail() {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Administrative Override Form State
  const [status, setStatus] = useState('Pending');
  const [overrideVerdict, setOverrideVerdict] = useState('Match');
  const [adminNote, setAdminNote] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  useEffect(() => {
    api.get(`/admin/claims/${id}`)
      .then(({ data }) => {
        setClaim(data);
        setStatus(data.status || 'Pending');
        setOverrideVerdict(data.override_verdict || data.verdict || 'Match');
        setAdminNote(data.admin_note || '');
      })
      .catch((err) => {
        toast.error('Failed to load claim detail.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    setSavingOverride(true);
    try {
      const { data } = await api.patch(`/admin/claims/${id}/override`, {
        status,
        override_verdict: overrideVerdict,
        admin_note: adminNote,
      });
      setClaim(data);
      // Sync update to Firebase RTDB for real-time policyholder reflection
      syncClaimToRTDB(data);
      toast.success('Claim status and administrative override saved successfully!');
    } catch (err) {
      toast.error('Failed to save override.');
    } finally {
      setSavingOverride(false);
    }
  };

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
      toast.error('Unable to download PDF report.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <Layout navItems={navItems} title="Insurance Officer Console">
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading claim forensic details...</p>
        </div>
      </Layout>
    );
  }

  if (!claim) {
    return (
      <Layout navItems={navItems} title="Insurance Officer Console">
        <div className="text-center py-24 space-y-4">
          <p className="text-slate-400 text-sm">Claim record not found.</p>
          <Link
            to="/admin/claims"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Review Queue
          </Link>
        </div>
      </Layout>
    );
  }

  const matchScore = Math.round(claim.match_score || 0);

  return (
    <Layout navItems={navItems} title="Insurance Officer Console">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              to="/admin/claims"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Claims Queue
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {claim.claim_number}
              </h1>
              <StatusBadge status={claim.status} />
              <VerdictBadge verdict={claim.verdict} matchScore={claim.match_score} />
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Policyholder: <strong className="text-white">{claim.user?.name || 'Authorized Claimant'}</strong> ({claim.user?.email}) · Vehicle: {claim.vehicle_model} ({claim.vehicle_plate})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadPdfReport}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-primary-600/25 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloadingPdf ? 'Downloading PDF...' : 'Download Certified PDF'}
            </button>
          </div>
        </div>

        {/* AI Cross-Check Verification Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary-600/20 text-primary-400 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">AI Cross-Check Correlation Analysis</h2>
                <p className="text-xs text-slate-400">
                  Automated comparison between reported accident narrative and YOLOv8 detections
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 px-4 py-2 rounded-xl">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Match Score
                </p>
                <p className="text-lg font-extrabold text-white font-mono">{matchScore}%</p>
              </div>
              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    matchScore > 75 ? 'bg-emerald-500' : matchScore > 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${matchScore}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-xs space-y-2">
            <p className="text-slate-300 leading-relaxed font-medium">
              <strong className="text-white">AI Synthesis: </strong>
              {claim.match_summary || 'Evaluation finished with high correlation confidence.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs">
              <p className="text-slate-400">Reported Damaged Area</p>
              <p className="font-bold text-white mt-0.5">{claim.claimed_part}</p>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs">
              <p className="text-slate-400">Claimant Reported Severity</p>
              <div className="mt-1">
                <SeverityBadge severity={claim.claimed_severity} />
              </div>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs">
              <p className="text-slate-400">Identified Damage Instances</p>
              <p className="font-bold text-white mt-0.5">{claim.detections?.length || 0} damage instances</p>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs">
              <p className="text-slate-400">Evaluated Repair Cost</p>
              <p className="font-mono font-bold text-emerald-400 mt-0.5">
                ${claim.estimated_cost_min?.toLocaleString()} - ${claim.estimated_cost_max?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Damage Viewer Component */}
        <div>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-400" />
            Computer Vision Segmentation & Neural Overlays
          </h2>
          <DamageViewer images={claim.images || []} detections={claim.detections || []} />
        </div>

        {/* Incident Narrative Statement & Itemized Cost Breakdown */}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
              Policyholder Incident Narrative
            </h3>
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed font-sans">
              "{claim.claimed_description}"
            </div>

            <div className="border-t border-slate-800/80 pt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Policyholder Name:</span>
                <span className="text-white font-medium">{claim.user?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Account Email:</span>
                <span className="text-white font-mono">{claim.user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Vehicle License Plate:</span>
                <span className="text-white font-mono">{claim.vehicle_plate}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
                Itemized Repair Cost Assessment
              </h3>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                ${claim.estimated_cost_min?.toLocaleString()} - ${claim.estimated_cost_max?.toLocaleString()}
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {claim.detections?.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No localized damages detected.</p>
              ) : (
                claim.detections?.map((det, i) => (
                  <div
                    key={det.id || i}
                    className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{det.part}</p>
                      <p className="text-[11px] text-slate-400">{det.damage_type} · Severity: {det.severity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-400">
                        ${det.cost_min?.toLocaleString()} - ${det.cost_max?.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Confidence: {Math.round((det.confidence || 0.9) * 100)}%
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Administrative Override & Officer Decision Console */}
        <div className="bg-slate-900/90 border border-primary-500/40 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary-600/20 text-primary-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Officer Adjudication & Override Decision Console
                </h3>
                <p className="text-xs text-slate-400">
                  Override automated AI verdicts or assign official authorization status
                </p>
              </div>
            </div>

            {claim.override_by && (
              <div className="text-right text-xs">
                <span className="text-primary-400 font-semibold">Last Adjudicated by:</span>
                <p className="text-white font-mono">{claim.override_by}</p>
                <p className="text-[10px] text-slate-400">
                  {claim.override_at ? new Date(claim.override_at).toLocaleString() : ''}
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveOverride} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Claim Status Decision */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Claim Status Decision
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'Approved', label: 'Approve Claim', color: 'emerald' },
                    { id: 'Pending', label: 'Under Investigation', color: 'amber' },
                    { id: 'Rejected', label: 'Reject Claim', color: 'rose' },
                    { id: 'Info Requested', label: 'Request Info', color: 'blue' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStatus(opt.id)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        status === opt.id
                          ? 'bg-primary-600/25 border-primary-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt.label}</span>
                        {status === opt.id && <CheckCircle2 className="w-4 h-4 text-primary-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Verdict Override */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Verdict Classification Override
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'Match', label: 'Match (Consistent)' },
                    { id: 'Partial Match', label: 'Partial Match' },
                    { id: 'Discrepancy', label: 'Discrepancy' },
                    { id: 'Flagged', label: 'Flagged (Suspected Fraud)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOverrideVerdict(opt.id)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        overrideVerdict === opt.id
                          ? 'bg-primary-600/25 border-primary-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt.label}</span>
                        {overrideVerdict === opt.id && <CheckCircle2 className="w-4 h-4 text-primary-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Officer Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary-400" />
                Insurance Officer Official Determination Notes
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Enter formal justification, reason for override, or additional instructions for claimant..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-xs min-h-[90px] resize-y"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingOverride}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 transition-all text-xs flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingOverride ? 'Saving Override...' : 'Commit Adjudication Decision'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
