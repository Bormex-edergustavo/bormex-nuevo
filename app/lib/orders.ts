// app/lib/orders.ts
"use client";

import { db, storage } from "./firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  arrayUnion,
  serverTimestamp,
  updateDoc,
  where,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { deleteObject, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { AnyOrder, OrderServicio, OrderSouvenirs, ProductKind, SouvenirProductData } from "./types";
import { buildLlaveroDisenos, hasLlavero, llaveroInfo } from "./helpers";

export const ordersCol = collection(db, "orders");

export function listenActiveSouvenirs(cb: (rows: AnyOrder[]) => void) {
  const q = query(
    ordersCol,
    where("type", "==", "souvenirs"),
    where("archived", "==", false)
  );
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AnyOrder[];
    cb(rows);
  });
}

export function listenActiveServicios(cb: (rows: AnyOrder[]) => void) {
  const q = query(
    ordersCol,
    where("type", "==", "servicio"),
    where("archived", "==", false)
  );
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AnyOrder[];
    cb(rows);
  });
}

export function listenArchived(cb: (rows: AnyOrder[]) => void) {
  const q = query(ordersCol, where("archived", "==", true), orderBy("archivedAt", "desc"));
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AnyOrder[];
    cb(rows);
  });
}

export async function createSouvenirOrder(input: {
  clienteNombre: string;
  clienteTelefono: string;
  destino: string;
  fechaEntrega: string;
  productos: SouvenirProductData[];
}): Promise<string> {
  const docRef = await addDoc(ordersCol, {
    type: "souvenirs",
    archived: false,
    createdAt: Date.now(),
    updatedAt: serverTimestamp(),
    clienteNombre: input.clienteNombre,
    clienteTelefono: input.clienteTelefono,
    destino: input.destino,
    fechaEntrega: input.fechaEntrega,
    productos: input.productos,
    empaque: false,
    exhibidoresListos: false,
    imagenes: [],
    llaveroDisenos: hasLlavero(input.productos) ? buildLlaveroDisenos(llaveroInfo(input.productos).disenos) : [],
  } satisfies Partial<OrderSouvenirs>);
  return docRef.id;
}

export async function createServicioOrder(input: {
  nombre: string;
  numeroCliente: string;
  telefono: string;
  acabados: string[];
  observaciones: string;
  fechaEntrega: string;
}): Promise<string> {
  const docRef = await addDoc(ordersCol, {
    type: "servicio",
    archived: false,
    createdAt: Date.now(),
    updatedAt: serverTimestamp(),
    nombre: input.nombre,
    numeroCliente: input.numeroCliente,
    telefono: input.telefono,
    acabados: input.acabados,
    observaciones: input.observaciones,
    fechaEntrega: input.fechaEntrega,
    imagenes: [],
  } satisfies Partial<OrderServicio>);
  return docRef.id;
}

export async function updateOrder(id: string, patch: Record<string, any>) {
  await updateDoc(doc(db, "orders", id), { ...patch, updatedAt: serverTimestamp() });
}

export async function archiveOrder(id: string) {
  await updateDoc(doc(db, "orders", id), { archived: true, archivedAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function restoreOrder(id: string) {
  await updateDoc(doc(db, "orders", id), { archived: false, archivedAt: null, updatedAt: serverTimestamp() });
}

export async function deleteOrder(id: string) {
  // Best-effort: delete images in Storage too
  const snap = await getDoc(doc(db, "orders", id));
  if (snap.exists()) {
    const data: any = snap.data();
    const imgs: { path: string }[] = data?.imagenes ?? [];
    await Promise.all(
      imgs.map(async (img) => {
        if (!img?.path) return;
        try {
          await deleteObject(ref(storage, img.path));
        } catch {}
      })
    );
  }
  await deleteDoc(doc(db, "orders", id));
}

export async function emptyArchived() {
  const unsub = listenArchived(async (rows) => {
    unsub(); // one-shot
    await Promise.all(rows.map((r) => deleteOrder(r.id)));
  });
}

export async function ensureLlaveroDisenos(orderId: string) {
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return;
  const data: any = snap.data();
  if (data.type !== "souvenirs") return;
  const productos: SouvenirProductData[] = data.productos ?? [];
  const { disenos } = llaveroInfo(productos);
  const next = buildLlaveroDisenos(disenos, data.llaveroDisenos ?? []);
  await updateDoc(doc(db, "orders", orderId), { llaveroDisenos: next, updatedAt: serverTimestamp() });
}

export async function uploadOrderImage(orderId: string, file: File): Promise<{ url: string; path: string }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  const path = `orders/${orderId}/${Date.now()}_${Math.random().toString(16).slice(2)}_${safeName}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function addOrderImage(
  orderId: string,
  file: File,
  meta?: { kind?: ProductKind; designIdx?: number }
) {
  const ext = file.name.split(".").pop() || "png";
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const path = `orders/${orderId}/${id}.${ext}`;

  const r = ref(storage, path);
  await uploadBytes(r, file);
  const url = await getDownloadURL(r);

  const newImg: any = { id, url, path, createdAt: Date.now() };
  if (meta?.kind) newImg.kind = meta.kind;
  if (typeof meta?.designIdx === "number") newImg.designIdx = meta.designIdx;

  // Nota: NO usamos serverTimestamp() dentro del array (Firebase no lo soporta en arrays)
  await updateDoc(doc(db, "orders", orderId), {
    imagenes: arrayUnion(newImg),
    updatedAt: serverTimestamp(),
  });
}

export async function removeOrderImage(orderId: string, path: string) {
  // delete storage first
  try {
    await deleteObject(ref(storage, path));
  } catch {}
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return;
  const data: any = snap.data();
  const imagenes = Array.isArray(data.imagenes) ? data.imagenes : [];
  const next = imagenes.filter((x: any) => x?.path !== path);
  await updateDoc(doc(db, "orders", orderId), { imagenes: next, updatedAt: serverTimestamp() });
}

export async function setEmpaque(orderId: string, value: boolean) {
  await updateOrder(orderId, { empaque: !!value });
}

export async function setExhibidoresListos(orderId: string, value: boolean) {
  await updateOrder(orderId, { exhibidoresListos: !!value });
}

export async function updateLlaveroDiseno(orderId: string, idx: number, patch: { piezasImpresas?: number; terminado?: boolean }) {
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return;
  const data: any = snap.data();
  const list: any[] = Array.isArray(data.llaveroDisenos) ? data.llaveroDisenos : [];
  const productos: SouvenirProductData[] = data.productos ?? [];
  const { piezas } = llaveroInfo(productos);

  const next = list.map((d) => {
    if (d.idx !== idx) return d;
    const piezasImpresas = patch.piezasImpresas !== undefined ? Math.max(0, Math.min(piezas, Number(patch.piezasImpresas))) : d.piezasImpresas;
    const terminado = patch.terminado !== undefined ? !!patch.terminado : !!d.terminado;
    return { ...d, piezasImpresas, terminado };
  });
  await updateDoc(doc(db, "orders", orderId), { llaveroDisenos: next, updatedAt: serverTimestamp() });
}
