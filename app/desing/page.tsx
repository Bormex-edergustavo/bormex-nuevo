"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AnyOrder, ProductKind, SouvenirProductData } from "@/app/lib/types";
import { listenActiveSouvenirs, updateOrder, archiveOrder, addOrderImage, removeOrderImage, ensureLlaveroDisenos, setEmpaque, setExhibidoresListos } from "@/app/lib/orders";
import { estatusPorTiempo, hasLlavero, llaveroInfo, normalizeExhibidor } from "@/app/lib/helpers";

const PRODUCT_LABEL: Record<ProductKind, string> = { llavero: "Llavero", iman: "Imán", pin: "Pin" };

function orderMatches(q: string, o: any) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    String(o.clienteNombre ?? "").toLowerCase().includes(s) ||
    String(o.clienteTelefono ?? "").toLowerCase().includes(s) ||
    String(o.destino ?? "").toLowerCase().includes(s)
  );
}

export default function DesingPage() {
  const [rows, setRows] = useState<AnyOrder[]>([]);
  const [q, setQ] = useState("");
  const [filterProd, setFilterProd] = useState<ProductKind | "all">("all");
  const [filterEmpaque, setFilterEmpaque] = useState<"all" | "si" | "no">("all");
  const [filterExhib, setFilterExhib] = useState<"all" | "si" | "no">("all");
  const [status, setStatus] = useState<"all" | "A TIEMPO" | "PRÓXIMO" | "HOY" | "VENCIDO">("all");

  const [editing, setEditing] = useState<AnyOrder | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = listenActiveSouvenirs(setRows);
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    return rows
      .filter((r: any) => orderMatches(q, r))
      .filter((r: any) => (filterProd === "all" ? true : (r.productos ?? []).some((p: any) => p.kind === filterProd)))
      .filter((r: any) => (filterEmpaque === "all" ? true : filterEmpaque === "si" ? !!r.empaque : !r.empaque))
      .filter((r: any) => (filterExhib === "all" ? true : filterExhib === "si" ? !!r.exhibidoresListos : !r.exhibidoresListos))
      .filter((r: any) => (status === "all" ? true : estatusPorTiempo(r.fechaEntrega) === status))
      .sort((a: any, b: any) => String(a.fechaEntrega).localeCompare(String(b.fechaEntrega)));
  }, [rows, q, filterProd, filterEmpaque, filterExhib, status]);

  const doArchive = async (id: string) => {
    if (!confirm("¿Archivar este pedido?")) return;
    setBusyId(id);
    setMsg(null);
    try {
      await archiveOrder(id);
    } catch (e: any) {
      setMsg(e?.message || "Error archivando");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen p-6 bg-neutral-950 text-neutral-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">DESING</h1>
          <Link className="text-neutral-300 hover:text-white" href="/">Home</Link>
        </div>

        {/* Search + filters */}
        <div className="mt-5 p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar: nombre / teléfono / destino" className="md:col-span-2 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />

            <select value={filterProd} onChange={(e) => setFilterProd(e.target.value as any)} className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
              <option value="all">Producto: todos</option>
              <option value="llavero">Llavero</option>
              <option value="iman">Imán</option>
              <option value="pin">Pin</option>
            </select>

            <select value={filterEmpaque} onChange={(e) => setFilterEmpaque(e.target.value as any)} className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
              <option value="all">Empaque: todos</option>
              <option value="si">Empaque: sí</option>
              <option value="no">Empaque: no</option>
            </select>

            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
              <option value="all">Entrega: todas</option>
              <option value="A TIEMPO">A TIEMPO</option>
              <option value="PRÓXIMO">PRÓXIMO</option>
              <option value="HOY">HOY</option>
              <option value="VENCIDO">VENCIDO</option>
            </select>
          </div>

          <div className="mt-3 flex gap-3 items-center">
            <select value={filterExhib} onChange={(e) => setFilterExhib(e.target.value as any)} className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
              <option value="all">Exhibidor(es): todos</option>
              <option value="si">Exhibidor(es): sí</option>
              <option value="no">Exhibidor(es): no</option>
            </select>

            <div className="text-sm text-neutral-400">Mostrando: {filtered.length}</div>
            {msg && <div className="text-sm text-amber-200">{msg}</div>}
          </div>
        </div>

        {/* List */}
        <div className="mt-6 grid grid-cols-1 gap-3">
          {filtered.map((r: any) => {
            const statusTxt = estatusPorTiempo(r.fechaEntrega);
            return (
              <div key={r.id} className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{r.destino}</div>
                    <div className="text-sm text-neutral-300">{r.clienteNombre} — {r.clienteTelefono}</div>
                    <div className="text-sm text-neutral-400">Entrega: {r.fechaEntrega} · <span className="text-neutral-200">{statusTxt}</span></div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setEditing(r)} className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700">Editar</button>
                    <button onClick={() => doArchive(r.id)} disabled={busyId === r.id} className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-black disabled:opacity-60">
                      {busyId === r.id ? "..." : "ARCHIVAR"}
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {(r.productos ?? []).map((p: any) => (
                    <span key={p.kind} className="text-xs px-2 py-1 rounded-lg bg-neutral-800 border border-neutral-700">
                      {PRODUCT_LABEL[p.kind]} · piezas {p.piezas} · diseños {p.disenos}
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={!!r.empaque} onChange={(e) => setEmpaque(r.id, e.target.checked)} />
                    Empaque
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!r.exhibidoresListos}
                      disabled={(r.productos ?? []).every((p: any) => !!p.exhibidor?.noAplica || ((p.exhibidor?.planoQty ?? 0) + (p.exhibidor?.mesaQty ?? 0) === 0))}
                      onChange={(e) => setExhibidoresListos(r.id, e.target.checked)}
                    />
                    Exhibidor(es)
                    {(r.productos ?? []).every((p: any) => !!p.exhibidor?.noAplica || ((p.exhibidor?.planoQty ?? 0) + (p.exhibidor?.mesaQty ?? 0) === 0)) && (
                      <span className="text-xs text-neutral-400">No aplica</span>
                    )}
                  </label>

                  <span className="text-neutral-400">Imágenes: {(r.imagenes ?? []).length}/15</span>
                </div>

                {(r.imagenes ?? []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(r.imagenes ?? []).slice(0, 6).map((img: any) => (
                      <a
                        key={img.path}
                        href={img.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl overflow-hidden border border-neutral-800 hover:border-neutral-600"
                        title="Abrir"
                      >
                        {/* usar <img> para evitar configuración extra de next/image */}
                        <img src={img.url} alt="" className="w-20 h-20 object-cover" />
                      </a>
                    ))}
                    {(r.imagenes ?? []).length > 6 && (
                      <span className="text-xs text-neutral-500 self-center">+{(r.imagenes ?? []).length - 6} más</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && <div className="text-neutral-400 mt-8">No hay pedidos.</div>}
        </div>
      </div>

      {editing && (
        <EditModal
          row={editing as any}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            // si cambió diseños llavero, asegurar llaveroDisenos
            await ensureLlaveroDisenos(editing.id);
          }}
        />
      )}
    </main>
  );
}

function EditModal({ row, onClose, onSaved }: { row: any; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<any>({
    clienteNombre: row.clienteNombre ?? "",
    clienteTelefono: row.clienteTelefono ?? "",
    destino: row.destino ?? "",
    fechaEntrega: row.fechaEntrega ?? "",
    productos: (row.productos ?? []).map((p: any) => ({ ...p, exhibidor: normalizeExhibidor(p.exhibidor) })),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Imágenes: cada imagen se etiqueta con el producto (llavero/iman/pin)
  // y con el número de diseño para que en 3D aparezca en su lugar.
  const [imgKind, setImgKind] = useState<ProductKind>("llavero");
  const [imgDesignIdx, setImgDesignIdx] = useState<number>(1);

  const kindsIn = new Set<ProductKind>((form.productos ?? []).map((p: any) => p.kind));
  const selectedProd: any = (form.productos ?? []).find((p: any) => p.kind === imgKind) || null;
  const maxDesign = Math.max(1, Number(selectedProd?.disenos ?? 1));

  const ALL_KINDS: ProductKind[] = ["llavero", "iman", "pin"];

  useEffect(() => {
    // Cuando cambias el producto, reiniciamos a DISEÑO 1
    setImgDesignIdx(1);
  }, [imgKind]);

  useEffect(() => {
    // Si el producto tiene menos diseños, ajustamos el número
    setImgDesignIdx((v) => (v > maxDesign ? maxDesign : v < 1 ? 1 : v));
  }, [maxDesign]);

  const addKind = (k: ProductKind) => {
    if (kindsIn.has(k)) return;
    setForm((prev: any) => ({
      ...prev,
      productos: [
        ...(prev.productos ?? []),
        { kind: k, piezas: 0, disenos: 0, exhibidor: { noAplica: false, planoQty: 0, mesaQty: 0 }, observaciones: "" },
      ],
    }));
  };

  const setProd = (kind: ProductKind, patch: any) => {
    setForm((prev: any) => ({
      ...prev,
      productos: (prev.productos ?? []).map((p: any) => (p.kind !== kind ? p : { ...p, ...patch, exhibidor: normalizeExhibidor({ ...(p.exhibidor ?? {}), ...(patch.exhibidor ?? {}) }) })),
    }));
  };

  const removeKind = (k: ProductKind) => {
    setForm((prev: any) => ({ ...prev, productos: (prev.productos ?? []).filter((p: any) => p.kind !== k) }));
  };

  const save = async () => {
    setErr(null);
    if (!form.clienteNombre.trim() || !form.clienteTelefono.trim() || !form.destino.trim() || !form.fechaEntrega) {
      setErr("Faltan datos de cliente/destino/fecha.");
      return;
    }
    if ((form.productos ?? []).length === 0) {
      setErr("Debe haber mínimo 1 producto.");
      return;
    }
    setSaving(true);
    try {
      await updateOrder(row.id, {
        clienteNombre: form.clienteNombre.trim(),
        clienteTelefono: form.clienteTelefono.trim(),
        destino: form.destino.trim(),
        fechaEntrega: form.fechaEntrega,
        productos: form.productos,
      });
      await onSaved();
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  const onPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const fileItem = Array.from(items).find((it) => it.type.startsWith("image/"));
    if (!fileItem) return;
    const file = fileItem.getAsFile();
    if (!file) return;
    e.preventDefault();
    try {
      await addOrderImage(row.id, file, { kind: imgKind, designIdx: imgDesignIdx });
    } catch (err: any) {
      setErr(err?.message || "Error subiendo imagen");
    }
  };

  const onUpload = async (file: File | null) => {
    if (!file) return;
    try {
      await addOrderImage(row.id, file, { kind: imgKind, designIdx: imgDesignIdx });
    } catch (err: any) {
      setErr(err?.message || "Error subiendo imagen");
    }
  };

  const imgs = row.imagenes ?? [];

  return (
    // Nota: el modal puede ser más alto que la pantalla.
    // Hacemos el overlay "scrollable" para que puedas subir/bajar con la bolita del mouse.
    <div
      className="fixed inset-0 bg-black/70 z-50 overflow-y-auto flex items-start justify-center px-4 py-8"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl p-5 max-h-[calc(100vh-4rem)] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
        onPaste={onPaste}
        tabIndex={0}
      >
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Editar pedido</div>
          <button onClick={onClose} className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700">Cerrar</button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-neutral-300">Cliente</label>
              <input value={form.clienteNombre} onChange={(e) => setForm({ ...form, clienteNombre: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
            </div>
            <div>
              <label className="text-sm text-neutral-300">Teléfono</label>
              <input value={form.clienteTelefono} onChange={(e) => setForm({ ...form, clienteTelefono: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
            </div>
            <div>
              <label className="text-sm text-neutral-300">Destino</label>
              <input value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
            </div>
            <div>
              <label className="text-sm text-neutral-300">Fecha entrega</label>
              <input type="date" value={form.fechaEntrega} onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
            </div>
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm text-neutral-300">Imágenes (pega Cmd+V o sube) — {imgs.length}/15</div>
                <div className="text-xs text-neutral-500">Tip: haz clic aquí y pega (Cmd+V)</div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={imgKind}
                  onChange={(e) => {
                    setImgKind(e.target.value as ProductKind);
                    setImgDesignIdx(1);
                  }}
                  className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-sm"
                >
                  {ALL_KINDS.map((k) => (
                    <option key={k} value={k} disabled={!kindsIn.has(k)}>{PRODUCT_LABEL[k]}</option>
                  ))}
                </select>

                <select
                  value={imgDesignIdx}
                  onChange={(e) => setImgDesignIdx(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-sm"
                  title="Diseño"
                >
                  {Array.from({ length: maxDesign }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>DISEÑO {n}</option>
                  ))}
                </select>

                <input type="file" accept="image/*" onChange={(e) => onUpload(e.target.files?.[0] ?? null)} />
              </div>

              {imgs.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {imgs.map((img: any) => (
                    <div key={img.path} className="p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                      <div className="flex items-center gap-2">
                        <a href={img.url} target="_blank" rel="noreferrer" className="text-xs underline">Ver</a>
                        <button onClick={() => removeOrderImage(row.id, img.path)} className="text-xs text-red-300 hover:text-red-200">Quitar</button>
                      </div>
                      <div className="mt-1 text-[11px] text-neutral-500">{img.kind ? PRODUCT_LABEL[img.kind] : '—'}{typeof img.designIdx === 'number' ? ` · Diseño ${img.designIdx}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => addKind("llavero")} className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm">+ Llavero</button>
              <button onClick={() => addKind("iman")} className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm">+ Imán</button>
              <button onClick={() => addKind("pin")} className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm">+ Pin</button>
            </div>

            {(form.productos ?? []).map((p: any) => (
              <div key={p.kind} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{PRODUCT_LABEL[p.kind]}</div>
                  <button onClick={() => removeKind(p.kind)} className="text-xs text-red-300 hover:text-red-200">Quitar</button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-400">Piezas</label>
                    <input type="number" value={p.piezas} onChange={(e) => setProd(p.kind, { piezas: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700" />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400">Diseños</label>
                    <input type="number" value={p.disenos} onChange={(e) => setProd(p.kind, { disenos: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700" />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!p.exhibidor?.noAplica} onChange={(e) => setProd(p.kind, { exhibidor: { ...(p.exhibidor ?? {}), noAplica: e.target.checked } })} />
                    Exhibidor: No aplica
                  </label>

                  <div className={`mt-2 grid grid-cols-2 gap-3 ${p.exhibidor?.noAplica ? "opacity-50" : ""}`}>
                    <div>
                      <label className="text-xs text-neutral-400">Plano</label>
                      <input disabled={!!p.exhibidor?.noAplica} type="number" value={p.exhibidor?.planoQty ?? 0} onChange={(e) => setProd(p.kind, { exhibidor: { ...(p.exhibidor ?? {}), planoQty: Number(e.target.value) } })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700" />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400">Mesa</label>
                      <input disabled={!!p.exhibidor?.noAplica} type="number" value={p.exhibidor?.mesaQty ?? 0} onChange={(e) => setProd(p.kind, { exhibidor: { ...(p.exhibidor ?? {}), mesaQty: Number(e.target.value) } })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700" />
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-xs text-neutral-400">Observaciones</label>
                  <textarea value={p.observaciones ?? ""} onChange={(e) => setProd(p.kind, { observaciones: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 min-h-[60px]" />
                </div>
              </div>
            ))}

            {err && <div className="text-sm text-amber-200">{err}</div>}

            <div className="flex gap-2">
              <button onClick={save} disabled={saving} className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-medium disabled:opacity-60">
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button onClick={onClose} className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-black font-medium">
                Cancelar
              </button>
            </div>

            <div className="text-xs text-neutral-500">
              Nota: Después de editar productos/diseños, 3D se actualiza en vivo. Si cambiaste “Diseños” del llavero, el sistema ajusta los diseños automáticamente.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
