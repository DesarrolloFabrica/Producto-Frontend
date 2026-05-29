import { useCallback, useEffect, useState } from 'react';
import { History, Link as LinkIcon, ListChecks, Loader2, UserCog } from 'lucide-react';
import { MetricCard } from '../../components/cards/MetricCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { cn, radius, surface, tableRow, text } from '../../components/ui/tokens';
import { EmptyState } from '../../components/ui/EmptyState';
import { useOperations } from '../../features/operations/OperationsContext';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { OperationalHelp } from '../../components/operational/OperationalHelp';
import { OperationalInboxPagination } from '../operations-v2/components/OperationalInboxPagination';
import { auditApi, type ApiAuditLogStats } from '../../services/auditApi';
import { getApiErrorMessage, mapAuditLogsFromApi } from '../operations/apiMappers';
import { AuditLogDetailModal } from './AuditLogDetailModal';
import type { AuditLog } from '../../types/domain';

type EntityFilter = 'Todos' | 'Proyecto' | 'Materia' | 'Semestre' | 'Checklist' | 'Observacion';

const filters: EntityFilter[] = ['Todos', 'Proyecto', 'Materia', 'Semestre', 'Checklist', 'Observacion'];

const FILTER_ENTITY_TYPES: Record<Exclude<EntityFilter, 'Todos'>, string> = {
  Proyecto: 'PROJECT',
  Materia: 'SUBJECT,TOPIC',
  Semestre: 'SEMESTER',
  Checklist: 'CHECKLIST_ITEM',
  Observacion: 'OBSERVATION,OBSERVATION_BATCH',
};

const PAGE_SIZE = 10;

const DEFAULT_STATS: ApiAuditLogStats = {
  total: 0,
  productCount: 0,
  factoryCount: 0,
  checklistCount: 0,
};

