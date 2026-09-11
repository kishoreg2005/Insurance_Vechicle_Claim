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
  Calendar,
  DollarSign
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
    'Third-party': { min: 2000, max: 5000, def: 3500, hint: '₹2,000 – ₹5,000/yr' },
    'Comprehensive': { min: 8000, max: 25000, def: 12000, hint: '₹8,000 – ₹25,000+/yr' }
  },
  Bike: {
    'Third-party': { min: 700, max: 2000, def: 1200, hint: '₹700 – ₹2,000+/yr' },
    'Comprehensive': { min: 1500, max: 6000, def: 3600, hint: '₹1,500 – ₹6,000+/yr' }
  }
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'policies'
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Policy Creation Modal State
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

  // Auto-calculated monthly instalment
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

  useEffect(() => {
    fetchData();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const toggleUserStatus = async (user) => {
    const nextStatus = !user.is_active;
    try {
      await api.patch(`/admin/users/${user.id}/status`, { is_active: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
      );
      toast.success(
        nextStatus ? `Account reactivated for ${user.name}` : `Account suspended for ${user.name}`
      );
    } catch (err) {
      toast.error('Failed to update account status.');
    }
  };

  // Open modal pre-filling specific user
  const openPolicyModalForUser = (user) => {
    setSelectedUserId(user ? user.id : (users[0]?.id || ''));
    setIsPolicyModalOpen(true);
  };

  const handleVehicleOrCoverageChange = (newVehicleType, newCoverageType) => {
    setVehicleType(newVehicleType);
    setCoverageType(newCoverageType);
    const guide = DEFAULT_PREMIUM_GUIDE[newVehicleType]?.[newCoverageType];
    if (guide) {
      setAnnualPremium(guide.def);
    }
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
    if (!selectedUserId) {
      toast.error('Please select a policyholder account.');
      return;
    }
    if (!vehicleModel.trim() || !vehiclePlate.trim()) {
      toast.error('Vehicle model and license plate are required.');
      return;
    }
    if (!annualPremium || annualPremium <= 0) {
      toast.error('Please enter a valid annual premium.');
      return;
    }

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
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-400" />
              Policyholders & Insurance Policies
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Manage authorized policyholders, view account statuses, and issue vehicle insurance policies.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openPolicyModalForUser(null)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-primary-600/25 transition-all"
            >
              <Plus className="w-4 h-4" /> Issue New Policy
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'users'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Policyholder Accounts ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'policies'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Active Issued Policies ({policies.length})
          </button>
        </div>

        {/* TAB 1: USERS DIRECTORY */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filter / Search Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search policyholders by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                />
              </form>

              <div className="flex items-center gap-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  aria-label="Filter policyholders by role"
                  className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-primary-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="user">Policyholders Only</option>
                  <option value="admin">Claims Officers Only</option>
                </select>
              </div>
            </div>

            {/* Directory Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-24">
                  <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-20 px-4 space-y-3">
                  <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">No accounts found</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-5">User</th>
                        <th className="py-3 px-5">System Role</th>
                        <th className="py-3 px-5">Claims Filed</th>
                        <th className="py-3 px-5">Account Status</th>
                        <th className="py-3 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {users.map((u) => {
                        const isAdmin = u.role === 'admin';
                        return (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="font-semibold text-white">{u.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                            </td>
                            <td className="py-3.5 px-5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                  isAdmin
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                                }`}
                              >
                                {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                                {isAdmin ? 'Claims Officer' : 'Policyholder'}
                              </span>
                            </td>
                            <td className="py-3.5 px-5">
                              <Link
                                to={`/admin/claims?search=${encodeURIComponent(u.email)}`}
                                className="inline-flex items-center gap-1 font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{u.claim_count} claims</span>
                              </Link>
                            </td>
                            <td className="py-3.5 px-5">
                              {u.is_active ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                                  <XCircle className="w-3.5 h-3.5" /> Suspended
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-5 text-right space-x-2">
                              {!isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => openPolicyModalForUser(u)}
                                  className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-primary-600/20 text-primary-300 border border-primary-500/30 hover:bg-primary-600/30 transition-colors"
                                >
                                  Issue Policy
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleUserStatus(u)}
                                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                                  u.is_active
                                    ? 'border-rose-500/30 text-rose-300 hover:bg-rose-500/10'
                                    : 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
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
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {policies.length === 0 ? (
              <div className="text-center py-20 px-4 space-y-3">
                <Car className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No policies issued yet</h3>
                <p className="text-xs text-slate-400">Click "Issue New Policy" to create a policy for any registered policyholder.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-5">Policy #</th>
                      <th className="py-3 px-5">Policyholder</th>
                      <th className="py-3 px-5">Vehicle</th>
                      <th className="py-3 px-5">Coverage Tier</th>
                      <th className="py-3 px-5">Annual Premium</th>
                      <th className="py-3 px-5">Monthly Instalment</th>
                      <th className="py-3 px-5">Validity</th>
                      <th className="py-3 px-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {policies.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-primary-400">
                          {p.policy_number}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-white">{p.user_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{p.user_email}</div>
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-primary-400" />
                            {p.vehicle_model}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">{p.vehicle_plate}</div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-500/10 text-primary-300 border border-primary-500/30">
                            {p.coverage_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-bold text-white font-mono">
                          ₹{Number(p.annual_premium).toLocaleString('en-IN')}/yr
                        </td>
                        <td className="py-3.5 px-5 font-bold text-emerald-400 font-mono">
                          ₹{Number(p.monthly_instalment).toLocaleString('en-IN')}/mo
                        </td>
                        <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400">
                          {p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'} to{' '}
                          {p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {p.status || 'Active'}
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

        {/* ============================================================ */}
        {/* POLICY CREATION MODAL (Admin side)                          */}
        {/* ============================================================ */}
        {isPolicyModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 text-left relative animate-in fade-in zoom-in duration-150">
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary-600/20 text-primary-400 border border-primary-500/30">
                  <Car className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Issue Vehicle Insurance Policy
                  </h3>
                  <p className="text-xs text-slate-400">
                    Create policy with annual premium and auto-computed monthly instalments.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreatePolicy} className="space-y-4">
                {/* Policyholder Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Policyholder Account
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="">-- Choose User --</option>
                    {users
                      .filter((u) => u.role === 'user')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Vehicle Type & Coverage Type Dropdowns */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Vehicle Type
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => handleVehicleOrCoverageChange(e.target.value, coverageType)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="Car">Car</option>
                      <option value="Bike">Bike</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Coverage Type
                    </label>
                    <select
                      value={coverageType}
                      onChange={(e) => handleVehicleOrCoverageChange(vehicleType, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="Comprehensive">Comprehensive</option>
                      <option value="Third-party">Third-party only</option>
                    </select>
                  </div>
                </div>

                {/* Vehicle Model & Plate */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Vehicle Model
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hyundai i20"
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Registration / Plate #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. KA-01-MJ-8821"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Annual Premium Input with Helper Tooltip */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Annual Premium (₹)
                    </label>
                    {currentGuide && (
                      <button
                        type="button"
                        onClick={() => setAnnualPremium(currentGuide.def)}
                        className="text-[11px] text-primary-400 hover:text-primary-300 font-semibold"
                      >
                        Auto-suggest: {currentGuide.hint} (Click to set ₹{currentGuide.def.toLocaleString('en-IN')})
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                    <input
                      type="number"
                      value={annualPremium}
                      onChange={(e) => setAnnualPremium(Number(e.target.value))}
                      required
                      min="1"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* System Auto-calculated Monthly Instalment Banner */}
                <div className="bg-primary-950/30 border border-primary-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-primary-300 tracking-wider">
                      Auto-Calculated Monthly Instalment
                    </p>
                    <p className="text-xl font-black text-white font-mono mt-0.5">
                      ₹{Number(monthlyInstalment).toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal text-slate-400">/ month</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    = Annual / 12
                  </span>
                </div>

                {/* Policy Dates: Start Date & End Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Policy Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Policy End Date (1 Year Term)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsPolicyModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPolicy}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-600/30 transition-all disabled:opacity-50"
                  >
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
