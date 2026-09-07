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
import { RefreshCw, CheckCircle2, XCircle, Mail, AlertTriangle } from "lucide-react";

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

  const [descartando, setDescartando] = useState<GastoAutomatico | null>(null);
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

  async function confirmarDescartar() {
    if (!descartando) return;
    setError(null);
    try {
      await descartarGastoAutomatico(descartando.id);
      setDescartando(null);
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
      <PageHeader
        title="Gastos pendientes"
        action={
          integracion?.conectado && (
            <Button
              onClick={handleProcesarAhora}
              disabled={procesando}
              icon={<RefreshCw size={16} className={procesando ? "animate-spin" : ""} />}
            >
              {procesando ? "Procesando..." : "Procesar ahora"}
            </Button>
          )
        }
      />

      {error && (
        <div className="rounded-md border border-down/30 bg-down/10 p-4 text-sm text-down">{error}</div>
      )}
      {aviso && (
        <div className="rounded-md border border-up/30 bg-up/10 p-4 text-sm text-up">{aviso}</div>
      )}

      {/* Conexión Gmail */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info">
            <Mail size={18} />
          </div>
          <h2 className="text-sm font-medium text-body">Conexión con Gmail</h2>
        </div>
        {integracion?.conectado ? (
          <div className="space-y-1 text-sm text-muted">
            <p>
              <span className="text-up">✓</span> Conectado a{" "}
              <span className="font-medium text-body">{integracion.email}</span>
            </p>
            <p>
              Última revisión:{" "}
              {integracion.ultima_revision
                ? new Date(integracion.ultima_revision).toLocaleString()
                : "aún no se procesa"}
            </p>
            <p className="text-xs text-muted">
              Los correos de BCP/Yape se revisan automáticamente cada 15 minutos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleConectar} className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Email de Gmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@gmail.com"
            />
            <Input
              label="App password"
              type="password"
              required
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={guardandoConexion}>
                {guardandoConexion ? "Conectando..." : "Conectar Gmail"}
              </Button>
              <p className="mt-2 text-xs text-muted">
                Se guarda cifrada en Supabase Vault. Crea la app password en myaccount.google.com (Seguridad → App passwords).
              </p>
            </div>
          </form>
        )}
      </Card>

      {/* Confirmar modal */}
      <Modal
        open={confirmando !== null}
        onClose={() => setConfirmando(null)}
        title="Confirmar gasto"
        size="lg"
      >
        <form onSubmit={handleConfirmar} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Monto (S/)"
              type="number"
              step="0.01"
              required
              value={formConfirmar.monto}
              onChange={(e) => setFormConfirmar({ ...formConfirmar, monto: e.target.value })}
            />
            <Input
              label="Fecha"
              type="date"
              required
              value={formConfirmar.fecha}
              onChange={(e) => setFormConfirmar({ ...formConfirmar, fecha: e.target.value })}
            />
          </div>
          <Input
            label="Comercio / Nota"
            type="text"
            value={formConfirmar.nota}
            onChange={(e) => setFormConfirmar({ ...formConfirmar, nota: e.target.value })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Tipo"
              value={formConfirmar.tipo}
              onChange={(e) => setFormConfirmar({ ...formConfirmar, tipo: e.target.value })}
            >
              <option value="fijo">🔁 Fijo</option>
              <option value="hormiga">🐜 Hormiga</option>
              <option value="variable">🛒 Variable</option>
            </Select>
            <Select
              label="Categoría"
              value={formConfirmar.categoria_id}
              onChange={(e) => setFormConfirmar({ ...formConfirmar, categoria_id: e.target.value })}
              required
            >
              <option value="">Seleccionar...</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icono_color} {c.nombre}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setConfirmando(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando} variant="up" icon={<CheckCircle2 size={14} />}>
              {guardando ? "Guardando..." : "Confirmar como gasto"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Descartar */}
      <ConfirmDialog
        open={descartando !== null}
        onConfirm={confirmarDescartar}
        onCancel={() => setDescartando(null)}
        title="Descartar gasto"
        message={`¿Descartar "${descartando?.comercio || "este gasto"}"? El correo quedará registrado como procesado pero no se guardará como gasto.`}
        confirmLabel="Descartar"
      />

      {/* Lista de pendientes */}
      <Card padding="none">
        <div className="border-b border-hairline px-4 py-3">
          <h2 className="text-sm font-medium text-body">Pendientes de revisión</h2>
        </div>
        {cargando ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : pendientesOk.length === 0 ? (
          <EmptyState
            icon={<Mail size={28} className="text-muted" />}
            title="No hay gastos pendientes"
            description="Los correos BCP detectados aparecerán aquí"
          />
        ) : (
          <div className="divide-y divide-hairline">
            {pendientesOk.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-4 hover:bg-surface-elevated/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-body">{p.comercio}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                    <Badge variant="neutral">{TIPO_LABELS[p.tipo_gasto_sugerido || "variable"]}</Badge>
                    {p.fecha ? <span>{new Date(p.fecha).toLocaleDateString()}</span> : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-sm font-semibold text-down">-{formatearMoneda(Number(p.monto))}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => abrirConfirmar(p)}
                    className="text-up hover:text-up"
                  >
                    <CheckCircle2 size={15} className="mr-1" /> Confirmar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDescartando(p)}
                    className="text-muted hover:text-down"
                  >
                    <XCircle size={15} className="mr-1" /> Descartar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Correos no parseables */}
      {erroresParseo.length > 0 && (
        <Card padding="none">
          <div className="border-b border-hairline px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-primary" />
              <h2 className="text-sm font-medium text-body">
                Correos no parseables ({erroresParseo.length})
              </h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              No se pudo extraer monto o comercio. Revisa el contenido crudo para procesarlos manualmente.
            </p>
          </div>
          <div className="divide-y divide-hairline">
            {erroresParseo.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-primary">{p.parse_error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDescartando(p)}
                    className="shrink-0 text-muted hover:text-down"
                  >
                    <XCircle size={14} className="mr-1" /> Descartar
                  </Button>
                </div>
                {p.cuerpo_html && (
                  <p className="mt-2 line-clamp-3 text-xs text-muted">{p.cuerpo_html}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}