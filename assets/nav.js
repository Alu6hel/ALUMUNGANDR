// Alumungandr Unified Navigation & Touch Controller
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

    // Create or locate universal backdrop for mobile/touch dismissal
    let backdrop = document.getElementById('drawerBackdrop') || document.querySelector('.drawer-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'drawerBackdrop';
      backdrop.className = 'drawer-backdrop';
      document.body.prepend(backdrop);
    }

    function closeAllMenus() {
      // 1. Close dropdown panels
      document.querySelectorAll('.nav-dropdown .dropdown-panel').forEach(function(panel) {
        panel.classList.remove('open');
        panel.style.display = '';
      });

      // 2. Close drawer menu
      const drawer = document.getElementById('drawerMenu');
      if (drawer) {
        drawer.classList.remove('active');
      }

      // 3. Deactivate backdrop
      if (backdrop) {
        backdrop.classList.remove('active');
      }
      document.body.style.overflow = '';
    }

    // Tapping backdrop closes all menus immediately
    backdrop.addEventListener('click', closeAllMenus);
    backdrop.addEventListener('touchstart', closeAllMenus, { passive: true });

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
            if (backdrop) backdrop.classList.remove('active');
          } else {
            // Close other dropdowns first
            closeAllMenus();
            panel.classList.add('open');
            panel.style.display = 'grid';
            if (backdrop) backdrop.classList.add('active');
          }
        });
      }
    });

    // 2. Click or Pointerdown Anywhere Outside to Close Dropdown & Drawer Menu
    function handleOutsideInteraction(e) {
      const drawer = document.getElementById('drawerMenu');
      const isDrawerActive = drawer && drawer.classList.contains('active');
      const isDropdownActive = Array.from(document.querySelectorAll('.nav-dropdown .dropdown-panel')).some(p => p.classList.contains('open'));

      if (!isDrawerActive && !isDropdownActive) return;

      const ticketBadge = document.querySelector('.ticket-badge');
      const burgerBtn = document.querySelector('.burger-btn');
      const dirBtns = document.querySelectorAll('[onclick*="toggleDrawerMenu"]');

      let clickedTrigger = false;
      if (ticketBadge && ticketBadge.contains(e.target)) clickedTrigger = true;
      if (burgerBtn && burgerBtn.contains(e.target)) clickedTrigger = true;
      dirBtns.forEach(function(btn) { if (btn.contains(e.target)) clickedTrigger = true; });
      dropdowns.forEach(function(dd) {
        const trig = dd.querySelector('.dropdown-trigger');
        if (trig && trig.contains(e.target)) clickedTrigger = true;
      });

      const insideDrawer = drawer && drawer.contains(e.target);
      const insideDropdown = Array.from(document.querySelectorAll('.nav-dropdown .dropdown-panel')).some(p => p.contains(e.target));

      if (!insideDrawer && !insideDropdown && !clickedTrigger) {
        closeAllMenus();
      }
    }

    document.addEventListener('pointerdown', handleOutsideInteraction);
    document.addEventListener('click', handleOutsideInteraction);

    // 3. Close on Escape Key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeAllMenus();
      }
    });

    // Expose closeAllMenus globally for inline handlers
    window.closeAllNavMenus = closeAllMenus;
  });
})();

