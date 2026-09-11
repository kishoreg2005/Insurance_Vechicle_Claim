import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Sliders,
  Users,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  CheckSquare,
  Square,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import StatusBadge, { VerdictBadge, CostBadge } from '../../components/StatusBadge';
import api from '../../services/api';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/claims', label: 'Claims Review', icon: ClipboardList, end: true },
  { to: '/admin/rules', label: 'Cost & Severity Rules', icon: Sliders },
  { to: '/admin/users', label: 'Policyholders', icon: Users },
];

export default function AdminClaimsList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [claims, setClaims] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [verdict, setVerdict] = useState(searchParams.get('verdict') || 'ALL');

  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkWorking, setBulkWorking] = useState(false);

  const fetchClaims = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (search.trim()) params.set('search', search.trim());
    if (status !== 'ALL') params.set('status', status);
    if (verdict !== 'ALL') params.set('verdict', verdict);

    api.get(`/admin/claims?${params.toString()}`)
      .then(({ data }) => {
        setClaims(data.items || []);
        setTotal(data.total || 0);
        setSelectedIds([]);
      })
      .catch((err) => {
        toast.error('Failed to load claims list.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClaims();
  }, [page, status, verdict]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchClaims();
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === claims.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(claims.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one claim.');
      return;
    }

    setBulkWorking(true);
    try {
      const { data } = await api.post('/admin/claims/bulk-action', {
        action,
        claim_ids: selectedIds,
      });
      toast.success(data.message || 'Bulk operation completed.');
      fetchClaims();
    } catch (err) {
      toast.error('Bulk update failed.');
    } finally {
      setBulkWorking(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <Layout navItems={navItems} title="Insurance Officer Console">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary-400" />
              Insurance Claims Review & Authorization
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Inspect AI segmentation, cross-check discrepancies, and execute administrative overrides
            </p>
          </div>
          <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Total In Queue: <strong className="text-white">{total}</strong> claims
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Claim #, Vehicle, Plate, User..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-xs"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Info Requested">Info Requested</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">AI Verdict:</span>
              <select
                value={verdict}
                onChange={(e) => {
                  setVerdict(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-xs"
              >
                <option value="ALL">All AI Verdicts</option>
                <option value="Match">Match</option>
                <option value="Partial Match">Partial Match</option>
                <option value="Discrepancy">Discrepancy</option>
                <option value="Flagged">Flagged Cases</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatus('ALL');
                setVerdict('ALL');
                setPage(1);
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="bg-primary-950/40 border border-primary-500/40 rounded-2xl p-3 px-5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary-300">
              <CheckSquare className="w-4 h-4 text-primary-400" />
              <span>{selectedIds.length} claims selected for bulk action:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={bulkWorking}
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Selected
              </button>
              <button
                type="button"
                disabled={bulkWorking}
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject Selected
              </button>
              <button
                type="button"
                disabled={bulkWorking}
                onClick={() => handleBulkAction('flag')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Flag for Audit
              </button>
            </div>
          </div>
        )}

        {/* Claims Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading claims ledger...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-20 px-4 space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No claims found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try adjusting your search query, status, or AI verdict filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 w-10 text-center">
                      <button type="button" onClick={toggleSelectAll} className="p-1 hover:text-white">
                        {selectedIds.length === claims.length && claims.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-primary-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-4">Claim ID</th>
                    <th className="py-3 px-4">Vehicle & Plate</th>
                    <th className="py-3 px-4">Damaged Part</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">AI Verdict</th>
                    <th className="py-3 px-4">Cost Estimate</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {claims.map((claim) => {
                    const isSelected = selectedIds.includes(claim.id);
                    return (
                      <tr
                        key={claim.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-primary-950/30' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(claim.id)}
                            className="p-1 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-primary-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-primary-400">
                          {claim.claim_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{claim.vehicle_model}</div>
                          <div className="text-[11px] font-mono text-slate-400">{claim.vehicle_plate}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-200">
                          {claim.claimed_part}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={claim.status} />
                        </td>
                        <td className="py-3 px-4">
                          <VerdictBadge verdict={claim.verdict} matchScore={claim.match_score} />
                        </td>
                        <td className="py-3 px-4">
                          <CostBadge costMin={claim.estimated_cost_min} costMax={claim.estimated_cost_max} />
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(claim.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/admin/claims/${claim.id}`}
                            className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 font-semibold transition-colors"
                          >
                            Review <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Page <strong className="text-white">{page}</strong> of {totalPages} ({total} total records)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
