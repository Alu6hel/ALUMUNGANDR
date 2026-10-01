import re
import shutil
import os

TOOL_BADGES = {
    'stats': 'TELEMETRY // INDEX',
    'call': 'P2P // CALLING',
    'clip': 'QUANTUM // CLIPBOARD',
    'uuid': 'UUID // ENGINE',
    'json': 'JSON // INSPECTOR',
    'regex': 'REGEX // LAB',
    'hash': 'HASH // LAB',
    'diff': 'DIFF // LAB',
    'jwt': 'JWT // LAB',
    'colors': 'COLOR // STUDIO',
    'meme': 'MEME // STUDIO',
    'draw': 'DRAW // CANVAS',
    'write': 'MARKDOWN // VAULT',
    'timecapsule': 'TIME // CAPSULE',
    'about': 'MISSION // CHARTER',
    'faq': 'SYSTEM // FAQ',
    'contact': 'CONTACT // VERIFY',
    'privacy': 'ZERO-LOG // CHARTER',
    'terms': 'TERMS // CHARTER',
    'speedtest': 'BROADBAND // TELEMETRY',
    'speedtest-vs-ookla': 'BENCHMARK // DOSSIER',
    'invoice': 'INVOICE // STUDIO',
    'resizer': 'IMAGE // RESIZER',
    'subscriptions': 'REALITY // CHECK',
    'ip': 'NETWORK // DIAGNOSTICS',
    'timezone': 'TEMPORAL // MATCHER',
    'store': 'COMMERCE // VAULT',
}

def get_header_html(badge="TOOL // SUITE"):
    return f'''  <header class="site-header">
    <a href="/" class="brand">
      <img src="/logo.svg" alt="Alumungandr Logo" width="28" height="28">
      <span>ALUMUNGANDR</span>
      <span class="brand-badge">{badge}</span>
    </a>
    <nav class="site-nav">
      <div class="theme-toggle-wrap" role="radiogroup" aria-label="Display Theme">
        <button type="button" class="theme-toggle-btn active" data-theme="dark" title="Obsidian Core (Default)" aria-label="Dark Theme" aria-checked="true">
          <span class="theme-icon">🌙</span>
        </button>
        <button type="button" class="theme-toggle-btn" data-theme="paper" title="Paper Monochrome &amp; Negative" aria-label="Paper Theme" aria-checked="false">
          <span class="theme-icon">☀️</span>
        </button>
        <button type="button" class="theme-toggle-btn" data-theme="amber" title="Telemetry Amber / Phosphor Gold" aria-label="Amber Theme" aria-checked="false">
          <span class="theme-icon">⚡</span>
        </button>
        <div class="theme-slider-thumb"></div>
      </div>
      <div class="nav-dropdown">
        <button class="dropdown-trigger" type="button">All Tools &#9662;</button>
        <div class="dropdown-panel">
          <div class="dropdown-col">
            <div class="dropdown-header">BROADBAND &amp; NETWORK</div>
            <a href="/speedtest">&#9889; Speed Test</a>
            <a href="/stats">&#127760; Speed Stats</a>
            <a href="/call">&#128249; P2P Video Call</a>
            <a href="/clip">&#128203; Clipboard</a>
            <a href="/ip">&#10052;&#65039; What Is My IP</a>
            <a href="/timezone">&#127757; Timezone</a>
          </div>
          <div class="dropdown-col">
            <div class="dropdown-header">DEVELOPER SUITE</div>
            <a href="/json">{{ }} JSON Formatter</a>
            <a href="/uuid">&#127380; UUID Generator</a>
            <a href="/regex">.* Regex Tester</a>
            <a href="/hash"># Hash Lab</a>
            <a href="/diff">&#8644; Diff Checker</a>
            <a href="/jwt">&#128273; JWT Debugger</a>
          </div>
          <div class="dropdown-col">
            <div class="dropdown-header">CREATIVE &amp; UTILITIES</div>
            <a href="/colors">&#127912; Color Studio</a>
            <a href="/meme">&#127917; Meme Studio</a>
            <a href="/draw">&#9999;&#65039; Whiteboard</a>
            <a href="/write">&#128221; Markdown Vault</a>
            <a href="/timecapsule">&#9203; Time Capsule</a>
            <a href="/invoice">&#128196; Invoice Maker</a>
            <a href="/resizer">&#128444;&#65039; Image Resizer</a>
            <a href="/subscriptions">&#9762;&#65039; Reality Check</a>
          </div>
        </div>
      </div>
      <a href="/store" class="nav-item">Store</a>
      <a href="/about" class="nav-item">About</a>
      <a href="/contact" class="nav-item">Contact</a>
    </nav>
  </header>'''

