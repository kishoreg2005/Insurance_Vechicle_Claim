import React, { useState } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Shield, LogOut, Menu, X, UserCheck, ShieldCheck,
  LayoutDashboard, FilePlus, History, FileText,
  Users, Settings, AlertTriangle, Bell, ChevronDown,
  Car, ClipboardList, BarChart3, BookOpen, Home,
  Sliders, Search, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RealtimeStatusBadge from './RealtimeStatusBadge';

export default function Layout({ children, navItems, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen flex bg-[#F7FAFD] text-[#0D1B2E] font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E5E7EB] flex flex-col transform transition-transform duration-200 ease-in-out shadow-lg lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <Link
            to={isAdmin ? '/admin' : '/dashboard'}
            className="flex items-center gap-3 group"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-[#06244F] flex items-center justify-center shadow-sm group-hover:bg-[#082B5C] transition-colors flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-[15px] tracking-tight text-[#06244F] leading-tight">
                AutoSure
              </h1>
              <p className="text-[10px] text-[#6B7280] font-medium leading-tight">
                {isAdmin ? 'Officer Console' : 'Policyholder Portal'}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-[#06244F] text-white'
                  : 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#6B7280] hover:text-[#06244F] hover:bg-[#EAF4FF] transition-all duration-150'
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-[#E5E7EB] space-y-3">
          <div className="mb-2">
            <RealtimeStatusBadge />
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#F7FAFD] rounded-xl border border-[#E5E7EB]">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 ${isAdmin ? 'bg-amber-500' : 'bg-[#1268E8]'}`}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#06244F] truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-[#6B7280] truncate">{user?.email}</p>
              <span className={`inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                isAdmin
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-[#EAF4FF] text-[#1268E8]'
              }`}>
                {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                {isAdmin ? 'Claims Officer' : 'Policyholder'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#6B7280] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-[#E5E7EB] px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-[#F7FAFD] text-[#374151] hover:bg-[#EAF4FF] border border-[#E5E7EB]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#06244F] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-[#06244F]">AutoSure</span>
          </div>
          <div className="flex items-center gap-2">
            <RealtimeStatusBadge compact />
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-[#6B7280] hover:text-red-500"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <div className="hidden lg:flex items-center justify-between bg-white border-b border-[#E5E7EB] px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Link to="/" className="hover:text-[#1268E8] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-[#06244F]">{title || 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-3">
            <RealtimeStatusBadge />
            <Link to="/" className="text-xs text-[#6B7280] hover:text-[#1268E8] flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#EAF4FF] transition-all">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
