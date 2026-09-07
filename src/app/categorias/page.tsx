"use client";

import { useEffect, useState } from "react";
import { obtenerCategorias, agregarCategoria, desactivarCategoria } from "@/lib/actions/categorias";
import type { Categoria } from "@/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { Plus, Power, Tags } from "lucide-react";

const emptyForm = { nombre: "", icono_color: "" };

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [desactivando, setDesactivando] = useState<Categoria | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerCategorias();
      setCategorias(data as Categoria[]);
    } catch {
      setError("Error al cargar categorías");
    }
    setCargando(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    await agregarCategoria(form.nombre, form.icono_color || undefined);
    setForm(emptyForm);
    setShowForm(false);
    setGuardando(false);
    await cargar();
  }

  async function confirmarDesactivar() {
    if (!desactivando) return;
    await desactivarCategoria(desactivando.id);
    setDesactivando(null);
    await cargar();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías"
        action={
          <Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>
            Nueva
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
        title="Nueva Categoría"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nombre"
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <Input
              label="Icono (emoji)"
              type="text"
              placeholder="🍎"
              value={form.icono_color}
              onChange={(e) => setForm({ ...form, icono_color: e.target.value })}
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

      <ConfirmDialog
        open={desactivando !== null}
        onConfirm={confirmarDesactivar}
        onCancel={() => setDesactivando(null)}
        title="Desactivar categoría"
        message={`¿Desactivar "${desactivando?.nombre}"? Las categorías inactivas no se muestran en los formularios.`}
        confirmLabel="Desactivar"
      />

      <Card padding="none">
        {cargando ? (
          <div className="space-y-2 p-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : categorias.length === 0 ? (
          <EmptyState
            icon={<Tags size={28} className="text-muted" />}
            title="No hay categorías"
            description="Presiona + Nueva para agregar una"
          />
        ) : (
          <div className="divide-y divide-hairline">
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between gap-3 p-4 hover:bg-surface-elevated/50 transition-colors">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-elevated text-lg">
                    {cat.icono_color || "📁"}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-body">{cat.nombre}</div>
                    <div className="mt-0.5">
                      {cat.activo ? (
                        <Badge variant="up">Activa</Badge>
                      ) : (
                        <Badge variant="neutral">Inactiva</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {cat.activo && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDesactivando(cat)}
                    icon={<Power size={14} />}
                  >
                    Desactivar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
