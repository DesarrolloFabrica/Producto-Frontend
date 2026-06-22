import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  CalendarDays,
  Copy,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  KeyRound,
  Pencil,
  RefreshCcw,
  Search,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { DashboardShell } from '../../components/layout/DashboardShell';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/ToastProvider';
import { cn } from '../../components/ui/tokens';
import { useAuth } from '../auth/AuthContext';
import { getApiErrorMessage } from '../operations/apiMappers';
import {
  cDigitalUsersApi,
  type CDigitalUserFilters,
  type CDigitalUserRecord,
} from '../../services/cDigitalUsersApi';
import { PRODUCTO_C_DIGITAL_USERS_ACCESS, hasPermission } from '../../permissions';

type FormState = {
  programName: string;
  username: string;
  password: string;
};

const EMPTY_FORM: FormState = { programName: '', username: '', password: '' };
const EMPTY_FILTERS: CDigitalUserFilters = { programName: '', username: '', createdAt: '', order: 'recent' };
const PASSWORD_REVEAL_TTL_MS = 30_000;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatMetricDate(value?: string): string {
  if (!value) return 'Sin actividad';
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function CDigitalUsersPage() {
  const { user } = useAuth();
  const allowed = hasPermission(user, PRODUCTO_C_DIGITAL_USERS_ACCESS);
  const { showToast } = useToast();
  const [records, setRecords] = useState<CDigitalUserRecord[]>([]);
  const [filters, setFilters] = useState<CDigitalUserFilters>(EMPTY_FILTERS);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editing, setEditing] = useState<CDigitalUserRecord | null>(null);
  const [formPasswordVisible, setFormPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 8;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const revealTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const clearRevealTimer = (id: string) => {
    const timer = revealTimersRef.current[id];
    if (timer) clearTimeout(timer);
    delete revealTimersRef.current[id];
  };

  const hidePassword = (id: string) => {
    clearRevealTimer(id);
    setRevealedPasswords((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const clearRevealedPasswords = () => {
    Object.values(revealTimersRef.current).forEach(clearTimeout);
    revealTimersRef.current = {};
    setRevealedPasswords({});
  };

  const rememberRevealedPassword = (id: string, password: string) => {
    clearRevealTimer(id);
    setRevealedPasswords((prev) => ({ ...prev, [id]: password }));
    revealTimersRef.current[id] = setTimeout(() => hidePassword(id), PASSWORD_REVEAL_TTL_MS);
  };

  const revealPassword = async (id: string): Promise<string> => {
    const current = revealedPasswords[id];
    if (current) return current;
    const response = await cDigitalUsersApi.revealPassword(id);
    rememberRevealedPassword(id, response.password);
    return response.password;
  };

  const loadRecords = async (nextFilters = filters, page = currentPage) => {
    clearRevealedPasswords();
    setLoading(true);
    setError(null);
    try {
      const data = await cDigitalUsersApi.list({ ...nextFilters, page, limit: pageSize });
      setRecords(data.items);
      setTotalRecords(data.meta.total);
      setCurrentPage(data.meta.page);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allowed) void loadRecords(EMPTY_FILTERS);
  }, [allowed]);

  useEffect(
    () => () => {
      Object.values(revealTimersRef.current).forEach(clearTimeout);
      revealTimersRef.current = {};
    },
    [],
  );

  if (!allowed) {
    return (
      <DashboardShell>
        <EmptyState
          icon={KeyRound}
          title="Acceso denegado"
          description="No tienes permiso para consultar Usuarios C Digital."
          cardVariant="roleGlass"
        />
      </DashboardShell>
    );
  }

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const programName = form.programName.trim();
    const username = form.username.trim();
    const password = form.password.trim();

    if (!programName || !username || (!editing && !password)) {
      showToast('Programa, usuario y contraseña son obligatorios.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await cDigitalUsersApi.update(editing.id, {
          programName,
          username,
          ...(password ? { password } : {}),
        });
        showToast('Registro actualizado correctamente');
      } else {
        await cDigitalUsersApi.create({ programName, username, password });
        showToast('Registro creado correctamente');
      }
      resetForm();
      await loadRecords(filters, currentPage);
    } catch (saveError) {
      showToast(getApiErrorMessage(saveError), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: CDigitalUserRecord) => {
    setEditing(record);
    setForm({ programName: record.programName, username: record.username, password: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (record: CDigitalUserRecord) => {
    const confirmed = window.confirm(`¿Eliminar el acceso de ${record.programName}?`);
    if (!confirmed) return;

    try {
      await cDigitalUsersApi.remove(record.id);
      showToast('Registro eliminado correctamente');
      await loadRecords(filters, currentPage);
    } catch (deleteError) {
      showToast(getApiErrorMessage(deleteError), 'error');
    }
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`${label} copiado al portapapeles`);
    } catch {
      showToast(`No se pudo copiar ${label.toLowerCase()}`, 'error');
    }
  };

  const handleTogglePassword = async (record: CDigitalUserRecord) => {
    if (revealedPasswords[record.id]) {
      hidePassword(record.id);
      return;
    }
    try {
      await revealPassword(record.id);
    } catch (revealError) {
      showToast(getApiErrorMessage(revealError), 'error');
    }
  };

  const handleCopyPassword = async (record: CDigitalUserRecord) => {
    try {
      const password = await revealPassword(record.id);
      await navigator.clipboard.writeText(password);
      showToast('Contraseña copiada');
    } catch (copyError) {
      showToast(getApiErrorMessage(copyError), 'error');
    }
  };

  const applyFilters = async () => {
    await loadRecords(filters, 1);
  };

  const clearFilters = async () => {
    setFilters(EMPTY_FILTERS);
    await loadRecords(EMPTY_FILTERS, 1);
  };

  const uniquePrograms = new Set(records.map((record) => record.programName.trim().toLowerCase())).size;
  const latestUpdate = records
    .map((record) => record.updatedAt)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRecords = records;
  const firstVisibleRecord = totalRecords === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const lastVisibleRecord = Math.min((safeCurrentPage - 1) * pageSize + records.length, totalRecords);

  const focusForm = () => {
    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <DashboardShell className="space-y-4">
      <section className="relative overflow-hidden rounded-[28px] border border-orange-100/70 bg-white/78 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:p-5">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-orange-100/60 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-12 h-px w-2/3 bg-linear-to-r from-transparent via-orange-200 to-transparent" />
        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-orange-50/80 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-orange-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              Herramienta interna
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
              Usuarios C Digital
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-5 text-slate-500">
              Gestión centralizada de credenciales operativas por programa académico.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Credenciales registradas" value={totalRecords.toString()} />
            <MetricCard label="Programas únicos" value={uniquePrograms.toString()} />
            <MetricCard label="Última actualización" value={formatMetricDate(latestUpdate)} compact />
          </div>
        </div>
      </section>

      <div ref={formCardRef}>
      <Card
        variant="solid"
        className="overflow-hidden rounded-[24px] border border-slate-100 bg-white p-0 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
      >
        <div className="h-1 bg-linear-to-r from-orange-500 via-orange-400 to-orange-300" />
        <div className="p-4 lg:p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 shadow-inner shadow-orange-100">
              <KeyRound className="h-4.5 w-4.5" />
            </div>
            <div>
            <h2 className="text-lg font-black text-slate-950">
              {editing ? 'Editar credencial operativa' : 'Registrar credencial operativa'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Las contraseñas se almacenan cifradas y no se muestran en listados operativos.
            </p>
            </div>
          </div>
          {editing ? (
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
              Editando
            </span>
          ) : null}
        </div>

        <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end" onSubmit={handleSubmit}>
          <Field label="Programa" icon={GraduationCap} value={form.programName} onChange={(value) => setForm((prev) => ({ ...prev, programName: value }))} />
          <Field label="Usuario" icon={UserIcon} value={form.username} onChange={(value) => setForm((prev) => ({ ...prev, username: value }))} />
          <Field
            label="Contraseña"
            icon={KeyRound}
            type={formPasswordVisible ? 'text' : 'password'}
            value={form.password}
            placeholder={editing ? 'Dejar vacía para conservarla' : undefined}
            onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
            rightAction={
              <button
                type="button"
                onClick={() => setFormPasswordVisible((value) => !value)}
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"
                title={formPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {formPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
          <div className="flex gap-2">
            <Button type="submit" loading={saving} size="sm" className="h-11 flex-1 px-4 shadow-orange-500/25 hover:-translate-y-0.5 lg:flex-none">
              {editing ? 'Guardar cambios' : 'Guardar'}
            </Button>
            <Button type="button" variant="secondary" size="sm" className="h-11 border-slate-200/80 bg-white px-4 text-slate-600 shadow-sm" onClick={resetForm} disabled={saving}>
              {editing ? 'Cancelar' : 'Limpiar'}
            </Button>
          </div>
        </form>
        </div>
      </Card>
      </div>

      <Card variant="roleGlass" className="overflow-hidden rounded-[24px] border border-slate-200/70 p-0 shadow-[0_16px_42px_rgba(15,23,42,0.07)]">
        <div className="h-1 bg-linear-to-r from-orange-500 via-orange-300 to-transparent" />
        <div className="p-4 lg:p-5">
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">Credenciales registradas</h2>
            <p className="mt-1 text-sm text-slate-500">Filtra por programa, usuario o fecha de creación.</p>
          </div>
          <div className="w-full rounded-[22px] border border-slate-200/70 bg-white/80 p-3 shadow-sm xl:max-w-4xl">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-800">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Filter className="h-4 w-4" />
                </span>
                Filtros operativos
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                Mostrando {totalRecords} credencial{totalRecords === 1 ? '' : 'es'}
              </span>
            </div>
            <div className="grid gap-2.5 md:grid-cols-5">
            <FilterField label="Programa" icon={GraduationCap} value={filters.programName ?? ''} onChange={(value) => setFilters((prev) => ({ ...prev, programName: value }))} />
            <FilterField label="Usuario" icon={UserIcon} value={filters.username ?? ''} onChange={(value) => setFilters((prev) => ({ ...prev, username: value }))} />
            <FilterField label="Fecha" icon={CalendarDays} type="date" value={filters.createdAt ?? ''} onChange={(value) => setFilters((prev) => ({ ...prev, createdAt: value }))} />
            <label className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Orden</span>
              <select
                value={filters.order ?? 'recent'}
                onChange={(event) => setFilters((prev) => ({ ...prev, order: event.target.value as 'recent' | 'oldest' }))}
                className="h-10 w-full rounded-2xl border border-slate-200 bg-white/90 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
              >
                <option value="recent">Más reciente</option>
                <option value="oldest">Más antiguo</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <Button type="button" size="sm" className="h-10 flex-1 shadow-orange-500/20" onClick={applyFilters}>
                <Search className="h-3.5 w-3.5" /> Buscar
              </Button>
              <Button type="button" size="sm" variant="secondary" className="h-10 border-slate-200 bg-white" onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm font-semibold text-red-700">
            <span>{error}</span>
            <Button type="button" size="sm" variant="secondary" onClick={() => loadRecords()}>
              <RefreshCcw className="h-3.5 w-3.5" /> Reintentar
            </Button>
          </div>
        ) : null}

        {loading ? (
          <SkeletonTable rows={6} />
        ) : records.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-orange-200/80 bg-linear-to-br from-orange-50/70 via-white to-slate-50 p-10 text-center shadow-inner">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] bg-white text-orange-500 shadow-[0_12px_28px_rgba(249,115,22,0.18)]">
              <KeyRound className="h-9 w-9" />
            </div>
            <h3 className="text-xl font-black text-slate-950">No hay credenciales registradas</h3>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
              Registra accesos operativos para comenzar a gestionar usuarios de C Digital.
            </p>
            <Button type="button" className="mt-6" onClick={focusForm}>
              Registrar primera credencial
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/85 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
                <thead className="bg-slate-50/95 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <Th>Programa</Th>
                    <Th>Usuario</Th>
                    <Th>Contraseña</Th>
                    <Th>Creado por</Th>
                    <Th>Fecha de creación</Th>
                    <Th>Última actualización</Th>
                    <Th>Acciones</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.map((record) => {
                    const revealedPassword = revealedPasswords[record.id];
                    return (
                      <tr key={record.id} className="transition duration-200 hover:-translate-y-px hover:bg-orange-50/40 hover:shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
                        <Td>
                          <span className="inline-flex max-w-[260px] items-center rounded-full border border-orange-200/80 bg-orange-50/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-orange-700">
                            <span className="truncate">{record.programName}</span>
                          </span>
                        </Td>
                        <Td>
                          <span className="block font-black text-slate-900">{record.username}</span>
                          <span className="block text-[11px] font-medium leading-tight text-slate-400">Usuario operativo</span>
                        </Td>
                        <Td>
                          {revealedPassword ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-emerald-50/50 px-2.5 py-1 shadow-sm">
                              <span className="relative flex h-4 w-4 items-center justify-center">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
                                <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              </span>
                              <span className="font-mono text-[11px] font-bold tracking-widest text-emerald-700">{revealedPassword}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/60 bg-gradient-to-r from-slate-50 to-white px-2.5 py-1 shadow-sm">
                              <span className="flex items-center gap-[3px]">
                                {Array.from({ length: 8 }).map((_, i) => (
                                  <span
                                    key={i}
                                    className="inline-block h-[5px] w-[5px] rounded-full bg-slate-300/80"
                                    style={{ animationDelay: `${i * 60}ms` }}
                                  />
                                ))}
                              </span>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">protegida</span>
                            </span>
                          )}
                        </Td>
                        <Td>
                          <span className="block font-semibold text-slate-700">{record.createdBy.name}</span>
                          <span className="block text-xs text-slate-400">{record.createdBy.email}</span>
                        </Td>
                        <Td>{formatDate(record.createdAt)}</Td>
                        <Td>{formatDate(record.updatedAt)}</Td>
                        <Td>
                          <div className="inline-flex items-center gap-0.5 rounded-2xl border border-slate-200 bg-white/90 p-1 shadow-sm">
                            <IconButton
                              title={revealedPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                              onClick={() => void handleTogglePassword(record)}
                            >
                              {revealedPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </IconButton>
                            <IconButton title="Copiar usuario" onClick={() => handleCopy(record.username, 'Usuario')}>
                              <Copy className="h-3.5 w-3.5" />
                            </IconButton>
                            <IconButton title="Copiar contraseña" onClick={() => void handleCopyPassword(record)}>
                              <KeyRound className="h-3.5 w-3.5" />
                            </IconButton>
                            <IconButton title="Editar" onClick={() => handleEdit(record)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </IconButton>
                            <IconButton title="Eliminar" danger onClick={() => handleDelete(record)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconButton>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalRecords > pageSize ? (
              <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Mostrando {firstVisibleRecord}-{lastVisibleRecord} de {totalRecords}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8 px-3"
                    disabled={safeCurrentPage === 1}
                    onClick={() => void loadRecords(filters, Math.max(1, safeCurrentPage - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black text-slate-600 shadow-sm">
                    {safeCurrentPage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8 px-3"
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => void loadRecords(filters, Math.min(totalPages, safeCurrentPage + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
        </div>
      </Card>
    </DashboardShell>
  );
}

function Field({
  label,
  value,
  onChange,
  icon: Icon,
  type = 'text',
  placeholder,
  rightAction,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: typeof KeyRound;
  type?: string;
  placeholder?: string;
  rightAction?: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="group flex h-10 items-center rounded-2xl border border-slate-200 bg-white/90 px-3 shadow-sm transition focus-within:border-orange-300 focus-within:ring-4 focus-within:ring-orange-100">
        {Icon ? <Icon className="mr-2.5 h-4 w-4 shrink-0 text-slate-400 transition group-focus-within:text-orange-500" /> : null}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-300"
        />
        {rightAction ? <div className="ml-2 shrink-0">{rightAction}</div> : null}
      </div>
    </label>
  );
}

function FilterField(props: Parameters<typeof Field>[0]) {
  return <Field {...props} />;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-3.5 py-2.5 align-top text-slate-600', className)}>{children}</td>;
}

function MetricCard({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="rounded-[20px] border border-white/80 bg-white/86 p-3 shadow-[0_14px_35px_rgba(15,23,42,0.08)] backdrop-blur">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className={cn('mt-1.5 font-black tracking-tight text-slate-950', compact ? 'text-base' : 'text-2xl')}>
        {value}
      </p>
    </div>
  );
}

function IconButton({
  children,
  title,
  danger = false,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-lg transition duration-200 hover:-translate-y-0.5',
        danger
          ? 'bg-red-50 text-red-500 hover:bg-red-100 hover:shadow-sm'
          : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600',
      )}
    >
      {children}
    </button>
  );
}
