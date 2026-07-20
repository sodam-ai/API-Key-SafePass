# API Key SafePass — Absolute Beginner's Guide

> Written step-by-step, from the very beginning, for people who are new to computers, the internet, and AI.
> Nothing is skipped on the assumption that "you probably already know this." Just follow along slowly.

**Language**: English (this document) · [한국어](./GUIDE.md)
**Want the short version?** → [README.en.md](./README.en.md) (full project overview, including developer information)

---

## Table of Contents

1. [Before You Read This](#before-you-read-this)
2. [What You'll Need](#what-youll-need)
3. [Step 1 — Download the Program](#step-1--download-the-program)
4. [Step 2 — Install It](#step-2--install-it)
5. [Step 3 — First Launch and Setting a Password](#step-3--first-launch-and-setting-a-password)
6. [Step 4 — Save Your First Key](#step-4--save-your-first-key)
7. [Step 5 — Find and Copy a Saved Key](#step-5--find-and-copy-a-saved-key)
8. [Everyday Use](#everyday-use)
9. [Things You Must Never Do](#things-you-must-never-do)
10. [If Something Goes Wrong](#if-something-goes-wrong)
11. [Frequently Asked Questions](#frequently-asked-questions)
12. [Cost and Terms of Use](#cost-and-terms-of-use)

---

## Before You Read This

### What does this program actually do?

Have you ever signed up for ChatGPT or some other AI or internet service and received an "API key" — a long, password-like string (something like `sk-abc123...`)? Many people don't know where to keep it safely, so they end up saving it in a notepad file, texting it to themselves, or just leaving a browser tab open forever.

**API Key SafePass** stores all these strings like a **digital drawer with a lock on it**. You only need to remember one password (called the "master password"), and everything you've stored inside can be safely retrieved with it.

### Can I follow along even if I'm not good with computers?

Yes. This guide explains even basic things like:

- **Double-click**: pressing the left mouse button twice, quickly, in a row. Used to "open" a program or file.
- **Folder**: a yellow (or blue) box-shaped icon used to organize files on your computer — similar to a drawer or a physical folder.
- **Download**: bringing a file from the internet onto your own computer. It usually ends up in your "Downloads" folder.
- **Address bar**: the long input box at the top of your web browser (Chrome, Edge, etc.) where you type a website's address.

### Is this program safe?

Yes. This program **has no server connected to the internet at all.** Anything you save stays only on your own computer and is never sent anywhere. The technical reasoning is explained in the [Security section of README.en.md](./README.en.md#security--data-flow), but this guide focuses purely on how to use it.

---

## What You'll Need

| Item | Description |
|---|---|
| A Windows computer | A desktop or laptop running Windows 10 or Windows 11. (No phone version exists yet.) |
| Internet access | **Only for Step 1 (downloading).** You can turn it off afterward and still use the app. |
| A few minutes | About 5–10 minutes from download to first use. |

---

## Step 1 — Download the Program

1. Open a web browser on your computer. Usually you'll find a blue circle icon (Microsoft Edge) or a circle made of red/yellow/green/blue (Google Chrome) on your desktop or taskbar (the bar at the bottom of the screen) — double-click it.
2. Click once on the long input box at the very top of the browser window (the address bar).
3. Type the following address exactly, then press `Enter` on your keyboard.

   ```
   https://github.com/sodam-ai/API-Key-SafePass/releases
   ```

4. A page appears showing "v0.1.0" with a green "Latest" label.
5. Scroll down a little using your mouse wheel until you see a section labeled **"Assets."** Click it to expand the file list.
6. Find and click the following file. **The file name must match exactly:**

   ```
   API.Key.SafePass_0.1.0_x64-setup.exe
   ```

   > Why this one? It's the "installer" version, which registers cleanly in your program list and is easy to uninstall later. (See [README.en.md's Download section](./README.en.md#download) for what the other files are for.)

7. Clicking it starts the download automatically. You'll see a "downloading" indicator near the bottom or top-right of the browser. Wait for it to finish (usually just a few seconds — the file is only about 1.8MB).
8. Once done, the file is usually saved automatically to your "Downloads" folder. If you're not sure where that is, press the `Windows logo key`, type "Downloads," and press `Enter` to open it.

---

## Step 2 — Install It

1. Double-click the downloaded `API.Key.SafePass_0.1.0_x64-setup.exe` file.
2. **You may see a blue screen with a "Windows protected your PC" warning.** Don't panic — this isn't a virus. It appears because this program hasn't yet gone through the official (and paid) process of registering itself with Windows as a verified publisher.
   - Click the gray text that says **"More info."**
   - A new button labeled **"Run anyway"** appears below it — click that.

   > Why you can trust this: this program's entire source code is publicly available online (open source). Even without technical expertise, you can rely on the fact that the developer has documented, down to the exact configuration file, that this app never secretly sends your data anywhere — see [README.en.md's Security section](./README.en.md#security--data-flow).

3. An installation screen appears. If asked to choose an install location, you don't need to change anything — just keep clicking "Next" or "Install."
4. When you see "Installation Complete" or "Finish," click it.
5. Now press the `Windows logo key`, type "API Key SafePass," and the program will appear in the search results.

---

## Step 3 — First Launch and Setting a Password

1. Press the `Windows logo key`, type "API Key SafePass," and click (or double-click) the program in the search results to launch it.
2. A window with a dark background and white text opens, and after a moment a "Set Master Password" screen appears.
3. **What is a master password?** It's the single key that locks and unlocks the entire program. Just like a banking app password, we recommend choosing a password you don't use anywhere else.
4. Type your chosen password into the input box.
   - Avoid overly simple passwords (`123456`, `password`, etc.).
   - We recommend at least 8 characters, mixing letters and numbers.
   - **You must remember this password.** Keep it somewhere safe (in your memory, or in a secure note unrelated to this program).
5. If there's a confirmation field, type the same password again.
6. Click "Set" or "Create."

### The most important moment — your recovery key

7. As soon as you set your password, the screen shows a **"recovery key"** — a long string of letters and numbers — exactly once.

   > **Do not just click "OK" and move on here.**
   > This recovery key is your only emergency way back in if you ever forget your master password. **This screen will never appear again.**

8. Save your recovery key using one of the following methods:
   - Write it down by hand on paper and keep it somewhere safe (a notebook, a drawer, etc.)
   - Take a photo with your phone and store it somewhere secure, unrelated to this program (e.g., a password-protected notes app)
   - Press `Windows logo key + Shift + S` to capture part of the screen, and save the captured image in a secure folder
9. Once you've safely saved your recovery key, click "OK" or "Next" on the screen.

---

## Step 4 — Save Your First Key

1. Click the **"+"** button on the left side of the program window to create a project (an organizing folder). You can name it anything (e.g., "My First Project").
2. Once the project is created, you'll see a round **"+"** button in the bottom-right corner. Click it.
3. A key-registration screen appears. Fill in the following:
   - **Name**: something recognizable (e.g., "OpenAI Test Key")
   - **Value**: paste or type in the actual API key string
   - The remaining fields (provider, notes, etc.) are optional — feel free to leave them blank.
4. Click "Save." If the key you just added appears in the list, you've succeeded.

---

## Step 5 — Find and Copy a Saved Key

1. On your keyboard, hold down `Ctrl` and press `K` at the same time (`Ctrl+K`).
2. A search box appears at the top of the screen. Type part of the key's name, and results appear below instantly.
3. Once you've found the key you want, click the copy icon next to it (looks like two overlapping squares).
4. That value is now copied to your clipboard. Go to wherever you need it (e.g., another program's input field) and press `Ctrl+V` to paste it.
5. Note: the copied value automatically disappears from your clipboard after a set time (30 seconds by default) — a safety measure so that an accidental `Ctrl+V` later doesn't paste your old key value somewhere unintended.

---

## Everyday Use

- **When you open the app**: enter your master password to unlock it.
- **When you need a key**: `Ctrl+K` to search → click the copy icon → paste it wherever you need it.
- **When you're done**: press `Ctrl+L` to lock immediately. Even if you don't, it locks automatically after a period of inactivity.

---

## Things You Must Never Do

- **Never lose your master password and recovery key at the same time.** This program was deliberately built so that not even the developers can unlock it for you (that absence of a backdoor is what makes it secure). Losing both means your data cannot be recovered.
- **Never save your recovery key back inside this program.** A recovery key only serves its purpose if it's kept somewhere "outside" this program.
- **Never share your master password or recovery key with anyone you don't fully trust.** Anyone who knows both can view everything you've stored.

---

## If Something Goes Wrong

| Situation | What to try |
|---|---|
| A blue warning screen appears during installation | This is normal — click "More info" then "Run anyway," in that order. (See [Step 2](#step-2--install-it)) |
| I forgot my password | Choose "Log in with recovery key" on the unlock screen, and enter the recovery key you saved earlier. |
| I don't know where my recovery key is | Unfortunately, there's no way to recover your data. You'll need to reinstall and start fresh. |
| The program won't launch | Try restarting your computer. If that doesn't help, make sure Windows is fully updated. |
| Something else | Check the [Troubleshooting table in README.en.md](./README.en.md#troubleshooting), or leave a report on [GitHub Issues](https://github.com/sodam-ai/API-Key-SafePass/issues). |

---

## Frequently Asked Questions

**Q. Can I use it without internet?**
A. Yes. You only need internet to download it — actual use afterward requires no internet connection.

**Q. Is my information sent anywhere?**
A. No. This program is built so that it never sends anything over the internet. All your information stays only on your own computer.

**Q. Can I use it on my phone?**
A. Not yet — it's currently Windows-computer only.

**Q. How do I move my data to another computer?**
A. Use "Settings → Backup" inside the program to create a backup file, then use "Settings → Restore" on the other computer to load it. See [README.en.md](./README.en.md#usage--how-it-works) for details.

---

## Cost and Terms of Use

This program is **free**, and you may use it freely — personally or at work. The exact terms of use (Apache License 2.0) are detailed in [README.en.md's Legal section](./README.en.md#legal--copyright--license--commercial-use) and in the repository's `LICENSE` file. This guide focuses on usage instructions, not the legal fine print.

---

<div align="center">

Want more detail? Check out [README.en.md](./README.en.md).
Something wrong? Leave a report on [GitHub Issues](https://github.com/sodam-ai/API-Key-SafePass/issues).

</div>
