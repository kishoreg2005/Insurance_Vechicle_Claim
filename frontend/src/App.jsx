import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OfficerRegisterPage from './pages/OfficerRegisterPage';
import PolicyPurchase from './pages/user/PolicyPurchase';
import UserDashboard from './pages/user/UserDashboard';
import NewClaim from './pages/user/NewClaim';
import ClaimHistory from './pages/user/ClaimHistory';
import ClaimDetail from './pages/user/ClaimDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClaimsList from './pages/admin/AdminClaimsList';
import AdminClaimDetail from './pages/admin/AdminClaimDetail';
import AdminRules from './pages/admin/AdminRules';
import AdminUsers from './pages/admin/AdminUsers';

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FAFD]">
        <div className="animate-spin rounded-full h-8 w-8" style={{ borderWidth: '3px', borderStyle: 'solid', borderColor: '#EAF4FF', borderTopColor: '#1268E8' }} />
      </div>
    );
  }
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '8px',
              background: '#ffffff',
              color: '#0D1B2E',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login/user" element={<PublicRoute><LoginPage role="user" /></PublicRoute>} />
          <Route path="/login/admin" element={<PublicRoute><LoginPage role="admin" /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/register/officer" element={<PublicRoute><OfficerRegisterPage /></PublicRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
          <Route path="/policy/purchase" element={<ProtectedRoute role="user"><PolicyPurchase /></ProtectedRoute>} />
          <Route path="/claims/new" element={<ProtectedRoute role="user"><NewClaim /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute role="user"><ClaimHistory /></ProtectedRoute>} />
          <Route path="/claims/:id" element={<ProtectedRoute role="user"><ClaimDetail /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/claims" element={<ProtectedRoute role="admin"><AdminClaimsList /></ProtectedRoute>} />
          <Route path="/admin/claims/:id" element={<ProtectedRoute role="admin"><AdminClaimDetail /></ProtectedRoute>} />
          <Route path="/admin/rules" element={<ProtectedRoute role="admin"><AdminRules /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
