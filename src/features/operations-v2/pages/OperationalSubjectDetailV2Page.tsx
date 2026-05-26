import { ArrowLeft, CalendarDays, ExternalLink, GraduationCap } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../components/ui/tokens';
import { formatDate } from '../../../utils/formatters';
import { useOperationalWorkflowV2 } from '../store/OperationalWorkflowV2Context';
import { OperationalCheckpointBar } from '../components/OperationalCheckpointBar';
import { OperationalStateBadgeV2 } from '../components/OperationalStateBadgeV2';
import { RoleSwitcherV2 } from '../components/RoleSwitcherV2';
import { computeSlaStatusV2 } from '../sla/slaV2';
import { SlaBadgeV2 } from '../components/SlaBadgeV2';
import { actionLabelV2, getAvailableActionsV2, isChecklistPhase, roleLabelV2, stateLabelV2 } from '../rules/workflowRulesV2';
import { OperationalTimelineV2 } from '../components/OperationalTimelineV2';
import { OperationalActionsV2 } from '../components/OperationalActionsV2';
import type { OperationalActionV2 } from '../../../types/operationalWorkflow';
import { TransitionModalsV2, type ModalRequestV2 } from '../modals/TransitionModalsV2';
import { useToast } from '../../../components/ui/ToastProvider';
import { useState } from 'react';
import { Tabs } from '../../../components/ui/Tabs';
import { OperationalPipelineV2 } from '../components/OperationalPipelineV2';

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}

