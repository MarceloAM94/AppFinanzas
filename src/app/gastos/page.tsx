"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { formatearMoneda } from "@/utils/formatters";
import { obtenerGastos, agregarGasto, editarGasto, eliminarGasto } from "@/lib/actions/gastos";
import { obtenerCategorias } from "@/lib/actions/categorias";
import type { Gasto, Categoria } from "@/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { Plus, Pencil, Trash2, ReceiptText } from "lucide-react";

const TIPO_INFO: Record<string, { label: string; badge: "neutral" | "primary" | "info" }> = {
  fijo: { label: "🔁 Fijo", badge: "neutral" },
  hormiga: { label: "🐜 Hormiga", badge: "primary" },
  variable: { label: "🛒 Variable", badge: "info" },
};

const emptyForm = { monto: "", tipo: "variable", categoria_id: "", fecha: "", nota: "" };

export default function GastosPage() {
  const { mesActual, anioActual } = useAppStore();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState<Gasto | null>(null);
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
      const [g, c] = await Promise.all([
        obtenerGastos(mesActual, anioActual),
        obtenerCategorias(),
      ]);
      setGastos(g as Gasto[]);
      setCategorias(c as Categoria[]);
    } catch {
      setError("Error al cargar gastos");
    }
    setCargando(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    const datos = {
      monto: parseFloat(form.monto),
      tipo: form.tipo as "fijo" | "hormiga" | "variable",
      categoria_id: form.categoria_id,
      fecha: form.fecha,
      nota: form.nota || undefined,
    };
    if (editando) {
      await editarGasto(editando, datos);
    } else {
      await agregarGasto(datos.monto, datos.tipo, datos.categoria_id, datos.fecha, datos.nota);
    }
    setForm(emptyForm);
    setEditando(null);
    setShowForm(false);
    setGuardando(false);
    await cargar();
  }

  async function confirmarEliminar() {
    if (!eliminando) return;
    await eliminarGasto(eliminando.id);
    setEliminando(null);
    await cargar();
  }

  function iniciarEdicion(gasto: Gasto) {
    setForm({
      monto: String(gasto.monto),
      tipo: gasto.tipo,
      categoria_id: gasto.categoria_id,
      fecha: gasto.fecha,
      nota: gasto.nota || "",
    });
    setEditando(gasto.id);
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
        title="Gastos"
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
        title={editando ? "Editar Gasto" : "Nuevo Gasto"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Monto (S/)"
            type="number"
            step="0.01"
            required
            value={form.monto}
            onChange={(e) => setForm({ ...form, monto: e.target.value })}
          />
          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="fijo">🔁 Fijo</option>
            <option value="hormiga">🐜 Hormiga</option>
            <option value="variable">🛒 Variable</option>
          </Select>
          <Select
            label="Categoría"
            value={form.categoria_id}
            onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
            required
          >
            <option value="">Seleccionar...</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icono_color} {c.nombre}
              </option>
            ))}
          </Select>
          <Input
            label="Fecha"
            type="date"
            required
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
          />
          <Input
            label="Nota (opcional)"
            type="text"
            value={form.nota}
            onChange={(e) => setForm({ ...form, nota: e.target.value })}
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
        title="Eliminar gasto"
        message={`¿Eliminar "${eliminando?.nota || "este gasto"}" por ${formatearMoneda(Number(eliminando?.monto) || 0)}? Esta acción no se puede deshacer.`}
      />

      <Card padding="none">
        {cargando ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : gastos.length === 0 ? (
          <EmptyState
            icon={<ReceiptText size={28} className="text-muted" />}
            title="No hay gastos este mes"
            description="Presiona + Nuevo para agregar uno"
          />
        ) : (
          <div className="divide-y divide-hairline">
            {gastos.map((g) => {
              const info = TIPO_INFO[g.tipo];
              return (
                <div key={g.id} className="flex items-center justify-between gap-3 p-4 hover:bg-surface-elevated/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-body">
                      {g.nota || "Gasto"}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                      <Badge variant={info.badge}>{info.label}</Badge>
                      <span>{g.fecha}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-sm font-semibold text-down">
                      -{formatearMoneda(Number(g.monto))}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => iniciarEdicion(g)}
                      icon={<Pencil size={15} />}
                      className="text-muted hover:text-body"
                    >
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEliminando(g)}
                      icon={<Trash2 size={15} />}
                      className="text-muted hover:text-down"
                    >
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
