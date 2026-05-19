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
      <Card variant={cardVariant} className="p-3 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_30px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]', typeStyle.bg, typeStyle.color)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-bold leading-snug tracking-[-0.02em] text-[#1E293B]">{link.title}</p>
                <p className="mt-0.5 truncate text-[10px] font-medium text-[#64748B]">{projectName}</p>
              </div>
              <span className="shrink-0 rounded-[12px] bg-white/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#64748B] ring-1 ring-slate-200/50">Disponible</span>
            </div>
            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <p className="min-w-0 text-[10px] font-medium text-[#64748B]">
                {link.type.replace('_', ' ')} · {link.uploadedBy} · {formatDate(link.createdAt)}
              </p>
              <div className="flex shrink-0 items-center justify-end gap-1 sm:justify-end">
                <button type="button" onClick={handleContext} className="rounded-[12px] p-1.5 text-[#94A3B8] transition-colors hover:bg-[#EEF2FF] hover:text-[#6366F1]">
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={handleCopy} className="rounded-[12px] p-1.5 text-[#94A3B8] transition-colors hover:bg-[#EEF2FF] hover:text-[#6366F1]">
                  {copied ? <span className="text-[10px] font-semibold text-[#64748B]">Copiado</span> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <span className="p-1.5 text-[#FF6B00]">
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
