// Dados oficiais extraídos dos documentos do ecossistema (cartões CNPJ,
// fichas técnicas e fluxograma de editais). Fonte da verdade para o seed.

export interface EmpresaSeed {
  slug: string;
  razaoSocial: string;
  nomeFantasia: string;
  apelido: string;
  cnpj: string;
  dataAbertura: string;
  porte: string;
  situacao: string;
  municipio: string;
  uf: string;
  ufFichaTecnica: string | null;
  observacaoEndereco: string | null;
  representanteLegal: string | null;
  cnaePrincipal: string;
  cnaesSecundarios: string[];
  apresentacao: string;
  portfolio: string[];
  clientes: string[];
  parceiros: string[];
  metricas: string[];
  tags: string[];
}

export const EMPRESAS: EmpresaSeed[] = [
  {
    slug: "startup-grid",
    razaoSocial: "STARTUP GRID COWORKING E ACELERACAO LTDA",
    nomeFantasia: "GAMES DEV HUB",
    apelido: "GameJam+ (Startup Grid)",
    cnpj: "26.514.030/0001-00",
    dataAbertura: "2016-11-08",
    porte: "EPP",
    situacao: "ATIVA",
    municipio: "Brasília",
    uf: "DF",
    ufFichaTecnica: "DF",
    observacaoEndereco: null,
    representanteLegal: null,
    cnaePrincipal:
      "70.20-4-00 - Atividades de consultoria em gestão empresarial",
    cnaesSecundarios: [
      "32.40-0-01 - Fabricação de jogos eletrônicos",
      "59.14-6-00 - Atividades de exibição cinematográfica",
      "73.11-4-00 - Agências de publicidade",
      "73.19-0-03 - Marketing direto",
      "82.11-3-00 - Serviços combinados de escritório e apoio administrativo",
      "82.30-0-01 - Serviços de organização de feiras, congressos, exposições e festas",
      "85.92-9-99 - Ensino de arte e cultura",
      "85.99-6-04 - Treinamento em desenvolvimento profissional e gerencial",
      "90.01-9-99 - Artes cênicas, espetáculos e atividades complementares",
      "93.19-1-01 - Produção e promoção de eventos esportivos",
    ],
    apresentacao:
      "A GameJamPlus (organizada pela Startup Grid) é uma maratona global de desenvolvimento de jogos cujo propósito essencial é fomentar e consolidar a economia criativa através da aceleração de novos jogos e estúdios independentes. Conhecida internacionalmente como a 'Copa do Mundo de Desenvolvimento de Jogos', ela conecta diretamente desenvolvedores a investidores e grandes publishers do mercado global.",
    portfolio: [
      "GameJam+ — maratona global de desenvolvimento de jogos (Copa do Mundo de Dev de Jogos)",
      "Brasília Game Festival (BGF) — evento de massa com +50 mil pessoas",
      "Estande GameJamPlus no Rock in Rio 2022 — +60 mil pessoas testaram jogos indie nacionais",
      "Missões de internacionalização com ApexBrasil e Abragames (Projeto Brazil Games)",
    ],
    clientes: ["ApexBrasil", "Abragames", "Rock in Rio", "Rio2C"],
    parceiros: ["ApexBrasil", "Abragames (Projeto Brazil Games)"],
    metricas: [
      "Atuação em mais de 40 países",
      "Mais de 9.000 profissionais impactados",
      "Mais de 1.500 jogos criados globalmente",
      "Presença em Gamescom (Alemanha), Ignite (Arábia Saudita), GDC (EUA)",
      "Missões tecnológicas na Finlândia, Israel, Portugal e Emirados Árabes Unidos",
    ],
    tags: ["INTERNACIONALIZACAO", "EVENTOS", "ECONOMIA_CRIATIVA", "GAMES"],
  },
  {
    slug: "acelera-indie",
    razaoSocial: "ACELERA INDIE PLUS TREINAMENTOS LTDA",
    nomeFantasia: "INDIE HERO",
    apelido: "Indie Hero",
    cnpj: "41.418.866/0001-02",
    dataAbertura: "2021-03-31",
    porte: "ME",
    situacao: "ATIVA",
    municipio: "Rio de Janeiro",
    uf: "RJ",
    ufFichaTecnica: "DF",
    observacaoEndereco:
      "⚠️ Divergência: o cartão CNPJ oficial (emitido em 02/06/2025) registra endereço no Rio de Janeiro - RJ (Av. Treze de Maio, 23, Centro), mas a ficha técnica interna indica Brasília - DF. Confirmar qual endereço vale para critérios de elegibilidade estadual.",
    representanteLegal: "Juliana Brito (CEO)",
    cnaePrincipal:
      "85.99-6-04 - Treinamento em desenvolvimento profissional e gerencial",
    cnaesSecundarios: [
      "62.03-1-00 - Desenvolvimento e licenciamento de programas de computador não-customizáveis",
      "62.04-0-00 - Consultoria em tecnologia da informação",
      "70.20-4-00 - Atividades de consultoria em gestão empresarial",
      "74.90-1-04 - Atividades de intermediação e agenciamento de serviços e negócios",
      "78.10-8-00 - Seleção e agenciamento de mão-de-obra",
      "82.11-3-00 - Serviços combinados de escritório e apoio administrativo",
      "82.30-0-01 - Serviços de organização de feiras, congressos, exposições e festas",
      "85.92-9-99 - Ensino de arte e cultura",
      "90.01-9-99 - Artes cênicas, espetáculos e atividades complementares",
    ],
    apresentacao:
      "A Indie Hero é uma aceleradora e hub de negócios com foco estrito na cadeia produtiva dos jogos independentes. Atuamos com portabilidade (porting) para as principais plataformas de console e PCs (Nintendo, PlayStation, Xbox, Steam), validação de design, garantia de qualidade técnica (Quality Assurance) e processos intensivos de aceleração mercadológica de estúdios independentes.",
    portfolio: [
      "Trilhas de Conhecimento Customizadas — Sebrae Developers (CE), Trilha do Conhecimento (RJ), Programa Next (AM), RS, Paraná e Caruaru (PE)",
      "JOIN (antigo PIIH I e II) — trilha intensiva de modelo de negócios, estruturação jurídica e pitch com Demo Day",
      "Game Jams Personalizadas — IP Challenge (Sebrae + INPI), Game Jam Spcine, Game Jam Fortnite (3C Gaming + Surprise.co), Cubio Game Jam (GameForge), Crazy Web Game Jam (Crazy Games)",
      "Curadoria e eventos — Brasília Game Festival (BGF), Arena Gamer no Innova Summit, Rio2C, Rio Innovation Week, MICBR",
      "Serviços técnicos — GoGoGames (porting PlayStation/Switch/Xbox) e UX4indie (game design e QA)",
      "GameDevs — curso de inglês instrumental para a indústria de jogos",
    ],
    clientes: [
      "Sebrae (Nacional e regionais)",
      "Spcine",
      "Crazy Games",
      "SBT Games",
      "3C Gaming",
      "Abragames (BGA)",
    ],
    parceiros: [
      "INPI",
      "American Insight (GameDevs)",
      "Instituto Conecta (co-realização do BGF via Lei Rouanet)",
    ],
    metricas: [
      "Rede ativa com +400 estúdios de jogos cadastrados",
      "+40 estúdios focados em plataformas mobile",
      "+40 investidores ativos mapeados",
      "+24.000 profissionais impactados na cadeia produtiva",
      "Porting e lançamento de Super Mombo Quest (Orube Game Studio) para PlayStation via GoGo Games",
      "Jogo oficial do Bexigão do Programa do Ratinho para o SBT Games (estúdio Yellow Panda)",
    ],
    tags: [
      "INOVACAO_TECNOLOGICA_E_SUPORTE_TECNICO",
      "ACELERACAO_ESTUDIOS",
      "TRILHAS_CONHECIMENTO",
      "GAME_JAMS_PERSONALIZADAS",
      "EMPREENDEDORISMO",
    ],
  },
  {
    slug: "plug-and-plus",
    razaoSocial: "PLUG AND PLUS EDUCACAO DIGITAL LTDA",
    nomeFantasia: "PLUG AND PLUS",
    apelido: "Plug and Plus",
    cnpj: "47.239.246/0001-84",
    dataAbertura: "",
    porte: "",
    situacao: "ATIVA",
    municipio: "Florianópolis",
    uf: "SC",
    ufFichaTecnica: "SC",
    observacaoEndereco: null,
    representanteLegal: null,
    cnaePrincipal:
      "85.99-6-04 - Treinamento em desenvolvimento profissional e gerencial",
    cnaesSecundarios: [
      "85.99-6-03 - Treinamento em informática / desenvolvimento de softwares",
    ],
    apresentacao:
      "A Plug and Plus é uma escola focada no desenvolvimento de habilidades para o futuro, especializada no ensino de desenvolvimento de jogos, programação e robótica para crianças e adolescentes.",
    portfolio: [
      "Trilhas de Conhecimento e Capacitações de Marketing e Tecnologia em parceria com o Sebrae (RJ, AM, ES e CE)",
      "Sebrae Developers (CE)",
      "Innova Hub",
    ],
    clientes: ["Sebrae (RJ, AM, ES, CE)", "Innova Hub"],
    parceiros: ["Sebrae Developers"],
    metricas: [
      "Centenas de alunos e empresas impactados diretamente",
      "Altos índices de aprovação (NPS de até 100%)",
    ],
    tags: ["EDUCACAO", "IMPACTO_SOCIAL", "GAMES", "ROBOTICA"],
  },
];

