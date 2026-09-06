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
        || 'We could not process that. Please reply STOP to any text you have had from us - that always works.');
    }).catch(function () {
      setMsg(msg, 'err', 'We could not reach our server. Please reply STOP to any text you have had from us - that always works.');
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

/* ------------------------------------------- localized service area map */

/* ------------------------------------------------- nationwide coverage */
/*
 * Every US state and DC. This replaced a four-state list in which each state
 * carried a named title company and a named internal team -- "Stewart Title
 * Guaranty / Independence Title (Austin/Dallas)", "Lone Star Acquisition
 * Group" and so on. None of that was verifiable, and repeating the pattern
 * fifty times would have meant publishing fifty invented business
 * relationships on a page that 10DLC vetting reads.
 *
 * So the per-state facts are gone and what remains is true everywhere: we
 * buy statewide, we close through a licensed title company local to the
 * property, and the office is in Casper. Wyoming keeps the HQ badge because
 * that one is real -- it is the registered address.
 */
var HQ_STATE = 'WY';

var US_REGIONS = [
  { region: 'West', states: [
    ['AK','Alaska'], ['AZ','Arizona'], ['CA','California'], ['CO','Colorado'],
    ['HI','Hawaii'], ['ID','Idaho'], ['MT','Montana'], ['NV','Nevada'],
    ['NM','New Mexico'], ['OR','Oregon'], ['UT','Utah'], ['WA','Washington'],
    ['WY','Wyoming']
  ]},
  { region: 'Midwest', states: [
    ['IL','Illinois'], ['IN','Indiana'], ['IA','Iowa'], ['KS','Kansas'],
    ['MI','Michigan'], ['MN','Minnesota'], ['MO','Missouri'], ['NE','Nebraska'],
    ['ND','North Dakota'], ['OH','Ohio'], ['SD','South Dakota'], ['WI','Wisconsin']
  ]},
  { region: 'South', states: [
    ['AL','Alabama'], ['AR','Arkansas'], ['DE','Delaware'],
    ['DC','District of Columbia'], ['FL','Florida'], ['GA','Georgia'],
    ['KY','Kentucky'], ['LA','Louisiana'], ['MD','Maryland'],
    ['MS','Mississippi'], ['NC','North Carolina'], ['OK','Oklahoma'],
    ['SC','South Carolina'], ['TN','Tennessee'], ['TX','Texas'],
    ['VA','Virginia'], ['WV','West Virginia']
  ]},
  { region: 'Northeast', states: [
    ['CT','Connecticut'], ['ME','Maine'], ['MA','Massachusetts'],
    ['NH','New Hampshire'], ['NJ','New Jersey'], ['NY','New York'],
    ['PA','Pennsylvania'], ['RI','Rhode Island'], ['VT','Vermont']
  ]}
];

function initServiceAreaMap() {
  var grid = document.getElementById('stateRegionGrid');
  var titleEl = document.getElementById('stateInfoTitle');
  var badgeEl = document.getElementById('stateInfoBadge');
  var coverageEl = document.getElementById('stateInfoCoverage');
  var titlePartnerEl = document.getElementById('stateInfoTitlePartner');
  var noteEl = document.getElementById('stateInfoNote');
  if (!grid) return;

  var byCode = {};

  function selectState(code) {
    var name = byCode[code];
    if (!name) return;

    grid.querySelectorAll('.state-chip').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-state') === code);
      b.setAttribute('aria-pressed', b.getAttribute('data-state') === code ? 'true' : 'false');
    });

    if (titleEl) titleEl.textContent = name;
    if (badgeEl) badgeEl.hidden = (code !== HQ_STATE);
    if (coverageEl) coverageEl.textContent = 'Statewide';
    if (titlePartnerEl) titlePartnerEl.textContent = 'A licensed title company local to the property';
    if (noteEl) {
      noteEl.textContent = 'We buy single-family homes and small residential property throughout '
        + name + ', including inherited, tenant-occupied and deferred-maintenance parcels.';
    }
  }

  // Built in JS rather than written out as markup: fifty-one chips of static
  // HTML is a lot of page weight for something with one shape.
  US_REGIONS.forEach(function (group) {
    var wrap = document.createElement('div');
    wrap.className = 'state-region-group';

    var h = document.createElement('h4');
    h.className = 'state-region-title';
    h.textContent = group.region;
    wrap.appendChild(h);

    var row = document.createElement('div');
    row.className = 'state-chip-row';

    group.states.forEach(function (pair) {
      var code = pair[0], name = pair[1];
      byCode[code] = name;

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'state-chip';
      b.setAttribute('data-state', code);
      b.setAttribute('aria-pressed', 'false');
      b.title = name;
      b.textContent = code === HQ_STATE ? name + ' (HQ)' : name;
      b.addEventListener('click', function () { selectState(code); });
      row.appendChild(b);
    });

    wrap.appendChild(row);
    grid.appendChild(wrap);
  });

  selectState(HQ_STATE);
}

