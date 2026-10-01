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

    // 1. Mobile & Click Support for Tools Dropdown
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    dropdowns.forEach(function(dropdown) {
      const trigger = dropdown.querySelector('.dropdown-trigger');
      const panel = dropdown.querySelector('.dropdown-panel');
      if (trigger && panel) {
        trigger.addEventListener('click', function(e) {
          e.stopPropagation();
          const isVisible = panel.classList.contains('open') || window.getComputedStyle(panel).display === 'grid';
          if (isVisible) {
            panel.classList.remove('open');
            panel.style.display = 'none';
          } else {
            panel.classList.add('open');
            panel.style.display = 'grid';
          }
        });
      }
    });

    // 2. Click Anywhere Outside to Close Dropdown & Drawer Menu
    document.addEventListener('click', function(e) {
      // Close dropdowns
      dropdowns.forEach(function(dropdown) {
        const panel = dropdown.querySelector('.dropdown-panel');
        if (panel && !dropdown.contains(e.target)) {
          panel.classList.remove('open');
          panel.style.display = '';
        }
      });

      // Close drawerMenu if open
      const drawer = document.getElementById('drawerMenu');
      const ticketBadge = document.querySelector('.ticket-badge');
      const burgerBtn = document.querySelector('.burger-btn');
      const dirBtn = document.querySelector('button[onclick*="toggleDrawerMenu"]');
      if (drawer && drawer.classList.contains('active')) {
        const clickedTrigger = (ticketBadge && ticketBadge.contains(e.target)) ||
                               (burgerBtn && burgerBtn.contains(e.target)) ||
                               (dirBtn && dirBtn.contains(e.target));
        if (!drawer.contains(e.target) && !clickedTrigger) {
          drawer.classList.remove('active');
        }
      }
    });

    // 3. Close on Escape Key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        dropdowns.forEach(function(dropdown) {
          const panel = dropdown.querySelector('.dropdown-panel');
          if (panel) {
            panel.classList.remove('open');
            panel.style.display = '';
          }
        });
        const drawer = document.getElementById('drawerMenu');
        if (drawer) drawer.classList.remove('active');
      }
    });
  });
})();
