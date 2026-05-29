import { useState, useEffect, useRef } from 'react';
import { Search, FolderKanban, BookOpen, FileText, MessageSquare, Bell, ArrowRight } from 'lucide-react';
import { useOperations } from '../../features/operations/OperationsContext';
import { useContextPanel } from '../../features/context-panel/ContextPanelProvider';
import { useAuth } from '../../features/auth/AuthContext';
import { cn } from '../ui/tokens';

interface SearchResult {
  type: 'project' | 'subject' | 'link' | 'observation' | 'notification';
  id: string;
  title: string;
  context: string;
  icon: typeof FolderKanban;
  data?: Record<string, unknown>;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { projects, projectObservations, notifications } = useOperations();
  const { role } = useAuth();
  const { openContextPanel } = useContextPanel();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const results: SearchResult[] = [];
  const q = query.toLowerCase().trim();

  if (q) {
    projects.forEach((p) => {
      if (p.program.toLowerCase().includes(q) || p.school.toLowerCase().includes(q) || p.productOwner.toLowerCase().includes(q)) {
        results.push({ type: 'project', id: p.id, title: p.program, context: `${p.school} / ${p.requestType}`, icon: FolderKanban, data: { project: p } });
      }
      p.subjects.forEach((s) => {
        if (s.name.toLowerCase().includes(q)) {
          results.push({ type: 'subject', id: s.id, title: s.name, context: `${p.program} / Semestre ${s.semesterNumber}`, icon: BookOpen, data: { project: p, subject: s } });
        }
      });
      p.links.forEach((l) => {
        if (l.title.toLowerCase().includes(q)) {
          results.push({ type: 'link', id: l.id, title: l.title, context: `${p.program} / ${l.type}`, icon: FileText, data: { link: l, project: p } });
        }
      });
    });

    projectObservations.forEach((o) => {
      if (o.text.toLowerCase().includes(q) || o.relatedEntity.toLowerCase().includes(q)) {
        results.push({ type: 'observation', id: o.id, title: o.relatedEntity, context: o.text.substring(0, 60), icon: MessageSquare, data: { observation: o } });
      }
    });

    notifications.filter((n) => n.roleTarget === role || role === 'ADMIN').forEach((n) => {
      if (n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)) {
        results.push({ type: 'notification', id: n.id, title: n.title, context: n.message.substring(0, 60), icon: Bell, data: { notification: n } });
      }
    });
  }

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    if (result.type === 'project') {
      openContextPanel('project', result.id, result.data);
    } else if (result.type === 'subject') {
      openContextPanel('subject', result.id, result.data);
    } else if (result.type === 'link') {
      openContextPanel('link', result.id, result.data);
    } else if (result.type === 'observation') {
      openContextPanel('observation', result.id, result.data);
    } else if (result.type === 'notification') {
      openContextPanel('notification', result.id, result.data);
    }
  };

  const typeLabels: Record<string, string> = { project: 'Proyecto', subject: 'Materia', link: 'Link', observation: 'Observacion', notification: 'Notificacion' };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar..."
          className="header-glass-inset w-52 rounded-xl py-2 pl-9 pr-17 text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none lg:w-56"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-white/60 bg-white/50 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-slate-400 backdrop-blur-sm">
          Ctrl+K
        </kbd>
      </div>
      {isOpen && query.trim() && (
        <div className="glass-elevated absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-2xl">
          <div className="max-h-96 overflow-y-auto">
            {isSearching ? (
              <div className="p-6 text-center">
                <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                <p className="mt-2 text-xs font-medium text-slate-400">Buscando...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-6 text-center">
                <Search className="mx-auto h-6 w-6 text-slate-200" />
                <p className="mt-2 text-xs font-medium text-slate-400">Sin resultados para "{query}"</p>
                <p className="mt-1 text-[10px] font-medium text-slate-400">Intenta con otro termino</p>
              </div>
            ) : (
              <div className="py-1.5">
                {results.slice(0, 10).map((result, index) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={cn('flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-all hover:bg-orange-50/50', index > 0 && 'border-t border-slate-50')}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                      <result.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900">{result.title}</p>
                      <p className="truncate text-[10px] font-medium text-slate-400">{result.context}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500">{typeLabels[result.type]}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {results.length > 10 && (
            <div className="border-t border-slate-100 px-3.5 py-2 text-center">
              <p className="text-[10px] font-medium text-slate-400">Mostrando 10 de {results.length} resultados</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
