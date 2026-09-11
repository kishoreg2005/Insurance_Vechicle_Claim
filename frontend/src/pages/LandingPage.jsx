import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Car,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  FileCheck2,
  BarChart3,
  Lock,
  Cpu,
  Eye,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const { user, logout } = useAuth();

  const handleLoginClick = (targetRole) => {
    if (user && user.role !== targetRole) {
      logout();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary-500 selection:text-white relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-primary-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 -left-48 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Navigation */}
      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-tr from-primary-600 to-blue-500 rounded-xl shadow-lg shadow-primary-500/25 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1">
                SecureClaim <span className="text-primary-400">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                Autonomous Vehicle Damage Assessment
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-semibold text-white">{user.name || user.email}</span>
                  <span className="text-[10px] uppercase font-bold text-primary-400">({user.role})</span>
                </span>
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white shadow-md transition-all"
                >
                  Dashboard
                </Link>
                {user.role === 'user' && (
                  <Link
                    to="/claims/new"
                    className="hidden md:inline-flex text-xs font-semibold px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white transition-all"
                  >
                    New Claim
                  </Link>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-400 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="text-xs font-semibold px-3 py-2 rounded-lg bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border border-primary-500/30 transition-all"
                >
                  Register
                </Link>
                <Link
                  to="/login/user"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg transition-colors"
                >
                  Policyholder Sign In
                </Link>
                <Link
                  to="/login/admin"
                  className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-white transition-all shadow-sm"
                >
                  Insurance Officer Portal
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-24">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-primary-400" />
            <span>Next-Gen Computer Vision & Automated Fraud Defense</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Autonomous Vehicle Damage Assessment & Claims Adjudication
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload accident photos and incident statements. Our neural segmentation engine detects damage,
            evaluates repair liability, cross-checks consistency, and generates certified PDF audits instantly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to={user ? (user.role === 'admin' ? '/admin' : '/claims/new') : '/login/user?redirect=/claims/new'}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-primary-600/30 transition-all hover:scale-[1.02]"
            >
              <Car className="w-4 h-4" />
              <span>Submit Damage Claim</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            <Link
              to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login/admin'}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 text-white font-semibold text-sm transition-all hover:border-slate-600 shadow-md"
            >
              <Lock className="w-4 h-4 text-primary-400" />
              <span>Claims Officer Console</span>
            </Link>
          </div>
        </div>

        {/* 2 Portal Entrance Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-20">
          {/* Policyholder Card */}
          <div className="bg-gradient-to-b from-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden group hover:border-primary-500/50 transition-all shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-500/20 transition-all" />
            <div className="w-14 h-14 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-400 mb-6 group-hover:scale-105 transition-transform shadow-inner">
              <Car className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Policyholder Portal</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              File accident claims in under 3 minutes with photo uploads, interactive vehicle part selector, and immediate AI damage severity reports.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Interactive SVG 360° vehicle part selector</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time YOLOv8 damage segmentation preview</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>One-click certified PDF assessment report download</span>
              </li>
            </ul>

            <Link
              to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/login/user'}
              className="inline-flex items-center justify-between w-full px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-primary-600 text-white text-xs font-bold transition-all border border-slate-700/80 group-hover:border-primary-500"
            >
              <span>{user && user.role === 'user' ? 'Go to Policyholder Workspace' : 'Launch Policyholder Workspace'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="mt-3 text-center text-xs text-slate-400">
              New policyholder?{' '}
              <Link to="/register?role=user" className="text-primary-400 hover:text-primary-300 font-semibold underline underline-offset-2">
                Register here
              </Link>
            </div>
          </div>

          {/* Claims Officer Card */}
          <div className="bg-gradient-to-b from-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden group hover:border-amber-500/50 transition-all shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-105 transition-transform shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Insurance Officer Console</h2>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Investigate flagged cases, inspect forensic AI masks, execute administrative overrides, and configure cost pricing rules.
            </p>

            <ul className="space-y-2.5 text-xs text-slate-300 mb-8">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Automated fraud & narrative discrepancy detection</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Bulk claim approval, rejection, and adjudication overrides</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Dynamic repair cost rule matrix & labor hour configuration</span>
              </li>
            </ul>

            <Link
              to={user ? (user.role === 'admin' ? '/admin' : '/admin') : '/login/admin'}
              className="inline-flex items-center justify-between w-full px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-amber-600 text-white text-xs font-bold transition-all border border-slate-700/80 group-hover:border-amber-500"
            >
              <span>{user && user.role === 'admin' ? 'Go to Officer Command Center' : 'Launch Officer Command Center'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="mt-3 text-center text-xs text-slate-400">
              New officer?{' '}
              <Link to="/register?role=admin" className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2">
                Register officer account
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white">Full-Spectrum Claims Intelligence Architecture</h3>
            <p className="text-xs text-slate-400 mt-1">Built specifically for high-throughput automotive insurance operations</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">YOLOv8-Seg Computer Vision</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Precise polygon masks for dents, scratches, bumper fractures, and glass shattering with confidence metrics.
              </p>
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Automated Cost Valuation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Itemized parts and labor estimates derived from insurer baseline matrices and severity scoring formulas.
              </p>
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Narrative Cross-Check</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                NLP semantic matching correlating claimant damage descriptions against actual detected damage areas.
              </p>
            </div>

            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Certified PDF Generation</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated high-resolution forensic damage audit reports ready for immediate legal and settlement archiving.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
