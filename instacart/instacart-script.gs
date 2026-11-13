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
    const total = isReceipt ? findTotal_(receiptLines_(m)) : null;
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
    const total = findTotal_(receiptLines_(m));
    if (total == null || total <= 0) return;
    out.push({ id: m.getId(), date: fmtDate_(m.getDate()), total: total });
  }));
  cache.put('orders', JSON.stringify(out), 300);
  return out;
}

/** Turns the receipt as you see it in Gmail into plain lines of text. */
function receiptLines_(m) {
  const text = m.getBody()
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|tr|td|th|li|h\d|table)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#36;/g, '$').replace(/&#45;|&minus;/g, '-');
  return text.split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/**
 * Finds what was actually charged. Uses the "Total charged" line,
 * or the plain "Total" line if a receipt has no "Total charged".
 */
function findTotal_(lines) {
  const money = s => {
    const x = String(s || '').match(/(-?)\s*\$\s?(\d[\d,]*\.\d{2})/);
    return x ? (x[1] ? -1 : 1) * parseFloat(x[2].replace(/,/g, '')) : null;
  };
  const valueAfter = label => {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!label.test(lines[i])) continue;
      const v = money(lines[i]) != null ? money(lines[i]) : money(lines[i + 1]);
      if (v != null) return v;
    }
    return null;
  };
  const charged = valueAfter(/^total charged\b/i);
  return charged != null ? charged : valueAfter(/^total\b(?!\s*(charged|savings|saved))/i);
}

function fmtDate_(d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
