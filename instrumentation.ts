// Boot do servidor. Em ambiente PERSISTENTE (local/VPS) sobe o bot do Telegram
// em long polling e o agendador node-cron. Na Vercel (serverless) NÃO — lá o
// agendamento é via Vercel Cron e o Telegram via webhook.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.VERCEL) {
    const { iniciarBot } = await import("./lib/telegram/bot");
    const { agendarVarreduraSemanal } = await import("./lib/scheduler");
    await iniciarBot();
    await agendarVarreduraSemanal();
  }
}
