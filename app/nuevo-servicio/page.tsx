'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Acabado =
  | 'CORTE_LASER'
  | 'DTF'
  | 'BORDADO'
  | 'PLANILLAS_SUBLIMADAS';

const ACABADOS: { key: Acabado; label: string }[] = [
  { key: 'CORTE_LASER', label: 'Corte láser' },
  { key: 'DTF', label: 'DTF' },
  { key: 'BORDADO', label: 'Bordado' },
  { key: 'PLANILLAS_SUBLIMADAS', label: 'Planillas sublimadas' },
];

type ServicioPedido = {
  id: string;
  createdAt: string;

  nombre: string;
  numeroCliente: string;
  acabados: Acabado[];
  observaciones: string;
  fechaEntrega: string;

  // por ahora solo guardamos nombres; luego conectamos storage real
  imagenes?: { name: string }[];
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function NuevoServicioPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [numeroCliente, setNumeroCliente] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [acabados, setAcabados] = useState<Record<Acabado, boolean>>({
    CORTE_LASER: false,
    DTF: false,
    BORDADO: false,
    PLANILLAS_SUBLIMADAS: false,
  });

  const [files, setFiles] = useState<File[]>([]);

  const acabadosList = useMemo(
    () => ACABADOS.filter(a => acabados[a.key]).map(a => a.key),
    [acabados]
  );

  const canSave = nombre.trim() && numeroCliente.trim() && fechaEntrega.trim() && acabadosList.length >= 1;

  function toggleAcabado(k: Acabado) {
    setAcabados(prev => ({ ...prev, [k]: !prev[k] }));
  }

  function saveToLocalStorage(pedido: ServicioPedido) {
    const KEY = 'bormex_servicios';
    const prev = JSON.parse(localStorage.getItem(KEY) || '[]') as ServicioPedido[];
    prev.unshift(pedido);
    localStorage.setItem(KEY, JSON.stringify(prev));
  }

  function onGuardar() {
    if (!canSave) {
      alert('Faltan datos obligatorios (Nombre, Número, Fecha y al menos 1 acabado).');
      return;
    }

    const pedido: ServicioPedido = {
      id: uid(),
      createdAt: new Date().toISOString(),

      nombre: nombre.trim(),
      numeroCliente: numeroCliente.trim(),
      fechaEntrega,
      observaciones: observaciones.trim(),
      acabados: acabadosList,

      imagenes: files.map(f => ({ name: f.name })),
    };

    // ✅ Por ahora guardamos local (no rompe nada).
    // Luego conectamos a tu storage real para tiempo real multi-dispositivo.
    saveToLocalStorage(pedido);

    alert('Guardado. (Listo para conectar a tiempo real)');
    router.push('/');
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Agregar Servicio</h1>
            <p className="text-sm text-neutral-400">Nuevo pedido (servicio) para Producciones BORMEX.</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="rounded-lg border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900"
          >
            Home
          </button>
        </div>

        <section className="mt-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="grid gap-4">
            <label className="grid gap-1">
              <span className="text-sm text-neutral-300">Nombre</span>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-neutral-500"
                placeholder="Ej: Cliente / Empresa"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-neutral-300">Número de cliente</span>
              <input
                value={numeroCliente}
                onChange={e => setNumeroCliente(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-neutral-500"
                placeholder="Ej: 2212345678"
              />
            </label>

            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="text-sm font-medium">Acabado (multi-selección)</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {ACABADOS.map(a => (
                  <label key={a.key} className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={acabados[a.key]}
                      onChange={() => toggleAcabado(a.key)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{a.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="grid gap-1">
              <span className="text-sm text-neutral-300">Cargar imágenes (si aplica)</span>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              />
              {files.length > 0 && (
                <div className="mt-2 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-400">
                  {files.map(f => <div key={f.name}>• {f.name}</div>)}
                </div>
              )}
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-neutral-300">Observaciones</span>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                className="min-h-[110px] rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-neutral-500"
                placeholder="Notas del servicio…"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-neutral-300">Fecha de entrega</span>
              <input
                type="date"
                value={fechaEntrega}
                onChange={e => setFechaEntrega(e.target.value)}
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 outline-none focus:border-neutral-500"
              />
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              onClick={() => router.push('/')}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-950"
            >
              Cancelar
            </button>

            <button
              onClick={onGuardar}
              disabled={!canSave}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              Guardar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
