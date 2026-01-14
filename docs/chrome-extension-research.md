# Chrome Extension Research

Research findings for converting Brute Bookmarks into a Chrome extension.

## 1. What Would It Take to Convert?

### Architecture Changes Required

**Manifest V3 is mandatory** (V2 deprecated January 2025). Key changes:

| Current (Web App) | Chrome Extension |
|-------------------|------------------|
| Express backend | Service worker (runs on-demand) |
| Server-side icon processing | Client-side processing or external API |
| `/data/bookmarks.json` | `chrome.storage.local` / `chrome.storage.sync` |
| Server icon cache | IndexedDB for images |

### Technical Requirements

1. **manifest.json** - The extension's "brain"
   - Permissions: `storage`, `unlimitedStorage`, `activeTab`
   - Service worker instead of background page
   - Action popup (your bookmark grid)

2. **No remote code** - All JS must be bundled in the extension package

3. **File structure** adapts well:
   ```
   extension/
   ├── manifest.json
   ├── popup.html          # Main bookmark grid (from index.html)
   ├── popup.js            # Main logic
   ├── service-worker.js   # Background tasks (icon fetching)
   ├── options.html        # Settings page
   └── icons/              # Extension icons (16, 48, 128px)
   ```

### What Can Stay

- UI/CSS - works as-is in popup
- Wikimedia Commons API calls - work from extension
- DuckDuckGo favicon API - works from extension
- Twemoji CDN - works from extension

### What Must Change

- **Sharp image processing** - Can't run Node.js; use Canvas API or fetch pre-sized images
- **Server data storage** - Use `chrome.storage` API
- **Icon caching** - Use IndexedDB for blob storage

---

## 2. Chrome Web Store Publishing Procedures

### Registration

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay **$5 one-time fee**
3. Verify email address
4. Accept Developer Agreement

### Required Assets

| Asset | Requirements |
|-------|--------------|
| Icon | 128x128 PNG |
| Screenshots | At least 1 (1280x800 or 640x400) |
| Description | Clear, keyword-rich (no vague claims) |
| Privacy Policy | Required if collecting any data |

### Review Process

- **Timeline**: 1-3 business days (simple extensions often <24h)
- **Sensitive permissions** take longer
- **Common rejections**:
  - Requesting `<all_urls>` when only specific sites needed
  - Vague descriptions
  - Missing privacy policy

### Publishing Steps

1. Create ZIP of extension folder
2. Upload to Developer Dashboard
3. Fill store listing (description, screenshots, category)
4. Submit for review
5. Once approved, extension goes live

---

## 3. Self-Hosted + Chrome Extension: Both Possible?

**Yes, absolutely.** Common patterns:

### Option A: Separate Products
- **Self-hosted**: Full-featured, your own server, unlimited storage
- **Extension**: Standalone, uses Chrome storage, maybe freemium

### Option B: Extension Connects to Self-Hosted
- Extension acts as client to your self-hosted backend
- User configures their server URL in extension options
- Best of both worlds for power users

### Option C: Hybrid (Recommended)
- Extension works standalone (free tier)
- Optional: Connect to self-hosted OR pay for cloud sync
- Covers all user types

---

## 4. Data Storage Without Backend Databases

### Chrome Storage API

| Storage Type | Limit | Sync | Best For |
|--------------|-------|------|----------|
| `storage.local` | 10 MB (unlimited with permission) | No | Large data, icons |
| `storage.sync` | 100 KB total, 8 KB/item, 512 items | Yes | Settings, bookmark JSON |
| `storage.session` | 10 MB | No | Temporary data |

**Key advantages over localStorage:**
- Persists when user clears browsing data
- Works in incognito (with permission)
- Async operations (faster)
- Stores objects directly (no JSON.stringify needed)

### Icon Storage: IndexedDB

For images (your cached icons), use **IndexedDB**:

```javascript
// Store icon as blob
const db = await openDB('icons', 1);
await db.put('icons', blob, iconHash);

// Retrieve
const blob = await db.get('icons', iconHash);
const url = URL.createObjectURL(blob);
```

- **No size limit** with `unlimitedStorage` permission
- Stores blobs directly (no base64 conversion needed)
- Persists across sessions
- Survives cache clears

### Practical Limits for Your Use Case

| Data | Storage | Estimated Size |
|------|---------|----------------|
| Bookmark JSON | `storage.sync` | ~50-100 KB for 500+ bookmarks |
| Settings | `storage.sync` | <1 KB |
| Cached icons | IndexedDB | ~50 KB each × 500 = ~25 MB |

**This is completely feasible without any backend.**

---

## 5. Subscription Model Without Your Own Database

### ExtensionPay (Recommended)

