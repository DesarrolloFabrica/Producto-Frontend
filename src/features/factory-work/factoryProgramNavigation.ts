import type { ApiFactoryProgramWorkItem } from '../../services/factoryApi';
import type { ProgramOperationalWorkItemDto } from '../../services/institutionalWorkflowApi';
import { mapFactoryProgramToTableItem } from './factoryProgramWork';

export function findMappedFactoryProgram(
  items: ApiFactoryProgramWorkItem[] | undefined,
  projectId: string,
): ProgramOperationalWorkItemDto | null {
  if (!items?.length) return null;
  const raw = items.find((p) => p.projectId === projectId);
  return raw ? mapFactoryProgramToTableItem(raw) : null;
}

export function toFactoryProgramOperationsNav(
  program: ApiFactoryProgramWorkItem,
  from?: string,
): {
  to: string;
  state?: { from: string };
} {
  const programWorkItem = mapFactoryProgramToTableItem(program);
  return {
    to: programWorkItem.actionUrl,
    state: from ? { from } : undefined,
  };
}
