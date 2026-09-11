import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Car,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  FileCheck2,
  Clock,
  Zap,
  Info,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { savePolicyToRTDB } from '../../services/realtimeDb';

const VEHICLE_TYPES = [
  { id: 'Sedan', name: 'Sedan', icon: '🚗', example: 'e.g., Hyundai i20, Honda City' },
  { id: 'SUV', name: 'SUV / Crossover', icon: '🚙', example: 'e.g., Hyundai Creta, Toyota RAV4' },
  { id: 'Hatchback', name: 'Hatchback', icon: '🏎️', example: 'e.g., Swift, Baleno, Polo' },
  { id: 'EV', name: 'Electric Vehicle', icon: '⚡', example: 'e.g., Tesla Model 3, Nexon EV' },
  { id: 'Luxury', name: 'Luxury / Sport', icon: '💎', example: 'e.g., BMW 330i, Mercedes C-Class' },
];

const POLICY_PLANS = [
  {
    id: 'Comprehensive Zero-Dep',
    name: 'Comprehensive Zero-Depreciation',
    badge: 'Most Popular',
    badgeColor: 'bg-primary-500/20 text-primary-300 border-primary-500/30',
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
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
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
    badgeColor: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
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

  // Wizard Step State
  const [step, setStep] = useState(1); // 1: Vehicle, 2: Plan, 3: Confirmation
  
  // Vehicle Details
  const [vehicleType, setVehicleType] = useState('Sedan');
  const [vehicleModel, setVehicleModel] = useState('Hyundai i20 Asta');
  const [vehiclePlate, setVehiclePlate] = useState('KA-01-MJ-8821');
  const [vehicleYear, setVehicleYear] = useState('2024');
  const [chassisNumber, setChassisNumber] = useState('MALC251CL094821');

  // Plan Selection
  const [selectedPlan, setSelectedPlan] = useState(POLICY_PLANS[0]);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Issued Policy State
  const [issuedPolicy, setIssuedPolicy] = useState(null);

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
    const { startDate, endDate, startFormatted, endFormatted } = calculateDates();
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
      // 1. Save to local storage for immediate offline / instant sync
      localStorage.setItem('active_policy', JSON.stringify(policyData));
      
      // 2. Save to Firebase Realtime Database
      if (user?.uid || user?.id) {
        await savePolicyToRTDB(user.uid || user.id, policyData);
      }

      setIssuedPolicy(policyData);
      setStep(3);

      // Trigger Celebration Confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast.success(`Policy ${policyNumber} activated with 1-Year Validity!`, {
        duration: 5000,
        icon: '🛡️'
      });
    } catch (err) {
      console.error('Error issuing policy:', err);
      toast.error('Failed to issue policy. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans relative overflow-hidden py-10 px-4 sm:px-6">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="p-2.5 bg-gradient-to-tr from-primary-600 to-blue-500 rounded-xl shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
                SecureClaim <span className="text-primary-400">AI</span>
              </span>
              <span className="text-[11px] text-slate-400 block -mt-1 font-medium">
                Annual Vehicle Policy Issuance & Coverage Onboarding
              </span>
            </div>
          </Link>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 border border-slate-800 transition-colors"
          >
            <span>Skip to Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Lifecycle Stepper Navigation */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                step === 1
                  ? 'bg-primary-600/20 border border-primary-500/40 text-white'
                  : step > 1
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'text-slate-500 opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === 1
                    ? 'bg-primary-500 text-white'
                    : step > 1
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="text-xs font-bold leading-none">Vehicle Specs</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Model & registration details</p>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                step === 2
                  ? 'bg-primary-600/20 border border-primary-500/40 text-white'
                  : step > 2
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'text-slate-500 opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === 2
                    ? 'bg-primary-500 text-white'
                    : step > 2
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {step > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="text-xs font-bold leading-none">Annual Plan</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">1-Year validity coverage</p>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                step === 3
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-white'
                  : 'text-slate-500 opacity-60'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === 3 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                3
              </div>
              <div className="min-w-0 hidden sm:block">
                <p className="text-xs font-bold leading-none">Policy Active</p>
                <p className="text-[10px] text-slate-400 mt-1 truncate">Instant digital certificate</p>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1: VEHICLE DETAILS */}
        {step === 1 && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs font-semibold mb-2">
                <Car className="w-3.5 h-3.5" /> Step 1: Vehicle Information
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Enter Vehicle Specifications for Annual Policy
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Your annual insurance certificate and AI damage inspections will be tied to this insured vehicle.
              </p>
            </div>

            {/* Vehicle Type Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Select Vehicle Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {VEHICLE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setVehicleType(type.id)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      vehicleType === type.id
                        ? 'bg-primary-600/20 border-primary-500 text-white shadow-lg shadow-primary-600/20 ring-1 ring-primary-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Vehicle Make & Model
                  </label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm"
                    placeholder="e.g. Hyundai i20 Asta, Honda Civic"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Registration Plate Number
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 uppercase font-mono text-sm"
                    placeholder="e.g. KA-01-MJ-8821"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Manufacturing Year
                  </label>
                  <select
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm"
                  >
                    <option value="2026">2026 (Brand New)</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Chassis / VIN Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={chassisNumber}
                    onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 uppercase font-mono text-sm"
                    placeholder="MALC251CL094821"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 flex items-center gap-2 text-sm transition-all"
                >
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
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
                    <Calendar className="w-3.5 h-3.5" /> Step 2: 1-Year Validity Policy Selection
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Select Your Annual Insurance Tier
                  </h2>
                  <p className="text-slate-400 text-xs sm:text-sm mt-1">
                    Insuring <strong className="text-white">{vehicleModel}</strong> ({vehiclePlate}) with 365-day automated claim protection.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
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
                      className={`relative rounded-3xl p-6 border flex flex-col justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-900 border-primary-500 shadow-2xl ring-2 ring-primary-500 shadow-primary-500/20 scale-[1.02]'
                          : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      {plan.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-lg">
                          Recommended
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${plan.badgeColor}`}>
                            {plan.badge}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">1 Year Validity</span>
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-white leading-snug">{plan.name}</h3>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{plan.description}</p>
                        </div>

                        <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white">₹{plan.annualPremium.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 font-medium">/ year</span>
                          </div>
                          <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                            Max Insured Value: {plan.coverageAmount}
                          </p>
                        </div>

                        <ul className="space-y-2 text-xs text-slate-300">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-6">
                        <div
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center transition-all ${
                            isSelected
                              ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isSelected ? '✓ Plan Selected' : 'Choose Plan'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Purchase Action Box */}
              <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-primary-950/80 to-slate-900 border border-primary-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Instant Digital Certificate with 365-Day Validity</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Total Due: <strong className="text-white font-mono">₹{selectedPlan.annualPremium.toLocaleString()}</strong> (Annual Coverage for {vehiclePlate})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePurchasePolicy}
                  disabled={paymentProcessing}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-primary-600 hover:from-emerald-500 hover:to-primary-500 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {paymentProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Activating Annual Policy...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Purchase & Activate Annual Policy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMATION & CERTIFICATE */}
        {step === 3 && issuedPolicy && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="text-center max-w-xl mx-auto space-y-3 mb-8">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  Annual Policy Active & Certified!
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  Your vehicle is now actively protected under the 1-Year AI Damage Assessment protocol.
                  If an accident happens anytime during the year, upload photos to receive instant assessment.
                </p>
              </div>

              {/* Digital Policy Certificate Card */}
              <div className="max-w-2xl mx-auto bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-primary-600/20 border border-primary-500/30 rounded-xl text-primary-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-white">Certificate of Motor Insurance</p>
                      <p className="text-[10px] text-slate-400 font-mono">Issued by SecureClaim AI Underwriting</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-extrabold uppercase tracking-wider">
                    ● Active (365 Days)
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 py-5 border-b border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Policy Number</span>
                    <span className="text-white font-mono font-bold text-sm select-all">{issuedPolicy.policy_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Insured Policyholder</span>
                    <span className="text-white font-bold">{issuedPolicy.user_name} ({issuedPolicy.user_email})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Insured Vehicle</span>
                    <span className="text-white font-bold">{issuedPolicy.vehicle_model}</span>
                    <span className="text-slate-400 text-[10px] block font-mono">{issuedPolicy.vehicle_plate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Coverage Plan</span>
                    <span className="text-primary-300 font-bold">{issuedPolicy.coverage_type}</span>
                    <span className="text-[10px] text-slate-400 block">Max IDV: {issuedPolicy.coverage_amount}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Policy Start Date</span>
                    <span className="text-slate-200 font-mono">{new Date(issuedPolicy.start_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Policy Expiry Date (1 Year)</span>
                    <span className="text-emerald-400 font-mono font-bold">{new Date(issuedPolicy.end_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                    <span>Annual Premium Paid: <strong>₹{issuedPolicy.annual_premium.toLocaleString()}</strong></span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Secure SHA-256 Verified</span>
                </div>
              </div>

              {/* Direct Next Action Buttons */}
              <div className="max-w-md mx-auto mt-8 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/claims/new"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-primary-600/30 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
                >
                  <Car className="w-4 h-4" />
                  <span>File Accident Claim Now</span>
                </Link>

                <Link
                  to="/dashboard"
                  className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all"
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