def get_footer_html():
    return '''  <footer class="site-footer">
    <div class="footer-container">
      <div class="footer-col">
        <div class="footer-brand">
          <img src="/logo.svg" alt="Alumungandr Logo" width="22" height="22">
          <span>ALUMUNGANDR</span>
        </div>
        <p class="footer-desc">
          Privacy-first web utilities, compiler architecture, and verified Android applications. Zero tracking, zero telemetry, 100% in-browser computation.
        </p>
        <div class="footer-copy">&copy; 2026 Alumungandr Systems. All rights reserved.</div>
      </div>
      <div class="footer-col">
        <div class="footer-heading">Broadband &amp; Network</div>
        <a href="/speedtest">Internet Speed Test</a>
        <a href="/stats">Global Speed Leaderboard</a>
        <a href="/call">P2P Encrypted Video Call</a>
        <a href="/clip">Cross-Device Clipboard</a>
        <a href="/ip">What Is My IP?</a>
        <a href="/timezone">Timezone Matcher</a>
      </div>
      <div class="footer-col">
        <div class="footer-heading">Developer Suite</div>
        <a href="/json">JSON Formatter &amp; Tree</a>
        <a href="/uuid">UUID / GUID Generator</a>
        <a href="/regex">Regex Tester &amp; Lab</a>
        <a href="/hash">Cryptographic Hash Lab</a>
        <a href="/diff">Code Diff Checker</a>
        <a href="/jwt">JWT Debugger &amp; Builder</a>
      </div>
      <div class="footer-col">
        <div class="footer-heading">Creative &amp; Utilities</div>
        <a href="/colors">Color Palette Studio</a>
        <a href="/meme">Meme Generator Canvas</a>
        <a href="/draw">Infinite Whiteboard</a>
        <a href="/write">Markdown Editor &amp; Vault</a>
        <a href="/timecapsule">Encrypted Time Capsule</a>
        <a href="/invoice">No-BS Invoice Maker</a>
        <a href="/resizer">Batch Image Resizer</a>
        <a href="/subscriptions">Reality Check Calculator</a>
      </div>
      <div class="footer-col">
        <div class="footer-heading">Platform &amp; Legal</div>
        <a href="/store">Digital Storefront</a>
        <a href="/about">About Alumungandr</a>
        <a href="/faq">FAQ &amp; Knowledge Base</a>
        <a href="/contact">Contact &amp; Terminal</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </div>
    </div>
  </footer>
  <script src="/assets/nav.js?v=20261001d" defer></script>'''

def update_page(filename, badge):
    if not os.path.exists(filename):
        print(f"Skipping {filename}, not found.")
        return

    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Ensure nav.css is included in <head> with cache-buster
    if '/assets/nav.css' not in html:
        html = html.replace('</head>', '  <link rel="stylesheet" href="/assets/nav.css?v=20261001d">\n</head>')
    else:
        html = re.sub(r'/assets/nav\.css(\?v=[a-zA-Z0-9_\-]+)?', '/assets/nav.css?v=20261001d', html)

    # 2. Update Header / Nav
    header_html = get_header_html(badge)
    footer_html = get_footer_html()

    if '<header class="site-header">' in html:
        html = re.sub(r'<header class="site-header">.*?</header>', header_html, html, count=1, flags=re.DOTALL)
    elif '<header class="speed-nav">' in html:
        html = re.sub(r'<header class="speed-nav">.*?</header>', header_html, html, count=1, flags=re.DOTALL)
    elif '<header class="site-nav">' in html:
        html = re.sub(r'<header class="site-nav">.*?</header>', header_html, html, count=1, flags=re.DOTALL)
    elif filename in ['contact.html', 'resizer.html', 'timezone.html', 'subscriptions.html', 'terms.html', 'privacy.html']:
        html = re.sub(r'<nav>.*?</nav>', header_html, html, count=1, flags=re.DOTALL)
    elif filename == 'ip.html':
        html = re.sub(r'<header>.*?</header>', header_html, html, count=1, flags=re.DOTALL)
    elif filename == 'store.html':
        html = re.sub(r'<header>.*?</header>', header_html, html, count=1, flags=re.DOTALL)
    elif '<header' in html and filename not in ['index.html']:
        html = re.sub(r'<header[^>]*>.*?</header>', header_html, html, count=1, flags=re.DOTALL)

    # 3. Update Footer & Nav.js script
    if filename not in ['draw.html', 'write.html']:
        if '<footer class="site-footer">' in html:
            html = re.sub(r'<footer class="site-footer">.*?</footer>\s*(<script src="/assets/nav\.js[^>]*>\s*</script>)?', footer_html, html, count=1, flags=re.DOTALL)
        elif '<footer class="speed-footer">' in html:
            html = re.sub(r'<footer class="speed-footer">.*?</footer>\s*(<script src="/assets/nav\.js[^>]*>\s*</script>)?', footer_html, html, count=1, flags=re.DOTALL)
        elif '<footer' in html:
            html = re.sub(r'<footer[^>]*>.*?</footer>\s*(<script src="/assets/nav\.js[^>]*>\s*</script>)?', footer_html, html, count=1, flags=re.DOTALL)
        else:
            html = html.replace('</body>', footer_html + '\n</body>')
    else:
        if '/assets/nav.js' not in html:
            html = html.replace('</body>', '  <script src="/assets/nav.js?v=20261001d" defer></script>\n</body>')
        else:
            html = re.sub(r'/assets/nav\.js(\?v=[a-zA-Z0-9_\-]+)?', '/assets/nav.js?v=20261001d', html)

    # Also clean up any lingering old nav.js tags
    html = re.sub(r'/assets/nav\.js(\?v=[a-zA-Z0-9_\-]+)?', '/assets/nav.js?v=20261001d', html)

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html)

    # Mirror to subdirectory if tool directory exists
    tool_key = filename.replace('.html', '')
    if os.path.isdir(tool_key):
        shutil.copyfile(filename, os.path.join(tool_key, 'index.html'))
        print(f"Updated {filename} and {tool_key}/index.html")
    else:
        print(f"Updated {filename}")

if __name__ == '__main__':
    for page, badge in TOOL_BADGES.items():
        update_page(f"{page}.html", badge)
    print("\nNavigation and footer synchronization complete!")
