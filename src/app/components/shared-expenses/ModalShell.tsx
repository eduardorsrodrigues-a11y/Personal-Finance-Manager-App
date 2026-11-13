import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  maxWidth?: string;
}

/** Bottom sheet on mobile, centred dialog on desktop (see CLAUDE.md → Modal). */
export function ModalShell({ title, onClose, children, footer, headerActions, maxWidth = 'max-w-md' }: ModalShellProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-card w-full ${maxWidth} rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <p className="font-semibold text-sm">{title}</p>
          <div className="flex items-center gap-1">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="px-5 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="flex gap-3 px-5 pb-5 pt-1 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

export const inputClass =
  'w-full px-3 py-2.5 text-sm bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring';

export const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5';

export function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/** Parses a user-typed money string ("12,50" or "12.50") into a number, or NaN. */
export function parseMoney(value: string): number {
  if (value.trim() === '') return NaN;
  return parseFloat(value.replace(',', '.'));
}

export const todayIso = () => new Date().toISOString().split('T')[0];
