import { type ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ title, onClose, children }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Escape key + focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !drawerRef.current) return;

      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
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
    drawerRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-black/35 z-50" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        className="fixed top-0 right-0 rtl:right-0 rtl:left-auto ltr:right-auto ltr:left-0 w-[500px] max-w-[90vw] h-full bg-white shadow-modal z-[51] overflow-y-auto focus:outline-none"
      >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 id="drawer-title" className="text-base font-semibold text-content-primary">{title}</h3>
          <button
            className="btn-icon focus:outline-2 focus:outline-brand-500"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </>
  );
}
