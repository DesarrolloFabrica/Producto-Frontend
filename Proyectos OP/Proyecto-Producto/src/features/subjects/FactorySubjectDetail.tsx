import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, MessageSquare, Package, AlertCircle, Clock3 } from 'lucide-react';
import { StatusBadge } from '../../components/status/StatusBadge';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useOperations } from '../../features/operations/OperationsContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { cn } from '../../components/ui/tokens';
import type { ChecklistItem, ChecklistStatus } from '../../types/domain';

type FactoryStatus = 'pendiente' | 'en_produccion' | 'entregado' | 'aprobado';

const factoryStatusLabels: Record<FactoryStatus, string> = {
  pendiente: 'Pendiente',
  en_produccion: 'En producción',
  entregado: 'Entregado',
  aprobado: 'Aprobado por Product',
};

const factoryStatusTone: Record<FactoryStatus, string> = {
  pendiente: 'bg-slate-50 text-slate-500 ring-1 ring-slate-200/70',
  en_produccion: 'bg-[#FFEDD5] text-[#FF6B00] ring-1 ring-orange-200/70',
  entregado: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70',
  aprobado: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
};

function toFactoryStatus(status: ChecklistStatus): FactoryStatus {
  if (status === 'APROBADO') return 'aprobado';
  if (status === 'EN_PRODUCCION') return 'en_produccion';
  if (status === 'ENTREGADO') return 'entregado';
  return 'pendiente';
}

function fromFactoryStatus(status: FactoryStatus): ChecklistStatus {
  if (status === 'en_produccion') return 'EN_PRODUCCION';
  if (status === 'entregado') return 'ENTREGADO';
  return 'PENDIENTE';
}

const topicChecklistLabels = ['Material descargable', 'Podcast', 'Videos', 'Infografías interactivas'];

function buildTopicChecklist(seed: number): Record<string, FactoryStatus> {
  const result: Record<string, FactoryStatus> = {};
  topicChecklistLabels.forEach((label) => {
    result[label] = 'pendiente';
  });
  return result;
}

