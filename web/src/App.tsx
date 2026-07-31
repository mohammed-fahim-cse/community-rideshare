import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { MembersPage } from './pages/MembersPage';
import { RidesPage } from './pages/RidesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

function Gate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="login-screen">
        <span className="muted">Loading…</span>
      </div>
    );
  }

  if (status === 'signedOut') {
    return <LoginPage />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/members" replace />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/rides" element={<RidesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/members" replace />} />
          </Route>
        </Routes>
      </Gate>
    </AuthProvider>
  );
}
