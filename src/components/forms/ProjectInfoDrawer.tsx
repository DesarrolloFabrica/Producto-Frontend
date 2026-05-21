import { Drawer } from '../ui/Drawer';
import { StatusBadge } from '../status/StatusBadge';
import { CalendarDays, CheckCircle2, FileText, User, BookOpen, X } from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { Button } from '../ui/Button';
import type { VirtualizationProject } from '../../types/domain';
import { cn } from '../ui/tokens';

interface ProjectInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: VirtualizationProject;
}

export function ProjectInfoDrawer({ isOpen, onClose, project }: ProjectInfoDrawerProps) {
  const hasSyllabus = project.links.some((l) => l.type === 'SYLLABUS');
  const syllabusLink = project.links.find((l) => l.type === 'SYLLABUS');
  const totalSubjects = project.subjects.length;
  const totalSemesters = project.semesters.length;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Información de solicitud" description="La solicitud inicial queda registrada como base del proyecto. Las ampliaciones deben realizarse desde Semestres.">
      <div className="space-y-5">
        {/* Header con estado */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Estado actual</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{project.status.replace(/_/g, ' ')}</p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        {/* Información base */}
        <div className="space-y-3">
          <InfoRow icon={BookOpen} label="Escuela" value={project.school} />
          <InfoRow icon={FileText} label="Programa" value={project.program} />
          <InfoRow label="Modalidad" value={project.modality} />
          <InfoRow label="Prioridad" value={project.priority} />
        </div>

        <div className="border-t border-slate-100" />

        {/* Fechas y responsables */}
        <div className="space-y-3">
          <InfoRow icon={CalendarDays} label="Fecha de creación" value={formatDate(project.createdAt)} />
          <InfoRow icon={CalendarDays} label="Entrega esperada (inicial)" value={formatDate(project.expectedDeliveryDate)} />
          <InfoRow icon={User} label="Responsable Product" value={project.productOwner} />
          <InfoRow icon={User} label="Responsable Fábrica" value={project.factoryOwner} />
        </div>

        <div className="border-t border-slate-100" />

        {/* Semestres y materias */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Semestres registrados</p>
              <p className="text-sm font-semibold text-slate-700">{totalSemesters}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-slate-400" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Materias registradas</p>
              <p className="text-sm font-semibold text-slate-700">{totalSubjects}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Syllabus */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Syllabus</p>
          {hasSyllabus ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700">Sí registrado</span>
              {syllabusLink && (
                <a
                  href={syllabusLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  <FileText className="h-3.5 w-3.5" /> Abrir link
                </a>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-500">Sin syllabus registrado</div>
          )}
        </div>

        {/* Observaciones */}
        {project.observations && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Observaciones iniciales</p>
            <div className="rounded-xl bg-slate-50 p-3 text-sm font-medium leading-relaxed text-slate-600">{project.observations}</div>
          </div>
        )}

        {/* Info box */}
        <div className="rounded-xl bg-orange-50 p-3 text-xs font-medium text-orange-800">
          <p className="flex items-start gap-2">
            <X className="h-4 w-4 shrink-0" />
            La edición de la solicitud inicial está bloqueada. Para modificar semestres, asignaturas o temas, utiliza la pestaña Semestres.
          </p>
        </div>

        {/* Botón */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Drawer>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon?: typeof BookOpen; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}
