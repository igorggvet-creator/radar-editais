# 🧭 Como colaborar no Radar de Editais (guia rápido)

Textos prontos para usar com o **Claude Code**. É só copiar, colar e trocar o que está entre [colchetes].

---

## 1) Primeira vez (configurar o projeto)

Abra o Claude Code numa pasta vazia e cole:

```
Quero configurar o projeto "Radar de Editais" para trabalhar nele.
1. Clone o repositório: https://github.com/igorggvet-creator/radar-editais.git
2. Entre na pasta do projeto e leia os arquivos CLAUDE.md e ATUALIZACOES.md para entender
   o que é o projeto e quais são as regras de colaboração.
3. Me explique, de forma simples, o que é o projeto e como vou trabalhar nele.

(Se em algum momento eu precisar rodar o app no meu computador, vou pedir ao Igor o arquivo
.env.local. Para só editar e publicar, isso não é necessário.)
```

---

## 2) Toda vez que for fazer uma mudança

Copie o texto abaixo, troque **[DESCREVA A MUDANÇA]** pelo que você quer e **[SEU NOME]** pelo seu nome:

```
Você vai me ajudar a alterar o projeto "Radar de Editais". Siga estes passos, nesta ordem:

1. Leia o CLAUDE.md e o ATUALIZACOES.md (na raiz do projeto) para lembrar do contexto e das regras.
2. Rode: git pull   (para pegar as últimas mudanças da outra pessoa).
3. Faça esta mudança: [DESCREVA A MUDANÇA — ex.: "no painel, adicionar um filtro que mostra só os
   editais com prazo nos próximos 15 dias"].
4. Registre a mudança no TOPO do ATUALIZACOES.md, assinando com o nome: [SEU NOME].
5. Faça commit e push na branch main, com uma mensagem clara em português.
6. Me explique, em linguagem simples, o que você mudou, e confirme que subiu para o GitHub.

Regras importantes: nunca suba senhas nem o arquivo .env.local. Se aparecer conflito no git,
pare e me avise antes de continuar.
```

---

## Dicas
- **Descreva o que quer como se explicasse para uma pessoa:** "quero o botão X azul", "quero uma
  coluna mostrando o valor do edital". O Claude cuida do código.
- Depois que ele der o push, a versão online (https://radar-editais-nine.vercel.app) atualiza
  sozinha em **1–2 minutos**.
- Na dúvida se algo pode quebrar, peça: **"me explica o que vai mudar antes de fazer"**.
- Se ele pedir para instalar algo ou apagar arquivos que você não reconhece, **pare e pergunte ao Igor**.
