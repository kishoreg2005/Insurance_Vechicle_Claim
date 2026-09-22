import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Phone, Lock, Hash, ArrowLeft, Eye, EyeOff, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function OfficerRegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', officerId: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    else if (!/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Please enter a valid phone number';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { toast.error('Please fix the errors before submitting'); return; }
    setLoading(true);
    try {
      await register(formData.fullName, formData.email, formData.password, 'admin');
      toast.success('Officer registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login/admin'), 1500);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const fieldClass = (field) =>
    `w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border ${errors[field] ? 'border-red-400 focus:ring-red-200' : 'border-[#E5E7EB] focus:border-[#1268E8]'} text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1268E8]/20 transition-all text-sm`;

  return (
    <div className="min-h-screen bg-[#F7FAFD] text-[#1F2937] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">

        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 hover:opacity-90 transition-opacity">
            <div className="w-11 h-11 rounded-xl bg-amber-700 flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl text-[#06244F] tracking-tight">AutoSure</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Insurance Officer Portal</span>
          </div>
          <h2 className="text-2xl font-bold text-[#06244F] tracking-tight">Officer Registration</h2>
          <p className="text-[#6B7280] text-sm mt-1">Create an adjudication officer account to manage claims and fraud defense</p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input type="text" value={formData.fullName} onChange={handleChange('fullName')} className={fieldClass('fullName')} placeholder="Officer Name" />
              </div>
              {errors.fullName && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">Officer Corporate Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input type="email" value={formData.email} onChange={handleChange('email')} className={fieldClass('email')} placeholder="officer@insurance.com" />
              </div>
              {errors.email && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.email}</p>}
            </div>

            {/* Phone & Officer ID */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                  <input type="tel" value={formData.phoneNumber} onChange={handleChange('phoneNumber')}
                    className={`w-full pl-8 pr-3 py-2.5 rounded-xl bg-white border ${errors.phoneNumber ? 'border-red-400' : 'border-[#E5E7EB] focus:border-[#1268E8]'} text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1268E8]/20 transition-all text-xs font-mono`}
                    placeholder="+91 9876543210" />
                </div>
                {errors.phoneNumber && <p className="text-red-500 text-[10px] mt-1">{errors.phoneNumber}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">Badge / Officer ID</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                  <input type="text" value={formData.officerId} onChange={handleChange('officerId')}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1268E8]/20 focus:border-[#1268E8] transition-all text-xs font-mono"
                    placeholder="OFF-2026" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange('password')} className={`${fieldClass('password')} pr-11`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors p-1">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange('confirmPassword')} className={`${fieldClass('confirmPassword')} pr-11`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors p-1">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#06244F] hover:bg-[#082B5C] text-white font-bold rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Creating Officer Account...</span></>
              ) : (
                <span>Register Officer Account</span>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-[#E5E7EB] flex flex-col items-center gap-3 text-xs text-[#9CA3AF]">
            <p className="text-center">
              Already have an officer account?{' '}
              <Link to="/login/admin" className="text-amber-600 hover:text-amber-700 font-semibold underline underline-offset-4">
                Sign In here
              </Link>
            </p>
            <div className="w-full flex items-center justify-between pt-1 border-t border-[#E5E7EB] text-[11px]">
              <Link to="/register" className="text-[#1268E8] hover:text-blue-700 transition-colors">
                Policyholder? Register here
              </Link>
              <Link to="/" className="inline-flex items-center gap-1 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
                <ArrowLeft className="w-3 h-3" /> Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
