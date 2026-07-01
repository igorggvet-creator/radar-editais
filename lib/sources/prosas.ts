// Conector da Central de Editais da Prosas (prosas.com.br).
// Usa o mesmo fluxo do widget público <prosas-listagem-editais>:
// OAuth2 client_credentials com o client-id público da Central, depois
// GET /selecao/api/v2/third_party/oportunidades/inscricoes_abertas.

const PROSAS_BASE = "https://prosas.com.br";
// Client-id público embutido em produtos.prosas.com.br/editais (Central de Editais)
const PROSAS_CLIENT_ID =
  process.env.PROSAS_CLIENT_ID ?? "lsf6jeu7-Wk04P2iSYMdcMhPZUNZqabK8CG6mAfRQ6M";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }
  const res = await fetch(`${PROSAS_BASE}/auth/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: PROSAS_CLIENT_ID,
    }),
  });
  if (!res.ok) throw new Error(`Prosas OAuth falhou: ${res.status}`);
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export interface ProsasEdital {
  fonteId: string;
  nome: string;
  orgao: string | null;
  url: string;
  inicioInscricoes: string | null;
  fimInscricoes: string | null;
  areas: string[];
  descricao?: string | null;
  valorTotal?: string | null;
  moeda?: string | null;
}

interface JsonApiResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<
    string,
    { data: { id: string; type: string } | { id: string; type: string }[] | null }
  >;
}

function buildSearchFilter(termo: string): string {
  // Replica o filtro OR do widget: busca o termo em nome do edital,
  // nome do incentivador, nome da empresa e áreas de interesse.
  const attrs = [
    "oportunidades.nome",
    "incentivadores.nome_fantasia",
    "oportunidades.nome_empresa",
    "area_interesses.nome",
  ];
  return attrs
    .map(
      (a) =>
        `filter[and][][or][][attribute]=${encodeURIComponent(a)}` +
        `&filter[and][][or][][operator]=contains` +
        `&filter[and][][or][][values]=${encodeURIComponent(termo)}`
    )
    .join("&");
}

export async function buscarProsas(
  termo?: string,
  maxPaginas = 3
): Promise<ProsasEdital[]> {
  const token = await getToken();
  const out: ProsasEdital[] = [];
  const areaNames = new Map<string, string>();

  for (let page = 1; page <= maxPaginas; page++) {
    const params = [
      "include=area_interesses,incentivador",
      `page[page]=${page}`,
      "page[size]=50",
      // sort estável é obrigatório: sem ele a ordem muda entre páginas e
      // itens escapam da paginação (vimos 191 de 365 com sort vazio).
      "sort=id",
    ];
    if (termo) params.push(buildSearchFilter(termo));
    const url = `${PROSAS_BASE}/selecao/api/v2/third_party/oportunidades/inscricoes_abertas?${params.join("&")}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Prosas API falhou: ${res.status}`);
    const body = (await res.json()) as {
      data: JsonApiResource[];
      included: JsonApiResource[];
      links: { last: number; total: number };
    };

    for (const inc of body.included ?? []) {
      if (inc.type === "area_interesse") {
        areaNames.set(inc.id, String(inc.attributes.nome ?? ""));
      }
    }

    for (const item of body.data ?? []) {
      const a = item.attributes;
      const areaRefs = item.relationships?.area_interesses?.data;
      const areas = Array.isArray(areaRefs)
        ? areaRefs.map((r) => areaNames.get(r.id) ?? "").filter(Boolean)
        : [];
      out.push({
        fonteId: item.id,
        nome: String(a.nome ?? ""),
        orgao: (a.nome_empresa as string | null) ?? null,
        url: `https://produtos.prosas.com.br/editais/edital?edital_id=${item.id}`,
        inicioInscricoes: (a.inicio_inscricoes as string | null) ?? null,
        fimInscricoes: (a.encerramento_das_inscricoes as string | null) ?? null,
        areas,
      });
    }

    if (page >= (body.links?.last ?? 1)) break;
  }
  return out;
}

export async function detalheProsas(
  fonteId: string
): Promise<Partial<ProsasEdital> | null> {
  try {
    const token = await getToken();
    const res = await fetch(
      `${PROSAS_BASE}/selecao/api/v2/third_party/oportunidades/${fonteId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) return null;
    const body = (await res.json()) as { data: JsonApiResource };
    const a = body.data.attributes;
    const descricaoHtml = String(a.descricao ?? "");
    return {
      descricao: descricaoHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      valorTotal:
        (a.valor_total_disponivel as string | null) ??
        (a.valor_limite as string | null) ??
        null,
      moeda: (a.tipo_moeda as string | null) ?? "R$",
    };
  } catch {
    return null;
  }
}
