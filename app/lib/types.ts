// app/lib/types.ts
export type ProductKind = "llavero" | "iman" | "pin";

export type ExhibidorType = {
  noAplica: boolean;
  planoQty: number; // 0..n
  mesaQty: number; // 0..n
};

export type SouvenirProductData = {
  kind: ProductKind;
  piezas: number;
  disenos: number;
  exhibidor: ExhibidorType;
  observaciones: string;
};

export type LlaveroDisenoState = {
  idx: number; // 1..N
  piezasImpresas: number;
  terminado: boolean;
};

export type OrderSouvenirs = {
  type: "souvenirs";
  archived: boolean;
  createdAt: any;
  updatedAt: any;
  archivedAt?: any;

  clienteNombre: string;
  clienteTelefono: string;
  destino: string;
  fechaEntrega: string; // YYYY-MM-DD

  productos: SouvenirProductData[];

  // DESING extras
  empaque: boolean;
  exhibidoresListos: boolean;
  imagenes: { url: string; path: string; createdAt: any; kind?: ProductKind; designIdx?: number }[];

  // 3D control (solo llavero)
  llaveroDisenos?: LlaveroDisenoState[];
};

export type OrderServicio = {
  type: "servicio";
  archived: boolean;
  createdAt: any;
  updatedAt: any;
  archivedAt?: any;

  nombre: string;
  numeroCliente: string;
  telefono: string;
  acabados: string[]; // Corte láser, DTF, Bordado, Planillas sublimadas
  observaciones: string;
  fechaEntrega: string; // YYYY-MM-DD
  imagenes: { url: string; path: string; createdAt: any; kind?: ProductKind; designIdx?: number }[];
};

export type AnyOrder = (OrderSouvenirs | OrderServicio) & { id: string };
