import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { useOperations } from '../../features/operations/OperationsContext';
import { useToast } from '../ui/ToastProvider';
import type { CommentEntityType, OperationalComment, Role } from '../../types/domain';
import { CommentCard } from './CommentCard';
import { CommentComposer } from './CommentComposer';

export function CommentThread({ entityType, entityId, comments }: { entityType: CommentEntityType; entityId: string; comments: OperationalComment[] }) {
  const { role } = useAuth();
  const { addComment } = useOperations();
  const { showToast } = useToast();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  const handleAddComment = (message: string) => {
    addComment({
      entityType,
      entityId,
      authorName: role === 'PRODUCT' ? 'Product Owner' : 'Fabrica Owner',
      authorRole: role as Role,
      message,
    });
    showToast('Comentario agregado');
  };

  const handleReply = (parentId: string, message: string) => {
    addComment({
      entityType,
      entityId,
      authorName: role === 'PRODUCT' ? 'Product Owner' : 'Fabrica Owner',
      authorRole: role as Role,
      message,
      parentId,
    });
    setReplyingTo(null);
    showToast('Respuesta agregada');
  };

  if (comments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center rounded-[20px] bg-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.04)] px-5 py-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFEDD5] text-[#FF6B00]">
            <MessageCircle className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-[#1E293B]">Sin comentarios aún</p>
          <p className="mt-2 max-w-xs text-xs font-medium leading-relaxed text-[#94A3B8]">
            No hay comentarios operativos. Usa el campo inferior para iniciar la conversación con el equipo.
          </p>
        </div>
        <CommentComposer onSubmit={handleAddComment} placeholder="Escribe un comentario..." />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rootComments.map((comment) => (
        <div key={comment.id}>
          <CommentCard comment={comment} onReply={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} />
          {replyingTo === comment.id && (
            <div className="ml-6 mt-2">
              <CommentComposer onSubmit={(msg) => handleReply(comment.id, msg)} placeholder="Responder..." />
            </div>
          )}
          {getReplies(comment.id).map((reply) => (
            <div key={reply.id} className="ml-6 mt-2 border-l-2 border-orange-200 pl-4">
              <CommentCard comment={reply} isReply />
            </div>
          ))}
        </div>
      ))}
      <CommentComposer onSubmit={handleAddComment} placeholder="Escribe un comentario..." />
    </div>
  );
}
