/**
 * Instacart to Budget
 * Runs in your own Google account. Reads your Instacart receipt emails
 * and gives the budget app a short list of dates and totals.
 * Nothing else from your email leaves Google.
 */

// 1. Change this to any long made-up word, like a password. Keep it to yourself.
const SECRET = 'change-me-to-a-long-random-word';

// Which emails to look at. Only emails from Instacart in the last 60 days.
const SEARCH = 'from:instacart.com newer_than:60d';

// Only emails whose subject matches this count as receipts.
const RECEIPT_SUBJECT = /receipt/i;


/** The budget app calls this. */
function doGet(e) {
  if (!e || !e.parameter || e.parameter.key !== SECRET || SECRET.indexOf('change-me') === 0) {
    return json_({ error: 'wrong key' });
  }
  return json_({ orders: findOrders_() });
}

/** Run this from the editor to check what the script finds. Results show in the Execution log. */
function test() {
  const threads = GmailApp.search(SEARCH, 0, 50);
  if (!threads.length) { Logger.log('No Instacart emails found in the last 60 days.'); return; }
  threads.forEach(t => t.getMessages().forEach(m => {
    const isReceipt = RECEIPT_SUBJECT.test(m.getSubject());
    const total = isReceipt ? findTotal_(m.getPlainBody()) : null;
    Logger.log((isReceipt ? 'RECEIPT  ' : 'skipped  ') + fmtDate_(m.getDate()) + '  ' +
               (total != null ? '$' + total.toFixed(2) : '-') + '  ' + m.getSubject());
  }));
}

function findOrders_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('orders');
  if (hit) return JSON.parse(hit);
  const out = [];
  GmailApp.search(SEARCH, 0, 100).forEach(t => t.getMessages().forEach(m => {
    if (!RECEIPT_SUBJECT.test(m.getSubject())) return;
    const total = findTotal_(m.getPlainBody());
    if (total == null) return;
    out.push({ id: m.getId(), date: fmtDate_(m.getDate()), total: total });
  }));
  cache.put('orders', JSON.stringify(out), 300);
  return out;
}

/** Finds the final total on a receipt, ignoring subtotals and savings lines. */
function findTotal_(body) {
  const lines = String(body).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const money = /\$\s?([\d,]+\.\d{2})/;
  let best = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/\btotal\b/i.test(line)) continue;
    if (/sub\s*-?\s*total|savings|saved|you save|items?\s+total|\best(imated|\.)?\b/i.test(line)) continue;
    let m = line.match(money);
    if (!m && i + 1 < lines.length) m = lines[i + 1].match(/^\$\s?([\d,]+\.\d{2})/);
    if (m) best = parseFloat(m[1].replace(/,/g, ''));   // keep the last real "Total" on the receipt
  }
  return best;
}

function fmtDate_(d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
