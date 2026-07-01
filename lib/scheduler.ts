// Monitoramento SEMANAL (segunda-feira 9h por padrão, configurável em
// config.cron_semanal). Varre as fontes e alerta a equipe no Telegram.

import cron, { ScheduledTask } from "node-cron";
import { getConfig } from "./db";
import { executarVarredura } from "./sources";
import { notificarVarreduraSemanal } from "./telegram/bot";

let tarefa: ScheduledTask | null = null;
let expressaoAtual: string | null = null;

export async function agendarVarreduraSemanal() {
  const expressao = (await getConfig("cron_semanal")) ?? "0 9 * * 1";
  if (tarefa && expressaoAtual === expressao) return;
  if (tarefa) tarefa.stop();

  if (!cron.validate(expressao)) {
    console.error(`[scheduler] cron inválido: ${expressao}`);
    return;
  }

  tarefa = cron.schedule(expressao, async () => {
    console.log("[scheduler] iniciando varredura semanal...");
    try {
      const rel = await executarVarredura("agendada");
      console.log(
        `[scheduler] varredura concluída: ${rel.novos} novos de ${rel.totalEncontrados}`
      );
      await notificarVarreduraSemanal(rel);
    } catch (err) {
      console.error("[scheduler] varredura semanal falhou:", err);
    }
  });
  expressaoAtual = expressao;
  console.log(`[scheduler] varredura semanal agendada: "${expressao}"`);
}
