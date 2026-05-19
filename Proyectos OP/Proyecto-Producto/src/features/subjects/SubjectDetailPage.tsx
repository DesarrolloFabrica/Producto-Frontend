import { useState } from 'react';
import { Navigate, useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, MessageSquare, Plus, X, Loader2, AlertCircle, Check } from 'lucide-react';
import { StatusBadge } from '../../components/status/StatusBadge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState } from '../../components/ui/EmptyState';
import { useOperations } from '../../features/operations/OperationsContext';
import { useAuth } from '../auth/AuthContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { cn } from '../../components/ui/tokens';
import type { ChecklistItem, ChecklistStatus, Role } from '../../types/domain';
import { FactorySubjectDetail } from './FactorySubjectDetail';

type ProductReviewStatus = 'pendiente' | 'aprobado' | 'rechazado';

function toProductReviewStatus(status: string): ProductReviewStatus {
  if (status === 'APROBADO') return 'aprobado';
  return 'pendiente';
}

const reviewStatusTone: Record<ProductReviewStatus, string> = {
  pendiente: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80',
  aprobado: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
  rechazado: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80',
};

const reviewStatusLabels: Record<ProductReviewStatus, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

const topicChecklistLabels = ['Material descargable', 'Podcast', 'Videos', 'Infografías interactivas'];

function buildTopicChecklist(seed: number): ChecklistItem[] {
  return topicChecklistLabels.map((label, index) => ({
    id: `chk-topic-${seed}-${index}`,
    label,
    status: 'PENDIENTE' as ChecklistStatus,
    ownerRole: 'PRODUCT' as Role,
    updatedAt: new Date().toISOString(),
    observations: '',
  }));
}

