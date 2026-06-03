import { BarChart2, Bell, ClipboardCheck, ClipboardList, CloudUpload, Factory, FolderKanban, Home, LogOut, ScrollText, Settings } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ScrollRestoration } from '../../navigation/ScrollRestoration';
import { useAuth } from '../../features/auth/AuthContext';
import { ContextPanelDrawer, ContextPanelProvider } from '../../features/context-panel/ContextPanelProvider';
import { cn } from '../ui/tokens';
import { BrandMark } from './BrandMark';
import { AuthenticatedBackground } from './AuthenticatedBackground';
import { UserAvatar } from '../ui/UserAvatar';
import { GlobalSearch } from '../search/GlobalSearch';
import { useOperations } from '../../features/operations/OperationsContext';
import { isActionableNotification, isVisibleNotification } from '../../features/operations/notificationInbox';
import { useNotificationSummaryQuery } from '../../features/queries/useNotificationSummaryQuery';
import { homePathForRole } from '../../navigation/roleNavigation';
import { ADMIN_DASHBOARD_PATH } from '../../features/admin-tracking/adminNavigation';

const productLinks = [
  { to: '/product/dashboard', label: 'Dashboard', icon: Home },
  { to: '/projects', label: 'Solicitudes', icon: FolderKanban },
  { to: '/reports', label: 'Reportes', icon: BarChart2 },
  { to: '/notifications', label: 'Notificaciones', icon: Bell },
];

const adminLinks = [
  { to: ADMIN_DASHBOARD_PATH, label: 'Dashboard', icon: Home },
  { to: '/reports', label: 'Reportes', icon: BarChart2 },
  { to: '/audit', label: 'Auditoría', icon: ScrollText },
];

const factoryLinks = [
  { to: '/factory/dashboard', label: 'Dashboard', icon: Factory },
  { to: '/factory/work', label: 'Bandeja', icon: ClipboardList },
  { to: '/projects', label: 'Proyectos', icon: FolderKanban },
  { to: '/reports', label: 'Reportes', icon: BarChart2 },
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
    role === 'ADMIN'
      ? adminLinks
      : role === 'FABRICA'
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
    <ContextPanelProvider>
    <div className="relative z-10 min-h-screen text-slate-900">
      <AuthenticatedBackground />
      <div className="relative z-10">
        <header className="header-glass sticky top-0 z-40 px-4 py-3 lg:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <BrandMark />
            <nav className="header-nav-track hidden items-center gap-0.5 rounded-2xl p-1 lg:flex">
              {links.map((link) => (
                <ShellLink
                  key={link.to}
                  {...link}
                  badge={link.to === '/notifications' ? actionableBadge : 0}
                />
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <GlobalSearch />
              <NavLink
                to="/notifications/settings"
                className="header-icon-btn flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-slate-700"
                title="Configuración"
              >
                <Settings className="h-4 w-4" />
              </NavLink>
              <div className="header-user-card hidden items-center gap-2.5 rounded-2xl px-3 py-1.5 lg:flex">
                <UserAvatar
                  seed={user?.id ?? user?.email ?? role ?? 'guest'}
                  src={user?.avatarUrl}
                  alt={user?.name ? `Avatar de ${user.name}` : 'Avatar de usuario'}
                  className="h-8 w-8 ring-2 ring-white/80 ring-offset-1 ring-offset-transparent"
                  imageSize={64}
                  shape="rounded"
                />
                <div className="leading-tight">
                  {user?.name ? (
                    <p className="max-w-[128px] truncate text-xs font-semibold tracking-tight text-slate-800">
                      {user.name}
                    </p>
                  ) : null}
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="header-icon-btn flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-red-500"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <nav className="no-scrollbar mx-auto mt-2.5 flex max-w-7xl gap-1.5 overflow-x-auto pb-0.5 lg:hidden">
            {links.map((link) => (
              <ShellLink
                key={link.to}
                {...link}
                badge={link.to === '/notifications' ? actionableBadge : 0}
              />
            ))}
          </nav>
        </header>

      <ScrollRestoration />
      <main className="mx-auto max-w-7xl px-4 py-5 lg:px-6">
        <Outlet key={location.pathname} />
      </main>
      <ContextPanelDrawer />
      </div>
    </div>
    </ContextPanelProvider>
  );
}

function ShellLink({
  to,
  label,
  icon: Icon,
  badge = 0,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold tracking-tight transition-all duration-200',
          isActive
            ? 'header-nav-link-active text-orange-600'
            : 'text-slate-500 hover:bg-white/45 hover:text-slate-700',
        )
      }
    >
      <span className="relative flex items-center justify-center">
        <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-105" />
        {badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white/90" />
        )}
      </span>
      <span className="hidden xl:inline">{label}</span>
      {badge > 0 && (
        <span className="rounded-full bg-linear-to-r from-orange-500 to-orange-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
