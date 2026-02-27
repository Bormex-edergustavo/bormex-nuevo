'use client';

import React, { useEffect, useMemo, useState } from 'react';

type ProductoKind = 'LLAVERO' | 'IMAN' | 'PIN';

type Exhibidor = {
  planoQty: number;   // puede ser 0
  mesaQty: number;    // puede ser 0
  noAplica: boolean;  // si true => planoQty y mesaQty deben quedar en 0
};

type ProductoDetalle = {
  kind: ProductoKind;
  piezas: number;
  disenos: number;
  exhibidor: Exhibidor;
  observaciones: string;
};

type PedidoSouvenir = {
  id: string;
  createdAt: number;

  clienteNombre: string;
  clienteTelefono: string;
  destino: string;
  fechaEntrega: string;

  productos: ProductoDetalle[];

  // reglas de salida
  to3d: boolean;
  toEmbalaje: boolean; // siempre true para souvenirs
};

type Servicio = {
  id: string;
  createdAt: number;

  nombre: string;
  telefono: string;
  acabados: Array<'CORTE_LASER' | 'DTF' | 'BORDADO' | 'PLANILLAS_SUBLIMADAS'>;
  imagenes: string[]; // guardamos nombres/refs simples por ahora
  observaciones: string;
  fechaEntrega: string;

  // regla de salida
  toProducciones: boolean; // siempre true para servicio
};

const STORAGE_KEY = 'bormex_cloud_data_v1';
const BC_NAME = 'bormex_cloud_bc_v1';

type StoreShape = {
  souvenirs: PedidoSouvenir[];
  servicios: Servicio[];
};

const PRODUCT_LABEL: Record<ProductoKind, string> = {
  LLAVERO: 'Llavero',
  IMAN: 'Imán',
  PIN: 'Pin',
};

const ACABADO_LABEL: Record<Servicio['acabados'][number], string> = {
  CORTE_LASER: 'Corte láser',
  DTF: 'DTF',
  BORDADO: 'Bordado',
  PLANILLAS_SUBLIMADAS: 'Planillas sublimadas',
};

