// Webhook do Telegram (modo serverless/Vercel). O Telegram faz POST aqui a
// cada update. Configure após o deploy:
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://SEU-APP.vercel.app/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>

import { webhookCallback } from "grammy";
import { construirBot } from "@/lib/telegram/bot";

export const maxDuration = 60;

const bot = construirBot();
const handler = bot
  ? webhookCallback(bot, "std/http", {
      secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
    })
  : null;

export async function POST(req: Request): Promise<Response> {
  if (!handler) {
    return new Response("bot desativado (sem TELEGRAM_BOT_TOKEN)", { status: 503 });
  }
  return handler(req);
}
