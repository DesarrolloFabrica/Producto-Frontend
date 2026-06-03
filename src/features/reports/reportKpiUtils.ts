import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  FolderKanban,
  Package,
  Send,
  Users,
} from 'lucide-react';
import type { ReportPreviewResponse } from '../../services/types/reportingApi.types';

export type ReportKpiItem = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: string;
};

function countRows(
  rows: Record<string, unknown>[],
  predicate: (row: Record<string, unknown>) => boolean,
): number {
  return rows.filter(predicate).length;
}

function hasMeaningfulValue(value: unknown): boolean {
  const s = String(value ?? '').trim();
  return s !== '' && s !== '—' && s !== 'null' && s !== 'undefined';
}

function fmtCount(n: number, total: number, rowsLen: number): string | number {
  if (total <= rowsLen) return n;
  return n > 0 ? `${n}+` : n;
}

export function buildReportKpis(reportId: string, preview: ReportPreviewResponse): ReportKpiItem[] {
  const { rows, total } = preview;
  const partial = total > rows.length;
  const fmt = (n: number) => fmtCount(n, total, rows.length);

  switch (reportId) {
    case 'requests-general': {
      const radicated = countRows(rows, (r) => hasMeaningfulValue(r.radicationNumber));
      const finalized = countRows(
        rows,
        (r) =>
          String(r.status ?? '').toUpperCase().includes('FINAL') ||
          String(r.institutionalState ?? '').toUpperCase().includes('FINAL'),
      );
      const active = countRows(
        rows,
        (r) =>
          !String(r.status ?? '').toUpperCase().includes('FINAL') &&
          !String(r.status ?? '').toUpperCase().includes('CANCEL'),
      );
      return [
        { label: 'Total solicitudes', value: total, icon: FolderKanban, tone: 'text-orange-500' },
        { label: 'Activas', value: fmt(active), icon: ClipboardList, tone: 'text-sky-500' },
        { label: 'Finalizadas', value: fmt(finalized), icon: CheckCircle2, tone: 'text-emerald-500' },
        { label: 'Radicadas', value: fmt(radicated), icon: Send, tone: 'text-indigo-500' },
      ];
    }
    case 'factory-production': {
      const inProduction = countRows(
        rows,
        (r) =>
          String(r.operationalState ?? '').includes('PRODUCTION') ||
          String(r.operationalState ?? '').includes('REVIEW') ||
          String(r.operationalState ?? '').includes('FACTORY'),
      );
      const finalized = countRows(
        rows,
        (r) =>
          String(r.operationalState ?? '').includes('APPROVED') ||
          String(r.operationalState ?? '').includes('FINAL'),
      );
      const observations = rows.reduce((acc, r) => acc + (Number(r.openObservations) || 0), 0);
      const corrections = rows.reduce((acc, r) => acc + (Number(r.correctionsInProgress) || 0), 0);
      return [
        { label: 'Semestres producción', value: fmt(inProduction), icon: Package, tone: 'text-amber-500' },
        { label: 'Semestres finalizados', value: fmt(finalized), icon: CheckCircle2, tone: 'text-emerald-500' },
        {
          label: 'Observaciones',
          value: partial ? `${observations}+` : observations,
          icon: AlertTriangle,
          tone: 'text-rose-500',
        },
        {
          label: 'Correcciones',
          value: partial ? `${corrections}+` : corrections,
          icon: ClipboardList,
          tone: 'text-sky-500',
        },
      ];
    }
    case 'observations-corrections': {
      const open = countRows(rows, (r) => String(r.status ?? '').toUpperCase() === 'ABIERTA');
      const inCorrection = countRows(
        rows,
        (r) => String(r.status ?? '').toUpperCase() === 'EN_CORRECCION',
      );
      const resolved = countRows(rows, (r) => String(r.status ?? '').toUpperCase() === 'RESUELTA');
      return [
        { label: 'Total observaciones', value: total, icon: AlertTriangle, tone: 'text-orange-500' },
        { label: 'Abiertas', value: fmt(open), icon: Clock3, tone: 'text-amber-500' },
        { label: 'En corrección', value: fmt(inCorrection), icon: ClipboardList, tone: 'text-sky-500' },
        { label: 'Resueltas', value: fmt(resolved), icon: CheckCircle2, tone: 'text-emerald-500' },
      ];
    }
    case 'sla-compliance': {
      const onTime = countRows(rows, (r) => {
        const s = String(r.slaStatus ?? '');
        return s === 'ON_TIME' || s === 'FINALIZED_ON_TIME';
      });
      const overdue = countRows(rows, (r) => {
        const s = String(r.slaStatus ?? '');
        return s === 'OVERDUE' || s === 'FINALIZED_OVERDUE' || s === 'AT_RISK';
      });
      const sample = rows.length || 1;
      const pct = Math.round((onTime / sample) * 100);
      return [
        { label: 'Registros SLA', value: total, icon: Clock3, tone: 'text-orange-500' },
        { label: 'Cumplen SLA', value: fmt(onTime), icon: CheckCircle2, tone: 'text-emerald-500' },
        { label: 'Vencidos / riesgo', value: fmt(overdue), icon: AlertTriangle, tone: 'text-red-500' },
        {
          label: '% cumplimiento',
          value: rows.length ? `${pct}%` : '—',
          icon: FileText,
          tone: 'text-indigo-500',
        },
      ];
    }
    case 'radications': {
      const withNumber = countRows(rows, (r) => hasMeaningfulValue(r.radicationNumber));
      return [
        { label: 'Total radicaciones', value: total, icon: Send, tone: 'text-orange-500' },
        { label: 'Con número', value: fmt(withNumber), icon: CheckCircle2, tone: 'text-emerald-500' },
        {
          label: 'Sin número',
          value: fmt(Math.max(0, rows.length - withNumber)),
          icon: Clock3,
          tone: 'text-amber-500',
        },
        { label: 'En vista', value: rows.length, icon: FolderKanban, tone: 'text-sky-500' },
      ];
    }
    default:
      return [
        { label: 'Total registros', value: total, icon: FileText, tone: 'text-orange-500' },
        { label: 'En esta página', value: rows.length, icon: ClipboardList, tone: 'text-sky-500' },
        { label: 'Columnas', value: preview.columns.length, icon: FileText, tone: 'text-indigo-500' },
        { label: 'Actualizado', value: 'Ahora', icon: Users, tone: 'text-emerald-500' },
      ];
  }
}
