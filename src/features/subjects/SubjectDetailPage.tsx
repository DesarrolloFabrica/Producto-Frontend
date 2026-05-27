import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ContextBackLink } from '../../navigation/ContextBackLink';
import { ArrowLeft, BookOpen, CheckCircle2, MessageSquare, Plus, X, Loader2, AlertCircle, ChevronDown, Check } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import type { BulkApproveSectionScope } from '../../services/checklistApi';
import {
  countApprovableProductItems,
  countApprovableTopicItems,
  getProductSectionBulkBlockMessage,
  getSubjectNotReviewableMessage,
  getTopicBulkBlockMessage,
  isSubjectReviewableForBulkApprove,
  canProductApproveSubject,
  canProductRequestSubjectCorrection,
  getAcademicApprovalBlockers,
  isReadyForAcademicApproval,
  isSubjectApproved,
} from './checklistBulkHelpers';
import { BulkApproveBlockHint, SubjectReviewBlockBanner } from './BulkApproveBlockHint';
import { AcademicInstitutionalWaitingView } from '../institutional-workflow/AcademicInstitutionalWaitingView';
import { PendingProjectRadicationView } from '../institutional-workflow/PendingProjectRadicationView';
import { AcademicReviewReadyView } from '../institutional-workflow/AcademicReviewReadyView';
import { AcademicCorrectionInFactoryView } from '../institutional-workflow/AcademicCorrectionInFactoryView';
import { StatusBadge } from '../../components/status/StatusBadge';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  getApiErrorMessage,
  mapObservationsFromApi,
  mapSubjectWorkspaceProjectFromApi,
} from '../operations/apiMappers';
import { useOperations } from '../../features/operations/OperationsContext';
import { useToast } from '../../components/ui/ToastProvider';
import { useAuth } from '../auth/AuthContext';
import { formatDate } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { cn } from '../../components/ui/tokens';
import type { ChecklistItem, ChecklistStatus, Role } from '../../types/domain';
import { ProjectsLoadNotice } from '../../components/feedback/ProjectsLoadNotice';
import { DeepLinkNotFound } from '../../components/feedback/DeepLinkNotFound';
import { FactorySubjectDetail } from './FactorySubjectDetail';
import { ChangeOriginBadge, ChangeOriginHint } from '../../components/change-tracking/ChangeOriginBadge';
import { useDismissNotificationsOnVisit } from '../notifications/useDismissNotificationsOnVisit';
import { getSubjectTopicsCounterLabel } from '../../utils/subjectTopics';
import { AcademicTopicsDefinitionPanel } from '../../components/forms/AcademicTopicsDefinitionPanel';
import { subjectsApi } from '../../services/subjectsApi';
import { DeliverableObservationsDrawer } from '../observations/DeliverableObservationsDrawer';
import { ObservationDeliverableButton } from '../observations/ObservationDeliverableButton';
import {
  countPendingProductObservations,
  filterObservationsForChecklistItem,
  getObservationBadgeState,
} from '../observations/observationDeliverableHelpers';
import type { OperationalObservation } from '../../types/domain';
import { useOperationalWorkspaceQuery } from '../queries/useOperationalWorkspaceQuery';
import { homePathForRole } from '../../navigation/roleNavigation';
import { useSubjectWorkspaceQuery } from '../queries/useSubjectWorkspaceQuery';
import { semesterOperationsPath } from '../institutional-workflow/institutionalNavigation';
import { CHECKLIST_CATEGORIES, getCategoryForItem } from './checklistCategories';

type ProductReviewStatus = 'pendiente' | 'aprobado' | 'rechazado';

function toProductReviewStatus(status: string): ProductReviewStatus {
  if (status === 'APROBADO') return 'aprobado';
  if (status === 'RECHAZADO') return 'rechazado';
  return 'pendiente';
}

function mapProductReviewToChecklistStatus(
  reviewStatus: ProductReviewStatus,
  options: { ownerRole?: ChecklistItem['ownerRole']; isTopicItem?: boolean },
): ChecklistStatus {
  if (reviewStatus === 'aprobado') return 'APROBADO';
  if (reviewStatus === 'rechazado') return 'RECHAZADO';
  if (options.ownerRole === 'FABRICA' || options.isTopicItem) return 'ENTREGADO';
  return 'PENDIENTE';
}

function getAllowedProductReviewTransitions(value: ProductReviewStatus): ProductReviewStatus[] {
  if (value === 'pendiente') return ['aprobado', 'rechazado'];
  if (value === 'aprobado') return ['rechazado', 'pendiente'];
  if (value === 'rechazado') return ['aprobado', 'pendiente'];
  return [];
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

type FilterStatus = 'todos' | 'pendiente' | 'aprobado' | 'rechazado';

interface ChecklistItemCardProps {
  item: ChecklistItem;
  status: ProductReviewStatus;
  itemObservations: OperationalObservation[];
  onUpdate: (item: ChecklistItem, newStatus: ProductReviewStatus) => void | Promise<void>;
  onOpenObservations: (item: ChecklistItem) => void;
  selectorDisabled?: boolean;
}

function ChecklistItemCard({
  item,
  status,
  itemObservations,
  onUpdate,
  onOpenObservations,
  selectorDisabled = false,
}: ChecklistItemCardProps) {
  const config = reviewStatusConfig[status];
  const observationState = getObservationBadgeState(itemObservations);

  return (
    <div
      className={cn(
        'group relative overflow-visible rounded-xl border p-3 transition-all duration-200 hover:shadow-md',
        'border-slate-100 bg-white hover:border-orange-200',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-bold text-slate-900">{item.label}</h4>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1',
                config.bg,
                config.text,
                config.ring,
              )}
            >
              <span className={cn('h-1 w-1 rounded-full', config.dot)} />
              {reviewStatusLabels[status]}
            </span>
            <span className="text-[9px] font-medium text-slate-400">{item.ownerRole}</span>
          </div>
        </div>
        <ObservationDeliverableButton
          count={itemObservations.length}
          state={observationState}
          onClick={() => onOpenObservations(item)}
        />
      </div>
      <div className="mt-3 flex items-center justify-end border-t border-slate-50 pt-2">
        <StatusSelector
          value={status}
          disabled={selectorDisabled}
          onChange={(s) => void onUpdate(item, s)}
        />
      </div>
    </div>
  );
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 px-3 py-3 ring-1 ring-slate-100">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-[11px] font-bold leading-5 text-slate-700">{value}</p>
    </div>
  );
}

