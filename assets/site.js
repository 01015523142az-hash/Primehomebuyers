/* PrimeHome Buyers - primehomebuyers.casa
 *
 * Handles the forms on this site: the offer request (opt-in) and the
 * SMS opt-out, plus interactive UX features like the Net Proceeds Calculator,
 * FAQ accordion, and phone formatting.
 *
 * WHY THE DISCLOSURE TEXT IS READ OUT OF THE DOM:
 * The consent record has to store the exact wording the person saw when they
 * ticked the box. If that wording lived in a constant here as well as in the
 * HTML, the two would drift the first time someone edits the copy, and the
 * stored "proof of consent" would be a record of words nobody was ever shown.
 * Reading it from the element makes drift impossible.
 */

var API_BASE = 'https://kqfoniinytvuddxiwvkc.supabase.co/functions/v1';

/* ---------------------------------------------------------------- helpers */

function setMsg(el, kind, text) {
  if (!el) return;
  el.className = 'form-msg ' + kind;
  el.textContent = text;
  el.hidden = false;
}

function clearMsg(el) {
  if (el) el.hidden = true;
}

/* Ten digits is the whole test. Anything stricter rejects real people who
   type spaces, dots or a leading 1, and the server normalises anyway. */
function looksLikeUsPhone(raw) {
  var digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.charAt(0) === '1') digits = digits.slice(1);
  return digits.length === 10;
}

function formatPhoneDigits(digits) {
  if (!digits) return '';
  var clean = digits.replace(/\D/g, '');
  if (clean.length > 10) clean = clean.substring(0, 10);
  if (clean.length < 4) return clean;
  if (clean.length < 7) return '(' + clean.substring(0, 3) + ') ' + clean.substring(3);
  return '(' + clean.substring(0, 3) + ') ' + clean.substring(3, 6) + '-' + clean.substring(6);
}

function setupPhoneAutoFormat(inputEl) {
  if (!inputEl) return;
  inputEl.addEventListener('input', function (e) {
    var raw = inputEl.value;
    var digits = raw.replace(/\D/g, '');
    if (digits.length <= 10) {
      inputEl.value = formatPhoneDigits(digits);
    }
  });
}

function postJson(path, body) {
  return fetch(API_BASE + '/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(function (res) {
    return res.json().catch(function () { return {}; }).then(function (data) {
      return { ok: res.ok, status: res.status, data: data };
    });
  });
}

/* ------------------------------------------------------- offer request */

function initOfferForm() {
  var form = document.getElementById('offerForm');
  if (!form) return;

  var msg = document.getElementById('offerMsg');
  var btn = document.getElementById('offerSubmit');
  var done = document.getElementById('offerDone');
  var phoneInput = document.getElementById('phone');

  setupPhoneAutoFormat(phoneInput);

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    clearMsg(msg);

    var f = form.elements;

    // Honeypot. A real person never fills a field they cannot see; bots fill
    // every input they find. Silently succeed rather than saying why.
    if (f.company && f.company.value) {
      form.hidden = true;
      if (done) done.hidden = false;
      return;
    }

    if (!f.first_name.value.trim()) {
      setMsg(msg, 'err', 'Please tell us your first name.');
      f.first_name.focus();
      return;
    }
    if (!looksLikeUsPhone(f.phone.value)) {
      setMsg(msg, 'err', 'Please enter a 10-digit US phone number.');
      f.phone.focus();
      return;
    }
    if (!f.property_address.value.trim()) {
      setMsg(msg, 'err', 'Please tell us which property this is about.');
      f.property_address.focus();
      return;
    }

    var consentEl = document.getElementById('smsConsent');
    var consentTextEl = document.getElementById('consentText');

    btn.disabled = true;
    btn.textContent = 'Sending...';

    postJson('site-lead-submit', {
      first_name: f.first_name.value.trim(),
      last_name: f.last_name.value.trim(),
      phone: f.phone.value.trim(),
      email: f.email.value.trim(),
      property_address: f.property_address.value.trim(),
      notes: f.notes.value.trim(),
      sms_consent: !!(consentEl && consentEl.checked),
      // Verbatim, straight from the element the person read.
      consent_text: consentTextEl ? consentTextEl.innerText.replace(/\s+/g, ' ').trim() : '',
      source_url: window.location.href
    }).then(function (r) {
      if (r.ok && r.data && r.data.ok) {
        form.hidden = true;
        if (done) {
          done.hidden = false;
          done.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      setMsg(msg, 'err', (r.data && r.data.error)
        || 'Something went wrong sending that. Please call us instead.');
    }).catch(function () {
      setMsg(msg, 'err', 'We could not reach our server. Please check your connection or call us.');
    }).then(function () {
      btn.disabled = false;
      btn.textContent = 'Request my cash offer';
    });
  });
}

