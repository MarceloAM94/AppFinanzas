"use client";

import { AlertTriangle } from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = "Confirmar",
  message,
  confirmLabel = "Eliminar",
  danger = true,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="flex items-start gap-3 mb-6">
        {danger && (
          <div className="mt-0.5 rounded-full bg-down/10 p-2 shrink-0">
            <AlertTriangle size={18} className="text-down" />
          </div>
        )}
        <p className="text-sm text-muted-strong">{message}</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          size="sm"
          onClick={onConfirm}
          icon={danger ? <AlertTriangle size={14} /> : undefined}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
