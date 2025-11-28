<div align="center">

<br />

![OmniLab Logo](src/assets/logo.png)

# **OmniLab**

### The Cognitive AI Operating System
*Run powerful AI workflows locally. No clouds. No limits. Pure intelligence.*

[![Proprietary](https://img.shields.io/badge/License-Proprietary-black?style=for-the-badge)](https://github.com/BryanParreira/OmniLab)
[![Open Source](https://img.shields.io/badge/Ollama-Integrated-blue?style=for-the-badge)](https://ollama.ai)
[![Cross Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-orange?style=for-the-badge)](#download)
[![Made by Bryan Bernardo Parreira](https://img.shields.io/badge/Author-Bryan%20Bernardo%20Parreira-purple?style=for-the-badge)](https://github.com/BryanParreira)

<br />

---

## 🚀 Quick Start

### Download OmniLab

<table>
<tr>
<td align="center">
<a href="https://github.com/BryanParreira/OmniLab/releases">
<img src="https://img.shields.io/badge/macOS-Download-black?style=flat-square&logo=apple" alt="macOS Download" />
<br/><sub><strong>.dmg</strong> — Intel & Apple Silicon</sub>
</a>
</td>
<td align="center">
<a href="https://github.com/BryanParreira/OmniLab/releases">
<img src="https://img.shields.io/badge/Windows-Download-0078D4?style=flat-square&logo=windows" alt="Windows Download" />
<br/><sub><strong>.exe</strong> — x86_64</sub>
</a>
</td>
<td align="center">
<a href="https://github.com/BryanParreira/OmniLab/releases">
<img src="https://img.shields.io/badge/Linux-Download-FCC624?style=flat-square&logo=linux" alt="Linux Download" />
<br/><sub><strong>.AppImage</strong> — Universal</sub>
</a>
</td>
</tr>
</table>

### Prerequisites

Before launching OmniLab, ensure you have:

- **[Ollama](https://ollama.ai)** — Local LLM inference engine (running on port 11434)
- **[Git](https://git-scm.com)** — Version control (required for Forge mode)

---

## 🧠 What Is OmniLab?

OmniLab is not a chatbot. It's a **local-first workspace** for heavy intellectual lifting. Built for engineers, architects, researchers, and writers who demand total privacy, zero latency, and raw cognitive power.

Every interaction stays on your machine. Every model runs locally through Ollama. Every decision remains yours.

---

## 🎯 Cognitive States

OmniLab operates in two distinct modes, each engineered for a specific class of intellectual work:

<table>
<tr>
<td width="50%" align="left" valign="top">

### 🔴 **Forge Mode**
*For Engineers & Architects*

The thinking environment for builders. Move faster. Ship better.

#### ⚙️ Blueprint Engine
Scaffold entire project structures in seconds. Define folder hierarchies, boilerplate code, and config files through natural language. OmniLab writes the architecture directly to your filesystem.

#### 🔍 Diff Doctor
Integrated with Git. Analyze your uncommitted changes (`git diff`), surface bugs before they're committed, and auto-generate thoughtful commit messages. Never push incomplete work again.

#### 🧹 Refactor
Context-aware code cleaning. Improve readability, consistency, and maintainability without breaking functionality.

</td>
<td width="50%" align="left" valign="top">

### 🔵 **Nexus Mode**
*For Researchers & Writers*

The thinking environment for synthesis. Learn deeper. Remember better.

#### 📇 Flashpoint
Upload PDFs, research papers, or notes. OmniLab instantly transforms them into spaced-repetition flashcards. Build active recall workflows at scale.

#### 🎙️ Podcast Protocol
Complex synthesis deserves a voice. Text-to-speech rendering turns long-form summaries and analyses into listenable audio. Learn while you commute.

#### 🔗 Deep Context
Semantic vector search across document collections. Find connections your linear brain might miss. Navigate ideas across hundreds of pages in milliseconds.

</td>
</tr>
</table>

---

## 🧪 The Lab Bench

The centerpiece of OmniLab's interface. A split-screen artifact viewer that breaks window-switching hell.

**What it does:**
- **Live HTML/JS Previews** — See rendered code side-by-side with the chat
- **Full-Height Code Reviews** — Inspect complex files without scrolling chaos
- **Flashcard Flipping** — Study while you chat, zero context loss
- **Seamless Switching** — Flip between modes without ever leaving the workspace

The Lab Bench is where thinking and building converge.

---

## 🔒 Privacy First

<div align="left">

OmniLab is built on a single principle: **your data never leaves your machine**.

- ✅ **100% Local** — Ollama runs on your hardware. No API calls. No analytics. No servers.
- ✅ **Proprietary Models** — Bring your own model via Ollama. Use Llama 2, Mistral, or any GGUF-compatible model.
- ✅ **Zero Telemetry** — OmniLab doesn't phone home. Ever.
- ✅ **Open Connections** — Works offline after launch (except for initial Ollama downloads).

This is cognitive AI without compromise.

</div>

---

## 🛠 System Requirements

| Requirement | Details |
|---|---|
| **OS** | macOS 11+, Windows 10+, Ubuntu 20.04+ |
| **RAM** | 8GB minimum (16GB recommended for large models) |
| **Disk** | 20GB+ free space (for models) |
| **Ollama** | Latest version, running on port `11434` |
| **Git** | Latest version (Forge mode only) |

---

## 📦 Installation & Setup

### 1️⃣ Install Ollama
Download and install [Ollama](https://ollama.ai). Verify it's running:
```bash
curl http://localhost:11434/api/tags
```

### 2️⃣ Download OmniLab
Grab your platform's binary from [Releases](https://github.com/BryanParreira/OmniLab/releases).

### 3️⃣ Launch
Double-click the installer or executable. OmniLab auto-detects Ollama on startup.

### 4️⃣ Choose Your Mode
Select **Forge** or **Nexus** from the home screen and start thinking.

---

## 🎮 Quick Tour

### Forge Mode Example
```
Prompt: "Create a Next.js SaaS starter with TypeScript, Tailwind, and Stripe integration"

Result: OmniLab scaffolds 20+ files:
├── src/
│   ├── pages/
│   ├── components/
│   └── lib/
├── tailwind.config.ts
├── stripe.config.ts
└── package.json
```

Then analyze a code change:
```bash
git diff
```
OmniLab detects the issue, flags it, writes the commit message.

### Nexus Mode Example
```
Upload: research_paper.pdf + notes.md

OmniLab creates:
- 50 active-recall flashcards
- Searchable vector index
- 15-minute audio summary (Podcast Protocol)
```

Open the **Lab Bench** → flip between flashcards and chat. Study while you think.

---

## 🔗 Links

| Link | Purpose |
|---|---|
| 🏠 [GitHub Repository](https://github.com/BryanParreira/OmniLab) | Code, docs, and discussions |
| 📥 [Downloads & Releases](https://github.com/BryanParreira/OmniLab/releases) | Latest builds (macOS, Windows, Linux) |
| 🐛 [Issue Tracker](https://github.com/BryanParreira/OmniLab/issues) | Report bugs or suggest features |

---

## ⚖️ License & Legal

**OmniLab** is proprietary software.

- 📜 **License:** Proprietary / Closed Source
- 👤 **Copyright:** © 2024 Bryan Bernardo Parreira. All Rights Reserved.
- ✅ **Usage:** Free to use for personal and commercial purposes
- ❌ **Restrictions:** Modification, reverse engineering, or redistribution is prohibited

For questions about licensing or usage rights, open an issue on [GitHub](https://github.com/BryanParreira/OmniLab/issues).

---

## 🤝 Support & Community

Encounter a bug? Have an idea? **[Open an issue](https://github.com/BryanParreira/OmniLab/issues).**

This is a solo project built with obsessive attention to detail. Your feedback shapes the roadmap.

---

## 🎨 What Makes OmniLab Different

| Feature | OmniLab | Generic Chatbot |
|---|---|---|
| Local-First | ✅ Always | ❌ Cloud-dependent |
| Code Scaffolding | ✅ Full projects | ❌ Snippets only |
| Git Integration | ✅ Native | ❌ None |
| Flashcard System | ✅ Automatic | ❌ Manual/External |
| Audio Synthesis | ✅ Built-in | ❌ Copy-paste |
| Split-Screen Bench | ✅ Native UI | ❌ Multiple windows |
| Privacy | ✅ Bulletproof | ❌ Terms of service |

---

<br />

<div align="center">

**Built by [Bryan Bernardo Parreira](https://github.com/BryanParreira)**

*The operating system for cognitive work.*

![OmniLab Badge](https://img.shields.io/badge/OmniLab-v1.0-blueviolet?style=flat-square)

</div>

</div>
