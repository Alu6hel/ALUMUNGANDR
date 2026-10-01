// Alumungandr Unified Navigation & Touch Controller
(function() {
  // 0. Early Theme Bootstrap (Zero Flash)
  try {
    const savedTheme = localStorage.getItem('alu_theme');
    if (savedTheme === 'paper' || savedTheme === 'amber') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  } catch (e) {}

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

    // 4. Initialize 3-Stage Global Theme Toggle (Dark | Paper | Amber)
    function initThemeToggle() {
      const siteNav = document.querySelector('header.site-header nav.site-nav');
      if (!siteNav || siteNav.querySelector('.theme-toggle-wrap')) return;

      const toggleWrap = document.createElement('div');
      toggleWrap.className = 'theme-toggle-wrap';
      toggleWrap.setAttribute('role', 'radiogroup');
      toggleWrap.setAttribute('aria-label', 'Display Theme');
      toggleWrap.innerHTML = `
        <button type="button" class="theme-toggle-btn" data-theme="dark" title="Obsidian Core (Default)" aria-checked="true">
          <span class="theme-icon">🌙</span><span class="theme-label">Dark</span>
        </button>
        <button type="button" class="theme-toggle-btn" data-theme="paper" title="Paper Monochrome & Negative" aria-checked="false">
          <span class="theme-icon">☀️</span><span class="theme-label">Paper</span>
        </button>
        <button type="button" class="theme-toggle-btn" data-theme="amber" title="Telemetry Amber / Phosphor Gold" aria-checked="false">
          <span class="theme-icon">⚡</span><span class="theme-label">Amber</span>
        </button>
        <div class="theme-slider-thumb"></div>
      `;

      const dropdown = siteNav.querySelector('.nav-dropdown');
      if (dropdown) {
        siteNav.insertBefore(toggleWrap, dropdown);
      } else {
        siteNav.prepend(toggleWrap);
      }

      const thumb = toggleWrap.querySelector('.theme-slider-thumb');
      const buttons = toggleWrap.querySelectorAll('.theme-toggle-btn');

      function updateActiveThumb(theme) {
        let activeBtn = toggleWrap.querySelector(`.theme-toggle-btn[data-theme="${theme}"]`);
        if (!activeBtn) activeBtn = toggleWrap.querySelector('.theme-toggle-btn[data-theme="dark"]');

        buttons.forEach(function(btn) {
          const isActive = btn === activeBtn;
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
        });

        if (thumb && activeBtn) {
          thumb.style.width = activeBtn.offsetWidth + 'px';
          thumb.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
        }
      }

      function applyTheme(theme, save) {
        if (theme === 'paper') {
          document.documentElement.setAttribute('data-theme', 'paper');
        } else if (theme === 'amber') {
          document.documentElement.setAttribute('data-theme', 'amber');
        } else {
          document.documentElement.removeAttribute('data-theme');
          theme = 'dark';
        }

        if (save) {
          try {
            localStorage.setItem('alu_theme', theme);
          } catch (e) {}
        }

        updateActiveThumb(theme);
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
      }

      buttons.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          const selected = this.getAttribute('data-theme');
          applyTheme(selected, true);
        });
      });

      // Keyboard navigation support for accessibility
      toggleWrap.addEventListener('keydown', function(e) {
        const themeOrder = ['dark', 'paper', 'amber'];
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        let idx = themeOrder.indexOf(current);
        if (idx === -1) idx = 0;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const next = themeOrder[(idx + 1) % themeOrder.length];
          applyTheme(next, true);
          const btn = toggleWrap.querySelector(`.theme-toggle-btn[data-theme="${next}"]`);
          if (btn) btn.focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = themeOrder[(idx - 1 + themeOrder.length) % themeOrder.length];
          applyTheme(prev, true);
          const btn = toggleWrap.querySelector(`.theme-toggle-btn[data-theme="${prev}"]`);
          if (btn) btn.focus();
        }
      });

      // Read initial theme and set active position
      const initialTheme = localStorage.getItem('alu_theme') || document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(initialTheme, false);

      // Re-align slider on window resize / orientation change
      window.addEventListener('resize', function() {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        updateActiveThumb(cur);
      });
      setTimeout(function() {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        updateActiveThumb(cur);
      }, 50);
    }

    initThemeToggle();

    // Expose closeAllMenus globally for inline handlers
    window.closeAllNavMenus = closeAllMenus;
  });

  /* ==========================================================================
     UNIVERSAL MOBILE ENGINE: AUTO-DETECTION, OFF-SCREEN PAUSING & ADAPTIVE GRAPHICS
     (Strictly active on mobile screens: window.innerWidth < 768)
     ========================================================================== */
  const isMobileScreen = function() {
    return window.innerWidth < 768 || (window.matchMedia && window.matchMedia('(max-width: 767px)').matches);
  };
  window.isAluMobile = isMobileScreen;

  // Track active canvas for requestAnimationFrame association
  let currentRenderingCanvas = null;
  let isTouchScrolling = false;
  let scrollReleaseTimer = null;

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', function() {
      if (!isMobileScreen()) return;
      isTouchScrolling = true;
      clearTimeout(scrollReleaseTimer);
      scrollReleaseTimer = setTimeout(function() {
        isTouchScrolling = false;
      }, 100);
    }, { passive: true });
  }

  // Native RAF references
  const nativeRaf = window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(fn) { return setTimeout(fn, 16); };
  const nativeCancelRaf = window.cancelAnimationFrame ? window.cancelAnimationFrame.bind(window) : clearTimeout;

  // 1. Mobile-Adaptive WebGL & Three.js Graphics Optimizer
  function patchThreeJS() {
    if (typeof THREE !== 'undefined' && THREE.WebGLRenderer && !THREE.WebGLRenderer._aluMobilePatched) {
      THREE.WebGLRenderer._aluMobilePatched = true;

      // Mobile-Adaptive Graphics: Cap pixel ratio to 1.0 on phones
      const origSetPixelRatio = THREE.WebGLRenderer.prototype.setPixelRatio;
      THREE.WebGLRenderer.prototype.setPixelRatio = function(ratio) {
        if (isMobileScreen()) {
          return origSetPixelRatio.call(this, 1);
        }
        return origSetPixelRatio.call(this, ratio);
      };

      // Pause Off-Screen WebGL rendering
      const origRender = THREE.WebGLRenderer.prototype.render;
      THREE.WebGLRenderer.prototype.render = function(scene, camera) {
        if (isMobileScreen() && this.domElement && this.domElement._mobileIsVisible === false) {
          // Off-screen canvas: completely skip WebGL render calls on mobile
          return;
        }
        currentRenderingCanvas = this.domElement;
        try {
          return origRender.apply(this, arguments);
        } finally {
          currentRenderingCanvas = null;
        }
      };
    }
  }

  patchThreeJS();
  document.addEventListener('DOMContentLoaded', patchThreeJS);
  window.addEventListener('load', patchThreeJS);

  // 2. Pause Off-Screen Canvas Animations via IntersectionObserver
  let mobileCanvasObserver = null;
  const observedCanvases = new Set();

  function initMobileCanvasObserver() {
    if (!('IntersectionObserver' in window)) return;

    if (!mobileCanvasObserver) {
      mobileCanvasObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          const canvas = entry.target;
          const isVisible = entry.isIntersecting && entry.intersectionRatio > 0 && !document.hidden;
          const wasVisible = canvas._mobileIsVisible;
          canvas._mobileIsVisible = isVisible;
          canvas.setAttribute('data-mobile-visible', isVisible ? 'true' : 'false');
          if (isVisible) {
            canvas.removeAttribute('data-offscreen');
          } else {
            canvas.setAttribute('data-offscreen', 'true');
          }

          // Resume any parked animation callback when scrolled back into viewport
          if (isVisible && wasVisible === false && canvas._pendingRafCallbacks && canvas._pendingRafCallbacks.size > 0) {
            canvas._pendingRafCallbacks.forEach(function(cb) {
              nativeRaf(cb);
            });
            canvas._pendingRafCallbacks.clear();
          }
        });
      }, { threshold: [0, 0.02] });
    }

    // Scan and observe all canvas elements
    document.querySelectorAll('canvas').forEach(function(canvas) {
      if (!observedCanvases.has(canvas)) {
        observedCanvases.add(canvas);
        canvas._mobileIsVisible = true;
        canvas._pendingRafCallbacks = new Set();
        mobileCanvasObserver.observe(canvas);
      }
    });
  }

  // 3. Hook 2D Context clearRect for active canvas tracking and off-screen pause
  if (typeof CanvasRenderingContext2D !== 'undefined') {
    const origClearRect = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function(x, y, w, h) {
      currentRenderingCanvas = this.canvas;
      if (isMobileScreen() && this.canvas && this.canvas._mobileIsVisible === false) {
        return; // Off-screen canvas on mobile: skip clear & drawing
      }
      return origClearRect.apply(this, arguments);
    };
  }

  // 4. Mobile-Adaptive requestAnimationFrame Supervisor
  window.requestAnimationFrame = function(callback) {
    // If desktop (>= 768px), pass through directly with zero overhead
    if (!isMobileScreen()) {
      return nativeRaf(callback);
    }

    // Check if associated with an off-screen canvas on mobile
    const targetCanvas = currentRenderingCanvas;
    if (targetCanvas && targetCanvas._mobileIsVisible === false) {
      // Pause animation loop: park callback until canvas re-enters the viewport
      if (!targetCanvas._pendingRafCallbacks) {
        targetCanvas._pendingRafCallbacks = new Set();
      }
      targetCanvas._pendingRafCallbacks.add(callback);
      return 0;
    }

    // Mobile background canvas throttling: during fast mobile touch scrolling,
    // skip background decorative renders to guarantee 60fps touch velocity
    if (isTouchScrolling && targetCanvas && (targetCanvas.id === 'bg-canvas' || targetCanvas.id === 'spaceCanvas' || targetCanvas.id === 'holoCanvas')) {
      return nativeRaf(function() {
        // Yield frame to UI touch gestures
      });
    }

    return nativeRaf(function(timestamp) {
      currentRenderingCanvas = targetCanvas;
      try {
        callback(timestamp);
      } finally {
        currentRenderingCanvas = null;
      }
    });
  };

  // Visibility Change: pause all canvas animations when mobile tab is hidden / minimized
  document.addEventListener('visibilitychange', function() {
    const isHidden = document.hidden;
    observedCanvases.forEach(function(canvas) {
      if (isHidden) {
        canvas._mobileIsVisible = false;
        canvas.setAttribute('data-offscreen', 'true');
      } else {
        if (canvas.getBoundingClientRect) {
          const rect = canvas.getBoundingClientRect();
          const inView = rect.bottom > 0 && rect.top < window.innerHeight;
          canvas._mobileIsVisible = inView;
          if (inView) {
            canvas.removeAttribute('data-offscreen');
            if (canvas._pendingRafCallbacks && canvas._pendingRafCallbacks.size > 0) {
              canvas._pendingRafCallbacks.forEach(function(cb) { nativeRaf(cb); });
              canvas._pendingRafCallbacks.clear();
            }
          }
        }
      }
    });
  });

  // Initialize canvas observation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileCanvasObserver);
  } else {
    initMobileCanvasObserver();
  }
  window.addEventListener('load', initMobileCanvasObserver);

  // MutationObserver for dynamic canvases (e.g. resizer previews)
  if (typeof MutationObserver !== 'undefined' && document.body) {
    const domCanvasObserver = new MutationObserver(function(mutations) {
      let foundCanvas = false;
      mutations.forEach(function(m) {
        if (m.addedNodes) {
          m.addedNodes.forEach(function(n) {
            if (n.nodeName === 'CANVAS' || (n.querySelector && n.querySelector('canvas'))) {
              foundCanvas = true;
            }
          });
        }
      });
      if (foundCanvas) initMobileCanvasObserver();
    });
    domCanvasObserver.observe(document.body, { childList: true, subtree: true });
  }
})();

