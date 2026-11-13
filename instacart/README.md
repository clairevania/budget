# Budget + Instacart

The same budget app as the main version, plus automatic Instacart totals. A small Google Apps Script reads Instacart receipt emails in your own Gmail, and the app adds each new order to Groceries every time it opens.

Live app: https://clairevania.github.io/budget_V2/instacart/

Everything in the [main README](../README.md) applies here too. This page only covers what is different.

## What's different

- **Instacart orders are added on their own.** Each new receipt shows up as an entry in Groceries with the note "Instacart", dated the day of the email. You can pick a different category in Settings.
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
| `instacart-script.gs` | The Google Apps Script. It is not used by the website, only kept here for reference |

## How it works

1. `instacart-script.gs` runs inside your Google account. It searches Gmail for emails from `instacart.com` in the last 60 days whose subject contains "receipt", and reads the final total from each one.
2. It is published as a web app link. When called with the right secret word, it returns only a list of order ids, dates and totals, like `{"orders":[{"id":"...","date":"2026-11-12","total":84.2}]}`.
3. The app calls that link when it opens and when you switch back to it. New orders become entries, and their ids are remembered so they are never added again.

No email content other than the date and total leaves Google, and nothing is stored anywhere except your Google account and your device.

## Setting up the script

1. Go to [script.google.com](https://script.google.com) signed in to the Gmail that gets your Instacart receipts, and click **New project**.
2. Delete the sample code and paste in everything from `instacart-script.gs`.
3. Change `SECRET` near the top to your own long made-up word. Save.
4. Pick **test** in the function dropdown and click **Run**. Allow access when Google asks (Advanced, then Go to the project). Google calls it unsafe only because it has not reviewed the script.
5. Check the Execution log. Receipts show as `RECEIPT` with a total. If a total is wrong or no receipts are found, the search or the total pattern in the script needs adjusting.
6. Click **Deploy**, then **New deployment**, then the gear, then **Web app**. Set **Execute as** to *Me* and **Who has access** to *Anyone*. Deploy and copy the web app link.

## Connecting the app

1. Open the app's Settings.
2. In **Instacart link**, paste the web app link and add `?key=yourword` at the end.
3. Check **Put Instacart orders in** (Groceries by default) and save.

The app checks right away and shows how many orders it added.

## Security notes

- **Never commit your real secret word or web app link to this repository.** The copy of the script here keeps the placeholder on purpose. The real link lives only in the app's settings on your device.
- "Anyone" access is needed so the phone can reach the script. Without the secret word the link returns nothing.
- The link and secret word are included in backup files, so keep backups private.
- To turn it off, go to **Deploy → Manage deployments** in Apps Script and archive the deployment, or clear the link in the app's Settings.
