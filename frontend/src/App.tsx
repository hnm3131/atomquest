import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy-load all pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const CheckInsPage = lazy(() => import('./pages/CheckInsPage'));
const CycleManagementPage = lazy(() => import('./pages/CycleManagementPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const AppLayout = lazy(() => import('./components/layout/AppLayout'));

// Loading spinner
function Spinner() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0a2a' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg,#6366f1,#0ea5e9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px', fontSize: 22, fontWeight: 'bold', color: 'white'
        }}>A</div>
        <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading...</p>
      </div>
    </div>
  );
}

// Guard: redirect to /login if not authenticated
function RequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);
  if (!user) return null;
  return <Outlet />;
}

// Guard: redirect to /dashboard if wrong role
function RequireRole({ roles }: { roles: string[] }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user && !roles.includes(user.role)) navigate('/dashboard', { replace: true });
  }, [user, roles, navigate]);
  if (!user || !roles.includes(user.role)) return null;
  return <Outlet />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        {/* Protected */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/checkins" element={<CheckInsPage />} />

            {/* Manager + Admin */}
            <Route element={<RequireRole roles={['MANAGER', 'ADMIN']} />}>
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Route>

            {/* Admin only */}
            <Route element={<RequireRole roles={['ADMIN']} />}>
              <Route path="/team" element={<UserManagementPage />} />
              <Route path="/cycles" element={<CycleManagementPage />} />
              <Route path="/audit" element={<AuditLogPage />} />
              <Route path="/settings" element={<CycleManagementPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
