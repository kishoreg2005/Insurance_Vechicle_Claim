import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Eye, EyeOff, ArrowLeft, UserCheck, ShieldCheck, Sparkles, Lock, Car, CheckCircle } from 'lucide-react';
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
      toast.success(`Welcome back!`);
      const target = redirectPath || (isAdmin ? '/admin' : '/dashboard');
      navigate(target);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        (!err.response || err.code === 'ERR_NETWORK'
          ? 'Backend server is not reachable. Please ensure the backend is running.'
          : 'Login failed. Please check your credentials.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFD] flex font-sans">
      {/* Left panel — branding (desktop only) */}
      <div className={`hidden lg:flex w-[420px] flex-shrink-0 flex-col justify-between p-10 ${isAdmin ? 'bg-amber-700' : 'bg-[#06244F]'}`}>
        <div>
          <Link to="/" className="flex items-center gap-2.5 mb-12">
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-lg text-white">AutoSure</div>
              <div className="text-[10px] text-white/60 font-medium">Vehicle Insurance • AI Damage Assessment</div>
            </div>
          </Link>

          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            {isAdmin ? 'Insurance Officer Console' : 'Policyholder Claims Portal'}
          </h2>
          <p className="text-white/70 text-sm leading-relaxed mb-8">
            {isAdmin
              ? 'Review AI damage assessments, authorize claims and manage policy holders with ease.'
              : 'Submit photos, get instant AI damage assessment, track your claims and manage your policy.'}
          </p>

          <div className="space-y-3">
            {(isAdmin
              ? ['AI-assisted claim review', 'Fraud risk indicators', 'Real-time claim queue', 'PDF report generation']
              : ['Submit claims with photo upload', 'AI damage detection in minutes', 'Track claim status in real-time', 'Download assessment reports']
            ).map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                <CheckCircle className="w-4 h-4 text-white/60 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="text-white/40 text-xs">
          © 2026 AutoSure. All rights reserved.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isAdmin ? 'bg-amber-600' : 'bg-[#06244F]'}`}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-xl text-[#06244F]">AutoSure</span>
            </Link>
          </div>

          <div className="mb-7">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border ${
              isAdmin
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-[#EAF4FF] text-[#1268E8] border-[#1268E8]/20'
            }`}>
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              {isAdmin ? 'Insurance Officer Portal' : 'Policyholder Claims Portal'}
            </div>
            <h1 className="text-2xl font-black text-[#06244F] mb-1">
              {isAdmin ? 'Officer Sign In' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-[#6B7280]">
              {isAdmin ? 'Sign in to review claims and AI assessments' : 'Sign in to manage your claims and policy'}
            </p>
          </div>

          {/* Demo fill */}
          <div className="bg-[#F7FAFD] border border-[#E5E7EB] rounded-lg p-3 mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#374151] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1268E8]" />
                Demo {isAdmin ? 'Officer' : 'Policyholder'} Account
              </p>
              <p className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                {isAdmin ? 'admin@secureclaim.ai' : 'policyholder@secureclaim.ai'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#EAF4FF] hover:bg-[#D6EAFF] text-[#1268E8] border border-[#1268E8]/20 transition-all"
            >
              Auto Fill
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder={isAdmin ? 'officer@insurance.com' : 'your.email@example.com'}
                required
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-11"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                isAdmin
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#1268E8] hover:bg-[#0f58d4] text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Sign In to {isAdmin ? 'Officer Console' : 'Claim Portal'}
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-[#E5E7EB] space-y-3 text-sm text-[#6B7280]">
            <p className="text-center">
              Don't have an account?{' '}
              <Link
                to={isAdmin ? '/register/officer' : '/register'}
                className={isAdmin ? 'text-amber-600 font-semibold hover:underline' : 'text-[#1268E8] font-semibold hover:underline'}
              >
                Register first
              </Link>
            </p>

            <div className="flex items-center justify-between text-xs">
              {isAdmin ? (
                <Link to="/login/user" className="text-[#6B7280] hover:text-[#1268E8] transition-colors">
                  Policyholder? <span className="text-[#1268E8] font-semibold">Switch login</span>
                </Link>
              ) : (
                <Link to="/login/admin" className="text-[#6B7280] hover:text-amber-600 transition-colors">
                  Insurance Officer? <span className="text-amber-600 font-semibold">Switch login</span>
                </Link>
              )}
              <Link to="/" className="flex items-center gap-1 text-[#6B7280] hover:text-[#06244F]">
                <ArrowLeft className="w-3 h-3" /> Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
