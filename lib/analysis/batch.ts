// Reanálise em lote do pipeline com IA (assinatura/API), em background e com
// progresso persistido em config. Reanalisa os editais que ainda só têm
// triagem heurística e estão com prazo aberto — para o pipeline refletir
// elegibilidade real, não chute de keyword.

import { all, getConfig, setConfig } from "../db";
import { analisarEdital, resolverModoIa } from "./analyzer";

let rodando = false; // guarda em processo (evita lotes simultâneos)

export interface ReanaliseStatus {
  rodando: boolean;
  total: number;
  feitos: number;
  erros: number;
  modo: string | null;
  ultimoEdital: string | null;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
}

const VAZIO: ReanaliseStatus = {
  rodando: false,
  total: 0,
  feitos: 0,
  erros: 0,
  modo: null,
  ultimoEdital: null,
  iniciadoEm: null,
  finalizadoEm: null,
};

export async function statusReanalise(): Promise<ReanaliseStatus> {
  try {
    return { ...VAZIO, ...JSON.parse((await getConfig("reanalise_status")) ?? "{}") };
  } catch {
    return VAZIO;
  }
}

async function salvar(s: ReanaliseStatus) {
  await setConfig("reanalise_status", JSON.stringify(s));
}

export function cancelarReanalise() {
  rodando = false;
}

export async function iniciarReanalisePipeline(opts?: {
  incluirFechados?: boolean;
}): Promise<{ iniciado: boolean; motivo?: string; total?: number }> {
  if (rodando) return { iniciado: false, motivo: "Reanálise já em andamento" };

  const modo = await resolverModoIa();
  if (modo === "heuristica") {
    return {
      iniciado: false,
      motivo: "Nenhum modo de IA disponível (CLI não logado e sem ANTHROPIC_API_KEY).",
    };
  }

  const filtroPrazo = opts?.incluirFechados
    ? ""
    : "AND (fim_inscricoes IS NULL OR fim_inscricoes::date >= current_date)";
  const alvos = await all<{ id: number }>(
    `SELECT id FROM editais
     WHERE (analise_modo = 'heuristica' OR analise_modo IS NULL)
       AND status NOT IN ('descartado','submetido')
       ${filtroPrazo}
     ORDER BY score DESC NULLS LAST, fim_inscricoes ASC`
  );

  if (alvos.length === 0) {
    return { iniciado: false, motivo: "Nada a reanalisar — pipeline já está com IA." };
  }

  rodando = true;
  const st: ReanaliseStatus = {
    rodando: true,
    total: alvos.length,
    feitos: 0,
    erros: 0,
    modo,
    ultimoEdital: null,
    iniciadoEm: new Date().toISOString(),
    finalizadoEm: null,
  };
  await salvar(st);

  // loop em background — NÃO aguardado (resposta da rota sai na hora).
  // Obs.: em serverless (Vercel) o processo morre ao responder; o lote completo
  // é operação local. Na nuvem o cron semanal analisa só os novos (top-N).
  (async () => {
    for (const a of alvos) {
      if (!rodando) break; // cancelado
      try {
        const e = await analisarEdital(a.id, { forcarModo: modo });
        st.feitos++;
        st.ultimoEdital = e.nome.slice(0, 70);
      } catch (err) {
        st.erros++;
        console.error(`[batch] edital ${a.id} falhou:`, err);
      }
      await salvar({ ...st });
    }
    st.rodando = false;
    st.finalizadoEm = new Date().toISOString();
    await salvar({ ...st });
    rodando = false;
  })();

  return { iniciado: true, total: alvos.length };
}
