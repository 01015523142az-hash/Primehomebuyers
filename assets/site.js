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

/* ------------------------------------------- localized service area map */

var STATE_DATA = {
  wy: {
    name: 'Wyoming',
    badge: 'Corporate Headquarters',
    metros: 'Casper, Cheyenne, Laramie, Gillette, Sheridan, Rock Springs',
    avgDays: '7–10 Business Days',
    titlePartner: 'First American Title & Escrow (Casper)',
    investorRep: 'Local Principal Acquisition Desk (Casper HQ)',
    coverageNote: 'Full statewide acquisition for single-family, rural, probate & ranch parcels.'
  },
  co: {
    name: 'Colorado',
    badge: 'Front Range Hub',
    metros: 'Denver Metro, Colorado Springs, Fort Collins, Pueblo, Aurora, Greeley',
    avgDays: '7–12 Business Days',
    titlePartner: 'Fidelity National Title / Heritage Title (Denver)',
    investorRep: 'Rocky Mountain Regional Team',
    coverageNote: 'Active daily purchases across Denver metro, El Paso County, and Larimer County.'
  },
  tx: {
    name: 'Texas',
    badge: 'Major Acquisition Region',
    metros: 'Dallas-Fort Worth, Houston Metro, Austin, San Antonio, El Paso',
    avgDays: '7–14 Business Days',
    titlePartner: 'Stewart Title Guaranty / Independence Title (Austin/Dallas)',
    investorRep: 'Lone Star Acquisition Group',
    coverageNote: 'Direct cash purchases for single-family rentals, inherited homes, and rapid closings.'
  },
  fl: {
    name: 'Florida',
    badge: 'Sunshine State Hub',
    metros: 'Tampa Bay, Orlando, Jacksonville, Palm Beach, Fort Myers, Pensacola',
    avgDays: '8–14 Business Days',
    titlePartner: 'Old Republic National Title / Florida Escrow',
    investorRep: 'Gulf & Atlantic Acquisition Desk',
    coverageNote: 'Specialized in storm-damaged properties, rental tenant transitions, and inherited estates.'
  }
};

function initServiceAreaMap() {
  var tabButtons = document.querySelectorAll('.state-tab-btn');
  var mapPins = document.querySelectorAll('.map-pin');
  var titleEl = document.getElementById('stateInfoTitle');
  var badgeEl = document.getElementById('stateInfoBadge');
  var metrosEl = document.getElementById('stateInfoMetros');
  var speedEl = document.getElementById('stateInfoSpeed');
  var titlePartnerEl = document.getElementById('stateInfoTitlePartner');
  var noteEl = document.getElementById('stateInfoNote');

  function selectState(stateKey) {
    var data = STATE_DATA[stateKey];
    if (!data) return;

    tabButtons.forEach(function (btn) {
      if (btn.getAttribute('data-state') === stateKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    mapPins.forEach(function (pin) {
      if (pin.getAttribute('data-state') === stateKey) {
        pin.setAttribute('fill', '#4ade80');
        pin.setAttribute('r', '8');
      } else {
        pin.setAttribute('fill', '#10b981');
        pin.setAttribute('r', '6');
      }
    });

    if (titleEl) titleEl.textContent = data.name;
    if (badgeEl) badgeEl.textContent = data.badge;
    if (metrosEl) metrosEl.textContent = data.metros;
    if (speedEl) speedEl.textContent = data.avgDays;
    if (titlePartnerEl) titlePartnerEl.textContent = data.titlePartner;
    if (noteEl) noteEl.textContent = data.coverageNote;
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var stateKey = btn.getAttribute('data-state');
      selectState(stateKey);
    });
  });

  mapPins.forEach(function (pin) {
    pin.addEventListener('click', function () {
      var stateKey = pin.getAttribute('data-state');
      selectState(stateKey);
    });
  });
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

