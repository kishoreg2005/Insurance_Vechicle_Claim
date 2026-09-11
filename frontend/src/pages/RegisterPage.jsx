import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle,
  User, Mail, Phone, MapPin, Lock, Hash, FileText, Calendar,
  Car, Camera, Trash2, CreditCard, Smartphone, Building2, Banknote,
  ShieldCheck, Star, Loader2, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { syncCustomerToRTDB, syncVehicleToRTDB, savePolicyToRTDB } from '../services/realtimeDb';

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: 'Your Details',    icon: User },
  { id: 2, label: 'Vehicle Info',    icon: Car },
  { id: 3, label: 'Vehicle Photos',  icon: Camera },
  { id: 4, label: 'Choose Policy',   icon: ShieldCheck },
  { id: 5, label: 'Payment',         icon: CreditCard },
];

const VEHICLE_TYPES = ['Sedan', 'SUV / Crossover', 'Hatchback', 'Electric Vehicle', 'Luxury / Sport', 'Truck / Pickup', 'Two-Wheeler'];
const FUEL_TYPES    = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const COLOURS       = ['White', 'Silver', 'Black', 'Grey', 'Red', 'Blue', 'Brown', 'Green', 'Orange', 'Yellow', 'Gold'];

const PLANS = [
  {
    id: 'zero-dep',
    name: 'Comprehensive Zero-Dep',
    badge: 'Most Popular',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    premium: 18500,
    idv: '₹8,50,000',
    desc: '100% bumper-to-bumper. Zero deduction on plastic, glass & fibre parts.',
    perks: ['Zero depreciation on all parts', 'AI claim verified < 3 min', '0 deductible (first 2 claims)', '24/7 roadside assistance', 'Certified PDF assessment report'],
    highlight: true,
  },
  {
    id: 'standard',
    name: 'Standard Comprehensive',
    badge: 'Standard',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    premium: 12000,
    idv: '₹6,50,000',
    desc: 'Full accident, fire, theft & third-party liability cover.',
    perks: ['All accident damage covered', 'Fire & theft protection', 'Third-party liability', 'AI damage report', 'Online claim tracker'],
    highlight: false,
  },
  {
    id: 'third-party',
    name: 'Third-Party Liability',
    badge: 'Basic',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    premium: 5500,
    idv: '₹2,00,000',
    desc: 'Statutory minimum cover — third-party injury & property damage only.',
    perks: ['Third-party bodily injury', 'Property damage liability', 'Legally compliant', 'Digital certificate', 'Email support'],
    highlight: false,
  },
];

const PAY_METHODS = [
  { id: 'upi',  label: 'UPI',         icon: Smartphone, sub: 'GPay · PhonePe · BHIM',  color: 'text-green-400' },
  { id: 'card', label: 'Card',        icon: CreditCard,  sub: 'Visa · Mastercard · RuPay', color: 'text-blue-400' },
  { id: 'net',  label: 'Net Banking', icon: Building2,   sub: 'All major banks',          color: 'text-purple-400' },
  { id: 'emi',  label: 'EMI',         icon: Banknote,    sub: '0 % interest · 12 months', color: 'text-amber-400' },
];

const PHOTO_SLOTS = [
  { id: 'front',     label: 'Front View',         req: true,  hint: 'Bumper & headlights visible' },
  { id: 'rear',      label: 'Rear View',           req: true,  hint: 'Tail-lights & number plate' },
  { id: 'left',      label: 'Left Side',           req: false, hint: 'Full left profile' },
  { id: 'right',     label: 'Right Side',          req: false, hint: 'Full right profile' },
  { id: 'dashboard', label: 'Dashboard / Odometer',req: false, hint: 'Odometer reading clearly visible' },
  { id: 'rc',        label: 'RC Book',             req: false, hint: 'Registration document page' },
];

