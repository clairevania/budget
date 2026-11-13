# Budget + Instacart and Amazon

The same budget app as the main version, plus automatic order totals. A small Google Apps Script reads Instacart receipts and Amazon order emails in your own Gmail. The app adds each new Instacart order to Groceries and each new Amazon order to Household shopping every time it opens.

Live app: https://clairevania.github.io/budget/instacart/

Everything in the [main README](../README.md) applies here too. This page only covers what is different.

## What's different

- **Instacart orders are added on their own.** Each new receipt shows up as an entry in Groceries with the note "Instacart", dated the day of the email.
- **Amazon orders are added on their own.** Each new order shows up as an entry in Household shopping with the note "Amazon". Only orders shipped to **Claire - MEMPHIS, TN** are counted, so orders shipped to anyone else are left out.
- **Categories can be changed.** Settings has "Put Instacart orders in" and "Put Amazon orders in".
- **Only new orders are added.** Orders from before the day you connect are skipped, so nothing you already typed in gets doubled. An order is never added twice, and if you delete an Instacart entry it does not come back.
- **Separate data from the main version.** This version saves under its own key, `budget-instacart-v1`. The first time it opens, it starts with a copy of whatever the main version had on that device. After that the two keep their own numbers.
- **Its own app.** It installs as **Budget+** with a sage icon and a cart badge, so it sits next to the main app without replacing it.

## Files

| File | What it does |
|---|---|
| `index.html` | The app, including the Instacart import |
| `manifest.webmanifest` | App name **Budget+**, colors and icon |
| `sw.js` | Offline copy of this version, separate from the main version's |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | Sage icon with a cart badge |
| `instacart-script.gs` | The Google Apps Script for Instacart and Amazon. It is not used by the website, only kept here for reference |

## How it works

1. `instacart-script.gs` lives in your Google account and does nothing on its own. It only runs when the app calls its web app link.
2. When called with the right secret word, Google runs it on its own servers. It searches Gmail for emails from the last 60 days and returns only a list of order ids, sources, dates and totals, like `{"orders":[{"id":"...","src":"amazon","date":"2026-11-12","total":7.24}]}`.
   - **Instacart.** Emails from `instacart.com` whose subject contains "receipt".
   - **Amazon.** Emails from `auto-confirm@amazon.com` whose subject starts with "Ordered". One email can hold several orders. Each order is read separately, and only orders whose ship-to line matches `AMAZON_SHIP_TO` (Claire and Memphis) are kept. The Amazon order number is used as the id, so an order is never counted twice even if it appears in more than one email.
3. The app adds any order id it has not seen before as an entry, and remembers the id so the order is never added twice.

No email content other than the date and total leaves Google, and nothing is stored anywhere except your Google account and your device.

### When it runs

- Every time you open the app, and every time you switch back to it from another app. There is no timer or background schedule.
- The script keeps its answer for 5 minutes, so opening the app several times in a row searches Gmail only once.
- Because it looks back 60 days, opening the app after a break catches up on everything missed. An order is only missed if the app is not opened for more than 60 days after it.
- Your laptop does not need to be on, since Google runs the script. The phone needs internet when the app opens. Offline, the app still works and catches up next time.
- It is free, and normal use stays far below Google's daily limits for scripts.

### Which month an order goes into

- Each order goes into the month its receipt email arrived, whatever day the app is opened. Opening the app on Dec 3 puts a Nov 25 receipt in November and a Dec 2 receipt in December.
- The entry keeps the receipt date, so the category's entry list shows that date.
- The receipt arrives after delivery, so an order placed late on the last day of a month and delivered after midnight lands in the next month.
- Dates use the time zone in the script's **Project Settings** (gear icon). Set it to your own time zone, here Central Time (Chicago).

### Which amount is used

**Instacart**
- The script reads the receipt as it appears in Gmail (the HTML version) and takes the **Total charged** line. If a receipt has no such line, it uses the **Total** line.
- That is the amount that actually came off the card, after any card credits or promotions. For example, a $19.74 order with a $10.00 card credit is recorded as $9.74.
- Receipts with a zero or negative total, such as refunds for adjustments, are skipped.
- The plain-text version of Instacart receipts is not used. Its "Order Totals" figure does not always match what was charged.

**Amazon**
- The script takes each order's **Grand Total** from the order email, which is what Amazon charges for that order including tax.
- Later changes are not tracked. Cancellations, returns and refunds are not taken off, so delete or adjust the entry in the app by hand if that happens.
- To count orders shipped to a different name or city, change `AMAZON_SHIP_TO` near the top of the script.

## Setting up the script

1. Go to [script.google.com](https://script.google.com) signed in to the Gmail that gets your Instacart receipts, and click **New project**.
2. Delete the sample code and paste in everything from `instacart-script.gs`.
3. Change `SECRET` near the top to your own long made-up word. Save.
4. Pick **test** in the function dropdown and click **Run**. Allow access when Google asks (Advanced, then Go to the project). Google calls it unsafe only because it has not reviewed the script.
5. Check the Execution log. It has an Instacart part and an Amazon part.
   - Instacart receipts show as `RECEIPT` with a total, and other Instacart emails show as `skipped`. Compare the totals with the "Total charged" in the receipt emails.
   - Amazon orders that count show as `ORDER` with the total, order number and ship-to line. Orders shipped elsewhere show as `not counted`. `NO ORDERS READ` means an Amazon email was found but no order could be read from it.
6. Click the gear icon (**Project Settings**) on the left and check the time zone is your own.
7. Click **Deploy**, then **New deployment**, then the gear, then **Web app**. Set **Execute as** to *Me* and **Who has access** to *Anyone*. Deploy and copy the web app link.

## Connecting the app

1. Open the app's Settings.
2. In **Instacart link**, paste the web app link and add `?key=yourword` at the end.
3. Check **Put Instacart orders in** (Groceries by default) and **Put Amazon orders in** (Household shopping by default), then save.

The app checks right away and shows how many orders it added. Only orders from the day you first connected the link onward are added, so receipts from before then need typing in by hand if you want them.

## Updating the script later

A deployed web app keeps running the version that was deployed, even after the code is edited and saved. To make changes live, go to **Deploy → Manage deployments**, click the pencil icon, set **Version** to *New version*, and click **Deploy**. The link stays the same, so nothing needs changing in the app.

After pasting a new copy of the script, put your secret word back in the `SECRET` line before saving.

## Security notes

- **Never commit your real secret word or web app link to this repository.** The copy of the script here keeps the placeholder on purpose. The real link lives only in the app's settings on your device.
- "Anyone" access is needed so the phone can reach the script. Without the secret word the link returns nothing.
- The link and secret word are included in backup files, so keep backups private.
- To turn it off, go to **Deploy → Manage deployments** in Apps Script and archive the deployment, or clear the link in the app's Settings.
