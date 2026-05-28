import { X } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';
import type { AdminProgramTrackingRow } from '../adminTrackingTypes';
import {
  AdminProgramTrackingCard,
  AdminProgramTrackingListHeader,
} from './AdminProgramTrackingCard';
import { AdminTrackingPagination } from './AdminTrackingPagination';

export function AdminProgramsTrackingList({
  rows,
  totalRows,
  filteredCount,
  page,
  totalPages,
  isLoading,
  error,
  onClearFilters,
  onPageChange,
}: {
  rows: AdminProgramTrackingRow[];
  totalRows: number;
  filteredCount: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="h-[72px] rounded-none border-b border-slate-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-800">
        No se pudo cargar el seguimiento institucional: {error}
      </div>
    );
  }

  if (totalRows === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center">
        <p className="text-sm font-semibold text-slate-800">Sin programas activos en seguimiento</p>
        <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500">
          Cuando existan solicitudes institucionales en curso, aparecerán aquí con su pipeline y responsable
          actual.
        </p>
      </div>
    );
  }

  if (filteredCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white/80 px-4 py-10 text-center">
        <p className="text-sm font-semibold text-slate-800">
          No hay programas que coincidan con los filtros aplicados.
        </p>
        <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500">
          Ajusta los criterios de búsqueda o restablece los filtros para ver el listado completo.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <X className="h-3.5 w-3.5" />
          Limpiar filtros
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <AdminProgramTrackingListHeader />
      <div>
        {rows.map((row) => (
          <AdminProgramTrackingCard key={row.projectId} row={row} />
        ))}
      </div>
      <AdminTrackingPagination
        page={page}
        totalPages={totalPages}
        totalItems={filteredCount}
        onPageChange={onPageChange}
      />
    </div>
  );
}
