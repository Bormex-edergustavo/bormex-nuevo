"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AnyOrder } from "@/app/lib/types";
import { listenActiveServicios, updateOrder, deleteOrder } from "@/app/lib/orders";
import { estatusPorTiempo } from "@/app/lib/helpers";

export default function ProduccionesPage() {
  const [rows, setRows] = useState<AnyOrder[]>([]);
  const [q, setQ] = useState("");
  const [acabado, setAcabado] = useState<string>("all");
  const [status, setStatus] = useState<"all" | "A TIEMPO" | "PRÓXIMO" | "HOY" | "VENCIDO">("all");
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    const unsub = listenActiveServicios(setRows);
    return () => unsub();
  }, []);

  const allAcabados = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows as any[]) (r.acabados ?? []).forEach((a: string) => set.add(a));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows as any[])
      .filter((r) => (!s ? true : String(r.nombre ?? "").toLowerCase().includes(s) || String(r.numeroCliente ?? "").toLowerCase().includes(s) || String(r.telefono ?? "").toLowerCase().includes(s)))
      .filter((r) => (acabado === "all" ? true : (r.acabados ?? []).includes(acabado)))
      .filter((r) => (status === "all" ? true : estatusPorTiempo(r.fechaEntrega) === status))
      .sort((a, b) => String(a.fechaEntrega).localeCompare(String(b.fechaEntrega)));
  }, [rows, q, acabado, status]);

  const borrar = async (id: string) => {
    if (!confirm("¿Borrar definitivo este SERVICIO?")) return;
    await deleteOrder(id);
  };

  return (
    <main className="min-h-screen p-6 bg-neutral-950 text-neutral-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Producciones BORMEX (SERVICIO)</h1>
          <Link className="text-neutral-300 hover:text-white" href="/">Home</Link>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar: nombre / número / teléfono" className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
            <select value={acabado} onChange={(e) => setAcabado(e.target.value)} className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
              <option value="all">Acabado: todos</option>
              {allAcabados.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
              <option value="all">Entrega: todas</option>
              <option value="A TIEMPO">A TIEMPO</option>
              <option value="PRÓXIMO">PRÓXIMO</option>
              <option value="HOY">HOY</option>
              <option value="VENCIDO">VENCIDO</option>
            </select>
          </div>
          <div className="mt-2 text-sm text-neutral-400">Mostrando: {filtered.length}</div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          {filtered.map((r: any) => {
            const st = estatusPorTiempo(r.fechaEntrega);
            return (
              <div key={r.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{r.nombre}</div>
                    <div className="text-sm text-neutral-300">Cliente: {r.numeroCliente} · {r.telefono}</div>
                    <div className="text-sm text-neutral-400">Entrega: {r.fechaEntrega} · <span className="text-neutral-200">{st}</span></div>
                    <div className="mt-2 text-sm text-neutral-300">Acabados: <span className="text-neutral-400">{(r.acabados ?? []).join(", ") || "—"}</span></div>
                    {r.observaciones ? <div className="mt-1 text-sm text-neutral-300">Obs: <span className="text-neutral-400">{r.observaciones}</span></div> : null}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(r)} className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700">Editar</button>
                    <button onClick={() => borrar(r.id)} className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-black">BORRAR</button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="text-neutral-400 mt-8">No hay servicios.</div>}
        </div>
      </div>

      {editing && <EditServicio row={editing} onClose={() => setEditing(null)} />}
    </main>
  );
}

function EditServicio({ row, onClose }: { row: any; onClose: () => void }) {
  const [form, setForm] = useState<any>({
    nombre: row.nombre ?? "",
    numeroCliente: row.numeroCliente ?? "",
    telefono: row.telefono ?? "",
    fechaEntrega: row.fechaEntrega ?? "",
    acabados: row.acabados ?? [],
    observaciones: row.observaciones ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggle = (v: string) => {
    setForm((prev: any) => ({ ...prev, acabados: prev.acabados.includes(v) ? prev.acabados.filter((x: string) => x !== v) : [...prev.acabados, v] }));
  };

  const ACABADOS = ["Corte láser", "DTF", "Bordado", "Planillas sublimadas"];

  const save = async () => {
    setErr(null);
    if (!form.nombre.trim() || !form.numeroCliente.trim() || !form.telefono.trim() || !form.fechaEntrega) {
      setErr("Faltan datos.");
      return;
    }
    setSaving(true);
    try {
      await updateOrder(row.id, {
        nombre: form.nombre.trim(),
        numeroCliente: form.numeroCliente.trim(),
        telefono: form.telefono.trim(),
        fechaEntrega: form.fechaEntrega,
        acabados: form.acabados,
        observaciones: form.observaciones,
      });
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onMouseDown={onClose}>
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-5" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Editar SERVICIO</div>
          <button onClick={onClose} className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700">Cerrar</button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-neutral-300">Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
          </div>
          <div>
            <label className="text-sm text-neutral-300">Número de cliente</label>
            <input value={form.numeroCliente} onChange={(e) => setForm({ ...form, numeroCliente: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
          </div>
          <div>
            <label className="text-sm text-neutral-300">Teléfono</label>
            <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
          </div>
          <div>
            <label className="text-sm text-neutral-300">Fecha entrega</label>
            <input type="date" value={form.fechaEntrega} onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
          </div>

          <div>
            <div className="text-sm text-neutral-300">Acabados</div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACABADOS.map((a) => (
                <label key={a} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
                  <input type="checkbox" checked={form.acabados.includes(a)} onChange={() => toggle(a)} />
                  <span>{a}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-neutral-300">Observaciones</label>
            <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 min-h-[80px]" />
          </div>

          {err && <div className="text-sm text-amber-200">{err}</div>}

          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-medium disabled:opacity-60">
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button onClick={onClose} className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-black font-medium">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
