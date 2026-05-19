import { useState, type KeyboardEvent } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

export function CommentComposer({ onSubmit, placeholder }: { onSubmit: (message: string) => void; placeholder?: string }) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim()) return;
    onSubmit(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-[24px] border border-[#E2E8F0] bg-white p-2 shadow-sm">
      <div className="flex flex-1 items-center gap-2 rounded-[20px] bg-[#F8FAFC] px-4 py-2 ring-1 ring-[#E2E8F0]">
        <button type="button" className="shrink-0 text-[#94A3B8] hover:text-[#64748B] transition-colors" aria-label="Adjuntar archivo">
          <Paperclip className="h-4 w-4" />
        </button>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Escribe un comentario...'}
          rows={1}
          className="min-h-[36px] flex-1 resize-none bg-transparent text-xs font-medium text-[#1E293B] outline-none placeholder:text-[#94A3B8]"
        />
        <button type="button" className="shrink-0 text-[#94A3B8] hover:text-[#64748B] transition-colors" aria-label="Agregar emoji">
          <Smile className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!message.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20 transition-all hover:bg-[#E66000] disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Enviar comentario"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
