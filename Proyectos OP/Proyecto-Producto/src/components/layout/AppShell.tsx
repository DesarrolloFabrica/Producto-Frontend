import { Bell, Factory, FolderKanban, Home, LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { ContextPanelDrawer } from '../../features/context-panel/ContextPanelProvider';
import { initials } from '../../utils/formatters';
import { cn } from '../ui/tokens';
import { BrandMark } from './BrandMark';
import { GlobalSearch } from '../search/GlobalSearch';

const productLinks = [
  { to: '/product/dashboard', label: 'Dashboard', icon: Home },
  { to: '/projects', label: 'Solicitudes', icon: FolderKanban },
  { to: '/notifications', label: 'Notificaciones', icon: Bell },
];

const factoryLinks = [
  { to: '/factory/dashboard', label: 'Dashboard', icon: Factory },
  { to: '/projects', label: 'Proyectos', icon: FolderKanban },
  { to: '/notifications', label: 'Notificaciones', icon: Bell },
];

export function AppShell() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const links = role === 'FABRICA' ? factoryLinks : productLinks;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 px-4 py-2.5 backdrop-blur-xl lg:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <BrandMark />
          <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-1 lg:flex">
            {links.map((link) => <ShellLink key={link.to} {...link} />)}
          </nav>
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200/60 bg-slate-50/80 px-3 py-1.5 lg:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500 text-[9px] font-bold text-white">{initials(role ?? 'NA')}</div>
              <div className="leading-tight">
                <p className="text-[10px] font-medium text-slate-400">{role}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600" title="Cerrar sesion">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        <nav className="mx-auto mt-2 flex max-w-7xl gap-1.5 overflow-x-auto pb-0.5 lg:hidden">
          {links.map((link) => <ShellLink key={link.to} {...link} />)}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 lg:px-6">
        <Outlet />
      </main>
      <ContextPanelDrawer />
    </div>
  );
}

function ShellLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Home }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn('flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all', isActive ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700')}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden xl:inline">{label}</span>
    </NavLink>
  );
}
