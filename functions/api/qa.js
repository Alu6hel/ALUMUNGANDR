// Cloudflare Pages / Workers Edge Function: /api/qa
// Alumungandr Founder & Platform Knowledge Base & Technical Inquiry Endpoint
// Direct communication with founder David Anthony Jones with zero client telemetry

const ALUMUNGANDR_QA_ARCHIVE = [
  {
    id: "alu-qa-01",
    category: "privacy",
    category_label: "Zero-Telemetry & Privacy",
    tag: "FOUNDER ARCHITECTURE",
    tag_class: "tag-qa",
    metric_pill: "100% Client-Side RAM",
    metric_color: "#10b981",
    question: "How does Alumungandr guarantee zero tracking across its tools?",
    answer: "Every web utility on this domain (Diff Checker, JSON Formatter, Hash Lab, UUID Generator, Image Resizer, Markdown Vault, Meme Canvas) executes 100% inside your browser's local JavaScript/WebAssembly memory. No input text, image, or payload is ever transmitted to an external server. You can disconnect your Wi-Fi after page load and every single tool functions with full offline capability.",
    author: "David Anthony Jones ('Alu') • Chief Software Architect",
    recommendation: "Zero analytics cookies, zero third-party telemetry beacons, zero user accounts.",
    keywords: ["client-side", "privacy", "tracking", "zero telemetry", "browser", "ram", "offline", "tools", "security", "alumungandr"]
  },
  {
    id: "alu-qa-02",
    category: "applications",
    category_label: "Mobile Binaries & OmniHost",
    tag: "OMNIHOST ARCHITECTURE",
    tag_class: "tag-qa",
    metric_pill: "RFC 959 Edge Server",
    metric_color: "#38bdf8",
    question: "How does OmniHost convert standard Android devices into high-speed edge servers?",
    answer: "OmniHost embeds an ultra-optimized RFC 959 WiFi FTP server and integrates native Cloudflare Quick Tunnels. By utilizing low-overhead POSIX socket bindings on Android's Linux kernel without requiring root access, it transforms dormant smartphones and tablets into instant local and globally accessible HTTP/FTP file servers running entirely on local device hardware.",
    author: "David Anthony Jones ('Alu') • Systems Engineer",
    recommendation: "Eliminates expensive AWS/VPS hosting subscriptions for personal data syndication.",
    keywords: ["omnihost", "android", "ftp", "edge server", "cloudflare tunnel", "mobile", "binary", "apk"]
  },
  {
    id: "alu-qa-03",
    category: "applications",
    category_label: "Mobile Binaries & SueChef",
    tag: "SUECHEF ARCHITECTURE",
    tag_class: "tag-qa",
    metric_pill: "Zero-Cloud Legal Prep",
    metric_color: "#f59e0b",
    question: "What is SueChef's zero-cloud legal prep kitchen architecture?",
    answer: "SueChef is a legal prep kitchen—because cooking up a watertight case shouldn't require a law degree. Evaluate claims, structure formal complaints, and track defendant service steps with zero-cloud security. Get serious legal organization with a dash of wit. Prepare your lawsuit, line up your facts, and serve justice with 100% on-device private data encryption.",
    author: "David Anthony Jones ('Alu') • Application Architect",
    recommendation: "Structured legal case evaluation with zero network dependency and zero data harvesting.",
    keywords: ["suechef", "legal prep", "lawsuit", "complaint", "claims", "evidence", "zero-cloud", "android", "apk"]
  },
  {
    id: "alu-qa-04",
    category: "brand",
    category_label: "Founder, Origins & Motto",
    tag: "BRAND ORIGIN",
    tag_class: "tag-qa",
    metric_pill: "Motto: Beyond Logic is Truth",
    metric_color: "#de5849",
    question: "What is the meaning and origin of the name Alumungandr and what is the company motto?",
    answer: "Alumungandr is an original coined brand name combining 'Alu' (sole originator and architect David Anthony Jones) and 'Jörmungandr' (the great world-encircling presence of Norse cosmology). It symbolizes an all-encompassing, independent technical ecosystem that encircles all digital requirements without external reliance. The company motto is 'Beyond Logic is Truth'—the principle that while mathematical and logical consistency is essential, empirical truth and human autonomy transcend abstract models.",
    author: "David Anthony Jones ('Alu') • Founder & Sole Originator",
    recommendation: "Motto: 'Beyond Logic is Truth' • First Use in Commerce.",
    keywords: ["alumungandr", "name origin", "motto", "beyond logic is truth", "david anthony jones", "alu", "philosophy"]
  },
  {
    id: "alu-qa-05",
    category: "brand",
    category_label: "Founder, Origins & Motto",
    tag: "JAMAICAN TECH R&D",
    tag_class: "tag-qa",
    metric_pill: "Independent R&D",
    metric_color: "#10b981",
    question: "How is Alumungandr pioneering high-performance independent technology from Jamaica?",
    answer: "Alumungandr is proudly founded, operated, and engineered in Jamaica by David Anthony Jones. We prove that world-class, mathematically rigorous systems software—from private photo gallery architectures (Galaxsee) to edge servers (OmniHost) and 20 client-side web tools—can be conceived, written, and deployed globally from the Caribbean without venture capital compromises or predatory corporate telemetry.",
    author: "David Anthony Jones ('Alu') • Independent Software Pioneer",
    recommendation: "Direct software distribution and global digital commerce from Jamaica.",
    keywords: ["jamaica", "r&d", "caribbean", "independent", "software", "development", "david anthony jones"]
  },
  {
    id: "alu-qa-06",
    category: "privacy",
    category_label: "Zero-Telemetry & Privacy",
    tag: "PHILOSOPHY DOCTRINE",
    tag_class: "tag-qa",
    metric_pill: "Free Forever",
    metric_color: "#ec4899",
    question: "Why build 20 free standalone browser tools instead of a paid SaaS subscription?",
    answer: "Modern SaaS has become predatory: charging $9/mo to inspect code diffs or forcing invasive email signups just to format a JSON string. Because client-side computation runs on the user's browser CPU rather than expensive cloud clusters, our operational bandwidth cost is minimal. Offering high-grade, ad-free utilities builds enduring organic authority and authentic developer trust.",
    author: "David Anthony Jones ('Alu') • Founder Doctrine",
    recommendation: "Sustainable, privacy-first utilities engineered by engineers, for engineers.",
    keywords: ["free tools", "saas", "subscriptions", "business model", "privacy", "independent utilities", "no-bs"]
  }
];

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').toLowerCase().trim();
  const category = (url.searchParams.get('category') || 'all').toLowerCase().trim();

  let filtered = ALUMUNGANDR_QA_ARCHIVE;

  if (category !== 'all') {
    filtered = filtered.filter(item => item.category === category);
  }

  if (q) {
    filtered = filtered.filter(item =>
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q) ||
      item.keywords.some(k => k.includes(q))
    );
  }

  return new Response(JSON.stringify({
    success: true,
    platform: "Alumungandr Knowledge Base & Founder Q&A",
    motto: "Beyond Logic is Truth",
    founder: "David Anthony Jones",
    total_entries: filtered.length,
    entries: filtered
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export async function onRequestPost({ request }) {
  try {
    const data = await request.json();
    const name = (data.name || 'Anonymous Engineer').trim().slice(0, 60);
    const category = (data.category || 'Platform Architecture').trim().slice(0, 50);
    const question = (data.question || '').trim().slice(0, 2000);

    if (!question || question.length < 5) {
      return new Response(JSON.stringify({
        success: false,
        error: "Inquiry content must contain at least 5 characters."
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const timestamp = new Date().toISOString();
    const raw = `${name}:${category}:${question}:${timestamp}`;
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(raw));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const receiptHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16).toUpperCase();

    return new Response(JSON.stringify({
      success: true,
      receipt_id: `INQ-${receiptHash}`,
      timestamp: timestamp,
      category: category,
      author: name,
      status: "LOGGED_TO_FOUNDER_QUEUE",
      message: "Technical inquiry dispatched securely to David Anthony Jones. Cataloged in the Alumungandr engineering queue with zero telemetry tracking."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: "Malformed request payload."
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
