import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[var(--surface)] rounded-xl shadow-lg p-6 min-w-[320px] max-w-lg w-full relative"
        style={{ color: "var(--foreground)" }}
        onClick={e => e.stopPropagation()}
      >
        {title && <h2 className="text-xl font-bold mb-4" style={{ color: "var(--primary)" }}>{title}</h2>}
        {children}
        <button
          className="absolute top-3 right-3 px-2 py-1 rounded text-sm"
          style={{ background: "var(--danger)", color: "var(--surface)" }}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Modal;
