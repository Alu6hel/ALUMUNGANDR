// Alumungandr Unified Navigation Controller
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    // Current pathname matching for active link highlight
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.site-header a, .site-footer a').forEach(function(link) {
      const href = link.getAttribute('href');
      if (href && (href === path || href === path + '.html' || (path.startsWith(href) && href !== '/'))) {
        link.classList.add('active');
      }
    });

    // Mobile / Click support for Tools Dropdown
    const dropdown = document.querySelector('.nav-dropdown');
    if (dropdown) {
      const trigger = dropdown.querySelector('.dropdown-trigger');
      if (trigger) {
        trigger.addEventListener('click', function(e) {
          e.stopPropagation();
          const panel = dropdown.querySelector('.dropdown-panel');
          if (panel) {
            const isVisible = window.getComputedStyle(panel).display === 'grid';
            panel.style.display = isVisible ? 'none' : 'grid';
          }
        });
      }

      document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
          const panel = dropdown.querySelector('.dropdown-panel');
          if (panel) panel.style.display = '';
        }
      });
    }
  });
})();
