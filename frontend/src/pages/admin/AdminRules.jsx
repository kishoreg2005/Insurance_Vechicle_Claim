import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Sliders,
  Users,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Sparkles,
  AlertCircle,
  Clock,
  Car,
  ShieldCheck,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import api from '../../services/api';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/claims', label: 'Claims Review', icon: ClipboardList },
  { to: '/admin/rules', label: 'Cost & Severity Rules', icon: Sliders, end: true },
  { to: '/admin/users', label: 'Policyholders & Policies', icon: Users },
];

const DEFAULT_PREMIUM_RULES = [
  { id: 1, vehicle_type: 'Car', coverage_type: 'Third-party', min_annual_premium: 2000, max_annual_premium: 5000, default_annual_premium: 3500 },
  { id: 2, vehicle_type: 'Car', coverage_type: 'Comprehensive', min_annual_premium: 8000, max_annual_premium: 25000, default_annual_premium: 12000 },
  { id: 3, vehicle_type: 'Bike', coverage_type: 'Third-party', min_annual_premium: 700, max_annual_premium: 2000, default_annual_premium: 1200 },
  { id: 4, vehicle_type: 'Bike', coverage_type: 'Comprehensive', min_annual_premium: 1500, max_annual_premium: 6000, default_annual_premium: 3600 }
];

