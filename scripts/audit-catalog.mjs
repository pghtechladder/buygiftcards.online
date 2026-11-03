// Audits every storefront brand against the LIVE Zendit US voucher catalog.
// Run:  ZENDIT_KEY=<any Zendit key> node scripts/audit-catalog.mjs
// Exits non-zero on any mismatch so it can gate deploys / CI.
import fs from 'fs';
import { ALL_BRANDS } from '../src/lib/brands.ts';
import { GENERATED_ZENDIT_OFFERS } from '../src/lib/zendit-offers.generated.ts';

const KEY = process.env.ZENDIT_KEY;
if (!KEY) { console.error('Set ZENDIT_KEY'); process.exit(2); }

const prov = fs.readFileSync(new URL('../src/lib/giftcard-provider.ts', import.meta.url), 'utf8');
const s = prov.indexOf('BRAND_TO_ZENDIT_OFFER: Record<string, ZenditOfferSpec> = ') + 'BRAND_TO_ZENDIT_OFFER: Record<string, ZenditOfferSpec> = '.length;
const e = prov.indexOf('\n};', s) + 2;
const manual = new Function('return ' + prov.slice(s, e).replace(/\/\/.*$/gm, ''))();
const SPECS = { ...GENERATED_ZENDIT_OFFERS, ...manual };

const catalog = new Map();
for (let off = 0; ; off += 1000) {
  const r = await fetch(`https://api.zendit.io/v1/vouchers/offers?_limit=1000&_offset=${off}&country=US`, { headers: { Authorization: 'Bearer ' + KEY } });
  const d = await r.json();
  for (const o of d.list || []) catalog.set(o.offerId, o);
  if (!d.list || d.list.length < 1000) break;
}
console.log('catalog offers:', catalog.size);

const norm = x => x.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
const errors = [], warns = [];
let checked = 0;
for (const b of ALL_BRANDS) {
  if (b.hidden || ['buygiftcards', 'one4all', 'holidayfavorites'].includes(b.slug)) continue;
  checked++;
  const spec = SPECS[b.slug];
  const err = m => errors.push(`${b.slug}: ${m}`);
  if (!spec) { err('no Zendit spec but visible'); continue; }
  const ids = [spec.rangeOfferId, ...Object.values(spec.fixedOffers || {})].filter(Boolean);
  for (const id of ids) {
    const o = catalog.get(id);
    if (!o) { err(`offer ${id} not in live catalog`); continue; }
    if (o.enabled === false) err(`offer ${id} disabled`);
    const bn = norm(o.brand), nn = norm(b.name), sn = b.slug;
    if (!(bn.includes(sn) || sn.includes(bn) || nn.includes(bn) || bn.includes(nn))) warns.push(`${b.slug}: name "${b.name}" vs Zendit brand "${o.brand}" (${id}) — verify`);
  }
  const div = o => o.price?.currencyDivisor || 100;
  const fixed = {};
  for (const [d, id] of Object.entries(spec.fixedOffers || {})) {
    const o = catalog.get(id);
    if (!o) continue;
    const face = (o.send?.fixed ?? o.price?.fixed) / (o.send?.currencyDivisor || div(o));
    if (face !== Number(d)) err(`fixed offer ${id} is $${face}, mapped as $${d}`);
    fixed[d] = true;
  }
  let lo = -Infinity, hi = Infinity;
  if (spec.rangeOfferId) {
    const o = catalog.get(spec.rangeOfferId);
    if (o) {
      const p = o.send?.min != null ? o.send : o.price;
      lo = p.min / (p.currencyDivisor || 100); hi = p.max / (p.currencyDivisor || 100);
      if (!(lo >= 0 && hi > 0)) err(`range offer ${spec.rangeOfferId} has no min/max: ${JSON.stringify({ send: o.send, price: o.price })}`);
    }
  }
  if (spec.fixedOffers && !spec.rangeOfferId) {
    if (!b.fixedOnly) err('fixed-only supplier offers but brand.fixedOnly not set');
    for (const d of b.denominations) if (!fixed[d]) err(`denomination $${d} has no Zendit offer`);
    const ks = Object.keys(spec.fixedOffers).map(Number);
    if (b.min !== Math.min(...ks) || b.max !== Math.max(...ks)) err(`min/max ${b.min}-${b.max} != Zendit ${Math.min(...ks)}-${Math.max(...ks)}`);
  } else if (spec.rangeOfferId) {
    if (b.min < lo) err(`min $${b.min} below Zendit min $${lo}`);
    if (b.max > hi) err(`max $${b.max} above Zendit max $${hi}`);
    for (const d of b.denominations) {
      if (d < lo || d > hi) { if (!(spec.fixedOffers && fixed[d])) err(`denomination $${d} outside Zendit range $${lo}-$${hi}`); }
    }
  }
}
console.log(`checked ${checked} visible brands`);
warns.forEach(w => console.log('WARN', w));
errors.forEach(x => console.log('ERROR', x));
console.log(errors.length ? `FAILED: ${errors.length} error(s)` : 'OK: all visible brands match the Zendit catalog');
process.exit(errors.length ? 1 : 0);
