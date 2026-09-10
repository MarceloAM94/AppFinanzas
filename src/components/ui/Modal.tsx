"use client";

import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import Button from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "md" | "lg";
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const maxW = size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div className="overlay-backdrop flex items-center justify-center" onClick={onClose}>
      <div
        className={`animate-fade-slide-in w-full ${maxW} rounded-lg bg-surface-elevated border border-hairline p-6 shadow-2xl mx-4 max-h-[90dvh] overflow-y-auto`}
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
