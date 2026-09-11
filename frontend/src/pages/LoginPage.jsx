import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Eye, EyeOff, ArrowLeft, UserCheck, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function LoginPage({ role = 'user' }) {
  const isAdmin = role === 'admin';
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleFillDemo = () => {
    if (isAdmin) {
      setEmail('admin@secureclaim.ai');
      setPassword('Admin@12345');
    } else {
      setEmail('policyholder@secureclaim.ai');
      setPassword('User@12345');
    }
    toast.success(`Demo credentials filled for ${isAdmin ? 'Insurance Officer' : 'Policyholder'}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password, role);
      toast.success(`Welcome back! Logged in as ${isAdmin ? 'Insurance Officer' : 'Policyholder'}`);
      const target = redirectPath || (isAdmin ? '/admin' : '/dashboard');
      navigate(target);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Backend server is not reachable. Please ensure the backend is running.'
          : 'Login failed. Please check your email and password, or register first if you do not have an account.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-primary-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white mb-4 hover:opacity-90 transition-opacity">
            <div className="p-2.5 bg-gradient-to-tr from-primary-600 to-blue-500 rounded-xl shadow-lg shadow-primary-500/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight">SecureClaim <span className="text-primary-400">AI</span></span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-300 mb-3">
            {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isAdmin ? 'Insurance Officer Portal' : 'Policyholder Claims Portal'}</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isAdmin ? 'Officer Console Sign In' : 'Policyholder Sign In'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {isAdmin ? 'Review AI damage assessments & authorize claims' : 'Submit photos & get instant AI repair verification'}
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 space-y-5">
          {/* Quick Demo Credentials Autofill */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between">
            <div className="text-left">
              <p className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                <span>Demo {isAdmin ? 'Officer' : 'Policyholder'} Account:</span>
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {isAdmin ? 'admin@secureclaim.ai' : 'policyholder@secureclaim.ai'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary-600/20 hover:bg-primary-600/30 text-primary-300 border border-primary-500/30 transition-all"
            >
              Auto Fill
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                placeholder={isAdmin ? 'officer@insurance.com' : 'your.email@example.com'}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-11 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3 px-4 ${
                isAdmin
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/25'
                  : 'bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 shadow-primary-600/25'
              } text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In to {isAdmin ? 'Officer Console' : 'Claim Portal'}</span>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800/80 flex flex-col items-center gap-3 text-xs text-slate-400">
            <p className="text-center">
              Don't have an account?{' '}
              <Link
                to={`/register?role=${role}`}
                className="text-primary-400 hover:text-primary-300 font-semibold underline underline-offset-4"
              >
                Register first
              </Link>
            </p>

            <div className="w-full flex items-center justify-between pt-1 border-t border-slate-800/50 text-[11px]">
              {isAdmin ? (
                <Link
                  to="/login/user"
                  className="text-slate-400 hover:text-primary-300 transition-colors"
                >
                  Policyholder? <span className="text-primary-400 font-medium">Switch to Policyholder Login</span>
                </Link>
              ) : (
                <Link
                  to="/login/admin"
                  className="text-slate-400 hover:text-amber-300 transition-colors"
                >
                  Insurance Officer? <span className="text-amber-400 font-medium">Switch to Officer Login</span>
                </Link>
              )}
              <Link to="/" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
