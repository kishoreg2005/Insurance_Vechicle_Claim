import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Sliders,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  FileText,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  DollarSign,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import Layout from '../../components/Layout';
import StatusBadge, { VerdictBadge, CostBadge } from '../../components/StatusBadge';
import api from '../../services/api';
import { subscribeToLiveActivities } from '../../services/realtimeDb';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/claims', label: 'Claims Review', icon: ClipboardList },
  { to: '/admin/rules', label: 'Cost & Severity Rules', icon: Sliders },
  { to: '/admin/users', label: 'Policyholders', icon: Users },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function StatCard({ icon: Icon, label, value, subtext, color, borderColor, highlight }) {
  return (
    <div
      className={`bg-slate-900/90 border ${
        highlight ? 'border-rose-500/50 shadow-lg shadow-rose-500/10' : borderColor || 'border-slate-800'
      } rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
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

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentClaims, setRecentClaims] = useState([]);
  const [liveActivities, setLiveActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics?days=30'),
      api.get('/admin/claims?limit=8'),
    ])
      .then(([resAnalytics, resClaims]) => {
        setAnalytics(resAnalytics.data);
        setRecentClaims(resClaims.data.items || []);
      })
      .catch((err) => console.error('Failed to load admin analytics:', err))
      .finally(() => setLoading(false));

    // Listen to Firebase RTDB live activities
    const unsubActivities = subscribeToLiveActivities((activities) => {
      setLiveActivities(activities);
    });

    return () => unsubActivities();
  }, []);

  if (loading) {
    return (
      <Layout navItems={navItems} title="Insurance Officer Console">
        <div className="flex flex-col items-center justify-center py-28 gap-4">
          <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading claims analytics & telemetry...</p>
        </div>
      </Layout>
    );
  }

  const kpis = analytics?.kpis || {};
  const timelineData = analytics?.claims_timeline || [];
  const statusData = (analytics?.claims_by_status || []).map((s) => ({
    name: s.status,
    value: s.count,
    color: s.color,
  }));
  const damageTypeData = analytics?.damage_type_distribution || [];
  const costBracketData = analytics?.cost_bracket_distribution || [];
  const recentFlagged = analytics?.recent_flagged_claims || [];

  return (
    <Layout navItems={navItems} title="Insurance Officer Console">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> AI Neural Verification Engine Operational
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Insurance Officer Command Console
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Review AI damage assessments, resolve cross-check discrepancies, and manage claims pipeline
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/claims?verdict=Flagged"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-all shadow-sm shadow-rose-500/10"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Review {kpis.flagged_count || 0} Flagged Claims</span>
            </Link>
          </div>
        </div>

        {/* Firebase Realtime Activity Stream */}
        {liveActivities.length > 0 && (
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Realtime Activity Stream</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                    Firebase RTDB Live
                  </span>
                </p>
                <p className="text-xs text-slate-300">
                  {liveActivities[0].message} • <span className="text-slate-500">{new Date(liveActivities[0].timestamp).toLocaleTimeString()}</span>
                </p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              {liveActivities.length} recent real-time event{liveActivities.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* 6 Key Performance Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatCard
            icon={FileText}
            label="Total Claims"
            value={kpis.total_claims || 0}
            subtext="Incurred to date"
            color="bg-primary-500/15 text-primary-400"
            borderColor="border-slate-800"
          />
          <StatCard
            icon={ShieldAlert}
            label="Flagged / Discrepancy"
            value={kpis.flagged_count || 0}
            subtext={`${kpis.flagged_percentage || 0}% mismatch rate`}
            color="bg-rose-500/15 text-rose-400"
            highlight={kpis.flagged_count > 0}
          />
          <StatCard
            icon={Clock}
            label="Pending Review"
            value={kpis.pending_count || 0}
            subtext="Requires sign-off"
            color="bg-amber-500/15 text-amber-400"
            borderColor="border-amber-500/20"
          />
          <StatCard
            icon={CheckCircle2}
            label="Approved"
            value={kpis.approved_count || 0}
            subtext="Settlement confirmed"
            color="bg-emerald-500/15 text-emerald-400"
            borderColor="border-emerald-500/20"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Liability"
            value={`$${Math.round(kpis.total_cost_estimated || 0).toLocaleString()}`}
            subtext="Est. upper repair bound"
            color="bg-blue-500/15 text-blue-400"
            borderColor="border-blue-500/20"
          />
          <StatCard
            icon={Activity}
            label="AI Inference"
            value={kpis.avg_processing_time || '2.4s'}
            subtext="Avg segmentation speed"
            color="bg-purple-500/15 text-purple-400"
            borderColor="border-purple-500/20"
          />
        </div>

        {/* Recharts Analytics Section */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Claims Timeline (30 Days) Area Chart */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Claims Ingestion & Discrepancy Timeline</h3>
                <p className="text-xs text-slate-400">Daily claim submissions vs flagged discrepancies (Last 30 Days)</p>
              </div>
              <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300">
                30-Day Window
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClaims" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="claims" name="Total Incurred" stroke="#3b82f6" fillOpacity={1} fill="url(#colorClaims)" />
                  <Area type="monotone" dataKey="flagged" name="Flagged Cases" stroke="#ef4444" fillOpacity={1} fill="url(#colorFlagged)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Breakdown Donut Chart */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Claims Status Distribution</h3>
              <p className="text-xs text-slate-400">Current workflow breakdown</p>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Damage Type Frequency Horizontal Bar */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Top Detected Damage Types</h3>
              <p className="text-xs text-slate-400">Frequency of computer vision classified damage</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={damageTypeData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="damage_type" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Occurrences" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Bracket Frequency */}
          <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Repair Cost Range Stratification</h3>
              <p className="text-xs text-slate-400">Estimated repair exposure per claim bracket</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costBracketData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="bracket" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" name="Claims in Bracket" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Flagged Claims Immediate Attention Card */}
        {recentFlagged.length > 0 && (
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  High-Priority Discrepancy & Flagged Queue ({recentFlagged.length})
                </h3>
              </div>
              <Link
                to="/admin/claims?verdict=Flagged"
                className="text-xs font-semibold text-rose-300 hover:text-white flex items-center gap-1"
              >
                View All Flagged <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentFlagged.map((c) => (
                <Link
                  key={c.id}
                  to={`/admin/claims/${c.id}`}
                  className="p-3 bg-slate-900/90 hover:bg-slate-850 border border-rose-500/30 hover:border-rose-400 rounded-xl transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-rose-300">{c.claim_number}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/40">
                      Score: {Math.round(c.match_score || 0)}%
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{c.vehicle_model}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Claimed: <strong className="text-slate-200">{c.claimed_part}</strong>
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-mono">
                      ${c.estimated_cost_min?.toLocaleString()} - ${c.estimated_cost_max?.toLocaleString()}
                    </span>
                    <span className="text-rose-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Review <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Recent Claims Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Recent Claims Inflow</h2>
              <p className="text-xs text-slate-400">All recent policyholder accident damage submissions</p>
            </div>
            <Link
              to="/admin/claims"
              className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
            >
              Open Full Review Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-5">Claim #</th>
                  <th className="py-3 px-5">Vehicle & Plate</th>
                  <th className="py-3 px-5">Damage Area</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">AI Verdict</th>
                  <th className="py-3 px-5">Est. Cost</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Officer Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-primary-400">
                      {claim.claim_number}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-white">{claim.vehicle_model}</div>
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
                    <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400">
                      {new Date(claim.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        to={`/admin/claims/${claim.id}`}
                        className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                      >
                        Inspect <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
