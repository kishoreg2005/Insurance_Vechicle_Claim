import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Sliders,
  Users,
  Search,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  CheckSquare,
  Square,
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

  useEffect(() => { fetchClaims(); }, [page, status, verdict]);

  const handleSearchSubmit = (e) => { e.preventDefault(); setPage(1); fetchClaims(); };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === claims.length ? [] : claims.map((c) => c.id));
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) { toast.error('Please select at least one claim.'); return; }
    setBulkWorking(true);
    try {
      const { data } = await api.post('/admin/claims/bulk-action', { action, claim_ids: selectedIds });
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

        {/* Page Header Banner */}
        <div className="page-banner flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-[#93C5FD]" />
              <h1 className="text-xl font-bold text-white tracking-tight">Insurance Claims Review & Authorization</h1>
            </div>
            <p className="text-[#BAD4F9] text-xs">
              Inspect AI segmentation, cross-check discrepancies, and execute administrative overrides
            </p>
          </div>
          <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white shrink-0">
            In Queue: <strong>{total}</strong> claims
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Claim #, Vehicle, Plate, User..."
              className="input-field pl-9 text-xs"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#6B7280] font-medium">Status:</span>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="input-field text-xs"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Info Requested">Info Requested</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#6B7280] font-medium">AI Verdict:</span>
              <select
                value={verdict}
                onChange={(e) => { setVerdict(e.target.value); setPage(1); }}
                className="input-field text-xs"
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
              onClick={() => { setSearch(''); setStatus('ALL'); setVerdict('ALL'); setPage(1); }}
              className="text-xs font-semibold text-[#6B7280] hover:text-[#06244F] transition-colors px-2 py-1"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.length > 0 && (
          <div className="bg-[#EAF4FF] border border-[#1268E8]/30 rounded-xl p-3 px-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1268E8]">
              <CheckSquare className="w-4 h-4" />
              <span>{selectedIds.length} claims selected for bulk action:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={bulkWorking}
                onClick={() => handleBulkAction('approve')}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Selected
              </button>
              <button
                type="button"
                disabled={bulkWorking}
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject Selected
              </button>
              <button
                type="button"
                disabled={bulkWorking}
                onClick={() => handleBulkAction('flag')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Flag for Audit
              </button>
            </div>
          </div>
        )}

        {/* Claims Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div
                className="w-8 h-8 rounded-full animate-spin"
                style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: '#EAF4FF', borderTopColor: '#1268E8' }}
              />
              <p className="text-xs text-[#6B7280]">Loading claims ledger...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-20 px-4 space-y-3">
              <AlertCircle className="w-8 h-8 text-[#9CA3AF] mx-auto" />
              <h3 className="text-sm font-semibold text-[#06244F]">No claims found</h3>
              <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                Try adjusting your search query, status, or AI verdict filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-10 text-center">
                      <button type="button" onClick={toggleSelectAll} className="p-1 hover:text-[#06244F]">
                        {selectedIds.length === claims.length && claims.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-[#1268E8]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#9CA3AF]" />
                        )}
                      </button>
                    </th>
                    <th>Claim ID</th>
                    <th>Vehicle & Plate</th>
                    <th>Damaged Part</th>
                    <th>Status</th>
                    <th>AI Verdict</th>
                    <th>Cost Estimate</th>
                    <th>Submission Date</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => {
                    const isSelected = selectedIds.includes(claim.id);
                    return (
                      <tr
                        key={claim.id}
                        className={isSelected ? 'bg-[#EAF4FF]' : ''}
                      >
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(claim.id)}
                            className="p-1 hover:text-[#06244F]"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#1268E8]" />
                            ) : (
                              <Square className="w-4 h-4 text-[#9CA3AF]" />
                            )}
                          </button>
                        </td>
                        <td className="font-mono font-bold text-[#1268E8]">{claim.claim_number}</td>
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
                            to={`/admin/claims/${claim.id}`}
                            className="inline-flex items-center gap-1 text-[#1268E8] hover:text-blue-700 font-semibold text-xs transition-colors"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
              <div>
                Page <strong className="text-[#06244F]">{page}</strong> of {totalPages} ({total} total records)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F7FAFD] text-[#06244F] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#F7FAFD] text-[#06244F] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