/* ─────────────────────────────────────────────
   Tiny shared UI helpers
───────────────────────────────────────────── */
function Input({ label, icon: Icon, error, type = 'text', right, ...rest }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />} {label}
      </label>
      <div className="relative">
        <input
          type={type}
          className={`w-full bg-slate-950/70 border ${error ? 'border-rose-500' : 'border-slate-700'} rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all ${right ? 'pr-10' : ''}`}
          {...rest}
        />
        {right && <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      {error && (
        <p className="text-[11px] text-rose-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

function Select({ label, icon: Icon, children, ...rest }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />} {label}
      </label>
      <select
        className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Step Progress Bar
───────────────────────────────────────────── */
function Progress({ step }) {
  return (
    <div className="flex items-center justify-center mb-8 select-none">
      {STEPS.map((s, i) => {
        const done   = step > s.id;
        const active = step === s.id;
        const Icon   = s.icon;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                done   ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : active ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-600/40'
                :          'bg-slate-900 border-slate-700 text-slate-500'
              }`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4.5 h-4.5" />}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? 'text-white' : done ? 'text-emerald-400' : 'text-slate-600'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-10 sm:w-16 h-0.5 -mt-4 mx-1 transition-all duration-500 ${done ? 'bg-emerald-500' : 'bg-slate-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 1 – Customer Details
───────────────────────────────────────────── */
function StepCustomer({ data, set, errs }) {
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-white">Your Personal Details</h2>
        <p className="text-slate-400 text-sm mt-0.5">Tell us about yourself — all fields marked * are required</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name *" icon={User}     error={errs.name}    placeholder="Alex Mercer"       value={data.name}    onChange={e => set('name', e.target.value)} />
        <Input label="Date of Birth" icon={Calendar} type="date"         placeholder="" value={data.dob}     onChange={e => set('dob', e.target.value)}  max={new Date(Date.now() - 18*365*24*3600*1000).toISOString().split('T')[0]} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Email Address *" icon={Mail}  error={errs.email}   placeholder="you@example.com"  value={data.email}   onChange={e => set('email', e.target.value)} />
        <Input label="Mobile Number"   icon={Phone}                       placeholder="+91 98765 43210"  value={data.phone}   onChange={e => set('phone', e.target.value)} />
      </div>

      <Input label="Home Address" icon={MapPin} placeholder="123, MG Road, Bengaluru 560001" value={data.address} onChange={e => set('address', e.target.value)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Aadhaar / National ID" icon={Hash}     placeholder="1234 5678 9012" maxLength={14} value={data.aadhaar} onChange={e => set('aadhaar', e.target.value.replace(/[^0-9 ]/g, ''))} />
        <Input label="PAN Card"              icon={FileText} placeholder="ABCDE1234F"     maxLength={10} value={data.pan}     onChange={e => set('pan', e.target.value.toUpperCase())} />
      </div>

      <div className="border-t border-slate-800 pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Account Password</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Password *" error={errs.password} type={showPw ? 'text' : 'password'} placeholder="••••••••"
            value={data.password} onChange={e => set('password', e.target.value)}
            right={
              <button type="button" onClick={() => setShowPw(v => !v)} className="text-slate-500 hover:text-slate-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <Input
            label="Confirm Password *" error={errs.cpassword} type={showCpw ? 'text' : 'password'} placeholder="••••••••"
            value={data.cpassword} onChange={e => set('cpassword', e.target.value)}
            right={
              <button type="button" onClick={() => setShowCpw(v => !v)} className="text-slate-500 hover:text-slate-300">
                {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 2 – Vehicle Details
───────────────────────────────────────────── */
function StepVehicle({ data, set, errs }) {
  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-white">Vehicle Information</h2>
        <p className="text-slate-400 text-sm mt-0.5">Enter your vehicle's registration details accurately</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Vehicle Type *" icon={Car} value={data.type} onChange={e => set('type', e.target.value)}>
          <option value="">Select vehicle type…</option>
          {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
        </Select>
        <Input label="Make / Brand *" error={errs.make}  placeholder="e.g. Hyundai" value={data.make}  onChange={e => set('make', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Model *"               error={errs.model} placeholder="e.g. i20 Asta"   value={data.model}  onChange={e => set('model', e.target.value)} />
        <Select label="Year of Manufacture" value={data.year} onChange={e => set('year', e.target.value)}>
          <option value="">Select year…</option>
          {Array.from({ length: 20 }, (_, i) => 2025 - i).map(y => <option key={y}>{y}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Registration Number (Plate) *" icon={Hash} error={errs.plate} placeholder="KA-01-MJ-8821"     value={data.plate}   onChange={e => set('plate',   e.target.value.toUpperCase())} />
        <Input label="Chassis / VIN"                             placeholder="MA3EWD2J6LT000001"  value={data.chassis} onChange={e => set('chassis', e.target.value.toUpperCase())} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input  label="Engine Number"                         placeholder="K12MK123456"  value={data.engine}  onChange={e => set('engine', e.target.value.toUpperCase())} />
        <Select label="Fuel Type"         value={data.fuel}   onChange={e => set('fuel',   e.target.value)}>
          <option value="">Select…</option>
          {FUEL_TYPES.map(f => <option key={f}>{f}</option>)}
        </Select>
        <Select label="Colour"            value={data.colour} onChange={e => set('colour', e.target.value)}>
          <option value="">Select…</option>
          {COLOURS.map(c => <option key={c}>{c}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Engine Capacity (CC)" type="number" placeholder="1197"  value={data.cc}        onChange={e => set('cc',        e.target.value)} />
        <Input label="Odometer Reading (km)" type="number" placeholder="24500" value={data.odometer}  onChange={e => set('odometer',  e.target.value)} />
      </div>

      <Input label="RC Book Number" placeholder="KA01201900123456" value={data.rcBook} onChange={e => set('rcBook', e.target.value.toUpperCase())} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 3 – Vehicle Photos
───────────────────────────────────────────── */
function StepPhotos({ photos, onAdd, onRemove }) {
  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-white">Vehicle Profile Photos</h2>
        <p className="text-slate-400 text-sm mt-0.5">Upload clear photos for verification. <span className="text-rose-400 font-semibold">Front & Rear are required.</span></p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PHOTO_SLOTS.map(slot => {
          const file    = photos[slot.id];
          const preview = file ? URL.createObjectURL(file) : null;
          return (
            <label
              key={slot.id}
              htmlFor={`img-${slot.id}`}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed overflow-hidden aspect-[4/3] flex flex-col items-center justify-center transition-all group ${
                file
                  ? 'border-emerald-500/60 bg-emerald-500/5'
                  : 'border-slate-700 bg-slate-950/60 hover:border-primary-500/60 hover:bg-primary-500/5'
              }`}
            >
              <input
                id={`img-${slot.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && onAdd(slot.id, e.target.files[0])}
              />

              {file && preview ? (
                <>
                  <img src={preview} alt={slot.label} className="absolute inset-0 w-full h-full object-cover" />
                  {/* overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={e => { e.preventDefault(); onRemove(slot.id); }}
                      className="p-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-0.5 shadow">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1.5 p-3 text-center pointer-events-none">
                  <Camera className="w-7 h-7 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-300 leading-tight">
                    {slot.label}
                    {slot.req && <span className="text-rose-400 ml-0.5">*</span>}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">{slot.hint}</p>
                </div>
              )}
            </label>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
        <Camera className="w-3.5 h-3.5" />
        JPG, PNG, HEIC · Max 10 MB per image · All uploads are encrypted in transit
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 4 – Policy Selection
───────────────────────────────────────────── */
function StepPolicy({ selected, onSelect }) {
  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-white">Choose Your Insurance Plan</h2>
        <p className="text-slate-400 text-sm mt-0.5">Select the annual motor policy that best fits your needs</p>
      </header>

      <div className="space-y-3">
        {PLANS.map(plan => (
          <button
            key={plan.id}
            type="button"
            onClick={() => onSelect(plan.id)}
            className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
              selected === plan.id
                ? 'border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/10'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-600 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${plan.badgeClass}`}>
                    {plan.badge}
                  </span>
                  {plan.highlight && (
                    <span className="text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-300" /> Recommended
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{plan.desc}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
                  {plan.perks.map(p => (
                    <span key={p} className="flex items-center gap-1 text-[10px] text-slate-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-2xl font-extrabold text-white font-mono">
                  ₹{plan.premium.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] text-slate-400">/ year</p>
                <p className="text-xs text-emerald-400 font-semibold mt-1">IDV {plan.idv}</p>
              </div>
            </div>

            {selected === plan.id && (
              <div className="mt-3 pt-3 border-t border-primary-500/30 flex items-center gap-1.5 text-primary-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Selected — 1-Year Policy
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP 5 – Payment
───────────────────────────────────────────── */
function StepPayment({ method, setMethod, plan, vehicle, upi, setUpi, card, setCard, bank, setBank }) {
  const p    = PLANS.find(x => x.id === plan) || PLANS[0];
  const gst  = Math.round(p.premium * 0.18);
  const total = p.premium + gst;

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-white">Payment</h2>
        <p className="text-slate-400 text-sm mt-0.5">Review your order and complete the secure payment</p>
      </header>

      {/* Order Summary */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Summary</p>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Plan</span>
            <span className="text-white font-semibold">{p.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Vehicle</span>
            <span className="text-white font-mono text-xs">{vehicle.make} {vehicle.model} · {vehicle.plate || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Coverage (IDV)</span>
            <span className="text-emerald-400 font-semibold">{p.idv}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Validity</span>
            <span className="text-slate-200">1 Year</span>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-2 space-y-1 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Base Premium</span>
            <span>₹{p.premium.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>GST (18%)</span>
            <span>₹{gst.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-base">
          <span className="text-white">Total Payable</span>
          <span className="text-primary-300 font-mono">₹{total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Payment Method</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PAY_METHODS.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                method === m.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
              }`}
            >
              <m.icon className={`w-5 h-5 ${m.color}`} />
              <span className="text-[11px] font-semibold text-white">{m.label}</span>
              <span className="text-[10px] text-slate-400 leading-tight">{m.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic fields */}
      {method === 'upi' && (
        <Input
          label="UPI ID" icon={Smartphone} placeholder="yourname@upi"
          value={upi} onChange={e => setUpi(e.target.value)}
        />
      )}

      {method === 'card' && (
        <div className="space-y-3">
          <Input
            label="Card Number" icon={CreditCard} placeholder="1234  5678  9012  3456" maxLength={19}
            value={card.num}
            onChange={e => setCard(c => ({ ...c, num: e.target.value.replace(/[^0-9]/g,'').replace(/(.{4})/g,'$1 ').trim() }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Expiry (MM/YY)" placeholder="MM/YY" maxLength={5} value={card.exp} onChange={e => setCard(c => ({ ...c, exp: e.target.value }))} />
            <Input label="CVV" type="password" placeholder="•••" maxLength={4} value={card.cvv} onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g,'') }))} />
          </div>
          <Input label="Name on Card" placeholder="As on card" value={card.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))} />
        </div>
      )}

      {method === 'net' && (
        <Select label="Select Your Bank" value={bank} onChange={e => setBank(e.target.value)}>
          <option value="">Choose bank…</option>
          {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda'].map(b => (
            <option key={b}>{b}</option>
          ))}
        </Select>
      )}

      {method === 'emi' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <p className="text-amber-300 font-semibold text-sm">0% Interest EMI — 12 Months</p>
          <p className="text-slate-400 text-xs mt-1">
            Pay ₹{Math.round(total / 12).toLocaleString('en-IN')} / month. Auto-debited on the 5th of each month from your registered bank account.
          </p>
        </div>
      )}

      {/* Security note */}
      <div className="flex items-start gap-2.5 bg-slate-900/60 border border-slate-800 rounded-xl p-3">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          256-bit SSL encrypted · PCI-DSS Level 1 compliant · Your card details are never stored on our servers.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
function mkId() { return Math.random().toString(36).slice(2, 10).toUpperCase(); }

export default function RegisterPage() {
  const navigate       = useNavigate();
  const { register }   = useAuth();

  /* ── current step ── */
  const [step, setStep] = useState(1);

  /* ── step 1: customer ── */
  const [cust, setCust]     = useState({ name:'', dob:'', email:'', phone:'', address:'', aadhaar:'', pan:'', password:'', cpassword:'' });
  const [cErrs, setCErrs]   = useState({});
  const setC = (k, v) => setCust(p => ({ ...p, [k]: v }));

  /* ── step 2: vehicle ── */
  const [veh, setVeh]       = useState({ type:'', make:'', model:'', year:'', plate:'', chassis:'', engine:'', fuel:'', colour:'', cc:'', odometer:'', rcBook:'' });
  const [vErrs, setVErrs]   = useState({});
  const setV = (k, v) => setVeh(p => ({ ...p, [k]: v }));

  /* ── step 3: photos ── */
  const [photos, setPhotos] = useState({});

  /* ── step 4: policy ── */
  const [plan, setPlan]     = useState('zero-dep');

  /* ── step 5: payment ── */
  const [method, setMethod] = useState('upi');
  const [upi, setUpi]       = useState('');
  const [card, setCard]     = useState({ num:'', exp:'', cvv:'', name:'' });
  const [bank, setBank]     = useState('');

  const [submitting, setSubmitting] = useState(false);

  /* ── Validation ── */
  const validate1 = () => {
    const e = {};
    if (!cust.name.trim())            e.name     = 'Full name is required';
    if (!cust.email.trim())           e.email    = 'Email address is required';
    if (!cust.password)               e.password = 'Password is required';
    else if (cust.password.length < 6) e.password = 'Minimum 6 characters';
    if (cust.password !== cust.cpassword) e.cpassword = 'Passwords do not match';
    setCErrs(e);
    return Object.keys(e).length === 0;
  };

  const validate2 = () => {
    const e = {};
    if (!veh.make.trim())  e.make  = 'Make / Brand is required';
    if (!veh.model.trim()) e.model = 'Model is required';
    if (!veh.plate.trim()) e.plate = 'Registration number is required';
    setVErrs(e);
    return Object.keys(e).length === 0;
  };

  const validate3 = () => {
    if (!photos.front) { toast.error('Front view photo is required'); return false; }
    if (!photos.rear)  { toast.error('Rear view photo is required');  return false; }
    return true;
  };

  /* ── Navigation ── */
  const goNext = () => {
    if (step === 1 && !validate1()) return;
    if (step === 2 && !validate2()) return;
    if (step === 3 && !validate3()) return;
    setStep(s => Math.min(s + 1, 5));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Create Firebase account
      const result = await register(cust.name.trim(), cust.email.trim(), cust.password, 'user');
      const userId = result?.user?.uid || result?.user?.id;

      if (userId) {
        // 2. Save customer profile to Realtime DB
        await syncCustomerToRTDB(userId, {
          name: cust.name, dob: cust.dob, email: cust.email,
          phone: cust.phone, address: cust.address,
          aadhaar: cust.aadhaar, pan: cust.pan,
        });

        // 3. Save vehicle to Realtime DB
        const vehicleId = `VEH-${mkId()}`;
        await syncVehicleToRTDB(vehicleId, { ...veh, userId });

        // 4. Activate policy
        const chosen      = PLANS.find(p => p.id === plan) || PLANS[0];
        const policyData  = {
          policy_number:      `POL-${new Date().getFullYear()}-${mkId()}`,
          vehicle_type:       veh.type || 'Sedan',
          vehicle_model:      `${veh.make} ${veh.model}`.trim() || 'My Vehicle',
          vehicle_plate:      veh.plate || 'N/A',
          coverage_type:      chosen.name,
          coverage_amount:    chosen.idv,
          annual_premium:     chosen.premium,
          monthly_instalment: Math.round(chosen.premium / 12),
          start_date:         new Date().toISOString(),
          end_date:           new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
          validity_days:      365,
          status:             'Active',
          payment_method:     method,
        };
        await savePolicyToRTDB(userId, policyData);
        localStorage.setItem('active_policy', JSON.stringify(policyData));
      }

      toast.success('🎉 Registration complete! Your policy is now active.');
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        (!err.response || err.code === 'ERR_NETWORK'
          ? 'Backend not reachable. Please ensure the server is running on port 5000.'
          : err.message || 'Registration failed. Please try again.');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-start justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 py-10">

        {/* ── Logo ── */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="p-2.5 bg-gradient-to-tr from-primary-600 to-blue-500 rounded-xl shadow-lg shadow-primary-500/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              SecureClaim <span className="text-primary-400">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-4 tracking-tight">Policyholder Registration</h1>
          <p className="text-slate-400 text-sm mt-1">Complete 5 quick steps to activate your motor insurance</p>
        </div>

        {/* ── Step bar ── */}
        <Progress step={step} />

        {/* ── Card ── */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl shadow-black/40 p-6 sm:p-8">
          <form onSubmit={handleSubmit}>

            {step === 1 && <StepCustomer data={cust} set={setC} errs={cErrs} />}
            {step === 2 && <StepVehicle  data={veh}  set={setV} errs={vErrs} />}
            {step === 3 && (
              <StepPhotos
                photos={photos}
                onAdd={(id, file) => setPhotos(p => ({ ...p, [id]: file }))}
                onRemove={id => setPhotos(p => { const n = { ...p }; delete n[id]; return n; })}
              />
            )}
            {step === 4 && <StepPolicy selected={plan} onSelect={setPlan} />}
            {step === 5 && (
              <StepPayment
                method={method} setMethod={setMethod}
                plan={plan} vehicle={veh}
                upi={upi} setUpi={setUpi}
                card={card} setCard={setCard}
                bank={bank} setBank={setBank}
              />
            )}

            {/* ── Navigation row ── */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
              {/* Left */}
              {step === 1 ? (
                <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}

              {/* Right */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-mono hidden sm:block">Step {step} of {STEPS.length}</span>

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold shadow-lg shadow-primary-600/30 transition-all"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Activating Policy…</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Pay &amp; Activate Policy</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Sign-in link (step 1 only) */}
          {step === 1 && (
            <p className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login/user" className="text-primary-400 hover:text-primary-300 font-semibold underline underline-offset-4">
                Sign in to Policyholder Portal
              </Link>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
