import re
import shutil
import os

TOOL_BADGES = {
    'stats': 'TELEMETRY // INDEX',
    'uses': 'ENGINEERING // ARSENAL',
    'ama': 'FOUNDER // ARCHIVE',
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
    'about': 'SOVEREIGN // MISSION',
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

def get_header_html(badge):
    return f'''  <header class="site-header">
    <a href="/" class="brand">
      <img src="/logo.svg" alt="Alumungandr Logo" width="28" height="28">
      <span>ALUMUNGANDR</span>
      <span class="brand-badge">{badge}</span>
    </a>
    <nav class="site-nav">
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
      <a href="/uses" class="nav-item">/uses</a>
      <a href="/ama" class="nav-item">/ama</a>
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
          Sovereign, privacy-first web utilities, compiler architecture, and verified Android applications. Zero tracking, zero telemetry, 100% in-browser computation.
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
        <a href="/uses">Developer Tech Stack (/uses)</a>
        <a href="/ama">Ask Me Anything (/ama)</a>
        <a href="/store">Digital Storefront</a>
        <a href="/about">About Alumungandr</a>
        <a href="/faq">FAQ &amp; Knowledge Base</a>
        <a href="/contact">Contact &amp; Terminal</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </div>
    </div>
  </footer>
  <script src="/assets/nav.js" defer></script>'''

def update_page(filename, badge):
    if not os.path.exists(filename):
        print(f"Skipping {filename}, not found.")
        return

    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Ensure nav.css is included in <head>
    if '/assets/nav.css' not in html:
        html = html.replace('</head>', '  <link rel="stylesheet" href="/assets/nav.css">\n</head>')

    header_html = get_header_html(badge)
    footer_html = get_footer_html()

    # 2. Update Header / Nav
    # Look for existing site-header first
    if '<header class="site-header">' in html:
        html = re.sub(r'<header class="site-header">.*?</header>', header_html, html, count=1, flags=re.DOTALL)
    elif '<header class="speed-nav">' in html:
        html = re.sub(r'<header class="speed-nav">.*?</header>', header_html, html, count=1, flags=re.DOTALL)
    elif '<header class="site-nav">' in html:
        html = re.sub(r'<header class="site-nav">.*?</header>', header_html, html, count=1, flags=re.DOTALL)
    elif filename in ['contact.html', 'resizer.html', 'timezone.html', 'subscriptions.html', 'terms.html', 'privacy.html']:
        # Match <nav>...</nav> before <main>
        html = re.sub(r'<nav>.*?</nav>', header_html, html, count=1, flags=re.DOTALL)
    elif filename == 'ip.html':
        # Match <header>...</header> before <main>
        html = re.sub(r'<header>.*?</header>', header_html, html, count=1, flags=re.DOTALL)
    elif filename == 'store.html':
        # Replace <header>...</header>
        html = re.sub(r'<header>.*?</header>', header_html, html, count=1, flags=re.DOTALL)
        # Also remove redundant #drawerMenu in store.html since dropdown handles it
        html = re.sub(r'<div id="drawerMenu".*?</div>\s*</div>', '', html, count=1, flags=re.DOTALL)
    elif '<header' in html and filename not in ['index.html']:
        html = re.sub(r'<header[^>]*>.*?</header>', header_html, html, count=1, flags=re.DOTALL)

    # 3. Update Footer
    if filename not in ['draw.html', 'write.html']:
        if '<footer class="site-footer">' in html:
            html = re.sub(r'<footer class="site-footer">.*?</footer>\s*(<script src="/assets/nav\.js" defer></script>)?', footer_html, html, count=1, flags=re.DOTALL)
        elif '<footer class="speed-footer">' in html:
            html = re.sub(r'<footer class="speed-footer">.*?</footer>', footer_html, html, count=1, flags=re.DOTALL)
        elif '<footer' in html:
            html = re.sub(r'<footer[^>]*>.*?</footer>', footer_html, html, count=1, flags=re.DOTALL)
        else:
            # Insert before </body>
            html = html.replace('</body>', footer_html + '\n</body>')
    else:
        # Full-screen tools (draw, write)
        if '/assets/nav.js' not in html:
            html = html.replace('</body>', '  <script src="/assets/nav.js" defer></script>\n</body>')

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html)

    # Mirror to subdirectory if it is one of the 16 tools
    tool_key = filename.replace('.html', '')
    if tool_key in ['stats', 'uses', 'ama', 'call', 'clip', 'uuid', 'json', 'regex', 'hash', 'diff', 'jwt', 'colors', 'meme', 'draw', 'write', 'timecapsule']:
        os.makedirs(tool_key, exist_ok=True)
        shutil.copyfile(filename, os.path.join(tool_key, 'index.html'))
        print(f"Updated {filename} and {tool_key}/index.html")
    else:
        print(f"Updated {filename}")

if __name__ == '__main__':
    for page, badge in TOOL_BADGES.items():
        update_page(f"{page}.html", badge)
    print("\nNavigation and footer synchronization complete!")
