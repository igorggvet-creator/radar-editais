# 📋 Atualizações do Radar de Editais

Registro de tudo que cada pessoa (através do seu Claude) altera no projeto, para que **ambos saibam
o que o outro mudou**.

**Regra:** toda alteração ganha uma entrada nova **no topo** desta lista, no formato abaixo.

```
## AAAA-MM-DD — [Seu nome]
**O que mudou:** (resumo em 1–3 frases)
**Por quê:** (motivo)
**Arquivos:** (principais arquivos tocados)
**Deploy:** (automático via push na main / não se aplica)
```

---

## 2026-07-07 — Igor (via Claude) — export PDF estruturado das propostas
**O que mudou:** Botão **"Baixar PDF"** na página da proposta (`/propostas/[id]`). Gera um PDF
estruturado (A4, margens, tipografia de documento) a partir do texto da proposta usando o motor de
impressão do próprio navegador — funciona **igual no local e na Vercel**, sem dependência nova (nada
de puppeteer/chromium no build). Mantém o export **.docx** (agora botão secundário). Reaproveita o
HTML que a página já monta do Markdown.
**Por quê:** Pedido do Igor — precisava de um arquivo PDF já estruturado, não só o texto no banco/.docx.
**Arquivos:** `components/baixar-pdf.tsx` (novo), `app/propostas/[id]/page.tsx` (botão + reuso do HTML)
**Deploy:** automático via push na main

## 2026-07-07 — Igor (via Claude) — Nível "Com dependências" nas Fontes
**O que mudou:** Novo Nível na página **Fontes**: **🔗 Com dependências** — agrupa plataformas/programas
que exigem um pré-requisito antes de captar (ex.: precisar de um projeto já aprovado na Lei de
Incentivo/Rouanet). Começou com **PROMAC**, **ISS Rio** e **Chamada Cultural Vale** (leis de incentivo),
que saíram do Nível 3 para esse nível. Implementado com um flag `dependencia` no catálogo de fontes.
**Por quê:** Pedido do Igor — ter, nas Fontes, um nível para plataformas com dependência.
**Arquivos:** `lib/fontes-catalogo.ts` (NIVEIS_FONTE nível 6 + flag `dependencia` em promac/iss-rio/vale-cultural), `app/fontes/page.tsx` (render do nível)
**Deploy:** automático via push na main

## 2026-07-07 — Igor (via Claude) — novo nível "Com dependência"
**O que mudou:** Novo nível no pipeline: **🔗 Com dependência**. É um lugar separado para editais que
dão *match* mas dependem de outra coisa antes (ex.: precisar de um Rouanet aprovado para viabilizar
outro projeto). O edital vira uma coluna própria no `/pipeline`, aparece no filtro de `/editais` e no
seletor de status do edital; e a reanálise **não** o puxa de volta para "match" (mesma proteção que
escrita/submetido/descartado já têm). **Sem migração de banco** — o campo `status` é texto livre.
**Por quê:** Pedido da colaboradora (áudio) — um match não deve entrar direto na fila ativa quando tem dependência.
**Arquivos:** `components/ui.tsx` (STATUS_META), `app/api/editais/[id]/route.ts` (STATUS_VALIDOS), `app/pipeline/page.tsx` (COLUNAS + grade 6 colunas)
**Deploy:** automático via push na main

## 2026-07-01 — Igor (via Claude) — sincronização automática
**O que mudou:** As regras do `CLAUDE.md` passaram a incluir a sincronização como PRIMEIRO passo de
qualquer alteração (`git pull --rebase --autostash`), então o Claude puxa as novidades da equipe
sozinho antes de mexer em algo. O `PROMPT-COLABORADOR.md` foi simplificado — a pessoa só descreve a
mudança; sincronizar, registrar e publicar acontecem pelas regras do projeto.
**Por quê:** Tirar o passo-a-passo manual; a pessoa só descreve o que quer e o resto acontece sozinho.
**Arquivos:** `CLAUDE.md`, `PROMPT-COLABORADOR.md`
**Deploy:** automático via push na main

## 2026-07-01 — Igor (via Claude)
**O que mudou:** Configurada a colaboração no repositório — criados `CLAUDE.md` (guia do projeto +
regras de colaboração), este `ATUALIZACOES.md` (registro de mudanças) e `PROMPT-COLABORADOR.md`
(instruções prontas para quem for ajudar).
**Por quê:** Permitir que duas pessoas trabalhem no projeto com clareza, cada uma sabendo o que a
outra alterou.
**Arquivos:** `CLAUDE.md`, `ATUALIZACOES.md`, `PROMPT-COLABORADOR.md`
**Deploy:** automático via push na main

## 2026-07-01 — Igor (via Claude) — estado inicial
**O que já existia:** App publicado no GitHub (repositório privado) e conectado à Vercel para deploy
automático a cada push. Antes disso: banco migrado para o Supabase; varredura completa de editais
(+35 novos, 396 no total, 333 com prazo aberto) e reanálise de qualidade de 100 editais, limpando
~66 falsos positivos do pipeline (ficaram 24 "match" confiáveis).
**Arquivos:** projeto inteiro (commit inicial `cffb321`)
**Deploy:** produção em https://radar-editais-nine.vercel.app