export interface PilarSeed {
  slug: string;
  nome: string;
  emoji: string;
  empresaSlug: string | null;
  descricao: string;
  keywords: string[];
}

export const PILARES: PilarSeed[] = [
  {
    slug: "educacao",
    nome: "Educação e Impacto Social",
    emoji: "🎓",
    empresaSlug: "plug-and-plus",
    descricao:
      "Ensino de desenvolvimento de jogos, programação e robótica para crianças e adolescentes; capacitações e trilhas de conhecimento.",
    keywords: [
      "educação",
      "educacional",
      "ensino",
      "escola",
      "capacitação",
      "formação",
      "qualificação",
      "robótica",
      "programação",
      "juventude",
      "criança",
      "adolescente",
      "alfabetização digital",
      "inclusão digital",
      "oficina",
    ],
  },
  {
    slug: "internacionalizacao",
    nome: "Internacionalização e Exportação",
    emoji: "🌍",
    empresaSlug: "startup-grid",
    descricao:
      "Missões internacionais, exportação da economia criativa, conexão com publishers e investidores globais.",
    keywords: [
      "internacionalização",
      "exportação",
      "missão internacional",
      "feira internacional",
      "economia criativa",
      "mercado global",
      "apex",
      "comércio exterior",
      "delegação",
    ],
  },
  {
    slug: "inovacao",
    nome: "Inovação Tecnológica e Suporte Técnico",
    emoji: "🚀",
    empresaSlug: "acelera-indie",
    descricao:
      "Aceleração de estúdios, porting, QA, consultoria em TI, intermediação de negócios na cadeia de jogos independentes.",
    keywords: [
      "inovação",
      "tecnologia",
      "startup",
      "aceleração",
      "incubação",
      "empreendedorismo",
      "jogos digitais",
      "games",
      "software",
      "desenvolvimento de jogos",
      "indie",
      "investimento",
      "pesquisa e desenvolvimento",
      "transformação digital",
    ],
  },
  {
    slug: "eventos",
    nome: "Eventos, Branding e Comunidade",
    emoji: "🎪",
    empresaSlug: null,
    descricao:
      "Concepção, organização, produção e curadoria de grandes palcos de tecnologia, cultura pop e eSports; game jams e hackathons. Captação via patrocínios, projetos corporativos e leis de incentivo (ex: Lei Rouanet).",
    keywords: [
      "evento",
      "festival",
      "cultura",
      "cultural",
      "esports",
      "game jam",
      "hackathon",
      "maratona",
      "lei rouanet",
      "lei de incentivo",
      "lei paulo gustavo",
      "aldir blanc",
      "audiovisual",
      "cultura pop",
      "exposição",
      "mostra",
    ],
  },
];

