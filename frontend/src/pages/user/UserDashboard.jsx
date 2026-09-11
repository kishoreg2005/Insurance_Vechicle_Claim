import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  History,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldAlert,
  Shield,
  ArrowRight,
  Car,
  TrendingUp,
  Sparkles,
  Info,
  ShieldCheck,
  Calendar,
  RotateCw,
  Zap,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import StatusBadge, { VerdictBadge, CostBadge } from '../../components/StatusBadge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { subscribeToPolicyRTDB, savePolicyToRTDB } from '../../services/realtimeDb';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/policy/purchase', label: 'Annual Policy', icon: ShieldCheck },
  { to: '/claims/new', label: 'Submit New Claim', icon: FilePlus },
  { to: '/claims', label: 'Claim History', icon: History },
];

function StatCard({ icon: Icon, label, value, subtext, color, borderColor }) {
  return (
    <div className={`bg-slate-900/90 border ${borderColor || 'border-slate-800'} rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-extrabold text-white mt-1 tracking-tight">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shadow-inner`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load Policy from Realtime DB or LocalStorage
  useEffect(() => {
    // 1. Initial local storage check
    const stored = localStorage.getItem('active_policy');
    if (stored) {
      try {
        setPolicy(JSON.parse(stored));
      } catch {}
    }

    // 2. Realtime subscription to policy
    let unsubscribePolicy = () => {};
    if (user?.uid || user?.id) {
      unsubscribePolicy = subscribeToPolicyRTDB(user.uid || user.id, (rtdbPolicy) => {
        if (rtdbPolicy) {
          setPolicy(rtdbPolicy);
          localStorage.setItem('active_policy', JSON.stringify(rtdbPolicy));
        }
      });
    }

    // 3. Fetch Claims and backend fallback
    Promise.all([
      api.get('/user/claims?limit=20').catch(() => ({ data: { items: [] } })),
      api.get('/user/policy').catch(() => ({ data: { has_policy: false } }))
    ])
      .then(([resClaims, resPolicy]) => {
        setClaims(resClaims.data.items || []);
        if (resPolicy.data && resPolicy.data.has_policy && resPolicy.data.policy) {
          setPolicy((prev) => prev || resPolicy.data.policy);
        } else if (!stored) {
          // Default seeded fallback policy if neither RTDB nor backend has one
          const defaultPolicy = {
            policy_number: 'POL-2026-8821',
            vehicle_type: 'Sedan',
            vehicle_model: 'Hyundai i20 Asta',
            vehicle_plate: 'KA-01-MJ-8821',
            coverage_type: 'Comprehensive Zero-Dep',
            coverage_amount: '₹ 8,50,000',
            annual_premium: 18500,
            monthly_instalment: 1650,
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            validity_days: 365,
            status: 'Active'
          };
          setPolicy((prev) => prev || defaultPolicy);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch dashboard data:', err);
      })
      .finally(() => setLoading(false));

    return () => unsubscribePolicy();
  }, [user]);

  // Handle Policy 1-Year Renewal
  const handleRenewPolicy = async () => {
    if (!policy) return;
    setRenewing(true);
    try {
      const currentEnd = policy.end_date ? new Date(policy.end_date) : new Date();
      const newExpiry = new Date(currentEnd);
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);

      const renewedPolicy = {
        ...policy,
        end_date: newExpiry.toISOString(),
        status: 'Active',
        renewed_at: new Date().toISOString(),
        validity_days: 365
      };

      setPolicy(renewedPolicy);
      localStorage.setItem('active_policy', JSON.stringify(renewedPolicy));

      if (user?.uid || user?.id) {
        await savePolicyToRTDB(user.uid || user.id, renewedPolicy);
      }

      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
      toast.success(`Policy #${policy.policy_number} renewed successfully for 1 additional year!`, { icon: '🔄' });
      setShowRenewalModal(false);
    } catch (err) {
      toast.error('Renewal failed. Please try again.');
    } finally {
      setRenewing(false);
    }
  };

  const totalCount = claims.length;
  const pendingCount = claims.filter((c) => (c.status || '').toLowerCase() === 'pending').length;
  const approvedCount = claims.filter((c) => (c.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = claims.filter((c) => (c.status || '').toLowerCase() === 'rejected').length;
  const totalCostEstimated = claims.reduce((sum, c) => sum + (c.estimated_cost_max || 0), 0);

  // Calculate Days Remaining in Current 1-Year Policy
  const calculateDaysRemaining = () => {
    if (!policy?.end_date) return 365;
    const diffTime = new Date(policy.end_date) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  const daysRemaining = calculateDaysRemaining();
  const validityPercent = Math.min(100, Math.max(0, Math.round((daysRemaining / 365) * 100)));

  if (loading) {
    return (
      <Layout navItems={navItems} title="Policyholder Portal">
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading your claims overview...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout navItems={navItems} title="Policyholder Portal">
      <div className="space-y-8">
        {/* Welcome & Action Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-primary-950 via-slate-900 to-blue-950 border border-primary-800/40 p-6 md:p-8 shadow-2xl overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> AI Automated Damage Verification Active
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Policyholder Claims Dashboard
              </h1>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                Submit damaged vehicle photos to receive instant computer-vision damage segmentation, cross-check verification against your reported damage, and certified assessment reports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/claims/new"
                className="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-semibold shadow-lg shadow-primary-600/30 transition-all duration-200 shrink-0 group text-sm"
              >
                <FilePlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Submit Accident Claim</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* END-TO-END INSURANCE LIFECYCLE FLOWCARD */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-400" />
                Full End-to-End Motor Insurance Lifecycle
              </h2>
              <p className="text-[11px] text-slate-400">
                How your annual policy and AI accident claim assessment operate continuously through the year
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Active Protocol: v2.4
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-1">
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
                <span>01</span>
                <Shield className="w-3.5 h-3.5 text-primary-400" />
              </div>
              <p className="text-xs font-bold text-white mt-2">Policy Purchase</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Annual coverage chosen</p>
            </div>

            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-400 text-[10px] font-bold">
                <span>02</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-emerald-300 mt-2">Policy Active</p>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">1-Year continuous protection</p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
                <span>03</span>
                <Car className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-xs font-bold text-white mt-2">Accident Incident</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Upload damage photos</p>
            </div>

            <div className="p-3 bg-primary-500/10 rounded-2xl border border-primary-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-primary-400 text-[10px] font-bold">
                <span>04</span>
                <Zap className="w-3.5 h-3.5 text-primary-400" />
              </div>
              <p className="text-xs font-bold text-primary-300 mt-2">AI Assessment</p>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">Parts, severity & cost</p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
                <span>05</span>
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-xs font-bold text-white mt-2">Consistency %</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">🟢 Auto / 🟡 Review / 🔴 Flag</p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
                <span>06</span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <p className="text-xs font-bold text-white mt-2">Surveyor Review</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Approve / Adjust / Reject</p>
            </div>

            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-400 text-[10px] font-bold">
                <span>07</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-emerald-300 mt-2">Settlement Paid</p>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-tight">Policy continues till expiry</p>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
                <span>08</span>
                <RotateCw className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="text-xs font-bold text-white mt-2">Renewal</p>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">New policy year begins</p>
            </div>
          </div>
        </div>

        {/* ACTIVE POLICY & VALIDITY CARD */}
        {policy ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-primary-600/20 text-primary-400 rounded-2xl border border-primary-500/30 shadow-inner">
                  <Car className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-white tracking-tight">
                      Active Policy: {policy.vehicle_model}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {policy.status || 'Active'} (1-Year Validity)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Policy #{policy.policy_number} · Plate: <span className="font-mono text-white font-bold">{policy.vehicle_plate}</span> · Tier: <span className="text-primary-400 font-semibold">{policy.coverage_type}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5 text-primary-400" />
                  <span>Renew (+1 Year)</span>
                </button>
                <Link
                  to="/policy/purchase"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border border-primary-500/30 text-xs font-semibold transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Manage / Upgrade</span>
                </Link>
              </div>
            </div>

            {/* Validity Progress Bar */}
            <div className="mt-5 p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300 font-semibold">1-Year Term Validity</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white font-mono">{daysRemaining} Days Remaining</span>
                  <span className="text-slate-400 text-[10px] block">
                    Valid till {policy.end_date ? new Date(policy.end_date).toLocaleDateString() : 'Next Year'}
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-primary-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${validityPercent}%` }}
                />
              </div>
            </div>

            {/* Premium Display Row */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Annual Premium Paid
                  </p>
                  <p className="text-xl font-extrabold text-white tracking-tight mt-0.5 font-mono">
                    ₹{Number(policy.annual_premium || 18500).toLocaleString('en-IN')} / year
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-slate-300 text-xs font-semibold">
                  1 Year Term
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between relative">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Max Insured Declared Value (IDV)
                  </p>
                  <p className="text-xl font-extrabold text-emerald-400 tracking-tight mt-0.5 font-mono">
                    {policy.coverage_amount || '₹ 8,50,000'}
                  </p>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Full Coverage
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-primary-500/30 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Action Required
              </span>
              <h2 className="text-lg font-bold text-white mt-1">No Active Annual Policy Found</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Purchase an annual motor policy (1-year validity) to enable automated AI damage claims assessment.
              </p>
            </div>
            <Link
              to="/policy/purchase"
              className="px-5 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary-600/30 flex items-center gap-2 shrink-0 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Purchase Annual Policy</span>
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Total Claims"
            value={totalCount}
            subtext="All submitted claims"
            color="bg-primary-500/15 text-primary-400"
            borderColor="border-slate-800"
          />
          <StatCard
            icon={Clock}
            label="Pending Review"
            value={pendingCount}
            subtext="Awaiting officer authorization"
            color="bg-amber-500/15 text-amber-400"
            borderColor="border-amber-500/20"
          />
          <StatCard
            icon={CheckCircle2}
            label="Approved & Settled"
            value={approvedCount}
            subtext="Settlement paid · Policy active"
            color="bg-emerald-500/15 text-emerald-400"
            borderColor="border-emerald-500/20"
          />
          <StatCard
            icon={TrendingUp}
            label="Est. Liability"
            value={`₹${Math.round(totalCostEstimated).toLocaleString('en-IN')}`}
            subtext="Estimated total repair payout"
            color="bg-blue-500/15 text-blue-400"
            borderColor="border-blue-500/20"
          />
        </div>

        {/* Recent Claims Table Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Recent Claims Assessment</h2>
              <p className="text-xs text-slate-400">View real-time status, AI consistency verdict, and settlement notes</p>
            </div>
            <Link
              to="/claims"
              className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
            >
              View Full History <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {claims.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Car className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-base font-semibold text-white">No accident claims filed yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
                If an accident happens during your active policy year, upload photos to receive instant AI damage segmentation & repair cost verification.
              </p>
              <Link
                to="/claims/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <FilePlus className="w-4 h-4" />
                Submit Accident Claim
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-5">Claim ID</th>
                    <th className="py-3 px-5">Vehicle</th>
                    <th className="py-3 px-5">Claimed Part</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">AI Consistency Verdict</th>
                    <th className="py-3 px-5">Estimated Cost</th>
                    <th className="py-3 px-5">Date</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {claims.slice(0, 8).map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs font-bold text-primary-400">
                        {claim.claim_number}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-medium text-white">{claim.vehicle_model}</div>
                        <div className="text-[11px] font-mono text-slate-400">{claim.vehicle_plate}</div>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-200">
                        {claim.claimed_part}
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={claim.status} />
                      </td>
                      <td className="py-3.5 px-5">
                        <VerdictBadge verdict={claim.verdict} matchScore={claim.match_score} />
                      </td>
                      <td className="py-3.5 px-5">
                        <CostBadge costMin={claim.estimated_cost_min} costMax={claim.estimated_cost_max} />
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                        {new Date(claim.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          to={`/claims/${claim.id}`}
                          className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                        >
                          View Detail <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RENEWAL MODAL */}
        {showRenewalModal && policy && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150 text-left relative">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-600/20 text-primary-400 rounded-2xl border border-primary-500/30">
                  <RotateCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Annual Policy Renewal</h3>
                  <p className="text-xs text-slate-400">Policy #{policy.policy_number} · {policy.vehicle_model}</p>
                </div>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Expiry:</span>
                  <span className="text-slate-200 font-mono">{new Date(policy.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">New Renewal Expiry (+1 Year):</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {new Date(new Date(policy.end_date).setFullYear(new Date(policy.end_date).getFullYear() + 1)).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Annual Renewal Premium:</span>
                  <span className="text-white font-mono font-bold">₹{Number(policy.annual_premium).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Renewing your policy ensures uninterrupted AI damage claims coverage, zero deductible benefits, and roadside assistance for the next 365 days.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRenewPolicy}
                  disabled={renewing}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-primary-600 hover:from-emerald-500 hover:to-primary-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  {renewing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Renewing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm 1-Year Renewal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
