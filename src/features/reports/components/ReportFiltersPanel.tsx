import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type {
  ReportCatalogItem,
  ReportFilterOption,
  ReportFilterOptions,
  ReportFiltersState,
  ReportSearchSuggestion,
} from '../../../services/types/reportingApi.types';
import { DEFAULT_REPORT_FILTERS } from '../../../services/types/reportingApi.types';
import { cn } from '../../../components/ui/tokens';
import {
  getActiveFilterChips,
  hasActiveFilters,
  suggestionToFilters,
} from '../reportActiveFilterUtils';
import {
  ENTITY_TYPE_FILTER_OPTIONS,
  USER_ROLE_FILTER_OPTIONS,
} from '../reportFilterConstants';
import {
  reportFieldClass,
  reportFilterLabelClass,
  reportFilterPanelClass,
  reportFiltersGridClass,
} from '../reportUi';
import { ReportActiveFilterChips } from './ReportActiveFilterChips';
import { ReportSearchCombobox, ReportSearchStatus } from './ReportSearchCombobox';

const FILTER_LABELS: Record<string, string> = {
  dateFrom: 'Desde',
  dateTo: 'Hasta',
  school: 'Escuela',
  modality: 'Modalidad',
  priority: 'Prioridad',
  projectStatus: 'Estado solicitud',
  institutionalState: 'Estado institucional',
  legacyWorkflow: 'Flujo legacy',
  slaStatus: 'SLA',
  query: 'Búsqueda',
  productOwnerId: 'Owner Product (ID)',
  factoryOwnerId: 'Owner Fábrica (ID)',
  operationalState: 'Estado operativo',
  factoryProductionStatus: 'Estado producción',
  status: 'Estado observación',
  role: 'Rol autor',
  semesterNumber: 'Nº semestre',
  onlyOpen: 'Solo abiertas',
  onlyOverdue: 'Solo vencidos',
  onlyFinalized: 'Solo finalizados',
  responsibleRole: 'Rol responsable',
  hasRadicationNumber: 'Radicación',
  radicationStatus: 'Estado radicación',
  entityType: 'Tipo entidad',
  auditRole: 'Rol auditoría',
};

const ADVANCED_KEYS = [
  'dateFrom',
  'dateTo',
  'school',
  'modality',
  'priority',
  'slaStatus',
  'operationalState',
  'status',
  'factoryProductionStatus',
  'projectStatus',
  'institutionalState',
  'hasRadicationNumber',
  'radicationStatus',
  'responsibleRole',
  'auditRole',
  'entityType',
  'role',
  'semesterNumber',
  'productOwnerId',
  'factoryOwnerId',
] as const;

const SELECT_OPTION_MAP: Record<string, keyof ReportFilterOptions> = {
  school: 'schools',
  modality: 'modalities',
  priority: 'priorities',
  slaStatus: 'slaStatuses',
  projectStatus: 'projectStatuses',
  institutionalState: 'institutionalStates',
  operationalState: 'operationalStates',
  status: 'observationStatuses',
  factoryProductionStatus: 'factoryProductionStatuses',
  radicationStatus: 'radicationStatuses',
  hasRadicationNumber: 'hasRadicationOptions',
};

const STATIC_SELECT_OPTIONS: Record<string, ReportFilterOption[]> = {
  role: USER_ROLE_FILTER_OPTIONS,
  auditRole: USER_ROLE_FILTER_OPTIONS,
  responsibleRole: USER_ROLE_FILTER_OPTIONS,
  entityType: ENTITY_TYPE_FILTER_OPTIONS,
};

const CHECKBOX_KEYS = ['onlyOpen', 'onlyOverdue', 'onlyFinalized'] as const;

type Props = {
  report: ReportCatalogItem;
  filters: ReportFiltersState;
  filterOptions: ReportFilterOptions | null;
  filterOptionsLoading?: boolean;
  filtersPending?: boolean;
  previewTotal?: number;
  onChange: (next: ReportFiltersState) => void;
  onClearAll: () => void;
};

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className={reportFilterLabelClass}>{children}</span>;
}

