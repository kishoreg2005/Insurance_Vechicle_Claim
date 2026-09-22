import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  History,
  Search,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import Layout from '../../components/Layout';
import StatusBadge, { VerdictBadge, CostBadge } from '../../components/StatusBadge';
import api from '../../services/api';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/claims/new', label: 'Submit New Claim', icon: FilePlus },
  { to: '/claims', label: 'Claim History', icon: History, end: true },
];

const STATUS_PILLS = [
  { id: 'ALL',            label: 'All Claims',    icon: History,       color: 'text-[#6B7280]',  activeBg: 'bg-[#06244F] text-white',       inactiveBg: 'bg-white text-[#6B7280] border border-[#E5E7EB]' },
  { id: 'Pending',        label: 'Pending',       icon: Clock,         color: 'text-amber-600',  activeBg: 'bg-amber-600 text-white',        inactiveBg: 'bg-amber-50 text-amber-700 border border-amber-200' },
  { id: 'Approved',       label: 'Approved',      icon: CheckCircle2,  color: 'text-green-600',  activeBg: 'bg-green-600 text-white',        inactiveBg: 'bg-green-50 text-green-700 border border-green-200' },
  { id: 'Rejected',       label: 'Rejected',      icon: XCircle,       color: 'text-red-600',    activeBg: 'bg-red-600 text-white',          inactiveBg: 'bg-red-50 text-red-700 border border-red-200' },
  { id: 'Info Requested', label: 'Info Requested',icon: ShieldAlert,   color: 'text-purple-600', activeBg: 'bg-purple-600 text-white',       inactiveBg: 'bg-purple-50 text-purple-700 border border-purple-200' },
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

        {/* Page Header Banner */}
        <div className="page-banner flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="w-5 h-5 text-[#93C5FD]" />
              <h1 className="text-xl font-bold text-white tracking-tight">Insurance Claims History</h1>
            </div>
            <p className="text-[#BAD4F9] text-xs">
              Complete archive of submitted damage claims, AI cross-check verdicts, and assessments
            </p>
          </div>
          <Link
            to="/claims/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1268E8] hover:bg-blue-500 text-white font-semibold text-xs shadow-lg transition-all self-start sm:self-auto shrink-0"
          >
            <FilePlus className="w-4 h-4" /> Submit New Claim
          </Link>
        </div>

        {/* Status Filter Pills */}
        <div className="card p-3 flex flex-wrap gap-2">
          {STATUS_PILLS.map(({ id, label, icon: Icon, activeBg, inactiveBg }) => {
            const count = id === 'ALL' ? claims.length : claims.filter(c => (c.status || '').toLowerCase() === id.toLowerCase()).length;
            const isActive = statusFilter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setStatusFilter(id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isActive ? activeBg : inactiveBg}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                <span className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-black/5'}`}>{count}</span>
              </button>
            );
          })}
          {/* Search — right-aligned */}
          <div className="relative ml-auto w-full sm:w-72">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Claim #, Vehicle, Part..."
              className="input-field pl-9 text-xs"
            />
          </div>
        </div>

        {/* Claims Table Card */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div
                className="w-8 h-8 rounded-full animate-spin"
                style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: '#EAF4FF', borderTopColor: '#1268E8' }}
              />
              <p className="text-xs text-[#6B7280]">Retrieving claims record...</p>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#F7FAFD] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#9CA3AF]">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-[#06244F]">No claims matched</h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                No insurance claims found matching your filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Vehicle & Plate</th>
                    <th>Damage Area</th>
                    <th>Status</th>
                    <th>AI Verdict</th>
                    <th>Estimated Cost</th>
                    <th>Filed Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id}>
                      <td className="font-mono font-bold text-[#1268E8]">
                        {claim.claim_number}
                      </td>
                      <td>
                        <div className="font-semibold text-[#06244F]">{claim.vehicle_model}</div>
                        <div className="text-[11px] font-mono text-[#9CA3AF]">{claim.vehicle_plate}</div>
                      </td>
                      <td className="font-medium text-[#1F2937]">{claim.claimed_part}</td>
                      <td><StatusBadge status={claim.status} /></td>
                      <td><VerdictBadge verdict={claim.verdict} matchScore={claim.match_score} /></td>
                      <td><CostBadge costMin={claim.estimated_cost_min} costMax={claim.estimated_cost_max} /></td>
                      <td className="font-mono text-[11px] text-[#6B7280]">
                        {new Date(claim.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/claims/${claim.id}`}
                          className="inline-flex items-center gap-1 text-[#1268E8] hover:text-blue-700 font-semibold text-xs transition-colors"
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
