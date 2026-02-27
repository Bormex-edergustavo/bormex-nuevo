'use client';

import React from 'react';

function Btn({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="px-4 py-3 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition"
    >
      <div className="text-lg font-semibold">{label}</div>
      <div className="text-sm text-neutral-500">{href}</div>
    </a>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bormex</h1>
          <p className="text-neutral-600 mt-1">
            Panel en la nube (tiempo real). Abre cada tabla en una pestaña nueva.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Btn href="/desing" label="DESING" />
          <Btn href="/3d" label="3D" />
          <Btn href="/embalaje" label="EMBALAJE" />
          <Btn href="/producciones" label="PRODUCCIONES" />
          <Btn href="/nuevo-souvenir" label="Agregar Souvenir" />
          <Btn href="/nuevo-servicio" label="Agregar Servicio" />
        </div>

        <div className="mt-10 text-xs text-neutral-400">
          Nota: esto es el HOME. Luego conectamos los datos reales (Firebase/Supabase) sin romper el deploy.
        </div>
      </div>
    </main>
  );
}
