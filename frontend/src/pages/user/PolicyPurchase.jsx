import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, ShieldCheck, Car, Calendar, CheckCircle2,
  ArrowRight, ArrowLeft, FileCheck2, Zap, ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { savePolicyToRTDB } from '../../services/realtimeDb';

const VEHICLE_TYPES = [
  { id: 'Sedan',     name: 'Sedan',            icon: '🚗', example: 'e.g., Hyundai i20, Honda City' },
  { id: 'SUV',       name: 'SUV / Crossover',  icon: '🚙', example: 'e.g., Hyundai Creta, Toyota RAV4' },
  { id: 'Hatchback', name: 'Hatchback',        icon: '🏎️', example: 'e.g., Swift, Baleno, Polo' },
  { id: 'EV',        name: 'Electric Vehicle', icon: '⚡', example: 'e.g., Tesla Model 3, Nexon EV' },
  { id: 'Luxury',    name: 'Luxury / Sport',   icon: '💎', example: 'e.g., BMW 330i, Mercedes C-Class' },
];

const POLICY_PLANS = [
  {
    id: 'Comprehensive Zero-Dep',
    name: 'Comprehensive Zero-Depreciation',
    badge: 'Most Popular',
    badgeColor: 'bg-[#EAF4FF] text-[#1268E8] border-[#1268E8]/30',
    annualPremium: 18500,
    monthlyEquivalent: 1650,
    coverageAmount: '₹ 8,50,000',
    description: '100% bumper-to-bumper coverage with zero deduction for plastic, fiber, and glass depreciation.',
    features: [
      '100% replacement cost for metal, glass & plastic parts',
      'AI-powered instant damage claim verification in under 3 mins',
      'Zero deductible on first 2 claims of the policy year',
      '24/7 complimentary roadside assistance & towing',
      'Certified forensic PDF report generation for disputes'
    ],
    recommended: true
  },
  {
    id: 'Standard Comprehensive',
    name: 'Standard Comprehensive',
    badge: 'Standard',
    badgeColor: 'bg-green-50 text-green-700 border-green-200',
    annualPremium: 12000,
    monthlyEquivalent: 1080,
    coverageAmount: '₹ 6,50,000',
    description: 'Complete protection against accidents, fire, theft, and third-party liabilities.',
    features: [
      '80% parts coverage with standard depreciation scale',
      'Automated AI damage assessment & cost evaluation',
      'Third-party property and bodily injury indemnity',
      'Emergency roadside assistance within 50km radius',
      'Direct surveyor settlement authorization'
    ],
    recommended: false
  },
  {
    id: 'Third-Party + Collision',
    name: 'Third-Party & Collision Essential',
    badge: 'Essential',
    badgeColor: 'bg-[#F7FAFD] text-[#6B7280] border-[#E5E7EB]',
    annualPremium: 7500,
    monthlyEquivalent: 690,
    coverageAmount: '₹ 4,00,000',
    description: 'Statutory legal protection combined with essential accident collision coverage.',
    features: [
      'Full legal third-party liability coverage',
      'Self-damage collision repair up to ₹4,00,000',
      'AI damage segmentation validation',
      'Standard claim review process',
      'Online claim filing portal access'
    ],
    recommended: false
  }
];

