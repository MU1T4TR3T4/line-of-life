import { CHILD } from "@/config";

export const metadata = { title: `Entrar · ${CHILD.name}` };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <main className="gate">
      <form className="gate-card" method="post" action="/api/entrar">
        <div className="gate-name">{CHILD.name}</div>
        <p className="gate-sub">a linha do tempo da família</p>
        <label htmlFor="senha" className="gate-label">
          Senha da família
        </label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required autoFocus className="gate-input" />
        {erro && <p className="gate-err">Senha errada. Tente de novo.</p>}
        <button type="submit" className="gate-btn">
          Entrar
        </button>
      </form>
    </main>
  );
}
