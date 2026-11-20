/** Senha da família: o cookie guarda um resumo da senha, nunca a senha. */
export const COOKIE = "familia";

export async function passwordToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`linha-do-tempo:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
