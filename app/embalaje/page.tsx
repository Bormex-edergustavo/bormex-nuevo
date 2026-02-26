'use client';

import React from 'react';

const PRODUCT_LABEL = {
  IMAN_BORDADO: 'Imán bordado',
  PIN: 'Pin',
  LLAVERO_3D: 'Llavero 3D',
  SERVICIO: 'Servicio',
} as const;

type ProductoKind = keyof typeof PRODUCT_LABEL;

type Producto = {
  kind: ProductoKind;
  piezas?: number;
  disenos?: number;
};

export default function EmbalajePage() {
  const productos: Producto[] = [];

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">EMBALAJE</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {(productos ?? []).map((p, i) => (
          <span
            key={`${p.kind}-${i}`}
            className="text-xs px-2 py-1 rounded-lg bg-neutral-800 border border-neutral-700"
          >
            {PRODUCT_LABEL[p.kind]} · piezas {p.piezas ?? 0} · diseños {p.disenos ?? 0}
          </span>
        ))}
      </div>
    </main>
  );
}