export function SubjectDetailPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { projects, projectObservations, updateChecklistItem, addObservation, addTopicToSubject, resolveObservation } = useOperations();
  const { role } = useAuth();
  const project = projects.find((item) => item.subjects.some((subject) => subject.id === subjectId));
  const subject = project?.subjects.find((item) => item.id === subjectId);

  if (!project || !subject) return <Navigate to="/projects" replace />;

  if (role === 'FABRICA') {
    return <FactorySubjectDetail />;
  }

  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [observationForm, setObservationForm] = useState({ text: '', level: 'subject' as 'subject' | 'topic', topicId: '' });
  const [localTopicChecklist, setLocalTopicChecklist] = useState<Record<string, Record<string, ProductReviewStatus>>>({});
  const [showAddTopicForm, setShowAddTopicForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [savingTopic, setSavingTopic] = useState(false);
  const [observationError, setObservationError] = useState('');
  const [rejectedItemId, setRejectedItemId] = useState<string | null>(null);
  const [rejectedItemLabel, setRejectedItemLabel] = useState('');

  const totalChecklist = subject.checklist.length;
  const approvedChecklist = subject.checklist.filter((c) => c.status === 'APROBADO').length;
  const subjectProgress = totalChecklist > 0 ? Math.round((approvedChecklist / totalChecklist) * 100) : 0;

  const subjectObservations = projectObservations.filter(
    (o) => o.subjectId === subject.id && o.status === 'ABIERTA'
  );
  const resolvedObservations = projectObservations.filter(
    (o) => o.subjectId === subject.id && o.status === 'RESUELTA'
  );

  const topics = subject.contentTopics?.map((topic, index) => ({
    id: `${subject.id}-topic-${index}`,
    name: topic,
    order: index + 1,
  })) ?? [];

  const handleChecklistUpdate = (checklistItemId: string, newStatus: string, itemLabel: string) => {
    updateChecklistItem(project.id, subject.id, checklistItemId, newStatus as any);
    if (newStatus === 'PENDIENTE') {
      setRejectedItemId(checklistItemId);
      setRejectedItemLabel(itemLabel);
    } else {
      setRejectedItemId(null);
      setRejectedItemLabel('');
    }
  };

  const handleTopicChecklistUpdate = (topicId: string, itemLabel: string, status: ProductReviewStatus) => {
    setLocalTopicChecklist((prev) => ({
      ...prev,
      [topicId]: {
        ...(prev[topicId] ?? {}),
        [itemLabel]: status,
      },
    }));
  };

  const handleAddObservation = () => {
    setObservationError('');
    if (!observationForm.text.trim()) {
      setObservationError('El texto de la observación es requerido.');
      return;
    }
    if (observationForm.level === 'topic' && !observationForm.topicId) {
      setObservationError('Debes seleccionar un tema para la observación.');
      return;
    }
    const referenceName = observationForm.level === 'topic'
      ? topics.find((t) => t.id === observationForm.topicId)?.name ?? subject.name
      : subject.name;

    addObservation(project.id, {
      id: `obs-${Date.now()}`,
      projectId: project.id,
      subjectId: subject.id,
      author: 'Product Owner',
      role: 'PRODUCT',
      text: observationForm.text,
      status: 'ABIERTA',
      relatedEntity: referenceName,
      createdAt: new Date().toISOString(),
    });
    setObservationForm({ text: '', level: 'subject', topicId: '' });
    setShowObservationForm(false);
    setObservationError('');
  };

  const handleResolveObservation = (obsId: string, obs: typeof projectObservations[number]) => {
    resolveObservation(project.id, obsId, obs);
  };

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) return;
    setSavingTopic(true);
    await new Promise((r) => setTimeout(r, 300));
    const checklist = buildTopicChecklist(Date.now());
    addTopicToSubject(project.id, subject.id, newTopicName, checklist);
    setSavingTopic(false);
    setNewTopicName('');
    setShowAddTopicForm(false);
  };

  const handleCreateObsFromRejection = () => {
    setShowObservationForm(true);
    setObservationForm({ text: `El item "${rejectedItemLabel}" fue rechazado. Por favor revisar y corregir.`, level: 'subject', topicId: '' });
    setRejectedItemId(null);
    setRejectedItemLabel('');
  };

  return (
    <div className="space-y-7">
      <PageHeader
        prominentEyebrow
        eyebrow={`${project.program} · Semestre ${subject.semesterNumber}`}
        title={subject.name}
        description={`Responsable Fábrica: ${project.factoryOwner}`}
        action={
          <Link
            to={`/projects/${project.id}/semesters/${subject.semesterNumber}`}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-orange-300 hover:text-orange-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al semestre
          </Link>
        }
      />

      <Card variant="subjectPanel" className="p-5 sm:p-7">
        <div className="flex items-center gap-3 border-b border-orange-100/90 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/25">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Revisión Product</p>
            <p className="text-sm font-black text-slate-950">Estado de la asignatura</p>
          </div>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado revisión</p>
            <div className="mt-2">
              <StatusBadge status={subject.status} />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Responsable</p>
            <p className="mt-2 truncate text-sm font-bold text-slate-800">{project.factoryOwner}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checklist</p>
            <p className="mt-2 text-sm font-black text-orange-600">{totalChecklist} entregables</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avance</p>
            <div className="mt-2">
              <ProgressBar value={subjectProgress} showLabel={false} />
            </div>
          </div>
        </div>
      </Card>

      <Card variant="subjectPanel" className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-orange-100/90 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Entregables</p>
            <h2 className="text-sm font-black tracking-tight text-slate-950">Checklist de asignatura</h2>
          </div>
          <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-black text-orange-700 ring-1 ring-orange-200/80">
            {approvedChecklist}/{totalChecklist} aprobados
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {subject.checklist.map((item) => {
            const productStatus = toProductReviewStatus(item.status);
            const isRejected = productStatus === 'rechazado';
            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-[16px] border bg-white p-4 transition-all hover:shadow-sm',
                  isRejected ? 'border-rose-200 bg-rose-50/30' : 'border-orange-100/60',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900">{item.label}</h3>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                      {item.ownerRole} · {formatDate(item.updatedAt)}
                    </p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1', reviewStatusTone[productStatus])}>
                    {reviewStatusLabels[productStatus]}
                  </span>
                </div>

                <div className="mt-3 flex gap-1.5">
                  {(['pendiente', 'aprobado', 'rechazado'] as ProductReviewStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        const mappedStatus = status === 'aprobado' ? 'APROBADO' : 'PENDIENTE';
                        handleChecklistUpdate(item.id, mappedStatus, item.label);
                      }}
                      className={cn(
                        'flex-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all',
                        productStatus === status
                          ? reviewStatusTone[status]
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100',
                      )}
                    >
                      {reviewStatusLabels[status]}
                    </button>
                  ))}
                </div>

                {isRejected && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50/50 p-2.5">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-rose-700">Item rechazado</p>
                      <p className="text-[10px] font-medium text-rose-600">Registra una observación para que Fábrica pueda corregirlo.</p>
                      <button
                        type="button"
                        onClick={handleCreateObsFromRejection}
                        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 hover:text-rose-800"
                      >
                        <MessageSquare className="h-3 w-3" /> Crear observación
                      </button>
                    </div>
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
        <Card variant="subjectPanel" className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-orange-100/90 pb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Contenido</p>
              <h2 className="text-sm font-black tracking-tight text-slate-950">Temas / Gránulos</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-black text-orange-700 ring-1 ring-orange-200/80">
                {topics.length} temas
              </span>
              <button
                type="button"
                onClick={() => setShowAddTopicForm(true)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700"
              >
                <Plus className="h-3 w-3" /> Agregar tema
              </button>
            </div>
          </div>

          {showAddTopicForm && (
            <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-900">Nuevo tema/gránulo</p>
                <button type="button" onClick={() => { setShowAddTopicForm(false); setNewTopicName(''); }} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Nombre del tema"
                  onKeyDown={(e) => { if (e.key === 'Enter' && newTopicName.trim()) handleAddTopic(); }}
                />
                <Button size="sm" onClick={handleAddTopic} disabled={!newTopicName.trim() || savingTopic}>
                  {savingTopic ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  {savingTopic ? '...' : 'Agregar'}
                </Button>
              </div>
              <p className="mt-2 text-[10px] font-medium text-slate-500">Se creará automáticamente el checklist: Material descargable, Podcast, Videos, Infografías interactivas.</p>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {topics.map((topic) => {
              const expanded = expandedTopicId === topic.id;
              const topicChecklist = localTopicChecklist[topic.id] ?? {};

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
                    <span className="text-xs font-medium text-slate-400">{expanded ? 'Cerrar' : 'Ver checklist'}</span>
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
                                {(['pendiente', 'aprobado', 'rechazado'] as ProductReviewStatus[]).map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleTopicChecklistUpdate(topic.id, label, status)}
                                    className={cn(
                                      'flex-1 rounded-md px-2 py-1 text-[9px] font-bold transition-all',
                                      currentStatus === status
                                        ? reviewStatusTone[status]
                                        : 'bg-white text-slate-400 hover:bg-slate-100',
                                    )}
                                  >
                                    {reviewStatusLabels[status]}
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

      <Card variant="subjectPanel" className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-orange-100/90 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Seguimiento</p>
            <h2 className="text-sm font-black tracking-tight text-slate-950">Observaciones</h2>
          </div>
          <Button variant="primary" size="sm" onClick={() => { setShowObservationForm(true); setObservationError(''); }} className="shadow-lg shadow-orange-500/25">
            <Plus className="h-3.5 w-3.5" /> Nueva
          </Button>
        </div>

        {showObservationForm && (
          <div className="mt-5 rounded-[16px] border border-orange-200 bg-orange-50/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900">Enviar observación a Fábrica</p>
                <p className="text-[10px] font-medium text-slate-500">Selecciona el nivel y describe qué debe corregir Fábrica.</p>
              </div>
              <button type="button" onClick={() => { setShowObservationForm(false); setObservationError(''); }} className="shrink-0 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Nivel de observación</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setObservationForm((f) => ({ ...f, level: 'subject', topicId: '' }))}
                    className={cn(
                      'rounded-lg px-3 py-2 text-xs font-bold transition-all',
                      observationForm.level === 'subject'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
                    )}
                  >
                    Asignatura completa
                  </button>
                  {topics.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setObservationForm((f) => ({ ...f, level: 'topic', topicId: t.id }))}
                      className={cn(
                        'rounded-lg px-3 py-2 text-xs font-bold transition-all',
                        observationForm.level === 'topic' && observationForm.topicId === t.id
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
                      )}
                    >
                      Tema {t.order}: {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {observationError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                  <p className="text-xs font-medium text-rose-700">{observationError}</p>
                </div>
              )}

              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none resize-none"
                rows={3}
                placeholder="Describe qué debe corregir o completar Fábrica..."
                value={observationForm.text}
                onChange={(e) => setObservationForm((f) => ({ ...f, text: e.target.value }))}
              />

              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => { setShowObservationForm(false); setObservationError(''); }}>Cancelar</Button>
                <Button size="sm" onClick={handleAddObservation} disabled={!observationForm.text.trim()}>
                  <MessageSquare className="h-3.5 w-3.5" /> Enviar observación
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {subjectObservations.length === 0 && resolvedObservations.length === 0 && (
            <EmptyState icon={MessageSquare} title="Sin observaciones" description="Aún no se han registrado observaciones para esta asignatura." cardVariant="subjectPanel" />
          )}

          {subjectObservations.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Abiertas · {subjectObservations.length}</p>
              </div>
              <div className="space-y-2">
                {subjectObservations.map((obs) => {
                  const isTopicObs = topics.some((t) => obs.relatedEntity === t.name);
                  return (
                    <div key={obs.id} className="rounded-xl border border-amber-100/60 bg-amber-50/30 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={cn(
                              'rounded-full px-2 py-0.5 text-[9px] font-bold ring-1',
                              isTopicObs
                                ? 'bg-violet-50 text-violet-700 ring-violet-200/80'
                                : 'bg-orange-50 text-orange-700 ring-orange-200/80',
                            )}>
                              {isTopicObs ? 'Tema' : 'Asignatura'}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500">Ref: {obs.relatedEntity}</span>
                          </div>
                          <p className="mt-2 text-xs font-medium text-slate-800">{obs.text}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-medium text-slate-500">
                            <span>{obs.author} · {obs.role}</span>
                            <span>{formatDate(obs.createdAt)}</span>
                            <span className="inline-flex items-center gap-1">
                              Responsable: <span className="font-bold text-slate-700">Fábrica</span>
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleResolveObservation(obs.id, obs)}
                          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold text-emerald-700 transition-all hover:bg-emerald-100"
                        >
                          <Check className="h-3.5 w-3.5" /> Validar resuelta
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {resolvedObservations.length > 0 && (
            <details className="group">
              <summary className="flex cursor-pointer items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                </span>
                Resueltas · {resolvedObservations.length}
                <span className="ml-auto text-[9px] font-medium text-slate-400 group-open:hidden">Mostrar</span>
                <span className="ml-auto hidden text-[9px] font-medium text-slate-400 group-open:inline">Ocultar</span>
              </summary>
              <div className="mt-3 space-y-2">
                {resolvedObservations.map((obs) => {
                  const isTopicObs = topics.some((t) => obs.relatedEntity === t.name);
                  return (
                    <div key={obs.id} className="rounded-xl border border-emerald-100/60 bg-emerald-50/20 p-3 opacity-75">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-[9px] font-bold ring-1',
                          isTopicObs
                            ? 'bg-violet-50 text-violet-700 ring-violet-200/80'
                            : 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
                        )}>
                          {isTopicObs ? 'Tema' : 'Asignatura'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500">Ref: {obs.relatedEntity}</span>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-700">{obs.text}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-medium text-slate-500">
                        <span>{obs.author} · {obs.role}</span>
                        <span>Creada: {formatDate(obs.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      </Card>
    </div>
  );
}
