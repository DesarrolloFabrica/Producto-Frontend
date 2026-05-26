import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { OperationalActionV2, OperationalRoleV2, OperationalStateV2, OperationalSubjectV2 } from '../../../types/operationalWorkflow';
import { createMockSubjects, OP_USERS } from '../../../mocks/operationalWorkflowMock';

const STORAGE_KEY = 'producto_ops_v2_state_v1';

function iso(d: Date): string {
  return d.toISOString();
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function nowPlusHours(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return iso(d);
}

function resolveNextState(params: { current: OperationalStateV2; action: OperationalActionV2 }): OperationalStateV2 | null {
  const { current, action } = params;
  switch (action) {
    case 'PLANNING_VALIDATE_INITIAL':
      if (current === 'PENDING_PLANNING_INITIAL_VALIDATION' || current === 'RETURNED_TO_PRODUCT_FROM_PLANNING') return 'PENDING_FACTORY';
      return null;
    case 'PLANNING_RETURN_INITIAL':
      if (current === 'PENDING_PLANNING_INITIAL_VALIDATION') return 'RETURNED_TO_PRODUCT_FROM_PLANNING';
      return null;
    case 'FACTORY_START_PRODUCTION':
      if (current === 'PENDING_FACTORY' || current === 'RETURNED_TO_FACTORY_FROM_PLANNING' || current === 'CHANGES_REQUESTED_BY_PRODUCT') return 'IN_FACTORY_PRODUCTION';
      return null;
    case 'FACTORY_DELIVER_CONTENT':
      if (current === 'IN_FACTORY_PRODUCTION') return 'PENDING_PLANNING_PRODUCTION_VALIDATION';
      return null;
    case 'PLANNING_VALIDATE_PRODUCTION':
      if (current === 'PENDING_PLANNING_PRODUCTION_VALIDATION' || current === 'RETURNED_TO_FACTORY_FROM_PLANNING') return 'PENDING_LMS_UPLOAD';
      return null;
    case 'PLANNING_RETURN_PRODUCTION':
      if (current === 'PENDING_PLANNING_PRODUCTION_VALIDATION') return 'RETURNED_TO_FACTORY_FROM_PLANNING';
      return null;
    case 'LMS_START_UPLOAD':
      if (current === 'PENDING_LMS_UPLOAD' || current === 'RETURNED_TO_LMS_FROM_PLANNING') return 'IN_LMS_UPLOAD';
      return null;
    case 'LMS_CONFIRM_UPLOAD':
      if (current === 'IN_LMS_UPLOAD') return 'PENDING_PLANNING_LMS_VALIDATION';
      return null;
    case 'PLANNING_VALIDATE_LMS':
      if (current === 'PENDING_PLANNING_LMS_VALIDATION' || current === 'RETURNED_TO_LMS_FROM_PLANNING') return 'PENDING_PRODUCT_ACADEMIC_REVIEW';
      return null;
    case 'PLANNING_RETURN_LMS':
      if (current === 'PENDING_PLANNING_LMS_VALIDATION') return 'RETURNED_TO_LMS_FROM_PLANNING';
      return null;
    case 'PRODUCT_START_ACADEMIC_REVIEW':
      if (current === 'PENDING_PRODUCT_ACADEMIC_REVIEW') return 'IN_PRODUCT_ACADEMIC_REVIEW';
      return null;
    case 'PRODUCT_REQUEST_CHANGES':
      if (current === 'IN_PRODUCT_ACADEMIC_REVIEW') return 'CHANGES_REQUESTED_BY_PRODUCT';
      return null;
    case 'PRODUCT_APPROVE_ACADEMIC':
      if (current === 'IN_PRODUCT_ACADEMIC_REVIEW') return 'PENDING_PROJECT_RADICATION';
      return null;
    default:
      return null;
  }
}

function stageLabelFor(state: OperationalStateV2): string {
  switch (state) {
    case 'PENDING_PLANNING_INITIAL_VALIDATION':
    case 'RETURNED_TO_PRODUCT_FROM_PLANNING':
      return 'Validación inicial (Planeación)';
    case 'PENDING_FACTORY':
    case 'IN_FACTORY_PRODUCTION':
    case 'PENDING_PLANNING_PRODUCTION_VALIDATION':
    case 'RETURNED_TO_FACTORY_FROM_PLANNING':
      return 'Producción (Fábrica) y validación (Planeación)';
    case 'PENDING_LMS_UPLOAD':
    case 'IN_LMS_UPLOAD':
    case 'PENDING_PLANNING_LMS_VALIDATION':
    case 'RETURNED_TO_LMS_FROM_PLANNING':
      return 'Carga LMS (LMS) y validación (Planeación)';
    case 'PENDING_PRODUCT_ACADEMIC_REVIEW':
    case 'IN_PRODUCT_ACADEMIC_REVIEW':
    case 'CHANGES_REQUESTED_BY_PRODUCT':
      return 'Revisión académica (Product)';
    case 'PENDING_PROJECT_RADICATION':
    case 'FINALIZED':
      return 'Cierre institucional (Planeación)';
    default:
      return 'Pipeline institucional';
  }
}

function responsibleRoleFor(state: OperationalStateV2): OperationalRoleV2 {
  switch (state) {
    case 'PENDING_PLANNING_INITIAL_VALIDATION':
    case 'PENDING_PLANNING_PRODUCTION_VALIDATION':
    case 'PENDING_PLANNING_LMS_VALIDATION':
    case 'PENDING_PROJECT_RADICATION':
    case 'FINALIZED':
      return 'PLANEACION';
    case 'RETURNED_TO_PRODUCT_FROM_PLANNING':
    case 'PENDING_PRODUCT_ACADEMIC_REVIEW':
    case 'IN_PRODUCT_ACADEMIC_REVIEW':
      return 'PRODUCT';
    case 'PENDING_FACTORY':
    case 'IN_FACTORY_PRODUCTION':
    case 'RETURNED_TO_FACTORY_FROM_PLANNING':
    case 'CHANGES_REQUESTED_BY_PRODUCT':
      return 'FABRICA';
    case 'PENDING_LMS_UPLOAD':
    case 'IN_LMS_UPLOAD':
    case 'RETURNED_TO_LMS_FROM_PLANNING':
      return 'LMS';
    default:
      return 'PLANEACION';
  }
}

function isReturnState(state: OperationalStateV2): boolean {
  return (
    state === 'RETURNED_TO_PRODUCT_FROM_PLANNING' ||
    state === 'RETURNED_TO_FACTORY_FROM_PLANNING' ||
    state === 'RETURNED_TO_LMS_FROM_PLANNING'
  );
}

function updateChecksForTransition(params: {
  subject: OperationalSubjectV2;
  nextState: OperationalStateV2;
  actorRole: OperationalRoleV2;
  comment: string | null;
  evidenceUrl: string | null;
}): void {
  const { subject, nextState, actorRole, comment, evidenceUrl } = params;
  const now = iso(new Date());

  const markChecked = (key: string) => {
    const c = subject.checks.find((x) => x.key === key);
    if (!c) return;
    c.status = 'CHECKED';
    c.checkedAt = now;
    c.checkedBy = OP_USERS[actorRole];
    c.comment = comment ?? c.comment ?? null;
    c.evidenceUrl = evidenceUrl ?? c.evidenceUrl ?? null;
  };

  if (nextState === 'PENDING_FACTORY') markChecked('PLANNING_INITIAL_VALIDATED');
  if (nextState === 'PENDING_PLANNING_PRODUCTION_VALIDATION') markChecked('FACTORY_CONTENT_DELIVERED');
  if (nextState === 'PENDING_LMS_UPLOAD') markChecked('PLANNING_PRODUCTION_VALIDATED');
  if (nextState === 'PENDING_PLANNING_LMS_VALIDATION') markChecked('LMS_UPLOAD_COMPLETED');
  if (nextState === 'PENDING_PRODUCT_ACADEMIC_REVIEW') markChecked('PLANNING_LMS_VALIDATED');
  if (nextState === 'PENDING_PROJECT_RADICATION') markChecked('PRODUCT_ACADEMIC_APPROVED');
  if (nextState === 'FINALIZED') markChecked('PLANNING_FINAL_RADICATED');
}

type State = {
  roleOverride: OperationalRoleV2;
  subjects: OperationalSubjectV2[];
};

type Action =
  | { type: 'SET_ROLE'; role: OperationalRoleV2 }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; state: State }
  | { type: 'TRANSITION'; subjectId: string; input: { action: OperationalActionV2; comment?: string; returnReason?: string; evidenceUrl?: string } };

