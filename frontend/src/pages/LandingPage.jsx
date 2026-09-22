import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Car, Bike, FileText, Search, CheckCircle2, Sparkles,
  Zap, Cpu, Eye, ArrowRight, ChevronDown, Upload, Clock,
  ShieldCheck, AlertCircle, FileCheck2, HelpCircle, Activity,
  Award, Check, Lock, FileSearch, CheckCircle, CheckCheck,
  MapPin, Phone, Mail, Menu, X, Star, TrendingUp, Users,
  BarChart3, Layers, Target, Scan, AlertTriangle, ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-[#1f2328] font-sans">

      {/* ================================================================
          NAVBAR — sticky, professional, white
          ================================================================ */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#06244F] flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-[17px] text-[#06244F] leading-none block">AutoSure</span>
              <span className="text-[10px] text-[#6B7280] font-medium leading-none block mt-0.5">Vehicle Insurance • AI Damage Assessment</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 text-sm">
            <button onClick={() => scrollToSection('insurance-products')} className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-[#374151] hover:text-[#06244F] hover:bg-[#F7FAFD] font-medium transition-colors">
              Motor Insurance <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
            </button>
            <Link to={user ? (user.role === 'admin' ? '/admin/claims' : '/claims') : '/login/user'} className="px-3.5 py-2 rounded-lg text-[#374151] hover:text-[#06244F] hover:bg-[#F7FAFD] font-medium transition-colors">Claims</Link>
            <Link to="/policy/purchase" className="px-3.5 py-2 rounded-lg text-[#374151] hover:text-[#06244F] hover:bg-[#F7FAFD] font-medium transition-colors">Renewals</Link>
            <button onClick={() => scrollToSection('how-it-works')} className="px-3.5 py-2 rounded-lg text-[#374151] hover:text-[#06244F] hover:bg-[#F7FAFD] font-medium transition-colors">How It Works</button>
            <button onClick={() => scrollToSection('support')} className="px-3.5 py-2 rounded-lg text-[#374151] hover:text-[#06244F] hover:bg-[#F7FAFD] font-medium transition-colors">Support</button>
          </nav>

          {/* Right Actions */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F7FAFD] border border-[#E5E7EB] text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="font-semibold text-[#06244F]">{user.name || user.email}</span>
                  <span className="text-[10px] font-bold text-[#1268E8] uppercase">({user.role})</span>
                </span>
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn-primary text-xs py-2 px-4">Dashboard</Link>
                {user.role === 'user' && <Link to="/claims/new" className="btn-outline text-xs py-2 px-4">New Claim</Link>}
                <button type="button" onClick={logout} className="btn-ghost text-xs py-2 px-3 text-[#6B7280] hover:text-red-600">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-ghost text-xs py-2 px-4">Register</Link>
                <Link to="/login/user" className="btn-secondary text-xs py-2 px-4">Policyholder Login</Link>
                <Link to="/login/admin" className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Officer Portal
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg text-[#374151] hover:bg-[#F7FAFD] border border-[#E5E7EB]">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-[#E5E7EB] px-4 py-3 space-y-1">
            <button onClick={() => scrollToSection('insurance-products')} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#F7FAFD]">Motor Insurance</button>
            <Link to={user ? '/claims' : '/login/user'} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#F7FAFD]">Claims</Link>
            <Link to="/policy/purchase" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#F7FAFD]">Renewals</Link>
            <button onClick={() => scrollToSection('how-it-works')} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#F7FAFD]">How It Works</button>
            <div className="pt-2 border-t border-[#E5E7EB] flex flex-col gap-2">
              {user ? (
                <>
                  <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn-primary text-sm w-full justify-center">Dashboard</Link>
                  <button type="button" onClick={logout} className="btn-secondary text-sm w-full justify-center">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login/user" className="btn-secondary text-sm w-full justify-center">Policyholder Login</Link>
                  <Link to="/login/admin" className="btn-primary text-sm w-full justify-center">Officer Portal</Link>
                  <Link to="/register" className="btn-ghost text-sm w-full justify-center">Register</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ================================================================
          HERO — dark navy with image right, AI card overlay
          ================================================================ */}
      <section className="bg-[#06244F] relative overflow-hidden">
        {/* Subtle bg decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-[#1268E8]/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#082B5C]/80 blur-[80px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1268E8]/20 border border-[#1268E8]/40 text-[#93C5FD] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Vehicle Damage Assessment
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight">
                Smarter Vehicle Claims.<br />
                <span className="text-[#60A5FA]">Faster Resolution.</span>
              </h1>

              <p className="text-[#93C5FD] text-base leading-relaxed max-w-lg">
                Upload accident photos and let AutoSure's AI analyse vehicle damage,
                detect damaged parts, estimate severity and repair-cost category,
                and simplify the insurance claim process.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to={user ? (user.role === 'admin' ? '/admin' : '/claims/new') : '/login/user?redirect=/claims/new'}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#1268E8] hover:bg-[#0f58d4] text-white font-bold text-sm shadow-xl shadow-[#1268E8]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Submit a Claim <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to={user ? (user.role === 'admin' ? '/admin' : '/claims') : '/login/user'}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-all"
                >
                  <Search className="w-4 h-4 text-[#93C5FD]" /> Check Claim Status
                </Link>
              </div>

              <div className="flex flex-wrap gap-5 text-sm text-[#BAD4F9] pt-1">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34D399]" /> AI Damage Detection</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34D399]" /> Faster Assessment</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#34D399]" /> Fraud Detection</span>
              </div>
            </div>

            {/* Right: Hero image + floating AI card */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#082B5C]">
                <div className="aspect-[4/3] bg-[#0A3470]">
                  <img
                    src="/images/hero-ai-car.jpg"
                    alt="Vehicle Damage Assessment"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  {/* Damage overlay labels */}
                  <div className="absolute top-[22%] left-[18%] flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded border border-red-400/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    Front Bumper — 94%
                  </div>
                  <div className="absolute top-[38%] left-[10%] flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded border border-amber-400/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    Headlight — 87%
                  </div>
                  <div className="absolute bottom-[30%] right-[12%] flex items-center gap-1.5 bg-blue-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded border border-blue-400/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                    Fender — 76%
                  </div>
                </div>
              </div>

              {/* Floating AI Detection Card */}
              <div className="absolute -bottom-4 -right-3 sm:-bottom-6 sm:-right-4 w-52 sm:w-60 bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl p-4">
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#F3F4F6]">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#1268E8]" />
                    <span className="text-xs font-bold text-[#06244F]">AI Damage Detection</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                </div>
                <div className="space-y-2.5 text-[11px]">
                  {[
                    { label: 'Front Bumper', pct: 94, color: '#EF4444' },
                    { label: 'Headlight', pct: 87, color: '#F59E0B' },
                    { label: 'Fender', pct: 76, color: '#1268E8' },
                    { label: 'Bonnet', pct: 54, color: '#6B7280' },
                  ].map(({ label, pct, color }) => (
                    <div key={label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[#374151] font-medium">{label}</span>
                        <span className="font-mono font-bold" style={{ color }}>{pct}%</span>
                      </div>
                      <div className="h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                        <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#F3F4F6] flex items-center justify-between">
                  <span className="text-[10px] text-[#6B7280]">Overall Severity:</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase">Moderate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          TRUST STATS STRIP
          ================================================================ */}
      <section className="bg-[#F7FAFD] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '99.4%', label: 'AI Detection Accuracy', color: 'text-[#1268E8]' },
              { value: '< 3 Min', label: 'Average Claim Decision', color: 'text-[#06244F]' },
              { value: '₹15Cr+', label: 'Claims Processed', color: 'text-green-600' },
              { value: '100%', label: 'IRDAI Compliant', color: 'text-amber-600' },
            ].map(({ value, label, color }) => (
              <div key={label}>
                <div className={`text-2xl sm:text-3xl font-black font-mono ${color}`}>{value}</div>
                <div className="text-xs text-[#6B7280] mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          INSURANCE PRODUCTS
          ================================================================ */}
      <section id="insurance-products" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="section-tag justify-center">Our Insurance Products</div>
            <h2 className="section-title">Protect Your Vehicle</h2>
            <p className="section-sub max-w-xl mx-auto">Choose the right insurance policy for your car or two-wheeler.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Car, title: 'Car Insurance', color: '#1268E8', bg: '#EAF4FF',
                desc: 'Comprehensive accident, collision, and zero-depreciation coverage for your car.',
                cta: 'View Details', href: '/policy/purchase',
                img: '/images/car-insurance.jpg',
                features: ['Zero Depreciation Cover', 'Cashless Repairs', 'AI Claim Assessment'],
              },
              {
                icon: Bike, title: 'Bike Insurance', color: '#059669', bg: '#ECFDF5',
                desc: 'Affordable and reliable coverage for your two-wheeler with roadside assistance.',
                cta: 'View Details', href: '/policy/purchase',
                img: '/images/bike-insurance.jpg',
                features: ['Engine Protection', 'Theft Coverage', '24/7 Roadside Assist'],
              },
              {
                icon: FileCheck2, title: 'Claims', color: '#D97706', bg: '#FFFBEB',
                desc: 'Track your claim in real-time with AI damage assessments and officer review.',
                cta: 'Track Claim', href: user ? (user.role === 'admin' ? '/admin/claims' : '/claims') : '/login/user',
                img: '/images/surveyor-inspection.jpg',
                features: ['Real-time Status', 'AI Assessment Report', 'PDF Download'],
              },
            ].map(({ icon: Icon, title, color, bg, desc, cta, href, img, features }) => (
              <div key={title} className="card-hover group flex flex-col overflow-hidden p-0">
                <div className="h-44 overflow-hidden bg-[#F7FAFD]">
                  <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.parentElement.style.background = '#F7FAFD'; e.target.style.display = 'none'; }} />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                      <Icon className="w-4.5 h-4.5" style={{ color }} />
                    </div>
                    <h3 className="text-base font-bold text-[#06244F]">{title}</h3>
                  </div>
                  <p className="text-sm text-[#6B7280] leading-relaxed mb-4 flex-1">{desc}</p>
                  <ul className="space-y-1.5 mb-4">
                    {features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-[#374151]">
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to={href} className="inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all" style={{ color }}>
                    {cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          HOW IT WORKS
          ================================================================ */}
      <section id="how-it-works" className="py-16 bg-[#F7FAFD] border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="section-tag justify-center">Simple Process</div>
            <h2 className="section-title">4-Step Claims Process</h2>
            <p className="section-sub max-w-xl mx-auto">From photo upload to final decision in minutes.</p>
          </div>

          {/* Desktop horizontal timeline */}
          <div className="hidden md:grid md:grid-cols-4 gap-0 relative">
            <div className="absolute top-8 left-[12.5%] right-[12.5%] h-px bg-[#E5E7EB] z-0" />
            {[
              { num: '01', icon: Upload, title: 'Submit', desc: 'Upload accident photos and claim details through our portal.', color: '#1268E8', bg: '#EAF4FF' },
              { num: '02', icon: Cpu, title: 'AI Inspection', desc: 'Computer vision detects damaged parts and generates polygon masks.', color: '#7C3AED', bg: '#F5F3FF' },
              { num: '03', icon: Eye, title: 'Damage Assessment', desc: 'AI classifies damage type, severity and repair cost category.', color: '#D97706', bg: '#FFFBEB' },
              { num: '04', icon: FileCheck2, title: 'Claim Report', desc: 'Generate detailed assessment and track your claim to settlement.', color: '#059669', bg: '#ECFDF5' },
            ].map(({ num, icon: Icon, title, desc, color, bg }) => (
              <div key={num} className="relative z-10 flex flex-col items-center text-center px-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center border-4 border-white shadow-md mb-4" style={{ background: bg }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <span className="text-xs font-black font-mono mb-1.5" style={{ color }}>{num}</span>
                <h3 className="text-sm font-bold text-[#06244F] mb-2">{title}</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Mobile vertical timeline */}
          <div className="md:hidden space-y-0">
            {[
              { num: '01', icon: Upload, title: 'Submit', desc: 'Upload accident photos and claim details.', color: '#1268E8', bg: '#EAF4FF' },
              { num: '02', icon: Cpu, title: 'AI Inspection', desc: 'Computer vision detects damaged parts.', color: '#7C3AED', bg: '#F5F3FF' },
              { num: '03', icon: Eye, title: 'Damage Assessment', desc: 'AI classifies damage, severity and repair category.', color: '#D97706', bg: '#FFFBEB' },
              { num: '04', icon: FileCheck2, title: 'Claim Report', desc: 'Generate report and track your claim.', color: '#059669', bg: '#ECFDF5' },
            ].map(({ num, icon: Icon, title, desc, color, bg }, i, arr) => (
              <div key={num} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  {i < arr.length - 1 && <div className="w-px flex-1 my-2 bg-[#E5E7EB]" />}
                </div>
                <div className="pt-2 pb-6">
                  <span className="text-xs font-black font-mono" style={{ color }}>{num}</span>
                  <h3 className="text-sm font-bold text-[#06244F] mt-0.5 mb-1">{title}</h3>
                  <p className="text-xs text-[#6B7280] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          AI DAMAGE ANALYSIS SECTION
          ================================================================ */}
      <section className="py-16 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <div className="section-tag">AI Assessment Engine</div>
              <h2 className="section-title mb-4">Instant AI Damage Analysis</h2>
              <p className="text-[#6B7280] text-sm leading-relaxed mb-6">
                AutoSure's computer vision pipeline detects damaged vehicle parts,
                classifies damage type, scores severity, and estimates repair cost — all in under 3 minutes.
              </p>

              {/* Damage pipeline */}
              <div className="space-y-3">
                {[
                  { step: 'Image Validation', done: true, icon: CheckCircle2, color: '#059669' },
                  { step: 'Vehicle Detection', done: true, icon: CheckCircle2, color: '#059669' },
                  { step: 'Damage Detection', done: true, icon: CheckCircle2, color: '#059669' },
                  { step: 'Damage Classification', done: true, icon: CheckCircle2, color: '#059669' },
                  { step: 'Severity Assessment', done: true, icon: CheckCircle2, color: '#059669' },
                  { step: 'Repair Cost Estimation', done: true, icon: CheckCircle2, color: '#059669' },
                  { step: 'Fraud Screening', done: true, icon: CheckCircle2, color: '#059669' },
                ].map(({ step, icon: Icon, color }) => (
                  <div key={step} className="flex items-center gap-3 p-3 bg-[#F7FAFD] rounded-lg border border-[#E5E7EB]">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                    <span className="text-sm font-medium text-[#374151]">{step}</span>
                    <span className="ml-auto text-xs font-semibold text-green-600">Complete</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="card">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#1268E8]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#06244F]">AI Assessment Complete</h3>
                      <p className="text-[11px] text-[#6B7280]">4 damage instances detected</p>
                    </div>
                  </div>
                  <span className="badge-green text-[10px]">Processed</span>
                </div>

                <div className="space-y-3 mb-5">
                  {[
                    { part: 'Front Bumper', type: 'Severe', conf: 94, color: '#EF4444', bg: '#FEF2F2', badgeClass: 'badge-red' },
                    { part: 'Left Headlight', type: 'Moderate', conf: 87, color: '#F59E0B', bg: '#FFFBEB', badgeClass: 'badge-orange' },
                    { part: 'Left Fender', type: 'Minor', conf: 76, color: '#1268E8', bg: '#EAF4FF', badgeClass: 'badge-blue' },
                    { part: 'Bonnet', type: 'Normal', conf: 54, color: '#6B7280', bg: '#F7FAFD', badgeClass: 'badge-gray' },
                  ].map(({ part, type, conf, color, bg, badgeClass }) => (
                    <div key={part} className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB]" style={{ background: bg }}>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-[#06244F]">{part}</span>
                          <span className={badgeClass}>{type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
                            <div className="h-1.5 rounded-full" style={{ width: `${conf}%`, background: color }} />
                          </div>
                          <span className="text-[11px] font-mono font-bold text-[#374151] w-10 text-right">{conf}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E5E7EB]">
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-[10px] text-amber-700 font-semibold uppercase tracking-wide mb-1">Overall Severity</p>
                    <p className="text-base font-black text-amber-800">MODERATE</p>
                  </div>
                  <div className="bg-[#EAF4FF] rounded-xl p-3 border border-[#1268E8]/20">
                    <p className="text-[10px] text-[#1268E8] font-semibold uppercase tracking-wide mb-1">Repair Category</p>
                    <p className="text-base font-black text-[#06244F]">₹₹₹</p>
                  </div>
                </div>

                <Link to={user ? (user.role === 'admin' ? '/admin/claims' : '/claims/new') : '/login/user?redirect=/claims/new'} className="btn-primary w-full justify-center mt-4">
                  View Full Report <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          CLAIM STATUS TRACKER
          ================================================================ */}
      <section className="py-16 bg-[#F7FAFD] border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="section-tag">Real-Time Tracking</div>
              <h2 className="section-title mb-4">Track Your Claim</h2>
              <p className="section-sub mb-6">Enter your Claim ID to get instant real-time status updates at every stage.</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Enter Claim ID (e.g. CLM-2026-XXXXX)" className="input-field pl-9 w-full" />
                </div>
                <Link to={user ? (user.role === 'admin' ? '/admin/claims' : '/claims') : '/login/user'} className="btn-primary px-5">Track →</Link>
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-bold text-[#06244F] mb-4">Claim Timeline</h3>
              <div className="space-y-0">
                {[
                  { label: 'Submitted', date: '15 Jan 2026 · 10:23 AM', done: true, active: false },
                  { label: 'AI Inspection', date: '15 Jan 2026 · 10:26 AM', done: true, active: false },
                  { label: 'Officer Review', date: '15 Jan 2026 · 11:00 AM', done: false, active: true },
                  { label: 'Approved', date: 'Pending', done: false, active: false },
                  { label: 'Settlement', date: 'Pending', done: false, active: false },
                ].map(({ label, date, done, active }, i, arr) => (
                  <div key={label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${
                        done ? 'bg-green-500 border-green-500' : active ? 'bg-[#1268E8] border-[#1268E8]' : 'bg-white border-[#D1D5DB]'
                      }`}>
                        {done ? <CheckCircle2 className="w-4 h-4 text-white" /> : active ? <div className="w-2 h-2 rounded-full bg-white" /> : null}
                      </div>
                      {i < arr.length - 1 && <div className={`w-0.5 h-6 my-1 ${done ? 'bg-green-300' : 'bg-[#E5E7EB]'}`} />}
                    </div>
                    <div className={`pb-2 ${i === arr.length - 1 ? '' : 'mb-0'}`}>
                      <p className={`text-sm font-semibold ${done ? 'text-[#06244F]' : active ? 'text-[#1268E8]' : 'text-[#9CA3AF]'}`}>{label}</p>
                      <p className="text-[11px] text-[#6B7280]">{date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          AI INTELLIGENCE FEATURES
          ================================================================ */}
      <section id="ai-features" className="py-16 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="section-tag justify-center">Underlying Intelligence</div>
            <h2 className="section-title">Full-Spectrum Claims Intelligence</h2>
            <p className="section-sub max-w-2xl mx-auto">Deep learning models and automated adjudication engineered for institutional insurance precision.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Cpu, title: 'Neural Segmentation', desc: 'YOLOv8-seg identifies bumper fractures, dents, scratches, and glass shatter polygons.', color: '#1268E8', bg: '#EAF4FF' },
              { icon: Activity, title: 'Automated Analysis', desc: 'Itemized parts and labor formulas derived from insurer baseline matrices and severity scoring.', color: '#7C3AED', bg: '#F5F3FF' },
              { icon: Clock, title: '24/7 Monitoring', desc: 'Real-time claim status sync with live Firebase activity feeds and surveyor audit queue.', color: '#D97706', bg: '#FFFBEB' },
              { icon: ShieldCheck, title: 'Fraud Defense', desc: 'NLP semantic cross-check correlating claimant statements against detected damage areas.', color: '#059669', bg: '#ECFDF5' },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="card group hover:border-[#1268E8]/30 hover:shadow-md transition-all">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform" style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="text-sm font-bold text-[#06244F] mb-2">{title}</h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          SUPPORT SECTION
          ================================================================ */}
      <section id="support" className="py-16 bg-[#F7FAFD] border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="section-tag">Support</div>
              <h2 className="section-title mb-4">We're Here to Help</h2>
              <p className="section-sub mb-6">Our expert team and AI assistant are available to help with claims, policies, and renewals.</p>
              <div className="space-y-3">
                {[
                  { icon: Phone, label: 'Claims Helpline', value: '1800-123-4567', sub: 'Mon–Sat 8AM–8PM' },
                  { icon: Mail, label: 'Email Support', value: 'claims@autosure.in', sub: 'Response within 2 hours' },
                  { icon: MapPin, label: 'Head Office', value: 'Chennai, Tamil Nadu', sub: 'India' },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div key={label} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-[#E5E7EB]">
                    <div className="w-9 h-9 rounded-lg bg-[#EAF4FF] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#1268E8]" />
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">{label}</p>
                      <p className="text-sm font-semibold text-[#06244F]">{value}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-bold text-[#06244F] mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1268E8]" /> Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                {[
                  { q: 'How does AI damage assessment work?', a: 'Upload clear photos of the damaged vehicle. Our CV engine detects damaged parts, classifies damage type, scores severity, and estimates repair cost — all automatically.' },
                  { q: 'What documents are required for a claim?', a: 'Registration certificate, driving licence, policy document, FIR (if applicable), and clear damage photos.' },
                  { q: 'How long does claim processing take?', a: 'AI assessment completes in under 3 minutes. Officer review typically takes 1–2 business days.' },
                  { q: 'When does my policy expire?', a: 'Login to your dashboard to view your policy expiry date and renewal options.' },
                ].map(({ q, a }) => (
                  <details key={q} className="group border border-[#E5E7EB] rounded-xl overflow-hidden">
                    <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer text-sm font-semibold text-[#06244F] hover:bg-[#F7FAFD] transition-colors">
                      {q}
                      <ChevronDown className="w-4 h-4 text-[#9CA3AF] flex-shrink-0 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-3 text-xs text-[#6B7280] leading-relaxed border-t border-[#E5E7EB] pt-3">{a}</div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="bg-[#06244F] text-white py-12 border-t border-[#082B5C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10 pb-10 border-b border-white/10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-black text-lg leading-none block">AutoSure</span>
                  <span className="text-[10px] text-[#93C5FD] font-medium block">Vehicle Insurance • AI Damage Assessment</span>
                </div>
              </div>
              <p className="text-sm text-[#93C5FD] leading-relaxed max-w-xs">
                A modern vehicle insurance platform powered by AI damage assessment and real-time claim tracking.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#93C5FD] mb-3">Products</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link to="/policy/purchase" className="hover:text-white transition-colors">Car Insurance</Link></li>
                <li><Link to="/policy/purchase" className="hover:text-white transition-colors">Bike Insurance</Link></li>
                <li><Link to={user ? '/claims' : '/login/user'} className="hover:text-white transition-colors">Claims</Link></li>
                <li><Link to="/policy/purchase" className="hover:text-white transition-colors">Renewals</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#93C5FD] mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How It Works</button></li>
                <li><button onClick={() => scrollToSection('support')} className="hover:text-white transition-colors">Support</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                <li><button onClick={() => scrollToSection('support')} className="hover:text-white transition-colors">Contact Us</button></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <p>© 2026 AutoSure. All rights reserved.</p>
            <p>Powered by YOLOv8 Computer Vision & Automated Claims Adjudication</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
