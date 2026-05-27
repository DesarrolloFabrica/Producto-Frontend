import { useEffect } from 'react';
import { Bell, ClipboardCheck, ClipboardList, CloudUpload, Factory, FolderKanban, Home, LogOut, Settings } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ScrollRestoration } from '../../navigation/ScrollRestoration';
import { useAuth } from '../../features/auth/AuthContext';
import { ContextPanelDrawer } from '../../features/context-panel/ContextPanelProvider';
import { initials } from '../../utils/formatters';
import { cn } from '../ui/tokens';
import { BrandMark } from './BrandMark';
import { GlobalSearch } from '../search/GlobalSearch';
import { useOperations } from '../../features/operations/OperationsContext';
import { isActionableNotification, isVisibleNotification } from '../../features/operations/notificationInbox';
import { useNotificationSummaryQuery } from '../../features/queries/useNotificationSummaryQuery';
import { homePathForRole } from '../../navigation/roleNavigation';

const productLinks = [
  { to: '/product/dashboard', label: 'Dashboard', icon: Home },
  { to: '/projects', label: 'Solicitudes', icon: FolderKanban },
  { to: '/notifications', label: 'Notificaciones', icon: Bell },
];

const factoryLinks = [
  { to: '/factory/dashboard', label: 'Dashboard', icon: Factory },
  { to: '/factory/work', label: 'Bandeja', icon: ClipboardList },
  { to: '/projects', label: 'Proyectos', icon: FolderKanban },
  { to: '/notifications', label: 'Notificaciones', icon: Bell },
];

const planningLinks = [
  { to: '/planning/dashboard', label: 'Centro de validación', icon: ClipboardCheck },
  { to: '/notifications', label: 'Notificaciones', icon: Bell },
];

const lmsLinks = [
  { to: '/lms/dashboard', label: 'Panel LMS', icon: CloudUpload },
  { to: '/notifications', label: 'Notificaciones', icon: Bell },
];

export function AppShell() {
  const { role, logout, user } = useAuth();
  const { notifications, notificationSummary, projects } = useOperations();
  const summaryQuery = useNotificationSummaryQuery(Boolean(user));
  const navigate = useNavigate();
  const location = useLocation();
  const links =
    role === 'FABRICA'
      ? factoryLinks
      : role === 'PLANEACION'
        ? planningLinks
        : role === 'LMS'
          ? lmsLinks
          : productLinks;
  const actionableBadge =
    summaryQuery.data?.actionableCount ??
    notificationSummary?.actionableCount ??
    notifications.filter(
      (item) =>
        isVisibleNotification(item, role, user?.id) &&
        isActionableNotification(item, { projects, role }),
    ).length;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Requisito: al entrar (primera carga de la sesión) siempre caer en el dashboard del rol.
  // Importante: NO debe bloquear la navegación normal dentro de la app (p. ej. "Ir al flujo").
  useEffect(() => {
    const key = 'producto_entry_redirect_done';
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');

    const home = homePathForRole(role);
    if (location.pathname !== home) {
      navigate(home, { replace: true });
    }
  }, [location.pathname, navigate, role]);

  return (
    <div className="min-h-screen text-slate-900">
      <header className="glass-surface sticky top-0 z-40 border-b border-slate-200/50 px-4 py-2.5 lg:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <BrandMark />
          <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200/60 bg-slate-50/80 p-1 lg:flex">
            {links.map((link) => <ShellLink key={link.to} {...link} badge={link.to === '/notifications' ? actionableBadge : 0} />)}
          </nav>
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <NavLink
              to="/notifications/settings"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
              title="Configuración"
            >
              <Settings className="h-4 w-4" />
            </NavLink>
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
          {links.map((link) => <ShellLink key={link.to} {...link} badge={link.to === '/notifications' ? actionableBadge : 0} />)}
        </nav>
      </header>

      <ScrollRestoration />
      <main className="mx-auto max-w-7xl px-4 py-5 lg:px-6">
        <Outlet />
      </main>
      <ContextPanelDrawer />
    </div>
  );
}

function ShellLink({ to, label, icon: Icon, badge = 0 }: { to: string; label: string; icon: typeof Home; badge?: number }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn('flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all', isActive ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-700')}
    >
      <span className="relative">
        <Icon className="h-3.5 w-3.5" />
        {badge > 0 && <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-orange-500" />}
      </span>
      <span className="hidden xl:inline">{label}</span>
      {badge > 0 && <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-black text-white">{badge}</span>}
    </NavLink>
  );
}
