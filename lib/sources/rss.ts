// Fonte genérica RSS/Atom — qualquer feed de editais cadastrado nas
// configurações é varrido e normalizado. Parser leve sem dependências.

export interface RssEdital {
  fonteId: string;
  nome: string;
  url: string;
  descricao: string | null;
  publicadoEm: string | null;
}

function extract(tag: string, xml: string): string | null {
  const m = xml.match(
    new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, "i")
  );
  return m ? m[1].trim() : null;
}

export async function buscarRss(feedUrl: string): Promise<RssEdital[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "RadarEditais/1.0 (+gamejamplus.com)" },
  });
  if (!res.ok) throw new Error(`RSS ${feedUrl} falhou: ${res.status}`);
  const xml = await res.text();

  const items = xml.match(/<(?:item|entry)[\s>][\s\S]*?<\/(?:item|entry)>/gi) ?? [];
  const out: RssEdital[] = [];
  for (const item of items) {
    const titulo = extract("title", item);
    if (!titulo) continue;
    let link = extract("link", item);
    if (!link) {
      const href = item.match(/<link[^>]*href="([^"]+)"/i);
      link = href ? href[1] : null;
    }
    const desc = extract("description", item) ?? extract("summary", item);
    const data =
      extract("pubDate", item) ??
      extract("published", item) ??
      extract("updated", item);
    out.push({
      fonteId: link ?? titulo,
      nome: titulo.replace(/<[^>]+>/g, "").trim(),
      url: link ?? feedUrl,
      descricao: desc ? desc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000) : null,
      publicadoEm: data,
    });
  }
  return out;
}
