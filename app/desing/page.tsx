'use client';

import React from 'react';

const PRODUCT_LABEL: Record<string, string> = {
  IMAN_BORDADO: 'Imán bordado',
  PIN: 'Pin',
  LLAVERO_3D: 'Llavero 3D',
  SERVICIO: 'Servicio',
};

type Producto = {
  kind?: string;
  piezas?: number;
  disenos?: number;
};

export default function DesingPage() {
  const productos: Producto[] = [];

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">DESING</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {(productos ?? []).map((p, i) => (
          <span
            key={`${String(p.kind)}-${i}`}
            className="text-xs px-2 py-1 rounded-lg bg-neutral-800 border border-neutral-700"
          >
            {(PRODUCT_LABEL as Record<string, string>)[String(p.kind)] ?? String(p.kind)} - piezas{' '}
            {p.piezas ?? 0} - diseños {p.disenos ?? 0}
          </span>
        ))}
      </div>
    </main>
  );
}
