import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { Shield, LogOut, Menu, X, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RealtimeStatusBadge from './RealtimeStatusBadge';

export default function Layout({ children, navItems, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 antialiased font-sans">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="p-6 border-b border-slate-800/80">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-3 group">
              <div className="p-2 bg-gradient-to-tr from-primary-600 to-blue-500 rounded-xl shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white leading-tight">
                  SecureClaim <span className="text-primary-400">AI</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">
                  {isAdmin ? 'Insurance Officer Console' : 'Policyholder Portal'}
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg shadow-primary-600/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="mb-3 flex justify-center">
            <RealtimeStatusBadge />
          </div>
          <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl mb-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-600/20 text-primary-400 flex items-center justify-center font-bold text-sm shrink-0 border border-primary-500/30">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Authorized User'}</p>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                    isAdmin
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                  }`}
                >
                  {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                  {isAdmin ? 'Claims Officer' : 'Policyholder'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-400" />
            <span className="font-bold text-sm text-white">SecureClaim AI</span>
          </div>
          <div className="flex items-center gap-2">
            <RealtimeStatusBadge />
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

