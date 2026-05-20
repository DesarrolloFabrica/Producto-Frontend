import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, FileText, BookOpen, MessageSquare, Bell, ListChecks, Clock3, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useOperations } from '../operations/OperationsContext';
import { StatusBadge } from '../../components/status/StatusBadge';
import { formatDate } from '../../utils/formatters';
import { CommentThread } from '../../components/comments/CommentThread';
import { cn } from '../../components/ui/tokens';
import type { VirtualizationProject, SubjectVirtualization, LinkResource, OperationalObservation, Notification, ChecklistItem } from '../../types/domain';
import { OperationalHealth } from '../../components/operational/OperationalHealth';
import { getSubjectOperationalPackage } from '../operations/operationalInsights';
import { getChecklistItemInsight, getNotificationOperationalState, getNotificationRequiredAction, getSubjectBlockers, getSubjectNextAction } from '../operations/operationalRules';
import { drawerTransition, fadeUp } from '../../components/motion/presets';

type ContextEntityType = 'project' | 'subject' | 'link' | 'observation' | 'notification' | 'checklist';

interface ContextPanelPayload {
  type: ContextEntityType;
  id: string;
  data?: Record<string, unknown>;
}

interface ContextPanelState {
  isOpen: boolean;
  payload: ContextPanelPayload | null;
}

interface ContextPanelContextValue extends ContextPanelState {
  openContextPanel: (type: ContextEntityType, id: string, data?: Record<string, unknown>) => void;
  closeContextPanel: () => void;
}

const ContextPanelContext = createContext<ContextPanelContextValue | null>(null);

export function ContextPanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContextPanelState>({ isOpen: false, payload: null });

  const openContextPanel = useCallback((type: ContextEntityType, id: string, data?: Record<string, unknown>) => {
    setState({ isOpen: true, payload: { type, id, data } });
  }, []);

  const closeContextPanel = useCallback(() => {
    setState({ isOpen: false, payload: null });
  }, []);

  return (
    <ContextPanelContext.Provider value={{ ...state, openContextPanel, closeContextPanel }}>
      {children}
    </ContextPanelContext.Provider>
  );
}

export function useContextPanel() {
  const context = useContext(ContextPanelContext);
  if (!context) throw new Error('useContextPanel must be used within ContextPanelProvider');
  return context;
}