function FilterSelect({
  value,
  options,
  loading,
  onChange,
  allLabel = 'Todos',
}: {
  value: string;
  options: ReportFilterOption[];
  loading?: boolean;
  onChange: (value: string) => void;
  allLabel?: string;
}) {
  return (
    <div className="relative">
      <select
        className={cn(reportFieldClass, 'pr-8')}
        value={value}
        disabled={loading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{loading ? 'Cargando…' : allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function resolveSelectOptions(
  key: string,
  filterOptions: ReportFilterOptions | null,
): ReportFilterOption[] {
  if (STATIC_SELECT_OPTIONS[key]) return STATIC_SELECT_OPTIONS[key];
  const optionsKey = SELECT_OPTION_MAP[key];
  if (!optionsKey || !filterOptions) return [];
  return filterOptions[optionsKey] ?? [];
}

function isSelectField(key: string): boolean {
  return Boolean(SELECT_OPTION_MAP[key] || STATIC_SELECT_OPTIONS[key]);
}

export function ReportFiltersPanel({
  report,
  filters,
  filterOptions,
  filterOptionsLoading = false,
  filtersPending = false,
  previewTotal,
  onChange,
  onClearAll,
}: Props) {
  const keys = new Set(report.filterKeys);
  const [advancedOpen, setAdvancedOpen] = useState(true);

  const set = (key: keyof ReportFiltersState, value: string | boolean) => {
    onChange({ ...filters, [key]: value });
  };

  const advancedFields = ADVANCED_KEYS.filter((key) => keys.has(key));
  const activeChips = useMemo(
    () => getActiveFilterChips(filters, filterOptions),
    [filters, filterOptions],
  );

  const handleSuggestion = (suggestion: ReportSearchSuggestion) => {
    onChange(suggestionToFilters(filters, suggestion, report.id));
  };

  const renderField = (key: (typeof ADVANCED_KEYS)[number]) => {
    if (key === 'dateFrom' || key === 'dateTo') {
      return (
        <input
          type="date"
          className={reportFieldClass}
          value={filters[key]}
          onChange={(e) => set(key, e.target.value)}
        />
      );
    }

    if (key === 'semesterNumber') {
      return (
        <input
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          className={reportFieldClass}
          placeholder="Ej. 1"
          value={filters.semesterNumber}
          onChange={(e) => set(key, e.target.value)}
        />
      );
    }

    if (isSelectField(key)) {
      const allLabel =
        key === 'school' || key === 'modality' || key === 'priority' || key === 'status'
          ? 'Todas'
          : key === 'hasRadicationNumber'
            ? 'Todas'
            : 'Todos';
      return (
        <FilterSelect
          value={String(filters[key] ?? '')}
          options={resolveSelectOptions(key, filterOptions)}
          loading={filterOptionsLoading}
          allLabel={allLabel}
          onChange={(value) => set(key, value)}
        />
      );
    }

    return (
      <input
        className={reportFieldClass}
        value={String(filters[key] ?? '')}
        onChange={(e) => set(key, e.target.value)}
      />
    );
  };

  return (
    <div className={reportFilterPanelClass}>
      {keys.has('query') ? (
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <FieldLabel>Búsqueda inteligente</FieldLabel>
              <ReportSearchCombobox
                reportId={report.id}
                value={filters.query}
                onChange={(value) => onChange({ ...filters, query: value, projectId: '' })}
                onSelectSuggestion={handleSuggestion}
                placeholder={
                  report.id === 'radications'
                    ? 'Buscar o seleccionar programa radicado…'
                    : 'Buscar programa, escuela o Nº radicación…'
                }
              />
            </div>
            {hasActiveFilters(filters) ? (
              <button
                type="button"
                className="hidden shrink-0 pb-1 text-[11px] font-bold text-slate-500 transition-colors hover:text-orange-600 sm:block"
                onClick={onClearAll}
              >
                Restablecer
              </button>
            ) : null}
          </div>
          <ReportSearchStatus isPending={filtersPending} resultCount={previewTotal} />
        </div>
      ) : null}

      {advancedFields.length > 0 ? (
        <div className={cn(keys.has('query') && 'mt-4 border-t border-slate-100/80 pt-4')}>
          <button
            type="button"
            className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:text-orange-600"
            onClick={() => setAdvancedOpen((open) => !open)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros avanzados
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', advancedOpen && 'rotate-180')}
            />
          </button>

          {advancedOpen ? (
            <div className={reportFiltersGridClass}>
              {advancedFields.map((key) => (
                <label key={key} className="block min-w-0">
                  <FieldLabel>{FILTER_LABELS[key]}</FieldLabel>
                  {renderField(key)}
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {CHECKBOX_KEYS.some((k) => keys.has(k)) ? (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 rounded-xl bg-slate-50/70 px-3 py-2 ring-1 ring-slate-100">
          {CHECKBOX_KEYS.filter((k) => keys.has(k)).map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-700"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-200"
                checked={Boolean(filters[key])}
                onChange={(e) => onChange({ ...filters, [key]: e.target.checked })}
              />
              {FILTER_LABELS[key]}
            </label>
          ))}
        </div>
      ) : null}

      <ReportActiveFilterChips
        chips={activeChips}
        filters={filters}
        onChange={onChange}
        onClearAll={() => onChange({ ...DEFAULT_REPORT_FILTERS })}
      />
    </div>
  );
}
