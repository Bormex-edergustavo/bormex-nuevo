// app/lib/helpers.ts
import type { ExhibidorType, LlaveroDisenoState, SouvenirProductData } from "./types";

export function normalizeExhibidor(ex: Partial<ExhibidorType> | undefined): ExhibidorType {
  const noAplica = !!ex?.noAplica;
  const planoQty = Number.isFinite(ex?.planoQty as number) ? Number(ex?.planoQty) : 0;
  const mesaQty = Number.isFinite(ex?.mesaQty as number) ? Number(ex?.mesaQty) : 0;
  return {
    noAplica,
    planoQty: noAplica ? 0 : Math.max(0, planoQty),
    mesaQty: noAplica ? 0 : Math.max(0, mesaQty),
  };
}

export function hasLlavero(productos: SouvenirProductData[]): boolean {
  return productos.some((p) => p.kind === "llavero");
}

export function llaveroInfo(productos: SouvenirProductData[]) {
  const p = productos.find((x) => x.kind === "llavero");
  return {
    piezas: p?.piezas ?? 0,
    disenos: p?.disenos ?? 0,
    observaciones: p?.observaciones ?? "",
  };
}

export function buildLlaveroDisenos(count: number, prev?: LlaveroDisenoState[]): LlaveroDisenoState[] {
  const safeCount = Math.max(0, Math.floor(count));
  const existing = new Map<number, LlaveroDisenoState>();
  (prev ?? []).forEach((d) => existing.set(d.idx, d));
  const out: LlaveroDisenoState[] = [];
  for (let i = 1; i <= safeCount; i++) {
    const ex = existing.get(i);
    out.push({
      idx: i,
      piezasImpresas: ex?.piezasImpresas ?? 0,
      terminado: ex?.terminado ?? false,
    });
  }
  return out;
}

export function daysToEntrega(fechaEntregaISO: string): number | null {
  if (!fechaEntregaISO) return null;
  const d = new Date(fechaEntregaISO + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = d.getTime() - t0.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function estatusPorTiempo(fechaEntregaISO: string): "A TIEMPO" | "PRÓXIMO" | "HOY" | "VENCIDO" | "SIN FECHA" {
  const days = daysToEntrega(fechaEntregaISO);
  if (days === null) return "SIN FECHA";
  if (days < 0) return "VENCIDO";
  if (days === 0) return "HOY";
  if (days <= 2) return "PRÓXIMO";
  return "A TIEMPO";
}