export default function PolicyPurchase() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const savedPolicy = (() => { try { const p = localStorage.getItem('active_policy'); return p ? JSON.parse(p) : null; } catch { return null; } })();
  const savedVeh    = (() => { try { const v = localStorage.getItem('registered_vehicle'); return v ? JSON.parse(v) : null; } catch { return null; } })();

  const [vehicleType, setVehicleType]     = useState(savedPolicy?.vehicle_type  || savedVeh?.type  || 'Sedan');
  const [vehicleModel, setVehicleModel]   = useState(savedPolicy?.vehicle_model || (savedVeh?.make ? `${savedVeh.make} ${savedVeh.model}`.trim() : ''));
  const [vehiclePlate, setVehiclePlate]   = useState(savedPolicy?.vehicle_plate || savedVeh?.plate || '');
  const [vehicleYear, setVehicleYear]     = useState(savedPolicy?.vehicle_year  || savedVeh?.year  || new Date().getFullYear().toString());
  const [chassisNumber, setChassisNumber] = useState(savedPolicy?.chassis_number || savedVeh?.chassis || '');

  const [selectedPlan, setSelectedPlan]       = useState(POLICY_PLANS[0]);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [issuedPolicy, setIssuedPolicy]       = useState(null);

  const calculateDates = () => {
    const now = new Date();
    const startDate = now.toISOString();
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + 1);
    const endDate = expiry.toISOString();
    return { startDate, endDate, startFormatted: now.toLocaleDateString(), endFormatted: expiry.toLocaleDateString() };
  };

  const handleProceedToPlans = (e) => {
    e.preventDefault();
    if (!vehicleModel.trim() || !vehiclePlate.trim()) {
      toast.error('Please enter complete vehicle model and registration number.');
      return;
    }
    setStep(2);
  };

  const handlePurchasePolicy = async () => {
    setPaymentProcessing(true);
    const { startDate, endDate } = calculateDates();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const policyNumber = `POL-${new Date().getFullYear()}-${randomCode}`;

    const policyData = {
      id: `POL_${Date.now()}`,
      policy_number: policyNumber,
      user_id: user?.id || user?.uid || 'current_user',
      user_name: user?.name || 'Policyholder',
      user_email: user?.email || '',
      vehicle_type: vehicleType,
      vehicle_model: vehicleModel,
      vehicle_plate: vehiclePlate.toUpperCase(),
      vehicle_year: vehicleYear,
      chassis_number: chassisNumber,
      coverage_type: selectedPlan.name,
      coverage_amount: selectedPlan.coverageAmount,
      annual_premium: selectedPlan.annualPremium,
      monthly_instalment: selectedPlan.monthlyEquivalent,
      start_date: startDate,
      end_date: endDate,
      validity_days: 365,
      status: 'Active',
      purchased_at: new Date().toISOString()
    };

    try {
      localStorage.setItem('active_policy', JSON.stringify(policyData));
      if (user?.uid || user?.id) await savePolicyToRTDB(user.uid || user.id, policyData);
      setIssuedPolicy(policyData);
      setStep(3);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success(`Policy ${policyNumber} activated with 1-Year Validity!`, { duration: 5000, icon: '🛡️' });
    } catch (err) {
      console.error('Error issuing policy:', err);
      toast.error('Failed to issue policy. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFD] antialiased font-sans py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#06244F] flex items-center justify-center shadow-md group-hover:bg-[#082B5C] transition-colors">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-[#06244F]">AutoSure</span>
              <span className="text-[11px] text-[#6B7280] block -mt-0.5 font-medium">Annual Vehicle Policy Issuance & Coverage Onboarding</span>
            </div>
          </Link>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#06244F] px-3 py-1.5 rounded-xl hover:bg-[#F7FAFD] border border-[#E5E7EB] transition-colors">
            <span>Skip to Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Step Navigator */}
        <div className="card p-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { num: 1, title: 'Vehicle Specs',  sub: 'Model & registration details' },
              { num: 2, title: 'Annual Plan',     sub: '1-Year validity coverage' },
              { num: 3, title: 'Policy Active',   sub: 'Instant digital certificate' },
            ].map(({ num, title, sub }) => (
              <div
                key={num}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  step === num
                    ? 'bg-[#EAF4FF] border border-[#1268E8]/30 text-[#06244F]'
                    : step > num
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'text-[#9CA3AF] opacity-60'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === num ? 'bg-[#1268E8] text-white' : step > num ? 'bg-green-500 text-white' : 'bg-[#F7FAFD] text-[#9CA3AF] border border-[#E5E7EB]'
                }`}>
                  {step > num ? <CheckCircle2 className="w-4 h-4" /> : num}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <p className="text-xs font-bold leading-none">{title}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-1 truncate">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: VEHICLE DETAILS */}
        {step === 1 && (
          <div className="card p-6 sm:p-8 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF4FF] border border-[#1268E8]/20 text-[#1268E8] text-xs font-semibold mb-2">
                <Car className="w-3.5 h-3.5" /> Step 1: Vehicle Information
              </div>
              <h2 className="text-2xl font-bold text-[#06244F] tracking-tight">Enter Vehicle Specifications for Annual Policy</h2>
              <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
                Your annual insurance certificate and AI damage inspections will be tied to this insured vehicle.
              </p>
            </div>

            {/* Vehicle Type Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">Select Vehicle Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {VEHICLE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setVehicleType(type.id)}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      vehicleType === type.id
                        ? 'bg-[#EAF4FF] border-[#1268E8] text-[#06244F] ring-1 ring-[#1268E8]/20'
                        : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#1268E8]/40 hover:bg-[#F7FAFD]'
                    }`}
                  >
                    <span className="text-2xl mb-1">{type.icon}</span>
                    <span className="text-xs font-bold">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleProceedToPlans} className="space-y-4 pt-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Vehicle Make & Model</label>
                  <input type="text" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)}
                    className="input-field text-sm" placeholder="e.g. Hyundai i20 Asta, Honda Civic" required />
                </div>
                <div>
                  <label className="input-label">Registration Plate Number</label>
                  <input type="text" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    className="input-field text-sm font-mono uppercase" placeholder="e.g. KA-01-MJ-8821" required />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Manufacturing Year</label>
                  <select value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} className="input-field text-sm">
                    <option value="2026">2026 (Brand New)</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Chassis / VIN Number (Optional)</label>
                  <input type="text" value={chassisNumber} onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                    className="input-field text-sm font-mono uppercase" placeholder="MALC251CL094821" />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button type="submit" className="btn-primary flex items-center gap-2 px-6 py-3 text-sm">
                  <span>Select Annual Coverage Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: CHOOSE PLAN & PURCHASE */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="card p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold mb-2">
                    <Calendar className="w-3.5 h-3.5" /> Step 2: 1-Year Validity Policy Selection
                  </div>
                  <h2 className="text-2xl font-bold text-[#06244F] tracking-tight">Select Your Annual Insurance Tier</h2>
                  <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
                    Insuring <strong className="text-[#06244F]">{vehicleModel}</strong> ({vehiclePlate}) with 365-day automated claim protection.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F7FAFD] text-[#06244F] text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit Vehicle Specs
                </button>
              </div>

              {/* Plans Comparison Grid */}
              <div className="grid md:grid-cols-3 gap-6">
                {POLICY_PLANS.map((plan) => {
                  const isSelected = selectedPlan.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`relative rounded-2xl p-6 border flex flex-col justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#EAF4FF] border-[#1268E8] shadow-sm ring-2 ring-[#1268E8]/20 scale-[1.02]'
                          : 'bg-white border-[#E5E7EB] hover:border-[#1268E8]/40 hover:bg-[#F7FAFD]'
                      }`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#1268E8] text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
                          Recommended
                        </div>
                      )}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${plan.badgeColor}`}>{plan.badge}</span>
                          <span className="text-[11px] font-semibold text-[#9CA3AF]">1 Year Validity</span>
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-[#06244F] leading-snug">{plan.name}</h3>
                          <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{plan.description}</p>
                        </div>
                        <div className="p-3.5 bg-[#F7FAFD] rounded-xl border border-[#E5E7EB]">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-[#06244F]">₹{plan.annualPremium.toLocaleString()}</span>
                            <span className="text-xs text-[#6B7280] font-medium">/ year</span>
                          </div>
                          <p className="text-[11px] text-green-600 font-semibold mt-0.5">Max Insured Value: {plan.coverageAmount}</p>
                        </div>
                        <ul className="space-y-2 text-xs text-[#1F2937]">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-6">
                        <div className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center transition-all ${
                          isSelected ? 'bg-[#1268E8] text-white shadow-sm' : 'bg-[#F7FAFD] text-[#6B7280] border border-[#E5E7EB]'
                        }`}>
                          {isSelected ? '✓ Plan Selected' : 'Choose Plan'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Purchase Action Box */}
              <div className="mt-8 p-5 rounded-xl bg-[#06244F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                    <span>Instant Digital Certificate with 365-Day Validity</span>
                  </div>
                  <p className="text-xs text-blue-200 mt-1">
                    Total Due: <strong className="text-white font-mono">₹{selectedPlan.annualPremium.toLocaleString()}</strong> (Annual Coverage for {vehiclePlate})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePurchasePolicy}
                  disabled={paymentProcessing}
                  className="px-8 py-3.5 bg-green-500 hover:bg-green-400 text-white font-extrabold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shrink-0"
                >
                  {paymentProcessing ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Activating Annual Policy...</span></>
                  ) : (
                    <><Zap className="w-4 h-4 text-amber-300" /><span>Purchase & Activate Annual Policy</span></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMATION & CERTIFICATE */}
        {step === 3 && issuedPolicy && (
          <div className="space-y-6 animate-fade-in">
            <div className="card border-green-200 p-6 sm:p-8 relative overflow-hidden">
              <div className="text-center max-w-xl mx-auto space-y-3 mb-8">
                <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center text-green-600 mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-[#06244F] tracking-tight">Annual Policy Active & Certified!</h2>
                <p className="text-[#6B7280] text-xs sm:text-sm leading-relaxed">
                  Your vehicle is now actively protected under the 1-Year AI Damage Assessment protocol.
                  If an accident happens anytime during the year, upload photos to receive instant assessment.
                </p>
              </div>

              {/* Digital Policy Certificate */}
              <div className="max-w-2xl mx-auto bg-[#F7FAFD] border border-[#E5E7EB] rounded-2xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#EAF4FF] border border-[#1268E8]/20 rounded-xl text-[#1268E8]">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#06244F]">Certificate of Motor Insurance</p>
                      <p className="text-[10px] text-[#9CA3AF] font-mono">Issued by AutoSure Underwriting</p>
                    </div>
                  </div>
                  <span className="badge-green">● Active (365 Days)</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 py-5 border-b border-[#E5E7EB] text-xs">
                  <div>
                    <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Policy Number</span>
                    <span className="text-[#06244F] font-mono font-bold text-sm select-all">{issuedPolicy.policy_number}</span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Insured Policyholder</span>
                    <span className="text-[#06244F] font-bold">{issuedPolicy.user_name} ({issuedPolicy.user_email})</span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Insured Vehicle</span>
                    <span className="text-[#06244F] font-bold">{issuedPolicy.vehicle_model}</span>
                    <span className="text-[#6B7280] text-[10px] block font-mono">{issuedPolicy.vehicle_plate}</span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Coverage Plan</span>
                    <span className="text-[#1268E8] font-bold">{issuedPolicy.coverage_type}</span>
                    <span className="text-[10px] text-[#6B7280] block">Max IDV: {issuedPolicy.coverage_amount}</span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Policy Start Date</span>
                    <span className="text-[#1F2937] font-mono">{new Date(issuedPolicy.start_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-[#9CA3AF] block text-[10px] uppercase font-semibold">Policy Expiry Date (1 Year)</span>
                    <span className="text-green-600 font-mono font-bold">{new Date(issuedPolicy.end_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-[11px] text-[#6B7280]">
                  <div className="flex items-center gap-1.5 text-[#1F2937]">
                    <FileCheck2 className="w-4 h-4 text-green-500" />
                    <span>Annual Premium Paid: <strong>₹{issuedPolicy.annual_premium.toLocaleString()}</strong></span>
                  </div>
                  <span className="text-[10px] font-mono text-[#9CA3AF]">Secure SHA-256 Verified</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="max-w-md mx-auto mt-8 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/claims/new"
                  className="w-full py-3.5 px-4 btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Car className="w-4 h-4" />
                  <span>File Accident Claim Now</span>
                </Link>
                <Link
                  to="/dashboard"
                  className="w-full py-3.5 px-4 btn-outline flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <span>Go to Policyholder Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
