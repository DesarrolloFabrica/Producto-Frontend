import { useState } from 'react';
import { Navigate, useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, MessageSquare, Plus, X, Loader2, AlertCircle, ChevronDown, Check } from 'lucide-react';
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
  if (status === 'RECHAZADO') return 'rechazado';
  return 'pendiente';
}

const reviewStatusConfig: Record<ProductReviewStatus, { bg: string; text: string; ring: string; dot: string }> = {
  pendiente: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200/80', dot: 'bg-amber-500' },
  aprobado: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200/80', dot: 'bg-emerald-500' },
  rechazado: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200/80', dot: 'bg-rose-500' },
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

const CHECKLIST_CATEGORIES = [
  {
    id: 'informacion_base',
    title: 'Información base',
    items: ['Presentación de la asignatura', 'Foro de presentación', 'Syllabus', 'Lecturas y bibliografía'],
  },
  {
    id: 'evaluacion_competencias',
    title: 'Evaluación y competencias',
    items: ['Resultados de aprendizaje y competencias', 'Evaluación diagnóstica de entrada', 'Evaluaciones', 'Evaluación diagnóstica de salida'],
  },
  {
    id: 'actividades_recursos',
    title: 'Actividades y recursos',
    items: ['ACA Actividad de Conocimiento Aplicado', 'Foro Taller', 'Taller RAE', 'Seminario Alemán'],
  },
];

function getCategoryForItem(itemLabel: string): string {
  for (const category of CHECKLIST_CATEGORIES) {
    if (category.items.some((i) => i.toLowerCase() === itemLabel.toLowerCase())) {
      return category.id;
    }
  }
  return 'informacion_base';
}

type FilterStatus = 'todos' | 'pendiente' | 'aprobado' | 'rechazado';

interface ChecklistItemCardProps {
  item: ChecklistItem;
  status: ProductReviewStatus;
  onUpdate: (id: string, newStatus: ProductReviewStatus, label: string) => void;
  onCreateObservation: (label: string) => void;
}

function ChecklistItemCard({ item, status, onUpdate, onCreateObservation }: ChecklistItemCardProps) {
  const config = reviewStatusConfig[status];

  return (
    <div className={cn(
      'group relative rounded-xl border p-3 transition-all duration-200 hover:shadow-md',
      'border-slate-100 bg-white hover:border-orange-200'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-[13px] font-bold text-slate-900 truncate">{item.label}</h4>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1',
              config.bg, config.text, config.ring
            )}>
              <span className={cn('h-1 w-1 rounded-full', config.dot)} />
              {reviewStatusLabels[status]}
            </span>
            <span className="text-[9px] font-medium text-slate-400">{item.ownerRole}</span>
          </div>
        </div>
        <StatusSelector value={status} onChange={(s) => onUpdate(item.id, s, item.label)} />
      </div>
    </div>
  );
}

function StatusSelector({ value, onChange }: { value: ProductReviewStatus; onChange: (s: ProductReviewStatus) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null);
  const config = reviewStatusConfig[value];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const menuWidth = 160;
    const viewportPadding = 12;
    const left = Math.min(
      Math.max(rect.right - menuWidth, viewportPadding),
      window.innerWidth - menuWidth - viewportPadding,
    );
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left,
      width: menuWidth,
      zIndex: 100,
    });
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ring-1',
          config.bg, config.text, config.ring
        )}
      >
        {reviewStatusLabels[value]}
        <ChevronDown className="h-3 w-3" />
      </button>
      {isOpen && dropdownStyle && (
        <>
          <div className="fixed inset-0 z-[99]" onClick={() => { setIsOpen(false); setDropdownStyle(null); }} />
          <div
            className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
            style={dropdownStyle}
          >
            <div className="border-b border-slate-100 px-2.5 py-1.5">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Cambiar a</span>
            </div>
            {(['pendiente', 'aprobado', 'rechazado'] as ProductReviewStatus[]).map((status) => {
              const statusConfig = reviewStatusConfig[status];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    onChange(status);
                    setIsOpen(false);
                    setDropdownStyle(null);
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium transition-colors',
                    value === status ? statusConfig.bg : 'hover:bg-slate-50'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', statusConfig.dot)} />
                  <span className={cn(value === status ? statusConfig.text : 'text-slate-600')}>
                    {reviewStatusLabels[status]}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function CategorySection({
  title,
  items,
  checklist,
  onUpdate,
  onCreateObservation,
}: {
  title: string;
  items: string[];
  checklist: ChecklistItem[];
  onUpdate: (id: string, newStatus: ProductReviewStatus, label: string) => void;
  onCreateObservation: (label: string) => void;
}) {
  const categoryItems = checklist.filter((item) => getCategoryForItem(item.label) === getCategoryForItem(items[0]));
  const approved = categoryItems.filter((i) => toProductReviewStatus(i.status) === 'aprobado').length;
  const total = categoryItems.length;
  const progress = total > 0 ? Math.round((approved / total) * 100) : 0;

  if (categoryItems.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-600">{approved}/{total}</span>
          <div className="w-20">
            <ProgressBar value={progress} showLabel={false} size="sm" />
          </div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {categoryItems.map((item) => (
          <ChecklistItemCard
            key={item.id}
            item={item}
            status={toProductReviewStatus(item.status)}
            onUpdate={onUpdate}
            onCreateObservation={onCreateObservation}
          />
        ))}
      </div>
    </div>
  );
}

interface TopicCardProps {
  topic: { id: string; name: string; order: number };
  checklist: Record<string, ProductReviewStatus>;
  onUpdate: (topicId: string, label: string, status: ProductReviewStatus) => void;
}

interface TopicCardProps {
  topic: { id: string; name: string; order: number };
  checklist: Record<string, ProductReviewStatus>;
  onUpdate: (topicId: string, label: string, status: ProductReviewStatus) => void;
}

function TopicCard({ topic, checklist, onUpdate }: TopicCardProps) {
  const [expanded, setExpanded] = useState(false);
  const topicChecklist = checklist ?? {};
  const approved = Object.values(topicChecklist).filter((s) => s === 'aprobado').length;
  const total = 4;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden transition-all duration-200 hover:shadow-md">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-black text-white shadow-sm">
            {topic.order}
          </span>
          <div className="text-left">
            <h4 className="text-sm font-bold text-slate-900">{topic.name}</h4>
            <p className="text-[10px] font-medium text-slate-500">{approved}/{total} materiales aprobados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            {approved === total ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completo
              </span>
            ) : (
              <span className="text-[10px] font-medium text-amber-600">{total - approved} pendientes</span>
            )}
          </div>
          <span className={cn(
            'text-xs font-medium transition-transform',
            expanded ? 'rotate-180' : ''
          )}>
            ▼
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <p className="mb-3 text-[10px] font-medium text-slate-500">
            Cada tema debe contar con material descargable, podcast, video e infografía.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {topicChecklistLabels.map((label) => {
              const status = topicChecklist[label] ?? 'pendiente';
              const config = reviewStatusConfig[status];

              return (
                <div key={label} className="rounded-xl border border-slate-100 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-800">{label}</span>
                    <StatusSelector
                      value={status}
                      onChange={(newStatus) => onUpdate(topic.id, label, newStatus)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
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
  const [checklistFilter, setChecklistFilter] = useState<FilterStatus>('todos');
  const observationFormRef = useState<HTMLDivElement | null>(null);

  const totalChecklist = subject.checklist.length;
  const approvedChecklist = subject.checklist.filter((c) => c.status === 'APROBADO').length;
  const pendingChecklist = subject.checklist.filter((c) => c.status === 'PENDIENTE').length;
  const rejectedChecklist = subject.checklist.filter((c) => c.status === 'RECHAZADO').length;
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

  const handleChecklistUpdate = (checklistItemId: string, newStatus: ProductReviewStatus, itemLabel: string) => {
    const mappedStatus: ChecklistStatus = newStatus === 'aprobado' ? 'APROBADO' : newStatus === 'rechazado' ? 'RECHAZADO' : 'PENDIENTE';
    updateChecklistItem(project.id, subject.id, checklistItemId, mappedStatus);
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

  const filteredChecklist = subject.checklist.filter((item) => {
    if (checklistFilter === 'todos') return true;
    const productStatus = toProductReviewStatus(item.status);
    return productStatus === checklistFilter;
  });

  const handleCreateObservation = (itemLabel: string) => {
    setShowObservationForm(true);
    setObservationForm({ text: `Revisar "${itemLabel}", fue marcado como rechazado.`, level: 'subject', topicId: '' });
    setTimeout(() => {
      const formElement = document.getElementById('observation-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const textarea = formElement.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }
    }, 100);
  };

  return (
    <div className="space-y-6">
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

      <Card variant="subjectPanel" className="p-5 sm:p-6">
        <div className="flex items-center gap-3 border-b border-orange-100/90 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/25">
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

      <Card variant="subjectPanel" className="p-0 overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-orange-50/30 to-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Entregables</p>
              <h2 className="text-sm font-black tracking-tight text-slate-950">Revisión general de asignatura</h2>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">Valida los entregables principales antes de cerrar la asignatura.</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-orange-600">{approvedChecklist}/{totalChecklist}</p>
              <div className="mt-1 w-24">
                <ProgressBar value={subjectProgress} showLabel={false} size="sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 bg-white px-5 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {(['todos', 'pendiente', 'aprobado', 'rechazado'] as FilterStatus[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setChecklistFilter(filter)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[10px] font-bold transition-all',
                    checklistFilter === filter
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50',
                  )}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {pendingChecklist}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {approvedChecklist}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> {rejectedChecklist}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5">
          {filteredChecklist.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Sin entregables" description="No hay entregables que coincidan con el filtro seleccionado." cardVariant="subjectPanel" />
          ) : (
            <div className="space-y-6">
              {CHECKLIST_CATEGORIES.map((category) => (
                <CategorySection
                  key={category.id}
                  title={category.title}
                  items={category.items}
                  checklist={filteredChecklist}
                  onUpdate={handleChecklistUpdate}
                  onCreateObservation={handleCreateObservation}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {topics.length > 0 && (
        <Card variant="subjectPanel" className="p-0 overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-orange-50/30 to-white px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Contenido</p>
                <h2 className="text-sm font-black tracking-tight text-slate-950">Revisión por temas / gránulos</h2>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">Cada tema debe contar con material descargable, podcast, video e infografía.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-bold text-orange-700 ring-1 ring-orange-200/80">
                  {topics.length} temas
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddTopicForm(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:text-orange-700"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar
                </button>
              </div>
            </div>
          </div>

          {showAddTopicForm && (
            <div className="mx-5 mt-4 rounded-xl border border-orange-200 bg-orange-50/30 p-3">
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

          <div className="p-5">
            <div className="space-y-3">
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  checklist={localTopicChecklist[topic.id] ?? {}}
                  onUpdate={handleTopicChecklistUpdate}
                />
              ))}
            </div>
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
          <div id="observation-form" className="mt-5 rounded-[16px] border border-orange-200 bg-orange-50/30 p-4">
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