function safeParseStore(raw: string | null): StoreShape {
  if (!raw) return { souvenirs: [], servicios: [] };
  try {
    const obj = JSON.parse(raw) as Partial<StoreShape>;
    return {
      souvenirs: Array.isArray(obj.souvenirs) ? obj.souvenirs : [],
      servicios: Array.isArray(obj.servicios) ? obj.servicios : [],
    };
  } catch {
    return { souvenirs: [], servicios: [] };
  }
}

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function clampInt(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

export default function DesingPage() {
  const [store, setStore] = useState<StoreShape>({ souvenirs: [], servicios: [] });

  const [q, setQ] = useState('');

  const [openSouvenir, setOpenSouvenir] = useState(false);
  const [openServicio, setOpenServicio] = useState(false);

  // Souvenir wizard state
  const [sStep, setSStep] = useState<1 | 2 | 3>(1);
  const [sClienteNombre, setSClienteNombre] = useState('');
  const [sClienteTel, setSClienteTel] = useState('');
  const [sDestino, setSDestino] = useState('');
  const [sFechaEntrega, setSFechaEntrega] = useState('');

  const [sSelLlavero, setSSelLlavero] = useState(false);
  const [sSelIman, setSSelIman] = useState(false);
  const [sSelPin, setSSelPin] = useState(false);

  const selectedKinds = useMemo<ProductoKind[]>(() => {
    const out: ProductoKind[] = [];
    if (sSelLlavero) out.push('LLAVERO');
    if (sSelIman) out.push('IMAN');
    if (sSelPin) out.push('PIN');
    return out;
  }, [sSelLlavero, sSelIman, sSelPin]);

  const [sDetalles, setSDetalles] = useState<Record<ProductoKind, ProductoDetalle>>({
    LLAVERO: {
      kind: 'LLAVERO',
      piezas: 0,
      disenos: 0,
      exhibidor: { planoQty: 0, mesaQty: 0, noAplica: false },
      observaciones: '',
    },
    IMAN: {
      kind: 'IMAN',
      piezas: 0,
      disenos: 0,
      exhibidor: { planoQty: 0, mesaQty: 0, noAplica: false },
      observaciones: '',
    },
    PIN: {
      kind: 'PIN',
      piezas: 0,
      disenos: 0,
      exhibidor: { planoQty: 0, mesaQty: 0, noAplica: false },
      observaciones: '',
    },
  });

  // Servicio form state
  const [svNombre, setSvNombre] = useState('');
  const [svTel, setSvTel] = useState('');
  const [svAcabados, setSvAcabados] = useState<Servicio['acabados']>([]);
  const [svImagenes, setSvImagenes] = useState<string[]>([]);
  const [svObs, setSvObs] = useState('');
  const [svFecha, setSvFecha] = useState('');

  // realtime (localStorage + BroadcastChannel)
  useEffect(() => {
    const initial = safeParseStore(localStorage.getItem(STORAGE_KEY));
    setStore(initial);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setStore(safeParseStore(e.newValue));
      }
    };
    window.addEventListener('storage', onStorage);

    const bc = 'BroadcastChannel' in window ? new BroadcastChannel(BC_NAME) : null;
    if (bc) {
      bc.onmessage = (msg) => {
        if (msg?.data?.type === 'sync') {
          setStore(safeParseStore(localStorage.getItem(STORAGE_KEY)));
        }
      };
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      if (bc) bc.close();
    };
  }, []);

  function persist(next: StoreShape) {
    setStore(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel(BC_NAME);
      bc.postMessage({ type: 'sync' });
      bc.close();
    }
  }

  function resetSouvenirWizard() {
    setSStep(1);
    setSClienteNombre('');
    setSClienteTel('');
    setSDestino('');
    setSFechaEntrega('');
    setSSelLlavero(false);
    setSSelIman(false);
    setSSelPin(false);
    setSDetalles({
      LLAVERO: {
        kind: 'LLAVERO',
        piezas: 0,
        disenos: 0,
        exhibidor: { planoQty: 0, mesaQty: 0, noAplica: false },
        observaciones: '',
      },
      IMAN: {
        kind: 'IMAN',
        piezas: 0,
        disenos: 0,
        exhibidor: { planoQty: 0, mesaQty: 0, noAplica: false },
        observaciones: '',
      },
      PIN: {
        kind: 'PIN',
        piezas: 0,
        disenos: 0,
        exhibidor: { planoQty: 0, mesaQty: 0, noAplica: false },
        observaciones: '',
      },
    });
  }

  function openSouvenirModal() {
    resetSouvenirWizard();
    setOpenSouvenir(true);
  }

  function openServicioModal() {
    setSvNombre('');
    setSvTel('');
    setSvAcabados([]);
    setSvImagenes([]);
    setSvObs('');
    setSvFecha('');
    setOpenServicio(true);
  }

  function toggleAcabado(a: Servicio['acabados'][number]) {
    setSvAcabados((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function souvenirStep1Valid() {
    return (
      sClienteNombre.trim().length > 0 &&
      sClienteTel.trim().length > 0 &&
      sDestino.trim().length > 0 &&
      sFechaEntrega.trim().length > 0
    );
  }

  function souvenirStep2Valid() {
    return selectedKinds.length >= 1;
  }

  function updateDetalle(kind: ProductoKind, patch: Partial<ProductoDetalle>) {
    setSDetalles((prev) => ({
      ...prev,
      [kind]: {
        ...prev[kind],
        ...patch,
      },
    }));
  }

  function updateExhibidor(kind: ProductoKind, patch: Partial<Exhibidor>) {
    setSDetalles((prev) => {
      const current = prev[kind];
      const nextEx = { ...current.exhibidor, ...patch };

      if (nextEx.noAplica) {
        nextEx.planoQty = 0;
        nextEx.mesaQty = 0;
      } else {
        nextEx.planoQty = clampInt(nextEx.planoQty);
        nextEx.mesaQty = clampInt(nextEx.mesaQty);
      }

      return {
        ...prev,
        [kind]: { ...current, exhibidor: nextEx },
      };
    });
  }

  function saveSouvenir() {
    // validar
    if (!souvenirStep1Valid()) return alert('Faltan datos del cliente (paso 1).');
    if (!souvenirStep2Valid()) return alert('Selecciona al menos 1 producto (paso 2).');

    const productos: ProductoDetalle[] = selectedKinds.map((k) => {
      const d = sDetalles[k];
      return {
        kind: k,
        piezas: clampInt(d.piezas),
        disenos: clampInt(d.disenos),
        exhibidor: {
          noAplica: !!d.exhibidor.noAplica,
          planoQty: d.exhibidor.noAplica ? 0 : clampInt(d.exhibidor.planoQty),
          mesaQty: d.exhibidor.noAplica ? 0 : clampInt(d.exhibidor.mesaQty),
        },
        observaciones: (d.observaciones ?? '').toString(),
      };
    });

    const pedido: PedidoSouvenir = {
      id: uid('souvenir'),
      createdAt: Date.now(),
      clienteNombre: sClienteNombre.trim(),
      clienteTelefono: sClienteTel.trim(),
      destino: sDestino.trim(),
      fechaEntrega: sFechaEntrega.trim(),
      productos,
      to3d: selectedKinds.includes('LLAVERO'),
      toEmbalaje: true,
    };

    const next: StoreShape = {
      ...store,
      souvenirs: [pedido, ...store.souvenirs],
    };

    persist(next);
    setOpenSouvenir(false);
  }

  function saveServicio() {
    if (svNombre.trim().length === 0) return alert('Falta: Nombre');
    if (svTel.trim().length === 0) return alert('Falta: Número de cliente');
    if (svFecha.trim().length === 0) return alert('Falta: Fecha de entrega');

    const servicio: Servicio = {
      id: uid('servicio'),
      createdAt: Date.now(),
      nombre: svNombre.trim(),
      telefono: svTel.trim(),
      acabados: svAcabados,
      imagenes: svImagenes,
      observaciones: svObs.trim(),
      fechaEntrega: svFecha.trim(),
      toProducciones: true,
    };

    const next: StoreShape = {
      ...store,
      servicios: [servicio, ...store.servicios],
    };

    persist(next);
    setOpenServicio(false);
  }

  const filteredSouvenirs = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return store.souvenirs;
    return store.souvenirs.filter((s) => {
      const hay = [
        s.clienteNombre,
        s.clienteTelefono,
        s.destino,
        s.fechaEntrega,
        s.productos.map((p) => PRODUCT_LABEL[p.kind]).join(' '),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }, [store.souvenirs, q]);

  return (
    <main className="p-6 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">DESING</h1>
          <p className="text-sm text-neutral-500">
            Aquí se capturan pedidos de souvenirs y servicios. (Realtime local por ahora)
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (cliente, destino, teléfono, producto...)"
            className="w-full sm:w-[360px] rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
          />
          <button
            onClick={openSouvenirModal}
            className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm"
          >
            + Agregar Souvenir
          </button>
          <button
            onClick={openServicioModal}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
          >
            + Agregar Servicio
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <div className="font-semibold">Pedidos (Souvenirs)</div>
            <div className="text-xs text-neutral-500">
              Al guardar: aparece en DESING, y marca envío a 3D si incluye llavero, y a Embalaje siempre.
            </div>
          </div>
          <div className="text-xs text-neutral-500">
            Total: <span className="font-medium text-neutral-900">{filteredSouvenirs.length}</span>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr className="border-b border-neutral-200">
                <th className="p-3">Cliente</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Destino</th>
                <th className="p-3">Entrega</th>
                <th className="p-3">Productos</th>
                <th className="p-3">Rutas</th>
              </tr>
            </thead>
            <tbody>
              {filteredSouvenirs.length === 0 ? (
                <tr>
                  <td className="p-6 text-neutral-500" colSpan={6}>
                    No hay pedidos aún.
                  </td>
                </tr>
              ) : (
                filteredSouvenirs.map((s) => (
                  <tr key={s.id} className="border-b border-neutral-100">
                    <td className="p-3 font-medium">{s.clienteNombre}</td>
                    <td className="p-3">{s.clienteTelefono}</td>
                    <td className="p-3">{s.destino}</td>
                    <td className="p-3">{s.fechaEntrega}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {s.productos.map((p) => (
                          <span
                            key={`${s.id}_${p.kind}`}
                            className="text-xs px-2 py-1 rounded-lg bg-neutral-100 border border-neutral-200"
                          >
                            {PRODUCT_LABEL[p.kind]} · piezas {p.piezas} · diseños {p.disenos}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 rounded-lg bg-neutral-100 border border-neutral-200">
                          DESING
                        </span>
                        {s.to3d && (
                          <span className="text-xs px-2 py-1 rounded-lg bg-neutral-100 border border-neutral-200">
                            3D
                          </span>
                        )}
                        {s.toEmbalaje && (
                          <span className="text-xs px-2 py-1 rounded-lg bg-neutral-100 border border-neutral-200">
                            Embalaje
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL: Souvenir */}
      {openSouvenir && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white border border-neutral-200 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <div className="font-semibold">Agregar Souvenir</div>
                <div className="text-xs text-neutral-500">Paso {sStep} de 3</div>
              </div>
              <button
                onClick={() => setOpenSouvenir(false)}
                className="text-sm px-3 py-1 rounded-lg border border-neutral-300"
              >
                Cerrar
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Paso 1 */}
              {sStep === 1 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Paso 1 — Datos del cliente</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-500">Nombre del cliente *</label>
                      <input
                        value={sClienteNombre}
                        onChange={(e) => setSClienteNombre(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500">Número telefónico del cliente *</label>
                      <input
                        value={sClienteTel}
                        onChange={(e) => setSClienteTel(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500">Destino *</label>
                      <input
                        value={sDestino}
                        onChange={(e) => setSDestino(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500">Fecha de entrega *</label>
                      <input
                        value={sFechaEntrega}
                        onChange={(e) => setSFechaEntrega(e.target.value)}
                        placeholder="YYYY-MM-DD o texto"
                        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        if (!souvenirStep1Valid()) return alert('Completa todos los campos obligatorios.');
                        setSStep(2);
                      }}
                      className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 2 */}
              {sStep === 2 && (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Paso 2 — Seleccionar productos</div>
                  <div className="text-xs text-neutral-500">Puedes elegir 1, 2 o 3 productos.</div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 rounded-xl border border-neutral-200 p-3">
                      <input
                        type="checkbox"
                        checked={sSelLlavero}
                        onChange={(e) => setSSelLlavero(e.target.checked)}
                      />
                      <span className="text-sm">Llavero</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border border-neutral-200 p-3">
                      <input
                        type="checkbox"
                        checked={sSelIman}
                        onChange={(e) => setSSelIman(e.target.checked)}
                      />
                      <span className="text-sm">Imán</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-xl border border-neutral-200 p-3">
                      <input
                        type="checkbox"
                        checked={sSelPin}
                        onChange={(e) => setSSelPin(e.target.checked)}
                      />
                      <span className="text-sm">Pin</span>
                    </label>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => setSStep(1)}
                      className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={() => {
                        if (!souvenirStep2Valid()) return alert('Selecciona al menos 1 producto.');
                        setSStep(3);
                      }}
                      className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 3 */}
              {sStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium">Paso 3 — Datos por producto</div>
                    <div className="text-xs text-neutral-500">
                      Se genera una sección por cada producto seleccionado.
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedKinds.map((kind) => {
                      const d = sDetalles[kind];
                      const ex = d.exhibidor;

                      return (
                        <div key={kind} className="rounded-2xl border border-neutral-200 p-4">
                          <div className="font-semibold mb-3">{PRODUCT_LABEL[kind]}</div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-neutral-500">Número de piezas</label>
                              <input
                                type="number"
                                value={d.piezas}
                                onChange={(e) =>
                                  updateDetalle(kind, { piezas: clampInt(Number(e.target.value)) })
                                }
                                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-neutral-500">Número de diseños</label>
                              <input
                                type="number"
                                value={d.disenos}
                                onChange={(e) =>
                                  updateDetalle(kind, { disenos: clampInt(Number(e.target.value)) })
                                }
                                className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                              />
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="text-xs text-neutral-500 mb-2">Tipo de exhibidor</div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <label className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 p-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!ex.noAplica && ex.planoQty > 0}
                                    onChange={(e) => {
                                      if (ex.noAplica) return;
                                      updateExhibidor(kind, { planoQty: e.target.checked ? Math.max(1, ex.planoQty) : 0 });
                                    }}
                                  />
                                  <span className="text-sm">Plano</span>
                                </div>
                                <input
                                  type="number"
                                  disabled={ex.noAplica}
                                  value={ex.noAplica ? 0 : ex.planoQty}
                                  onChange={(e) => updateExhibidor(kind, { planoQty: Number(e.target.value) })}
                                  className="w-20 rounded-lg border border-neutral-200 px-2 py-1 text-sm"
                                />
                              </label>

                              <label className="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 p-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={!ex.noAplica && ex.mesaQty > 0}
                                    onChange={(e) => {
                                      if (ex.noAplica) return;
                                      updateExhibidor(kind, { mesaQty: e.target.checked ? Math.max(1, ex.mesaQty) : 0 });
                                    }}
                                  />
                                  <span className="text-sm">De mesa</span>
                                </div>
                                <input
                                  type="number"
                                  disabled={ex.noAplica}
                                  value={ex.noAplica ? 0 : ex.mesaQty}
                                  onChange={(e) => updateExhibidor(kind, { mesaQty: Number(e.target.value) })}
                                  className="w-20 rounded-lg border border-neutral-200 px-2 py-1 text-sm"
                                />
                              </label>

                              <label className="flex items-center gap-2 rounded-xl border border-neutral-200 p-3">
                                <input
                                  type="checkbox"
                                  checked={ex.noAplica}
                                  onChange={(e) => updateExhibidor(kind, { noAplica: e.target.checked })}
                                />
                                <span className="text-sm">No aplica</span>
                              </label>
                            </div>

                            <div className="mt-3 text-xs text-neutral-500">
                              Regla: puedes marcar Plano + Mesa al mismo tiempo y poner cantidad para cada uno.  
                              Si seleccionas “No aplica”, plano/mesa quedan en 0.
                            </div>
                          </div>

                          <div className="mt-4">
                            <label className="text-xs text-neutral-500">Observaciones</label>
                            <textarea
                              value={d.observaciones}
                              onChange={(e) => updateDetalle(kind, { observaciones: e.target.value })}
                              className="mt-1 w-full min-h-[80px] rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={() => setSStep(2)}
                      className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm"
                    >
                      Atrás
                    </button>

                    <button
                      onClick={saveSouvenir}
                      className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm"
                    >
                      Guardar pedido
                    </button>
                  </div>

                  <div className="text-xs text-neutral-500">
                    Resultado al guardar: aparece en DESING (siempre), 3D (si incluye llavero), Embalaje (siempre).
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Servicio */}
      {openServicio && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-neutral-200 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <div className="font-semibold">Agregar Servicio</div>
                <div className="text-xs text-neutral-500">Se guardará para Producciones BORMEX (conexión real luego).</div>
              </div>
              <button
                onClick={() => setOpenServicio(false)}
                className="text-sm px-3 py-1 rounded-lg border border-neutral-300"
              >
                Cerrar
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-500">Nombre *</label>
                  <input
                    value={svNombre}
                    onChange={(e) => setSvNombre(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Número de cliente *</label>
                  <input
                    value={svTel}
                    onChange={(e) => setSvTel(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs text-neutral-500 mb-2">Acabado (multi-selección)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['CORTE_LASER', 'DTF', 'BORDADO', 'PLANILLAS_SUBLIMADAS'] as const).map((a) => (
                    <label key={a} className="flex items-center gap-2 rounded-xl border border-neutral-200 p-3">
                      <input
                        type="checkbox"
                        checked={svAcabados.includes(a)}
                        onChange={() => toggleAcabado(a)}
                      />
                      <span className="text-sm">{ACABADO_LABEL[a]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 p-4">
                <div className="text-sm font-medium mb-2">Cargar imágenes (si aplica)</div>
                <div className="text-xs text-neutral-500 mb-2">
                  Por ahora guardamos el nombre del archivo (luego lo conectamos a storage real).
                </div>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []).map((f) => f.name);
                    setSvImagenes(files);
                  }}
                />
                {svImagenes.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {svImagenes.map((name) => (
                      <span key={name} className="text-xs px-2 py-1 rounded-lg bg-neutral-100 border border-neutral-200">
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-neutral-500">Observaciones</label>
                <textarea
                  value={svObs}
                  onChange={(e) => setSvObs(e.target.value)}
                  className="mt-1 w-full min-h-[90px] rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-500">Fecha de entrega *</label>
                <input
                  value={svFecha}
                  onChange={(e) => setSvFecha(e.target.value)}
                  placeholder="YYYY-MM-DD o texto"
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={saveServicio}
                  className="rounded-xl bg-neutral-900 text-white px-4 py-2 text-sm"
                >
                  Guardar
                </button>
              </div>

              <div className="text-xs text-neutral-500">
                Resultado al guardar: queda marcado para Producciones BORMEX (lo conectamos a la tabla real luego).
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
