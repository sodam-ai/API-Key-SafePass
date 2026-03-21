# API Key SafePass

> Your API keys, encrypted and organized — all on your PC.

A secure desktop app that stores API keys with AES-256-GCM encryption, locked behind a master password. No server, no cloud — everything stays on your computer.

[한국어](./README.ko.md) | [日本語](./README.ja.md) | [中文](./README.zh.md)

---

## What is this?

If you use AI services like ChatGPT, Claude, Gemini, or any cloud platform, you have API keys scattered across notepad files, .env files, browser tabs, and chat messages. **API Key SafePass** keeps them all in one encrypted vault on your PC.

**No coding knowledge required.** This app was built for anyone — including people who have never written a line of code.

---

## Features

### Core
- **AES-256-GCM Encryption** — Military-grade encryption for your API keys
- **Master Password** — One password to unlock everything (Argon2id hashing)
- **Recovery Key** — Backup key in case you forget your password
- **Projects** — Organize keys by project (e.g., "My Blog", "Shopping App")

### Convenience
- **100+ Provider Presets** — OpenAI, Anthropic, Google, AWS, Stripe, and more
- **Auto-Detection** — Paste a key and the provider is detected automatically
- **Korean/English/Chosung Search** — Search by "오픈" or "ㅇㅍ" to find OpenAI
- **Quick Key Update** — Change a key value without opening the full edit form
- **Reissue Flow** — Expired keys show a "Reissue" button that opens the service page
- **Reference URLs** — Save documentation, pricing, dashboard links with each key
- **.env Export** — Generate .env files from your project keys in one click
- **.env Import** — Import existing .env files into SafePass

### Security
- **Local Only** — No server, no cloud, no network (keys never leave your PC)
- **Auto-Lock** — Configurable timeout (1/2/5/10/30 min)
- **Clipboard Auto-Clear** — Configurable timeout (5/10/15/30/60 sec)
- **Screen Blur Protection** — Blurs the app when you switch windows (configurable)
- **Screenshot Protection** — OS-level screen capture prevention
- **Brute Force Protection** — Backend-enforced lockout (5 fails = 60s, persisted in DB)
- **Recovery Key Rate Limiting** — 3 fails = 5 min lockout
- **Memory Zeroing** — Encryption key wiped from memory on lock
- **URL Validation** — Only http/https URLs allowed (blocks javascript: injection)
- **Transaction Safety** — Password changes are atomic (no data corruption on crash)
- **DevTools Blocked** — F12, Ctrl+Shift+I, view source all disabled
- **Print/Save Blocked** — Ctrl+P, Ctrl+S disabled to prevent data leaks

### Settings
- Auto-lock timeout
- Clipboard clear time
- Screen blur on/off + delay
- Master password change

---

## Quick Start (for non-developers)

### Step 1: Install

1. Download `API Key SafePass_0.1.0_x64_en-US.msi` from the project folder
2. Double-click the file to install
3. Follow the installation wizard

### Step 2: Set Up

1. Open **API Key SafePass** from Start Menu or Desktop
2. Create a **master password** (6+ characters)
3. **Save the recovery key** that appears — copy it to a safe place (you won't see it again!)
4. Click "Confirm, I saved it"

### Step 3: Add Your First Key

1. Click the big **+** button (bottom right corner)
2. **Select a provider** from the dropdown (e.g., OpenAI, Claude, Gemini)
   - Or just paste your key — the provider is detected automatically!
3. The name, .env variable, and service URL are filled in for you
4. Click **Save**

### Step 4: Use Your Keys

- **Copy a key**: Click the "Copy" button on any key card → auto-clears from clipboard
- **Search**: Type in the search bar (Korean, English, consonants all work)
- **Quick search**: Press `Ctrl+K` for the search modal
- **Lock**: Press `Ctrl+L` or click "Lock" in the sidebar

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Quick search (copy keys from search results) |
| `Ctrl+L` | Lock the app immediately |
| `Esc` | Close modals |

---

## How Search Works

You can search for keys using any of these methods:

| Input | Matches |
|-------|---------|
| `openai` | OpenAI keys |
| `오픈` | OpenAI (Korean name) |
| `ㅇㅍ` | OpenAI (Korean consonants) |
| `OPENAI_API_KEY` | By .env variable name |
| `deep` | DeepSeek |

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Tauri v2 (Rust backend) |
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite (local file) |
| Encryption | AES-256-GCM |
| Password Hashing | Argon2id |
| Build | Vite |

---

## For Developers

### Prerequisites
- Node.js 18+
- Rust (via rustup)
- Tauri CLI (`npm install -g @tauri-apps/cli`)

### Development
```bash
cd api-key-vault
npm install
npm run tauri dev
```

### Build
```bash
npm run tauri build
```

Output:
- `.exe` → `src-tauri/target/release/api-key-vault.exe`
- `.msi` → `src-tauri/target/release/bundle/msi/`

### Tests
```bash
cd src-tauri
cargo test
```

---

## Security Architecture

```
User Input (password)
    │
    ▼
Argon2id Hash ──→ Stored in SQLite (for verification)
    │
    ▼
Argon2id KDF ──→ 256-bit Encryption Key (in memory only)
    │
    ▼
AES-256-GCM ──→ Encrypted API keys (stored in SQLite)
    │
    ▼
On Lock: Key zeroed from memory
```

- **Password** is never stored — only its Argon2id hash
- **Encryption key** exists only in memory while unlocked
- **API keys** are encrypted at rest in SQLite
- **Recovery key** can decrypt a stored encrypted copy of the password

---

## License

MIT
