<div align="center">

<br/><br/>

# 🧬 OmniLab

### The Cognitive AI Operating System

*Run powerful AI workflows locally. No clouds. No limits. Pure intelligence.*

[![Proprietary](https://img.shields.io/badge/License-Proprietary-000000?style=for-the-badge&labelColor=1a1f3a)](https://github.com/BryanParreira/OmniLab)
[![Ollama Integrated](https://img.shields.io/badge/Ollama-v0.1+-00C8FF?style=for-the-badge&labelColor=1a1f3a&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgc3Ryb2tlPSIjMDBDOEZGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=)](https://ollama.ai)
[![Cross Platform](https://img.shields.io/badge/macOS%20%7C%20Windows%20%7C%20Linux-Supported-00C8FF?style=for-the-badge&labelColor=1a1f3a)](https://github.com/BryanParreira/OmniLab/releases)
[![Made by Bryan Bernardo Parreira](https://img.shields.io/badge/Author-Bryan%20Bernardo%20Parreira-9D4EDD?style=for-the-badge&labelColor=1a1f3a)](https://github.com/BryanParreira)

<br/><br/>

---

## 🚀 Quick Start

Download OmniLab for your platform:

| Platform | Download | Architecture |
|:---:|:---:|:---:|
| **🍎 macOS** | [.dmg](https://github.com/BryanParreira/OmniLab/releases) | Intel & Apple Silicon |
| **🪟 Windows** | [.exe](https://github.com/BryanParreira/OmniLab/releases) | x86_64 & ARM64 |
| **🐧 Linux** | [.AppImage](https://github.com/BryanParreira/OmniLab/releases) | Universal |

### Prerequisites

Before launching, ensure you have:
- **[Ollama](https://ollama.ai)** installed (port 11434)
- **[Git](https://git-scm.com)** installed (for Forge mode)

<br/>

---

## 🧠 What is OmniLab?

OmniLab is **not** a chatbot. It's a **local-first workspace** for heavy intellectual lifting—designed for engineers, architects, researchers, and writers who demand total privacy, zero latency, and raw cognitive power.

Every interaction stays on your machine. Every model runs locally through Ollama. Every decision remains yours.

<br/>

---

## 🎯 Cognitive States

OmniLab operates in two distinct modes, each engineered for a specific class of intellectual work:

### 🔴 Forge Mode
**For Engineers & Architects**

The thinking environment for builders. Move faster. Ship better.

- **⚙️ Blueprint Engine** — Scaffold entire project structures in seconds. Define folder hierarchies, boilerplate code, and config files through natural language. OmniLab writes the architecture directly to your filesystem.

- **🔍 Diff Doctor** — Integrated with Git. Analyze your uncommitted changes (`git diff`), surface bugs before they're committed, and auto-generate thoughtful commit messages. Never push incomplete work again.

- **🧹 Refactor** — Context-aware code cleaning. Improve readability, consistency, and maintainability without breaking functionality.

<br/>

### 🔵 Nexus Mode
**For Researchers & Writers**

The thinking environment for synthesis. Learn deeper. Remember better.

- **📇 Flashpoint** — Upload PDFs, research papers, or notes. OmniLab instantly transforms them into spaced-repetition flashcards. Build active recall workflows at scale.

- **🎙️ Podcast Protocol** — Complex synthesis deserves a voice. Text-to-speech rendering turns long-form summaries and analyses into listenable audio. Learn while you commute.

- **🔗 Deep Context** — Semantic vector search across document collections. Find connections your linear brain might miss. Navigate ideas across hundreds of pages in milliseconds.

<br/>

---

## 🧪 The Lab Bench

The centerpiece of OmniLab's interface. A **split-screen artifact viewer** that breaks window-switching hell.

**What it does:**
- **📺 Live HTML/JS Previews** — See rendered code side-by-side with the chat
- **📝 Full-Height Code Reviews** — Inspect complex files without scrolling chaos
- **📇 Flashcard Flipping** — Study while you chat, zero context loss
- **⚡ Seamless Switching** — Flip between modes without ever leaving the workspace

The Lab Bench is where **thinking and building converge**.

<br/>

---

## 🔒 Privacy First

OmniLab is built on a single principle: **your data never leaves your machine**.

✅ **100% Local** — Ollama runs on your hardware. No API calls. No analytics. No servers.

✅ **Proprietary Models** — Bring your own model via Ollama. Use Llama 2, Mistral, or any GGUF-compatible model.

✅ **Zero Telemetry** — OmniLab doesn't phone home. Ever.

✅ **Open Connections** — Works offline after launch (except for initial Ollama downloads).

This is **cognitive AI without compromise**.

<br/>

---

## 🛠 System Requirements

| Requirement | Details |
|:---|:---|
| **Operating System** | macOS 11+, Windows 10+, Ubuntu 20.04+ |
| **RAM** | 8GB minimum (16GB recommended for large models) |
| **Disk Space** | 20GB+ free space (for models) |
| **Ollama** | Latest version, running on port `11434` |
| **Git** | Latest version (Forge mode only) |

<br/>

---

## 📦 Installation & Setup

### Step 1: Install Ollama
Download and install [Ollama](https://ollama.ai). Verify it's running:

```bash
curl http://localhost:11434/api/tags
```

### Step 2: Download OmniLab
Grab your platform's binary from [Releases](https://github.com/BryanParreira/OmniLab/releases).

### Step 3: Launch
Double-click the installer or executable. OmniLab auto-detects Ollama on startup.

### Step 4: Choose Your Mode
Select **Forge** or **Nexus** from the home screen and start thinking.

<br/>

---

## 🎮 Usage Examples

### Forge Mode

```
Prompt: "Create a Next.js SaaS starter with TypeScript, Tailwind, and Stripe"

Result: OmniLab scaffolds 20+ files instantly:
├── src/
│   ├── pages/
│   ├── components/
│   └── lib/
├── tailwind.config.ts
├── stripe.config.ts
└── package.json
```

Then analyze a code change before committing:

```bash
git diff
```

OmniLab detects the issue, flags it, writes the commit message.

### Nexus Mode

```
Upload: research_paper.pdf + notes.md

OmniLab creates:
✓ 50 active-recall flashcards
✓ Searchable vector index
✓ 15-minute audio summary (Podcast Protocol)
```

Open the **Lab Bench** → flip between flashcards and chat. Study while you think.

<br/>

---

## 📊 OmniLab vs. Traditional Chatbots

| Feature | OmniLab | Generic Chatbot |
|:---|:---:|:---:|
| Local-First | ✅ Always | ❌ Cloud-dependent |
| Code Scaffolding | ✅ Full projects | ❌ Snippets only |
| Git Integration | ✅ Native | ❌ None |
| Flashcard System | ✅ Automatic | ❌ Manual/External |
| Audio Synthesis | ✅ Built-in | ❌ Copy-paste |
| Split-Screen Bench | ✅ Native UI | ❌ Multiple windows |
| Privacy | ✅ Bulletproof | ❌ Terms of Service |

<br/>

---

## 🔗 Important Links

| Link | Purpose |
|:---|:---|
| 🏠 [GitHub Repository](https://github.com/BryanParreira/OmniLab) | Code, docs, discussions |
| 📥 [Releases & Downloads](https://github.com/BryanParreira/OmniLab/releases) | Latest builds (macOS, Windows, Linux) |
| 🐛 [Issue Tracker](https://github.com/BryanParreira/OmniLab/issues) | Report bugs or suggest features |

<br/>

---

## ⚖️ License & Legal

**OmniLab** is proprietary software.

- 📜 **License:** Proprietary / Closed Source
- 👤 **Copyright:** © 2024 Bryan Bernardo Parreira. All Rights Reserved.
- ✅ **Usage:** Free to use for personal and commercial purposes
- ❌ **Restrictions:** Modification, reverse engineering, or redistribution is prohibited

For questions about licensing or usage rights, [open an issue](https://github.com/BryanParreira/OmniLab/issues).

<br/>

---

## 🤝 Support & Community

Encounter a bug? Have an idea? [**Open an issue on GitHub.**](https://github.com/BryanParreira/OmniLab/issues)

This is a solo project built with obsessive attention to detail. Your feedback shapes the roadmap.

<br/>

---

<br/>

<div align="center">

**Built with ⚡ by [Bryan Bernardo Parreira](https://github.com/BryanParreira)**

*The operating system for cognitive work.*

![OmniLab Badge](https://img.shields.io/badge/OmniLab-v1.0-00C8FF?style=flat-square&labelColor=0a0e27)

</div>

</div>
