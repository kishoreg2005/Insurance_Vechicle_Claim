import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, ClipboardList, Sliders, Users,
  Plus, Edit2, Save, X, Car, Info
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
  { id: 1, vehicle_type: 'Car',  coverage_type: 'Third-party',   min_annual_premium: 2000, max_annual_premium: 5000,  default_annual_premium: 3500  },
  { id: 2, vehicle_type: 'Car',  coverage_type: 'Comprehensive', min_annual_premium: 8000, max_annual_premium: 25000, default_annual_premium: 12000 },
  { id: 3, vehicle_type: 'Bike', coverage_type: 'Third-party',   min_annual_premium: 700,  max_annual_premium: 2000,  default_annual_premium: 1200  },
  { id: 4, vehicle_type: 'Bike', coverage_type: 'Comprehensive', min_annual_premium: 1500, max_annual_premium: 6000,  default_annual_premium: 3600  }
];

export default function AdminRules() {
  const [costRules, setCostRules] = useState([]);
  const [severityRules, setSeverityRules] = useState([]);
  const [premiumRules, setPremiumRules] = useState(DEFAULT_PREMIUM_RULES);
  const [activeTab, setActiveTab] = useState('premium');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPart, setNewPart] = useState('Front Bumper');
  const [newDamageType, setNewDamageType] = useState('Dent');
  const [newCostMin, setNewCostMin] = useState(4500);
  const [newCostMax, setNewCostMax] = useState(8500);

  const [editingId, setEditingId] = useState(null);
  const [editMin, setEditMin] = useState(0);
  const [editMax, setEditMax] = useState(0);

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
        if (resPrem.data && resPrem.data.length > 0) setPremiumRules(resPrem.data);
      })
      .catch(() => toast.error('Failed to load configuration rules.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRules(); }, []);

  const handleCreateCostRule = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/cost-config', {
        part: newPart, damage_type: newDamageType, severity: 'Minor',
        cost_min: parseFloat(newCostMin), cost_max: parseFloat(newCostMax)
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
      await api.put(`/admin/cost-config/${ruleId}`, { cost_min: parseFloat(editMin), cost_max: parseFloat(editMax) });
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

        {/* Page Header Banner */}
        <div className="page-banner flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="w-5 h-5 text-[#93C5FD]" />
              <h1 className="text-xl font-bold text-white tracking-tight">Insurance Rules & Pricing Engine Configuration</h1>
            </div>
            <p className="text-[#BAD4F9] text-xs">
              Configure vehicle annual premium ranges, repair cost benchmarks, and AI damage severity weights.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1268E8] hover:bg-blue-500 text-white font-semibold text-xs shadow-lg transition-all self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" /> Add New Cost Rule
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] pb-2">
          {[
            { id: 'premium',  label: `Annual Premium Ranges (Car & Bike)`, Icon: Car },
            { id: 'cost',     label: `Repair Cost Benchmarks (${costRules.length})`, Icon: null },
            { id: 'severity', label: `Severity Weights (${severityRules.length})`, Icon: null },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
                activeTab === id
                  ? 'bg-[#1268E8] text-white shadow-sm'
                  : 'text-[#6B7280] hover:text-[#06244F] hover:bg-[#F7FAFD]'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />} {label}
            </button>
          ))}
        </div>

        {/* TAB 1: ANNUAL PREMIUM RANGES */}
        {activeTab === 'premium' && (
          <div className="space-y-6">
            {/* Info Notice */}
            <div className="card p-5 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#EAF4FF] text-[#1268E8] shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-[#06244F] text-sm">Dynamic Premium Calculation & Suggestion Rules</h3>
                <p className="text-[#1F2937] leading-relaxed">
                  These ranges serve as the baseline rule engine when issuing new insurance policies. The system automatically computes <strong>Monthly Instalment = Annual Premium / 12</strong> for tracking convenience.
                </p>
                <p className="text-[#6B7280] text-[11px] italic">
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
                  <div key={p.id} className="card-hover p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[#EAF4FF] text-[#1268E8] border border-[#1268E8]/20">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-[#06244F]">{p.vehicle_type} Insurance</h4>
                          <p className="text-xs text-[#1268E8] font-semibold">{p.coverage_type} Coverage</p>
                        </div>
                      </div>

                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleStartPremiumEdit(p)}
                          className="px-3 py-1.5 rounded-lg bg-[#F7FAFD] hover:bg-[#EAF4FF] text-[#06244F] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-[#E5E7EB]"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Rule
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSavePremiumEdit(p.id)}
                            className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPremiumId(null)}
                            className="p-1.5 rounded-lg bg-[#F7FAFD] text-[#6B7280] hover:text-[#06244F] border border-[#E5E7EB] transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 bg-[#F7FAFD] p-3.5 rounded-xl border border-[#E5E7EB]">
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-[#6B7280]">Annual Range</p>
                            <p className="text-base font-bold text-[#06244F] font-mono mt-0.5">
                              ₹{Number(p.min_annual_premium).toLocaleString('en-IN')} – ₹{Number(p.max_annual_premium).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-semibold text-[#6B7280]">Default Annual</p>
                            <p className="text-base font-extrabold text-[#1268E8] font-mono mt-0.5">
                              ₹{Number(p.default_annual_premium).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                        <div className="bg-[#EAF4FF] border border-[#1268E8]/20 rounded-xl p-3 flex items-center justify-between text-xs">
                          <span className="text-[#1F2937] font-medium">Simulated Monthly Instalment:</span>
                          <span className="font-extrabold font-mono text-green-600 text-sm">₹{Number(defMonthly).toLocaleString('en-IN')} / mo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-[#F7FAFD] p-4 rounded-xl border border-[#E5E7EB]">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="input-label">Min Annual Premium (₹)</label>
                            <input type="number" value={editPremMin} onChange={(e) => setEditPremMin(e.target.value)} className="input-field text-xs font-mono" />
                          </div>
                          <div>
                            <label className="input-label">Max Annual Premium (₹)</label>
                            <input type="number" value={editPremMax} onChange={(e) => setEditPremMax(e.target.value)} className="input-field text-xs font-mono" />
                          </div>
                        </div>
                        <div>
                          <label className="input-label">Default Suggested Annual (₹)</label>
                          <input type="number" value={editPremDef} onChange={(e) => setEditPremDef(e.target.value)} className="input-field text-xs font-mono" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: REPAIR COST BENCHMARKS */}
        {activeTab === 'cost' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle Part</th>
                    <th>Damage Classification</th>
                    <th>Severity Tier</th>
                    <th>Estimated Repair Cost Range (INR)</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {costRules.map((rule) => {
                    const isEditing = editingId === rule.id;
                    return (
                      <tr key={rule.id}>
                        <td className="font-semibold text-[#06244F]">{rule.part}</td>
                        <td className="text-[#1F2937]">{rule.damage_type}</td>
                        <td>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            rule.severity === 'Severe'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : rule.severity === 'Moderate'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-green-50 text-green-700 border-green-200'
                          }`}>
                            {rule.severity}
                          </span>
                        </td>
                        <td className="font-mono text-green-600 font-bold">
                          {!isEditing ? (
                            `₹${Number(rule.cost_min).toLocaleString('en-IN')} – ₹${Number(rule.cost_max).toLocaleString('en-IN')}`
                          ) : (
                            <div className="flex items-center gap-2">
                              <input type="number" value={editMin} onChange={(e) => setEditMin(e.target.value)} className="w-24 input-field text-xs" />
                              <span className="text-[#6B7280]">–</span>
                              <input type="number" value={editMax} onChange={(e) => setEditMax(e.target.value)} className="w-24 input-field text-xs" />
                            </div>
                          )}
                        </td>
                        <td className="text-right">
                          {!isEditing ? (
                            <button
                              type="button"
                              onClick={() => { setEditingId(rule.id); setEditMin(rule.cost_min); setEditMax(rule.cost_max); }}
                              className="p-1.5 text-[#6B7280] hover:text-[#06244F] rounded hover:bg-[#F7FAFD] transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSaveCostEdit(rule.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-semibold transition-colors"
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

        {/* TAB 3: SEVERITY WEIGHTS */}
        {activeTab === 'severity' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Damage Classification</th>
                    <th>Algorithm Severity Weight</th>
                    <th>Minor Area Threshold (%)</th>
                    <th>Moderate Area Threshold (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {severityRules.map((s) => (
                    <tr key={s.id}>
                      <td className="font-semibold text-[#06244F]">{s.damage_type}</td>
                      <td className="font-mono text-[#1268E8] font-bold">{s.weight}x</td>
                      <td className="font-mono text-[#1F2937]">{(s.area_threshold_minor * 100).toFixed(1)}%</td>
                      <td className="font-mono text-[#1F2937]">{(s.area_threshold_moderate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Cost Rule Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-left relative animate-fade-in">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-lg text-[#6B7280] hover:text-[#06244F] hover:bg-[#F7FAFD] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-[#06244F] tracking-tight">Add Cost Benchmark Rule</h3>
              <form onSubmit={handleCreateCostRule} className="space-y-4 text-xs">
                <div>
                  <label className="input-label">Vehicle Part</label>
                  <input type="text" value={newPart} onChange={(e) => setNewPart(e.target.value)} required className="input-field" />
                </div>
                <div>
                  <label className="input-label">Damage Type</label>
                  <input type="text" value={newDamageType} onChange={(e) => setNewDamageType(e.target.value)} required className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">Min Cost (₹)</label>
                    <input type="number" value={newCostMin} onChange={(e) => setNewCostMin(e.target.value)} required className="input-field font-mono" />
                  </div>
                  <div>
                    <label className="input-label">Max Cost (₹)</label>
                    <input type="number" value={newCostMax} onChange={(e) => setNewCostMax(e.target.value)} required className="input-field font-mono" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline text-xs px-4 py-2">Cancel</button>
                  <button type="submit" className="btn-primary text-xs px-5 py-2">Save Benchmark</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
