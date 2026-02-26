"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AnyOrder, ProductKind } from "@/app/lib/types";
import { listenActiveSouvenirs, archiveOrder } from "@/app/lib/orders";
import { estatusPorTiempo } from "@/app/lib/helpers";

const PRODUCT_LABEL: Record<ProductKind, string> = { llavero: "Llavero", iman: "Imán", pin: "Pin" };

export default function EmbalajePage() {
  const [rows, setRows] = useState<AnyOrder[]>([]);
  const [q, setQ] = useState("");
  const [prod, setProd] = useState<ProductKind | "all">("all");
  const [status, setStatus] = useState<"all" | "A TIEMPO" | "PRÓXIMO" | "HOY" | "VENCIDO">("all");

  useEffect(() => {
    const unsub = listenActiveSouvenirs(setRows);
    return () => unsub();
  }, []);

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    const flat: any[] = [];
    for (const r of rows as any[]) {
      const st = estatusPorTiempo(r.fechaEntrega);
      if (status !== "all" && st !== status) continue;
      if (s && !String(r.destino ?? "").toLowerCase().includes(s)) continue;

      for (const p of r.productos ?? []) {
        if (prod !== "all" && p.kind !== prod) continue;
        flat.push({ order: r, product: p, status: st });
      }
    }
    flat.sort((a, b) => String(a.order.fechaEntrega).localeCompare(String(b.order.fechaEntrega)));
    return flat;
  }, [rows, q, prod, status]);

  const doArchive = async (id: string) => {
    if (!confirm("¿Archivar este pedido completo?")) return;
    await archiveOrder(id);
  };

  return (
    <main className="min-h-screen p-6 bg-neutral-950 text-neutral-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Embalaje</h1>
          <Link className="text-neutral-300 hover:text-white" href="/">Home</Link>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por destino" className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
            <select value={prod} onChange={(e) => setProd(e.target.value as any)} className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
              <option value="all">Producto: todos</option>
              <option value="llavero">Llavero</option>
              <option value="iman">Imán</option>
              <option value="pin">Pin</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
              <option value="all">Estatus: todos</option>
              <option value="A TIEMPO">A TIEMPO</option>
              <option value="PRÓXIMO">PRÓXIMO</option>
              <option value="HOY">HOY</option>
              <option value="VENCIDO">VENCIDO</option>
            </select>
          </div>
          <div className="mt-2 text-sm text-neutral-400">Mostrando filas: {items.length}</div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3">
          {items.map((it) => {
            const r = it.order;
            const p = it.product;
            return (
              <div key={r.id + "_" + p.kind} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{r.destino}</div>
                    <div className="text-sm text-neutral-300">
                      {PRODUCT_LABEL[p.kind]} · piezas {p.piezas} · diseños {p.disenos}
                    </div>
                    <div className="text-sm text-neutral-400">Entrega: {r.fechaEntrega} · <span className="text-neutral-200">{it.status}</span></div>
                  </div>
                  <button onClick={() => doArchive(r.id)} className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-black">
                    ARCHIVAR
                  </button>
                </div>

                <div className="mt-3 text-sm">
                  <div className="text-neutral-300">Exhibidor:</div>
                  {p.exhibidor?.noAplica ? (
                    <div className="text-neutral-400">No aplica</div>
                  ) : (
                    <div className="text-neutral-400">Plano: {p.exhibidor?.planoQty ?? 0} · Mesa: {p.exhibidor?.mesaQty ?? 0}</div>
                  )}
                </div>

                {p.observaciones ? <div className="mt-2 text-sm text-neutral-300">Obs: <span className="text-neutral-400">{p.observaciones}</span></div> : null}

                <div className="mt-3">
                  {(r.imagenes ?? []).length === 0 ? (
                    <span className="text-sm text-neutral-500">Sin imágenes (se cargan en DESING)</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(r.imagenes ?? []).map((img: any) => (
                        <a key={img.path} href={img.url} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={img.url}
                            alt=""
                            className="h-16 w-16 object-cover rounded-lg border border-neutral-800 hover:border-neutral-500"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {items.length === 0 && <div className="text-neutral-400 mt-8">No hay pedidos.</div>}
        </div>
      </div>
    </main>
  );
}
