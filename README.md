<div align="center">

<img src="icon.png" alt="Brainless Logo" width="120" height="120">

# Brainless

### The Cognitive AI Operating System

**Run powerful AI workflows locally. No clouds. No limits. Pure intelligence.**

[![Download](https://img.shields.io/badge/Download-Latest-blue?style=for-the-badge)](https://github.com/bryanparreira/Brainless/releases)
[![Documentation](https://img.shields.io/badge/Docs-Read-green?style=for-the-badge)](https://github.com/bryanparreira/Brainless/wiki)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

</div>

---

## 🎯 What is Brainless?

**Brainless is not a chatbot**—it's a **local-first cognitive workspace** engineered for heavy intellectual lifting. Built for engineers, architects, researchers, and writers who demand total privacy, zero latency, and uncompromising computational power.

- **🔒 Every interaction stays on your machine**
- **⚡ Every model runs locally through Ollama**
- **🎯 Every decision remains yours**

---

## 🚀 Quick Start

### Prerequisites

Before installing Brainless, ensure you have:

- **Ollama** runtime with Gemma 3 model
- **Git** (optional, for Forge mode)

---

### 🛠️ Step 1: Install Ollama & Download Gemma 3

Brainless relies on Ollama to run local models. Follow these steps to set it up:

#### Install Ollama Runtime

**macOS:**

```bash
# Download and install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Or download the installer
open https://ollama.com/download/mac
```

**Windows:**

```powershell
# Download the installer from:
https://ollama.com/download/windows

# Or use winget
winget install Ollama.Ollama
```

**Linux:**

```bash
# Install Ollama with one command
curl -fsSL https://ollama.com/install.sh | sh
```

#### Download Gemma 3 Model

After installing Ollama, download the Gemma 3 4B model:

```bash
ollama pull gemma3:4b
```

**Verify installation:**

```bash
ollama run gemma3:4b
```

You should see `>>>` prompt. Type `/bye` to exit. You're ready! ✅

---

### 📥 Step 2: Install Brainless

<div align="center">

|                                           🍎 macOS                                            |                                       🪟 Windows                                       |                                           🐧 Linux                                            |
| :-------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------------------: |
| [Download .dmg](https://github.com/bryanparreira/Brainless/releases)<br>Intel & Apple Silicon | [Download .exe](https://github.com/bryanparreira/Brainless/releases)<br>x86_64 & ARM64 | [Download .AppImage](https://github.com/bryanparreira/Brainless/releases)<br>Universal Binary |

</div>

#### Setup Steps

1. Download the appropriate installer for your platform
2. Install Brainless (drag to Applications on macOS, run installer on Windows/Linux)
3. Launch Brainless—it automatically detects Ollama on startup
4. Select **Forge** or **Nexus** mode from the home screen
5. Start building! 🚀

---

## ⚡ Core Features

### 🎨 Canvas: Visual Thinking Space

**Mind-mapping meets architecture diagrams**—an infinite canvas for visual brainstorming and system design.

- **Node-based thinking**: Create interconnected ideas, components, and concepts
- **AI-powered expansion**: Select any node → AI generates related concepts
- **Auto-layout**: Organize complex diagrams with one click
- **Export to projects**: Turn Canvas nodes into Chronos events or project files
- **Multiple node types**: Notes, files, databases, components, tasks, documentation

**Use Cases:**

- System architecture planning
- Project roadmapping
- Knowledge mapping
- Brainstorming sessions
- Database schema design

---

### ✍️ Zenith: Creative Writing Suite

**Professional writing environment** with AI-powered assistance and real-time intelligence.

#### Writing Modes

- **Freewrite**: Pure creativity, no constraints
- **Structured**: Organized sections and outlines
- **Research**: Academic writing with formal language
- **Creative**: Fiction and narrative storytelling

#### Features

- **Ghost Writer (Cmd+J)**: AI text completion that adapts to your writing mode
- **Lumina Lens**: Select text → Expand, Simplify, or Fix Grammar instantly
- **Live Stats**: Word count, complexity analysis, read time
- **Focus Mode**: Distraction-free fullscreen writing
- **Export Formats**: Markdown, HTML, Plain Text
- **Auto-save**: Never lose your work

**Perfect for:**

- Essays and articles
- Creative writing
- Documentation
- Research papers
- Blog posts

---

### 📅 Chronos: Calendar & Event Management

**Smart calendar** with voice commands and intelligent event handling.

#### Features

- **Voice Commands**: "Schedule meeting with John tomorrow at 3pm"
- **Better Date/Time Pickers**: Native dark mode support
- **Event Types**: Meeting, deadline, task, study session, personal
- **Priority Levels**: High, medium, low with visual indicators
- **Calendar Views**: Month, week, day views
- **Quick Add**: Create events in seconds with natural language

#### Voice Commands Examples

```
"Add meeting with Sarah next Monday at 2pm"
"Schedule dentist appointment for March 15th at 10am"
"Create deadline for project submission on Friday"
```

---

### 💬 Chat: AI Conversations

**Multi-modal chat** with drag-and-drop file uploads and rich context.

#### Features

- **Image Analysis**: Upload images → AI describes and analyzes
- **Document Chat**: PDF/text file analysis and Q&A
- **Voice Input**: Speak your prompts (Whisper integration)
- **Code Execution**: Run Python/Node.js code in real-time
- **File Attachments**: Drag & drop images, PDFs, documents
- **Session Management**: Organize conversations by project
- **Model Selection**: Choose from any Ollama model

#### Supported File Types

- 📄 Documents: PDF, TXT, MD, DOCX
- 🖼️ Images: PNG, JPG, WEBP, GIF
- 💾 Data: CSV, JSON, YAML
- 🎤 Audio: Voice recordings (via microphone)

---

### 🏠 Command Center (Home Dashboard)

**Your cognitive HQ**—see everything at a glance.

#### Today at a Glance

- **Stats Grid**: Today's events, active projects, recent chats, canvas nodes
- **Today's Schedule**: All events with priority indicators
- **Recent Activity**: Latest chats, projects, and edits

#### Quick Launch Pad

Four gorgeous cards to jump into any workspace:

- **Canvas** (Blue): Visual thinking → Shows node count
- **Zenith** (Amber): Writing suite → Ready to write
- **Chronos** (Purple): Calendar → Today's events
- **Chat** (Green): Conversations → Recent activity

---

### 🔧 Projects & Organization

**Project-based workflow** for organizing related work.

- Create projects with file attachments
- Associate chat sessions with projects
- Export Canvas nodes to project files
- Link Chronos events to project timelines
- Organized sidebar navigation

---

## 🎨 Design Philosophy

### Dark Theme First

- Carefully crafted dark UI with high contrast
- Glass morphism effects and subtle animations
- Consistent color coding across features
- Reduced eye strain for long sessions

### Keyboard-First Navigation

- **Cmd+J**: AI Ghost Writer (Zenith)
- **Cmd+S**: Save document
- **Cmd+K**: Command palette (Chat)
- **Tab**: Accept AI suggestions
- **Escape**: Close modals/exit focus mode

### Cross-Feature Integration

- Canvas → Chronos: Export nodes as calendar events
- Chronos → Canvas: Visualize deadlines as architecture
- Chat → Projects: Save conversations to project context
- Zenith → Projects: Documents automatically filed

---

## 🔒 Privacy & Security

Brainless is built on a single principle: **your data never leaves your machine.**

| Feature                   | Guarantee                                                     |
| ------------------------- | ------------------------------------------------------------- |
| **100% Local Processing** | All AI runs on your hardware via Ollama                       |
| **Zero Cloud Dependency** | No API calls, no external servers, no tracking                |
| **Complete Privacy**      | Your conversations, documents, and data stay private          |
| **No Telemetry**          | Brainless never phones home                                   |
| **Offline Capable**       | Works fully offline after initial setup                       |
| **Open Model Support**    | Use any Ollama-compatible model (Llama, Mistral, Gemma, etc.) |

**This is cognitive AI without compromise.**

---

## 📊 Feature Comparison

|                             | Brainless | Generic Chatbot | Traditional Tools |
| --------------------------- | :-------: | :-------------: | :---------------: |
| **Local-First AI**          |    ✅     |       ❌        |        N/A        |
| **Visual Canvas**           |    ✅     |       ❌        |      Limited      |
| **Writing Suite**           |    ✅     |      Basic      |   Separate app    |
| **Calendar Integration**    |    ✅     |       ❌        |   Separate app    |
| **Multi-modal Chat**        |    ✅     |     Limited     |        ❌         |
| **Voice Commands**          |    ✅     |     Limited     |        ❌         |
| **Cross-Feature Workflows** |    ✅     |       ❌        |      Manual       |
| **Privacy Guarantee**       | Absolute  |  ToS-dependent  |    Cloud-based    |
| **Project Management**      |  Native   |       ❌        |   Separate app    |

---

## 💻 System Requirements

| Component            | Minimum                               | Recommended                     |
| -------------------- | ------------------------------------- | ------------------------------- |
| **Operating System** | macOS 11+, Windows 10+, Ubuntu 20.04+ | Latest stable release           |
| **RAM**              | 8GB                                   | 16GB+                           |
| **Disk Space**       | 10GB free                             | 20GB+ free                      |
| **CPU**              | Dual-core                             | Quad-core+                      |
| **GPU**              | Optional                              | NVIDIA/AMD for faster inference |
| **Ollama**           | Latest version                        | Latest version                  |
| **Internet**         | For initial setup only                | Offline after setup             |

---

## 💡 Usage Examples

### Example 1: Research Paper → Knowledge System

```
1. Open Chat → Upload research paper (PDF)
2. Ask: "Summarize the key findings and methodology"
3. Create Canvas nodes for each major concept
4. Schedule reading sessions in Chronos
5. Write literature review in Zenith
6. Export everything to project folder
```

### Example 2: Project Planning Workflow

```
1. Create Canvas → Map out system architecture
2. Add nodes for: Database, API, Frontend, Testing
3. Export Canvas → Chronos: Generate development timeline
4. Create project in sidebar
5. Use Zenith to write technical specs
6. Chat with AI about implementation details
```

### Example 3: Writing & Editing

```
1. Open Zenith → Select "Research" mode
2. Write first draft with Ghost Writer assistance (Cmd+J)
3. Select sections → Use Lumina Lens to improve
4. Check complexity score (should be "Clear" or "Academic")
5. Export as Markdown or HTML
6. Save to project folder
```

---

## 🎯 Workflow Examples

### For Developers

```
Morning:
- Check Command Center for today's deadlines
- Review Canvas for current project architecture
- Chat with AI about implementation approach
- Schedule focus blocks in Chronos

During Work:
- Use Canvas for system design
- Chat for code questions and debugging
- Zenith for documentation
- Voice commands to add meetings

Evening:
- Review daily progress in Command Center
- Update project timelines in Chronos
- Write dev journal in Zenith
```

### For Writers

```
- Start in Zenith with "Creative" mode
- Use Ghost Writer for inspiration (Cmd+J)
- Lumina Lens to refine sentences
- Track word count and complexity in real-time
- Schedule writing sessions in Chronos
- Organize pieces by project
```

### For Students

```
- Upload lecture notes and papers to Chat
- Create mind maps in Canvas
- Generate study schedules in Chronos
- Write essays in Zenith with "Research" mode
- Use Focus Mode for distraction-free studying
```

---

## 🔗 Resources

- 📦 [**GitHub Repository**](https://github.com/bryanparreira/Brainless) — Source & development
- ⬇️ [**Releases**](https://github.com/bryanparreira/Brainless/releases) — Latest builds for all platforms
- 🐛 [**Issue Tracker**](https://github.com/bryanparreira/Brainless/issues) — Bug reports & feature requests
- 📖 [**Documentation**](https://github.com/bryanparreira/Brainless/wiki) — Comprehensive guides
- 💬 [**Discussions**](https://github.com/bryanparreira/Brainless/discussions) — Community & support

---

## 🛠️ Troubleshooting

### Ollama Not Detected

```bash
# Check if Ollama is running
ollama list

# Restart Ollama service
# macOS/Linux:
killall ollama && ollama serve

# Windows:
# Restart Ollama from system tray
```

### Model Not Found

```bash
# Verify model is downloaded
ollama list

# Re-download if needed
ollama pull gemma3:4b
```

### Performance Issues

- **Slow AI responses?** → Use a smaller model (e.g., `gemma3:2b`)
- **High memory usage?** → Close unused apps
- **Model loading slow?** → Ensure Ollama is running before launching Brainless

### Common Issues

| Issue                      | Solution                                        |
| -------------------------- | ----------------------------------------------- |
| "Cannot connect to Ollama" | Ensure Ollama is running on port 11434          |
| "Model not available"      | Run `ollama pull gemma3:4b`                     |
| Files not saving           | Check disk space and permissions                |
| Voice input not working    | Grant microphone permissions in system settings |

---

## 🗺️ Roadmap

### Coming Soon

- 🔍 **Semantic Search**: Find anything across all your documents
- 📊 **Analytics Dashboard**: Track your productivity and writing habits
- 🔄 **Sync Options**: Optional encrypted cloud backup (opt-in only)
- 🎨 **Theme Editor**: Customize colors and appearance
- 🌍 **Multi-language Support**: Interface localization
- 📱 **Mobile Companion**: View-only mobile app for reviewing work

### Under Consideration

- Plugin system for community extensions
- Advanced Canvas features (layers, templates, sharing)
- Collaborative features (optional, local network only)
- Integration with more local AI models

---

## 📄 License

Brainless is proprietary software.

```
License:      Proprietary / Closed Source
Copyright:    © 2024 Bryan Bernardo Parreira. All Rights Reserved.
Usage:        Free for personal and commercial purposes
Restrictions: Modification, reverse engineering, or redistribution is prohibited
```

**You are free to:**

- ✅ Use Brainless for personal projects
- ✅ Use Brainless for commercial work
- ✅ Run Brainless on unlimited devices you own

**You may not:**

- ❌ Modify or reverse engineer the source code
- ❌ Redistribute or resell Brainless
- ❌ Remove copyright notices or branding

For licensing questions, please [open an issue](https://github.com/bryanparreira/Brainless/issues).

---

## 🤝 Contributing & Support

### Found a Bug?

[→ Report it on GitHub Issues](https://github.com/bryanparreira/Brainless/issues)

### Have a Feature Request?

[→ Start a discussion](https://github.com/bryanparreira/Brainless/discussions)

### Need Help?

[→ Check the wiki](https://github.com/bryanparreira/Brainless/wiki) or [ask the community](https://github.com/bryanparreira/Brainless/discussions)

---

## 🙏 Acknowledgments

Brainless is built with:

- **Electron** - Cross-platform framework
- **React** - UI framework
- **Ollama** - Local AI inference engine
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide Icons** - Beautiful iconography

Special thanks to the open-source community for making local AI accessible to everyone.

---

<div align="center">

**Built with ❤️ by [Bryan Bernardo Parreira](https://github.com/bryanparreira)**

_The operating system for cognitive work._

![GitHub stars](https://img.shields.io/github/stars/bryanparreira/Brainless?style=social)
![GitHub forks](https://img.shields.io/github/forks/bryanparreira/Brainless?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/bryanparreira/Brainless?style=social)

---

**⭐ Star this repo if Brainless helps you think better!**

</div>
