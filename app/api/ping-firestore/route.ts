import { NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export async function GET() {
  try {
    const ref = await addDoc(collection(db, "ping"), {
      ok: true,
      createdAt: serverTimestamp(),
      from: "bormex-nuevo",
    });

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