const initialState: State = {
  roleOverride: 'PLANEACION',
  subjects: createMockSubjects(18),
};

function singleDemoSubject(): OperationalSubjectV2[] {
  const s = createMockSubjects(1)[0];
  if (!s) return createMockSubjects(1);
  s.operationalState = 'PENDING_PLANNING_INITIAL_VALIDATION';
  s.currentStageLabel = stageLabelFor(s.operationalState);
  s.currentResponsibleRole = responsibleRoleFor(s.operationalState);
  s.returnContext = null;
  s.finalizedAt = null;
  s.stageEnteredAt = iso(new Date());
  s.stageDueAt = nowPlusHours(72);
  s.lastActivityAt = iso(new Date());
  s.timeline = [
    {
      id: uid('t'),
      occurredAt: iso(new Date()),
      from: null,
      to: s.operationalState,
      action: 'VIEW_DETAIL',
      actor: OP_USERS.PRODUCT,
      comment: 'Solicitud creada (demo).',
      returnReason: null,
      durationLabel: null,
    },
  ];
  // Reset checks to pending
  s.checks = s.checks.map((c) => ({
    ...c,
    status: 'PENDING',
    checkedAt: null,
    checkedBy: null,
    comment: null,
    evidenceUrl: null,
  }));
  return [s];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, roleOverride: action.role };
    case 'RESET':
      return { ...state, subjects: singleDemoSubject() };
    case 'HYDRATE':
      return action.state;
    case 'TRANSITION': {
      const subjects = state.subjects.map((s) => ({ ...s, checks: s.checks.map((c) => ({ ...c })), timeline: [...s.timeline], evidences: [...s.evidences] }));
      const subject = subjects.find((s) => s.subjectId === action.subjectId);
      if (!subject) return state;

      const role = state.roleOverride;
      const input = action.input;
      const comment = input.comment?.trim() || '';
      const isReturn =
        input.action === 'PLANNING_RETURN_INITIAL' ||
        input.action === 'PLANNING_RETURN_PRODUCTION' ||
        input.action === 'PLANNING_RETURN_LMS' ||
        input.action === 'PRODUCT_REQUEST_CHANGES';

      if (isReturn && !comment) return state;

      const next = resolveNextState({ current: subject.operationalState, action: input.action });
      if (!next) return state;

      const previous = subject.operationalState;
      subject.operationalState = next;
      subject.currentStageLabel = stageLabelFor(next);
      subject.currentResponsibleRole = responsibleRoleFor(next);
      subject.lastActivityAt = iso(new Date());
      subject.stageEnteredAt = iso(new Date());
      subject.stageDueAt = next === 'FINALIZED' ? subject.stageDueAt : nowPlusHours(72);
      subject.finalizedAt = next === 'FINALIZED' ? iso(new Date()) : null;

      subject.returnContext = isReturnState(next)
        ? { returnedFromRole: role, comment, returnedAt: iso(new Date()) }
        : null;

      updateChecksForTransition({
        subject,
        nextState: next,
        actorRole: role,
        comment: comment || null,
        evidenceUrl: input.evidenceUrl?.trim() || null,
      });

      subject.timeline = [
        {
          id: uid('t'),
          occurredAt: iso(new Date()),
          from: previous,
          to: next,
          action: input.action,
          actor: OP_USERS[role],
          comment: comment || null,
          returnReason: isReturn ? (input.returnReason?.trim() || 'Devolucion') : null,
          durationLabel: null,
        },
        ...subject.timeline,
      ];

      return { ...state, subjects };
    }
    default:
      return state;
  }
}

