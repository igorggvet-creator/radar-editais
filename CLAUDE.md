# CLAUDE.md — Radar de Editais

Guia para o Claude Code trabalhar neste projeto. **Leia antes de mexer em qualquer coisa.**

## O que é este projeto
App web que **monitora, analisa e ajuda a escrever propostas** para editais públicos (chamadas de
financiamento) do ecossistema **GameJam+ / Indie Hero / Plug and Plus**. Ele busca editais na Central
de Editais da Prosas, avalia quais fazem sentido para o ecossistema e organiza tudo num painel.

Stack: **Next.js 15** (App Router, TypeScript) + **Tailwind** + **Supabase (Postgres)**. Hospedado na **Vercel**.

## Como rodar localmente
1. `npm install`
2. Crie o arquivo `.env.local` na raiz (peça o conteúdo ao **Igor** — ele tem a chave do banco;
   **não está no repositório por segurança**).
3. `npm run dev` e abra http://localhost:3000

> Para só **editar código e subir**, você nem precisa rodar localmente: é só dar `git push` que a
> Vercel publica sozinha. Rodar local só é necessário se quiser testar antes.

## Estrutura (onde fica o quê)
- `app/` — páginas e rotas de API (Next.js App Router)
- `lib/` — lógica principal: `sources/` (coleta na Prosas), `analysis/` (análise e match),
  `proposals/` (gera propostas .docx), `db.ts` / `sql.ts` (banco), `telegram/` (bot)
- `components/` — componentes de interface
- `scripts/` — utilitários rodados à mão (varredura, diagnóstico do acervo)
- `db/schema.sql` — estrutura do banco

## 🤝 Regras de colaboração (SEMPRE seguir)
Este repositório é compartilhado por **duas pessoas** (Igor e a colaboradora), cada uma usando seu
próprio Claude Code. Para ninguém sobrescrever o trabalho do outro e todos saberem o que mudou:

1. **Antes de começar:** rode `git pull` para pegar as mudanças mais recentes da outra pessoa.
2. **Faça a alteração** pedida.
3. **Registre no `ATUALIZACOES.md`**: uma entrada nova **no topo**, com data, quem fez, o que mudou,
   por quê e os arquivos (siga o formato que já está no arquivo).
4. **Commit e push** na branch `main`, com mensagem clara em português.
5. Ao terminar, **explique em texto** para a pessoa o que foi alterado.
6. **Nunca** commite segredos: `.env.local`, tokens (`ghp_`, `vcp_`, `sbp_`), senhas. O `.gitignore`
   já bloqueia — **não** use `git add -f` para forçar.
7. Se aparecer **conflito de git**, não force: resolva com cuidado ou peça ajuda ao Igor.

> Isso vale para os **dois lados** — o Claude do Igor também segue estas regras.

## Deploy e dados
- **Código:** todo `git push` na `main` → a **Vercel** publica automaticamente.
  Produção: https://radar-editais-nine.vercel.app
- **Dados** (editais e análises): ficam no **Supabase** e aparecem na hora, sem precisar de deploy.
  As varreduras/análises de editais são feitas pelo Igor.

## Segurança
- Nunca subir `.env*`, tokens, senhas ou banco local.
- O acesso ao app é protegido por senha (`APP_PASSWORD`).
