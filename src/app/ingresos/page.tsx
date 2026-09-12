"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { formatearMoneda } from "@/utils/formatters";
import { obtenerIngresos, agregarIngreso, editarIngreso, eliminarIngreso } from "@/lib/actions/ingresos";
import type { Ingreso } from "@/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Skeleton from "@/components/ui/Skeleton";
import { Plus, Pencil, Trash2, Banknote } from "lucide-react";

const emptyForm = { monto: "", descripcion: "", fecha: "" };

export default function IngresosPage() {
  const { mesActual, anioActual } = useAppStore();
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<Ingreso | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesActual, anioActual]);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerIngresos(mesActual, anioActual);
      setIngresos(data as Ingreso[]);
    } catch {
      setError("Error al cargar ingresos");
    }
    setCargando(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    if (editando) {
      await editarIngreso(editando, { monto: parseFloat(form.monto), descripcion: form.descripcion });
    } else {
      await agregarIngreso(parseFloat(form.monto), form.descripcion, form.fecha);
    }
    setForm(emptyForm);
    setEditando(null);
    setShowForm(false);
    setGuardando(false);
    await cargar();
  }

  async function confirmarEliminar() {
    if (!eliminando) return;
    await eliminarIngreso(eliminando.id);
    setEliminando(null);
    await cargar();
  }

  function iniciarEdicion(ingreso: Ingreso) {
    setForm({
      monto: String(ingreso.monto),
      descripcion: ingreso.descripcion,
      fecha: ingreso.fecha,
    });
    setEditando(ingreso.id);
    setShowForm(true);
  }

  function abrirNuevo() {
    setEditando(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingresos"
        action={
          <Button onClick={abrirNuevo} icon={<Plus size={16} />}>
            Nuevo
          </Button>
        }
      />

      {error && (
        <div className="rounded-md border border-down/30 bg-down/10 p-4 text-sm text-down">
          {error}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editando ? "Editar Ingreso" : "Nuevo Ingreso"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Monto (S/)"
              type="number"
              step="0.01"
              required
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
            />
            <Input
              label="Fecha"
              type="date"
              required
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            />
          </div>
          <Input
            label="Descripción"
            type="text"
            required
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : editando ? "Guardar" : "Agregar"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={eliminando !== null}
        onConfirm={confirmarEliminar}
        onCancel={() => setEliminando(null)}
        title="Eliminar ingreso"
        message={`¿Eliminar "${eliminando?.descripcion || "este ingreso"}" por ${formatearMoneda(Number(eliminando?.monto) || 0)}? Esta acción no se puede deshacer.`}
      />

      <Card padding="none">
        {cargando ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : ingresos.length === 0 ? (
          <EmptyState
            icon={<Banknote size={28} className="text-muted" />}
            title="No hay ingresos este mes"
            description="Presiona + Nuevo para agregar uno"
          />
        ) : (
          <div className="divide-y divide-hairline">
            {ingresos.map((ing) => (
              <div key={ing.id} className="flex items-center justify-between gap-3 p-4 hover:bg-surface-elevated/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-body">{ing.descripcion}</div>
                  <div className="mt-0.5 text-xs text-muted">{ing.fecha}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-sm font-semibold text-up">
                    {formatearMoneda(Number(ing.monto))}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => iniciarEdicion(ing)}
                    icon={<Pencil size={15} />}
                    className="text-muted hover:text-body"
                  >
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEliminando(ing)}
                    icon={<Trash2 size={15} />}
                    className="text-muted hover:text-down"
                  >
                    <span className="sr-only">Eliminar</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