export function AuditPage() {
  const [filter, setFilter] = useState<EntityFilter>('Todos');
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [stats, setStats] = useState<ApiAuditLogStats>(DEFAULT_STATS);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { auditLogs: mockAuditLogs, backendEnabled } = useOperations();

  const loadLogs = useCallback(
    async (targetPage: number, targetFilter: EntityFilter) => {
      if (!backendEnabled) {
        setLogs(mockAuditLogs);
        setStats({
          total: mockAuditLogs.length,
          productCount: mockAuditLogs.filter((log) => log.role === 'PRODUCT').length,
          factoryCount: mockAuditLogs.filter((log) => log.role === 'FABRICA').length,
          checklistCount: mockAuditLogs.filter((log) => log.entityType === 'Checklist').length,
        });
        setTotalItems(mockAuditLogs.length);
        setTotalPages(Math.max(1, Math.ceil(mockAuditLogs.length / PAGE_SIZE)));
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await auditApi.getLogs({
          page: targetPage,
          limit: PAGE_SIZE,
          entityTypes: targetFilter === 'Todos' ? undefined : FILTER_ENTITY_TYPES[targetFilter],
        });
        const mapped = mapAuditLogsFromApi(response.items ?? []);
        setLogs(mapped);
        setStats(response.stats ?? DEFAULT_STATS);
        setTotalItems(response.total ?? mapped.length);
        setTotalPages(response.totalPages ?? 1);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError));
        setLogs([]);
        setStats(DEFAULT_STATS);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [backendEnabled, mockAuditLogs],
  );

  useEffect(() => {
    void loadLogs(page, filter);
  }, [loadLogs, page, filter]);

  const handleFilterChange = (next: EntityFilter) => {
    setFilter(next);
    setPage(1);
  };

  const pagedMockLogs = backendEnabled
    ? logs
    : logs.filter((_, index) => index >= (page - 1) * PAGE_SIZE && index < page * PAGE_SIZE);

  const visibleLogs = backendEnabled ? logs : pagedMockLogs;

  return (
    <div className="space-y-6">
      <PageHeader
        prominentEyebrow
        eyebrow="Trazabilidad institucional"
        title="Auditoría"
        description="Vista resumida de los cambios. Abre el detalle de cada fila para ver el movimiento completo sin saturar la tabla."
      />
      <OperationalHelp topic="audit" />

      {isLoading && visibleLogs.length === 0 ? (
        <Card variant="subjectPanel" className="flex items-center gap-3 p-4 text-sm font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          Cargando historial institucional...
        </Card>
      ) : null}

      {error ? (
        <Card variant="subjectPanel" className="flex items-center justify-between gap-3 border-rose-200/60 bg-rose-50/30 p-4">
          <p className="text-sm font-bold text-rose-700">{error}</p>
          <Button type="button" variant="secondary" size="sm" onClick={() => void loadLogs(page, filter)}>
            Reintentar
          </Button>
        </Card>
      ) : null}

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard variant="subjectPanel" label="Cambios registrados" value={stats.total} icon={History} />
        <MetricCard variant="subjectPanel" label="Cambios Producto" value={stats.productCount} icon={UserCog} />
        <MetricCard variant="subjectPanel" label="Cambios Fábrica" value={stats.factoryCount} icon={ListChecks} />
        <MetricCard variant="subjectPanel" label="Checklist actualizado" value={stats.checklistCount} icon={LinkIcon} />
      </section>

      <div className="rounded-[28px] border border-orange-100/90 bg-white/90 p-1.5 shadow-[inset_0_2px_8px_rgba(249,115,22,0.06),0_8px_28px_rgba(249,115,22,0.08)]">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleFilterChange(item)}
              className={cn(
                'rounded-[22px] border border-transparent px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all',
                'hover:border-orange-100 hover:bg-orange-50/50 hover:text-slate-900',
                filter === item && 'border-orange-200 bg-white text-orange-700 shadow-md ring-2 ring-orange-100/80',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {visibleLogs.length === 0 && !isLoading ? (
        <EmptyState
          icon={History}
          title="Sin registros de auditoría"
          description="No hay cambios que coincidan con el filtro seleccionado."
          cardVariant="subjectPanel"
        />
      ) : visibleLogs.length > 0 ? (
        <Card variant="subjectPanel" className="overflow-hidden p-0">
          <div className={cn('border-b border-orange-100/90 px-5 py-4 sm:px-6', surface.table)}>
            <p className={text.label}>Registro institucional</p>
            <h2 className="text-sm font-black tracking-tight text-slate-950">Cambios auditados</h2>
          </div>

          <div className="relative overflow-x-auto">
            {isLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              </div>
            ) : null}

            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className={cn('text-[10px] font-bold uppercase tracking-wider text-slate-400', surface.roleGlassTableHead)}>
                  <th className="px-5 py-3 sm:px-6">Cuándo</th>
                  <th className="px-3 py-3">Programa</th>
                  <th className="px-3 py-3">Responsable</th>
                  <th className="px-3 py-3">Qué pasó</th>
                  <th className="px-3 py-3 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-50/80">
                {visibleLogs.map((log) => (
                  <AuditTableRow key={log.id} log={log} onOpenDetail={() => setSelectedLog(log)} />
                ))}
              </tbody>
            </table>
          </div>

          <OperationalInboxPagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            itemLabel={{ one: 'registro', other: 'registros' }}
            onPageChange={setPage}
          />
        </Card>
      ) : null}

      <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

function AuditTableRow({ log, onOpenDetail }: { log: AuditLog; onOpenDetail: () => void }) {
  const programLabel = log.program ?? 'Sin programa';
  const semesterBadge = log.semesterNumber != null ? `Sem. ${log.semesterNumber}` : null;
  const roleLabel = log.roleLabel ?? log.role;
  const summary = log.summary ?? log.changeLabel ?? 'Cambio registrado';

  return (
    <tr className={tableRow}>
      <td className="px-5 py-3 align-top sm:px-6">
        <p className="text-xs font-semibold text-slate-800">{formatDate(log.createdAt)}</p>
        <p className="text-[10px] font-medium text-slate-400">{formatDateTime(log.createdAt).split(', ').slice(1).join(', ') || '—'}</p>
      </td>
      <td className="px-3 py-3 align-top">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-bold text-slate-900">{programLabel}</p>
          {semesterBadge ? (
            <span className={cn('rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600', radius.control)}>
              {semesterBadge}
            </span>
          ) : null}
        </div>
        {log.school ? (
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">{log.school}</p>
        ) : null}
      </td>
      <td className="px-3 py-3 align-top">
        <p className="text-sm font-semibold text-slate-900">{log.userName}</p>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{roleLabel}</p>
      </td>
      <td className="px-3 py-3 align-top">
        <p className="line-clamp-2 text-xs font-medium leading-5 text-slate-700">{summary}</p>
      </td>
      <td className="px-3 py-3 align-top text-right">
        <button
          type="button"
          onClick={onOpenDetail}
          className={cn(
            'inline-flex items-center rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-orange-700 ring-1 ring-orange-200 transition hover:bg-orange-50',
            radius.control,
          )}
        >
          Ver detalle
        </button>
      </td>
    </tr>
  );
}