// Pastas das Secretarias (categorização do fluxograma)
export const PASTAS = [
  { slug: "tecnologia", nome: "Tecnologia (Games)" },
  { slug: "eventos-culturais", nome: "Eventos Culturais (GJ+)" },
  { slug: "empreendedorismo", nome: "Empreendedorismo (Premiações)" },
  { slug: "mobilidade", nome: "Mobilidade (Viagens/Palestras)" },
  { slug: "educacao", nome: "Educação (Games/Incubação)" },
] as const;

export interface TextoSeed {
  titulo: string;
  pilarSlug: string | null;
  empresaSlug: string | null;
  categoria: "apresentacao" | "metricas" | "cases" | "argumentacao";
  conteudo: string;
}

export const BANCO_TEXTOS: TextoSeed[] = [
  {
    titulo: "Apresentação institucional — Plug and Plus",
    pilarSlug: "educacao",
    empresaSlug: "plug-and-plus",
    categoria: "apresentacao",
    conteudo:
      "A Plug and Plus é uma escola focada no desenvolvimento de habilidades para o futuro, especializada no ensino de desenvolvimento de jogos, programação e robótica para crianças e adolescentes.",
  },
  {
    titulo: "Cases educacionais — Plug and Plus",
    pilarSlug: "educacao",
    empresaSlug: "plug-and-plus",
    categoria: "cases",
    conteudo:
      "Desenvolvimento de Trilhas de Conhecimento e Capacitações de Marketing e Tecnologia em parceria com órgãos como o Sebrae (RJ, AM, ES e CE), Sebrae Developers (CE) e Innova Hub, impactando diretamente centenas de alunos e empresas com altos índices de aprovação (NPS de até 100%).",
  },
  {
    titulo: "Apresentação institucional — GameJamPlus",
    pilarSlug: "internacionalizacao",
    empresaSlug: "startup-grid",
    categoria: "apresentacao",
    conteudo:
      "A GameJamPlus (organizada pela Startup Grid) é uma maratona global de desenvolvimento de jogos cujo propósito essencial é fomentar e consolidar a economia criativa através da aceleração de novos jogos e estúdios independentes. Conhecida internacionalmente como a 'Copa do Mundo de Desenvolvimento de Jogos', ela conecta diretamente desenvolvedores a investidores e grandes publishers do mercado global.",
  },
  {
    titulo: "Métricas globais — GameJamPlus",
    pilarSlug: "internacionalizacao",
    empresaSlug: "startup-grid",
    categoria: "metricas",
    conteudo:
      "Alcance Global: atuação em mais de 40 países. Histórico de Impacto: mais de 9.000 profissionais impactados e mais de 1.500 jogos criados globalmente. Presença Internacional: delegações comerciais ativas e missões de internacionalização com o suporte da ApexBrasil e Abragames (Projeto Brazil Games) em eventos globais estratégicos como Gamescom (Alemanha), Ignite (Arábia Saudita), GDC (Estados Unidos) e missões tecnológicas na Finlândia, Israel, Portugal e Emirados Árabes Unidos.",
  },
  {
    titulo: "Apresentação institucional — Indie Hero",
    pilarSlug: "inovacao",
    empresaSlug: "acelera-indie",
    categoria: "apresentacao",
    conteudo:
      "A Indie Hero é uma aceleradora e hub de negócios com foco estrito na cadeia produtiva dos jogos independentes. Atuamos com portabilidade (porting) para as principais plataformas de console e PCs (Nintendo, PlayStation, Xbox, Steam), validação de design, garantia de qualidade técnica (Quality Assurance) e processos intensivos de aceleração mercadológica de estúdios independentes.",
  },
  {
    titulo: "Base comunitária e intermediações — Indie Hero",
    pilarSlug: "inovacao",
    empresaSlug: "acelera-indie",
    categoria: "metricas",
    conteudo:
      "Base Comunitária: rede com mais de 400 estúdios de jogos cadastrados, mais de 40 estúdios focados em plataformas mobile e mais de 40 investidores ativos mapeados. Intermediações Comerciais de Sucesso: matchmaking de IPs brasileiras com grandes players do mercado, como o porting e lançamento do aclamado jogo Super Mombo Quest (do Orube Game Studio) para PlayStation via publisher GoGo Games, e o desenvolvimento do jogo oficial do Bexigão do Programa do Ratinho para o SBT Games junto ao estúdio Yellow Panda.",
  },
  {
    titulo: "Apresentação — Eventos, Branding e Comunidade",
    pilarSlug: "eventos",
    empresaSlug: null,
    categoria: "apresentacao",
    conteudo:
      "Possuímos uma vasta experiência na concepção, organização, produção e curadoria técnica de grandes palcos de tecnologia, cultura pop e eSports, criando ecossistemas de alta visibilidade e engajamento comunitário por meio de maratonas de inovação (Game Jams e Hackathons).",
  },
  {
    titulo: "Cases de eventos de massa",
    pilarSlug: "eventos",
    empresaSlug: null,
    categoria: "cases",
    conteudo:
      "Eventos de Massa Próprios: idealização e produção do Brasília Game Festival (BGF), cuja primeira edição reuniu mais de 50 mil pessoas, oferecendo campeonatos, arenas indie e concursos de cosplay. Curadoria para Terceiros: curadoria e gestão completa de palcos e rodadas de negócios de serious games em eventos do ecossistema de inovação, como o Rio2C (atendendo corporações como Natura, TIM e Banco do Brasil) e o Rio Innovation Week. Exposições Culturais: ativação e gestão do estande exclusivo da GameJamPlus no Rock in Rio 2022, onde mais de 60 mil pessoas testaram jogos independentes nacionais. Game Jams Corporativas Customizadas: execução de maratonas fechadas sob demanda como o IP Challenge (Sebrae + INPI), a Game Jam Fortnite (3C Gaming + Surprise.co), além de parcerias com a Spcine e a plataforma global CrazyGames.",
  },
];

export const KEYWORDS_BUSCA_PADRAO = [
  "games",
  "jogos digitais",
  "jogos eletrônicos",
  "economia criativa",
  "audiovisual",
  "tecnologia",
  "inovação",
  "cultura",
  "educação",
  "empreendedorismo",
];
