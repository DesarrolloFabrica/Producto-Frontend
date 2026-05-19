import { CalendarDays, ArrowRight } from 'lucide-react';
import type { ProjectSemester } from '../../types/domain';
import { formatDate } from '../../utils/formatters';
import { StatusBadge } from '../status/StatusBadge';
import { Card } from '../ui/Card';
import { cn, surface, radius } from '../ui/tokens';

export function SemesterWorkflowCard({ semester, showConnector }: { semester: ProjectSemester; showConnector?: boolean }) {
  return (
    <div className="relative">
      {showConnector && (
        <div className="absolute -bottom-4 left-1/2 z-10 hidden h-4 w-px border-l-2 border-dashed border-slate-300 md:block" />
      )}
      <Card className={cn('relative overflow-hidden p-5 sm:p-6', surface.elevated, radius.elevated)}>
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">Workflow semestre</p>
              <h3 className="mt-1 text-xl font-bold tracking-[-0.02em] text-[#1E293B]">Semestre {semester.semesterNumber}</h3>
            </div>
            <span className="shrink-0 rounded-[12px] bg-[#F8FAFC] px-3 py-1 text-[9px] font-medium text-[#64748B] ring-1 ring-slate-200/50">
              {formatDate(semester.factoryExpectedDate)}
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="relative rounded-[12px] bg-[#F8FAFC] p-4">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">Currículo</p>
              <StatusBadge status={semester.curriculumStatus} />
            </div>
            <div className="relative rounded-[12px] bg-[#F8FAFC] p-4">
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">Fábrica</p>
              <StatusBadge status={semester.factoryStatus} />
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <span className="flex items-center gap-1.5 text-[0.8rem] font-medium text-[#94A3B8]">
              <CalendarDays className="h-3.5 w-3.5" /> Continuación: {formatDate(semester.continuationDate)}
            </span>
            <span className="flex items-center gap-1.5 text-[0.8rem] font-medium text-[#94A3B8]">
              <CalendarDays className="h-3.5 w-3.5" /> Entrega fábrica: {formatDate(semester.factoryExpectedDate)}
            </span>
          </div>
          {semester.observations && (
            <p className="mt-4 rounded-[12px] bg-[#F8FAFC] p-4 text-xs font-medium leading-relaxed text-[#64748B]">{semester.observations}</p>
          )}
        </div>
        <span className="pointer-events-none absolute right-8 bottom-8 select-none text-[3rem] font-black leading-none text-[#94A3B8]/40">
          {semester.semesterNumber}
        </span>
      </Card>
    </div>
  );
}