/* ------------------------------------------------------------- opt-out */

function initOptOutForm() {
  var form = document.getElementById('optOutForm');
  if (!form) return;

  var msg = document.getElementById('optOutMsg');
  var btn = document.getElementById('optOutSubmit');
  var done = document.getElementById('optOutDone');
  var phoneInput = document.getElementById('optPhone');

  setupPhoneAutoFormat(phoneInput);

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    clearMsg(msg);

    var phone = form.elements.phone.value;
    if (!looksLikeUsPhone(phone)) {
      setMsg(msg, 'err', 'Please enter the 10-digit US phone number you want removed.');
      form.elements.phone.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Removing...';

    postJson('site-opt-out', {
      phone: String(phone).trim(),
      reason: form.elements.reason ? form.elements.reason.value.trim() : '',
      source_url: window.location.href
    }).then(function (r) {
      // An opt-out that fails silently is the worst outcome here, so this
      // only reports success when the server actually confirms the record.
      if (r.ok && r.data && r.data.ok) {
        form.hidden = true;
        if (done) done.hidden = false;
        return;
      }
      setMsg(msg, 'err', (r.data && r.data.error)
        || 'We could not process that. Please text STOP to 307-441-5766 instead - that always works.');
    }).catch(function () {
      setMsg(msg, 'err', 'We could not reach our server. Please text STOP to 307-441-5766 instead - that always works.');
    }).then(function () {
      btn.disabled = false;
      btn.textContent = 'Remove my number';
    });
  });
}

/* ------------------------------------------- net proceeds calculator */

function formatMoney(num) {
  return '$' + Math.round(num).toLocaleString('en-US');
}

function initCalculator() {
  var slider = document.getElementById('calcSlider');
  var valDisplay = document.getElementById('calcValDisplay');
  if (!slider || !valDisplay) return;

  var commDisplay = document.getElementById('calcTraditionalCommission');
  var closingDisplay = document.getElementById('calcTraditionalClosing');
  var repairDisplay = document.getElementById('calcTraditionalRepairs');
  var holdDisplay = document.getElementById('calcTraditionalHolding');
  var netTraditionalDisplay = document.getElementById('calcTraditionalNet');
  var netPrimeHomeDisplay = document.getElementById('calcPrimeHomeNet');

  function update() {
    var val = parseFloat(slider.value) || 350000;
    valDisplay.textContent = formatMoney(val);

    // Traditional Costs:
    var comm = val * 0.06; // 6% Realtor Commission
    var closing = val * 0.025; // ~2.5% Seller Closing Fees
    var repairs = val * 0.035; // ~3.5% Repairs, deep clean, staging
    var holding = 4200; // ~3 months mortgage, utilities, taxes
    var totalDeductions = comm + closing + repairs + holding;
    var netTraditional = Math.max(0, val - totalDeductions);

    // PrimeHome Direct cash offer comparison:
    // Direct cash offers are net in pocket with $0 fees, $0 closing costs, $0 repairs
    // Usually around 85-90% of retail ARV without any deduction
    var primeHomeOffer = Math.round(val * 0.88);

    if (commDisplay) commDisplay.textContent = '-' + formatMoney(comm);
    if (closingDisplay) closingDisplay.textContent = '-' + formatMoney(closing);
    if (repairDisplay) repairDisplay.textContent = '-' + formatMoney(repairs);
    if (holdDisplay) holdDisplay.textContent = '-' + formatMoney(holding);
    if (netTraditionalDisplay) netTraditionalDisplay.textContent = formatMoney(netTraditional);
    if (netPrimeHomeDisplay) netPrimeHomeDisplay.textContent = formatMoney(primeHomeOffer);
  }

  slider.addEventListener('input', update);
  update();
}

/* ---------------------------------------------------- faq accordion */

function initFaq() {
  var faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      if (!item) return;
      var isActive = item.classList.contains('active');
      
      // Close other items
      document.querySelectorAll('.faq-item').forEach(function (other) {
        if (other !== item) other.classList.remove('active');
      });

      if (isActive) {
        item.classList.remove('active');
      } else {
        item.classList.add('active');
      }
    });
  });
}

/* --------------------------------------------------------------- boot */

document.addEventListener('DOMContentLoaded', function () {
  initOfferForm();
  initOptOutForm();
  initCalculator();
  initFaq();

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});