type Ctx = State & {
  setRoleOverride: (role: OperationalRoleV2) => void;
  resetMock: () => void;
  transitionSubject: (subjectId: string, input: { action: OperationalActionV2; comment?: string; evidenceUrl?: string; returnReason?: string }) => { ok: boolean; error?: string };
};

const Ctx = createContext<Ctx | null>(null);

function safeRead(): State | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as State;
  } catch {
    return null;
  }
}

function safeWrite(state: State): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function OperationalWorkflowV2Provider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const persisted = safeRead();
    if (!persisted) return;
    if (!persisted.subjects || !Array.isArray(persisted.subjects)) return;
    dispatch({ type: 'HYDRATE', state: persisted });
  }, []);

  useEffect(() => {
    safeWrite(state);
  }, [state]);

  const value = useMemo<Ctx>(() => ({
    ...state,
    setRoleOverride: (role) => dispatch({ type: 'SET_ROLE', role }),
    resetMock: () => dispatch({ type: 'RESET' }),
    transitionSubject: (subjectId, input) => {
      const isReturn =
        input.action === 'PLANNING_RETURN_INITIAL' ||
        input.action === 'PLANNING_RETURN_PRODUCTION' ||
        input.action === 'PLANNING_RETURN_LMS' ||
        input.action === 'PRODUCT_REQUEST_CHANGES';
      if (isReturn && !(input.comment ?? '').trim()) {
        return { ok: false, error: 'El comentario es obligatorio para devolver una etapa.' };
      }
      dispatch({ type: 'TRANSITION', subjectId, input });
      return { ok: true };
    },
  }), [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOperationalWorkflowV2() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useOperationalWorkflowV2 must be used within OperationalWorkflowV2Provider');
  return ctx;
}