export default function AdminRules() {
  const [costRules, setCostRules] = useState([]);
  const [severityRules, setSeverityRules] = useState([]);
  const [premiumRules, setPremiumRules] = useState(DEFAULT_PREMIUM_RULES);
  const [activeTab, setActiveTab] = useState('premium'); // 'premium', 'cost', 'severity'
  const [loading, setLoading] = useState(true);

  // New Cost Rule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPart, setNewPart] = useState('Front Bumper');
  const [newDamageType, setNewDamageType] = useState('Dent');
  const [newCostMin, setNewCostMin] = useState(4500);
  const [newCostMax, setNewCostMax] = useState(8500);
  const [newLaborHours, setNewLaborHours] = useState(3.5);

  // Inline Editing Cost Rule State
  const [editingId, setEditingId] = useState(null);
  const [editMin, setEditMin] = useState(0);
  const [editMax, setEditMax] = useState(0);

  // Inline Editing Premium Rule State
  const [editingPremiumId, setEditingPremiumId] = useState(null);
  const [editPremMin, setEditPremMin] = useState(0);
  const [editPremMax, setEditPremMax] = useState(0);
  const [editPremDef, setEditPremDef] = useState(0);

  const fetchRules = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/cost-config'),
      api.get('/admin/severity-config'),
      api.get('/admin/premium-config').catch(() => ({ data: [] }))
    ])
      .then(([resCost, resSev, resPrem]) => {
        setCostRules(resCost.data || []);
        setSeverityRules(resSev.data || []);
        if (resPrem.data && resPrem.data.length > 0) {
          setPremiumRules(resPrem.data);
        }
      })
      .catch((err) => {
        toast.error('Failed to load configuration rules.');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreateCostRule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/cost-config', {
        part: newPart,
        damage_type: newDamageType,
        severity: 'Minor',
        cost_min: parseFloat(newCostMin),
        cost_max: parseFloat(newCostMax)
      });
      toast.success('Cost benchmark rule added!');
      setIsModalOpen(false);
      fetchRules();
    } catch (err) {
      toast.error('Failed to create cost rule.');
    }
  };

  const handleSaveCostEdit = async (ruleId) => {
    try {
      await api.put(`/admin/cost-config/${ruleId}`, {
        cost_min: parseFloat(editMin),
        cost_max: parseFloat(editMax)
      });
      toast.success('Cost rule updated!');
      setEditingId(null);
      fetchRules();
    } catch (err) {
      toast.error('Failed to update rule.');
    }
  };

  const handleStartPremiumEdit = (p) => {
    setEditingPremiumId(p.id);
    setEditPremMin(p.min_annual_premium);
    setEditPremMax(p.max_annual_premium);
    setEditPremDef(p.default_annual_premium);
  };

  const handleSavePremiumEdit = async (ruleId) => {
    try {
      await api.put(`/admin/premium-config/${ruleId}`, {
        min_annual_premium: parseFloat(editPremMin),
        max_annual_premium: parseFloat(editPremMax),
        default_annual_premium: parseFloat(editPremDef)
      });
      toast.success('Premium calculation rule updated!');
      setEditingPremiumId(null);
      fetchRules();
    } catch (err) {
      toast.error('Failed to update premium rule.');
    }
  };

  return (
    <Layout navItems={navItems} title="Insurance Officer Console">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-6 h-6 text-primary-400" />
              Insurance Rules & Pricing Engine Configuration
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Configure vehicle annual premium ranges, repair cost benchmarks, and AI damage severity weights.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-primary-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add New Cost Rule
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('premium')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
              activeTab === 'premium'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Car className="w-4 h-4" /> Annual Premium Ranges (Car & Bike)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cost')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'cost'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Repair Cost Benchmarks ({costRules.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('severity')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'severity'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Severity Weights & Area Thresholds ({severityRules.length})
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: ANNUAL PREMIUM RANGES CONFIGURATION                   */}
        {/* ============================================================ */}
        {activeTab === 'premium' && (
          <div className="space-y-6">
            {/* Context & Policy Notice Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary-600/20 text-primary-400 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-white text-sm">
                  Dynamic Premium Calculation & Suggestion Rules
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  These ranges serve as the baseline rule engine when issuing new insurance policies. The system automatically computes <strong>Monthly Instalment = Annual Premium / 12</strong> for tracking convenience.
                </p>
                <p className="text-slate-400 text-[11px] italic">
                  "Note: Insurance premiums are typically annual policies. Monthly instalment shown here is a simulated EMI-style breakdown for tracking convenience, not an actual insurer billing cycle."
                </p>
              </div>
            </div>

            {/* Premium Range Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {premiumRules.map((p) => {
                const isEditing = editingPremiumId === p.id;
                const defMonthly = (p.default_annual_premium / 12).toFixed(2);

                return (
                  <div
                    key={p.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-800 text-primary-400 border border-slate-700">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white">
                            {p.vehicle_type} Insurance
                          </h4>
                          <p className="text-xs text-primary-400 font-semibold">
                            {p.coverage_type} Coverage
                          </p>
                        </div>
                      </div>

                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleStartPremiumEdit(p)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Rule
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSavePremiumEdit(p.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPremiumId(null)}
                            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-slate-400">
                              Annual Range
                            </p>
                            <p className="text-base font-bold text-white font-mono mt-0.5">
                              ₹{Number(p.min_annual_premium).toLocaleString('en-IN')} – ₹{Number(p.max_annual_premium).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-slate-400">
                              Default Annual
                            </p>
                            <p className="text-base font-extrabold text-primary-400 font-mono mt-0.5">
                              ₹{Number(p.default_annual_premium).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>

                        <div className="bg-primary-950/20 border border-primary-500/20 rounded-2xl p-3 flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">Simulated Monthly Instalment:</span>
                          <span className="font-extrabold font-mono text-emerald-400 text-sm">
                            ₹{Number(defMonthly).toLocaleString('en-IN')} / mo
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-700">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Min Annual Premium (₹)
                            </label>
                            <input
                              type="number"
                              value={editPremMin}
                              onChange={(e) => setEditPremMin(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                              Max Annual Premium (₹)
                            </label>
                            <input
                              type="number"
                              value={editPremMax}
                              onChange={(e) => setEditPremMax(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Default Suggested Annual (₹)
                          </label>
                          <input
                            type="number"
                            value={editPremDef}
                            onChange={(e) => setEditPremDef(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: REPAIR COST BENCHMARKS                                */}
        {/* ============================================================ */}
        {activeTab === 'cost' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Vehicle Part</th>
                    <th className="py-3.5 px-5">Damage Classification</th>
                    <th className="py-3.5 px-5">Severity Tier</th>
                    <th className="py-3.5 px-5">Estimated Repair Cost Range (INR)</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {costRules.map((rule) => {
                    const isEditing = editingId === rule.id;
                    return (
                      <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-5 font-semibold text-white">{rule.part}</td>
                        <td className="py-3 px-5">{rule.damage_type}</td>
                        <td className="py-3 px-5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              rule.severity === 'Severe'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : rule.severity === 'Moderate'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {rule.severity}
                          </span>
                        </td>
                        <td className="py-3 px-5 font-mono text-emerald-400 font-bold">
                          {!isEditing ? (
                            `₹${Number(rule.cost_min).toLocaleString('en-IN')} – ₹${Number(rule.cost_max).toLocaleString('en-IN')}`
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editMin}
                                onChange={(e) => setEditMin(e.target.value)}
                                className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                              />
                              <span>–</span>
                              <input
                                type="number"
                                value={editMax}
                                onChange={(e) => setEditMax(e.target.value)}
                                className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right">
                          {!isEditing ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(rule.id);
                                setEditMin(rule.cost_min);
                                setEditMax(rule.cost_max);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSaveCostEdit(rule.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                            >
                              Save
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: SEVERITY WEIGHTS & AREA THRESHOLDS                    */}
        {/* ============================================================ */}
        {activeTab === 'severity' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Damage Classification</th>
                    <th className="py-3.5 px-5">Algorithm Severity Weight</th>
                    <th className="py-3.5 px-5">Minor Area Threshold (%)</th>
                    <th className="py-3.5 px-5">Moderate Area Threshold (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {severityRules.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-white">{s.damage_type}</td>
                      <td className="py-3.5 px-5 font-mono text-primary-400 font-bold">{s.weight}x</td>
                      <td className="py-3.5 px-5 font-mono text-slate-300">{(s.area_threshold_minor * 100).toFixed(1)}%</td>
                      <td className="py-3.5 px-5 font-mono text-slate-300">{(s.area_threshold_moderate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Cost Rule Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-left relative animate-in fade-in zoom-in duration-150">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-white tracking-tight">
                Add Cost Benchmark Rule
              </h3>
              <form onSubmit={handleCreateCostRule} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vehicle Part</label>
                  <input
                    type="text"
                    value={newPart}
                    onChange={(e) => setNewPart(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Damage Type</label>
                  <input
                    type="text"
                    value={newDamageType}
                    onChange={(e) => setNewDamageType(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Min Cost (₹)</label>
                    <input
                      type="number"
                      value={newCostMin}
                      onChange={(e) => setNewCostMin(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Max Cost (₹)</label>
                    <input
                      type="number"
                      value={newCostMax}
                      onChange={(e) => setNewCostMax(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold"
                  >
                    Save Benchmark
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
