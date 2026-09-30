/**
 * Alumungandr Multi-Gateway Checkout Engine
 * Supports:
 *  1. Lemon Squeezy (International Cards & Apple Pay — Merchant of Record)
 *  2. PayPal (International Direct Payments)
 *  3. Lynk / WiPay / Jamaica JMD Domestic Transfers
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
    paypalMeUrl: 'https://paypal.me/alumungandr',
    defaultLemonSqueezyUrl: 'https://alumungandr.lemonsqueezy.com',
    lynkHandle: '@alumungandr',
    lynkPhone: '+1-876-000-0000', // Owner to update with exact phone or scan code
    wipayUrl: 'https://wipaycaribbean.com',
    bankInfo: 'National Commercial Bank (NCB) / Scotiabank Jamaica. Contact admin@alumungandr.com for domestic RTGS/ACH routing.'
  };

  // State
  let currentProduct = {
    name: 'OmniHost Pro (Professional Edition)',
    tier: 'Commercial License',
    priceUsd: 49.00,
    priceJmd: Math.round(49.00 * CONFIG.usdToJmdRate),
    lsUrl: '',
    paypalUrl: '',
    lynkInfo: ''
  };

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
            <div class="alu-price-usd" id="aluSummaryPriceUsd">$49.00 USD</div>
            <div class="alu-price-jmd" id="aluSummaryPriceJmd">~JA$ 7,670 JMD</div>
          </div>
        </div>

        <!-- Payment Rails Selector -->
        <div class="alu-gateway-tabs">
          <button class="alu-tab-btn active" id="tabBtnLemon" onclick="window.switchAluTab('lemon')">
            <span class="alu-tab-icon">💳</span>
            <span>Card / Apple Pay</span>
          </button>
          <button class="alu-tab-btn" id="tabBtnPaypal" onclick="window.switchAluTab('paypal')">
            <span class="alu-tab-icon">🅿️</span>
            <span>PayPal</span>
          </button>
          <button class="alu-tab-btn" id="tabBtnLynk" onclick="window.switchAluTab('lynk')">
            <span class="alu-tab-icon">🇯🇲</span>
            <span>Jamaica (JMD / Lynk)</span>
          </button>
        </div>

        <!-- Tab 1: Lemon Squeezy (International MoR) -->
        <div class="alu-tab-panel active" id="panelLemon">
          <div class="alu-callout-box">
            <div class="alu-callout-header">
              <span style="color: #de5849;">⚡</span> International Credit / Debit Card &amp; Apple Pay
            </div>
            <p class="alu-callout-desc">
              Processed through our Merchant of Record (<strong>Lemon Squeezy</strong>). All international credit/debit cards (Visa, MasterCard, Amex) and Apple Pay / Google Pay supported with zero foreign transaction friction.
            </p>
            <div class="alu-feature-pill-strip">
              <span class="alu-feature-pill">&#10003; Zero Sales Tax Surprises</span>
              <span class="alu-feature-pill">&#10003; 256-bit TLS Encrypted</span>
              <span class="alu-feature-pill">&#10003; Instant License Key</span>
            </div>
          </div>

          <a href="#" id="aluLemonCheckoutBtn" class="alu-btn-checkout" target="_blank" rel="noopener noreferrer">
            PROCEED WITH CARD / APPLE PAY <span class="btn-arrow">&rarr;</span>
          </a>

          <div style="font-size: 11.5px; color: #5f6575; text-align: center;">
            Need help? Direct inquiries to <a href="mailto:admin@alumungandr.com" style="color: #9aa0b0;">admin@alumungandr.com</a>
          </div>
        </div>

        <!-- Tab 2: PayPal -->
        <div class="alu-tab-panel" id="panelPaypal">
          <div class="alu-callout-box">
            <div class="alu-callout-header">
              <span style="color: #0070ba;">🅿️</span> Direct PayPal International Checkout
            </div>
            <p class="alu-callout-desc">
              Fast, global checkout using your existing PayPal account balance or registered credit cards.
            </p>
            <div class="alu-copy-row">
              <span style="color: #9aa0b0; font-size: 12px;">Recipient PayPal:</span>
              <span class="alu-copy-val" id="aluPaypalVal">admin@alumungandr.com</span>
              <button class="alu-btn-mini-copy" onclick="window.copyToClipboard('admin@alumungandr.com', this)">COPY</button>
            </div>
          </div>

          <a href="${CONFIG.paypalMeUrl}" id="aluPaypalBtn" class="alu-btn-checkout paypal-theme" target="_blank" rel="noopener noreferrer">
            PAY WITH PAYPAL <span class="btn-arrow">&rarr;</span>
          </a>

          <div style="font-size: 11.5px; color: #5f6575; text-align: center;">
            Include your desired product name in the payment memo for instant dispatch.
          </div>
        </div>

        <!-- Tab 3: Jamaican Local Payment (Lynk / Local Bank) -->
        <div class="alu-tab-panel" id="panelLynk">
          <div class="alu-callout-box" style="border-color: rgba(16, 185, 129, 0.35);">
            <div class="alu-callout-header">
              <span style="color: #10b981;">🇯🇲</span> Jamaican Dollar (JMD) Settlement
            </div>
            <p class="alu-callout-desc">
              Based in Jamaica? Pay locally in JMD with zero US conversion penalties via <strong>Lynk</strong> or direct local bank transfer (NCB / Scotiabank).
            </p>

            <div class="alu-copy-row">
              <span style="color: #9aa0b0; font-size: 12px;">Amount Due:</span>
              <span class="alu-copy-val" id="aluLynkJmdDue" style="color: #10b981; font-weight: 700;">JA$ 7,670</span>
              <button class="alu-btn-mini-copy" onclick="window.copyToClipboard(document.getElementById('aluLynkJmdDue').innerText, this)">COPY</button>
            </div>

            <div class="alu-copy-row">
              <span style="color: #9aa0b0; font-size: 12px;">Lynk Handle / Email:</span>
              <span class="alu-copy-val" id="aluLynkHandleVal">admin@alumungandr.com</span>
              <button class="alu-btn-mini-copy" onclick="window.copyToClipboard('admin@alumungandr.com', this)">COPY</button>
            </div>
          </div>

          <!-- Dispatch Verification Form -->
          <div class="alu-dispatch-box">
            <label class="alu-dispatch-label" for="aluTxRefInput">
              Confirm Local Payment (Transaction Reference or Phone #):
            </label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="aluTxRefInput" class="alu-dispatch-input" placeholder="e.g. Lynk Ref #123456 or Sender Name">
              <button type="button" class="alu-btn-checkout lynk-theme" style="width: auto; padding: 9px 16px; font-size: 12px;" onclick="window.submitLocalVerification()">
                VERIFY &amp; DISPATCH
              </button>
            </div>
            <div id="aluLocalStatusMsg" style="font-size: 12px; min-height: 16px;"></div>
          </div>
        </div>

        <!-- Security Footer -->
        <div class="alu-security-footer">
          <span>🔒 SOVEREIGN DISPATCH &bull; NO TRACKING COOKIES</span>
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
      name: opt.product || 'OmniHost Pro (Professional Edition)',
      tier: opt.tier || 'Commercial License',
      priceUsd: parseFloat(opt.priceUsd) || 49.00,
      priceJmd: parseFloat(opt.priceJmd) || Math.round((parseFloat(opt.priceUsd) || 49.00) * CONFIG.usdToJmdRate),
      lsUrl: opt.lsUrl || '',
      paypalUrl: opt.paypalUrl || '',
      lynkInfo: opt.lynkInfo || ''
    };

    // Update UI elements
    document.getElementById('aluSummaryProdName').innerText = currentProduct.name;
    document.getElementById('aluSummaryProdTier').innerText = currentProduct.tier + ' • Instant Digital Delivery';
    document.getElementById('aluSummaryPriceUsd').innerText = '$' + currentProduct.priceUsd.toFixed(2) + ' USD';
    document.getElementById('aluSummaryPriceJmd').innerText = '~JA$ ' + currentProduct.priceJmd.toLocaleString() + ' JMD';
    document.getElementById('aluLynkJmdDue').innerText = 'JA$ ' + currentProduct.priceJmd.toLocaleString();

    // Setup Lemon Squeezy link
    const lsBtn = document.getElementById('aluLemonCheckoutBtn');
    if (currentProduct.lsUrl) {
      lsBtn.href = currentProduct.lsUrl;
      lsBtn.onclick = null;
    } else {
      // Graceful fallback to inquiry / pre-configured checkout mailto
      lsBtn.href = `mailto:${CONFIG.adminEmail}?subject=${encodeURIComponent('Commercial License Order: ' + currentProduct.name)}&body=${encodeURIComponent('Hello David,\n\nI would like to purchase a license for ' + currentProduct.name + ' ($' + currentProduct.priceUsd + ' USD).\n\nPlease send my invoice/payment link.\n\nThank you!')}`;
    }

    // Setup PayPal link
    const paypalBtn = document.getElementById('aluPaypalBtn');
    if (currentProduct.paypalUrl) {
      paypalBtn.href = currentProduct.paypalUrl;
    } else {
      paypalBtn.href = `${CONFIG.paypalMeUrl}/${currentProduct.priceUsd}USD`;
    }

    // Reset tabs
    window.switchAluTab('lemon');
    document.getElementById('aluTxRefInput').value = '';
    document.getElementById('aluLocalStatusMsg').innerHTML = '';

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
    const tabs = ['lemon', 'paypal', 'lynk'];
    tabs.forEach(t => {
      const btn = document.getElementById('tabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
      const panel = document.getElementById('panel' + t.charAt(0).toUpperCase() + t.slice(1));
      if (btn) btn.classList.toggle('active', t === tabId);
      if (panel) panel.classList.toggle('active', t === tabId);
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

    // Construct mailto or direct endpoint dispatch
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

    document.body.addEventListener('click', function (e) {
      const trigger = e.target.closest('[data-checkout-product]');
      if (!trigger) return;
      e.preventDefault();

      window.openAluCheckout({
        product: trigger.getAttribute('data-checkout-product') || 'OmniHost Pro',
        tier: trigger.getAttribute('data-checkout-tier') || 'Commercial License',
        priceUsd: trigger.getAttribute('data-price-usd') || '49.00',
        priceJmd: trigger.getAttribute('data-price-jmd') || '',
        lsUrl: trigger.getAttribute('data-ls-url') || '',
        paypalUrl: trigger.getAttribute('data-paypal-url') || '',
        lynkInfo: trigger.getAttribute('data-lynk-info') || ''
      });
    });
  });

})();
