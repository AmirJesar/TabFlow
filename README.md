# TabFlow 🌊

**A smart browser tab manager for Firefox.**

TabFlow helps you organize your browser, manage tab groups, find duplicate tabs, and save tabs for later.

> **Status:** Version 1.0 submitted to Mozilla Firefox Add-ons and awaiting publication.

## ✨ Features

### 📑 Tab Management
- View all open browser tabs.
- Search tabs by title or URL.
- Switch between tabs.
- Close individual tabs.

### 🎨 Tab Groups
- Create native Firefox tab groups.
- Rename groups and change their colors.
- Ungroup tabs without closing them.
- Save and restore tab groups.

### 🤖 Automatic Tab Organization
- Detect tabs belonging to the same website.
- Suggest groups based on website domains.
- Choose whether to create suggested groups.
- Apply suggested group colors.

### 🔍 Duplicate Tab Detector
- Find tabs with identical URLs.
- Identify original tabs and duplicates.
- Close duplicate tabs individually or in bulk.
- Protect the original tab during bulk cleanup.

### 💤 Tab Snooze
- Select tabs you want to save for later.
- Save their titles and URLs.
- Close selected tabs to reduce browser clutter.
- Restore or delete saved tabs whenever needed.

## 🛠️ Technologies

- HTML5
- CSS3
- JavaScript
- Firefox WebExtensions API
- Browser Storage API

## 🚀 Installation

### Install from Firefox Add-ons

The public Mozilla Add-ons listing will be linked here once TabFlow is published.

### Temporary installation (Developer mode)

1. Clone this repository:

   ```bash
   git clone https://github.com/AmirJesar/TabFlow.git
   ```

2. Open Firefox.
3. Visit `about:debugging#/runtime/this-firefox`.
4. Click **Load Temporary Add-on**.
5. Select the project's `manifest.json` file.

TabFlow should now appear in your Firefox toolbar.

**Note:** Temporary add-ons are removed when Firefox restarts.

## 💻 Development

The project uses plain HTML, CSS, and JavaScript. No build tools or external dependencies are currently required.

Project structure:

```text
TabFlow/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
└── README.md
```

To contribute or experiment:

1. Fork the repository.
2. Clone your fork.
3. Make your changes.
4. Test the extension in Firefox.
5. Submit a pull request.

## 🔐 Privacy

TabFlow uses Firefox's local extension storage to save tab groups and snoozed tabs.

It does not intentionally transmit this saved information to external servers.

## 🌐 Compatibility

- Firefox Desktop: Supported
- Firefox for Android: Not currently supported

## 👨‍💻 Author

**Amir Jesar**

GitHub: https://github.com/AmirJesar

## 📄 License

See the repository's licensing information for the applicable terms.