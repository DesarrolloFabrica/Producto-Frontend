export type WorkflowRefreshScope =
  | 'detail'
  | 'projectObservations'
  | 'subjectObservations'
  | 'list'
  | 'notifications';

export type WorkflowRefreshOptions = {
  projectId?: string;
  subjectId?: string;
  scopes: WorkflowRefreshScope[];
};

export function normalizeWorkflowScopes(
  scopes: WorkflowRefreshScope | WorkflowRefreshScope[],
): WorkflowRefreshScope[] {
  return Array.isArray(scopes) ? scopes : [scopes];
}
