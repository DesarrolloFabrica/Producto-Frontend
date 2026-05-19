import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, FileText, BookOpen, MessageSquare, Bell, ListChecks, Clock3, User, ArrowRight } from 'lucide-react';
import { useOperations } from '../operations/OperationsContext';
import { StatusBadge } from '../../components/status/StatusBadge';
import { formatDate } from '../../utils/formatters';
import { CommentThread } from '../../components/comments/CommentThread';
import { cn } from '../../components/ui/tokens';
import type { VirtualizationProject, SubjectVirtualization, LinkResource, OperationalObservation, Notification, ChecklistItem } from '../../types/domain';
import { OperationalHealth } from '../../components/operational/OperationalHealth';
import { getProjectOperationalPackage, getSubjectOperationalPackage } from '../operations/operationalInsights';
import { getChecklistItemInsight, getNotificationOperationalState, getNotificationRequiredAction, getProjectBlockers, getProjectNextActions, getSubjectBlockers, getSubjectNextAction } from '../operations/operationalRules';
import { severityStyles, visualSeverityFromHealth } from '../operations/severityStyles';
import { drawerTransition, fadeUp, softScale } from '../../components/motion/presets';

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
  const { projects, projectObservations, comments, activityEvents } = useOperations();
  const navigate = useNavigate();

  if (!isOpen || !payload) return null;

  let content: ReactNode = null;

  if (payload.type === 'project') {
    const project = projects.find((p) => p.id === payload.id);
    if (project) {
      const projectComments = comments.filter((c) => c.entityType === 'project' && c.entityId === project.id);
      const projectObservationsList = projectObservations.filter((o) => o.projectId === project.id);
      const projectEvents = activityEvents.filter((e) => e.projectId === project.id).slice(0, 3);
      content = (
        <ProjectContext project={project} comments={projectComments} observations={projectObservationsList} events={projectEvents} onNavigate={() => { closeContextPanel(); navigate(`/projects/${project.id}`); }} />
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

function ProjectContext({ project, comments, observations, events, onNavigate }: { project: VirtualizationProject; comments: any[]; observations: any[]; events: any[]; onNavigate: () => void }) {
  const blockers = getProjectBlockers(project, project.subjects, observations, project.links);
  const nextAction = getProjectNextActions(project, project.subjects, observations, project.links)[0];
  const operational = getProjectOperationalPackage(project, observations);
  const visual = severityStyles[visualSeverityFromHealth(operational.health.healthStatus)];
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-medium text-slate-400">{project.school}</p>
        <h2 className="mt-0.5 text-base font-semibold text-slate-900">{project.program}</h2>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{project.requestType} / {project.modality}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <StatusBadge status={project.status} />
        <span className="rounded-lg bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">{project.priority}</span>
      </div>
      <div className={cn('rounded-2xl border px-3 py-2.5', visual.card)}>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resumen ejecutivo</p>
        <p className="mt-1 text-sm font-black text-slate-950">{drawerHealthLabel(operational.health.healthStatus)}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{operational.health.nextAction}</p>
      </div>
      <OperationalHealth health={operational.health} compact />
      <div className="grid gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <ContextRow icon={User} label="Product" value={project.productOwner} />
        <ContextRow icon={User} label="Fabrica" value={project.factoryOwner} />
        <ContextRow icon={Clock3} label="Entrega" value={formatDate(project.expectedDeliveryDate)} />
        <ContextRow icon={FileText} label="Links" value={`${project.links.length} disponibles`} />
        <ContextRow icon={BookOpen} label="Semestres" value={project.semesters.map((s) => s.semesterNumber).join(', ')} />
        <ContextRow icon={BookOpen} label="Materias" value={`${project.subjects.length} registradas`} />
      </div>
      {nextAction && (
        <OperationalBox
          title="Accion requerida"
          items={[`Siguiente: ${nextAction.title}`, `Responsable: ${nextAction.responsibleRole}`, `Impacto: ${nextAction.impact}`]}
        />
      )}
      {blockers.length > 0 && <OperationalBox title="Bloqueantes" items={[...blockers.slice(0, 3).map((blocker) => `${blocker.title}: ${blocker.requiredAction}`), ...(blockers.length > 3 ? [`+${blockers.length - 3} bloqueantes adicionales.`] : [])]} tone="warning" />}
      {project.observations && <div className="rounded-xl bg-orange-50 p-3 text-xs font-medium leading-5 text-orange-700">{project.observations}</div>}
      <Section title="Observaciones" count={observations.length}>
        {observations.slice(0, 3).map((obs: any) => (
          <motion.div key={obs.id} {...fadeUp} className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5">
            <p className="text-xs font-medium text-slate-700">{obs.text.substring(0, 80)}{obs.text.length > 80 ? '...' : ''}</p>
            <p className="mt-1 text-[10px] font-medium text-slate-400">{obs.author} / {formatDate(obs.createdAt)}</p>
          </motion.div>
        ))}
      </Section>
      <Section title="Actividad reciente" count={events.length}>
        {events.slice(0, 3).map((ev: any) => (
          <motion.div key={ev.id} {...fadeUp} {...softScale} className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 transition-all hover:border-orange-100 hover:bg-white">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-100 text-orange-500"><ArrowRight className="h-3 w-3" /></div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700">{ev.userName} {ev.action} {ev.entityName}</p>
              <p className="mt-0.5 text-[10px] font-medium text-slate-400">{formatDate(ev.createdAt)}</p>
            </div>
          </motion.div>
        ))}
      </Section>
      <Section title="Comentarios" count={comments.length}>
        <CommentThread entityType="project" entityId={project.id} comments={comments} />
      </Section>
      <button onClick={onNavigate} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-medium text-white transition-all hover:bg-orange-600"><ExternalLink className="h-3.5 w-3.5" /> Gestionar proyecto</button>
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

function drawerHealthLabel(status: ReturnType<typeof getProjectOperationalPackage>['health']['healthStatus']) {
  if (status === 'critico') return 'Proyecto en estado critico';
  if (status === 'bloqueado') return 'Proyecto bloqueado';
  if (status === 'en_riesgo') return 'Proyecto en riesgo';
  return 'Proyecto saludable';
}
