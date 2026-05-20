import { ExternalLink, FileText, FolderOpen, Copy, Eye, BookOpen, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import type { LinkResource, LinkResourceType } from '../../types/domain';
import { formatDate } from '../../utils/formatters';
import { Card, type CardVariant } from '../ui/Card';
import { useToast } from '../ui/ToastProvider';
import { useContextPanel } from '../../features/context-panel/ContextPanelProvider';
import { cn } from '../ui/tokens';

const typeConfig: Record<LinkResourceType, { icon: typeof FileText; bg: string; color: string }> = {
  SYLLABUS: { icon: FileText, bg: 'bg-red-500/10', color: 'text-red-600' },
  CURRICULUM: { icon: FileText, bg: 'bg-blue-500/10', color: 'text-blue-600' },
  DRIVE_FOLDER: { icon: FolderOpen, bg: 'bg-emerald-500/10', color: 'text-emerald-600' },
  BRIEF: { icon: FileText, bg: 'bg-purple-500/10', color: 'text-purple-600' },
  REFERENCE: { icon: BookOpen, bg: 'bg-amber-500/10', color: 'text-amber-600' },
  OTHER: { icon: LinkIcon, bg: 'bg-slate-500/10', color: 'text-slate-600' },
};

export function DocumentLinkCard({
  link,
  projectName,
  projectId,
  nested = false,
}: {
  link: LinkResource;
  projectName: string;
  projectId?: string;
  nested?: boolean;
}) {
  const { showToast } = useToast();
  const { openContextPanel } = useContextPanel();
  const [copied, setCopied] = useState(false);
  const typeStyle = typeConfig[link.type] || typeConfig.OTHER;
  const Icon = typeStyle.icon;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      showToast('Link copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('No se pudo copiar el link', 'error');
    }
  };

  const handleContext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextPanel('link', link.id, { link, project: projectId ? { id: projectId } : undefined });
  };

  const cardVariant: CardVariant = nested ? 'nested' : 'default';

  return (
    <a href={link.url} target="_blank" rel="noreferrer" className="group block">
      <Card variant={cardVariant} className="p-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', typeStyle.bg, typeStyle.color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-bold text-slate-900">{link.title}</p>
                <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">{projectName}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">{link.type}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-[10px] font-medium text-slate-400">
                {formatDate(link.createdAt)} · {link.uploadedBy}
              </p>
              <div className={cn('flex items-center gap-1 rounded-xl bg-slate-100 p-1 transition-opacity', 'opacity-80 group-hover:opacity-100')}>
                <button type="button" onClick={handleContext} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-orange-600" title="Ver contexto">
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={handleCopy} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-orange-600" title="Copiar enlace">
                  {copied ? <span className="text-[9px] font-bold text-emerald-600">OK</span> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <span className="rounded-lg p-1.5 text-slate-400" title="Abrir enlace">
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </a>
  );
}
