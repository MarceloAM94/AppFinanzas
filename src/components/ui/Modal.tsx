"use client";

import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import Button from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay-backdrop flex items-center justify-center" onClick={onClose}>
      <div
        className="animate-fade-slide-in w-full max-w-lg rounded-lg bg-surface-elevated border border-hairline p-6 shadow-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-body">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={16} />} />
        </div>
        {children}
      </div>
    </div>
  );
}
