"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createSouvenirOrder } from "@/app/lib/orders";
import type { ProductKind, SouvenirProductData } from "@/app/lib/types";
import { normalizeExhibidor } from "@/app/lib/helpers";

const PRODUCTOS: { kind: ProductKind; label: string }[] = [
  { kind: "llavero", label: "Llavero" },
  { kind: "iman", label: "Imán" },
  { kind: "pin", label: "Pin" },
];

function emptyProduct(kind: ProductKind): SouvenirProductData {
  return {
    kind,
    piezas: 0,
    disenos: 0,
    exhibidor: { noAplica: false, planoQty: 0, mesaQty: 0 },
    observaciones: "",
  };
}

export default function AgregarSouvenirsPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Paso 1
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [destino, setDestino] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");

  // Paso 2
  const [seleccion, setSeleccion] = useState<ProductKind[]>([]);

  // Paso 3
  const [productos, setProductos] = useState<SouvenirProductData[]>([]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const toggleProd = (k: ProductKind) => {
    setSeleccion((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  const irPaso2 = () => {
    setMsg(null);
    if (!clienteNombre.trim() || !clienteTelefono.trim() || !destino.trim() || !fechaEntrega) {
      setMsg("Falta completar: Nombre, Teléfono, Destino y Fecha de entrega.");
      return;
    }
    setStep(2);
  };

  const irPaso3 = () => {
    setMsg(null);
    if (seleccion.length === 0) {
      setMsg("Selecciona mínimo 1 producto.");
      return;
    }
    const next = seleccion.map((k) => productos.find((p) => p.kind === k) ?? emptyProduct(k));
    setProductos(next);
    setStep(3);
  };

  const setProdField = (kind: ProductKind, patch: Partial<SouvenirProductData>) => {
    setProductos((prev) =>
      prev.map((p) => {
        if (p.kind !== kind) return p;
        const merged = { ...p, ...patch };
        merged.exhibidor = normalizeExhibidor(merged.exhibidor);
        return merged;
      })
    );
  };

  const guardar = async () => {
    setMsg(null);
    // Validación mínima
    for (const p of productos) {
      if (p.piezas <= 0 || p.disenos <= 0) {
        setMsg("En cada producto pon Piezas y Diseños (mayor a 0).");
        return;
      }
      if (p.exhibidor.noAplica === false && (p.exhibidor.planoQty < 0 || p.exhibidor.mesaQty < 0)) {
        setMsg("Cantidades de exhibidor inválidas.");
        return;
      }
    }

    setSaving(true);
    try {
      await createSouvenirOrder({
        clienteNombre: clienteNombre.trim(),
        clienteTelefono: clienteTelefono.trim(),
        destino: destino.trim(),
        fechaEntrega,
        productos,
      });
      setMsg("Guardado. Ya aparece en DESING / 3D / Embalaje (según corresponda).");
      // reset
      setStep(1);
      setClienteNombre("");
      setClienteTelefono("");
      setDestino("");
      setFechaEntrega("");
      setSeleccion([]);
      setProductos([]);
    } catch (e: any) {
      setMsg(e?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen p-6 bg-neutral-950 text-neutral-100">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Agregar SOUVENIRS</h1>
          <Link className="text-neutral-300 hover:text-white" href="/">Volver</Link>
        </div>

        <div className="mt-6 p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          {/* Steps */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setStep(1)} className={`px-3 py-2 rounded-xl border ${step === 1 ? "bg-emerald-600 text-black border-emerald-600" : "bg-neutral-950 border-neutral-800"}`}>1) Cliente</button>
            <button onClick={() => step >= 2 && setStep(2)} className={`px-3 py-2 rounded-xl border ${step === 2 ? "bg-emerald-600 text-black border-emerald-600" : "bg-neutral-950 border-neutral-800"} ${step < 2 ? "opacity-50 cursor-not-allowed" : ""}`}>2) Productos</button>
            <button onClick={() => step >= 3 && setStep(3)} className={`px-3 py-2 rounded-xl border ${step === 3 ? "bg-emerald-600 text-black border-emerald-600" : "bg-neutral-950 border-neutral-800"} ${step < 3 ? "opacity-50 cursor-not-allowed" : ""}`}>3) Datos</button>
          </div>

          {step === 1 && (
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm text-neutral-300">Nombre del cliente</label>
                <input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
              </div>
              <div>
                <label className="text-sm text-neutral-300">Teléfono del cliente</label>
                <input value={clienteTelefono} onChange={(e) => setClienteTelefono(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
              </div>
              <div>
                <label className="text-sm text-neutral-300">Destino</label>
                <input value={destino} onChange={(e) => setDestino(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
              </div>
              <div>
                <label className="text-sm text-neutral-300">Fecha de entrega</label>
                <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800" />
              </div>

              {msg && <div className="text-sm text-amber-200">{msg}</div>}

              <div className="flex gap-2">
                <button onClick={irPaso2} className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-medium">Siguiente</button>
                <Link href="/" className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-black font-medium">Cancelar</Link>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-5 space-y-4">
              <div className="text-neutral-300 text-sm">Selecciona productos (1, 2 o 3):</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRODUCTOS.map((p) => (
                  <label key={p.kind} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800">
                    <input type="checkbox" checked={seleccion.includes(p.kind)} onChange={() => toggleProd(p.kind)} />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>

              {msg && <div className="text-sm text-amber-200">{msg}</div>}

              <div className="flex gap-2">
                <button onClick={irPaso3} className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-medium">Siguiente</button>
                <button onClick={() => setStep(1)} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700">Atrás</button>
                <Link href="/" className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-black font-medium">Cancelar</Link>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-5 space-y-6">
              {productos.map((p) => (
                <div key={p.kind} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div className="font-semibold capitalize">{p.kind}</div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-neutral-300">Piezas</label>
                      <input type="number" value={p.piezas} onChange={(e) => setProdField(p.kind, { piezas: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700" />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-300">Diseños</label>
                      <input type="number" value={p.disenos} onChange={(e) => setProdField(p.kind, { disenos: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm text-neutral-300">Exhibidor</div>

                    <label className="mt-2 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={p.exhibidor.noAplica}
                        onChange={(e) => setProdField(p.kind, { exhibidor: { ...p.exhibidor, noAplica: e.target.checked } })}
                      />
                      No aplica
                    </label>

                    <div className={`mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 ${p.exhibidor.noAplica ? "opacity-50" : ""}`}>
                      <div>
                        <label className="text-sm text-neutral-300">Plano (cantidad)</label>
                        <input
                          type="number"
                          disabled={p.exhibidor.noAplica}
                          value={p.exhibidor.planoQty}
                          onChange={(e) => setProdField(p.kind, { exhibidor: { ...p.exhibidor, planoQty: Number(e.target.value) } })}
                          className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-neutral-300">De mesa (cantidad)</label>
                        <input
                          type="number"
                          disabled={p.exhibidor.noAplica}
                          value={p.exhibidor.mesaQty}
                          onChange={(e) => setProdField(p.kind, { exhibidor: { ...p.exhibidor, mesaQty: Number(e.target.value) } })}
                          className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="text-sm text-neutral-300">Observaciones</label>
                    <textarea value={p.observaciones} onChange={(e) => setProdField(p.kind, { observaciones: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 min-h-[70px]" />
                  </div>
                </div>
              ))}

              {msg && <div className="text-sm text-amber-200">{msg}</div>}

              <div className="flex gap-2">
                <button onClick={guardar} disabled={saving} className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-medium disabled:opacity-60">
                  {saving ? "Guardando..." : "Guardar pedido"}
                </button>
                <button onClick={() => setStep(2)} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700">Atrás</button>
                <Link href="/" className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-black font-medium">Cancelar</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
