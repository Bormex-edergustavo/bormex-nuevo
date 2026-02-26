"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AnyOrder } from "@/app/lib/types";
import { listenArchived, restoreOrder, deleteOrder, emptyArchived } from "@/app/lib/orders";

export default function ArchivadosPage() {
  const [rows, setRows] = useState<AnyOrder[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "souvenirs" | "servicio">("all");

  useEffect(() => {
    const unsub = listenArchived(setRows);
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows as any[])
      .filter((r) => (type === "all" ? true : r.type === type))
      .filter((r) => {
        if (!s) return true;
        const txt = r.type === "servicio"
          ? `${r.nombre ?? ""} ${r.numeroCliente ?? ""} ${r.telefono ?? ""}`
          : `${r.destino ?? ""} ${r.clienteNombre ?? ""} ${r.clienteTelefono ?? ""}`;
        return txt.toLowerCase().includes(s);
      });
  }, [rows, q, type]);

  const restore = async (id: string) => {
    await restoreOrder(id);
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar definitivo?")) return;
    await deleteOrder(id);
  };

  const vaciar = async () => {
    const ok = prompt('Escribe BORRAR para confirmar:');
    if (ok !== "BORRAR") return;
    await emptyArchived();
  };

  return (
    <main className="min-h-screen p-6 bg-neutral-950 text-neutral-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Archivados</h1>
          <Link className="text-neutral-300 hover:text-white" href="/">Home</Link>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
              <option value="all">Tipo: todos</option>
              <option value="souvenirs">Souvenirs</option>
              <option value="servicio">Servicio</option>
            </select>
            <button onClick={vaciar} className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-black">
              Vaciar archivados
            </button>
          </div>
          <div className="mt-2 text-sm text-neutral-400">Mostrando: {filtered.length}</div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          {filtered.map((r: any) => (
            <div key={r.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-neutral-400">Tipo: {r.type}</div>
                  {r.type === "souvenirs" ? (
                    <>
                      <div className="text-lg font-semibold">{r.destino}</div>
                      <div className="text-sm text-neutral-300">{r.clienteNombre} — {r.clienteTelefono}</div>
                      <div className="text-sm text-neutral-400">Entrega: {r.fechaEntrega}</div>
                      <div className="mt-2 text-sm text-neutral-300">
                        Productos: <span className="text-neutral-400">{(r.productos ?? []).map((p: any) => p.kind).join(", ") || "—"}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-semibold">{r.nombre}</div>
                      <div className="text-sm text-neutral-300">Cliente: {r.numeroCliente} — {r.telefono}</div>
                      <div className="text-sm text-neutral-400">Entrega: {r.fechaEntrega}</div>
                      <div className="mt-2 text-sm text-neutral-300">
                        Acabados: <span className="text-neutral-400">{(r.acabados ?? []).join(", ") || "—"}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => restore(r.id)} className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black">RESTAURAR</button>
                  <button onClick={() => del(r.id)} className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-black">ELIMINAR</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="text-neutral-400 mt-8">No hay archivados.</div>}
        </div>
      </div>
    </main>
  );
}
