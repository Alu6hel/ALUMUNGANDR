// Cloudflare Worker API: /api/subscriptions
// Comprehensive Subscription Audit, Tax-Deductible Schedule Engine & Dark Pattern Kill-Switch Backend
// Powered by Alumungandr Edge Gateway & Master Charter Article VII § 7.01

const KILL_SWITCH_DATABASE = [
  {
    id: 'adobe',
    serviceName: 'Adobe Creative Cloud',
    hazardBadge: 'HAZARD: $200+ EARLY TERMINATION FEE',
    cancelUrl: 'https://account.adobe.com/plans',
    darkPattern: 'Adobe locks annual contracts into a hidden 50% remaining contract penalty clause ($100–$300 fee) if canceled after 14 days.',
    bypassInstructions: [
      'Navigate directly to account.adobe.com/plans and select Manage Plan.',
      'Click Change Plan and switch to a cheaper plan (e.g. Photography 20GB or InCopy for ~$9.99/mo).',
      'Confirm the plan change. Switching plans legally triggers a brand-new 14-day statutory cooling-off window.',
      'Wait 15 minutes, return to the plan page, and click Cancel Plan. Because you are within the 14-day window of the new plan, the entire early termination fee is legally waived with a full pro-rated refund!'
    ],
    legalLetter: `To: Adobe Systems Billing & Compliance Desk (support@adobe.com)\nSubject: FORMAL NOTICE: Cancellation of Creative Cloud Subscription & Fee Waiver Demand\n\nTo Whom It May Concern,\n\nPlease immediately terminate my Adobe Creative Cloud subscription associated with account email [ACCOUNT_EMAIL].\n\nPursuant to 16 CFR Part 425 (FTC Negative Option Rule & Click-to-Cancel Enforcement) and California Automatic Renewal Law (Cal. Bus. & Prof. Code § 17600 et seq.), commercial subscribers must be permitted a simple, zero-friction cancellation mechanism equal to enrollment.\n\nI expressly refuse any purported "Early Termination Fee" or contract acceleration penalties, as statutory cooling-off protections and unconscionable liquidated damage clauses are unenforceable under state and international consumer statutes. Confirm termination and zero balance within 24 hours.\n\nSincerely,\n[SUBSCRIBER_NAME]`
  },
  {
    id: 'canva',
    serviceName: 'Canva Pro & Teams',
    hazardBadge: 'HAZARD: TEAM SEAT RETENTION TRAP',
    cancelUrl: 'https://www.canva.com/settings/billing-and-teams',
    darkPattern: 'Pushes "Pause Membership for 3 Months" as deceptive primary CTA; buries full cancellation under 4 screens of guilt-tripping asset warnings.',
    bypassInstructions: [
      'Go directly to canva.com/settings/billing-and-teams.',
      'Select the Subscriptions tab and click the three dots (...) next to your plan.',
      'Click Cancel Subscription. When presented with the yellow "Pause for 3 Months" button, click the low-contrast grey Continue Cancellation link.',
      'CRITICAL: If you ever added team members or sent email invites, ensure you revoke all pending invites, or Canva will continue charging monthly team seat fees!'
    ],
    legalLetter: `To: Canva Pty Ltd Support\nSubject: Cancellation of Canva Pro Subscription - Account [ACCOUNT_EMAIL]\n\nPlease immediately cancel my Canva Pro/Teams subscription and revoke all recurring billing authorizations on my payment method. I do not consent to pausing or maintaining billable team seats. Confirm termination immediately.`
  },
  {
    id: 'zoom',
    serviceName: 'Zoom Workplace Pro',
    hazardBadge: 'HAZARD: ADD-ON LOCK-IN LOOP',
    cancelUrl: 'https://zoom.us/billing/plan',
    darkPattern: 'Auto-renews annual plans with silent price creep; prevents primary plan cancellation if any cloud recording or phone add-ons remain active.',
    bypassInstructions: [
      'Direct URL: zoom.us/billing/plan.',
      'Check your add-ons list first: if you have Cloud Storage or Large Meeting add-ons, you MUST cancel each add-on individually before Zoom enables the "Cancel Plan" button on your main account.',
      'Click Cancel Subscription on the base plan and complete the 2-step verification survey.'
    ],
    legalLetter: `To: Zoom Video Communications Billing\nSubject: Cancellation Demand - Zoom Account [ACCOUNT_EMAIL]\n\nThis constitutes formal written demand to terminate my Zoom Pro plan and all associated cloud recording add-on licenses effective immediately. Any subsequent auto-renewal charges will be disputed as unauthorized cross-border transactions.`
  },
  {
    id: 'aws',
    serviceName: 'AWS Cloud Infrastructure',
    hazardBadge: 'HAZARD: GHOST RESOURCES AFTER CLOSURE',
    cancelUrl: 'https://console.aws.amazon.com/billing/home#/bills',
    darkPattern: 'Closing an AWS account does NOT delete active Elastic IPs ($3.60/mo each), unattached EBS storage volumes ($0.08/GB), or multi-AZ NAT Gateways ($32.40/mo each).',
    bypassInstructions: [
      'Do NOT simply click "Close Account" first. Follow the AWS Kill-Switch Sweep:',
      '1. In EC2 Console: Select Elastic IPs -> Disassociate and Release all unallocated IPs.',
      '2. In EC2 Console: Select Volumes -> Delete all status "available" (unattached) EBS disks.',
      '3. In VPC Console: Select NAT Gateways -> Delete active gateways.',
      '4. In Route 53: Delete test hosted zones ($0.50/mo each).',
      '5. Finally, go to Billing & Cost Management -> Account Settings -> Close Account.'
    ],
    legalLetter: `To: Amazon Web Services Support\nSubject: Full Teardown & Closure Confirmation - Account ID [ACCOUNT_EMAIL]\n\nPlease verify that all compute, storage, and networking resources under this AWS account have been terminated and that zero ongoing recurring charges will accrue following account closure.`
  },
  {
    id: 'domains',
    serviceName: 'GoDaddy / Domain Registrars',
    hazardBadge: 'HAZARD: PRE-TICKED 30-DAY AUTO RENEW',
    cancelUrl: 'https://account.godaddy.com/products',
    darkPattern: 'Charges renewal cards 30 to 45 days in advance of expiration dates; pre-bundles privacy protection and Microsoft 365 mailboxes.',
    bypassInstructions: [
      'Direct URL: account.godaddy.com/products.',
      'Navigate to Renewal & Billing.',
      'Select all expired or test domains, click Cancel Renewal, and then select Delete Product to release the domain immediately.',
      'Navigate to Payment Methods and delete your backup credit card to prevent automatic fallback re-billing.'
    ],
    legalLetter: `To: Domain Registrar Billing Desk\nSubject: Revocation of Auto-Renewal Authorization\n\nI hereby revoke all recurring billing and automated domain renewal authorizations for all domains registered under [ACCOUNT_EMAIL]. Do not renew any expiring domains without prior written authorization.`
  },
  {
    id: 'googleworkspace',
    serviceName: 'Google Workspace',
    hazardBadge: 'HAZARD: ZOMBIE SEAT CHARGES',
    cancelUrl: 'https://admin.google.com/ac/billing/subscriptions',
    darkPattern: 'Deleting an employee user does NOT delete their paid seat license! Google continues billing for the empty license slot indefinitely.',
    bypassInstructions: [
      'Go to admin.google.com/ac/billing/subscriptions.',
      'Click your Google Workspace edition.',
      'Review "Licenses assigned vs purchased". If you have unassigned seats, click Reduce License Count down to your exact number of active members.',
      'To cancel entirely, click More -> Cancel Subscription.'
    ],
    legalLetter: `To: Google LLC Admin Billing\nSubject: License Seat Reduction & Subscription Termination\n\nPlease de-provision all unassigned Google Workspace licenses under domain [ACCOUNT_EMAIL] and adjust future billing invoices accordingly.`
  },
  {
    id: 'slack',
    serviceName: 'Slack Pro',
    hazardBadge: 'HAZARD: MULTI-SEAT OVERHEAD',
    cancelUrl: 'https://slack.com/admin/billing',
    darkPattern: 'Departed team members remain on paid invoices until explicitly converted to deactivated accounts and plan seats reduced.',
    bypassInstructions: [
      'Direct URL: slack.com/admin/billing.',
      'Review the Active Members roster -> Deactivate former contractors or inactive members.',
      'Click Change Plan -> Select Downgrade to Free.',
      'Slack will retain your message history with zero ongoing monthly credit card charges.'
    ],
    legalLetter: `To: Slack Technologies / Salesforce Billing\nSubject: Downgrade Authorization - Slack Workspace [ACCOUNT_EMAIL]\n\nConfirm immediate downgrade of our Slack workspace to the standard free tier and termination of recurring credit card authorizations.`
  },
  {
    id: 'linkedin',
    serviceName: 'LinkedIn Premium',
    hazardBadge: 'HAZARD: 5-SCREEN RETENTION GUILT TRIP',
    cancelUrl: 'https://www.linkedin.com/premium/cancel',
    darkPattern: '5-screen retention labyrinth; styles "Keep My Plan" in bright blue while "Continue Cancellation" is styled in faint, low-contrast grey.',
    bypassInstructions: [
      'Direct link linkedin.com/premium/cancel bypasses the profile settings maze.',
      'Screen 1: Select "Too expensive".',
      'Screen 2: Reject the temporary discount offer if you want a complete cancel, and click the bottom low-contrast link.',
      'Confirm cancellation on the final screen and verify email confirmation.'
    ],
    legalLetter: `To: LinkedIn Corporation Billing\nSubject: Notice of Non-Renewal - LinkedIn Premium [ACCOUNT_EMAIL]\n\nConfirm immediate termination of LinkedIn Premium subscription with zero further auto-renewal charges to my credit card.`
  },
  {
    id: 'gym',
    serviceName: 'Gym & Physical Fitness Clubs',
    hazardBadge: 'HAZARD: IN-PERSON CERTIFIED MAIL TRAP',
    cancelUrl: '#',
    darkPattern: 'Contracts demand physical manager appointments or certified registered mail with restrictive 30-day advance notice windows.',
    bypassInstructions: [
      'Email the statutory contract rescission letter below directly to the gym general manager, corporate member services, and billing partner.',
      'Under modern consumer electronic transaction acts (E-SIGN Act / Uniform Electronic Transactions Act), written electronic notice satisfies statutory delivery requirements.',
      'If the gym continues billing, file an immediate chargeback with your bank accompanied by this letter as proof of cancellation.'
    ],
    legalLetter: `To: Member Services & General Management\nSubject: FORMAL NOTICE OF MEMBERSHIP CANCELLATION & REVOCATION OF EFT AUTHORIZATION\n\nMembership ID: [ACCOUNT_EMAIL]\n\nPlease be advised that effective immediately, I am terminating my fitness membership contract. Pursuant to the Electronic Fund Transfer Act (12 CFR § 1005.10(c)) and state consumer protection statutes, I hereby revoke all authorization for recurring EFT or credit card debits.\n\nAny further charges will be treated as unauthorized and disputed directly with my issuing financial institution. Please provide written confirmation of cancellation and zero balance.\n\nSincerely,\n[SUBSCRIBER_NAME]`
  }
];

