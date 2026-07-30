"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { formatearMoneda } from "@/utils/formatters";
import { obtenerGastos, agregarGasto, editarGasto, eliminarGasto } from "@/lib/actions/gastos";
import { obtenerCategorias } from "@/lib/actions/categorias";
import type { Gasto, Categoria } from "@/types";

export default function GastosPage() {
  const { mesActual, anioActual } = useAppStore();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ monto: "", tipo: "variable", categoria_id: "", fecha: "", nota: "" });

  useEffect(() => {
    cargar();
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
    setForm({ monto: "", tipo: "variable", categoria_id: "", fecha: "", nota: "" });
    setEditando(null);
    setShowForm(false);
    setGuardando(false);
    await cargar();
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return;
    await eliminarGasto(id);
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

  const TIPO_LABELS: Record<string, string> = { fijo: "🔁 Fijo", hormiga: "🐜 Hormiga", variable: "🛒 Variable" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm({ monto: "", tipo: "variable", categoria_id: "", fecha: "", nota: "" }); }}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
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
          <h2 className="mb-4 text-lg font-semibold">{editando ? "Editar Gasto" : "Nuevo Gasto"}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Monto (S/)</label>
              <input type="number" step="0.01" required value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="fijo">🔁 Fijo</option>
                <option value="hormiga">🐜 Hormiga</option>
                <option value="variable">🛒 Variable</option>
              </select>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
              <input type="date" required value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nota (opcional)</label>
              <input type="text" value={form.nota}
                onChange={(e) => setForm({ ...form, nota: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={guardando} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
              {guardando ? "Guardando..." : editando ? "Guardar" : "Agregar"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditando(null); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {cargando ? (
          <div className="p-6 text-center text-gray-400">Cargando...</div>
        ) : gastos.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-400">No hay gastos este mes</p>
            <p className="mt-1 text-xs text-gray-300">Presiona <strong>+ Nuevo</strong> para agregar uno</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {gastos.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-gray-900">{g.nota || "Gasto"}</div>
                  <div className="text-sm text-gray-500">
                    {TIPO_LABELS[g.tipo]} • {g.fecha}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="font-semibold text-red-600">-{formatearMoneda(Number(g.monto))}</span>
                  <button onClick={() => iniciarEdicion(g)} className="flex h-11 w-11 items-center justify-center rounded-lg text-sm text-blue-600 hover:bg-blue-50 active:bg-blue-100 md:h-9 md:w-9">✏️</button>
                  <button onClick={() => handleEliminar(g.id)} className="flex h-11 w-11 items-center justify-center rounded-lg text-sm text-red-600 hover:bg-red-50 active:bg-red-100 md:h-9 md:w-9">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
