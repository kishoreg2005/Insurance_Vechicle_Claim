import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Sliders, Users,
  AlertTriangle, CheckCircle2, Clock, XCircle,
  TrendingUp, FileText, ShieldAlert, ArrowRight,
  Sparkles, Activity, BarChart3, Zap
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend
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

const COLORS = ['#1268E8', '#059669', '#D97706', '#DC2626', '#7C3AED', '#EC4899'];

function StatCard({ icon: Icon, label, value, sub, color, bg, alert }) {
  return (
    <div className={`stat-card ${alert ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[#6B7280] font-medium uppercase tracking-wide truncate">{label}</p>
          <p className={`text-2xl font-black mt-0.5 ${alert ? 'text-red-600' : 'text-[#06244F]'}`}>{value}</p>
          {sub && <p className="text-[11px] text-[#9CA3AF] truncate">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#374151',
};

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

    const unsubActivities = subscribeToLiveActivities((activities) => {
      setLiveActivities(activities);
    });
    return () => unsubActivities();
  }, []);

  if (loading) {
    return (
      <Layout navItems={navItems} title="Officer Console">
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <div className="w-8 h-8 rounded-full animate-spin" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: '#EAF4FF', borderTopColor: '#1268E8' }} />
          <p className="text-sm text-[#6B7280]">Loading claims analytics...</p>
        </div>
      </Layout>
    );
  }

  const kpis = analytics?.kpis || {};
  const timelineData = analytics?.timeline || analytics?.claims_timeline || [];
  const statusData = (analytics?.status_distribution || analytics?.claims_by_status || []).map((s) => ({
    name: s.status, value: s.count, color: s.color,
  }));
  const damageTypeData = analytics?.damage_type_distribution || [];
  const costBracketData = analytics?.cost_bracket_distribution || [];
  const recentFlagged = analytics?.recent_flagged_claims || [];

  return (
    <Layout navItems={navItems} title="Officer Console">
      <div className="space-y-6 fade-in">

        {/* Header */}
        <div className="page-banner flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-[#93C5FD] mb-3">
              <Zap className="w-3.5 h-3.5" /> AI Verification Engine · Operational
            </div>
            <h1 className="text-2xl font-black text-white">Insurance Officer Console</h1>
            <p className="text-[#BAD4F9] text-sm mt-1">Review AI damage assessments, resolve discrepancies, and manage the claims pipeline</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/claims?verdict=Flagged" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-400/40 text-red-200 font-semibold text-sm transition-all flex-shrink-0">
              <ShieldAlert className="w-4 h-4 text-red-300" />
              {kpis.flagged_count || 0} Flagged
            </Link>
            <Link to="/admin/claims" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-all flex-shrink-0">
              <ClipboardList className="w-4 h-4 text-[#93C5FD]" /> All Claims
            </Link>
          </div>
        </div>

        {/* Live Activity Banner */}
        {liveActivities.length > 0 && (
          <div className="card border-green-200 bg-green-50 flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <div>
                <p className="text-xs font-bold text-green-800 flex items-center gap-2">
                  Realtime Activity
                  <span className="text-[10px] bg-green-200 text-green-700 px-2 py-0.5 rounded-full font-semibold">Firebase RTDB Live</span>
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  {liveActivities[0].message} · <span className="text-green-600">{new Date(liveActivities[0].timestamp).toLocaleTimeString()}</span>
                </p>
              </div>
            </div>
            <span className="text-xs text-green-700 font-mono hidden sm:inline">{liveActivities.length} event{liveActivities.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={FileText} label="Total Claims" value={kpis.total_claims || 0} sub="Incurred to date" color="#1268E8" bg="#EAF4FF" />
          <StatCard icon={ShieldAlert} label="Flagged" value={kpis.flagged_count || 0} sub={`${Math.round(kpis.potential_fraud_rate ?? 0)}% mismatch`} color="#DC2626" bg="#FEF2F2" alert={kpis.flagged_count > 0} />
          <StatCard icon={Clock} label="Pending" value={kpis.pending_count || 0} sub="Requires sign-off" color="#D97706" bg="#FFFBEB" />
          <StatCard icon={CheckCircle2} label="Approved" value={kpis.approved_count || 0} sub="Settlement confirmed" color="#059669" bg="#ECFDF5" />
          <StatCard icon={TrendingUp} label="Liability" value={`₹${Math.round((kpis.total_estimated_payout ?? 0) / 1000)}K`} sub="Est. upper bound" color="#7C3AED" bg="#F5F3FF" />
          <StatCard icon={Activity} label="AI Speed" value={kpis.avg_processing_time || '2.4s'} sub="Avg segmentation" color="#6B7280" bg="#F3F4F6" />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-12 gap-5">
          {/* Timeline */}
          <div className="lg:col-span-8 card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#06244F]">Claims Timeline — Last 30 Days</h3>
                <p className="text-xs text-[#6B7280]">Daily claim submissions vs flagged discrepancies</p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-[#F7FAFD] text-[#6B7280] border border-[#E5E7EB]">30-Day</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gClaims" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1268E8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1268E8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFlagged" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="claims" name="Total Claims" stroke="#1268E8" fillOpacity={1} fill="url(#gClaims)" />
                  <Area type="monotone" dataKey="flagged" name="Flagged" stroke="#DC2626" fillOpacity={1} fill="url(#gFlagged)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status Pie */}
          <div className="lg:col-span-4 card space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[#06244F]">Claims Status Distribution</h3>
              <p className="text-xs text-[#6B7280]">Current workflow breakdown</p>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {statusData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Damage Types Bar */}
          <div className="lg:col-span-6 card space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[#06244F]">Top Detected Damage Types</h3>
              <p className="text-xs text-[#6B7280]">Frequency of AI-classified damage</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={damageTypeData} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                  <XAxis type="number" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <YAxis type="category" dataKey="damage_type" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Occurrences" fill="#1268E8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Brackets */}
          <div className="lg:col-span-6 card space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[#06244F]">Repair Cost Stratification</h3>
              <p className="text-xs text-[#6B7280]">Claims distribution by repair cost bracket</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costBracketData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="bracket" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Claims" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Flagged queue */}
        {recentFlagged.length > 0 && (
          <div className="card border-red-200 bg-red-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-red-800">High-Priority Flagged Queue ({recentFlagged.length})</h3>
              </div>
              <Link to="/admin/claims?verdict=Flagged" className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentFlagged.map((c) => (
                <Link key={c.id} to={`/admin/claims/${c.id}`}
                  className="p-3 bg-white hover:bg-red-50 border border-red-200 hover:border-red-400 rounded-lg transition-all group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-red-600">{c.claim_number}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold border border-red-200">
                      {Math.round(c.match_score || 0)}% match
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#06244F] truncate">{c.vehicle_model}</p>
                  <p className="text-[11px] text-[#6B7280] truncate mt-0.5">Claimed: <strong className="text-[#374151]">{c.claimed_part}</strong></p>
                  <div className="mt-2 pt-2 border-t border-red-100 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[#374151]">₹{c.estimated_cost_min?.toLocaleString('en-IN')}–₹{c.estimated_cost_max?.toLocaleString('en-IN')}</span>
                    <span className="text-[#1268E8] font-semibold flex items-center gap-0.5 group-hover:gap-1 transition-all">Review <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent claims table */}
        <div className="card p-0 overflow-hidden">
          <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#06244F]">Recent Claims</h2>
              <p className="text-xs text-[#6B7280]">All recent policyholder damage submissions</p>
            </div>
            <Link to="/admin/claims" className="text-xs font-semibold text-[#1268E8] hover:text-[#0f58d4] flex items-center gap-1">
              Full Review Queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Vehicle</th>
                  <th>Damage Area</th>
                  <th>Status</th>
                  <th>AI Verdict</th>
                  <th>Est. Cost</th>
                  <th>Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentClaims.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-[#9CA3AF] text-sm">
                      No claims found. Claims will appear here once submitted.
                    </td>
                  </tr>
                ) : recentClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td className="font-mono font-bold text-[#1268E8]">{claim.claim_number}</td>
                    <td>
                      <div className="font-semibold text-[#06244F] text-xs">{claim.vehicle_model}</div>
                      <div className="font-mono text-[11px] text-[#6B7280]">{claim.vehicle_plate}</div>
                    </td>
                    <td className="font-medium text-[#374151]">{claim.claimed_part}</td>
                    <td><StatusBadge status={claim.status} /></td>
                    <td><VerdictBadge verdict={claim.verdict} matchScore={claim.match_score} /></td>
                    <td><CostBadge costMin={claim.estimated_cost_min} costMax={claim.estimated_cost_max} /></td>
                    <td className="font-mono text-[11px] text-[#6B7280]">{new Date(claim.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="text-right">
                      <Link to={`/admin/claims/${claim.id}`} className="text-xs font-semibold text-[#1268E8] hover:text-[#0f58d4] flex items-center gap-1 justify-end">
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
