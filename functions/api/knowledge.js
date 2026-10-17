// Cloudflare Pages / Workers Edge Function: /api/knowledge
// Serves the verified Alumungandr Business Knowledge Catalog for AI Agents & Search Engines

import catalogData from '../../knowledge-catalog.json';

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const format = url.searchParams.get('format');
  const accept = request.headers.get('accept') || '';

  const wantsMarkdown = format === 'markdown' || format === 'md' || accept.includes('text/markdown');

  if (wantsMarkdown) {
    const md = `# ${catalogData.entity.name} — Verified Knowledge Catalog

> **Motto**: ${catalogData.entity.motto}
> **Founder**: ${catalogData.entity.founder.name} (${catalogData.entity.founder.known_as})
> **Headquarters**: ${catalogData.entity.headquarters.city}, ${catalogData.entity.headquarters.country}
> **Canonical Domain**: ${catalogData.entity.contact.canonical_url}

---

## 1. Transparent Pricing Ranges (Range Authority)
${catalogData.transparent_pricing.published_ranges.map(r => `
### ${r.category}
- **Price Range**: ${r.price_min === 0 && r.price_max === 0 ? '$0.00 (Free Forever)' : `$${r.price_min.toLocaleString()} - $${r.price_max.toLocaleString()} USD`}
- **Billing Type**: ${r.billing_type}
- **Scope**: ${r.scope}
- **Terms**: ${r.terms}
`).join('\n')}

---

## 2. Core Services & Edge Tools
${catalogData.services.map(s => `
- **${s.name}** (\`${s.path}\`): ${s.description} — *Pricing: ${s.pricing}*
`).join('\n')}

---

## 3. High-Intent Questions & Authoritative Answers
${catalogData.faq.map(f => `
### Q: ${f.question}
**A**: ${f.answer}
`).join('\n')}

---

## 4. Architectural Expertise & Compliance
${catalogData.expertise_and_credentials.map(e => `- ${e}`).join('\n')}

---
*Catalog Version: ${catalogData.version} • Verified by Alumungandr Edge Engine*
`;

    return new Response(md, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  return new Response(JSON.stringify(catalogData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    }
  });
}