export function FactorySubjectDetail() {
  const { subjectId } = useParams();
  const { projects, projectObservations, updateFactoryChecklistItem, markObservationCorrectionApplied, markSubjectDelivered } = useOperations();
  const project = projects.find((item) => item.subjects.some((subject) => subject.id === subjectId));
  const subject = project?.subjects.find((item) => item.id === subjectId);

  if (!project || !subject) return <Navigate to="/projects" replace />;

  const [localTopicChecklist, setLocalTopicChecklist] = useState<Record<string, Record<string, FactoryStatus>>>({});

  const totalChecklist = subject.checklist.length;
  const deliveredChecklist = subject.checklist.filter((c) => c.status === 'ENTREGADO' || c.status === 'APROBADO').length;
  const subjectProgress = totalChecklist > 0 ? Math.round((deliveredChecklist / totalChecklist) * 100) : 0;

  const openProductObs = projectObservations.filter(
    (o) => o.subjectId === subject.id && o.authorRole === 'PRODUCT' && (o.status === 'ABIERTA' || o.status === 'OPEN')
  );

  const topics = subject.contentTopics?.map((topic, index) => ({
    id: `${subject.id}-topic-${index}`,
    name: topic,
    order: index + 1,
  })) ?? [];

  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const allChecklistDelivered = subject.checklist.every((c) => c.status === 'ENTREGADO' || c.status === 'APROBADO');

  const handleChecklistUpdate = (checklistItemId: string, newStatus: FactoryStatus) => {
    if (newStatus === 'aprobado') return;
    updateFactoryChecklistItem(project.id, subject.id, checklistItemId, fromFactoryStatus(newStatus));
  };

  const handleTopicChecklistUpdate = (topicId: string, itemLabel: string, status: FactoryStatus) => {
    if (status === 'aprobado') return;
    const topicIndex = topics.findIndex((t) => t.id === topicId);
    if (topicIndex < 0) return;
    setLocalTopicChecklist((prev) => ({
      ...prev,
      [topicId]: {
        ...(prev[topicId] ?? buildTopicChecklist(Date.now())),
        [itemLabel]: status,
      },
    }));
  };

  const handleMarkCorrectionApplied = (obsId: string, obs: typeof projectObservations[number]) => {
    markObservationCorrectionApplied(project.id, obsId, obs);
  };

  const handleDeliverSubject = () => {
    if (!allChecklistDelivered) return;
    markSubjectDelivered(project.id, subject.id, subject.name);
  };

  const semester = project.semesters.find((s) => s.semesterNumber === subject.semesterNumber);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={`/projects/${project.id}/semesters/${subject.semesterNumber}`} className="inline-flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#FF6B00]">
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al semestre
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#1E293B]">{subject.name}</h1>
          <p className="mt-1 text-[0.9rem] text-[#64748B]">{project.program} · {project.school} · Semestre {subject.semesterNumber}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={subject.status} />
          <span className="text-[11px] font-medium text-[#94A3B8]">Entrega: {semester ? formatDate(semester.factoryExpectedDate) : formatDate(project.expectedDeliveryDate)}</span>
        </div>
      </div>

      <Card className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-5">
        <Info label="Checklist general">{deliveredChecklist}/{totalChecklist} entregados</Info>
        <Info label="Temas/gránulos">{topics.length}</Info>
        <Info label="Observaciones Product">{openProductObs.length} abiertas</Info>
        <Info label="Avance asignatura">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ProgressBar value={subjectProgress} showLabel={false} size="sm" />
            </div>
            <span className="text-xs font-black text-orange-600">{subjectProgress}%</span>
          </div>
        </Info>
      </Card>

      {openProductObs.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-rose-500/10">
              <MessageSquare className="h-4 w-4 text-rose-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-[-0.02em] text-[#1E293B]">Observaciones de Product</h2>
              <p className="text-[11px] font-medium text-[#64748B]">{openProductObs.length} correccion{openProductObs.length !== 1 ? 'es' : ''} pendiente{openProductObs.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="space-y-3">
            {openProductObs.map((obs) => {
              const isTopicObs = topics.some((t) => obs.relatedEntity?.includes(t.name));
              return (
                <div key={obs.id} className="rounded-[16px] bg-white p-4 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.06)] border border-rose-100/50">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[9px] font-bold ring-1',
                      isTopicObs
                        ? 'bg-violet-50 text-violet-700 ring-violet-200/80'
                        : 'bg-orange-50 text-orange-700 ring-orange-200/80',
                    )}>
                      {isTopicObs ? 'Tema' : 'Asignatura'}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">Ref: {obs.relatedEntity}</span>
                    <span className="text-[10px] font-medium text-slate-500">{formatDate(obs.createdAt)}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800">{obs.content}</p>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleMarkCorrectionApplied(obs.id, obs)}
                      className="inline-flex items-center gap-1.5 rounded-[12px] bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Marcar corrección aplicada
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Entregables</p>
            <h2 className="text-sm font-bold tracking-tight text-slate-950">Checklist de asignatura</h2>
          </div>
          <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 ring-1 ring-orange-200/80">
            {deliveredChecklist}/{totalChecklist} entregados
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {subject.checklist.map((item) => {
            const factoryStatus = toFactoryStatus(item.status);
            const isApproved = factoryStatus === 'aprobado';
            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-[16px] border bg-white p-4 transition-all',
                  isApproved ? 'border-emerald-200 bg-emerald-50/20' : 'border-orange-100/60',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900">{item.label}</h3>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                      {item.ownerRole} · {formatDate(item.updatedAt)}
                    </p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1', factoryStatusTone[factoryStatus])}>
                    {factoryStatusLabels[factoryStatus]}
                  </span>
                </div>

                {!isApproved && (
                  <div className="mt-3 flex gap-1.5">
                    {(['pendiente', 'en_produccion', 'entregado'] as FactoryStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleChecklistUpdate(item.id, status)}
                        className={cn(
                          'flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all',
                          factoryStatus === status
                            ? factoryStatusTone[status]
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100',
                        )}
                      >
                        {factoryStatusLabels[status]}
                      </button>
                    ))}
                  </div>
                )}

                {isApproved && (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Aprobado por Product
                  </div>
                )}

                {item.observations && (
                  <p className="mt-3 rounded-xl bg-orange-50/40 px-3 py-2 text-[11px] font-medium text-slate-600">
                    {item.observations}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {topics.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Contenido</p>
              <h2 className="text-sm font-bold tracking-tight text-slate-950">Temas / Gránulos</h2>
            </div>
            <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 ring-1 ring-orange-200/80">
              {topics.length} temas
            </span>
          </div>

          <div className="space-y-3">
            {topics.map((topic) => {
              const expanded = expandedTopicId === topic.id;
              const topicChecklist = localTopicChecklist[topic.id] ?? buildTopicChecklist(Date.now());
              const topicDelivered = Object.values(topicChecklist).filter((s) => s === 'entregado').length;
              const topicTotal = topicChecklistLabels.length;

              return (
                <div key={topic.id} className="rounded-[16px] border border-orange-100/60 bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedTopicId(expanded ? null : topic.id)}
                    className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-orange-50/30"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-orange-400 to-orange-600 text-[11px] font-black text-white">
                        {topic.order}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{topic.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-medium text-slate-500">{topicDelivered}/{topicTotal}</span>
                      <span className="text-xs font-medium text-slate-400">{expanded ? 'Cerrar' : 'Ver checklist'}</span>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-orange-100/60 p-4">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {topicChecklistLabels.map((label) => {
                          const currentStatus = topicChecklist[label] ?? 'pendiente';
                          return (
                            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                              <p className="text-xs font-bold text-slate-800">{label}</p>
                              <div className="mt-2 flex gap-1.5">
                                {(['pendiente', 'en_produccion', 'entregado'] as FactoryStatus[]).map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleTopicChecklistUpdate(topic.id, label, status)}
                                    className={cn(
                                      'flex-1 rounded-md px-2 py-1 text-[9px] font-bold transition-all',
                                      currentStatus === status
                                        ? factoryStatusTone[status]
                                        : 'bg-white text-slate-400 hover:bg-slate-100',
                                    )}
                                  >
                                    {factoryStatusLabels[status]}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#FFEDD5]">
            <Package className="h-4 w-4 text-[#FF6B00]" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-[-0.02em] text-[#1E293B]">Entrega de asignatura</h2>
            <p className="text-[11px] font-medium text-[#64748B]">Marca la asignatura como entregada a Product</p>
          </div>
        </div>

        {allChecklistDelivered ? (
          <div className="space-y-3">
            <div className="rounded-[12px] bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Todos los entregables están listos. Puedes entregar la asignatura.
            </div>
            <Button onClick={handleDeliverSubject} className="w-full py-3 text-sm font-bold">
              <Package className="h-4 w-4" /> Entregar asignatura a Product
            </Button>
          </div>
        ) : (
          <div className="rounded-[12px] bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Aún hay entregables pendientes. Completa todos los items para poder entregar.
          </div>
        )}
      </Card>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">{label}</p>
      <div className="text-sm font-medium text-[#1E293B]">{children}</div>
    </div>
  );
}