export function OperationalSubjectDetailV2Page() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const now = new Date();
  const { subjects, roleOverride, setRoleOverride, transitionSubject } = useOperationalWorkflowV2();
  const { showToast } = useToast();
  const [modal, setModal] = useState<ModalRequestV2>(null);
  const [tab, setTab] = useState<'resumen' | 'timeline' | 'checks' | 'evidencias' | 'checklist'>('resumen');

  const subject = useMemo(() => subjects.find((s) => s.subjectId === subjectId), [subjects, subjectId]);

  if (!subjectId || !subject) {
    return (
      <div className="space-y-3">
        <PageHeader
          eyebrow="Operaciones V2"
          title="Detalle operacional"
          description="Asignatura no encontrada en el mock local."
        />
        <Button variant="secondary" size="sm" onClick={() => navigate('/workflow-preview')}>
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al preview
        </Button>
      </div>
    );
  }

  const slaStatus = computeSlaStatusV2({ now, dueAt: subject.stageDueAt, finalizedAt: subject.finalizedAt });
  const checklistEnabled = isChecklistPhase(subject.operationalState);
  const available = getAvailableActionsV2({ role: roleOverride, subject });
  const primaryAction = available.primary;
  const actions = available.actions;

  const handleAction = (action: OperationalActionV2) => {
    if (action === 'VIEW_DETAIL') return;
    if (action === 'VIEW_TIMELINE') {
      showToast('El timeline ya esta visible en esta vista.', 'info');
      return;
    }
    if (action === 'PRODUCT_OPEN_ACADEMIC_CHECKLIST') {
      // Only a link; keep isolated from mock transitions.
      if (!checklistEnabled) {
        showToast('Checklist disponible solo en la fase Product del pipeline.', 'info');
        return;
      }
      navigate(`/subjects/${subject.subjectId}`);
      return;
    }
    setModal({ subjectId: subject.subjectId, action });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Button>
        <RoleSwitcherV2 value={roleOverride} onChange={setRoleOverride} className="w-full md:w-auto" />
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asignatura</p>
            <h1 className="mt-1 truncate text-lg font-black text-slate-950">{subject.subjectName}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {subject.program} · Sem. {subject.semesterNumber} · {subject.modality}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OperationalStateBadgeV2 state={subject.operationalState} />
            <SlaBadgeV2 status={slaStatus} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Siguiente acción</p>
            <p className="mt-1 truncate text-sm font-black text-slate-900">{actionLabelV2(primaryAction)}</p>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Rol actual: {roleOverride}</p>
          </div>
          <OperationalActionsV2
            primaryAction={primaryAction}
            actions={actions}
            onAction={handleAction}
            disabled={subject.operationalState === 'FINALIZED'}
            size="sm"
          />
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Siguiente paso</p>
          <p className="mt-1 text-xs font-semibold text-slate-700">
            Responsable actual: <span className="font-black">{roleLabelV2(subject.currentResponsibleRole)}</span>. Ejecuta la validación/entrega para avanzar el proceso.
          </p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            SLA mostrado es una estimación demo (sin impacto en backend).
          </p>
        </div>

        {subject.returnContext ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Devuelta por {subject.returnContext.returnedFromRole}</p>
            <p className="mt-2 text-sm font-bold text-slate-900">{subject.returnContext.comment}</p>
            <p className="mt-1 text-[11px] font-semibold text-rose-700">Fecha: {formatDate(subject.returnContext.returnedAt)}</p>
          </div>
        ) : null}

        <div className="mt-4">
          <OperationalPipelineV2 state={subject.operationalState} />
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          tabs={[
            { id: 'resumen', label: 'Resumen' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'checks', label: 'Checks operacionales' },
            { id: 'evidencias', label: 'Evidencias' },
            { id: 'checklist', label: 'Checklist académico' },
          ]}
          activeTab={tab}
          onChange={(t) => setTab(t as any)}
        />
      </div>

      {tab === 'resumen' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <MetaTile label="Responsable actual" value={roleLabelV2(subject.currentResponsibleRole)} />
          <MetaTile label="Etapa actual" value={stateLabelV2(subject.operationalState)} />
          <MetaTile label="Fecha límite etapa" value={formatDate(subject.stageDueAt)} />
          <MetaTile label="Última actividad" value={formatDate(subject.lastActivityAt)} />
          <div className="md:col-span-2 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                Entrega esperada: <span className="font-black text-slate-800">{formatDate(subject.expectedDeliveryDate)}</span>
              </div>
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-600 ring-1 ring-slate-200/70">
                Prioridad {subject.priority}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'timeline' ? <OperationalTimelineV2 items={subject.timeline} /> : null}
      {tab === 'checks' ? <OperationalCheckpointBar checks={subject.checks} now={now} /> : null}

      {tab === 'evidencias' ? (
        <Card className="p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Evidencias (demo)</p>
          <p className="mt-1 text-xs font-bold text-slate-900">Referencias operacionales</p>
          <div className="mt-3 space-y-2">
            {subject.evidences.map((ev) => (
              <a
                key={ev.id}
                href={ev.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/60 bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-black text-slate-900">{ev.label}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                    {ev.kind} · {ev.addedBy.role} · {formatDate(ev.addedAt)}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" />
              </a>
            ))}
          </div>
        </Card>
      ) : null}

      {tab === 'checklist' ? (
        <Card className="p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checklist académico</p>
          <p className="mt-1 text-xs font-bold text-slate-900">Acceso controlado por etapa</p>
          <div className="mt-3">
            <Button
              size="sm"
              variant={checklistEnabled ? 'primary' : 'secondary'}
              disabled={!checklistEnabled}
              onClick={() => navigate(`/subjects/${subject.subjectId}`)}
              className={cn(!checklistEnabled && 'opacity-70')}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Ir a checklist actual
            </Button>
            {!checklistEnabled ? (
              <p className="mt-2 text-[11px] font-semibold text-slate-500">
                Disponible solo en fase Product: `PENDING_PRODUCT_ACADEMIC_REVIEW`, `IN_PRODUCT_ACADEMIC_REVIEW`, `CHANGES_REQUESTED_BY_PRODUCT`.
              </p>
            ) : (
              <p className="mt-2 text-[11px] font-semibold text-slate-500">
                En esta demo, el enlace puede no existir si la asignatura es mock sin ID real de backend.
              </p>
            )}
          </div>
        </Card>
      ) : null}

      <TransitionModalsV2
        request={modal}
        onClose={() => setModal(null)}
        onConfirm={({ subjectId: sid, action, comment, evidenceUrl }) => {
          const res = transitionSubject(sid, { action, comment, evidenceUrl });
          if (!res.ok) {
            showToast(res.error ?? 'Accion no permitida.', 'error');
            return;
          }
          showToast('Transicion aplicada en workflow mock V2.', 'success');
        }}
      />
    </div>
  );
}
