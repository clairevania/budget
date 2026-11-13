# Monthly Budget

A small personal budget app that runs in the browser. It tracks biweekly pay, spending, saving and investing each month, with a pastel ring chart and a year overview. It works offline and can be installed on a phone's home screen.

Live app: https://clairevania.github.io/budget/

There is also a version, **Budget+**, that adds Instacart and Amazon orders automatically from Gmail. It lives in the [`instacart`](instacart/) folder at https://clairevania.github.io/budget_V2/instacart/ and has its own README.

## Features

- **Biweekly income.** Enter your take-home pay per paycheck. The app knows which months have 3 paydays and switches between ×2 and ×3 on its own. You can also add other income.
- **Three groups.** Spending, Saving and Investing are tracked separately. Each category has its own icon and color.
- **Quick add.** Type an amount in a category's Add box, like `40` or `40 milk`, and it adds to that month's total. A negative amount like `-20 refund` takes money off.
- **Entry history.** Tap a category name to see every entry for the month with its date and note. You can edit notes, delete entries, rename the category, or change its group, icon and color.
- **Month summary.** A ring chart shows how the month's income was split, with what's left over in the middle. It also shows totals for spent, saved and invested, and the share of income put away.
- **Your year.** One bar per month, split into spent, saved, invested and left over. Tap a bar to jump to that month.
- **Investment India in rupees.** Shows the rupee value using an exchange rate you set.
- **Copy last month.** Fills empty categories with last month's amounts, which is handy for rent and bills.
- **Reset to zero.** Clears this month or every month. Categories and settings are kept.
- **Backup and restore.** Saves all your data to a file and loads it back.
- **Light and dark mode.** Follows your device, or set it in Settings.

## Files

| File | What it does |
|---|---|
| `index.html` | The whole app, including layout, styling, logic and saving |
| `manifest.webmanifest` | Tells the phone it's an app (name, colors, icon) so it opens full screen |
| `sw.js` | Service worker that keeps a copy of the app on the device so it works offline |
| `icon-192.png`, `icon-512.png` | App icon for Android |
| `apple-touch-icon.png` | App icon for iPhone |
| `instacart/` | Budget+, the version that adds Instacart and Amazon orders from Gmail, with its own files and README |

## Hosting on GitHub Pages

1. Create a public repository named `budget_V2`.
2. Upload the files above to the main branch.
3. Go to **Settings → Pages**, set the branch to `main` and the folder to `/ (root)`, then save.
4. After a minute or two the app is live at `https://<username>.github.io/budget_V2/`.

To update the app, upload the changed files with the same names. GitHub replaces the old ones.

## Installing on a phone

- **iPhone.** Open the link in Safari, tap Share, then **Add to Home Screen**.
- **Android.** Open the link in Chrome, tap ⋮, then **Install app**. Pick Install rather than Create shortcut. The installed app opens full screen like a normal app.

Always open the app from the home screen icon. On iPhone, the home screen app keeps its own data, separate from Safari tabs.

## Where the data is stored

All data stays on the device. Nothing is sent to GitHub or any server.

The app saves everything in the browser's `localStorage` under the key `monthly-budget-v2`, every time something changes:

```js
localStorage.setItem("monthly-budget-v2", JSON.stringify(state));
```

and reads it back when the app opens:

```js
state = JSON.parse(localStorage.getItem("monthly-budget-v2"));
```

Each device and browser has its own separate storage. Anyone else who opens the link gets an empty copy, and nothing they enter reaches this device.

**Things that erase the data**
- Android: clearing Chrome's **Cookies and site data**. Clearing only history or cached files is safe.
- iPhone: deleting the home screen app.
- Any device: clearing site data for the app's address.

## Backups and moving to a new phone

1. On the old device, tap **Download backup**. This saves a `.json` file with all categories, entries, notes and settings.
2. Move the file to the new device by email, AirDrop or a cloud drive.
3. On the new device, install the app, open it, tap **Restore backup** and choose the file.

Phone backups through iCloud or Google may not include the app's data. Download a backup every month or so and keep it in a cloud drive.

## Privacy and security

- There are no accounts, ads or tracking.
- The code in this repository is public, but it holds no personal data.
- Only the repository owner can change the files, so keep two-factor sign-in on for the GitHub account.
- Backup files hold your data in plain text, so keep them private.
- The app loads the Nunito font from Google Fonts. No budget data is part of that request.