export function ContextPanelDrawer() {
  const { isOpen, payload, closeContextPanel } = useContextPanel();
  const { projects, projectObservations, comments } = useOperations();
  const navigate = useNavigate();

  if (!isOpen || !payload) return null;

  let content: ReactNode = null;

  if (payload.type === 'project') {
    const project = projects.find((p) => p.id === payload.id);
    if (project) {
      const projectObservationsList = projectObservations.filter((o) => o.projectId === project.id);
      content = (
        <ProjectContext project={project} observations={projectObservationsList} onNavigate={() => { closeContextPanel(); navigate(`/projects/${project.id}`); }} />
      );
    }
  } else if (payload.type === 'subject') {
    const subjectData = payload.data as { project?: VirtualizationProject; subject?: SubjectVirtualization } | undefined;
    if (subjectData?.subject && subjectData?.project) {
      const subjectComments = comments.filter((c) => c.entityType === 'subject' && c.entityId === subjectData.subject!.id);
      content = (
        <SubjectContext project={subjectData.project} subject={subjectData.subject} observations={projectObservations} comments={subjectComments} onNavigate={() => { closeContextPanel(); navigate(`/subjects/${subjectData.subject!.id}`); }} />
      );
    }
  } else if (payload.type === 'link') {
    const linkData = payload.data as { link?: LinkResource; project?: VirtualizationProject } | undefined;
    if (linkData?.link) {
      content = <LinkContext link={linkData.link} project={linkData.project} />;
    }
  } else if (payload.type === 'observation') {
    const obsData = payload.data as { observation?: OperationalObservation } | undefined;
    if (obsData?.observation) {
        content = <ObservationContext observation={obsData.observation} />;
    }
  } else if (payload.type === 'notification') {
    const notifData = payload.data as { notification?: Notification } | undefined;
    if (notifData?.notification) {
        content = <NotificationContext notification={notifData.notification} projects={projects} onNavigate={() => { if (notifData.notification?.projectId) { closeContextPanel(); navigate(`/projects/${notifData.notification.projectId}`); } }} />;
    }
  } else if (payload.type === 'checklist') {
    const clData = payload.data as { item?: ChecklistItem; project?: VirtualizationProject; subject?: SubjectVirtualization } | undefined;
    if (clData?.item) {
        content = <ChecklistContext item={clData.item} project={clData.project} subject={clData.subject} />;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/15 backdrop-blur-sm" onClick={closeContextPanel} />
      <motion.div {...drawerTransition} className="relative w-full max-w-md overflow-y-auto border-l border-slate-200/60 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600">{payload.type}</span>
            <p className="text-xs font-medium text-slate-400">Vista rápida</p>
          </div>
          <button onClick={closeContextPanel} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4">{content}</div>
      </motion.div>
    </div>
  );
}

function ProjectContext({ project, observations, onNavigate }: { project: VirtualizationProject; observations: OperationalObservation[]; onNavigate: () => void }) {
  const openObservations = observations.filter((o) => o.status === 'ABIERTA' || o.status === 'EN_CORRECCION');
  const pendingDeliverables = project.subjects.flatMap((s) => s.checklist).filter((item) => ['NO_EXISTE', 'PENDIENTE'].includes(item.status)).length;

  const getNextAction = (): string => {
    if (openObservations.length > 0) return 'Valida correcciones realizadas por Fabrica.';
    if (project.status === 'IN_PRODUCTION') return 'Esperando entrega de Fabrica.';
    if (project.status === 'IN_REVIEW' || project.status === 'DELIVERED_TO_LMS') return 'Revisa checklist pendientes.';
    if (project.status === 'CLOSED') return 'Solicitud lista para cierre.';
    return 'Solicitud en proceso.';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <div>
          <p className="text-xs font-medium text-slate-500">{project.school}</p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{project.program}</h2>
          <p className="mt-1 text-xs font-medium text-slate-400">{project.requestType} · {project.modality}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={project.status} />
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">{project.priority}</span>
        </div>
      </div>

      {/* Resumen de revision */}
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resumen de revision</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-slate-400">Estado</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{project.status.replace(/_/g, ' ')}</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-slate-400">Observaciones</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{openObservations.length}</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-slate-400">Materias</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{project.subjects.length}</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-slate-400">Pendientes</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{pendingDeliverables}</p>
          </div>
        </div>
      </div>

      {/* Proxima accion */}
      <div className="flex items-start gap-3 rounded-xl bg-orange-50 p-3.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
        <div>
          <p className="text-xs font-semibold text-orange-700">Proxima accion</p>
          <p className="mt-1 text-sm font-medium text-orange-800">{getNextAction()}</p>
        </div>
      </div>

      {/* Observaciones */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Observaciones</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{openObservations.length}</span>
        </div>
        {openObservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-6">
            <CheckCircle className="h-6 w-6 text-emerald-400" />
            <p className="mt-2 text-sm font-medium text-slate-500">Sin observaciones abiertas</p>
          </div>
        ) : (
          openObservations.slice(0, 3).map((obs) => (
            <motion.div key={obs.id} {...fadeUp} className="group rounded-xl border border-slate-100 bg-white p-3.5 transition-all hover:border-orange-100 hover:shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{obs.relatedEntity || 'General'}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', obs.status === 'ABIERTA' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600')}>{obs.status}</span>
              </div>
              <p className="text-sm font-medium text-slate-700">{obs.text.length > 100 ? `${obs.text.substring(0, 100)}...` : obs.text}</p>
              <p className="mt-2 text-xs text-slate-400">{formatDate(obs.createdAt)}</p>
            </motion.div>
          ))
        )}
      </div>

      {/* Datos base */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Informacion</h3>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">Product</p>
              <p className="truncate text-xs font-medium text-slate-700">{project.productOwner}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">Fabrica</p>
              <p className="truncate text-xs font-medium text-slate-700">{project.factoryOwner}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-3.5 w-3.5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">Entrega</p>
              <p className="truncate text-xs font-medium text-slate-700">{formatDate(project.expectedDeliveryDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">Links</p>
              <p className="truncate text-xs font-medium text-slate-700">{project.links.length} disponibles</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">Semestres</p>
              <p className="truncate text-xs font-medium text-slate-700">{project.semesters.map((s) => s.semesterNumber).join(', ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400">Materias</p>
              <p className="truncate text-xs font-medium text-slate-700">{project.subjects.length} registradas</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button onClick={onNavigate} className="sticky bottom-0 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow"><ExternalLink className="h-4 w-4" /> Gestionar solicitud</button>
    </div>
  );
}

function SubjectContext({ project, subject, observations, comments, onNavigate }: { project: VirtualizationProject; subject: SubjectVirtualization; observations: OperationalObservation[]; comments: any[]; onNavigate: () => void }) {
  const blockers = getSubjectBlockers(project, subject, observations, project.links);
  const nextAction = getSubjectNextAction(project, subject, observations, project.links);
  const operational = getSubjectOperationalPackage(project, subject.id, observations);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-medium text-slate-400">{project.program} / Semestre {subject.semesterNumber}</p>
        <h2 className="mt-0.5 text-base font-semibold text-slate-900">{subject.name}</h2>
      </div>
      <StatusBadge status={subject.status} />
      {operational?.health ? <OperationalHealth health={operational.health} compact /> : null}
      <div className="grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <ContextRow icon={User} label="Fabrica" value={project.factoryOwner} />
        <ContextRow icon={ListChecks} label="Checklist" value={`${subject.checklist.length} entregables`} />
        <ContextRow icon={Clock3} label="Entrega proyecto" value={formatDate(project.expectedDeliveryDate)} />
      </div>
      <OperationalBox title="Accion requerida" items={[`Siguiente: ${nextAction.title}`, `Responsable: ${nextAction.responsibleRole}`, `Impacto: ${nextAction.impact}`]} />
      {blockers.length > 0 && <OperationalBox title="Bloqueantes de materia" items={[...blockers.slice(0, 3).map((blocker) => `${blocker.title}: ${blocker.requiredAction}`), ...(blockers.length > 3 ? [`+${blockers.length - 3} bloqueantes adicionales.`] : [])]} tone="warning" />}
      <div>
        <p className="mb-2 text-[10px] font-medium text-slate-400">Temas de contenido</p>
        <div className="space-y-1.5">
          {subject.contentTopics.map((topic, i) => (
            <div key={topic} className="flex gap-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-orange-500 text-[9px] font-bold text-white">{i + 1}</span>
              <p className="text-xs font-medium text-slate-700">{topic}</p>
            </div>
          ))}
        </div>
      </div>
      <Section title="Comentarios" count={comments.length}>
        <CommentThread entityType="subject" entityId={subject.id} comments={comments} />
      </Section>
      <button onClick={onNavigate} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-medium text-white transition-all hover:bg-orange-600"><ExternalLink className="h-3.5 w-3.5" /> Gestionar materia</button>
    </div>
  );
}

function LinkContext({ link, project }: { link: LinkResource; project?: VirtualizationProject }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{link.title}</h2>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{project?.program}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">{link.type}</span>
        <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">Disponible</span>
      </div>
      <div className="grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <ContextRow icon={User} label="Subido por" value={link.uploadedBy} />
        <ContextRow icon={Clock3} label="Fecha" value={formatDate(link.createdAt)} />
      </div>
      <a href={link.url} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-medium text-white transition-all hover:bg-orange-600"><ExternalLink className="h-3.5 w-3.5" /> Abrir enlace</a>
    </div>
  );
}

function ObservationContext({ observation }: { observation: OperationalObservation }) {
  const responsible = observation.role === 'FABRICA' ? 'PRODUCT' : 'FABRICA';
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Observacion</h2>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{observation.relatedEntity}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className={cn('rounded-lg px-2 py-0.5 text-[10px] font-medium', observation.status === 'ABIERTA' ? 'bg-rose-50 text-rose-700' : observation.status === 'EN_CORRECCION' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600')}>{observation.status}</span>
      </div>
      <div className="grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <ContextRow icon={User} label="Autor" value={`${observation.author} (${observation.role})`} />
        <ContextRow icon={Clock3} label="Fecha" value={formatDate(observation.createdAt)} />
      </div>
      <div className="rounded-xl bg-slate-50/80 p-3 text-xs font-medium leading-5 text-slate-700">{observation.text}</div>
      <OperationalBox title="Impacto operacional" items={[`Responsable de resolucion: ${responsible}`, 'Accion requerida: validar, corregir o cerrar la observacion.', 'Impacto: puede bloquear revision o aprobacion hasta quedar resuelta.']} tone="warning" />
    </div>
  );
}

function NotificationContext({ notification, projects, onNavigate }: { notification: Notification; projects: VirtualizationProject[]; onNavigate: () => void }) {
  const state = getNotificationOperationalState(notification, projects);
  const requiredAction = getNotificationRequiredAction(notification, projects);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{notification.title}</h2>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <span className={cn('rounded-lg px-2 py-0.5 text-[10px] font-medium', notification.type === 'CRITICAL' ? 'bg-rose-50 text-rose-700' : notification.type === 'ACTION' ? 'bg-orange-50 text-orange-600' : notification.type === 'DEADLINE' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600')}>{notification.type}</span>
        <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">{notification.read ? 'Leida' : 'Nueva'}</span>
      </div>
      <div className="grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <ContextRow icon={Bell} label="Dirigido a" value={notification.roleTarget} />
        <ContextRow icon={Clock3} label="Fecha" value={formatDate(notification.createdAt)} />
      </div>
      <div className="rounded-xl bg-slate-50/80 p-3 text-xs font-medium leading-5 text-slate-700">{notification.message}</div>
      <OperationalBox title="Accion operacional" items={[`Estado: ${state.replace('_', ' ')}`, `Accion requerida: ${requiredAction.action}`, `Impacto: ${requiredAction.impact}`, `Entidad afectada: ${requiredAction.affectedEntity}`]} />
      {notification.projectId && <button onClick={onNavigate} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-medium text-white transition-all hover:bg-orange-600"><ExternalLink className="h-3.5 w-3.5" /> Ver proyecto</button>}
    </div>
  );
}

function ChecklistContext({ item, project, subject }: { item: ChecklistItem; project?: VirtualizationProject; subject?: SubjectVirtualization }) {
  const insight = project && subject ? getChecklistItemInsight(item, project, subject) : null;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{item.label}</h2>
        {subject && <p className="mt-0.5 text-xs font-medium text-slate-500">{subject.name} / {project?.program}</p>}
      </div>
      <StatusBadge status={item.status} />
      <div className="grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <ContextRow icon={User} label="Responsable" value={item.ownerRole} />
        <ContextRow icon={Clock3} label="Actualizado" value={formatDate(item.updatedAt)} />
      </div>
      {item.observations && <div className="rounded-xl bg-slate-50/80 p-3 text-xs font-medium leading-5 text-slate-700">{item.observations}</div>}
      {insight && <OperationalBox title="Interpretacion" items={[`Accion requerida: ${insight.nextAction}`, `Responsable: ${insight.responsibleRole}`, `Impacto: ${insight.impact}`, insight.dependency ? `Dependencia: ${insight.dependency}` : 'Sin dependencia critica detectada.']} />}
    </div>
  );
}

function OperationalBox({ title, items, tone = 'default' }: { title: string; items: string[]; tone?: 'default' | 'warning' }) {
  return (
    <div className={cn('rounded-xl p-3', tone === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-orange-50/70 text-orange-800')}>
      <p className="text-[10px] font-black uppercase tracking-widest">{title}</p>
      <div className="mt-2 space-y-1.5">
        {items.map((item) => <p key={item} className="text-xs font-semibold leading-5">{item}</p>)}
      </div>
    </div>
  );
}

function ContextRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[10px] font-medium text-slate-400">{label}</p>
        <p className="truncate text-xs font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-900">{title}</h3>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{count}</span>
      </div>
      {children}
    </div>
  );
}

