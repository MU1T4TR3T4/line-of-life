import { getAccessToken } from "@/lib/google-auth";

export const runtime = "edge";

/**
 * Entrega uma foto ou vídeo do Drive para quem está no site.
 * s=thumb  → miniatura em JPEG gerada pelo próprio Drive (funciona até para HEIC)
 * s=large  → versão grande em JPEG
 * s=original → arquivo original, em partes (Range), para o vídeo tocar sem baixar tudo
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[\w-]{10,}$/.test(id)) return new Response("id inválido", { status: 400 });
  const size = new URL(req.url).searchParams.get("s") ?? "thumb";
  const token = await getAccessToken();
  const auth = { authorization: `Bearer ${token}` };
  const cache = "private, max-age=2592000, immutable";

  if (size === "thumb" || size === "large") {
    const meta = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=thumbnailLink,mimeType&supportsAllDrives=true`, { headers: auth });
    if (!meta.ok) return new Response("não encontrado", { status: meta.status });
    const { thumbnailLink, mimeType } = (await meta.json()) as { thumbnailLink?: string; mimeType: string };
    if (thumbnailLink) {
      const px = size === "thumb" ? 640 : 2048;
      const url = thumbnailLink.replace(/=s\d+(-[a-z]+)?$/, `=s${px}`);
      const img = await fetch(url, { headers: auth });
      if (img.ok) {
        return new Response(img.body, {
          headers: { "content-type": img.headers.get("content-type") ?? "image/jpeg", "cache-control": cache },
        });
      }
    }
    // sem miniatura: cai para o arquivo original (fotos JPEG/PNG funcionam direto)
    if (!mimeType.startsWith("image/")) return new Response("sem miniatura", { status: 404 });
  }

  const headers: Record<string, string> = { ...auth };
  const range = req.headers.get("range");
  if (range) headers.range = range;
  const file = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, { headers });
  if (!file.ok && file.status !== 206) return new Response("não encontrado", { status: file.status });

  const out = new Headers({ "cache-control": cache, "accept-ranges": "bytes" });
  for (const h of ["content-type", "content-length", "content-range"]) {
    const v = file.headers.get(h);
    if (v) out.set(h, v);
  }
  return new Response(file.body, { status: file.status, headers: out });
}
