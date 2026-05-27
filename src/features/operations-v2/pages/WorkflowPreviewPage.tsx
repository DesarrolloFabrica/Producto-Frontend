import { useMemo, useState } from 'react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { RoleSwitcherV2 } from '../components/RoleSwitcherV2';
import { useOperationalWorkflowV2 } from '../store/OperationalWorkflowV2Context';
import { OperationalWorkTableV2 } from '../OperationalWorkTableV2';
import { computeSlaStatusV2 } from '../sla/slaV2';
import { getAvailableActionsV2, isChecklistPhase } from '../rules/workflowRulesV2';
import { TransitionModalsV2, type ModalRequestV2 } from '../modals/TransitionModalsV2';
import { useToast } from '../../../components/ui/ToastProvider';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export function WorkflowPreviewPage() {
  const now = new Date();
  const navigate = useNavigate();
  const { subjects, roleOverride, setRoleOverride, transitionSubject, resetMock } = useOperationalWorkflowV2();
  const { showToast } = useToast();
  const [modal, setModal] = useState<ModalRequestV2>(null);

  const guidance = useMemo(() => {
    switch (roleOverride) {
      case 'PLANEACION':
        return 'Debes validar la etapa pendiente de Planeación.';
      case 'FABRICA':
        return 'Debes iniciar o entregar producción según la asignatura.';
      case 'LMS':
        return 'Debes iniciar o confirmar la publicación en LMS.';
      case 'PRODUCT':
        return 'Debes realizar la revisión académica cuando corresponda.';
      default:
        return 'Puedes inspeccionar y ejecutar transiciones para la demo.';
    }
  }, [roleOverride]);

  const items = useMemo(() => {
    return subjects.map((s) => {
      const slaStatus = computeSlaStatusV2({ now, dueAt: s.stageDueAt, finalizedAt: s.finalizedAt });
      const actions = getAvailableActionsV2({ role: roleOverride, subject: s });
      return {
        subjectId: s.subjectId,
        projectId: s.projectId,
        subjectName: s.subjectName,
        program: s.program,
        school: s.school,
        semesterNumber: s.semesterNumber,
        modality: s.modality,
        priority: s.priority,
        expectedDeliveryDate: s.expectedDeliveryDate,
        operationalState: s.operationalState,
        currentStageLabel: s.currentStageLabel,
        currentResponsibleRole: s.currentResponsibleRole,
        slaStatus,
        stageDueAt: s.stageDueAt,
        lastActivityAt: s.lastActivityAt,
        checksCompleted: s.checks.filter((c) => c.status === 'CHECKED').length,
        checksTotal: s.checks.length,
        primaryAction: actions.primary,
        actions: actions.actions,
      };
    });
  }, [subjects, roleOverride]);

  const myPending = useMemo(() => items.filter((i) => i.currentResponsibleRole === roleOverride && i.operationalState !== 'FINALIZED'), [items, roleOverride]);

  const roleBuckets = useMemo(() => {
    const counts: Array<{ id: string; label: string; count: number; hint: string }> = [];
    const byState = (state: string) => myPending.filter((i) => i.operationalState === state).length;
    if (roleOverride === 'PLANEACION') {
      counts.push(
        { id: 'init', label: 'Validaciones iniciales', count: byState('PENDING_PLANNING_INITIAL_VALIDATION'), hint: 'Revisar datos y habilitar Fábrica.' },
        { id: 'prod', label: 'Validaciones producción', count: byState('PENDING_PLANNING_PRODUCTION_VALIDATION'), hint: 'Validar entrega y estructura.' },
        { id: 'lms', label: 'Validaciones LMS', count: byState('PENDING_PLANNING_LMS_VALIDATION'), hint: 'Validar publicación y credenciales.' },
        { id: 'rad', label: 'Radicación proyecto', count: byState('PENDING_PROJECT_RADICATION'), hint: 'Pendiente radicación de la solicitud.' },
      );
    } else if (roleOverride === 'FABRICA') {
      counts.push(
        { id: 'pending', label: 'Producción pendiente', count: byState('PENDING_FACTORY'), hint: 'Iniciar producción.' },
        { id: 'in', label: 'En producción', count: byState('IN_FACTORY_PRODUCTION'), hint: 'Entregar contenido.' },
        { id: 'returned', label: 'Devueltas', count: byState('RETURNED_TO_FACTORY_FROM_PLANNING') + byState('CHANGES_REQUESTED_BY_PRODUCT'), hint: 'Ajustar y re-entregar.' },
      );
    } else if (roleOverride === 'LMS') {
      counts.push(
        { id: 'ready', label: 'Listas para publicar', count: byState('PENDING_LMS_UPLOAD'), hint: 'Iniciar carga LMS.' },
        { id: 'upload', label: 'Publicaciones pendientes', count: byState('IN_LMS_UPLOAD'), hint: 'Confirmar publicación.' },
        { id: 'returned', label: 'Devueltas', count: byState('RETURNED_TO_LMS_FROM_PLANNING'), hint: 'Corregir publicación/enlaces.' },
      );
    } else if (roleOverride === 'PRODUCT') {
      counts.push(
        { id: 'review', label: 'Pendientes de revisión', count: byState('PENDING_PRODUCT_ACADEMIC_REVIEW') + byState('IN_PRODUCT_ACADEMIC_REVIEW'), hint: 'Revisar checklist académico.' },
        { id: 'changes', label: 'Correcciones solicitadas', count: byState('CHANGES_REQUESTED_BY_PRODUCT'), hint: 'Dar seguimiento a Fábrica.' },
      );
    } else {
      counts.push({ id: 'all', label: 'Pendientes', count: myPending.length, hint: 'Items asignados al rol actual.' });
    }
    return counts;
  }, [myPending, roleOverride]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Operaciones V2"
        title="Centro Operacional"
        description="Bandeja institucional para gestionar pendientes por rol y avanzar el flujo académico-operativo."
      />

      <RoleSwitcherV2 value={roleOverride} onChange={setRoleOverride} />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tu acción actual</p>
            <p className="mt-1 text-sm font-black text-slate-950">{guidance}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">Vista: {roleOverride} · Datos demo locales (sin backend).</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => resetMock()}>
              Reiniciar flujo desde cero
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {roleBuckets.map((b) => (
            <div key={b.id} className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{b.label}</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{b.count}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">{b.hint}</p>
            </div>
          ))}
        </div>
      </Card>

      <OperationalWorkTableV2
        role={roleOverride}
        items={myPending}
        isLoading={false}
        error={null}
        onRefresh={resetMock}
        onAction={({ subjectId, action }) => {
          if (action === 'VIEW_DETAIL' || action === 'VIEW_TIMELINE') {
            navigate(`/operations-v2/subjects/${subjectId}`);
            return;
          }
          if (action === 'PRODUCT_OPEN_ACADEMIC_CHECKLIST') {
            // Isolated: only navigation, no backend transitions.
            const subj = subjects.find((s) => s.subjectId === subjectId);
            if (!subj) return;
            if (!isChecklistPhase(subj.operationalState)) {
              showToast('Checklist disponible solo en fase Product. Revisar detalle V2 para ver el gating.', 'info');
              navigate(`/operations-v2/subjects/${subjectId}`);
              return;
            }
            navigate(`/subjects/${subjectId}`);
            return;
          }
          setModal({ subjectId, action });
        }}
      />

      <TransitionModalsV2
        request={modal}
        onClose={() => setModal(null)}
        onConfirm={({ subjectId, action, comment, evidenceUrl }) => {
          if (action.startsWith('VIEW_') || action === 'PRODUCT_OPEN_ACADEMIC_CHECKLIST') return;
          transitionSubject(subjectId, { action, comment, evidenceUrl });
        }}
      />
    </div>
  );
}
