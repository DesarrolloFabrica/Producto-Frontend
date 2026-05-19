import { MessageSquare, CheckCircle2 } from 'lucide-react';
import type { OperationalComment } from '../../types/domain';
import { formatDate } from '../../utils/formatters';
import { cn } from '../ui/tokens';

export function CommentCard({ comment, isReply, onReply }: { comment: OperationalComment; isReply?: boolean; onReply?: () => void }) {
  return (
    <div className={cn('rounded-[20px] border border-slate-100 bg-slate-50 p-3', comment.resolved && 'opacity-60', isReply && 'bg-white')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-black text-slate-900">{comment.authorName}</p>
              <span className="rounded-lg bg-slate-100 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-slate-500">{comment.authorRole}</span>
              {comment.resolved && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
            </div>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">{comment.message}</p>
            <p className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">{formatDate(comment.createdAt)}</p>
          </div>
        </div>
        {onReply && !isReply && (
          <button onClick={onReply} className="shrink-0 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest text-orange-500 transition-all hover:bg-orange-50">Responder</button>
        )}
      </div>
    </div>
  );
}