function StatusSelector({
  value,
  onChange,
  disabled: disabledProp = false,
}: {
  value: ProductReviewStatus;
  onChange: (s: ProductReviewStatus) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null);
  const config = reviewStatusConfig[value];

  const allowed = getAllowedProductReviewTransitions(value);
  const disabled = disabledProp || allowed.length === 0;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (disabled) return;
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
      zIndex: 260,
    });
    setIsOpen(!isOpen);
  };

  const dropdownMenu =
    isOpen && dropdownStyle
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[250]"
              onClick={() => {
                setIsOpen(false);
                setDropdownStyle(null);
              }}
            />
            <div
              className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
              style={dropdownStyle}
            >
              <div className="border-b border-slate-100 px-2.5 py-1.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                  Cambiar a
                </span>
              </div>
              {allowed.map((status) => {
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
                      value === status ? statusConfig.bg : 'hover:bg-slate-50',
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
          </>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'inline-flex min-w-[108px] items-center justify-between gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ring-1',
          config.bg,
          config.text,
          config.ring,
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        {reviewStatusLabels[value]}
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>
      {dropdownMenu}
    </div>
  );
}

function BulkApproveActionButton({
  label,
  disabled,
  loading,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[10px] font-bold ring-1 transition-colors',
        disabled || loading
          ? 'cursor-not-allowed bg-slate-50 text-slate-300 ring-slate-100'
          : 'bg-white text-orange-700 ring-orange-200/80 hover:bg-orange-50',
      )}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      {label}
    </button>
  );
}

