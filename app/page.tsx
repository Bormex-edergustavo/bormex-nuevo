"use client";

import Link from "next/link";

export default function HomePage() {
  const openWin = (path: string) => {
    window.open(path, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen p-6 bg-neutral-950 text-neutral-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold">Bormex</h1>
        <p className="text-neutral-400 mt-1">Pedidos (Souvenirs / Servicio) — tiempo real</p>

        {/* Bloque A */}
        <section className="mt-8 p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <h2 className="text-xl font-semibold">Agregar pedido</h2>
          <div className="mt-4 flex gap-3 flex-wrap">
            <Link href="/agregar/servicio" className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-medium">
              SERVICIO
            </Link>
            <Link href="/agregar/souvenirs" className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-medium">
              SOUVENIRS
            </Link>
          </div>
        </section>

        {/* Bloque B */}
        <section className="mt-6 p-5 rounded-2xl bg-neutral-900 border border-neutral-800">
          <h2 className="text-xl font-semibold">Tablas (ventanas independientes)</h2>
          <p className="text-neutral-400 text-sm mt-1">Cada botón abre su tabla en otra pestaña/ventana.</p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => openWin("/desing")} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-left">
              Abrir DESING
            </button>
            <button onClick={() => openWin("/3d")} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-left">
              Abrir 3D
            </button>
            <button onClick={() => openWin("/embalaje")} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-left">
              Abrir Embalaje
            </button>
            <button onClick={() => openWin("/producciones")} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-left">
              Abrir Producciones BORMEX
            </button>
          </div>
        </section>

        {/* Bloque C + D */}
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => openWin("/alertas")} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-left">
            <h3 className="text-lg font-semibold">Alertas WhatsApp</h3>
            <p className="text-neutral-400 text-sm mt-1">(Pendiente) Crear/editar/eliminar alertas</p>
          </button>

          <button onClick={() => openWin("/archivados")} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-left">
            <h3 className="text-lg font-semibold">Archivados</h3>
            <p className="text-neutral-400 text-sm mt-1">Restaurar o borrar definitivo.</p>
          </button>
        </section>
      </div>
    </main>
  );
}
