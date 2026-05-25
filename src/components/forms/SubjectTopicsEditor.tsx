import { Plus, X } from 'lucide-react';
import { cn } from '../ui/tokens';
import {
  SUBJECT_TOPICS_HELPER,
  buildSuggestedTopicNames,
  buildSuggestedTopicsToReachFive,
  canAddMoreTopics,
  getSubjectTopicsCounterLabel,
} from '../../utils/subjectTopics';

type SubjectTopicsEditorProps = {
  topics: string[];
  onChange: (topics: string[]) => void;
  inputClass?: string;
  labelClass?: string;
};

export function SubjectTopicsEditor({
  topics,
  onChange,
  inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all',
  labelClass = 'text-[10px] font-black uppercase tracking-widest text-slate-400',
}: SubjectTopicsEditorProps) {
  const addTopic = () => {
    if (!canAddMoreTopics(topics.length)) return;
    onChange([...topics, '']);
  };

  const updateTopic = (index: number, value: string) => {
    onChange(topics.map((topic, i) => (i === index ? value : topic)));
  };

  const removeTopic = (index: number) => {
    onChange(topics.filter((_, i) => i !== index));
  };

  const suggestTopics = () => {
    if (topics.length === 0) {
      onChange(buildSuggestedTopicNames());
      return;
    }
    onChange(buildSuggestedTopicsToReachFive(topics));
  };

  const atMax = !canAddMoreTopics(topics.length);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={labelClass}>Temas / Gránulos</p>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500">{SUBJECT_TOPICS_HELPER}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-[10px] font-bold ring-1',
              topics.length < 4
                ? 'bg-amber-50 text-amber-800 ring-amber-100'
                : topics.length === 5
                  ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
                  : atMax
                    ? 'bg-slate-100 text-slate-600 ring-slate-200'
                    : 'bg-orange-50 text-orange-700 ring-orange-100',
            )}
          >
            {getSubjectTopicsCounterLabel(topics.length)}
          </span>
          <button type="button" onClick={suggestTopics} className="text-[10px] font-bold text-orange-600 hover:text-orange-700">
            Sugerir 5
          </button>
          <button
            type="button"
            onClick={addTopic}
            disabled={atMax}
            className={cn(
              'text-[10px] font-bold',
              atMax ? 'cursor-not-allowed text-slate-300' : 'text-orange-600 hover:text-orange-700',
            )}
          >
            + Tema
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {topics.map((topic, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-orange-100 text-[9px] font-bold text-orange-600">
              {index + 1}
            </span>
            <input
              className={cn(inputClass, 'flex-1 py-2 px-3 text-xs')}
              value={topic}
              onChange={(e) => updateTopic(index, e.target.value)}
              placeholder={`Tema ${index + 1}`}
            />
            <button type="button" onClick={() => removeTopic(index)} className="shrink-0 text-slate-300 hover:text-rose-500">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {topics.length === 0 && (
          <p className="py-4 text-center text-xs font-medium text-slate-400">
            Agrega entre 4 y 6 temas. Usa &quot;Sugerir 5&quot; para empezar rápido.
          </p>
        )}
      </div>
    </div>
  );
}
