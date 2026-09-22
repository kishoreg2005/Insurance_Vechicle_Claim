import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, History, Clock, CheckCircle2,
  Shield, ArrowRight, Car, Sparkles, ShieldCheck, Calendar,
  RotateCw, Zap, CheckCircle, Search, Gavel, Edit3, X, Save,
  FileText, TrendingUp, AlertCircle, ChevronRight, Bell, Activity
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

function StatCard({ icon: Icon, label, value, color, bg, sub, alert }) {
  return (
    <div className={`stat-card flex items-center gap-4 group hover:shadow-md transition-all cursor-default ${alert ? 'border-amber-200 bg-amber-50' : 'hover:border-[#1268E8]/20'}`}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform" style={{ background: bg }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-black text-[#06244F] mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-[#9CA3AF] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, sub, to, color, bg, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-[#E5E7EB] hover:border-[#1268E8]/30 hover:bg-[#F7FAFD] hover:shadow-sm transition-all text-center group cursor-pointer"
    >
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform" style={{ background: bg }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <span className="text-xs font-bold text-[#374151] block">{label}</span>
        <span className="text-[10px] text-[#9CA3AF]">{sub}</span>
      </div>
    </Link>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    vehicle_model: '', vehicle_plate: '', vehicle_type: 'Sedan',
    vehicle_year: '2024', chassis_number: '', fuel_type: 'Petrol'
  });

  useEffect(() => {
    const stored = localStorage.getItem('active_policy');
    const storedVeh = localStorage.getItem('registered_vehicle');
    let initialPolicy = null;
    if (stored) { try { initialPolicy = JSON.parse(stored); } catch {} }
    if (storedVeh) {
      try {
        const v = JSON.parse(storedVeh);
        const modelTitle = v.make ? `${v.make} ${v.model}`.trim() : (v.model || '');
        if (modelTitle || v.plate) {
          initialPolicy = {
            ...(initialPolicy || {}),
            vehicle_model: modelTitle || initialPolicy?.vehicle_model || 'Registered Vehicle',
            vehicle_plate: (v.plate || initialPolicy?.vehicle_plate || 'N/A').toUpperCase(),
            vehicle_type: v.type || initialPolicy?.vehicle_type || 'Sedan',
            vehicle_year: v.year || initialPolicy?.vehicle_year || '2024',
            chassis_number: v.chassis || initialPolicy?.chassis_number || 'N/A',
            fuel_type: v.fuel || initialPolicy?.fuel_type || 'Petrol',
          };
        }
      } catch {}
    }
    if (initialPolicy) setPolicy(initialPolicy);

    let unsubscribePolicy = () => {};
    if (user?.uid || user?.id) {
      unsubscribePolicy = subscribeToPolicyRTDB(user.uid || user.id, (rtdbPolicy) => {
        if (rtdbPolicy) {
          setPolicy((prev) => {
            const merged = { ...rtdbPolicy };
            if (storedVeh) {
              try {
                const v = JSON.parse(storedVeh);
                const title = v.make ? `${v.make} ${v.model}`.trim() : v.model;
                if (title) merged.vehicle_model = title;
                if (v.plate) merged.vehicle_plate = v.plate.toUpperCase();
                if (v.type) merged.vehicle_type = v.type;
                if (v.year) merged.vehicle_year = v.year;
                if (v.chassis) merged.chassis_number = v.chassis;
                if (v.fuel) merged.fuel_type = v.fuel;
              } catch {}
            }
            localStorage.setItem('active_policy', JSON.stringify(merged));
            return merged;
          });
        }
      });
    }

    Promise.all([
      api.get('/user/claims?limit=20').catch(() => ({ data: { items: [] } })),
      api.get('/user/policy').catch(() => ({ data: { has_policy: false } }))
    ]).then(([resClaims, resPolicy]) => {
      setClaims(resClaims.data.items || []);
      if (resPolicy.data?.has_policy && resPolicy.data?.policy) {
        setPolicy((prev) => {
          if (prev?.vehicle_model && prev?.vehicle_model !== 'Hyundai i20 Asta' && prev?.vehicle_model !== 'Vehicle') {
            return { ...resPolicy.data.policy, ...prev };
          }
          return prev || resPolicy.data.policy;
        });
      } else if (!initialPolicy) {
        setPolicy({
          policy_number: 'POL-2026-8821', vehicle_type: 'Sedan',
          vehicle_model: 'Registered Vehicle', vehicle_plate: 'KA-01-MJ-8821',
          coverage_type: 'Comprehensive Zero-Dep', coverage_amount: '₹ 8,50,000',
          annual_premium: 18500, monthly_instalment: 1650,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'Active'
        });
      }
    }).catch(console.error).finally(() => setLoading(false));

    return () => unsubscribePolicy();
  }, [user]);

  const handleOpenEditModal = () => {
    setEditForm({
      vehicle_model: policy?.vehicle_model || '',
      vehicle_plate: policy?.vehicle_plate || '',
      vehicle_type: policy?.vehicle_type || 'Sedan',
      vehicle_year: policy?.vehicle_year || '2024',
      chassis_number: policy?.chassis_number || '',
      fuel_type: policy?.fuel_type || 'Petrol'
    });
    setShowEditModal(true);
  };

  const handleSaveVehicleDetails = async (e) => {
    e.preventDefault();
    if (!editForm.vehicle_model.trim()) { toast.error('Vehicle make and model are required'); return; }
    if (!editForm.vehicle_plate.trim()) { toast.error('Vehicle registration plate is required'); return; }
    setSavingEdit(true);
    try {
      const updatedPolicy = {
        ...(policy || {}),
        vehicle_model: editForm.vehicle_model.trim(),
        vehicle_plate: editForm.vehicle_plate.trim().toUpperCase(),
        vehicle_type: editForm.vehicle_type || 'Sedan',
        vehicle_year: editForm.vehicle_year || '2024',
        chassis_number: editForm.chassis_number.trim() || 'N/A',
        fuel_type: editForm.fuel_type || 'Petrol',
        policy_number: policy?.policy_number || `POL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: policy?.status || 'Active',
        coverage_type: policy?.coverage_type || 'Comprehensive Zero-Dep',
        coverage_amount: policy?.coverage_amount || '₹ 8,50,000',
        annual_premium: policy?.annual_premium || 18500,
        end_date: policy?.end_date || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      };
      setPolicy(updatedPolicy);
      localStorage.setItem('active_policy', JSON.stringify(updatedPolicy));
      localStorage.setItem('registered_vehicle', JSON.stringify({
        model: editForm.vehicle_model.trim(), plate: editForm.vehicle_plate.trim().toUpperCase(),
        type: editForm.vehicle_type, year: editForm.vehicle_year,
        chassis: editForm.chassis_number.trim(), fuel: editForm.fuel_type
      }));
      if (user?.uid || user?.id) await savePolicyToRTDB(user.uid || user.id, updatedPolicy);
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      toast.success('Vehicle details updated!', { icon: '🚗' });
      setShowEditModal(false);
    } catch { toast.error('Failed to update. Please try again.'); }
    finally { setSavingEdit(false); }
  };

  const handleRenewPolicy = async () => {
    if (!policy) return;
    setRenewing(true);
    try {
      const currentEnd = policy.end_date ? new Date(policy.end_date) : new Date();
      const newExpiry = new Date(currentEnd);
      newExpiry.setFullYear(newExpiry.getFullYear() + 1);
      const renewedPolicy = { ...policy, end_date: newExpiry.toISOString(), status: 'Active', renewed_at: new Date().toISOString() };
      setPolicy(renewedPolicy);
      localStorage.setItem('active_policy', JSON.stringify(renewedPolicy));
      if (user?.uid || user?.id) await savePolicyToRTDB(user.uid || user.id, renewedPolicy);
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
      toast.success(`Policy renewed for 1 year!`, { icon: '🔄' });
      setShowRenewalModal(false);
    } catch { toast.error('Renewal failed. Please try again.'); }
    finally { setRenewing(false); }
  };

  const totalCount = claims.length;
  const pendingCount = claims.filter((c) => (c.status || '').toLowerCase() === 'pending').length;
  const approvedCount = claims.filter((c) => (c.status || '').toLowerCase() === 'approved').length;

  const calculateDaysRemaining = () => {
    if (!policy?.end_date) return 365;
    const diffDays = Math.ceil((new Date(policy.end_date) - new Date()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  const daysRemaining = calculateDaysRemaining();
  const policyEndFormatted = policy?.end_date
    ? new Date(policy.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <Layout navItems={navItems} title="Dashboard">
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <div className="w-8 h-8 border-3 border-[#1268E8]/20 border-t-[#1268E8] rounded-full animate-spin" style={{ borderWidth: '3px' }} />
          <p className="text-sm text-[#6B7280]">Loading your dashboard…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout navItems={navItems} title="Dashboard">
      <div className="space-y-6 fade-in">

        {/* ── Welcome Banner ── */}
        <div className="page-banner flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[#93C5FD] text-sm font-medium mb-0.5">{greeting()},</p>
            <h1 className="text-2xl font-black text-white">{user?.name?.split(' ')[0] || 'Policyholder'}</h1>
            <p className="text-[#BAD4F9] text-sm mt-1">Here's your insurance overview.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link to="/claims/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1268E8] hover:bg-[#0f58d4] text-white font-semibold text-sm transition-all shadow-sm">
              <FilePlus className="w-4 h-4" /> Submit New Claim <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/claims" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-all">
              <History className="w-4 h-4 text-[#93C5FD]" /> My Claims
            </Link>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="Total Claims" value={totalCount} color="#1268E8" bg="#EAF4FF" sub="All time" />
          <StatCard icon={Clock} label="Pending Review" value={pendingCount} color="#D97706" bg="#FFFBEB" sub="Awaiting officer" />
          <StatCard icon={CheckCircle2} label="Approved" value={approvedCount} color="#059669" bg="#ECFDF5" sub="Settled claims" />
          <StatCard
            icon={Calendar} label="Renewal Due" value={`${daysRemaining}d`}
            color={daysRemaining <= 30 ? '#D97706' : '#7C3AED'}
            bg={daysRemaining <= 30 ? '#FFFBEB' : '#F5F3FF'}
            sub={`Expires ${policyEndFormatted}`}
            alert={daysRemaining <= 30}
          />
        </div>

        {/* ── Quick Actions ── */}
        <div className="card">
          <h2 className="text-sm font-bold text-[#06244F] mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#1268E8]" /> Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickAction label="New Claim" sub="Submit damage claim" icon={FilePlus} to="/claims/new" color="#1268E8" bg="#EAF4FF" />
            <QuickAction label="View Policy" sub="Manage coverage" icon={ShieldCheck} to="/policy/purchase" color="#059669" bg="#ECFDF5" />
            <QuickAction label="Track Claim" sub="Real-time status" icon={Search} to="/claims" color="#D97706" bg="#FFFBEB" />
            <QuickAction label="Renew Policy" sub="Extend coverage" icon={RotateCw} to="#" color="#7C3AED" bg="#F5F3FF" onClick={(e) => { e.preventDefault(); setShowRenewalModal(true); }} />
          </div>
        </div>

        {/* ── Active Policy Card ── */}
        {policy ? (
          <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#EAF4FF] flex items-center justify-center flex-shrink-0">
                  <Car className="w-5 h-5 text-[#1268E8]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-[#06244F]">{policy.vehicle_model || 'Registered Vehicle'}</h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {policy.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Policy <span className="font-mono font-semibold text-[#374151]">#{policy.policy_number}</span>
                    <span className="mx-1.5">·</span>
                    Valid until <span className="font-medium text-[#374151]">{policyEndFormatted}</span>
                    <span className="mx-1.5">·</span>
                    <span className="text-[#1268E8] font-semibold">{daysRemaining} days left</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={handleOpenEditModal} className="btn-secondary text-xs py-1.5 px-3">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <Link to="/policy/purchase" className="btn-outline text-xs py-1.5 px-3">
                  <ShieldCheck className="w-3.5 h-3.5" /> Policy
                </Link>
                <button type="button" onClick={() => setShowRenewalModal(true)} className="btn-primary text-xs py-1.5 px-3">
                  <RotateCw className="w-3.5 h-3.5" /> Renew
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Registration', value: policy.vehicle_plate || 'N/A', mono: true },
                { label: 'Vehicle Type', value: policy.vehicle_type || 'Sedan' },
                { label: 'Model Year', value: policy.vehicle_year || '2024' },
                { label: 'Fuel Type', value: policy.fuel_type || 'Petrol' },
                { label: 'Chassis / VIN', value: policy.chassis_number || 'N/A', mono: true, truncate: true },
                { label: 'Coverage IDV', value: policy.coverage_amount || '₹ 8,50,000', highlight: true },
              ].map((d) => (
                <div key={d.label} className="bg-[#F7FAFD] rounded-xl border border-[#E5E7EB] p-3">
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">{d.label}</p>
                  <p className={`text-sm font-bold truncate ${d.mono ? 'font-mono text-amber-600' : d.highlight ? 'text-green-600' : 'text-[#06244F]'}`} title={d.value}>
                    {d.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card border-[#1268E8]/20 bg-[#F4F9FF]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="badge-orange mb-2">Action Required</span>
                <h2 className="text-base font-bold text-[#06244F]">No Active Policy Found</h2>
                <p className="text-sm text-[#6B7280] mt-0.5">Purchase an annual policy to enable AI damage claim assessments.</p>
              </div>
              <Link to="/policy/purchase" className="btn-primary flex-shrink-0">
                <Shield className="w-4 h-4" /> Purchase Policy
              </Link>
            </div>
          </div>
        )}

        {/* ── Recent Claims ── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#06244F] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1268E8]" /> Recent Claims
            </h2>
            <Link to="/claims" className="text-xs font-semibold text-[#1268E8] hover:text-[#0f58d4] flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {claims.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#F7FAFD] border border-[#E5E7EB] flex items-center justify-center mx-auto">
                <FileText className="w-5 h-5 text-[#9CA3AF]" />
              </div>
              <p className="text-sm font-semibold text-[#06244F]">No Claims Found</p>
              <p className="text-xs text-[#6B7280]">You currently have no submitted claims.</p>
              <Link to="/claims/new" className="btn-primary text-xs mt-3 inline-flex">
                <FilePlus className="w-3.5 h-3.5" /> Submit New Claim
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Vehicle</th>
                    <th>Damage</th>
                    <th>Status</th>
                    <th>AI Verdict</th>
                    <th>Cost Estimate</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.slice(0, 5).map((claim) => (
                    <tr key={claim.id}>
                      <td className="font-mono font-bold text-[#1268E8] text-xs">{claim.claim_number}</td>
                      <td>
                        <div className="font-semibold text-[#06244F] text-xs">{claim.vehicle_model}</div>
                        <div className="text-[10px] font-mono text-[#9CA3AF]">{claim.vehicle_plate}</div>
                      </td>
                      <td className="text-xs font-medium text-[#374151]">{claim.claimed_part}</td>
                      <td><StatusBadge status={claim.status} /></td>
                      <td><VerdictBadge verdict={claim.verdict} matchScore={claim.match_score} /></td>
                      <td><CostBadge costMin={claim.estimated_cost_min} costMax={claim.estimated_cost_max} /></td>
                      <td className="text-right">
                        <Link to={`/claims/${claim.id}`} className="inline-flex items-center gap-1 text-[#1268E8] hover:text-blue-700 font-semibold text-xs">
                          View <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Claim Lifecycle ── */}
        <div className="card">
          <h2 className="text-sm font-bold text-[#06244F] mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#1268E8]" /> Claim Assessment Lifecycle
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { step: '01', label: 'Policy Active', desc: 'Annual coverage in effect', icon: CheckCircle2, active: true, color: '#059669', bg: '#ECFDF5' },
              { step: '02', label: 'Accident Claim', desc: 'Upload damage photos', icon: Car, color: '#D97706', bg: '#FFFBEB' },
              { step: '03', label: 'AI Assessment', desc: 'Detect parts, severity & cost', icon: Zap, active: true, color: '#1268E8', bg: '#EAF4FF' },
              { step: '04', label: 'Verification', desc: 'Cross-check AI vs reported', icon: Search, color: '#6B7280', bg: '#F3F4F6' },
              { step: '05', label: 'Officer Review', desc: 'Approve, adjust or reject', icon: ShieldCheck, color: '#D97706', bg: '#FFFBEB' },
              { step: '06', label: 'Decision', desc: 'Final settlement amount', icon: Gavel, color: '#6B7280', bg: '#F3F4F6' },
            ].map(({ step, label, desc, icon: Icon, active, color, bg }) => (
              <div key={step} className={`p-3 rounded-xl border ${active ? 'border-[#1268E8]/20 bg-[#F4F9FF]' : 'border-[#E5E7EB] bg-[#F7FAFD]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black" style={{ color }}>{step}</span>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                </div>
                <p className="text-xs font-bold text-[#06244F]">{label}</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5 leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Edit Vehicle Modal ── */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl p-6 max-w-lg w-full space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="text-base font-bold text-[#06244F]">Edit Vehicle Details</h3>
                  <p className="text-xs text-[#6B7280]">Update vehicle model, plate, or chassis details</p>
                </div>
                <button type="button" onClick={() => setShowEditModal(false)} className="p-1.5 rounded-xl text-[#6B7280] hover:bg-[#F4F9FF]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveVehicleDetails} className="space-y-4">
                <div>
                  <label className="input-label">Vehicle Make & Model *</label>
                  <input type="text" required placeholder="e.g. Maruti Swift, Hyundai Creta"
                    value={editForm.vehicle_model} onChange={(e) => setEditForm({ ...editForm, vehicle_model: e.target.value })}
                    className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Registration Plate *</label>
                    <input type="text" required placeholder="e.g. KA-05-NB-1234"
                      value={editForm.vehicle_plate} onChange={(e) => setEditForm({ ...editForm, vehicle_plate: e.target.value.toUpperCase() })}
                      className="input-field font-mono uppercase" />
                  </div>
                  <div>
                    <label className="input-label">Vehicle Category</label>
                    <select value={editForm.vehicle_type} onChange={(e) => setEditForm({ ...editForm, vehicle_type: e.target.value })} className="select-field">
                      {['Sedan', 'SUV / Crossover', 'Hatchback', 'Electric Vehicle', 'Luxury / Sport', 'Two-Wheeler'].map(t => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="input-label">Model Year</label>
                    <input type="text" maxLength={4} placeholder="2024"
                      value={editForm.vehicle_year} onChange={(e) => setEditForm({ ...editForm, vehicle_year: e.target.value })}
                      className="input-field" />
                  </div>
                  <div className="col-span-2">
                    <label className="input-label">Chassis / VIN</label>
                    <input type="text" placeholder="e.g. MALC251CL094821"
                      value={editForm.chassis_number} onChange={(e) => setEditForm({ ...editForm, chassis_number: e.target.value.toUpperCase() })}
                      className="input-field font-mono uppercase" />
                  </div>
                </div>
                <div>
                  <label className="input-label">Fuel Type</label>
                  <select value={editForm.fuel_type} onChange={(e) => setEditForm({ ...editForm, fuel_type: e.target.value })} className="select-field">
                    {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" disabled={savingEdit} className="btn-primary">
                    {savingEdit ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Details</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Renewal Modal ── */}
        {showRenewalModal && policy && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#E5E7EB]">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF4FF] flex items-center justify-center">
                  <RotateCw className="w-5 h-5 text-[#1268E8]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#06244F]">Annual Policy Renewal</h3>
                  <p className="text-xs text-[#6B7280]">Policy #{policy.policy_number} · {policy.vehicle_model}</p>
                </div>
              </div>
              <div className="bg-[#F7FAFD] rounded-xl border border-[#E5E7EB] p-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Current Expiry</span>
                  <span className="font-mono font-medium text-[#374151]">{new Date(policy.end_date).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">New Expiry (+1 Year)</span>
                  <span className="font-mono font-bold text-green-600">
                    {new Date(new Date(policy.end_date).setFullYear(new Date(policy.end_date).getFullYear() + 1)).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E5E7EB]">
                  <span className="text-[#6B7280]">Annual Premium</span>
                  <span className="font-mono font-bold text-[#06244F]">₹{Number(policy.annual_premium).toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowRenewalModal(false)} className="btn-ghost">Cancel</button>
                <button type="button" onClick={handleRenewPolicy} disabled={renewing} className="btn-primary">
                  {renewing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Renewing…</> : <><CheckCircle className="w-4 h-4" /> Confirm Renewal</>}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
