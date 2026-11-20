import { revalidatePath } from "next/cache";

/** Busca de novo as fotos do Drive agora, sem esperar os 15 minutos. */
export async function POST() {
  revalidatePath("/");
  return Response.json({ ok: true });
}