[ExtensionPay](https://extensionpay.com/) handles everything:
- Stripe integration
- User authentication
- Subscription management
- No backend required from you

```javascript
// In your extension
import ExtPay from 'extpay';
const extpay = ExtPay('your-extension-id');

// Check if user paid
const user = await extpay.getUser();
if (user.paid) {
  // Enable premium features
}
```

**Pricing**: Free to start, they take a cut of transactions.

### What Premium Could Unlock

- **Cloud sync** (their servers store encrypted backup)
- **Cross-browser sync**
- **Increased storage limits**
- **LLM-powered features** (autofill, import parsing)
- **Priority support**

### Alternative: BrowserBill

[BrowserBill](https://browserbill.com/) - similar to ExtensionPay, also Stripe-based.

### How Speed Dial Likely Does It

Speed Dial 2 probably uses:
1. ExtensionPay or similar for payments
2. Their own cloud backend for sync (paid feature)
3. Firebase or similar BaaS for user data

You can achieve the same with ExtensionPay + Firebase (or skip Firebase entirely and use `storage.sync` for paid users).

---

## 6. LLM Integration for Autofill & Import Parsing

### Architecture Options

#### Option A: User's Own API Key (No Cost to You)

User provides their OpenAI/Anthropic API key in settings:

```javascript
// User configures in options
const apiKey = await chrome.storage.sync.get('openaiKey');

// Call API directly from extension
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify({
    model: 'gpt-4o-mini', // Cheap and fast
    messages: [{ role: 'user', content: prompt }]
  })
});
```

**Pros**: Zero LLM cost for you, unlimited usage for users
**Cons**: Friction (user needs API key), not everyone has one

#### Option B: Your API Key (Metered via Subscription)

Include LLM calls in premium tier:
- Proxy through ExtensionPay or your own serverless function
- Limit calls per month for subscribers

#### Option C: Hybrid (Recommended)

- **Free**: User provides their own API key
- **Premium**: Includes X calls/month with your key

### Autofill Implementation

When user enters a URL, suggest a name:

```javascript
async function suggestBookmarkName(url) {
  const prompt = `Given this URL: ${url}
  Suggest a short, descriptive bookmark name (2-4 words).
  Just return the name, nothing else.`;

  // Call LLM API
  const name = await callLLM(prompt);
  return name; // "GitHub Repository" or "YouTube Music"
}
```

**Model recommendation**: `gpt-4o-mini` or `claude-3-haiku` - fast and cheap (~$0.0001 per call).

### Import Parsing Implementation

Parse any bookmark format into your schema:

```javascript
async function parseImportedBookmarks(rawData) {
  const prompt = `Convert this bookmark data to JSON array format:

  Required schema:
  [{ "id": "unique", "name": "Category Name", "bookmarks": [
    { "id": "unique", "title": "Name", "url": "https://..." }
  ]}]

  Input data:
  ${rawData}

  Return only valid JSON, no explanation.`;

  const parsed = await callLLM(prompt);
  return JSON.parse(parsed);
}
```

This handles:
- Chrome bookmark exports (HTML)
- Firefox bookmarks (JSON)
- Netscape format
- Plain text lists
- CSV files
- Any format the user throws at it

### Existing LLM Chrome Extensions for Reference

- [HARPA AI](https://harpa.ai/) - Multi-model support (GPT, Claude, Gemini)
- [ai-autofill](https://github.com/chandrasuda/ai-autofill) - Open-source autofill with LLMs
- [Nanobrowser](https://github.com/nanobrowser/nanobrowser) - Open-source, user provides API keys

---

## 7. Recommended Implementation Strategy

### Phase 1: Basic Extension (No Backend)
1. Convert UI to popup
2. Use `chrome.storage.sync` for bookmarks
3. Use IndexedDB for icon cache
4. Keep Wikimedia/DuckDuckGo/Twemoji APIs

### Phase 2: LLM Features
1. Add settings for user's API key
2. Implement autofill suggestions
3. Implement import parser

### Phase 3: Premium Features
1. Integrate ExtensionPay
2. Add cloud backup (optional: Firebase or your own)
3. Include LLM quota for subscribers

### Phase 4: Self-Hosted Integration
1. Option to connect to self-hosted backend
2. Sync between extension and self-hosted

---

## Sources

- [Chrome Extensions Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
- [Chrome Web Store Registration](https://developer.chrome.com/docs/webstore/register)
- [chrome.storage API](https://developer.chrome.com/docs/extensions/reference/api/storage)
- [IndexedDB for Files](https://hacks.mozilla.org/2012/02/storing-images-and-files-in-indexeddb/)
- [ExtensionPay](https://extensionpay.com/)
- [How to Monetize Chrome Extensions 2025](https://www.extensionradar.com/blog/how-to-monetize-chrome-extension)
- [ai-autofill GitHub](https://github.com/chandrasuda/ai-autofill)
- [HARPA AI](https://harpa.ai/)
