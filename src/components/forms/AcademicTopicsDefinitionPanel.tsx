import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SubjectTopicsEditor } from './SubjectTopicsEditor';
import {
  isSubjectTopicsFormValid,
  validateSubjectTopicsList,
} from '../../utils/subjectTopics';
import { cn } from '../ui/tokens';

type AcademicTopicsDefinitionPanelProps = {
  inputClass: string;
  saving: boolean;
  onSave: (topics: string[]) => Promise<void>;
};

export function AcademicTopicsDefinitionPanel({
  inputClass,
  saving,
  onSave,
}: AcademicTopicsDefinitionPanelProps) {
  const [topics, setTopics] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const errors = validateSubjectTopicsList(topics, 'Gránulos académicos');
    if (errors.length > 0) {
      setError(errors[0]);
      return;
    }
    if (!isSubjectTopicsFormValid(topics)) {
      setError('Define entre 4 y 6 gránulos con nombre.');
      return;
    }
    setError('');
    await onSave(topics.map((t) => t.trim()).filter(Boolean));
  };

  return (
    <Card variant="subjectPanel" className="p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Revisión académica</p>
        <h2 className="text-sm font-black tracking-tight text-slate-950">Definir gránulos / temas</h2>
        <p className="mt-1 text-[11px] font-medium text-slate-500">
          Antes de revisar materiales por tema, define entre 4 y 6 gránulos académicos para esta asignatura.
        </p>
      </div>
      <SubjectTopicsEditor topics={topics} onChange={setTopics} inputClass={cn(inputClass, 'bg-white')} />
      {error && (
        <p className="mt-3 text-xs font-medium text-rose-600">{error}</p>
      )}
      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          disabled={saving || !isSubjectTopicsFormValid(topics)}
          onClick={() => void handleSave()}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar gránulos
        </Button>
      </div>
    </Card>
  );
}
