import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  History,
  Search,
  Filter,
  ArrowRight,
  Car,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Layout from '../../components/Layout';
import StatusBadge, { VerdictBadge, CostBadge } from '../../components/StatusBadge';
import api from '../../services/api';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/claims/new', label: 'Submit New Claim', icon: FilePlus },
  { to: '/claims', label: 'Claim History', icon: History, end: true },
];

export default function ClaimHistory() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    api.get('/user/claims?limit=50')
      .then(({ data }) => setClaims(data.items || []))
      .catch((err) => console.error('Failed to load user claims:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      (claim.claim_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (claim.vehicle_model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (claim.vehicle_plate || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (claim.claimed_part || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (claim.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <Layout navItems={navItems} title="Policyholder Portal">
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-primary-400" />
              Insurance Claims History
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Complete archive of submitted damage claims, AI cross-check verdicts, and assessments
            </p>
          </div>

          <Link
            to="/claims/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-primary-600/25 transition-all self-start sm:self-auto"
          >
            <FilePlus className="w-4 h-4" /> Submit New Claim
          </Link>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Claim #, Vehicle, Part..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-xs"
            >
              <option value="ALL">All Statuses ({claims.length})</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Info Requested">Info Requested</option>
            </select>
          </div>
        </div>

        {/* Claims Table Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Retrieving claims record...</p>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No claims matched</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No insurance claims found matching your filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-5">Claim ID</th>
                    <th className="py-3 px-5">Vehicle & Plate</th>
                    <th className="py-3 px-5">Damage Area</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">AI Verdict</th>
                    <th className="py-3 px-5">Estimated Cost</th>
                    <th className="py-3 px-5">Filed Date</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredClaims.map((claim) => (
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
                          to={`/claims/${claim.id}`}
                          className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                        >
                          View Assessment <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

