import { type MouseEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ title, onClose, children, footer }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" onClick={onClose}>
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
      <div className="relative bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl ring-1 ring-black/5" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-3.5 border-b border-border/60">
          <h3 className="text-[14px] font-semibold text-content-primary">{title}</h3>
          <button
            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-secondary transition-colors"
            onClick={onClose}
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