function CategorySection({
  categoryId,
  title,
  checklist,
  onUpdate,
  onOpenObservations,
  subjectObservations,
  canBulkApprove,
  approvableCount,
  bulkBlockMessage,
  bulkLoading,
  onBulkApprove,
  selectorDisabled = false,
}: {
  categoryId: string;
  title: string;
  checklist: ChecklistItem[];
  onUpdate: (item: ChecklistItem, newStatus: ProductReviewStatus) => void | Promise<void>;
  onOpenObservations: (item: ChecklistItem) => void;
  subjectObservations: OperationalObservation[];
  canBulkApprove: boolean;
  approvableCount: number;
  bulkBlockMessage: string | null;
  bulkLoading: boolean;
  onBulkApprove: () => void;
  selectorDisabled?: boolean;
}) {
  const categoryItems = checklist.filter((item) => getCategoryForItem(item.label) === categoryId);
  const approved = categoryItems.filter((i) => toProductReviewStatus(i.status) === 'aprobado').length;
  const total = categoryItems.length;
  const progress = total > 0 ? Math.round((approved / total) * 100) : 0;
  const bulkDisabled = !canBulkApprove || approvableCount === 0;
  const showBlockHint = bulkDisabled && bulkBlockMessage !== null;

  if (categoryItems.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-600">
            {approved}/{total}
          </span>
          <div className="w-20">
            <ProgressBar value={progress} showLabel={false} size="sm" />
          </div>
          <BulkApproveActionButton
            label="Aprobar sección"
            disabled={bulkDisabled}
            loading={bulkLoading}
            onClick={onBulkApprove}
          />
        </div>
      </div>
      {showBlockHint ? (
        <BulkApproveBlockHint message={bulkBlockMessage} variant="info" className="max-w-none" />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categoryItems.map((item) => (
          <ChecklistItemCard
            key={item.id}
            item={item}
            status={toProductReviewStatus(item.status)}
            itemObservations={filterObservationsForChecklistItem(subjectObservations, item.id)}
            onUpdate={onUpdate}
            onOpenObservations={onOpenObservations}
            selectorDisabled={selectorDisabled}
          />
        ))}
      </div>
    </div>
  );
}

interface TopicCardProps {
  topic: { id: string; name: string; order: number };
  items: ChecklistItem[];
  subjectObservations: OperationalObservation[];
  onUpdate: (topicName: string, item: ChecklistItem, status: ProductReviewStatus) => void | Promise<void>;
  onOpenObservations: (item: ChecklistItem) => void;
  canBulkApprove: boolean;
  approvableCount: number;
  bulkBlockMessage: string | null;
  bulkLoading: boolean;
  onBulkApprove: () => void;
  selectorDisabled?: boolean;
}

function TopicCard({
  topic,
  items,
  subjectObservations,
  onUpdate,
  onOpenObservations,
  canBulkApprove,
  approvableCount,
  bulkBlockMessage,
  bulkLoading,
  onBulkApprove,
  selectorDisabled = false,
}: TopicCardProps) {
  const [expanded, setExpanded] = useState(() => items.length > 0);
  const approved = items.filter((i) => i.status === 'APROBADO').length;
  const total = items.length;
  const bulkDisabled = !canBulkApprove || approvableCount === 0;
  const showBlockHint = bulkDisabled && bulkBlockMessage !== null;

  useEffect(() => {
    if (items.length > 0) setExpanded(true);
  }, [items.length]);

  return (
    <div className="overflow-visible rounded-2xl border border-slate-100 bg-white transition-all duration-200 hover:shadow-md">
      <div className="flex w-full items-center justify-between gap-2 p-4">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-black text-white shadow-sm">
            {topic.order}
          </span>
          <div className="min-w-0 text-left">
            <h4 className="truncate text-sm font-bold text-slate-900">{topic.name}</h4>
            <p className="text-[10px] font-medium text-slate-500">
              {approved}/{total} aprobados
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <BulkApproveActionButton
            label="Aprobar tema"
            disabled={bulkDisabled}
            loading={bulkLoading}
            onClick={onBulkApprove}
          />
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn('px-1 text-xs font-medium text-slate-400 transition-transform', expanded ? 'rotate-180' : '')}
            aria-label={expanded ? 'Contraer tema' : 'Expandir tema'}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {showBlockHint ? (
        <BulkApproveBlockHint
          message={bulkBlockMessage}
          variant="info"
          className="max-w-none border-t border-slate-100 bg-slate-50/80 px-4 py-2.5"
        />
      ) : null}

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <p className="mb-3 text-[10px] font-medium text-slate-500">
            Valida material descargable, podcast, video e infografía de este gránulo.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const status = toProductReviewStatus(item.status);
              const itemObservations = filterObservationsForChecklistItem(subjectObservations, item.id);
              const observationState = getObservationBadgeState(itemObservations);
              return (
                <div
                  key={item.id}
                  className="overflow-visible rounded-xl border border-slate-100 bg-white p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="block text-[11px] font-bold text-slate-800">{item.label}</span>
                    <ObservationDeliverableButton
                      count={itemObservations.length}
                      state={observationState}
                      onClick={() => onOpenObservations(item)}
                    />
                  </div>
                  <div className="mt-2 flex justify-end border-t border-slate-50 pt-2">
                    <StatusSelector
                      value={status}
                      disabled={selectorDisabled}
                      onChange={(newStatus) => void onUpdate(topic.name, item, newStatus)}
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    projectObservations,
    updateChecklistItem,
    bulkApproveChecklistSection,
    updateFactoryTopicChecklistItem,
    addObservation,
    resolveObservation,
    refreshProjects,
    createObservationFromApi,
    approveSubjectFromApi,
    requestSubjectCorrectionFromApi,
    reopenObservation,
    sendObservationsBatchToFactoryFromApi,
    validateObservationFromApi,
    markObservationCorrectionAppliedFromApi,
    backendEnabled,
    isMutating,
  } = useOperations();
  const { role } = useAuth();
  const { showToast } = useToast();
  const workspaceQuery = useSubjectWorkspaceQuery(subjectId, backendEnabled);
  const operationalQuery = useOperationalWorkspaceQuery(
    subjectId,
    backendEnabled && (role === 'PRODUCT' || role === 'ADMIN'),
  );
  const opWorkspace = operationalQuery.data;
  const academicChecklistEnabledEarly = opWorkspace?.academicChecklistEnabled === true;

  useEffect(() => {
    if (searchParams.get('review') !== 'started') return;
    if (!opWorkspace?.institutionalFlowActive || !opWorkspace.semesterId) return;
    if (academicChecklistEnabledEarly) return;
    navigate(semesterOperationsPath(opWorkspace.projectId, opWorkspace.semesterId), { replace: true });
  }, [
    searchParams,
    opWorkspace?.institutionalFlowActive,
    opWorkspace?.semesterId,
    opWorkspace?.projectId,
    academicChecklistEnabledEarly,
    navigate,
  ]);

  const workspaceProject = useMemo(
    () => (workspaceQuery.data ? mapSubjectWorkspaceProjectFromApi(workspaceQuery.data) : undefined),
    [workspaceQuery.data],
  );
  const project = workspaceProject;
  const subject = useMemo(
    () => project?.subjects.find((item) => item.id === subjectId),
    [project, subjectId],
  );
  const workspaceObservations = useMemo(
    () => (workspaceQuery.data ? mapObservationsFromApi(workspaceQuery.data.observations) : []),
    [workspaceQuery.data],
  );
  const isWorkspacePlaceholder = workspaceQuery.isPlaceholderData;
  const isLoading = workspaceQuery.isInitialLoadingWithoutData;
  const error = workspaceQuery.error ? getApiErrorMessage(workspaceQuery.error) : null;
  const notFound = Boolean(!isLoading && !error && subjectId && workspaceQuery.data && !subject);

  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [observationForm, setObservationForm] = useState({ text: '', level: 'subject' as 'subject' | 'topic', topicId: '' });
  // Topic checklist is persisted in OperationsContext via subject.topicChecklists.
  const [savingObservation, setSavingObservation] = useState(false);
  const [subjectAction, setSubjectAction] = useState<'approve' | 'reject' | null>(null);
  const [observationError, setObservationError] = useState('');
  const [checklistFilter, setChecklistFilter] = useState<FilterStatus>('todos');
  const [requestCorrectionMode, setRequestCorrectionMode] = useState(false);
  const [correctionTargetObservationId, setCorrectionTargetObservationId] = useState<string | null>(null);
  const [correctionPanelHighlighted, setCorrectionPanelHighlighted] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<{
    sectionKey: string;
    scope: BulkApproveSectionScope;
    category?: string;
    topicId?: string;
    title: string;
    isTopic: boolean;
  } | null>(null);
  const [bulkLoadingKey, setBulkLoadingKey] = useState<string | null>(null);
  const [savingTopics, setSavingTopics] = useState(false);
  const [observationDrawerItem, setObservationDrawerItem] = useState<ChecklistItem | null>(null);
  const [observationDrawerFromReject, setObservationDrawerFromReject] = useState(false);
  const [observationDrawerTopicName, setObservationDrawerTopicName] = useState<string | null>(null);
  const [sendingObservationBatch, setSendingObservationBatch] = useState(false);
  const observationsSectionRef = useRef<HTMLDivElement | null>(null);
  const correctionActiveRef = useRef<HTMLDivElement | null>(null);
  const observationTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useDismissNotificationsOnVisit({
    projectId: project?.id,
    subjectId: subject?.id,
  });

  useEffect(() => {
    if (!correctionPanelHighlighted) return;
    const timeoutId = window.setTimeout(() => setCorrectionPanelHighlighted(false), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [correctionPanelHighlighted]);

  const combinedObservations = useMemo(() => {
    const byId = new Map<string, (typeof projectObservations)[number]>();
    for (const observation of projectObservations) {
      if (observation.subjectId !== subject?.id) continue;
      byId.set(observation.id, observation);
    }
    for (const observation of workspaceObservations) {
      const existing = byId.get(observation.id);
      if (!existing) {
        byId.set(observation.id, observation);
        continue;
      }
      if (
        existing.notificationStatus === 'PENDING' &&
        observation.notificationStatus === 'SENT'
      ) {
        byId.set(observation.id, observation);
      }
    }
    return Array.from(byId.values());
  }, [projectObservations, subject?.id, workspaceObservations]);

  const subjectObservations = useMemo(
    () =>
      combinedObservations.filter(
        (o) =>
          o.subjectId === subject?.id &&
          (o.status === 'ABIERTA' || o.status === 'EN_CORRECCION'),
      ),
    [combinedObservations, subject?.id],
  );

  const activeCorrectionObservations = useMemo(
    () =>
      subjectObservations
        .filter(
          (observation) =>
            observation.role === 'PRODUCT' &&
            (observation.status === 'ABIERTA' || observation.status === 'EN_CORRECCION'),
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt ?? b.createdAt).getTime() -
            new Date(a.updatedAt ?? a.createdAt).getTime(),
        ),
    [subjectObservations],
  );

  const topicsCount = subject?.topicChecklists?.length ?? 0;
  const academicApprovalBlockers = useMemo(
    () =>
      subject
        ? getAcademicApprovalBlockers({
            subject,
            unresolvedObservationCount: subjectObservations.length,
            topicsCount,
          })
        : [],
    [subject, subjectObservations.length, topicsCount],
  );

  if (role === 'PLANEACION' || role === 'LMS') {
    if (!subjectId) return null;
    return <Navigate to={homePathForRole(role)} replace />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <ProjectsLoadNotice isLoading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ProjectsLoadNotice error={error} onRefresh={() => void refreshProjects()} />
      </div>
    );
  }

  if (notFound || !project || !subject) {
    return (
      <DeepLinkNotFound
        title="Asignatura no encontrada"
        description={error ?? 'No pudimos cargar la asignatura de esta URL.'}
        backTo="/projects"
        onRetry={() => void refreshProjects()}
      />
    );
  }

  if (isWorkspacePlaceholder) {
    return (
      <div className="space-y-6">
        <div>
          <ContextBackLink
            fallback="/projects"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#FF6B00]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver
          </ContextBackLink>
          <PageHeader
            eyebrow="Asignatura"
            title={subject.name}
            description={`${project.program} · ${project.school} · Semestre ${subject.semesterNumber}`}
            action={<StatusBadge status={subject.status} />}
          />
        </div>
        <Card className="space-y-4 p-5">
          <div className="h-4 w-40 rounded-full bg-slate-100" />
          <div className="h-20 rounded-2xl bg-slate-50" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="h-24 rounded-2xl bg-slate-50" />
            <div className="h-24 rounded-2xl bg-slate-50" />
            <div className="h-24 rounded-2xl bg-slate-50" />
          </div>
        </Card>
      </div>
    );
  }

  if (role === 'FABRICA') {
    return <FactorySubjectDetail project={project} subject={subject} observations={combinedObservations} />;
  }

  const institutionalGateLoading =
    backendEnabled && (role === 'PRODUCT' || role === 'ADMIN') && operationalQuery.isLoading;
  const usesInstitutionalUi = Boolean(opWorkspace?.institutionalFlowActive);
  const academicChecklistEnabled = academicChecklistEnabledEarly;

  if (institutionalGateLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Asignatura"
          title={subject.name}
          description={`${project.program} · ${project.school} · Semestre ${subject.semesterNumber}`}
          action={<StatusBadge status={subject.status} />}
        />
        <Card className="p-8 text-center text-sm text-slate-500">Verificando estado del flujo institucional...</Card>
      </div>
    );
  }

  if ((role === 'PRODUCT' || role === 'ADMIN') && usesInstitutionalUi && !academicChecklistEnabled) {
    const institutionalShell = (
      <div className="space-y-6">
        <div>
          <ContextBackLink
            fallback="/projects"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#64748B] hover:text-[#FF6B00]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver
          </ContextBackLink>
          <PageHeader
            eyebrow="Asignatura"
            title={subject.name}
            description={`${project.program} · ${project.school} · Semestre ${subject.semesterNumber}`}
            action={<StatusBadge status={subject.status} />}
          />
        </div>
        {opWorkspace!.operationalState === 'PENDING_PROJECT_RADICATION' ? (
          <PendingProjectRadicationView workspace={opWorkspace!} />
        ) : opWorkspace!.correctionInFactory ? (
          <AcademicCorrectionInFactoryView workspace={opWorkspace!} />
        ) : opWorkspace!.academicReviewReady ? (
          <AcademicReviewReadyView workspace={opWorkspace!} />
        ) : (
          <AcademicInstitutionalWaitingView
            workspace={opWorkspace!}
            subjectName={subject.name}
            program={project.program}
            school={project.school}
          />
        )}
      </div>
    );
    return institutionalShell;
  }

  const institutionalAcademicBlocked =
    usesInstitutionalUi && !academicChecklistEnabled
      ? 'La revisión académica se habilita cuando inicie la revisión desde el centro operacional.'
      : null;

  const canBulkApprove =
    (role === 'PRODUCT' || role === 'ADMIN') &&
    academicChecklistEnabled &&
    isSubjectReviewableForBulkApprove(subject.status);

  const subjectReviewBlockMessage =
    institutionalAcademicBlocked ?? getSubjectNotReviewableMessage(subject.status);

  const subjectIsApproved = isSubjectApproved(subject.status);
  const canRequestCorrection =
    academicChecklistEnabled && canProductRequestSubjectCorrection(subject.status);

  const productChecklist = subject.checklist.filter((item) => item.ownerRole === 'PRODUCT');
  const totalChecklist = productChecklist.length;
  const approvedChecklist = productChecklist.filter((c) => c.status === 'APROBADO').length;
  const pendingChecklist = productChecklist.filter((c) => toProductReviewStatus(c.status) === 'pendiente').length;
  const rejectedChecklist = productChecklist.filter((c) => c.status === 'RECHAZADO').length;
  const subjectProgress = subject.progress ?? 0;

  const resolvedObservations = combinedObservations.filter(
    (o) => o.subjectId === subject.id && o.status === 'RESUELTA'
  );

  const targetedCorrectionObservation = correctionTargetObservationId
    ? activeCorrectionObservations.find((observation) => observation.id === correctionTargetObservationId) ?? null
    : null;

  const topics = subject.topicChecklists.map((topic, index) => ({
    id: topic.id ?? `${subject.id}-topic-${index}`,
    name: topic.topicName,
    order: topic.topicOrder,
  }));

  const canApproveSubject =
    academicChecklistEnabled &&
    canProductApproveSubject(subject.status) &&
    isReadyForAcademicApproval({
      subject,
      unresolvedObservationCount: subjectObservations.length,
      topicsCount: topics.length,
    });

  const needsTopicDefinition = academicChecklistEnabled && topics.length === 0;

  const pendingObservationSendCount = countPendingProductObservations(combinedObservations, subject.id);

  const drawerObservations = observationDrawerItem
    ? filterObservationsForChecklistItem(combinedObservations, observationDrawerItem.id)
    : [];

  const openDeliverableObservations = (
    item: ChecklistItem,
    options?: { fromReject?: boolean; topicName?: string },
  ) => {
    setObservationDrawerItem(item);
    setObservationDrawerFromReject(Boolean(options?.fromReject));
    setObservationDrawerTopicName(options?.topicName ?? null);
  };

  const closeDeliverableObservations = () => {
    setObservationDrawerItem(null);
    setObservationDrawerFromReject(false);
    setObservationDrawerTopicName(null);
  };

  const observationDrawerLabel = observationDrawerItem
    ? observationDrawerTopicName
      ? `${observationDrawerTopicName} · ${observationDrawerItem.label}`
      : observationDrawerItem.label
    : 'Entregable';

  const observationDraftSuggestion =
    observationDrawerFromReject && observationDrawerItem
      ? `Revisar «${observationDrawerItem.label}»${observationDrawerTopicName ? ` (${observationDrawerTopicName})` : ''}: fue marcado como rechazado. `
      : null;

  const handleCreateDeliverableObservation = async (text: string) => {
    if (!observationDrawerItem || !project) return;
    setSavingObservation(true);
    try {
      await createObservationFromApi({
        projectId: project.id,
        subjectId: subject.id,
        checklistItemId: observationDrawerItem.id,
        relatedEntityType: 'CHECKLIST_ITEM',
        relatedEntityId: observationDrawerItem.id,
        text,
        priority: 'MEDIUM',
      });
      showToast('Observación guardada (pendiente de envío)');
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setSavingObservation(false);
    }
  };

  const handleSendObservationsBatch = async () => {
    if (!project) return;
    setSendingObservationBatch(true);
    try {
      const count = await sendObservationsBatchToFactoryFromApi(subject.id, project.id);
      showToast(`${count} observación(es) enviadas a Fábrica`);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setSendingObservationBatch(false);
    }
  };

  const handleDefineTopics = async (topicNames: string[]) => {
    if (!subject?.id) return;
    setSavingTopics(true);
    try {
      await subjectsApi.defineTopics(subject.id, topicNames);
      await workspaceQuery.refetch();
      await refreshProjects();
      showToast('Gránulos académicos guardados');
    } catch (defineError) {
      showToast(getApiErrorMessage(defineError), 'error');
    } finally {
      setSavingTopics(false);
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all';

  const handleChecklistUpdate = async (item: ChecklistItem, newStatus: ProductReviewStatus) => {
    const mappedStatus = mapProductReviewToChecklistStatus(newStatus, {
      ownerRole: item.ownerRole,
      isTopicItem: false,
    });

    try {
      await updateChecklistItem(project.id, subject.id, item.id, mappedStatus);
      showToast(`Revisión actualizada: ${reviewStatusLabels[newStatus]}`);
      if (newStatus === 'rechazado') {
        openDeliverableObservations(item, { fromReject: true });
      }
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    }
  };

  const openBulkConfirm = (config: {
    sectionKey: string;
    scope: BulkApproveSectionScope;
    category?: string;
    topicId?: string;
    title: string;
    isTopic: boolean;
  }) => {
    if (bulkLoadingKey) return;
    setBulkConfirm(config);
  };

  const handleConfirmBulkApprove = async () => {
    if (!bulkConfirm || bulkLoadingKey) return;
    setBulkLoadingKey(bulkConfirm.sectionKey);
    try {
      const count = await bulkApproveChecklistSection(project.id, {
        subjectId: subject.id,
        scope: bulkConfirm.scope,
        category: bulkConfirm.category,
        topicId: bulkConfirm.topicId,
      });
      showToast(
        count > 0 ? 'Se aprobó la sección correctamente.' : 'Esta sección ya estaba aprobada.',
      );
      setBulkConfirm(null);
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setBulkLoadingKey(null);
    }
  };

  const handleTopicChecklistUpdate = async (
    topicName: string,
    item: ChecklistItem,
    status: ProductReviewStatus,
  ) => {
    const mappedStatus = mapProductReviewToChecklistStatus(status, {
      ownerRole: item.ownerRole ?? 'FABRICA',
      isTopicItem: true,
    });

    try {
      await updateFactoryTopicChecklistItem(project.id, subject.id, topicName, item.id, mappedStatus);
      showToast(`Revisión de tema actualizada: ${reviewStatusLabels[status]}`);
      if (status === 'rechazado') {
        openDeliverableObservations(item, { fromReject: true, topicName });
      }
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    }
  };

  const handleAddObservation = async () => {
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

    setSavingObservation(true);
    try {
      if (backendEnabled) {
        await createObservationFromApi({
          projectId: project.id,
          subjectId: subject.id,
          topicId: observationForm.level === 'topic' ? observationForm.topicId : undefined,
          relatedEntityType: observationForm.level === 'topic' ? 'TOPIC' : 'SUBJECT',
          relatedEntityId: observationForm.level === 'topic' ? observationForm.topicId : subject.id,
          text: observationForm.text,
          priority: 'MEDIUM',
        });
      } else {
        await addObservation(project.id, {
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
      }
      setObservationForm({ text: '', level: 'subject', topicId: '' });
      setShowObservationForm(false);
      setObservationError('');
      showToast('Observación guardada (pendiente de envío)');
    } catch (error) {
      setObservationError(getApiErrorMessage(error));
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setSavingObservation(false);
    }
  };

  const handleResolveObservation = async (obsId: string, obs: typeof projectObservations[number]) => {
    try {
      await resolveObservation(project.id, obsId, obs);
      showToast('Observación validada como resuelta');
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    }
  };

  const handleApproveSubject = async () => {
    if (!canApproveSubject || subjectAction !== null || isMutating) return;
    setSubjectAction('approve');
    try {
      await approveSubjectFromApi(subject.id, project.id);
      showToast('Asignatura aprobada');
    } catch (error) {
      showToast(getApiErrorMessage(error), 'error');
    } finally {
      setSubjectAction(null);
    }
  };

  const scrollToObservations = () => {
    observationsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRequestCorrection = () => {
    setRequestCorrectionMode(true);
    setCorrectionTargetObservationId(null);
    setShowObservationForm(true);
    setCorrectionPanelHighlighted(true);
    setObservationError('');
    setObservationForm({ text: '', level: 'subject', topicId: '' });
    requestAnimationFrame(() => {
      scrollToObservations();
      setTimeout(() => observationTextareaRef.current?.focus(), 180);
    });
  };

  const handleCreateCorrectionAndReject = async () => {
    const reason = observationForm.text.trim();
    if (reason.length < 5) {
      setObservationError('Para rechazar debes escribir una observación para Fábrica.');
      showToast('Para rechazar debes escribir una observación para Fábrica.', 'error');
      observationTextareaRef.current?.focus();
      return;
    }

    setSavingObservation(true);
    setSubjectAction('reject');
    try {
      if (targetedCorrectionObservation) {
        await reopenObservation(project.id, targetedCorrectionObservation.id, targetedCorrectionObservation, reason);
      } else {
        await requestSubjectCorrectionFromApi(subject.id, project.id, reason);
      }
      setObservationForm({ text: '', level: 'subject', topicId: '' });
      setShowObservationForm(false);
      setRequestCorrectionMode(false);
      setCorrectionTargetObservationId(null);
      setObservationError('');
      showToast(targetedCorrectionObservation ? 'Corrección reabierta para Fábrica' : 'Corrección solicitada a Fábrica');
    } catch (error) {
      const message = getApiErrorMessage(error);
      setObservationError(message);
      showToast(message, 'error');
    } finally {
      setSavingObservation(false);
      setSubjectAction(null);
    }
  };

  const filteredChecklist = productChecklist.filter((item) => {
    if (checklistFilter === 'todos') return true;
    const productStatus = toProductReviewStatus(item.status);
    return productStatus === checklistFilter;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        prominentEyebrow
        eyebrow={`${project.program} · Semestre ${subject.semesterNumber}`}
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            {subject.name}
            {subject.createdFromChange && <ChangeOriginBadge kind="subject" />}
          </span>
        }
        description={
          subject.createdFromChange
            ? 'Materia agregada posteriormente por Product. Responsable Fábrica: ' + project.factoryOwner
            : `Responsable Fábrica: ${project.factoryOwner}`
        }
        action={
          <ContextBackLink
            fallback={`/projects/${project.id}/semesters/${subject.semesterNumber}`}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-orange-300 hover:text-orange-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al semestre
          </ContextBackLink>
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
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
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
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entrega</p>
            <p className="mt-2 text-sm font-bold text-slate-800">{subject.expectedDeliveryDate ? formatDate(subject.expectedDeliveryDate) : 'No definida'}</p>
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Cierre Product</p>
            <h2 className="text-sm font-black tracking-tight text-slate-950">Aprobación de asignatura</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">Aprueba la asignatura si cumple con los criterios o solicita una corrección con una observación clara para Fábrica.</p>
            {!subjectIsApproved && academicApprovalBlockers.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-900">
                {academicApprovalBlockers.map((blocker) => (
                  <li key={blocker}>• {blocker}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:min-w-80">
            {subjectIsApproved ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 shadow-sm">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-black text-emerald-900">Asignatura aprobada</p>
                  <p className="text-[11px] font-medium text-emerald-700">El cierre quedó registrado. Fábrica fue notificada.</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleApproveSubject}
                  disabled={!canApproveSubject || isMutating || subjectAction !== null || !subject.id}
                >
                  {subjectAction === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {subjectAction === 'approve' ? 'Aprobando…' : 'Aprobar asignatura'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 border-rose-200/90 bg-rose-50/90 text-rose-700 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-100 hover:shadow-[0_10px_20px_-12px_rgba(244,63,94,0.6)]"
                  onClick={handleRequestCorrection}
                  disabled={!canRequestCorrection || isMutating || subjectAction !== null || !subject.id}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Solicitar corrección
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {academicChecklistEnabled && pendingObservationSendCount > 0 && (
        <div className="sticky bottom-4 z-20 rounded-2xl border border-orange-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-slate-950">Observaciones pendientes de envío</p>
              <p className="text-xs text-slate-500">
                {pendingObservationSendCount} observación(es) en borrador. Fábrica las verá al enviar el lote.
              </p>
            </div>
            <Button
              disabled={sendingObservationBatch || isMutating}
              onClick={() => void handleSendObservationsBatch()}
            >
              {sendingObservationBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
              Enviar observaciones a Fábrica
            </Button>
          </div>
        </div>
      )}

      {needsTopicDefinition && (
        <AcademicTopicsDefinitionPanel
          inputClass={inputClass}
          saving={savingTopics}
          onSave={handleDefineTopics}
        />
      )}

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

        {subjectReviewBlockMessage ? <SubjectReviewBlockBanner message={subjectReviewBlockMessage} /> : null}

        <div className="p-5">
          {filteredChecklist.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Sin entregables" description="No hay entregables que coincidan con el filtro seleccionado." cardVariant="subjectPanel" />
          ) : (
            <div className="space-y-6">
              {CHECKLIST_CATEGORIES.map((category) => {
                const sectionItems = filteredChecklist.filter(
                  (item) => getCategoryForItem(item.label) === category.id,
                );
                const sectionKey = `category-${category.id}`;
                return (
                  <CategorySection
                    key={category.id}
                    categoryId={category.id}
                    title={category.title}
                    checklist={filteredChecklist}
                    onUpdate={handleChecklistUpdate}
                    onOpenObservations={(item) => openDeliverableObservations(item)}
                    subjectObservations={combinedObservations.filter((obs) => obs.subjectId === subject.id)}
                    canBulkApprove={canBulkApprove}
                    approvableCount={countApprovableProductItems(sectionItems)}
                    bulkBlockMessage={getProductSectionBulkBlockMessage(sectionItems, canBulkApprove)}
                    bulkLoading={Boolean(bulkLoadingKey)}
                    selectorDisabled={isMutating || Boolean(bulkLoadingKey)}
                    onBulkApprove={() =>
                      openBulkConfirm({
                        sectionKey,
                        scope: 'CATEGORY',
                        category: category.id,
                        title: category.title,
                        isTopic: false,
                      })
                    }
                  />
                );
              })}
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
                <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                  Cada gránulo debe contar con material descargable, podcast, video e infografía.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-bold text-orange-700 ring-1 ring-orange-200/80">
                {getSubjectTopicsCounterLabel(topics.length)}
              </span>
            </div>
          </div>

          {subjectReviewBlockMessage ? (
            <SubjectReviewBlockBanner message={subjectReviewBlockMessage} />
          ) : null}

          <div className="p-5">
            <div className="space-y-3">
              {subject.topicChecklists.map((tc) => {
                const sectionKey = `topic-${tc.id ?? tc.topicName}`;
                return (
                  <TopicCard
                    key={`${subject.id}-${tc.topicOrder}-${tc.topicName}`}
                    topic={{ id: tc.id ?? sectionKey, name: tc.topicName, order: tc.topicOrder }}
                    items={tc.items}
                    subjectObservations={combinedObservations.filter((obs) => obs.subjectId === subject.id)}
                    onUpdate={handleTopicChecklistUpdate}
                    onOpenObservations={(item) =>
                      openDeliverableObservations(item, { topicName: tc.topicName })
                    }
                    canBulkApprove={canBulkApprove && Boolean(tc.id)}
                    approvableCount={countApprovableTopicItems(tc.items)}
                    bulkBlockMessage={getTopicBulkBlockMessage(tc.items, canBulkApprove, Boolean(tc.id))}
                    bulkLoading={Boolean(bulkLoadingKey)}
                    selectorDisabled={isMutating || Boolean(bulkLoadingKey)}
                    onBulkApprove={() => {
                      if (!tc.id) return;
                      openBulkConfirm({
                        sectionKey,
                        scope: 'TOPIC',
                        topicId: tc.id,
                        title: tc.topicName,
                        isTopic: true,
                      });
                    }}
                  />
                );
              })}
            </div>
          </div>
        </Card>
      )}

      <div ref={observationsSectionRef}>
      <Card variant="subjectPanel" className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-orange-100/90 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Seguimiento</p>
            <h2 className="text-sm font-black tracking-tight text-slate-950">Observaciones</h2>
          </div>
          <Button variant="primary" size="sm" onClick={() => { setShowObservationForm(true); setObservationError(''); setRequestCorrectionMode(false); setCorrectionTargetObservationId(null); }} className="shadow-lg shadow-orange-500/25">
            <Plus className="h-3.5 w-3.5" /> Nueva
          </Button>
        </div>

        {showObservationForm && (
              <div id="observation-form" className={cn('mt-5 rounded-[18px] border p-4 transition-all duration-500 ease-out', requestCorrectionMode ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100', correctionPanelHighlighted ? 'border-orange-300 bg-orange-50/60 shadow-[0_0_0_6px_rgba(251,146,60,0.10),0_18px_40px_-22px_rgba(249,115,22,0.35)]' : 'border-orange-200 bg-orange-50/30 shadow-sm')}>
            {requestCorrectionMode && (
              <div className="mb-4 rounded-[18px] border border-orange-200/80 bg-gradient-to-br from-white to-orange-50/70 px-4 py-4 shadow-[0_10px_30px_-18px_rgba(249,115,22,0.35)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-black leading-tight text-slate-950">{targetedCorrectionObservation ? 'Solicitar nuevo ajuste sobre esta corrección' : 'Solicitar corrección a Fábrica'}</p>
                    <p className="text-xs font-medium leading-relaxed text-slate-600">
                      {targetedCorrectionObservation
                        ? 'Esta acción reabre solo la observación seleccionada. Las demás correcciones permanecen intactas.'
                        : 'Describe claramente qué debe corregirse antes de aprobar la asignatura. Esta observación iniciará un nuevo ciclo de revisión.'}
                    </p>
                    <div className="space-y-1 text-[11px] font-medium leading-relaxed text-slate-600">
                      <p>✓ La observación será visible para Fábrica</p>
                      <p>✓ La asignatura quedará en revisión</p>
                      <p>✓ Solo se afectará esta observación</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900">{requestCorrectionMode ? (targetedCorrectionObservation ? 'Reabrir corrección individual' : 'Crear observación de corrección') : 'Enviar observación a Fábrica'}</p>
                <p className="text-[10px] font-medium text-slate-500">Selecciona el nivel y describe qué debe corregir Fábrica.</p>
              </div>
              <button type="button" onClick={() => { setShowObservationForm(false); setObservationError(''); setRequestCorrectionMode(false); setCorrectionTargetObservationId(null); }} className="shrink-0 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {!requestCorrectionMode && <div>
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
              </div>}

              {observationError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                  <p className="min-w-0 flex-1 text-xs font-medium leading-relaxed text-rose-700">{observationError}</p>
                </div>
              )}

              <textarea
                ref={observationTextareaRef}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none resize-none"
                rows={3}
                placeholder="Describe qué debe corregir o completar Fábrica..."
                value={observationForm.text}
                onChange={(e) => setObservationForm((f) => ({ ...f, text: e.target.value }))}
              />

              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => { setShowObservationForm(false); setObservationError(''); setRequestCorrectionMode(false); setCorrectionTargetObservationId(null); }}>Cancelar</Button>
                <Button size="sm" onClick={requestCorrectionMode ? handleCreateCorrectionAndReject : handleAddObservation} disabled={!observationForm.text.trim() || savingObservation || subjectAction === 'reject'}>
                  {savingObservation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
                  {requestCorrectionMode ? (targetedCorrectionObservation ? 'Reabrir corrección y solicitar ajuste' : 'Crear observación y rechazar asignatura') : 'Enviar observación'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {activeCorrectionObservations.length > 0 && (
            <div className="space-y-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Correcciones activas · {activeCorrectionObservations.length}</p>
              </div>
              {activeCorrectionObservations.map((observation, index) => (
                <div
                  key={observation.id}
                  ref={index === 0 ? correctionActiveRef : undefined}
                  className={cn('rounded-[22px] border p-5 shadow-sm transition-all duration-500', observation.status === 'EN_CORRECCION' ? 'border-sky-200 bg-sky-50/40' : 'border-amber-200 bg-amber-50/40')}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Corrección individual</p>
                      <h3 className="mt-1 text-sm font-bold text-slate-950">
                        {observation.status === 'EN_CORRECCION'
                          ? 'Corrección enviada por Fábrica'
                          : 'Corrección pendiente de Fábrica'}
                      </h3>
                      <p className="mt-3 text-base font-bold leading-relaxed text-slate-900">{observation.text}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <MetaBox label="Estado" value={observation.status === 'EN_CORRECCION' ? 'Corrección enviada' : 'Fábrica debe corregir'} />
                        <MetaBox label="Fecha" value={formatDate(observation.createdAt)} />
                        <MetaBox label="Responsable" value="Fábrica" />
                        <MetaBox label="Última actualización" value={formatDate(observation.updatedAt ?? observation.createdAt)} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-medium text-slate-500">
                        <span>{observation.author} · {observation.role}</span>
                        <span className="font-bold text-slate-700">
                          {observation.status === 'EN_CORRECCION'
                            ? 'Pendiente de validación individual por Product'
                            : 'Fábrica debe corregir esta observación'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {observation.status === 'EN_CORRECCION' && (
                        <>
                          <Button size="sm" onClick={() => handleResolveObservation(observation.id, observation)} disabled={isMutating} className="shadow-[0_12px_24px_-18px_rgba(249,115,22,0.5)]">
                            <Check className="h-3.5 w-3.5" /> Validar corrección
                          </Button>
                          <Button size="sm" variant="secondary" className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" onClick={() => {
                            setRequestCorrectionMode(true);
                            setCorrectionTargetObservationId(observation.id);
                            setShowObservationForm(true);
                            setObservationError('');
                            setObservationForm({ text: '', level: 'subject', topicId: '' });
                            requestAnimationFrame(() => {
                              scrollToObservations();
                              setTimeout(() => observationTextareaRef.current?.focus(), 180);
                            });
                          }}>
                            <AlertCircle className="h-3.5 w-3.5" /> Solicitar nuevo ajuste
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {subjectObservations.length === 0 && resolvedObservations.length === 0 && (
            <EmptyState icon={MessageSquare} title="Sin observaciones" description="Aún no se han registrado observaciones para esta asignatura." cardVariant="subjectPanel" />
          )}

          {subjectObservations.filter((obs) => !activeCorrectionObservations.some((active) => active.id === obs.id)).length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Observaciones abiertas · {subjectObservations.filter((obs) => !activeCorrectionObservations.some((active) => active.id === obs.id)).length}</p>
              </div>
              <div className="space-y-2">
                {subjectObservations.filter((obs) => !activeCorrectionObservations.some((active) => active.id === obs.id)).map((obs) => {
                  const isTopicObs = topics.some((t) => obs.relatedEntity === t.name);
                  const canValidate = obs.status === 'EN_CORRECCION';
                  return (
                    <div key={obs.id} className={cn('rounded-xl border p-4', canValidate ? 'border-emerald-100/60 bg-emerald-50/20' : 'border-amber-100/60 bg-amber-50/30')}>
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
                            <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold ring-1', canValidate ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/80' : 'bg-amber-50 text-amber-700 ring-amber-200/80')}>
                              {canValidate ? 'En corrección' : 'Abierta'}
                            </span>
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
                          disabled={!canValidate || isMutating}
                          className={cn(
                            'shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-bold transition-all',
                            canValidate
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400',
                          )}
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

      <DeliverableObservationsDrawer
        isOpen={Boolean(observationDrawerItem)}
        onClose={closeDeliverableObservations}
        deliverableLabel={observationDrawerLabel}
        observations={drawerObservations}
        badgeState={getObservationBadgeState(drawerObservations)}
        role={role ?? 'PRODUCT'}
        saving={savingObservation || isMutating}
        draftSuggestion={observationDraftSuggestion}
        openedFromReject={observationDrawerFromReject}
        onCreateObservation={handleCreateDeliverableObservation}
        onValidateObservation={async (observation) => {
          await validateObservationFromApi(observation.id, project?.id);
          showToast('Observación validada');
        }}
      />

      <Modal
        isOpen={Boolean(bulkConfirm)}
        onClose={() => setBulkConfirm(null)}
        title={
          bulkConfirm?.isTopic
            ? '¿Aprobar todos los entregables de este tema?'
            : '¿Aprobar todos los ítems pendientes de esta sección?'
        }
        description="Esta acción marcará como aprobados los ítems revisables de esta sección. Las observaciones abiertas no se cerrarán automáticamente."
        size="sm"
      >
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setBulkConfirm(null)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => void handleConfirmBulkApprove()}
            disabled={Boolean(bulkLoadingKey)}
          >
            {bulkLoadingKey ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            {bulkConfirm?.isTopic ? 'Aprobar tema' : 'Aprobar sección'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
