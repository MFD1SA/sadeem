import { type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ title, onClose, children }: DrawerProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/35 z-50" onClick={onClose} />
      <div className="fixed top-0 right-0 rtl:right-0 rtl:left-auto ltr:right-auto ltr:left-0 w-[500px] max-w-[90vw] h-full bg-white shadow-modal z-[51] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-content-primary">{title}</h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </>
  );
}
