# API Key SafePass

> Your API keys, encrypted and kept safe — right on your own PC. No server, no cloud, no network transmission.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows-lightgrey.svg)](#download)

**Language**: English (this document) · [한국어](./README.md)

---

## What is this?

If you use AI services like ChatGPT, Claude, Gemini, or any cloud platform, you receive "API keys" — long, password-like strings. Many people end up scattering these across notepad files, self-sent chat messages, and open browser tabs.

**API Key SafePass** keeps all of these in a single encrypted vault **stored entirely on your own computer**. You only need to remember one master password; the actual key values are locked inside the file using AES-256-GCM encryption. **No coding knowledge is required to use it.**

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Required Software](#required-software)
3. [Download](#download)
4. [Installation](#installation)
5. [Quick Start](#quick-start)
6. [Running the App](#running-the-app)
7. [Usage / How It Works](#usage--how-it-works)
8. [Commands](#commands)
9. [Changelog](#changelog)
10. [File / Document Locations](#file--document-locations)
11. [Workflow](#workflow)
12. [Architecture](#architecture)
13. [Security / Data Flow](#security--data-flow)
14. [Troubleshooting](#troubleshooting)
15. [FAQ](#faq)
16. [Legal / Copyright / License / Commercial Use](#legal--copyright--license--commercial-use)

---

## Prerequisites

For general users (installing the pre-built app), you only need this:

| Item | Requirement |
|---|---|
| Operating System | **Windows 10 or Windows 11 (64-bit)** — only Windows installers are currently distributed. macOS/Linux are not yet officially released. |
| Free disk space | About 50MB or more (the installer itself is 1.8–4.6MB; extra space is for app data) |
| Administrator rights | May be required for `setup.exe`/`.msi`. The portable `.exe` runs without admin rights. |
| Internet connection | **Only needed to download the installer.** Once installed, the app requires no internet at all (fully local app). |

> Developers who want to build from source need the additional [Required Software](#required-software) below.

---

## Required Software

### General users (using the pre-built installer)

**Nothing extra to install.** Any Windows 10/11 machine can install and run it directly.

### Developers (building from source)

This project's newest features implemented this session (account-field copy buttons, an improved `.env` importer, a recovery-key regeneration screen, and backup/restore) have **not yet been published as an official release**. To use them today, you need to build from source, which requires:

| Program | Minimum version | Purpose | Download |
|---|---|---|---|
| [Node.js](https://nodejs.org/) | 18+ (LTS recommended) | Building the frontend (UI) | nodejs.org |
| [Rust](https://www.rust-lang.org/tools/install) (`rustup`) | Latest stable | Building the backend (encryption/DB logic) | rust-lang.org |
| [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) | — | Required to compile Rust on Windows | Visual Studio Installer → "Desktop development with C++" workload |
| [Git](https://git-scm.com/) | Any version | Cloning the source code | git-scm.com |

> WebView2 ships built-in with Windows 11 and is included in most up-to-date Windows 10 installs. If it's missing, the app will prompt you to install it automatically.

---

## Download

### General users — download the installer

1. Open your web browser and go to: **https://github.com/sodam-ai/API-Key-SafePass/releases**
2. Click the topmost release, `v0.1.0` (marked "Latest").
3. Expand the "Assets" section and pick one of the three files below.

| File | Type | Choose this when... |
|---|---|---|
| `API.Key.SafePass_0.1.0_x64-setup.exe` | Installer (NSIS) — **recommended** | Best for most users. Registers cleanly in the Start Menu and uninstalls cleanly. |
| `API.Key.SafePass_0.1.0_x64_en-US.msi` | Installer (MSI) | For workplace/organization computers that only allow MSI installers. |
| `api-key-vault.exe` | Portable (no installation needed) | If you lack admin rights, or want to carry it on a USB drive. |

> **The currently published v0.1.0 release does not include this session's newest features** — account-field copy buttons, backup/restore, or the recovery-key regeneration screen. To use these now, you must [build from source](#running-the-app). See [Changelog](#changelog) for the exact feature list included in v0.1.0.

### Developers — clone the source

```bash
git clone https://github.com/sodam-ai/API-Key-SafePass.git
cd API-Key-SafePass
```

---

## Installation

### `setup.exe` (NSIS installer, recommended)

1. Double-click the downloaded `API.Key.SafePass_0.1.0_x64-setup.exe`.
2. **You may see a "Windows protected your PC" SmartScreen warning.** This app is an early build that has not yet purchased a code-signing certificate (a paid annual service), so Windows flags it as coming from an "unknown publisher." It is not malware — the source code is fully open (Apache License 2.0) and anyone can inspect it.
   - Click **"More info"**.
   - A **"Run anyway"** button appears below — click it to continue installation.
3. If asked to choose an install location, the default is fine — just keep clicking "Next."
4. Once installation finishes, "API Key SafePass" is registered in the Start Menu.

### `.msi` (MSI installer)

1. Double-click the downloaded `API.Key.SafePass_0.1.0_x64_en-US.msi`.
2. Follow the wizard: "Next" → "Install" → "Finish".
3. If SmartScreen appears, handle it the same way as described for `setup.exe` above.

### `api-key-vault.exe` (portable, no installation)

1. Place the downloaded `api-key-vault.exe` in any folder you like (Desktop, a USB drive, etc.).
2. Double-click to run it immediately — no install step.
3. This method does not register in the Start Menu, so you'll need to double-click the same file again next time.

### Uninstalling

- If installed via `setup.exe`/`.msi`: Windows Settings → Apps → search "API Key SafePass" → Uninstall.
- Portable `.exe`: simply move the file to the Recycle Bin.
- **Note**: Uninstalling the app does **not** automatically delete your saved key data (`vault.db`). To remove it completely, you must manually delete the data folder described in [File / Document Locations](#file--document-locations).

---

## Quick Start

Once installed, five steps are all you need.

1. **Launch the app** — click "API Key SafePass" from the Start Menu (or desktop).
2. **Set your master password** — on first launch you'll be asked to create a master password. Choose one you won't forget.
3. **Save your recovery key** — right after setting the password, a "recovery key" string appears once. **This screen cannot be shown again**, so screenshot it or write it down somewhere safe (see [FAQ](#faq) for why this matters).
4. **Create a project** — click the "+" on the left sidebar to create a project (e.g., "Work," "Personal Projects").
5. **Add your first key** — click "+ Add Key," enter a name and the actual key value, and save.

From here on, press `Ctrl+K` any time to search your saved keys.

---

## Running the App

### Using the installer (general users)

Double-click the Start Menu or desktop shortcut. No extra setup is needed.

### From source (developers, development mode)

Requires all items in [Required Software](#required-software) to be installed first.

```bash
# 1. Move into the cloned repository folder
cd API-Key-SafePass

# 2. Install frontend dependencies (first time only, takes a few minutes)
npm install

# 3. Run in development mode (frontend + Rust backend together; a window opens automatically)
npm run tauri dev
```

- The first run may take 1–5 minutes while Rust dependencies compile (depending on your machine). Subsequent runs are much faster.
- Editing frontend code hot-reloads the window automatically. Editing Rust code (in `src-tauri/`) triggers a recompile and restarts the app.

### Building an installer from source (distribution build)

```bash
npm run tauri build
```

After the build finishes, you'll find a portable `.exe` and `nsis/`/`msi/` installer folders inside `src-tauri/target/release/bundle/`.

---

## Usage / How It Works

### First-launch flow

1. **Unlock screen** — enter your master password. On first launch, you'll set a new one instead. Five consecutive wrong attempts triggers a temporary lockout (brute-force protection).
2. **Dashboard** — shows how many keys you have, recently used keys, and keys nearing expiration at a glance.
3. **Organize by project/tag** — the left sidebar lets you group keys by project or by AI provider (platform).

### Searching and copying keys

- Press `Ctrl+K`, or type into the search bar at the top — results appear instantly.
- Korean initial-consonant search is supported (e.g., typing "ㅇㅍㅇ" finds "OpenAI").
- Click the copy icon next to a key to copy it to the clipboard; it's automatically cleared after a configurable delay (30 seconds by default).

### Adding / editing keys

- Click the "+" button in the bottom-right corner (or "Add Key" inside a project).
- Enter a name, the actual key value, a provider (choose from 100+ presets like OpenAI/Claude/Gemini, or enter your own), notes, expiration date, and reference URLs.
- You can also store **account fields** (ID/password pairs) alongside a key, each with its own one-click copy button.

### `.env` export / import

- **Export**: select a project, then click ".env" to save that project's keys as a `NAME=value` formatted `.env` file.
- **Import**: click "Import" and select an existing `.env` file to register all its keys at once. Values wrapped in double or single quotes (`KEY="value"`) are automatically unwrapped before saving.

### Backup · Restore

- **Settings → Backup · Restore → "Back Up Now"** copies your current vault file (already encrypted) to a location you choose.
- **"Restore from Backup"** lets you select a previous backup, verify your identity with your current password, and "stage" a restore. The actual swap only happens **the next time you fully quit and relaunch the app** (a deliberate safety design — see [Security / Data Flow](#security--data-flow) for details).
- A staged restore can be cancelled from the Settings screen any time before you restart the app.

### Regenerating your recovery key

- Settings → "Regenerate Recovery Key" → enter your current password → a new recovery key is displayed. Once regenerated, the previous recovery key stops working immediately.

### Locking

- Press `Ctrl+L` or click the lock button on the left to lock instantly.
- The app also auto-locks after a period of inactivity (configurable in Settings; set to 0 to disable).
- If the window loses focus (covered by another window), the screen blurs after a short delay to prevent shoulder-surfing.

---

## Commands

### npm scripts (frontend, from `package.json`)

| Command | Description |
|---|---|
| `npm run dev` | Runs only the Vite dev server (UI preview in a browser, no Rust backend) |
| `npm run build` | Type-checks (`tsc`) then produces a production build (`dist/` folder) |
| `npm run preview` | Previews the production build |
| `npm run tauri <subcommand>` | Invokes the Tauri CLI directly (`npm run tauri dev`, `npm run tauri build`, etc.) |

### Rust/Cargo commands (backend, run inside `src-tauri/`)

| Command | Description |
|---|---|
| `cargo test` | Runs all Rust unit tests |
| `cargo build` | Builds the Rust backend only (debug mode) |
| `cargo clippy` | Runs Rust's static linter |

### In-app keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` | Open search |
| `Ctrl + L` | Lock instantly |
| `Esc` | Close search |

---

## Changelog

<details>
<summary><strong>v0.1.0 (2026-03-21) — Officially released, downloadable</strong> · click to expand</summary>

- AES-256-GCM encrypted key storage
- Master password + recovery-key login
- 100+ AI/service provider presets (OpenAI, Claude, Gemini, etc.)
- Korean initial-consonant search (e.g., `ㅇㅍ` → OpenAI)
- Auto-detects which provider a pasted key belongs to
- `.env` file export / import
- User-configurable auto-lock, clipboard auto-clear, and window blur timing
- Screenshot prevention, DevTools blocking
- Brute-force login protection
- Support for multiple reference URLs per key

</details>

<details>
<summary><strong>Unreleased (source build only) — most recent work</strong> · click to expand</summary>

The following features are implemented and tested in code, but **have not yet been published as a new GitHub release.** To use them now, you must [build from source](#running-the-app).

- One-click copy buttons for account fields (ID/password)
- `.env` import bug fix: correctly handles quote-wrapped values, and wraps the import in a transaction so a partial failure doesn't leave partial data committed
- New recovery-key regeneration screen
- Backup · restore feature (a two-stage verification design that only applies safely at app restart)

</details>

---

## File / Document Locations

### Where is my data stored?

Since this app uses no server or cloud, all your data lives **only in this folder on your own computer**:

```
C:\Users\<your-username>\AppData\Roaming\com.apikeyvault.app\vault.db
```

- A single `vault.db` file holds all your projects, keys, tags, and settings.
- The file itself is already encrypted, so opening it directly will not show plain text.
- `AppData` is a hidden folder by default. Paste the path above directly into File Explorer's address bar to jump there.

### Documents within the project (source layout)

| Document | Location | Contents |
|---|---|---|
| This document | `README.md` | Full project overview (Korean, primary) |
| This document | `README.en.md` | English translation (this file) |
| Testing guide | `TESTING_GUIDE.ko.md` | Detailed test procedures used by developers to verify features |
| Work checkpoint | `CHECKPOINT.md` | Tracks upcoming work and its risks (development progress tracking) |
| Planning docs | `.PRD/` folder | Design/planning documents explaining why and how this app was built |
| License | `LICENSE` | Full Apache License 2.0 text |

---

## Workflow

### A general user's daily flow

```
Launch app → enter master password (unlock)
   → Ctrl+K to search for the key you need → click copy → paste it wherever needed
   → (when done) Ctrl+L to lock, or let auto-lock handle it after inactivity
```

### Starting a new project

```
Create project → register keys (or import them all at once via .env)
   → search and copy as needed while working
   → export to .env when done, to place in the actual project folder
```

### A developer's contribution flow

```
git clone → npm install → npm run tauri dev (verify dev mode)
   → edit code → verify with cargo test / npm run build
   → git commit → open a Pull Request
```

---

## Architecture

The app is split into three layers that communicate only through defined channels.

```
┌─────────────────────────────────────────────┐
│  Frontend                                     │
│  React 18 + TypeScript + Tailwind CSS         │
│  src/ folder                                  │
└───────────────────┬───────────────────────────┘
                     │ Tauri IPC (invoke() calls)
                     │ — looks like a browser, but only
                     │   talks to the Rust backend below,
                     │   never the outside internet
┌───────────────────▼───────────────────────────┐
│  Backend                                       │
│  Rust                                          │
│  src-tauri/src/                                │
│  ├─ commands/  (33 functions handling          │
│  │              frontend requests)              │
│  ├─ crypto/    (AES-256-GCM encrypt/decrypt,    │
│  │              Argon2id password hashing)      │
│  ├─ db/        (SQLite queries)                 │
│  └─ models/    (data structure definitions)     │
└───────────────────┬───────────────────────────┘
                     │ rusqlite (SQLite driver)
┌───────────────────▼───────────────────────────┐
│  Storage                                       │
│  A single SQLite file (vault.db)               │
│  Exists only on your computer — no server       │
└─────────────────────────────────────────────┘
```

- The frontend (React) never touches the SQLite file directly. All data flows exclusively through Rust "commands."
- The app's security policy (`tauri.conf.json`) restricts `connect-src` to the local `ipc:` channel only, so even a bug in the code cannot cause data to leave over the internet.

### Database schema (7 SQLite tables)

| Table | Purpose |
|---|---|
| `app_settings` | Master password hash, user preferences, etc. |
| `projects` | List of projects (folders) |
| `api_keys` | Encrypted API key values and metadata |
| `tags` | List of tags |
| `api_key_tags` | Join table linking keys to tags |
| `usage_logs` | Recent usage history (for the dashboard) |
| `backup_history` | Record of backups that were run |

---

## Security / Data Flow

> Security is this app's core purpose. We recommend understanding the following before use.

### 1. Your master password is never stored

The raw master password is never stored anywhere. Instead, it's transformed irreversibly using **Argon2id** hashing, and stored only in that form; each login re-hashes your input the same way and compares. Argon2id won the 2015 Password Hashing Competition and is designed to resist brute-force attacks.

### 2. Actual key values are encrypted with AES-256-GCM

Registered API key values are never stored as plain text. They are encrypted with **AES-256-GCM**, using an encryption key derived from your master password. This derived key exists in memory only while the app is unlocked and is discarded when you lock it.

### 3. Nothing is transmitted over the internet

`tauri.conf.json`'s security policy (CSP) fixes `connect-src` to `ipc: http://ipc.localhost`, structurally blocking the app from making any outbound network request to an external server. This app has no server.

### 4. Clipboard auto-clear

When you copy a key, it briefly sits on your clipboard. After a configurable delay (30 seconds by default), it is automatically cleared — unless you've since copied something else yourself, in which case your newer clipboard content is left untouched.

### 5. Screen blur

If the app window loses focus or is covered by another window, its contents blur after a short delay, to prevent someone glancing over your shoulder from seeing sensitive data.

### 6. Backup files remain encrypted

A backup is simply a copy of the already-encrypted `vault.db` file. No extra encryption step is needed, and a backup file alone cannot be read without your master password.

### 7. Restoring goes through two safety checks

1. **Staging step**: before restoring, your current password is re-verified. The chosen backup file is checked to confirm it's a genuine SQLite database (by inspecting the first 16 bytes), and it's written to a temporary file (`vault.db.pending-restore`) — the live `vault.db` is never touched at this point.
2. **Apply step**: the swap only happens the next time you fully quit and relaunch the app. At that moment, the pending file is re-validated to ensure it wasn't corrupted; only then is it swapped in. Your previous `vault.db` is not deleted — it's kept alongside as `vault.db.bak-<timestamp>`.
3. In short, no swap ever happens while a database connection is open, and an invalid restore attempt can never destroy your existing data.

### 8. What if I lose my master password?

Your **recovery key** is the only way back in. It is shown once, at initial setup, and is never displayed again afterward. If you lose **both** your master password and your recovery key, there is no way to recover your data — this app deliberately has no backdoor or server-side reset mechanism, because that absence is exactly what makes it secure. See the [FAQ](#faq) for more.

---

## Troubleshooting

| Symptom | Cause | What to do |
|---|---|---|
| "Windows protected your PC" warning during install | No code-signing certificate purchased yet (early build) | Click "More info" → "Run anyway." The source code is public and independently verifiable. |
| Forgot the master password | — | Use "Log in with recovery key" on the unlock screen. Without a recovery key, data recovery is impossible (see [Security item 8](#security--data-flow)). |
| Entered the wrong password 5+ times | Brute-force protection triggered | Wait a while, then try again. |
| App won't launch | Possible WebView2 runtime issue | Keep Windows fully updated, or install the [Microsoft Edge WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) runtime. |
| Values look wrong after importing a `.env` file | A known bug in the official v0.1.0 build (quote handling) | Already fixed in code but not yet in an official release. [Build from source](#running-the-app) to get the fix. |
| Data looks off after backup/restore | Restores only apply after a full app restart, by design | Fully quit and relaunch the app for the restore to take effect. If something's wrong, you can roll back using the auto-created `vault.db.bak-<timestamp>` file (see [File Locations](#file--document-locations)). |
| Port conflict error running dev mode (`npm run tauri dev`) | Another program is using the same port (7845) | Close the conflicting program, or change the port in `vite.config.ts`. |
| Linker error running `cargo build` (Windows) | Microsoft C++ Build Tools not installed | Install the C++ Build Tools listed in [Required Software](#required-software). |
| Something else went wrong | — | File an issue on [GitHub Issues](https://github.com/sodam-ai/API-Key-SafePass/issues) with the symptom, reproduction steps, and your Windows version. |

---

## FAQ

**Q. What happens if I lose both my master password and recovery key?**
A. There is no way to recover your data. This app has no backdoor that even the developers could use to bypass it. Be sure to store your recovery key somewhere safe as soon as it's shown to you.

**Q. Do I need an internet connection?**
A. Only to download the installer. Once installed, actual use (saving, searching, copying keys) requires no internet at all.

**Q. Does it sync automatically across computers?**
A. No. This app deliberately has no cloud sync feature (staying local-only is a core design value). To use the same data on multiple computers, you must manually move a file using [Backup · Restore](#usage--how-it-works).

**Q. Is it free?**
A. Yes, it's free, and the source code is public under Apache License 2.0.

**Q. Can I use it at work, or for commercial purposes?**
A. Yes. Apache License 2.0 broadly permits commercial use, modification, and redistribution. Please review the [Legal / Copyright / License / Commercial Use](#legal--copyright--license--commercial-use) section and the full `LICENSE` file for your legal obligations.

**Q. Is there a mobile app or browser extension?**
A. No — this was a deliberate decision to avoid expanding the attack surface. It is desktop-only.

**Q. Does it work on macOS or Linux?**
A. Only Windows installers are officially released right now. While Tauri's architecture technically supports macOS/Linux builds, this project has not yet built, tested, or published them.

**Q. How can I trust that this app doesn't send my keys anywhere?**
A. The entire source code is public, so anyone can verify it. In particular, the `connect-src` setting in `src-tauri/tauri.conf.json` is restricted to the local `ipc:` channel only, which structurally prevents the app from making outbound network requests.

**Q. Can I modify the source and sell it under my own name?**
A. Apache License 2.0 permits this, provided you retain the original copyright notice and license text, and clearly mark any files you've modified. Please check the exact terms in the `LICENSE` file. This answer is informational only and is not a legal opinion.

---

## Legal / Copyright / License / Commercial Use

> The following is a plain-language summary of this software's license terms, not legal advice. If you need a legal determination, please consult a qualified attorney.

- **License**: [Apache License, Version 2.0](./LICENSE)
- **Copyright holder**: Copyright 2026 SoDam AI Studio
- **Authoritative text**: the [`LICENSE`](./LICENSE) file at the root of this repository (the official text; if this summary ever appears to conflict with it, the `LICENSE` file governs)

### What's permitted

- Commercial use (in your workplace, or bundled into a paid service)
- Modification and creation of Derivative Works
- Redistribution (unmodified or modified)
- A patent license grant (Apache 2.0 Section 3, covering contributors' patent claims)

### What you must do (Apache 2.0 Section 4 summary)

- Include a copy of the license (`LICENSE` file) with any redistribution.
- Clearly mark any files you've modified.
- Preserve the original copyright, patent, trademark, and attribution notices.

### Warranty disclaimer and liability limitation (Apache 2.0 Sections 7 & 8 summary)

This software is provided **"AS IS," without warranties of any kind**, express or implied, including without limitation any implied warranties of merchantability, fitness for a particular purpose, or non-infringement. The copyright holder and contributors accept no liability for any damages (direct, indirect, special, or incidental) arising from the use or inability to use this software. Although this is a **security-focused tool**, the copyright holder accepts no liability, to the maximum extent permitted by law, for data loss, key exposure, or loss of access due to a forgotten master password or recovery key. See Sections 7 and 8 of the [`LICENSE`](./LICENSE) file for the exact legal terms.

### Trademark

This license does not grant permission to use the copyright holder's trade names, trademarks, service marks, or product names (Apache 2.0 Section 6). Using the names "API Key SafePass" or "SoDam AI Studio" to promote a separate product requires separate permission.

### Third-party components

This project uses the following open-source libraries. Each carries its own license, independent of this project's Apache License 2.0 (most are MIT or Apache 2.0-family and are compatible).

| Library | Purpose |
|---|---|
| Tauri v2 | Desktop app framework |
| React, React DOM | UI |
| rusqlite | SQLite database access |
| aes-gcm, argon2 | Encryption and password hashing |
| Tailwind CSS | Styling |

Exact license terms for each library can be verified directly on npm/crates.io, based on the versions pinned in `package.json` (frontend) and `src-tauri/Cargo.toml` (backend).

---

<div align="center">

Found a bug or have a question? Open an issue at [GitHub Issues](https://github.com/sodam-ai/API-Key-SafePass/issues).

Made with care by **SoDam AI Studio** · Licensed under [Apache License 2.0](./LICENSE)

</div>
