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
      <Layout navItems={navItems} title="Claim Detail">
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <div className="w-8 h-8 rounded-full animate-spin" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: '#EAF4FF', borderTopColor: '#1268E8' }} />
          <p className="text-sm text-[#6B7280]">Loading claim details...</p>
        </div>
      </Layout>
    );
  }

  if (!claim) {
    return (
      <Layout navItems={navItems} title="Claim Detail">
        <div className="text-center py-24 space-y-4">
          <p className="text-[#6B7280] text-sm">Claim record not found.</p>
          <Link to="/admin/claims" className="btn-secondary text-xs">
            <ArrowLeft className="w-4 h-4" /> Back to Review Queue
          </Link>
        </div>
      </Layout>
    );
  }

  const matchScore = Math.round(claim.match_score || 0);

  return (
    <Layout navItems={navItems} title="Claim Detail">
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="page-banner flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link to="/admin/claims" className="inline-flex items-center gap-1.5 text-xs text-[#93C5FD] hover:text-white mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Claims Queue
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-white">{claim.claim_number}</h1>
              <StatusBadge status={claim.status} />
              <VerdictBadge verdict={claim.verdict} matchScore={claim.match_score} />
            </div>
            <p className="text-[#93C5FD] text-xs mt-1">
              Policyholder: <strong className="text-white">{claim.user?.name || 'N/A'}</strong> · Vehicle: {claim.vehicle_model} ({claim.vehicle_plate})
            </p>
          </div>
          <button onClick={downloadPdfReport} disabled={downloadingPdf} className="btn-primary flex-shrink-0">
            <Download className="w-4 h-4" />
            {downloadingPdf ? 'Downloading...' : 'Download PDF Report'}
          </button>
        </div>

        {/* AI Cross-Check */}
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#EAF4FF] flex items-center justify-center"><Sparkles className="w-4.5 h-4.5 text-[#1268E8]" style={{ width: '18px', height: '18px' }} /></div>
              <div>
                <h2 className="text-sm font-bold text-[#06244F]">AI Cross-Check Analysis</h2>
                <p className="text-xs text-[#6B7280]">Comparison between reported narrative and computer vision detections</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[#F7FAFD] border border-[#E5E7EB] px-4 py-2 rounded-lg">
              <div>
                <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-semibold">Match Score</p>
                <p className="text-lg font-black text-[#06244F] font-mono">{matchScore}%</p>
              </div>
              <div className="w-20 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${matchScore > 75 ? 'bg-green-500' : matchScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${matchScore}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-[#F7FAFD] rounded-lg border border-[#E5E7EB] p-4 text-xs">
            <p className="text-[#374151] leading-relaxed">
              <strong className="text-[#06244F]">AI Summary: </strong>
              {claim.match_summary || 'Evaluation finished with high correlation confidence.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Reported Damaged Area', value: claim.claimed_part },
              { label: 'Damage Instances', value: `${claim.detections?.length || 0} detected` },
              { label: 'Cost Estimate', value: `₹${claim.estimated_cost_min?.toLocaleString('en-IN')}–₹${claim.estimated_cost_max?.toLocaleString('en-IN')}`, green: true },
            ].map((d) => (
              <div key={d.label} className="p-3 bg-[#F7FAFD] border border-[#E5E7EB] rounded-lg text-xs">
                <p className="text-[#9CA3AF]">{d.label}</p>
                <p className={`font-bold mt-0.5 ${d.green ? 'text-green-600 font-mono' : 'text-[#06244F]'}`}>{d.value}</p>
              </div>
            ))}
            <div className="p-3 bg-[#F7FAFD] border border-[#E5E7EB] rounded-lg text-xs">
              <p className="text-[#9CA3AF]">Reported Severity</p>
              <div className="mt-1"><SeverityBadge severity={claim.claimed_severity} /></div>
            </div>
          </div>
        </div>

        {/* Damage Viewer */}
        <div className="card space-y-3">
          <h2 className="text-sm font-bold text-[#06244F] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1268E8]" /> Computer Vision Segmentation Overlays
          </h2>
          <DamageViewer images={claim.images || []} detections={claim.detections || []} />
        </div>

        {/* Narrative + Cost */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="card space-y-4">
            <h3 className="text-sm font-bold text-[#06244F]">Policyholder Incident Narrative</h3>
            <div className="p-4 bg-[#F7FAFD] border border-[#E5E7EB] rounded-lg text-sm text-[#374151] leading-relaxed italic">
              "{claim.claimed_description}"
            </div>
            <div className="border-t border-[#E5E7EB] pt-4 space-y-2 text-xs">
              {[
                { label: 'Policyholder', value: claim.user?.name || 'N/A' },
                { label: 'Email', value: claim.user?.email || 'N/A', mono: true },
                { label: 'License Plate', value: claim.vehicle_plate, mono: true },
              ].map((d) => (
                <div key={d.label} className="flex justify-between">
                  <span className="text-[#9CA3AF]">{d.label}:</span>
                  <span className={`text-[#374151] font-medium ${d.mono ? 'font-mono' : ''}`}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#06244F]">Itemized Repair Cost</h3>
              <span className="font-mono text-xs font-bold text-green-600">₹{claim.estimated_cost_min?.toLocaleString('en-IN')}–₹{claim.estimated_cost_max?.toLocaleString('en-IN')}</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {!claim.detections?.length ? (
                <p className="text-xs text-[#9CA3AF] italic">No localized damages detected.</p>
              ) : claim.detections?.map((det, i) => (
                <div key={det.id || i} className="flex items-center justify-between p-3 bg-[#F7FAFD] border border-[#E5E7EB] rounded-lg text-xs">
                  <div>
                    <p className="font-semibold text-[#06244F]">{det.part}</p>
                    <p className="text-[11px] text-[#6B7280]">{det.damage_type} · {det.severity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-green-600">₹{det.cost_min?.toLocaleString('en-IN')}–₹{det.cost_max?.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{Math.round((det.confidence || 0.9) * 100)}% confidence</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Officer Decision */}
        <div className="card border-[#1268E8]/20 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#EAF4FF] flex items-center justify-center"><ShieldCheck className="w-4.5 h-4.5 text-[#1268E8]" style={{ width: '18px', height: '18px' }} /></div>
              <div>
                <h3 className="text-sm font-bold text-[#06244F]">Officer Decision Console</h3>
                <p className="text-xs text-[#6B7280]">Override AI verdict or assign claim status</p>
              </div>
            </div>
            {claim.override_by && (
              <div className="text-right text-xs">
                <span className="text-[#1268E8] font-semibold">Last by: {claim.override_by}</span>
                <p className="text-[#9CA3AF]">{claim.override_at ? new Date(claim.override_at).toLocaleString('en-IN') : ''}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveOverride} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="input-label">Claim Status Decision</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { id: 'Approved', label: 'Approve Claim' },
                    { id: 'Pending', label: 'Under Investigation' },
                    { id: 'Rejected', label: 'Reject Claim' },
                    { id: 'Info Requested', label: 'Request Info' },
                  ].map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setStatus(opt.id)}
                      className={`p-3 rounded-lg border text-xs font-semibold text-left transition-all ${
                        status === opt.id ? 'bg-[#EAF4FF] border-[#1268E8] text-[#06244F]' : 'bg-[#F7FAFD] border-[#E5E7EB] text-[#6B7280] hover:border-[#1268E8]/50'
                      }`}>
                      <div className="flex items-center justify-between">
                        <span>{opt.label}</span>
                        {status === opt.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#1268E8]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="input-label">Verdict Override</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { id: 'Match', label: 'Match' },
                    { id: 'Partial Match', label: 'Partial Match' },
                    { id: 'Discrepancy', label: 'Discrepancy' },
                    { id: 'Flagged', label: 'Flagged (Fraud)' },
                  ].map((opt) => (
                    <button key={opt.id} type="button" onClick={() => setOverrideVerdict(opt.id)}
                      className={`p-3 rounded-lg border text-xs font-semibold text-left transition-all ${
                        overrideVerdict === opt.id ? 'bg-[#EAF4FF] border-[#1268E8] text-[#06244F]' : 'bg-[#F7FAFD] border-[#E5E7EB] text-[#6B7280] hover:border-[#1268E8]/50'
                      }`}>
                      <div className="flex items-center justify-between">
                        <span>{opt.label}</span>
                        {overrideVerdict === opt.id && <CheckCircle2 className="w-3.5 h-3.5 text-[#1268E8]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="input-label flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-[#1268E8]" /> Officer Determination Notes</label>
              <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Enter formal justification, reason for override, or additional instructions..."
                className="input-field min-h-[80px] resize-y mt-1" />
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={savingOverride} className="btn-primary">
                <Save className="w-4 h-4" />
                {savingOverride ? 'Saving...' : 'Commit Decision'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
