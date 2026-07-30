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

const FRECUENCIAS = [
  { value: "mensual", label: "Mensual", icono: "🔁" },
  { value: "quincenal", label: "Quincenal", icono: "🔄" },
  { value: "semanal", label: "Semanal", icono: "⚡" },
] as const;

const FRECUENCIA_MAP: Record<string, { label: string; icono: string }> = {
  mensual: { label: "Mensual", icono: "🔁" },
  quincenal: { label: "Quincenal", icono: "🔄" },
  semanal: { label: "Semanal", icono: "⚡" },
};

export default function GastosFijosPage() {
  const [gastosFijos, setGastosFijos] = useState<GastoFijo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    monto_estimado: "",
    categoria_id: "",
    dia_del_mes: "1",
    frecuencia: "mensual" as "semanal" | "quincenal" | "mensual",
  });

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
      setForm({ nombre: "", monto_estimado: "", categoria_id: "", dia_del_mes: "1", frecuencia: "mensual" });
      setShowForm(false);
      setGuardando(false);
      await cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
      setGuardando(false);
    }
  }

  async function handlePagar(id: string) {
    setError(null);
    if (!confirm("¿Registrar este gasto fijo como pagado?")) return;
    try {
      await pagarGastoFijo(id);
      await cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al pagar");
    }
  }

  async function handleDesactivar(id: string) {
    if (!confirm("¿Desactivar este gasto fijo?")) return;
    await desactivarGastoFijo(id);
    await cargar();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gastos Fijos</h1>
        <button
          onClick={() => { setShowForm(!showForm); setError(null); }}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          + Nuevo
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="animate-fade-slide-in rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Nuevo Gasto Fijo</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
              <input type="text" required value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Ej: Alquiler" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Monto estimado (S/)</label>
              <input type="number" step="0.01" required value={form.monto_estimado}
                onChange={(e) => setForm({ ...form, monto_estimado: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categoría</label>
              <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="">Seleccionar...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.icono_color} {c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Frecuencia</label>
              <select value={form.frecuencia} onChange={(e) => setForm({ ...form, frecuencia: e.target.value as typeof form.frecuencia })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {FRECUENCIAS.map((f) => (
                  <option key={f.value} value={f.value}>{f.icono} {f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Día del mes</label>
              <input type="number" min="1" max="31" required value={form.dia_del_mes}
                onChange={(e) => setForm({ ...form, dia_del_mes: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={guardando} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">
              {guardando ? "Guardando..." : "Agregar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {cargando ? (
          <div className="p-6 text-center text-gray-400">Cargando...</div>
        ) : gastosFijos.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-400">No hay gastos fijos configurados</p>
            <p className="mt-1 text-xs text-gray-300">Presiona <strong>+ Nuevo</strong> para agregar uno</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {gastosFijos.map((gf) => {
              const freq = FRECUENCIA_MAP[gf.frecuencia] || FRECUENCIA_MAP.mensual;
              return (
                <div key={gf.id} className="flex flex-col gap-3 p-4 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-gray-900">{gf.nombre}</div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span>Día {gf.dia_del_mes}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {freq.icono} {freq.label}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span>{gf.activo ? "🟢 Activo" : "🔴 Inactivo"}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-purple-600">{formatearMoneda(Number(gf.monto_estimado))}</span>
                    {gf.activo && (
                      <>
                        {gf.pagado ? (
                          <span className="rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-600">
                            ✅ Pagado
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePagar(gf.id)}
                            className="min-h-[44px] rounded-lg bg-green-100 px-4 py-2 text-xs font-medium text-green-700 hover:bg-green-200 active:bg-green-300"
                          >
                            💳 Pagar
                          </button>
                        )}
                        <button
                          onClick={() => handleDesactivar(gf.id)}
                          className="min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 active:bg-gray-300"
                        >
                          Desactivar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
