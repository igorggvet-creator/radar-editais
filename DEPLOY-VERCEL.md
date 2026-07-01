# 🚀 Deploy na Vercel — passo a passo

O app foi readequado para serverless: **Supabase (Postgres)**, **Vercel Cron**,
**webhook do Telegram**, **login por senha** e jobs dentro do limite de 300s.

## 1. Banco — Supabase

1. https://supabase.com → **New project** (guarde a senha do banco).
2. **Project Settings → Database → Connection string → URI**, aba **Transaction**
   (porta **6543**). Copie a URI e troque `[YOUR-PASSWORD]` pela senha.
3. Cole em `radar-editais/.env.local`:
   ```
   DATABASE_URL=postgresql://postgres.[ref]:[SENHA]@aws-0-[regiao].pooler.supabase.com:6543/postgres
   ```

## 2. Migrar os dados (uma vez, do seu PC)

Com o `DATABASE_URL` no `.env.local` e o `data/radar.db` local presente:

```bash
node scripts/migrate-to-supabase.mjs
```

Isso cria o schema no Supabase e copia empresas, pilares, banco de textos,
**editais já analisados**, propostas, histórico do Coda, config e fontes.

> Para rodar local apontando ao Supabase: `npm run dev` (já usa o `DATABASE_URL`).

## 3. Subir na Vercel

1. Suba o projeto pro GitHub e **Import** na Vercel (ou `vercel` via CLI).
2. Em **Settings → Environment Variables**, configure:
   | Var | Valor |
   |---|---|
   | `DATABASE_URL` | a mesma do Supabase (pooler 6543) |
   | `ANTHROPIC_API_KEY` | sua chave de API (a IA na nuvem usa API) |
   | `APP_PASSWORD` | a senha de acesso ao app |
   | `CRON_SECRET` | uma string aleatória (protege o cron) |
   | `TELEGRAM_BOT_TOKEN` | (opcional) token do @BotFather |
   | `TELEGRAM_WEBHOOK_SECRET` | (opcional) string aleatória |
3. **Deploy**. O `vercel.json` já agenda a varredura semanal
   (`/api/cron/scan`, segunda 12h UTC = 9h BRT).

## 4. Telegram (opcional, após o deploy)

Registre o webhook apontando pro app publicado:

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://SEU-APP.vercel.app/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

No chat do bot, mande `/start` para registrar o chat nos alertas.

## Local vs Vercel — o que muda

| | Local (`npm run dev`) | Vercel |
|---|---|---|
| Banco | Supabase (mesmo) | Supabase |
| IA | assinatura (claude -p) → API → heurística | API → heurística |
| Agendamento | node-cron (processo vivo) | Vercel Cron |
| Telegram | long polling | webhook |
| Reanálise do pipeline inteiro | ✅ roda | melhor rodar local (lote longo) |
| Login | só se `APP_PASSWORD` setado | senha obrigatória |
