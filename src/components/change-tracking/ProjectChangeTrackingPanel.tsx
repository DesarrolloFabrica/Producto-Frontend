import { ContextLink } from '../../navigation/ContextLink';
import { History, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { formatDate } from '../../utils/formatters';
import type { ProjectChangeTimelineEntry, ProjectRecentChanges, VirtualizationProject } from '../../types/domain';

function formatTimelineDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(iso));
  } catch {
    return formatDate(iso);
  }
}

export function ProjectChangeTrackingPanel({ project }: { project: VirtualizationProject }) {
  const recent = project.recentChanges;
  const timeline = project.changeTimeline ?? [];
  const hasRecent = recent && (recent.semestersAdded > 0 || recent.subjectsAdded > 0);
  const hasTimeline = timeline.length > 0;

  if (!hasRecent && !hasTimeline) return null;

  const newSubjects = project.subjects.filter((s) => s.createdFromChange);

  return (
    <div className="space-y-4">
      {hasRecent && recent && (
        <Card className="border border-violet-100/80 bg-gradient-to-r from-violet-50/40 via-white to-cyan-50/30 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                  Cambios recientes de Product
                </p>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  Nuevo requerimiento agregado al programa original.
                </p>
                <ul className="mt-2 space-y-1 text-xs font-semibold text-slate-700">
                  {recent.semestersAdded > 0 && (
                    <li>
                      {recent.semestersAdded} semestre{recent.semestersAdded !== 1 ? 's' : ''} agregado
                      {recent.semestersAdded !== 1 ? 's' : ''}
                    </li>
                  )}
                  {recent.subjectsAdded > 0 && (
                    <li>
                      {recent.subjectsAdded} materia{recent.subjectsAdded !== 1 ? 's' : ''} nueva
                      {recent.subjectsAdded !== 1 ? 's' : ''}
                    </li>
                  )}
                </ul>
              </div>
            </div>
            {newSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newSubjects.slice(0, 4).map((subject) => (
                  <ContextLink
                    key={subject.id}
                    to={`/subjects/${subject.id}`}
                    className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-cyan-800 ring-1 ring-cyan-200/80 hover:bg-cyan-50"
                  >
                    {subject.name}
                  </ContextLink>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {hasTimeline && (
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Historial de cambios</h3>
          </div>
          <ol className="space-y-3 border-l border-slate-200 pl-4">
            {timeline.map((entry, index) => (
              <TimelineEntry key={`${entry.kind}-${entry.occurredAt}-${index}`} entry={entry} />
            ))}
          </ol>
        </Card>
      )}
    </div>
  );
}

function TimelineEntry({ entry }: { entry: ProjectChangeTimelineEntry }) {
  const content = (
    <>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {formatTimelineDate(entry.occurredAt)}
      </p>
      <p className="text-sm font-semibold text-slate-800">{entry.label}</p>
    </>
  );

  if (entry.actionUrl) {
    return (
      <li className="relative">
        <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-violet-400 ring-4 ring-white" />
        <ContextLink to={entry.actionUrl} className="block rounded-xl p-2 transition-colors hover:bg-slate-50">
          {content}
        </ContextLink>
      </li>
    );
  }

  return (
    <li className="relative">
      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
      <div className="p-2">{content}</div>
    </li>
  );
}
