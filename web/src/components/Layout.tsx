import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          Community RideShare
          <span>Admin</span>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/members" className={({ isActive }) => (isActive ? 'active' : '')}>
            Members
          </NavLink>
          <NavLink to="/rides" className={({ isActive }) => (isActive ? 'active' : '')}>
            Rides
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => (isActive ? 'active' : '')}>
            Reports
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
            Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">{user?.name ?? user?.phone}</div>
          <button className="btn" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
