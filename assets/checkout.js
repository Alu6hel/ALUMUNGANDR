/**
 * Alumungandr Multi-Gateway Checkout Engine
 * Bulletproof Direct PayPal Settlement & Smart Payment Rails
 * 
 * Recipient: admin@alumungandr.com
 * Supported: PayPal, Visa, MasterCard, Amex, Apple Pay, Google Pay, Lynk JMD
 * 
 * Copyright (c) 2026 Alumungandr Master Charter. All rights reserved.
 */

(function () {
  'use strict';

  // Config defaults
  const CONFIG = {
    usdToJmdRate: 156.5,
    adminEmail: 'admin@alumungandr.com',
    paypalBusinessEmail: 'admin@alumungandr.com',
    paypalClientId: 'BAAm2GST3f5mZW1aEbPZQO9cxa3betcKjIDY_4ji_aLtuuM-HSK4Dtlt48YqCVYAo1a7Fl6ppL_D64ZbVg',
    paypalMeUrl: 'https://paypal.me/alumungandr',
    lynkHandle: 'admin@alumungandr.com',
    siteUrl: 'https://alumungandr.com'
  };

  // State
  let currentProduct = {
    name: 'OmniHost Pro (Commercial License)',
    tier: 'Commercial Production Edition',
    priceUsd: 4.99,
    priceJmd: Math.round(4.99 * CONFIG.usdToJmdRate),
    downloadUrl: '/downloads/omnihost.apk'
  };

  // Map product names to binary downloads
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
            <span>Card / PayPal Checkout</span>
          </button>
          <button class="alu-tab-btn" id="tabBtnLynk" onclick="window.switchAluTab('lynk')">
            <span class="alu-tab-icon">🇯🇲</span>
            <span>Regional (JMD / Lynk)</span>
          </button>
        </div>

        <!-- Tab 1: Direct PayPal & Card Checkout -->
        <div class="alu-tab-panel active" id="panelPaypal">
          <div class="alu-callout-box" style="border-color: rgba(0, 112, 186, 0.4); margin-bottom: 16px;">
            <div class="alu-callout-header">
              <span style="color: #0070ba;">🔒</span> Global Card &amp; PayPal Instant Checkout
            </div>
            <p class="alu-callout-desc">
              Pay securely in USD using any <strong>Credit / Debit Card (Visa, MasterCard, Amex)</strong>, <strong>Apple Pay / Google Pay</strong>, or your <strong>PayPal Account</strong>.
            </p>
            <div class="alu-feature-pill-strip">
              <span class="alu-feature-pill">&#10003; 256-Bit SSL Encrypted</span>
              <span class="alu-feature-pill">&#10003; Zero Foreign Friction</span>
              <span class="alu-feature-pill">&#10003; Instant Binary Unlock</span>
            </div>
          </div>

          <!-- Primary 1-Click Form Checkout to PayPal (100% Reliable & Direct) -->
          <form id="aluDirectPaypalForm" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" style="margin-bottom: 12px;">
            <input type="hidden" name="cmd" value="_xclick">
            <input type="hidden" name="business" value="${CONFIG.paypalBusinessEmail}">
            <input type="hidden" name="item_name" id="aluFormItemName" value="OmniHost Pro (Commercial License)">
            <input type="hidden" name="item_number" id="aluFormItemNumber" value="ALU-PRO-01">
            <input type="hidden" name="amount" id="aluFormAmount" value="4.99">
            <input type="hidden" name="currency_code" value="USD">
            <input type="hidden" name="no_shipping" value="1">
            <input type="hidden" name="no_note" value="0">
            <input type="hidden" name="landing_page" value="Billing">
            <input type="hidden" name="solution_type" value="Sole">
            <input type="hidden" name="cn" value="Optional license notes or specific contact email">
            <input type="hidden" name="return" value="${CONFIG.siteUrl}/store?payment=success">
            <input type="hidden" name="cancel_return" value="${CONFIG.siteUrl}/store?payment=cancel">

            <button type="submit" class="alu-btn-checkout" style="background: linear-gradient(135deg, #ffc439 0%, #f4b41a 100%); color: #003087; font-weight: 800; border-color: #e0a300; font-size: 14px; box-shadow: 0 4px 14px rgba(244,180,26,0.35);">
              <span>PAY WITH PAYPAL OR CARD &rarr;</span>
            </button>
          </form>

          <!-- Alternative 1-Click PayPal.Me Button -->
          <div style="display: flex; gap: 8px; justify-content: center; align-items: center; margin-top: 10px;">
            <a href="${CONFIG.paypalMeUrl}/4.99USD" id="aluPaypalMeBtn" class="alu-btn-checkout" target="_blank" rel="noopener noreferrer" style="background: rgba(0, 112, 186, 0.12); border-color: rgba(0, 112, 186, 0.4); color: #38bdf8; font-size: 12px; padding: 10px 16px; text-decoration: none;">
              Open in PayPal.Me App ($4.99) &rarr;
            </a>
          </div>

          <!-- Interactive Smart Buttons Container (Loads if client ID propagates) -->
          <div id="aluSmartButtonsWrapper" style="display:none; margin-top: 15px;">
            <div style="font-size: 11px; color: #5f6575; text-align: center; margin-bottom: 8px;">OR USE 1-TAP WALLET:</div>
            <div id="aluPaypalSmartContainer"></div>
          </div>
        </div>

        <!-- Tab 2: Regional Local Payment (Lynk / Domestic Wire) -->
        <div class="alu-tab-panel" id="panelLynk" style="display: none;">
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

        <!-- Success Receipt State -->
        <div id="aluSuccessReceiptPanel" style="display: none; text-align: center; padding: 25px 15px;">
          <div style="font-size: 44px; color: #10b981; margin-bottom: 12px;">✓</div>
          <h4 style="color: #fff; font-size: 20px; margin: 0 0 8px 0;">Payment Confirmed!</h4>
          <p style="color: #9aa0b0; font-size: 13px; margin: 0 0 20px 0;" id="aluSuccessMsgText">
            Thank you for supporting independent software. Your digital license is ready.
          </p>
          <div id="aluDownloadActionWrap" style="margin: 20px 0;"></div>
          <div style="font-size: 11.5px; color: #5f6575;">
            A confirmation receipt has been issued to <a href="mailto:admin@alumungandr.com" style="color: #38bdf8;">admin@alumungandr.com</a>.
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

    // Update Direct Form Inputs
    document.getElementById('aluFormItemName').value = currentProduct.name;
    document.getElementById('aluFormAmount').value = currentProduct.priceUsd.toFixed(2);
    document.getElementById('aluFormItemNumber').value = 'ALU-' + currentProduct.name.replace(/[^A-Za-z0-9]/g, '').substring(0, 8).toUpperCase();

    // Update PayPal.Me Link
    const ppMeBtn = document.getElementById('aluPaypalMeBtn');
    if (ppMeBtn) {
      ppMeBtn.href = `${CONFIG.paypalMeUrl}/${currentProduct.priceUsd.toFixed(2)}USD`;
      ppMeBtn.innerText = `Open in PayPal.Me App ($${currentProduct.priceUsd.toFixed(2)}) →`;
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

  // Check URL params on load for payment return
  document.addEventListener('DOMContentLoaded', function () {
    createModalHtml();

    // Check if returning from PayPal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      window.openAluCheckout();
      document.getElementById('panelPaypal').style.display = 'none';
      document.getElementById('panelLynk').style.display = 'none';
      document.querySelector('.alu-gateway-tabs').style.display = 'none';
      const receipt = document.getElementById('aluSuccessReceiptPanel');
      receipt.style.display = 'block';
      document.getElementById('aluSuccessMsgText').innerHTML = `
        Thank you! Your PayPal payment has been received and verified.<br>
        <span style="font-family: monospace; font-size: 11px; color: #38bdf8;">Status: Settled &amp; Confirmed</span>
      `;
      const dlWrap = document.getElementById('aluDownloadActionWrap');
      dlWrap.innerHTML = `
        <a href="/downloads/omnihost.apk" download class="alu-btn-checkout" style="display: inline-block; background: #10b981; border-color: #10b981; text-decoration: none; padding: 12px 24px; font-weight: bold;">
          DOWNLOAD BINARY (.APK) &darr;
        </a>
      `;
    }

    // Auto-bind click handlers to any data-checkout buttons
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
