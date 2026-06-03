import { useEffect, useId, useRef, useState } from 'react';
import { FileSearch, Loader2, Search, X } from 'lucide-react';
import { reportingApi } from '../../../services/reportingApi';
import type { ReportSearchSuggestion } from '../../../services/types/reportingApi.types';
import { cn } from '../../../components/ui/tokens';
import { reportSearchDropdownClass, reportSearchInputClass } from '../reportUi';
import { useDebouncedValue } from '../useDebouncedValue';

type Props = {
  reportId: string;
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: ReportSearchSuggestion) => void;
  placeholder?: string;
};

export function ReportSearchCombobox({
  reportId,
  value,
  onChange,
  onSelectSuggestion,
  placeholder = 'Buscar programa, escuela o Nº radicación…',
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ReportSearchSuggestion[]>([]);
  const debouncedQuery = useDebouncedValue(value, 250);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    reportingApi
      .getSearchSuggestions(reportId, debouncedQuery)
      .then((items) => {
        if (!cancelled) setSuggestions(items);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reportId, debouncedQuery]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const showDropdown = open && value.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
        <input
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          autoComplete="off"
          placeholder={placeholder}
          className={reportSearchInputClass}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
        />
        {value ? (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {showDropdown ? (
        <div id={listId} className={reportSearchDropdownClass} role="listbox">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
              Buscando coincidencias…
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-slate-500">
              Sin coincidencias para &ldquo;{value.trim()}&rdquo;
            </div>
          ) : (
            suggestions.map((item) => (
              <button
                key={item.projectId}
                type="button"
                role="option"
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-orange-50/80"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelectSuggestion(item);
                  setOpen(false);
                }}
              >
                <FileSearch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-slate-800">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                    {item.subtitle}
                  </span>
                </span>
                {item.hasRadication ? (
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                    Radicado
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ReportSearchStatus({
  isPending,
  resultCount,
}: {
  isPending: boolean;
  resultCount?: number;
}) {
  return (
    <p className={cn('text-[10px] font-medium', isPending ? 'text-orange-600' : 'text-slate-400')}>
      {isPending
        ? 'Actualizando resultados…'
        : typeof resultCount === 'number'
          ? `${resultCount} coincidencia${resultCount === 1 ? '' : 's'} en vista`
          : 'Escribe al menos 2 caracteres para ver sugerencias'}
    </p>
  );
}