/* ---------------------------------------------------- exit intent popup */

function initExitIntentPopup() {
  var backdrop = document.getElementById('exitModalBackdrop');
  var closeBtn = document.getElementById('exitModalClose');
  var form = document.getElementById('guideForm');
  var emailInput = document.getElementById('guideEmail');
  var successBox = document.getElementById('guideSuccessBox');
  var errEl = document.getElementById('guideMsg');

  if (!backdrop) return;

  var STORAGE_KEY = 'phb_guide_dismissed_v1';
  var hasShown = false;

  function showPopup() {
    if (hasShown) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    hasShown = true;
    backdrop.classList.add('active');
    backdrop.setAttribute('aria-hidden', 'false');
  }

  function closePopup() {
    backdrop.classList.remove('active');
    backdrop.setAttribute('aria-hidden', 'true');
    sessionStorage.setItem(STORAGE_KEY, '1');
  }

  // Trigger 1: Mouse movement leaving viewport towards browser chrome (Desktop)
  document.addEventListener('mouseleave', function (e) {
    if (e.clientY <= 15 && !hasShown) {
      showPopup();
    }
  });

  // Trigger 2: Fallback timeout after user has spent 35s on site without requesting offer
  setTimeout(function () {
    if (!hasShown && !sessionStorage.getItem(STORAGE_KEY)) {
      showPopup();
    }
  }, 35000);

  if (closeBtn) {
    closeBtn.addEventListener('click', closePopup);
  }

  backdrop.addEventListener('click', function (e) {
    if (e.target === backdrop) {
      closePopup();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && backdrop.classList.contains('active')) {
      closePopup();
    }
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errEl) {
        errEl.hidden = true;
        errEl.textContent = '';
      }

      var emailVal = (emailInput && emailInput.value) ? emailInput.value.trim() : '';
      if (!emailVal || emailVal.indexOf('@') === -1 || emailVal.indexOf('.') === -1) {
        if (errEl) {
          errEl.textContent = 'Please enter a valid email address to receive the guide.';
          errEl.hidden = false;
        }
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      // This used to be a setTimeout that showed the success panel and threw
      // the address away -- the comment on it read "simulate instantaneous
      // guide dispatch". Every person who filled this in was told to check
      // their inbox and got nothing, and the lead was lost. It now actually
      // posts, and only claims success when the server confirms the record.
      postJson('site-lead-submit', {
        kind: 'guide_request',
        email: emailVal,
        source_url: window.location.href
      }).then(function (r) {
        if (r.ok && r.data && r.data.ok) {
          form.hidden = true;
          if (successBox) successBox.hidden = false;
          sessionStorage.setItem(STORAGE_KEY, 'requested');
          return;
        }
        if (errEl) {
          errEl.textContent = (r.data && r.data.error)
            || 'We could not save that. Please email support@primehomebuyers.casa instead.';
          errEl.hidden = false;
        }
      }).catch(function () {
        if (errEl) {
          errEl.textContent = 'We could not reach our server. Please email support@primehomebuyers.casa instead.';
          errEl.hidden = false;
        }
      }).then(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      });
    });
  }
}

/* --------------------------------------------------------------- boot */

document.addEventListener('DOMContentLoaded', function () {
  initOfferForm();
  initOptOutForm();
  initCalculator();
  initFaq();
  initServiceAreaMap();
  initExitIntentPopup();

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});

