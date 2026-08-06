"use client";

import { useEffect, useState } from "react";
import { formatearMoneda } from "@/utils/formatters";
import {
  obtenerGastosPendientes,
  obtenerEstadoIntegracion,
  guardarCredencialImap,
  confirmarGastoAutomatico,
  descartarGastoAutomatico,
  procesarAhora,
} from "@/lib/actions/gastos-automaticos";
import { obtenerCategorias } from "@/lib/actions/categorias";
import type { GastoAutomatico, Integracion, Categoria } from "@/types";

const TIPO_LABELS: Record<string, string> = { fijo: "🔁 Fijo", hormiga: "🐜 Hormiga", variable: "🛒 Variable" };

export default function GastosPendientesPage() {
  const [pendientes, setPendientes] = useState<GastoAutomatico[]>([]);
  const [integracion, setIntegracion] = useState<Integracion | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [guardandoConexion, setGuardandoConexion] = useState(false);

  const [confirmando, setConfirmando] = useState<GastoAutomatico | null>(null);
  const [formConfirmar, setFormConfirmar] = useState({
    monto: "",
    tipo: "variable",
    categoria_id: "",
    fecha: "",
    nota: "",
  });
  const [guardando, setGuardando] = useState(false);

  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const [p, i, c] = await Promise.all([
        obtenerGastosPendientes(),
        obtenerEstadoIntegracion(),
        obtenerCategorias(),
      ]);
      setPendientes(p);
      setIntegracion(i);
      setCategorias(c as Categoria[]);
    } catch {
      setError("Error al cargar los gastos pendientes");
    }
    setCargando(false);
  }

  async function handleConectar(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoConexion(true);
    setError(null);
    setAviso(null);
    try {
      await guardarCredencialImap(email, appPassword);
      setEmail("");
      setAppPassword("");
      setAviso("Gmail conectado correctamente");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar");
    }
    setGuardandoConexion(false);
  }

  function abrirConfirmar(pendiente: GastoAutomatico) {
    setConfirmando(pendiente);
    setFormConfirmar({
      monto: String(pendiente.monto ?? ""),
      tipo: pendiente.tipo_gasto_sugerido || "variable",
      categoria_id: "",
      fecha: pendiente.fecha ? pendiente.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
      nota: pendiente.comercio || "",
    });
  }

  async function handleConfirmar(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmando) return;
    setGuardando(true);
    setError(null);
    try {
      await confirmarGastoAutomatico(confirmando.id, {
        monto: parseFloat(formConfirmar.monto),
        tipo: formConfirmar.tipo as "fijo" | "hormiga" | "variable",
        categoria_id: formConfirmar.categoria_id,
        fecha: formConfirmar.fecha,
        nota: formConfirmar.nota || undefined,
      });
      setConfirmando(null);
      setAviso("Gasto confirmado");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al confirmar");
    }
    setGuardando(false);
  }

  async function handleDescartar(pendiente: GastoAutomatico) {
    if (!confirm(`¿Descartar "${pendiente.comercio || "este gasto"}"?`)) return;
    setError(null);
    try {
      await descartarGastoAutomatico(pendiente.id);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al descartar");
    }
  }

  async function handleProcesarAhora() {
    setProcesando(true);
    setError(null);
    setAviso(null);
    try {
      const r = await procesarAhora();
      if (!r.ok) {
        setError("No hay credenciales de Gmail configuradas");
      } else {
        setAviso(
          `Revisados ${r.revisados}: ${r.gastosNuevos} nuevos, ${r.ingresos} ingresos, ${r.noParseables} no parseables`
        );
      }
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar");
    }
    setProcesando(false);
  }

  const pendientesOk = pendientes.filter((p) => p.estado === "pendiente");
  const erroresParseo = pendientes.filter((p) => p.estado === "error_parseo");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gastos pendientes</h1>
        {integracion?.conectado && (
          <button
            onClick={handleProcesarAhora}
            disabled={procesando}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {procesando ? "Procesando..." : "Procesar ahora"}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
      {aviso && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">{aviso}</div>
      )}

      {/* Conexión Gmail */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Conexión con Gmail</h2>
        {integracion?.conectado ? (
          <div className="mt-3 space-y-1 text-sm text-gray-600">
            <p>✅ Conectado a <span className="font-medium">{integracion.email}</span></p>
            <p>Última revisión: {integracion.ultima_revision ? new Date(integracion.ultima_revision).toLocaleString() : "aún no se procesa"}</p>
            <p className="text-xs text-gray-400">
              Los correos de BCP/Yape se revisan automáticamente cada 15 minutos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleConectar} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email de Gmail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@gmail.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">App password</label>
              <input
                type="password"
                required
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={guardandoConexion}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {guardandoConexion ? "Conectando..." : "Conectar Gmail"}
              </button>
              <p className="mt-2 text-xs text-gray-400">
                Se guarda cifrada en Supabase Vault. Crea la app password en myaccount.google.com (Seguridad → App passwords).
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Confirmar modal */}
      {confirmando && (
        <form onSubmit={handleConfirmar} className="animate-fade-slide-in rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Confirmar gasto</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Monto (S/)</label>
              <input
                type="number" step="0.01" required value={formConfirmar.monto}
                onChange={(e) => setFormConfirmar({ ...formConfirmar, monto: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Comercio / Nota</label>
              <input
                type="text" value={formConfirmar.nota}
                onChange={(e) => setFormConfirmar({ ...formConfirmar, nota: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
              <select
                value={formConfirmar.tipo}
                onChange={(e) => setFormConfirmar({ ...formConfirmar, tipo: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="fijo">🔁 Fijo</option>
                <option value="hormiga">🐜 Hormiga</option>
                <option value="variable">🛒 Variable</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Categoría</label>
              <select
                value={formConfirmar.categoria_id}
                onChange={(e) => setFormConfirmar({ ...formConfirmar, categoria_id: e.target.value })}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Seleccionar...</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.icono_color} {c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date" required value={formConfirmar.fecha}
                onChange={(e) => setFormConfirmar({ ...formConfirmar, fecha: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit" disabled={guardando}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Confirmar como gasto"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(null)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de pendientes */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold text-gray-800">Pendientes de revisión</h2>
        </div>
        {cargando ? (
          <div className="p-6 text-center text-gray-400">Cargando...</div>
        ) : pendientesOk.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-400">No hay gastos pendientes</p>
            <p className="mt-1 text-xs text-gray-300">Los correos BCP detectados aparecerán aquí</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendientesOk.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-gray-900">{p.comercio}</div>
                  <div className="text-sm text-gray-500">
                    {TIPO_LABELS[p.tipo_gasto_sugerido || "variable"]}
                    {p.fecha ? ` • ${new Date(p.fecha).toLocaleDateString()}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="font-semibold text-red-600">-{formatearMoneda(Number(p.monto))}</span>
                  <button
                    onClick={() => abrirConfirmar(p)}
                    className="rounded-lg px-2 py-1.5 text-sm text-green-700 hover:bg-green-50"
                  >
                    ✓ Confirmar
                  </button>
                  <button
                    onClick={() => handleDescartar(p)}
                    className="rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Correos no parseables */}
      {erroresParseo.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 shadow-sm">
          <div className="border-b border-orange-200 px-4 py-3">
            <h2 className="font-semibold text-orange-800">
              Correos no parseables ({erroresParseo.length})
            </h2>
            <p className="text-xs text-orange-600">
              No se pudo extraer monto o comercio. Revisa el contenido crudo para procesarlos manualmente.
            </p>
          </div>
          <div className="divide-y divide-orange-100">
            {erroresParseo.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-orange-800">{p.parse_error}</p>
                  <button
                    onClick={() => handleDescartar(p)}
                    className="shrink-0 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-orange-100"
                  >
                    Descartar
                  </button>
                </div>
                {p.cuerpo_html && (
                  <p className="mt-2 line-clamp-3 text-xs text-orange-700/70">{p.cuerpo_html}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
