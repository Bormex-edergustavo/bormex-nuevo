"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AnyOrder } from "@/app/lib/types";
import { listenActiveSouvenirs, updateLlaveroDiseno, ensureLlaveroDisenos } from "@/app/lib/orders";
import { estatusPorTiempo, hasLlavero, llaveroInfo } from "@/app/lib/helpers";

export default function D3Page() {
  const [rows, setRows] = useState<AnyOrder[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pendientes" | "terminados">("all");
  const [status, setStatus] = useState<"all" | "A TIEMPO" | "PRÓXIMO" | "HOY" | "VENCIDO">("all");

  useEffect(() => {
    const unsub = listenActiveSouvenirs(async (all) => {
      // solo llaveros
      const ll = all.filter((o: any) => hasLlavero(o.productos ?? []));
      setRows(ll);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows
      .filter((r: any) => (!s ? true : String(r.destino ?? "").toLowerCase().includes(s)))
      .filter((r: any) => (status === "all" ? true : estatusPorTiempo(r.fechaEntrega) === status))
      .filter((r: any) => {
        if (filter === "all") return true;
        const list = (r.llaveroDisenos ?? []) as any[];
        const allDone = list.length > 0 && list.every((d) => !!d.terminado);
        return filter === "terminados" ? allDone : !allDone;
      })
      .sort((a: any, b: any) => String(a.fechaEntrega).localeCompare(String(b.fechaEntrega)));
  }, [rows, q, filter, status]);

  return (
    <main className="min-h-screen p-6 bg-neutral-950 text-neutral-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">3D (LLAVERO)</h1>
          <Link className="text-neutral-300 hover:text-white" href="/">Home</Link>
        </div>

        <div className="mt-5 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por destino" className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
            <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
              <option value="all">Todos</option>
              <option value="pendientes">Pendientes</option>
              <option value="terminados">Terminados</option>
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
            const info = llaveroInfo(r.productos ?? []);
            const list: any[] = Array.isArray(r.llaveroDisenos) ? r.llaveroDisenos : [];
            const statusTxt = estatusPorTiempo(r.fechaEntrega);
            return (
              <div key={r.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{r.destino}</div>
                    <div className="text-sm text-neutral-300">Llavero: {info.piezas} piezas · {info.disenos} diseños</div>
                    <div className="text-sm text-neutral-400">Entrega: {r.fechaEntrega} · <span className="text-neutral-200">{statusTxt}</span></div>
                  </div>
                  <button onClick={() => ensureLlaveroDisenos(r.id)} className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm">
                    Recalcular diseños
                  </button>
                </div>

                {/* Imágenes */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(r.imagenes ?? []).length === 0 ? (
                    <span className="text-sm text-neutral-500">Sin imágenes (se cargan en DESING)</span>
                  ) : (
                    (r.imagenes ?? []).slice(0, 12).map((img: any) => (
                      <a
                        key={img.path}
                        href={img.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-2 py-1 hover:bg-neutral-900"
                      >
                        <img src={img.url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <span className="text-xs text-neutral-300 group-hover:text-white">ver</span>
                      </a>
                    ))
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {list.map((d) => (
                    <div key={d.idx} className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                      <div className="font-semibold">Diseño {d.idx}</div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                        <div>
                          <label className="text-xs text-neutral-400">Piezas impresas</label>
                          <input
                            type="number"
                            value={d.piezasImpresas ?? 0}
                            onChange={(e) => updateLlaveroDiseno(r.id, d.idx, { piezasImpresas: Number(e.target.value) })}
                            className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700"
                          />
                          <div className="text-xs text-neutral-500">Máx: {info.piezas}</div>
                        </div>
                        <label className="flex items-center gap-2 mt-6 sm:mt-0">
                          <input type="checkbox" checked={!!d.terminado} onChange={(e) => updateLlaveroDiseno(r.id, d.idx, { terminado: e.target.checked })} />
                          <span>Terminado</span>
                        </label>

                        {/* Imágenes SOLO de llavero, y SOLO las del diseño actual */}
                        {(() => {
                          const imgs = (r.imagenes ?? []).filter(
                            (img: any) => (img.kind ?? "llavero") === "llavero" && img.designIdx === d.idx
                          );
                          if (!imgs.length) return null;
                          return (
                            <div className="mt-3 sm:col-span-2">
                              <div className="text-xs text-neutral-400 mb-2">Imágenes del DISEÑO {d.idx}</div>
                              <div className="grid grid-cols-3 gap-2">
                                {imgs.map((img: any) => (
                                  <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                                    <img
                                      src={img.url}
                                      alt=""
                                      className="w-full h-24 object-cover rounded-lg border border-neutral-800"
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                      </div>
                    </div>
                  ))}
                  {list.length === 0 && <div className="text-sm text-neutral-500">No hay diseños todavía. Ajusta “Diseños” en DESING o presiona “Recalcular diseños”.</div>}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && <div className="text-neutral-400 mt-8">No hay llaveros.</div>}
        </div>
      </div>
    </main>
  );
}
