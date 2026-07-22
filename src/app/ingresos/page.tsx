"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { formatearMoneda } from "@/utils/formatters";
import { obtenerIngresos, agregarIngreso, editarIngreso, eliminarIngreso } from "@/lib/actions/ingresos";
import type { Ingreso } from "@/types";

export default function IngresosPage() {
  const { mesActual, anioActual } = useAppStore();
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState({ monto: "", descripcion: "", fecha: "" });

  useEffect(() => {
    cargar();
  }, [mesActual, anioActual]);

  async function cargar() {
    setCargando(true);
    const data = await obtenerIngresos(mesActual, anioActual);
    setIngresos(data as Ingreso[]);
    setCargando(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editando) {
      await editarIngreso(editando, { monto: parseFloat(form.monto), descripcion: form.descripcion });
    } else {
      await agregarIngreso(parseFloat(form.monto), form.descripcion, form.fecha);
    }
    setForm({ monto: "", descripcion: "", fecha: "" });
    setEditando(null);
    setShowForm(false);
    await cargar();
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este ingreso?")) return;
    await eliminarIngreso(id);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ingresos</h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditando(null); setForm({ monto: "", descripcion: "", fecha: "" }); }}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          + Nuevo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">{editando ? "Editar Ingreso" : "Nuevo Ingreso"}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Monto (S/)</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Descripción</label>
              <input
                type="text"
                required
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              {editando ? "Guardar" : "Agregar"}
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
        ) : ingresos.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No hay ingresos este mes</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ingresos.map((ing) => (
              <div key={ing.id} className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-gray-900">{ing.descripcion}</div>
                  <div className="text-sm text-gray-500">{ing.fecha}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="font-semibold text-green-600">{formatearMoneda(Number(ing.monto))}</span>
                  <button onClick={() => iniciarEdicion(ing)} className="flex h-11 w-11 items-center justify-center rounded-lg text-sm text-blue-600 hover:bg-blue-50 active:bg-blue-100">✏️</button>
                  <button onClick={() => handleEliminar(ing.id)} className="flex h-11 w-11 items-center justify-center rounded-lg text-sm text-red-600 hover:bg-red-50 active:bg-red-100">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