const FX_RATES = {
  USD: { rate: 1.0, symbol: '$', name: 'US Dollar' },
  JMD: { rate: 156.5, symbol: 'JA$', name: 'Jamaican Dollar' },
  CAD: { rate: 1.36, symbol: 'C$', name: 'Canadian Dollar' },
  EUR: { rate: 0.92, symbol: '€', name: 'Euro' },
  GBP: { rate: 0.79, symbol: '£', name: 'British Pound' },
  AUD: { rate: 1.52, symbol: 'A$', name: 'Australian Dollar' },
  INR: { rate: 83.8, symbol: '₹', name: 'Indian Rupee' },
  BRL: { rate: 5.45, symbol: 'R$', name: 'Brazilian Real' },
  NGN: { rate: 1620.0, symbol: '₦', name: 'Nigerian Naira' },
  MXN: { rate: 19.3, symbol: 'Mex$', name: 'Mexican Peso' },
  PHP: { rate: 56.2, symbol: '₱', name: 'Philippine Peso' }
};

export async function onRequestGet({ request }) {
  const url = new URL(request.url);

  if (url.pathname.endsWith('/runbook') || url.searchParams.get('runbook') === '1' || url.searchParams.get('full') === '1') {
    return new Response(JSON.stringify({
      success: true,
      count: KILL_SWITCH_DATABASE.length,
      database: KILL_SWITCH_DATABASE
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    platform: 'Alumungandr Subscription Reality Check API',
    version: '2026.10',
    statutoryNexus: 'IRC § 162(a) & Master Charter Article VII § 7.01',
    supportedCurrencies: Object.keys(FX_RATES),
    killSwitchEntriesAvailable: KILL_SWITCH_DATABASE.length
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    }
  });
}

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const subs = Array.isArray(body.subscriptions) ? body.subscriptions : (Array.isArray(body.items) ? body.items : []);
    const currency = body.currency || 'USD';
    const fxInfo = FX_RATES[currency] || { rate: parseFloat(body.customFxRate) || 1.0, symbol: '$', name: 'Custom' };
    const bankSpread = typeof body.bankFxSpread !== 'undefined' ? parseFloat(body.bankFxSpread) : (typeof body.bankSpread !== 'undefined' ? parseFloat(body.bankSpread) : 0.035);
    const devaluationRate = parseFloat(body.devaluationRate) || 0.04;
    const taxBracket = parseFloat(body.taxBracket) || 0.25;

    let monthlyGrossUsd = 0;
    let allowableAnnualDeductionUsd = 0;

    const auditedItems = subs.map(item => {
      const price = parseFloat(item.price) || 0;
      const annualPrice = price * 12;
      monthlyGrossUsd += price;

      const bizUse = typeof item.bizUse === 'number' ? item.bizUse : 100;
      const deductionUsd = annualPrice * (bizUse / 100);
      allowableAnnualDeductionUsd += deductionUsd;

      return {
        id: item.id || 'custom',
        name: item.name || 'Unknown Subscription',
        monthlyUsd: Math.round(price * 100) / 100,
        annualUsd: Math.round(annualPrice * 100) / 100,
        irsCategory: item.irsLine || 'Line 18 (Office & Software)',
        statutoryCode: item.irsCode || 'IRC § 162(a)',
        businessUsePercent: bizUse,
        netAnnualDeductionUsd: Math.round(deductionUsd * 100) / 100
      };
    });

    const annualGrossUsd = monthlyGrossUsd * 12;
    const tenYearInflationDrainUsd = annualGrossUsd * ((Math.pow(1 + 0.035, 10) - 1) / 0.035);
    const rMo = 0.08 / 12;
    const sp500OpportunityCostUsd = Math.round(monthlyGrossUsd * ((Math.pow(1 + rMo, 120) - 1) / rMo));

    // FX Exposure
    const monthlyWithSpreadUsd = monthlyGrossUsd * (1 + bankSpread);
    const localMonthlyDrain = monthlyWithSpreadUsd * fxInfo.rate;
    const annualBankFxSpreadLossUsd = monthlyGrossUsd * 12 * bankSpread;

    const annualLocalDrain = localMonthlyDrain * 12;
    const tenYearLocalCompounded = annualLocalDrain * ((Math.pow(1 + devaluationRate, 10) - 1) / devaluationRate);
    const tenYearDevaluationPenaltyLocal = Math.max(0, tenYearLocalCompounded - (annualLocalDrain * 10));

    // Tax Savings
    const estimatedTaxCashBackUsd = allowableAnnualDeductionUsd * taxBracket;

    const auditHash = 'ALU-AUDIT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

    return new Response(JSON.stringify({
      success: true,
      auditHash,
      timestamp: new Date().toISOString(),
      statutoryCompliance: 'Internal Revenue Code § 162(a) & Alumungandr Master Charter Article VII § 7.01',
      summary: {
        monthlyGrossUsd: Math.round(monthlyGrossUsd * 100) / 100,
        annualGrossUsd: Math.round(annualGrossUsd * 100) / 100,
        tenYearInflationDrainUsd: Math.round(tenYearInflationDrainUsd * 100) / 100,
        sp500OpportunityCostUsd,
        fxExposure: {
          currency,
          exchangeRate: fxInfo.rate,
          currencySymbol: fxInfo.symbol,
          localMonthlyDrain: Math.round(localMonthlyDrain * 100) / 100,
          annualBankFxSpreadLossUsd: Math.round(annualBankFxSpreadLossUsd * 100) / 100,
          tenYearDevaluationPenaltyLocal: Math.round(tenYearDevaluationPenaltyLocal * 100) / 100
        },
        taxDeductions: {
          taxBracketPercent: Math.round(taxBracket * 100),
          allowableAnnualDeductionUsd: Math.round(allowableAnnualDeductionUsd * 100) / 100,
          estimatedTaxCashBackUsd: Math.round(estimatedTaxCashBackUsd * 100) / 100
        }
      },
      auditedItems
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
