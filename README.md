# primehomebuyers.casa

Public marketing site for **PrimeHome Buyers**, and the opt-in / opt-out
surface that the Telnyx 10DLC campaign registration points at.

Static HTML. No build step, no framework, no CDN dependency — a 10DLC vetting
vendor fetches these pages with tooling rather than a browser, so everything
that matters is readable in the raw HTML.

```
index.html          Home + offer request form (the opt-in)
privacy.html        Privacy Policy
terms.html          Terms of Service, including the SMS programme terms
sms-opt-out.html    Self-service opt-out (the opt-out)
assets/site.css     One stylesheet for all pages
assets/site.js      Form handling for both forms
CNAME               primehomebuyers.casa
```

---

## Published values

All `[[TOKEN]]` placeholders are filled. To confirm none crept back in:

```bash
grep -rno "\[\[[A-Z_]*\]\]" . --include=*.html
```

| Value | Set to |
|---|---|
| Legal / brand name | PrimeHome Buyers |
| Business address | 5830 E 2nd St, Casper, WY 82609, USA |
| Support email | support@primehomebuyers.casa |
| Phone / SMS | 307-441-5766 |
| Policy date | 6 September 2026 |
| Retention — enquiries, consent, recordings | 12 months |
| Retention — opt-out records | indefinite (see below) |
| Governing law | Wyoming |
| Venue | Natrona County, Wyoming |

**Governing law and venue were inferred** from the Casper business address —
Wyoming, and Casper is the seat of Natrona County. If the entity is organised
in a different state, change §12 of `terms.html`.

`support@primehomebuyers.casa` **must be a real, monitored mailbox before
launch.** It is published as the HELP contact and as the address for privacy
and deletion requests, both of which carry response deadlines. A bouncing
address on a policy page is worse than no address.

### Retention: opt-out records are the exception

Everything is 12 months except opt-out records, which are kept **indefinitely**
and are described that way in §7 of the privacy policy. This is not a
preference — deleting a suppression is the same thing as forgetting that
someone told you to stop, and the next list load would call them again.
`dialer_dnc` is append-only for the same reason.

Note the consequence of 12 months on **consent** records: the TCPA limitation
period is four years, so from month 13 a claim can be brought over a call for
which the proof of consent has already been deleted. That is a deliberate
choice, recorded here so it is not rediscovered by surprise.

### Legal name: settled

The entity was amended to **PrimeHome Buyers**, so brand and legal name are the
same string. That resolves the 10DLC entity question: register the brand
directly, leave the "on behalf of another organization" box **unticked**, and
no reseller ID is needed.

⚠️ **Check the suffix against the EIN record.** The site says exactly
`PrimeHome Buyers`. If the amended entity is registered as `PrimeHome Buyers
LLC` (or Inc, or Co), the legal-name uses must say that too — a legal name
differing from the EIN record by a suffix is a routine vetting rejection.

Do **not** blanket-replace: the name appears in two different roles. The
consumer-facing ones (page title, header, "messages come from PrimeHome
Buyers", the consent disclosure) should stay the trading name, because that is
what the recipient recognises on their phone. Only these are legal-name
positions, and they are worth editing by hand:

| File | Where |
|---|---|
| `index.html` | "About us" opening sentence; footer name; copyright line |
| `privacy.html` | §1 Who we are; §12 Contact us; footer name; copyright line |
| `terms.html` | §1; §8 Our content; §10 Limitation of liability; §11 Indemnity; §14 Contact; footer name; copyright line |
| `sms-opt-out.html` | footer name; copyright line |

---

## Hosting

Needs its own repo and its own GitHub Pages site: GitHub Pages allows one
custom domain per repository, and `01015523142az-hash/project` already uses its
root `CNAME` for `staffportal.proptechnologyai.com`.

```bash
gh repo create 01015523142az-hash/primehomebuyers-site --private --source=. --push
```

Then in **Settings → Pages**: source `main` / root. The `CNAME` file sets the
custom domain automatically. Enable **Enforce HTTPS** once the certificate is
issued — a 10DLC vetting fetch over plain HTTP is a bad look, and browsers will
warn on the form.

### DNS at the registrar for `primehomebuyers.casa`

```
A     @    185.199.108.153
A     @    185.199.109.153
A     @    185.199.110.153
A     @    185.199.111.153
CNAME www  01015523142az-hash.github.io.
```

---

## Backend

The two forms post to Supabase Edge Functions that live in the **portal repo**
(`Proptech AI Portal`), alongside the rest of the Supabase code:

| | |
|---|---|
| `supabase/v546-primehome-site-consent-and-leads.sql` | `site_leads` + `sms_consent_log` |
| `supabase/functions/site-lead-submit/` | Offer form → lead + consent record |
| `supabase/functions/site-opt-out/` | Opt-out → `dialer_dnc` + revocation record |

```bash
supabase functions deploy site-lead-submit --no-verify-jwt
supabase functions deploy site-opt-out --no-verify-jwt
```

`--no-verify-jwt` is **required**. Anonymous homeowners have no Supabase
session, and shipping an anon key in a static page to satisfy the gateway would
put a key on a public site for no security gain. If a later redeploy forgets
the flag, every real submission fails with a gateway 401 *before the function
runs* and nothing appears in the function logs — `public-skiptrace` lost live
traffic exactly that way. If the form silently stops working, check this first.

### Why the consent wording is read from the DOM

`assets/site.js` sends `consent_text` by reading `#consentText` out of the page
rather than from a constant in the script. The stored consent record has to be
the exact wording the person was shown; if the same sentence lived in two
places it would drift the first time someone edited the copy, and the "proof of
consent" would be a record of words nobody ever saw.

If you edit the disclosure in `index.html`, the stored record follows
automatically. Nothing else needs changing.

---

## What is *not* built yet

- **No staff screen for `site_leads`.** Rows are queryable and RLS lets
  reviewers read them, but nothing in the dashboard lists them yet. Until that
  exists, incoming web leads have to be read out of the database.
- **A worded opt-out is not detected.** `telnyx-sms-webhook` matches a keyword
  only when it is the *whole* message, which is the carrier standard. "Please
  stop calling me" is a genuine revocation and will not be caught
  automatically — an agent has to read it in the thread and suppress the
  number. No automatic reading separates that reliably from "I'll stop by
  after work", so the ambiguous middle is left to a human on purpose.

## Done, for the record

Inbound `STOP` **does** now reach `dialer_dnc` (v546). Telnyx blocks further
texts at the carrier level on its own; what the webhook adds is the row that
`dialer-call-control` checks, so a homeowner who texts STOP stops being
**called** too. `START` and `UNSTOP` lift the suppression — but only ones this
self-service path created, never a ReadyMode import or an agent's mid-call
suppression.
