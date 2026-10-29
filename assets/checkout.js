/**
 * Alumungandr Multi-Gateway Checkout Engine
 * Powered by Live PayPal Smart Buttons & Direct Settlement
 * Supports:
 *  1. PayPal Smart Buttons (Credit / Debit Cards, Apple Pay, Google Pay, PayPal)
 *  2. Regional Multi-Currency Settlement (Lynk / Domestic JMD Wire)
 * 
 * Copyright (c) 2026 Alumungandr Master Charter. All rights reserved.
 */

(function () {
  'use strict';

  // Config defaults
  const CONFIG = {
    usdToJmdRate: 156.5,
    adminEmail: 'admin@alumungandr.com',
    paypalUser: 'admin@alumungandr.com',
    paypalClientId: 'BAAm2GST3f5mZW1aEbPZQO9cxa3betcKjIDY_4ji_aLtuuM-HSK4Dtlt48YqCVYAo1a7Fl6ppL_D64ZbVg',
    paypalMeUrl: 'https://paypal.me/alumungandr',
    lynkHandle: 'admin@alumungandr.com',
    bankInfo: 'National Commercial Bank (NCB) / Scotiabank Jamaica. Contact admin@alumungandr.com for domestic RTGS/ACH routing.'
  };

  // State
  let currentProduct = {
    name: 'OmniHost Pro (Commercial License)',
    tier: 'Commercial Production Edition',
    priceUsd: 4.99,
    priceJmd: Math.round(4.99 * CONFIG.usdToJmdRate),
    downloadUrl: '/downloads/omnihost.apk'
  };

  let sdkLoaded = false;
  let isRenderingButtons = false;

  // Map product names to download binaries
  const DOWNLOAD_MAP = {
    'OmniHost': '/downloads/omnihost.apk',
    'Galaxsee': '/downloads/galaxsee_pro.apk',
    'SueChef': '/downloads/suechef.apk',
    'UnderWraps': '/downloads/UnderWraps.apk'
  };

  function getDownloadUrl(productName) {
    for (const key in DOWNLOAD_MAP) {
      if (productName.toLowerCase().includes(key.toLowerCase())) {
        return DOWNLOAD_MAP[key];
      }
    }
    return null;
  }

  function loadPayPalSdk(callback) {
    if (window.paypal) {
      sdkLoaded = true;
      if (callback) callback();
      return;
    }
    if (document.getElementById('aluPaypalSdkScript')) {
      const existing = document.getElementById('aluPaypalSdkScript');
      existing.addEventListener('load', () => { if (callback) callback(); });
      return;
    }

    const script = document.createElement('script');
    script.id = 'aluPaypalSdkScript';
    script.src = `https://www.paypal.com/sdk/js?client-id=${CONFIG.paypalClientId}&currency=USD&components=buttons,funding-eligibility`;
    script.async = true;
    script.onload = () => {
      sdkLoaded = true;
      if (callback) callback();
    };
    script.onerror = () => {
      console.warn('[Alu Checkout] PayPal SDK failed to load, falling back to manual redirect link.');
    };
    document.head.appendChild(script);
  }

  function createModalHtml() {
    if (document.getElementById('aluCheckoutOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'aluCheckoutOverlay';
    overlay.className = 'alu-checkout-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'aluModalProductTitle');

    overlay.innerHTML = `
      <div class="alu-checkout-modal" onclick="event.stopPropagation()">
        <!-- Header -->
        <div class="alu-modal-header">
          <div class="alu-modal-title-wrap">
            <span class="alu-modal-tag">// SECURE MULTI-RAIL SETTLEMENT</span>
            <h3 class="alu-modal-title" id="aluModalProductTitle">Digital License Checkout</h3>
          </div>
          <button class="alu-modal-close-btn" onclick="window.closeAluCheckout()" aria-label="Close Modal">&times;</button>
        </div>

        <!-- Product Summary Card -->
        <div class="alu-product-summary-card">
          <div class="alu-prod-info">
            <div class="alu-prod-name" id="aluSummaryProdName">OmniHost Pro</div>
            <div class="alu-prod-license" id="aluSummaryProdTier">Commercial License &bull; Instant Digital Delivery</div>
          </div>
          <div class="alu-prod-pricing">
            <div class="alu-price-usd" id="aluSummaryPriceUsd">$4.99 USD</div>
            <div class="alu-price-jmd" id="aluSummaryPriceJmd">~JA$ 780 JMD</div>
          </div>
        </div>

        <!-- Payment Rails Selector -->
        <div class="alu-gateway-tabs">
          <button class="alu-tab-btn active" id="tabBtnPaypal" onclick="window.switchAluTab('paypal')">
            <span class="alu-tab-icon">💳</span>
            <span>Card / PayPal / Wallets</span>
          </button>
          <button class="alu-tab-btn" id="tabBtnLynk" onclick="window.switchAluTab('lynk')">
            <span class="alu-tab-icon">🇯🇲</span>
            <span>Regional (JMD / Lynk)</span>
          </button>
        </div>

        <!-- Tab 1: Live PayPal & Card Smart Checkout -->
        <div class="alu-tab-panel active" id="panelPaypal">
          <div class="alu-callout-box" style="border-color: rgba(0, 112, 186, 0.4);">
            <div class="alu-callout-header">
              <span style="color: #0070ba;">🔒</span> Global Card &amp; PayPal Instant Checkout
            </div>
            <p class="alu-callout-desc">
              Pay securely in USD using any <strong>Credit / Debit Card (Visa, MasterCard, Amex)</strong>, <strong>Apple Pay / Google Pay</strong>, or your <strong>PayPal</strong> account.
            </p>
            <div class="alu-feature-pill-strip">
              <span class="alu-feature-pill">&#10003; 256-Bit SSL Encrypted</span>
              <span class="alu-feature-pill">&#10003; Zero Foreign Friction</span>
              <span class="alu-feature-pill">&#10003; Instant Binary Unlock</span>
            </div>
          </div>

          <!-- Live Interactive PayPal Container -->
          <div id="aluPaypalBtnContainer" style="min-height: 120px; margin: 15px 0;">
            <div id="aluPaypalLoadingSpinner" style="text-align: center; padding: 25px 0; color: #9aa0b0; font-size: 13px;">
              <div style="display:inline-block; width:22px; height:22px; border:2px solid rgba(255,255,255,0.2); border-top-color:#38bdf8; border-radius:50%; animation: aluSpin 0.8s linear infinite; margin-bottom:8px;"></div>
              <div>Initializing secure checkout channels...</div>
            </div>
          </div>

          <!-- Fallback Direct Option -->
          <div id="aluPaypalFallbackRow" style="text-align: center; margin-top: 10px; font-size: 11.5px; color: #5f6575;">
            Having browser popup issues? <a href="#" id="aluDirectPaypalLink" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline;">Open direct PayPal transfer &rarr;</a>
          </div>
        </div>

        <!-- Tab 2: Regional Local Payment (Lynk / Domestic Wire) -->
        <div class="alu-tab-panel" id="panelLynk">
          <div class="alu-callout-box" style="border-color: rgba(16, 185, 129, 0.35);">
            <div class="alu-callout-header">
              <span style="color: #10b981;">🇯🇲</span> Regional Domestic Settlement (Jamaica)
            </div>
            <p class="alu-callout-desc">
              Purchasing from Jamaica or the Caribbean? Pay locally in JMD via <strong>Lynk</strong> or direct domestic ACH/RTGS transfer with zero foreign conversion markups.
            </p>

            <div class="alu-copy-row">
              <span style="color: #9aa0b0; font-size: 12px;">Amount Due:</span>
              <span class="alu-copy-val" id="aluLynkJmdDue" style="color: #10b981; font-weight: 700;">JA$ 780</span>
              <button class="alu-btn-mini-copy" onclick="window.copyToClipboard(document.getElementById('aluLynkJmdDue').innerText, this)">COPY</button>
            </div>

            <div class="alu-copy-row">
              <span style="color: #9aa0b0; font-size: 12px;">Recipient Email / Lynk:</span>
              <span class="alu-copy-val" id="aluLynkHandleVal">admin@alumungandr.com</span>
              <button class="alu-btn-mini-copy" onclick="window.copyToClipboard('admin@alumungandr.com', this)">COPY</button>
            </div>
          </div>

          <!-- Dispatch Verification Form -->
          <div class="alu-dispatch-box">
            <label class="alu-dispatch-label" for="aluTxRefInput">
              Confirm Local Payment (Lynk Reference ID or Phone #):
            </label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="aluTxRefInput" class="alu-dispatch-input" placeholder="e.g. Lynk Ref #123456 or Sender Name">
              <button type="button" class="alu-btn-checkout lynk-theme" style="width: auto; padding: 9px 16px; font-size: 12px;" onclick="window.submitLocalVerification()">
                VERIFY &amp; DISPATCH
              </button>
            </div>
            <div id="aluLocalStatusMsg" style="font-size: 12px; min-height: 16px; margin-top: 6px;"></div>
          </div>
        </div>

        <!-- Success Receipt State (Hidden by default) -->
        <div id="aluSuccessReceiptPanel" style="display: none; text-align: center; padding: 20px 10px;">
          <div style="font-size: 40px; color: #10b981; margin-bottom: 10px;">✓</div>
          <h4 style="color: #fff; font-size: 18px; margin: 0 0 8px 0;">Payment Confirmed!</h4>
          <p style="color: #9aa0b0; font-size: 13px; margin: 0 0 15px 0;" id="aluSuccessMsgText">
            Thank you for your order. Your digital license is ready.
          </p>
          <div id="aluDownloadActionWrap" style="margin: 15px 0;"></div>
          <div style="font-size: 11px; color: #5f6575;">
            A confirmation has been logged to your payment provider. For developer support, email <a href="mailto:admin@alumungandr.com" style="color: #38bdf8;">admin@alumungandr.com</a>.
          </div>
        </div>

        <!-- Security Footer -->
        <div class="alu-security-footer">
          <span>🔒 SECURE 256-BIT DISPATCH &bull; NO TRACKING COOKIES</span>
          <span>CURRENCY: USD &amp; JMD</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // CSS animation for spinner
    if (!document.getElementById('aluCheckoutStyles')) {
      const style = document.createElement('style');
      style.id = 'aluCheckoutStyles';
      style.textContent = `
        @keyframes aluSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `;
      document.head.appendChild(style);
    }

    // Close on overlay click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        window.closeAluCheckout();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        window.closeAluCheckout();
      }
    });
  }

  function renderPayPalButtons() {
    const container = document.getElementById('aluPaypalBtnContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!window.paypal || !window.paypal.Buttons) {
      container.innerHTML = `
        <div style="padding: 15px; background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; font-size: 12px; color: #fca5a5; text-align: center;">
          Unable to initialize interactive card processor. Please use the direct PayPal link below.
        </div>
      `;
      return;
    }

    try {
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'checkout',
          height: 42
        },
        createOrder: function (data, actions) {
          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [{
              description: currentProduct.name,
              custom_id: currentProduct.tier,
              amount: {
                currency_code: 'USD',
                value: currentProduct.priceUsd.toFixed(2)
              }
            }]
          });
        },
        onApprove: function (data, actions) {
          return actions.order.capture().then(function (details) {
            handleSuccessfulPayment(details);
          });
        },
        onError: function (err) {
          console.error('[Alu Checkout] PayPal Button Error:', err);
        }
      }).render('#aluPaypalBtnContainer');
    } catch (err) {
      console.error('[Alu Checkout] Error rendering buttons:', err);
    }
  }

  function handleSuccessfulPayment(details) {
    const payerName = details?.payer?.name?.given_name || 'Valued Customer';
    const txId = details?.id || 'TX-' + Date.now();

    // Hide panels and show receipt
    document.getElementById('panelPaypal').style.display = 'none';
    document.getElementById('panelLynk').style.display = 'none';
    document.querySelector('.alu-gateway-tabs').style.display = 'none';
    
    const receipt = document.getElementById('aluSuccessReceiptPanel');
    receipt.style.display = 'block';

    document.getElementById('aluSuccessMsgText').innerHTML = `
      Thank you, <strong>${payerName}</strong>! Your order for <strong>${currentProduct.name}</strong> has been confirmed.<br>
      <span style="font-family: monospace; font-size: 11px; color: #38bdf8;">Transaction ID: ${txId}</span>
    `;

    const downloadWrap = document.getElementById('aluDownloadActionWrap');
    const dlUrl = getDownloadUrl(currentProduct.name);

    if (dlUrl) {
      downloadWrap.innerHTML = `
        <a href="${dlUrl}" download class="alu-btn-checkout" style="display: inline-block; background: #10b981; border-color: #10b981; text-decoration: none; padding: 12px 24px; font-weight: bold;">
          DOWNLOAD BINARY (.APK) &darr;
        </a>
      `;
    } else {
      downloadWrap.innerHTML = `
        <a href="mailto:${CONFIG.adminEmail}?subject=${encodeURIComponent('License Delivery: ' + currentProduct.name + ' [' + txId + ']')}" class="alu-btn-checkout" style="display: inline-block; background: #38bdf8; border-color: #38bdf8; text-decoration: none; padding: 12px 24px; font-weight: bold;">
          REQUEST EPUB / PDF COPIES &rarr;
        </a>
      `;
    }
  }

  // Global methods
  window.openAluCheckout = function (options) {
    createModalHtml();
    const opt = options || {};

    currentProduct = {
      name: opt.product || 'OmniHost Pro (Commercial License)',
      tier: opt.tier || 'Commercial Production Edition',
      priceUsd: parseFloat(opt.priceUsd) || 4.99,
      priceJmd: parseFloat(opt.priceJmd) || Math.round((parseFloat(opt.priceUsd) || 4.99) * CONFIG.usdToJmdRate)
    };

    // Update UI elements
    document.getElementById('aluSummaryProdName').innerText = currentProduct.name;
    document.getElementById('aluSummaryProdTier').innerText = currentProduct.tier + ' • Instant Digital Delivery';
    document.getElementById('aluSummaryPriceUsd').innerText = '$' + currentProduct.priceUsd.toFixed(2) + ' USD';
    document.getElementById('aluSummaryPriceJmd').innerText = '~JA$ ' + currentProduct.priceJmd.toLocaleString() + ' JMD';
    document.getElementById('aluLynkJmdDue').innerText = 'JA$ ' + currentProduct.priceJmd.toLocaleString();

    // Fallback direct link
    const fallbackLink = document.getElementById('aluDirectPaypalLink');
    if (fallbackLink) {
      fallbackLink.href = `${CONFIG.paypalMeUrl}/${currentProduct.priceUsd.toFixed(2)}USD`;
    }

    // Reset view states
    document.getElementById('panelPaypal').style.display = 'block';
    document.getElementById('panelLynk').style.display = 'none';
    document.getElementById('aluSuccessReceiptPanel').style.display = 'none';
    document.querySelector('.alu-gateway-tabs').style.display = 'flex';
    window.switchAluTab('paypal');

    // Show modal
    const overlay = document.getElementById('aluCheckoutOverlay');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Render buttons
    if (sdkLoaded) {
      renderPayPalButtons();
    } else {
      loadPayPalSdk(renderPayPalButtons);
    }
  };

  window.closeAluCheckout = function () {
    const overlay = document.getElementById('aluCheckoutOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  window.switchAluTab = function (tabId) {
    const tabs = ['paypal', 'lynk'];
    tabs.forEach(t => {
      const btn = document.getElementById('tabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
      const panel = document.getElementById('panel' + t.charAt(0).toUpperCase() + t.slice(1));
      if (btn) btn.classList.toggle('active', t === tabId);
      if (panel) panel.style.display = (t === tabId) ? 'block' : 'none';
    });
  };

  window.copyToClipboard = function (text, btnElement) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showCopied(btnElement);
      }).catch(() => {
        fallbackCopy(text, btnElement);
      });
    } else {
      fallbackCopy(text, btnElement);
    }
  };

  function fallbackCopy(text, btnElement) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showCopied(btnElement);
    } catch (e) {
      alert('Copied: ' + text);
    }
    document.body.removeChild(textarea);
  }

  function showCopied(btn) {
    if (!btn) return;
    const oldText = btn.innerText;
    btn.innerText = 'COPIED! ✓';
    btn.style.background = '#10b981';
    btn.style.borderColor = '#10b981';
    setTimeout(() => {
      btn.innerText = oldText;
      btn.style.background = '';
      btn.style.borderColor = '';
    }, 2000);
  }

  window.submitLocalVerification = function () {
    const ref = document.getElementById('aluTxRefInput').value.trim();
    const statusMsg = document.getElementById('aluLocalStatusMsg');

    if (!ref) {
      statusMsg.innerHTML = '<span style="color: #ff4838;">⚠ Please enter your Lynk Reference ID or Sender Name.</span>';
      return;
    }

    statusMsg.innerHTML = '<span style="color: #38bdf8;">Transmitting verification to Alumungandr dispatch desk...</span>';

    const subject = encodeURIComponent(`[Lynk Payment Submitted] ${currentProduct.name} - ${ref}`);
    const body = encodeURIComponent(
      `Hello David,\n\nI have submitted a domestic Jamaican payment for ${currentProduct.name} (JA$ ${currentProduct.priceJmd.toLocaleString()}).\n\nTransaction Reference: ${ref}\n\nPlease verify and issue my digital license.\n\nThank you!`
    );

    setTimeout(() => {
      statusMsg.innerHTML = `<span style="color: #10b981; font-weight: bold;">✓ Verification logged! Opening confirmation email...</span>`;
      window.location.href = `mailto:${CONFIG.adminEmail}?subject=${subject}&body=${body}`;
    }, 600);
  };

  // Auto-bind click handlers to any data-checkout buttons
  document.addEventListener('DOMContentLoaded', function () {
    createModalHtml();
    loadPayPalSdk(); // Preload SDK for instant snappy modal response

    document.body.addEventListener('click', function (e) {
      const trigger = e.target.closest('[data-checkout-product]');
      if (!trigger) return;
      e.preventDefault();

      window.openAluCheckout({
        product: trigger.getAttribute('data-checkout-product') || 'OmniHost Pro',
        tier: trigger.getAttribute('data-checkout-tier') || 'Commercial License',
        priceUsd: trigger.getAttribute('data-price-usd') || '4.99',
        priceJmd: trigger.getAttribute('data-price-jmd') || ''
      });
    });
  });

})();
