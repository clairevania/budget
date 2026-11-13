/**
 * Orders to Budget (Instacart and Amazon)
 * Runs in your own Google account. Reads your Instacart receipt emails and
 * Amazon order emails, and gives the budget app a short list of dates and totals.
 * Nothing else from your email leaves Google.
 */

// 1. Change this to any long made-up word, like a password. Keep it to yourself.
const SECRET = 'change-me-to-a-long-random-word';

// Instacart. Only receipt emails from the last 60 days.
const INSTACART_SEARCH = 'from:instacart.com newer_than:60d';
const INSTACART_SUBJECT = /receipt/i;

// Amazon. Only "Ordered:" emails from the last 60 days, and only orders shipped to this name and city.
const AMAZON_SEARCH = 'from:auto-confirm@amazon.com newer_than:60d';
const AMAZON_SUBJECT = /^\s*ordered\b/i;
const AMAZON_SHIP_TO = /claire.*memphis/i;


/** The budget app calls this. */
function doGet(e) {
  if (!e || !e.parameter || e.parameter.key !== SECRET || SECRET.indexOf('change-me') === 0) {
    return json_({ error: 'wrong key' });
  }
  return json_({ orders: findOrders_() });
}

/** Run this from the editor to check what the script finds. Results show in the Execution log. */
function test() {
  Logger.log('---- Instacart');
  const ic = GmailApp.search(INSTACART_SEARCH, 0, 50);
  if (!ic.length) Logger.log('No Instacart emails found in the last 60 days.');
  ic.forEach(t => t.getMessages().forEach(m => {
    const isReceipt = INSTACART_SUBJECT.test(m.getSubject());
    const total = isReceipt ? findTotal_(htmlLines_(m)) : null;
    Logger.log((isReceipt ? 'RECEIPT  ' : 'skipped  ') + fmtDate_(m.getDate()) + '  ' +
               (total != null ? '$' + total.toFixed(2) : '-') + '  ' + m.getSubject());
  }));
  Logger.log('---- Amazon');
  const az = GmailApp.search(AMAZON_SEARCH, 0, 50);
  if (!az.length) Logger.log('No Amazon order emails found in the last 60 days.');
  az.forEach(t => t.getMessages().forEach(m => {
    if (!AMAZON_SUBJECT.test(m.getSubject())) { Logger.log('skipped  ' + fmtDate_(m.getDate()) + '  ' + m.getSubject()); return; }
    const found = amazonOrders_(m);
    if (!found.length) Logger.log('NO ORDERS READ  ' + fmtDate_(m.getDate()) + '  ' + m.getSubject());
    found.forEach(o => {
      const counts = AMAZON_SHIP_TO.test(o.shipTo) && o.total > 0;
      Logger.log((counts ? 'ORDER    ' : 'not counted  ') + fmtDate_(m.getDate()) + '  ' +
                 (o.total != null ? '$' + o.total.toFixed(2) : '-') + '  #' + o.num + '  ship to: ' + (o.shipTo || '?'));
    });
  }));
}

function findOrders_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('orders');
  if (hit) return JSON.parse(hit);
  const out = [], seen = {};

  GmailApp.search(INSTACART_SEARCH, 0, 100).forEach(t => t.getMessages().forEach(m => {
    if (!INSTACART_SUBJECT.test(m.getSubject())) return;
    const total = findTotal_(htmlLines_(m));
    if (total == null || total <= 0) return;
    out.push({ id: m.getId(), src: 'instacart', date: fmtDate_(m.getDate()), total: total });
  }));

  GmailApp.search(AMAZON_SEARCH, 0, 100).forEach(t => t.getMessages().forEach(m => {
    if (!AMAZON_SUBJECT.test(m.getSubject())) return;
    amazonOrders_(m).forEach(o => {
      const id = 'amz-' + o.num;
      if (seen[id] || !AMAZON_SHIP_TO.test(o.shipTo) || o.total == null || o.total <= 0) return;
      seen[id] = true;
      out.push({ id: id, src: 'amazon', date: fmtDate_(m.getDate()), total: o.total });
    });
  }));

  cache.put('orders', JSON.stringify(out), 300);
  return out;
}

/* ---------- Instacart ---------- */

/**
 * Finds what was actually charged. Uses the "Total charged" line,
 * or the plain "Total" line if a receipt has no "Total charged".
 */
function findTotal_(lines) {
  const valueAfter = label => {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!label.test(lines[i])) continue;
      const v = money_(lines[i]) != null ? money_(lines[i]) : money_(lines[i + 1]);
      if (v != null) return v;
    }
    return null;
  };
  const charged = valueAfter(/^total charged\b/i);
  return charged != null ? charged : valueAfter(/^total\b(?!\s*(charged|savings|saved))/i);
}

/* ---------- Amazon ---------- */

/** One Amazon email can hold several orders. Returns each with its number, ship-to line and Grand Total. */
function amazonOrders_(m) {
  const found = parseAmazon_(htmlLines_(m));
  return found.length ? found : parseAmazon_(plainLines_(m));
}

function parseAmazon_(lines) {
  const starts = [];
  lines.forEach((l, i) => {
    const x = l.match(/order\s*#\s*:?\s*(\d{3}-\d{7}-\d{7})/i);
    if (x) starts.push([i, x[1]]);
  });
  return starts.map(([i, num], k) => {
    const end = k + 1 < starts.length ? starts[k + 1][0] : lines.length;
    let shipTo = '';
    for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
      if (/,\s*[A-Z]{2}\b/.test(lines[j])) { shipTo = lines[j]; break; }
    }
    let total = null;
    for (let j = i; j < end; j++) {
      if (/grand total/i.test(lines[j])) { total = money_(lines[j]); if (total == null) total = money_(lines[j + 1]); break; }
    }
    return { num: num, shipTo: shipTo, total: total };
  });
}

/* ---------- helpers ---------- */

const BIDI_ = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

/** The email as you see it in Gmail, turned into plain lines of text. */
function htmlLines_(m) {
  const text = m.getBody()
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|tr|td|th|li|h\d|table)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#36;/g, '$').replace(/&#45;|&minus;/g, '-')
    .replace(/&#35;/g, '#').replace(BIDI_, '');
  return text.split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/** The plain-text version of the email, as lines. */
function plainLines_(m) {
  return m.getPlainBody().replace(BIDI_, '').split(/\r?\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/** Reads a dollar amount like $7.24 or -$10.00 from a line. */
function money_(s) {
  const x = String(s || '').match(/(-?)\s*\$\s?(\d[\d,]*\.\d{2})/);
  return x ? (x[1] ? -1 : 1) * parseFloat(x[2].replace(/,/g, '')) : null;
}

function fmtDate_(d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
