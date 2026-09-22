import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Sliders,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Plus,
  Car,
  X,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import api from '../../services/api';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/claims', label: 'Claims Review', icon: ClipboardList },
  { to: '/admin/rules', label: 'Cost & Severity Rules', icon: Sliders },
  { to: '/admin/users', label: 'Policyholders & Policies', icon: Users, end: true },
];

const DEFAULT_PREMIUM_GUIDE = {
  Car: {
    'Third-party':   { min: 2000, max: 5000,  def: 3500,  hint: '₹2,000 – ₹5,000/yr' },
    'Comprehensive': { min: 8000, max: 25000, def: 12000, hint: '₹8,000 – ₹25,000+/yr' }
  },
  Bike: {
    'Third-party':   { min: 700,  max: 2000,  def: 1200, hint: '₹700 – ₹2,000+/yr' },
    'Comprehensive': { min: 1500, max: 6000,  def: 3600, hint: '₹1,500 – ₹6,000+/yr' }
  }
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [coverageType, setCoverageType] = useState('Comprehensive');
  const [vehicleModel, setVehicleModel] = useState('Hyundai i20');
  const [vehiclePlate, setVehiclePlate] = useState('KA-01-MJ-8821');
  const [annualPremium, setAnnualPremium] = useState(12000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [savingPolicy, setSavingPolicy] = useState(false);

  const monthlyInstalment = annualPremium > 0 ? (annualPremium / 12).toFixed(2) : 0;

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (roleFilter !== 'ALL') params.set('role', roleFilter);

    Promise.all([
      api.get(`/admin/users?${params.toString()}`),
      api.get('/admin/policies').catch(() => ({ data: [] }))
    ])
      .then(([resUsers, resPolicies]) => {
        setUsers(resUsers.data || []);
        setPolicies(resPolicies.data || []);
      })
      .catch((err) => {
        toast.error('Failed to load user and policy data.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [roleFilter]);

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchData(); };

  const toggleUserStatus = async (user) => {
    const nextStatus = !user.is_active;
    try {
      await api.patch(`/admin/users/${user.id}/status`, { is_active: nextStatus });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u)));
      toast.success(nextStatus ? `Account reactivated for ${user.name}` : `Account suspended for ${user.name}`);
    } catch (err) {
      toast.error('Failed to update account status.');
    }
  };

  const openPolicyModalForUser = (user) => {
    setSelectedUserId(user ? user.id : (users[0]?.id || ''));
    setIsPolicyModalOpen(true);
  };

  const handleVehicleOrCoverageChange = (newVehicleType, newCoverageType) => {
    setVehicleType(newVehicleType);
    setCoverageType(newCoverageType);
    const guide = DEFAULT_PREMIUM_GUIDE[newVehicleType]?.[newCoverageType];
    if (guide) setAnnualPremium(guide.def);
  };

  const handleStartDateChange = (newStart) => {
    setStartDate(newStart);
    if (newStart) {
      const d = new Date(newStart);
      d.setFullYear(d.getFullYear() + 1);
      setEndDate(d.toISOString().split('T')[0]);
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();
    if (!selectedUserId) { toast.error('Please select a policyholder account.'); return; }
    if (!vehicleModel.trim() || !vehiclePlate.trim()) { toast.error('Vehicle model and license plate are required.'); return; }
    if (!annualPremium || annualPremium <= 0) { toast.error('Please enter a valid annual premium.'); return; }

    setSavingPolicy(true);
    try {
      await api.post('/admin/policies', {
        user_id: Number(selectedUserId),
        vehicle_type: vehicleType,
        vehicle_model: vehicleModel.trim(),
        vehicle_plate: vehiclePlate.trim().toUpperCase(),
        coverage_type: coverageType,
        annual_premium: Number(annualPremium),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString()
      });
      toast.success('Insurance Policy issued successfully!');
      setIsPolicyModalOpen(false);
      fetchData();
      setActiveTab('policies');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to issue policy.');
    } finally {
      setSavingPolicy(false);
    }
  };

  const currentGuide = DEFAULT_PREMIUM_GUIDE[vehicleType]?.[coverageType];

  return (
    <Layout navItems={navItems} title="Insurance Officer Console">
      <div className="space-y-6">

        {/* Page Header Banner */}
        <div className="page-banner flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-[#93C5FD]" />
              <h1 className="text-xl font-bold text-white tracking-tight">Policyholders & Insurance Policies</h1>
            </div>
            <p className="text-[#BAD4F9] text-xs">
              Manage authorized policyholders, view account statuses, and issue vehicle insurance policies.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openPolicyModalForUser(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1268E8] hover:bg-blue-500 text-white font-semibold text-xs shadow-lg transition-all self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" /> Issue New Policy
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
          {[
            { id: 'users',    label: `Policyholder Accounts (${users.length})` },
            { id: 'policies', label: `Active Issued Policies (${policies.length})` },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeTab === id
                  ? 'bg-[#1268E8] text-white shadow-sm'
                  : 'text-[#6B7280] hover:text-[#06244F] hover:bg-[#F7FAFD]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search policyholders by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9 text-xs"
                />
              </form>
              <div className="flex items-center gap-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="ALL">All Roles</option>
                  <option value="user">Policyholders Only</option>
                  <option value="admin">Claims Officers Only</option>
                </select>
              </div>
            </div>

            <div className="card overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-24">
                  <div className="w-8 h-8 rounded-full animate-spin" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: '#EAF4FF', borderTopColor: '#1268E8' }} />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-20 px-4 space-y-3">
                  <AlertCircle className="w-8 h-8 text-[#9CA3AF] mx-auto" />
                  <h3 className="text-sm font-semibold text-[#06244F]">No accounts found</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>System Role</th>
                        <th>Claims Filed</th>
                        <th>Account Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const isAdmin = u.role === 'admin';
                        return (
                          <tr key={u.id}>
                            <td>
                              <div className="font-semibold text-[#06244F]">{u.name}</div>
                              <div className="text-[11px] text-[#9CA3AF] font-mono">{u.email}</div>
                            </td>
                            <td>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                                isAdmin
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-[#EAF4FF] text-[#1268E8] border-[#1268E8]/20'
                              }`}>
                                {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                                {isAdmin ? 'Claims Officer' : 'Policyholder'}
                              </span>
                            </td>
                            <td>
                              <Link
                                to={`/admin/claims?search=${encodeURIComponent(u.email)}`}
                                className="inline-flex items-center gap-1 font-semibold text-[#1268E8] hover:text-blue-700 text-xs transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{u.claim_count} claims</span>
                              </Link>
                            </td>
                            <td>
                              {u.is_active ? (
                                <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-[11px]">
                                  <XCircle className="w-3.5 h-3.5" /> Suspended
                                </span>
                              )}
                            </td>
                            <td className="text-right space-x-2">
                              {!isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => openPolicyModalForUser(u)}
                                  className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-[#EAF4FF] text-[#1268E8] border border-[#1268E8]/20 hover:bg-blue-100 transition-colors"
                                >
                                  Issue Policy
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleUserStatus(u)}
                                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                                  u.is_active
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-green-200 text-green-600 hover:bg-green-50'
                                }`}
                              >
                                {u.is_active ? 'Suspend' : 'Reactivate'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ISSUED POLICIES */}
        {activeTab === 'policies' && (
          <div className="card overflow-hidden">
            {policies.length === 0 ? (
              <div className="text-center py-20 px-4 space-y-3">
                <Car className="w-8 h-8 text-[#9CA3AF] mx-auto" />
                <h3 className="text-sm font-semibold text-[#06244F]">No policies issued yet</h3>
                <p className="text-xs text-[#6B7280]">Click "Issue New Policy" to create a policy for any registered policyholder.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Policy #</th>
                      <th>Policyholder</th>
                      <th>Vehicle</th>
                      <th>Coverage Tier</th>
                      <th>Annual Premium</th>
                      <th>Monthly Instalment</th>
                      <th>Validity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((p) => (
                      <tr key={p.id}>
                        <td className="font-mono font-bold text-[#1268E8]">{p.policy_number}</td>
                        <td>
                          <div className="font-semibold text-[#06244F]">{p.user_name}</div>
                          <div className="text-[11px] text-[#9CA3AF] font-mono">{p.user_email}</div>
                        </td>
                        <td>
                          <div className="font-semibold text-[#06244F] flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-[#1268E8]" />{p.vehicle_model}
                          </div>
                          <div className="text-[11px] font-mono text-[#9CA3AF]">{p.vehicle_plate}</div>
                        </td>
                        <td>
                          <span className="badge-blue">{p.coverage_type}</span>
                        </td>
                        <td className="font-bold text-[#06244F] font-mono">
                          ₹{Number(p.annual_premium).toLocaleString('en-IN')}/yr
                        </td>
                        <td className="font-bold text-green-600 font-mono">
                          ₹{Number(p.monthly_instalment).toLocaleString('en-IN')}/mo
                        </td>
                        <td className="font-mono text-[11px] text-[#6B7280]">
                          {p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'} to{' '}
                          {p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          <span className="badge-green inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {p.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Policy Creation Modal */}
        {isPolicyModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 text-left relative animate-fade-in">
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-lg text-[#6B7280] hover:text-[#06244F] hover:bg-[#F7FAFD] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-[#EAF4FF] text-[#1268E8] border border-[#1268E8]/20">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#06244F] tracking-tight">Issue Vehicle Insurance Policy</h3>
                  <p className="text-xs text-[#6B7280]">Create policy with annual premium and auto-computed monthly instalments.</p>
                </div>
              </div>

              <form onSubmit={handleCreatePolicy} className="space-y-4">
                <div>
                  <label className="input-label">Select Policyholder Account</label>
                  <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} required className="input-field text-xs">
                    <option value="">-- Choose User --</option>
                    {users.filter((u) => u.role === 'user').map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Vehicle Type</label>
                    <select value={vehicleType} onChange={(e) => handleVehicleOrCoverageChange(e.target.value, coverageType)} className="input-field text-xs">
                      <option value="Car">Car</option>
                      <option value="Bike">Bike</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Coverage Type</label>
                    <select value={coverageType} onChange={(e) => handleVehicleOrCoverageChange(vehicleType, e.target.value)} className="input-field text-xs">
                      <option value="Comprehensive">Comprehensive</option>
                      <option value="Third-party">Third-party only</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Vehicle Model</label>
                    <input type="text" placeholder="e.g. Hyundai i20" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} required className="input-field text-xs" />
                  </div>
                  <div>
                    <label className="input-label">Registration / Plate #</label>
                    <input type="text" placeholder="e.g. KA-01-MJ-8821" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} required className="input-field text-xs font-mono uppercase" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="input-label mb-0">Annual Premium (₹)</label>
                    {currentGuide && (
                      <button type="button" onClick={() => setAnnualPremium(currentGuide.def)} className="text-[11px] text-[#1268E8] hover:text-blue-700 font-semibold">
                        Auto-suggest: {currentGuide.hint} (Click to set ₹{currentGuide.def.toLocaleString('en-IN')})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] font-bold text-sm">₹</span>
                    <input type="number" value={annualPremium} onChange={(e) => setAnnualPremium(Number(e.target.value))} required min="1" className="input-field pl-8 text-sm font-mono font-bold" />
                  </div>
                </div>

                <div className="bg-[#EAF4FF] border border-[#1268E8]/20 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#1268E8] tracking-wider">Auto-Calculated Monthly Instalment</p>
                    <p className="text-xl font-black text-[#06244F] font-mono mt-0.5">
                      ₹{Number(monthlyInstalment).toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal text-[#6B7280]">/ month</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-[#6B7280] font-mono">= Annual / 12</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Policy Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} required className="input-field text-xs" />
                  </div>
                  <div>
                    <label className="input-label">Policy End Date (1 Year Term)</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="input-field text-xs" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                  <button type="button" onClick={() => setIsPolicyModalOpen(false)} className="btn-outline text-xs px-4 py-2.5">Cancel</button>
                  <button type="submit" disabled={savingPolicy} className="btn-primary text-xs px-6 py-2.5 disabled:opacity-50">
                    {savingPolicy ? 'Issuing Policy...' : 'Issue Insurance Policy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
