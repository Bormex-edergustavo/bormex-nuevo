"use client";

import { useState } from "react";
import Link from "next/link";
import { createServicioOrder } from "@/app/lib/orders";

const ACABADOS = ["Corte láser", "DTF", "Bordado", "Planillas sublimadas"] as const;

export default function AgregarServicioPage() {
  const [nombre, setNombre] = useState("");
  const [numeroCliente, setNumeroCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [acabados, setAcabados] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const toggle = (v: string) => {
    setAcabados((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  };

  const guardar = async () => {
    setMsg(null);
    if (!nombre.trim() || !numeroCliente.trim() || !telefono.trim() || !fechaEntrega) {
      setMsg("Falta completar: nombre, número de cliente, teléfono y fecha.");
      return;
    }
    setSaving(true);
    try {
      await createServicioOrder({ nombre: nombre.trim(), numeroCliente: numeroCliente.trim(), telefono: telefono.trim(), acabados, observaciones, fechaEntrega });
      setMsg("Guardado. Ya aparece en Producciones en tiempo real.");
      setNombre("");
      setNumeroCliente("");
      setTelefono("");
      setAcabados([]);
      setObservaciones("");
      setFechaEntrega("");
    } catch (e: any) {
      setMsg(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen p-6 bg-neutral-950 text-neutral-100">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Agregar SERVICIO</h1>
          <Link className="text-neutral-300 hover:text-white" href="/">Volver</Link>
        </div>

        <div className="mt-6 p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div>
            <label className="text-sm text-neutral-300">Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
          </div>

          <div>
            <label className="text-sm text-neutral-300">Número de cliente</label>
            <input value={numeroCliente} onChange={(e) => setNumeroCliente(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
          </div>

          <div>
            <label className="text-sm text-neutral-300">Teléfono</label>
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
          </div>

          <div>
            <div className="text-sm text-neutral-300">Acabado (multi)</div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACABADOS.map((a) => (
                <label key={a} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
                  <input type="checkbox" checked={acabados.includes(a)} onChange={() => toggle(a)} />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-neutral-300">Observaciones</label>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 min-h-[90px]" />
          </div>

          <div>
            <label className="text-sm text-neutral-300">Fecha de entrega</label>
            <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
          </div>

          {msg && <div className="text-sm text-amber-200">{msg}</div>}

          <div className="flex gap-2">
            <button onClick={guardar} disabled={saving} className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-medium disabled:opacity-60">
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <Link href="/" className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-black font-medium">
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
