# API Key SafePass

> Your API keys, encrypted and organized — all on your PC.

A secure desktop app that stores API keys with AES-256-GCM encryption, locked behind a master password. No server, no cloud — everything stays on your computer.

[한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

---

## What is this?

If you use AI services like ChatGPT, Claude, Gemini, or any cloud platform, you have API keys scattered across notepad files, .env files, browser tabs, and chat messages. **API Key SafePass** keeps them all in one encrypted vault on your PC.

**No coding knowledge required.** This app was built for anyone — including people who have never written a line of code.

---

## Download & Install

### Windows

1. Go to [Releases](../../releases) page
2. Download `API.Key.SafePass_x64-setup.exe` (recommended) or `.msi`
3. Run the installer
4. Open **API Key SafePass** from Start Menu

> App size: ~2.5 MB. No internet connection required.

---

## Features

### Core
- **AES-256-GCM Encryption** — Military-grade encryption for your API keys
- **Master Password** — One password to unlock everything (Argon2id hashing)
- **Recovery Key** — Backup key in case you forget your password
- **Projects** — Organize keys by project (e.g., "My Blog", "Shopping App")

### Convenience
- **100+ Provider Presets** — OpenAI, Anthropic, Google, AWS, Stripe, and 100 more
- **Auto-Detection** — Paste a key and the provider is detected automatically
- **Korean/English/Chosung Search** — Search by "오픈" or "ㅇㅍ" to find OpenAI
- **Inline Search** — Always-visible search bar at the top, with result count
- **Quick Key Update** — Change a key value without opening the full edit form
- **Reissue Flow** — Expired keys show a "Reissue" button that opens the service page
- **Reference URLs** — Save documentation, pricing, dashboard links with each key
- **.env Export** — Generate .env files from your project keys in one click
- **.env Import** — Import existing .env files into SafePass
- **Custom Providers** — Add any provider not in the preset list
- **No Required Fields** — Save with just a key value, or even without one (add later)

### Security
- **Local Only** — No server, no cloud, no network (keys never leave your PC)
- **Auto-Lock** — Configurable timeout (1/2/5/10/30 min or off)
- **Clipboard Auto-Clear** — Configurable timeout (5/10/15/30/60 sec)
- **Screen Blur Protection** — Blurs the app when you switch windows (configurable delay, can be disabled)
- **Screenshot Protection** — OS-level screen capture prevention
- **Brute Force Protection** — Backend-enforced lockout persisted in DB (survives app restart)
  - Password: 5 fails → 60 sec lockout
  - Recovery key: 3 fails → 5 min lockout
- **Memory Zeroing** — Encryption key wiped from memory on lock
- **URL Validation** — Only http/https URLs allowed (blocks javascript: injection)
- **Transaction Safety** — Password changes are atomic (no data corruption on crash)
- **CSP Headers** — Content Security Policy blocks XSS attacks
- **DevTools Blocked** — F12, Ctrl+Shift+I, Ctrl+U all disabled
- **Print/Save Blocked** — Ctrl+P, Ctrl+S disabled to prevent data leaks
- **Settings Allowlist** — Only 4 whitelisted preference keys accepted by backend
- **Error Sanitization** — Internal errors never exposed to frontend

### Settings (User-configurable)
- Auto-lock timeout
- Clipboard clear time
- Screen blur on/off + delay (instant / 3s / 5s / 10s)
- Master password change (with strength indicator)

---

## Quick Start Guide

> This guide is for **complete beginners** — no coding experience needed.

### Step 1: Install

1. Download the installer from the [Releases](../../releases) page
2. Double-click `API.Key.SafePass_x64-setup.exe`
3. Follow the installation wizard (just click "Next")
4. The app appears in your Start Menu

### Step 2: Create Your Master Password

1. Open **API Key SafePass**
2. You'll see the lock screen — this is your first time, so create a password
3. Type a password (at least 6 characters) and confirm it
4. **IMPORTANT**: A **recovery key** will appear on screen
   - Copy this key to a safe place (password manager, printed paper, etc.)
   - **You will never see this key again!**
   - If you forget your master password, this is the ONLY way to recover
5. Click "Confirm, I saved it"

### Step 3: Add Your First API Key

**Method 1: Select a provider first**
1. Click the big **+** button (bottom right)
2. Click the "Provider" dropdown
3. Search for your service (e.g., type "OpenAI" or "오픈")
4. Click to select — name, URL, and .env variable are filled automatically
5. Paste your API key
6. Click **Save**

**Method 2: Paste first (auto-detect)**
1. Click the big **+** button
2. Paste your API key into the "Key value" field
3. If the key starts with a known prefix (like `sk-` for OpenAI), the provider is detected automatically
4. Click **Save**

**Method 3: Save now, add key later**
1. Click the big **+** button
2. Select a provider
3. Click **Save** (even without a key value)
4. Add the key later using the quick update button (🔄)

### Step 4: Daily Usage

| What you want to do | How |
|---------------------|-----|
| **Copy a key** | Click "Copy" on the key card (auto-clears from clipboard) |
| **Search for a key** | Type in the search bar at the top |
| **Quick search + copy** | Press `Ctrl+K`, type, press `Enter` to copy |
| **Lock the app** | Press `Ctrl+L` or click "Lock" in sidebar |
| **Update a key value** | Hover over the card → click 🔄 → paste new key |
| **Reissue an expired key** | Click the red "Reissue" button → opens service page |
| **Export .env file** | Select a project → click ".env" button in header |
| **Change password** | Sidebar → ⚙ Settings → "Change master password" |
| **Adjust security** | Sidebar → ⚙ Settings → configure lock/blur/clipboard |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Quick search (copy keys from results with Enter) |
| `Ctrl+L` | Lock the app immediately |
| `Esc` | Close any modal or popup |

---

## How Search Works

All search bars support multiple input methods:

| You type | Finds |
|----------|-------|
| `openai` | OpenAI keys |
| `오픈` | OpenAI (Korean name match) |
| `ㅇㅍ` | OpenAI (Korean consonant match) |
| `OPENAI_API_KEY` | Match by .env variable name |
| `deep` | DeepSeek |
| `클로` | Claude (클로드) |
| `billing` | Keys with "billing" in memo |

---

## Supported Providers (100+)

<details>
<summary>Click to expand full list</summary>

**AI Platforms**: OpenAI, Anthropic (Claude), Google AI (Gemini), Google Vertex AI, Groq, Mistral AI, Cohere, Perplexity, Together AI, Fireworks AI, DeepSeek, xAI (Grok), Replicate, HuggingFace, Stability AI, ElevenLabs, AssemblyAI, Pinecone, Weaviate, Voyage AI, AI21 Labs, Cerebras, SambaNova, Upstage, Naver Clova, Kakao (Karlo), OpenRouter, Ollama, LM Studio, Midjourney, RunwayML, Fal.ai, DALL-E, Whisper, Suno AI, Udio, Ideogram, Leonardo AI, Cursor, Copilot, Tavily, Exa, Serper, Recraft AI, Flux, Luma AI, Pika, Heygen, D-ID, Synthesia, Typecast, Kling AI, Minimax, Zhipu AI, Baidu, Alibaba (Qwen), Coze, Dify, LangSmith, Weights & Biases

**Cloud/Infrastructure**: AWS, Google Cloud, Azure, Vercel, Supabase, Firebase, Cloudflare, Netlify, Railway, Render, DigitalOcean, Neon, PlanetScale, Upstash, MongoDB Atlas, Heroku, Fly.io

**Developer Tools**: GitHub, GitLab, Notion, Sentry, Postman, npm, Docker Hub, Algolia, Airtable, Linear

**Payments**: Stripe, PayPal, Toss Payments, Iamport (PortOne)

**Communication**: Slack, Discord, Telegram, Twilio, SendGrid, Resend, Mailgun, KakaoTalk

**+ Custom**: Add any provider not in this list

</details>

---

## Security Architecture

```
Master Password
    │
    ├──→ Argon2id Hash → Stored in DB (verification only)
    │
    └──→ Argon2id KDF + Salt → 256-bit Encryption Key (memory only)
                                    │
                                    ├──→ AES-256-GCM Encrypt → Stored API keys
                                    │
                                    └──→ On Lock: zeroed from memory

Recovery Key (32 bytes, shown once)
    │
    └──→ Encrypts master password → stored for emergency recovery
```

---

## FAQ

**Q: What if I forget my master password?**
Use the recovery key you saved during setup. If you lost that too, your data cannot be recovered — this is by design for maximum security.

**Q: Can I move my keys to another PC?**
Use .env export to save keys to a file, then import on the new PC.

**Q: Does it need internet?**
No. The app is 100% offline. Keys never touch the network.

**Q: The app won't open / keeps saying "wrong password"**
After 5 failed attempts, the app locks for 60 seconds. Wait and try again.

**Q: I changed my password and now recovery key doesn't work**
After a password change, the old recovery key is invalidated. You'll need to set up a new one.

---

## For Developers

### Prerequisites
- Node.js 18+
- Rust (via [rustup](https://rustup.rs))
- Tauri CLI: `npm install -g @tauri-apps/cli`

### Development
```bash
npm install
npm run tauri dev
```

### Build
```bash
npm run tauri build
```

### Tests
```bash
cd src-tauri && cargo test
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Tauri v2 (Rust backend) |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite (rusqlite, bundled) |
| Encryption | AES-256-GCM (aes-gcm crate) |
| Password Hashing | Argon2id (argon2 crate) |
| Build | Vite 6 |

---

## License

MIT
