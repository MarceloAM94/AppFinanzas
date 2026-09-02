"use client";

import { useEffect, useState } from "react";
import { formatearMoneda } from "@/utils/formatters";
import {
  obtenerGastosFijos,
  agregarGastoFijo,
  desactivarGastoFijo,
  pagarGastoFijo,
} from "@/lib/actions/gastos-fijos";
import { obtenerCategorias } from "@/lib/actions/categorias";
import type { GastoFijo, Categoria } from "@/types";
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
import { Plus, Check, Power, CalendarDays } from "lucide-react";

const FRECUENCIAS = [
  { value: "mensual", label: "Mensual", icono: "🔁" },
  { value: "quincenal", label: "Quincenal", icono: "🔄" },
  { value: "semanal", label: "Semanal", icono: "⚡" },
] as const;

const FRECUENCIA_LABEL: Record<string, string> = {
  mensual: "Mensual",
  quincenal: "Quincenal",
  semanal: "Semanal",
};

const emptyForm = {
  nombre: "",
  monto_estimado: "",
  categoria_id: "",
  dia_del_mes: "1",
  frecuencia: "mensual" as "semanal" | "quincenal" | "mensual",
};

export default function GastosFijosPage() {
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pagando, setPagando] = useState<GastoFijo | null>(null);
  const [desactivando, setDesactivando] = useState<GastoFijo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    const [gf, c] = await Promise.all([obtenerGastosFijos(), obtenerCategorias()]);
    setGastosFijos(gf as GastoFijo[]);
    setCategorias(c as Categoria[]);
    setCargando(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      await agregarGastoFijo(
        form.nombre,
        parseFloat(form.monto_estimado),
        form.categoria_id,
        parseInt(form.dia_del_mes),
        form.frecuencia
      );
      setForm(emptyForm);
      setShowForm(false);
      setGuardando(false);
      await cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      setGuardando(false);
    }
  }

  async function confirmarPagar() {
    if (!pagando) return;
    setError(null);
    try {
      await pagarGastoFijo(pagando.id);
      setPagando(null);
      await cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al pagar");
    }
  }

  async function confirmarDesactivar() {
    if (!desactivando) return;
    await desactivarGastoFijo(desactivando.id);
    setDesactivando(null);
    await cargar();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gastos Fijos"
        action={
          <Button onClick={() => { setShowForm(true); setError(null); }} icon={<Plus size={16} />}>
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
        title="Nuevo Gasto Fijo"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            type="text"
            required
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Ej: Alquiler"
          />
          <Input
            label="Monto estimado (S/)"
            type="number"
            step="0.01"
            required
            value={form.monto_estimado}
            onChange={(e) => setForm({ ...form, monto_estimado: e.target.value })}
          />
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
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Frecuencia"
              value={form.frecuencia}
              onChange={(e) => setForm({ ...form, frecuencia: e.target.value as typeof form.frecuencia })}
            >
              {FRECUENCIAS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.icono} {f.label}
                </option>
              ))}
            </Select>
            <Input
              label="Día del mes"
              type="number"
              min="1"
              max="31"
              required
              value={form.dia_del_mes}
              onChange={(e) => setForm({ ...form, dia_del_mes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando}>
              {guardando ? "Guardando..." : "Agregar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pagar */}
      <ConfirmDialog
        open={pagando !== null}
        onConfirm={confirmarPagar}
        onCancel={() => setPagando(null)}
        title="Registrar pago"
        message={`¿Registrar "${pagando?.nombre}" por ${formatearMoneda(Number(pagando?.monto_estimado) || 0)} como pagado?`}
        confirmLabel="Pagar"
        danger={false}
      />

      {/* Desactivar */}
      <ConfirmDialog
        open={desactivando !== null}
        onConfirm={confirmarDesactivar}
        onCancel={() => setDesactivando(null)}
        title="Desactivar gasto fijo"
        message={`¿Desactivar "${desactivando?.nombre}"?`}
        confirmLabel="Desactivar"
      />

      <Card padding="none">
        {cargando ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : gastosFijos.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={28} className="text-muted" />}
            title="No hay gastos fijos configurados"
            description="Presiona + Nuevo para agregar uno"
          />
        ) : (
          <div className="divide-y divide-hairline">
            {gastosFijos.map((gf) => {
              const freq = FRECUENCIA_LABEL[gf.frecuencia] || "Mensual";
              return (
                <div key={gf.id} className="flex flex-col gap-3 p-4 hover:bg-surface-elevated/50 transition-colors sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-body">{gf.nombre}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span>Día {gf.dia_del_mes}</span>
                      <Badge variant="neutral">{freq}</Badge>
                      <span className={gf.activo ? "text-up" : "text-muted"}>
                        {gf.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-body">
                      {formatearMoneda(Number(gf.monto_estimado))}
                    </span>
                    {gf.activo && (
                      <>
                        {gf.pagado ? (
                          <Badge variant="up">
                            <Check size={12} className="mr-1" /> Pagado
                          </Badge>
                        ) : (
                          <Button
                            variant="up"
                            size="sm"
                            onClick={() => setPagando(gf)}
                            icon={<Check size={14} />}
                          >
                            Pagar
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDesactivando(gf)}
                          icon={<Power size={14} />}
                        >
                          Desactivar
                        </Button>
                      </>
                    )}
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
