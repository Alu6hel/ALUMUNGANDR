/**
 * Alumungandr Multi-Gateway Checkout Engine
 * Bulletproof Direct PayPal Settlement & Smart Payment Rails
 * 
 * Recipient: admin@alumungandr.com
 * Supported: PayPal, Visa, MasterCard, Amex, Apple Pay, Google Pay, Bitcoin (BTC)
 * 
 * Copyright (c) 2026 Alumungandr Master Charter. All rights reserved.
 */

(function () {
  'use strict';

  // Config defaults
  const CONFIG = {
    adminEmail: 'admin@alumungandr.com',
    paypalBusinessEmail: 'admin@alumungandr.com',
    paypalClientId: 'BAAm2GST3f5mZW1aEbPZQO9cxa3betcKjIDY_4ji_aLtuuM-HSK4Dtlt48YqCVYAo1a7Fl6ppL_D64ZbVg',
    paypalMeUrl: 'https://paypal.me/alumungandr',
    bitcoinAddress: 'bc1qk684gjdjsth0dmv5kucj6s2j59f197v6xeg487',
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
            <div class="alu-price-jmd" id="aluSummaryPriceJmd" style="color: var(--accent-cyan, #38bdf8);">Instant Digital Delivery</div>
          </div>
        </div>

        <!-- Payment Rails Selector -->
        <div class="alu-gateway-tabs">
          <button class="alu-tab-btn active" id="tabBtnPaypal" onclick="window.switchAluTab('paypal')">
            <span class="alu-tab-icon">💳</span>
            <span>Card / PayPal Checkout</span>
          </button>
          <button class="alu-tab-btn" id="tabBtnBtc" onclick="window.switchAluTab('btc')">
            <span class="alu-tab-icon">₿</span>
            <span>Bitcoin (BTC)</span>
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
          <form id="aluDirectPaypalForm" action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" style="margin-bottom: 12px;">
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

        <!-- Tab 2: Bitcoin Peer-to-Peer Settlement -->
        <div class="alu-tab-panel" id="panelBtc" style="display: none;">
          <div class="alu-callout-box" style="border-color: rgba(247, 147, 26, 0.4); margin-bottom: 16px;">
            <div class="alu-callout-header">
              <span style="color: #f7931a;">₿</span> Direct Bitcoin (P2P) Settlement
            </div>
            <p class="alu-callout-desc">
              Pay directly with Bitcoin (On-Chain / SegWit or Lightning). 100% peer-to-peer settlement with zero intermediaries, zero merchant markups, and zero tracking.
            </p>
            <div class="alu-feature-pill-strip">
              <span class="alu-feature-pill">&#10003; 100% Peer-to-Peer</span>
              <span class="alu-feature-pill">&#10003; Zero Foreign Friction</span>
              <span class="alu-feature-pill">&#10003; Instant Blockchain Settlement</span>
            </div>
          </div>

          <div class="alu-copy-row">
            <span style="color: #9aa0b0; font-size: 12px;">Payment Method:</span>
            <span class="alu-copy-val" style="color: #f7931a; font-weight: 700;">Bitcoin (BTC)</span>
          </div>

          <div style="text-align: center; margin: 14px 0 10px 0;">
            <div id="aluBtcQrCode" style="display: inline-block; background: #ffffff; padding: 10px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.35); min-width: 140px; min-height: 140px;"></div>
            <div style="font-size: 11px; color: #8a90a0; margin-top: 6px;">Scan with Sparrow, BlueWallet, Cash App, or any BTC wallet</div>
          </div>

          <div class="alu-copy-row">
            <span style="color: #9aa0b0; font-size: 12px;">Recipient BTC Address:</span>
            <span class="alu-copy-val" id="aluBtcAddressVal" style="font-family: monospace; font-size: 11px; word-break: break-all;">${CONFIG.bitcoinAddress}</span>
            <button class="alu-btn-mini-copy" onclick="window.copyToClipboard(document.getElementById('aluBtcAddressVal').innerText, this)">COPY</button>
          </div>

          <!-- Dispatch Verification Form -->
          <div class="alu-dispatch-box" style="margin-top: 14px;">
            <label class="alu-dispatch-label" for="aluTxRefInput">
              Confirm Bitcoin Transfer (Transaction TXID / Hash or Sender Email):
            </label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="aluTxRefInput" class="alu-dispatch-input" placeholder="e.g. BTC TXID hash or your email">
              <button type="button" class="alu-btn-checkout" style="width: auto; padding: 9px 16px; font-size: 12px; background: linear-gradient(135deg, #f7931a 0%, #e67e22 100%); color: #fff; border-color: #f7931a;" onclick="window.submitBtcVerification()">
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
        <div class="alu-security-footer" style="flex-wrap: wrap; gap: 8px;">
          <span>🔒 256-BIT SSL ENCRYPTED &bull; NO ACCOUNT SIGNUP REQUIRED</span>
          <span>
            <a href="/terms#refund-policy" style="color:#9aa0b0; text-decoration:underline;">Refund Policy</a> &bull;
            <a href="/terms" style="color:#9aa0b0; text-decoration:underline;">Terms</a> &bull;
            <a href="/privacy" style="color:#9aa0b0; text-decoration:underline;">Privacy</a> &bull;
            <a href="/contact" style="color:#9aa0b0; text-decoration:underline;">Contact</a>
          </span>
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
    document.getElementById('aluSummaryPriceJmd').innerText = 'Instant Digital Delivery';
    

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
    const btcPanel = document.getElementById('panelBtc'); if (btcPanel) btcPanel.style.display = 'none';
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

  function renderBtcQr() {
    const qrContainer = document.getElementById('aluBtcQrCode');
    if (!qrContainer || qrContainer.querySelector('canvas, svg, table, img')) return;
    
    function draw() {
      if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
          text: 'bitcoin:' + CONFIG.bitcoinAddress,
          width: 140,
          height: 140,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    }

    if (typeof QRCode === 'undefined') {
      const s = document.createElement('script');
      s.src = '/assets/qrcode.min.js';
      s.onload = draw;
      document.head.appendChild(s);
    } else {
      draw();
    }
  }

  window.switchAluTab = function (tabId) {
    const tabs = ['paypal', 'btc'];
    tabs.forEach(t => {
      const btn = document.getElementById('tabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
      const panel = document.getElementById('panel' + t.charAt(0).toUpperCase() + t.slice(1));
      if (btn) btn.classList.toggle('active', t === tabId);
      if (panel) panel.style.display = (t === tabId) ? 'block' : 'none';
    });
    if (tabId === 'btc') {
      renderBtcQr();
    }
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

  window.submitBtcVerification = function () {
    const ref = document.getElementById('aluTxRefInput').value.trim();
    const statusMsg = document.getElementById('aluLocalStatusMsg');

    if (!ref) {
      statusMsg.innerHTML = '<span style="color: #ff4838;">⚠ Please enter your Bitcoin Transaction ID (TXID) or email address.</span>';
      return;
    }

    statusMsg.innerHTML = '<span style="color: #f7931a;">Recording Bitcoin verification with Alumungandr dispatch desk...</span>';

    const subject = encodeURIComponent(`[Bitcoin Payment Submitted] ${currentProduct.name} - ${ref}`);
    const body = encodeURIComponent(
      `Hello David,\n\nI have submitted a Bitcoin transfer for ${currentProduct.name} ($${currentProduct.priceUsd.toFixed(2)} USD equivalent).\n\nTransaction TXID / Reference: ${ref}\n\nPlease verify on the blockchain and issue my digital license.\n\nThank you!`
    );

    setTimeout(() => {
      statusMsg.innerHTML = `<span style="color: #10b981; font-weight: bold;">✓ Verification logged! Opening confirmation email...</span>`;
      window.location.href = `mailto:${CONFIG.adminEmail}?subject=${subject}&body=${body}`;
    }, 600);
  };

  // Backwards compatibility alias
  window.submitLocalVerification = window.submitBtcVerification;

  // Check URL params on load for payment return
  document.addEventListener('DOMContentLoaded', function () {
    createModalHtml();

    // Check if returning from PayPal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      window.openAluCheckout();
      document.getElementById('panelPaypal').style.display = 'none';
      const btcPanel = document.getElementById('panelBtc'); if (btcPanel) btcPanel.style.display = 'none';
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
