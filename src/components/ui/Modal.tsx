import { type MouseEvent, type ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Focus the modal on open
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      onClick={onClose}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/30" aria-hidden="true" />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className="relative bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl ring-1 ring-black/5 focus:outline-none"
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-3.5 border-b border-border/60">
          <h3 id="modal-title" className="text-[14px] font-semibold text-content-primary">{title}</h3>
          <button
            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-secondary transition-colors focus:outline-2 focus:outline-brand-500"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex gap-2 px-5 py-3 border-t border-border/60 bg-surface-secondary/30">{footer}</div>}
      </div>
    </div>
  );
}
