<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OmniLab - The Cognitive AI Operating System</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1829 100%);
            color: #e4e7eb;
            overflow-x: hidden;
            line-height: 1.6;
        }

        /* Animated Background Orbs */
        .orb {
            position: fixed;
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, rgba(0, 200, 255, 0.3), transparent);
            filter: blur(40px);
            pointer-events: none;
        }

        .orb-1 {
            width: 300px;
            height: 300px;
            top: -100px;
            right: -100px;
            animation: float 20s infinite ease-in-out;
        }

        .orb-2 {
            width: 200px;
            height: 200px;
            bottom: 100px;
            left: -50px;
            animation: float 25s infinite ease-in-out 2s;
        }

        .orb-3 {
            width: 250px;
            height: 250px;
            top: 50%;
            right: 10%;
            animation: float 22s infinite ease-in-out 4s;
        }

        @keyframes float {
            0%, 100% { transform: translate(0, 0); }
            50% { transform: translate(30px, -30px); }
        }

        /* Dot Pattern */
        .dot-pattern {
            position: absolute;
            width: 8px;
            height: 8px;
            background: #00c8ff;
            border-radius: 50%;
            opacity: 0.6;
        }

        .dot-1 { top: 100px; right: 15%; }
        .dot-2 { top: 280px; left: 12%; }
        .dot-3 { top: 180px; left: 20%; }
        .dot-4 { top: 330px; left: 18%; }
        .dot-5 { top: 420px; left: 25%; }

        /* Container */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
            position: relative;
            z-index: 2;
        }

        /* Header */
        header {
            padding: 80px 0 60px;
            text-align: center;
        }

        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #00c8ff, #0099cc);
            border-radius: 16px;
            margin: 0 auto 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            font-weight: bold;
            color: white;
            box-shadow: 0 20px 60px rgba(0, 200, 255, 0.2);
            animation: pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { box-shadow: 0 20px 60px rgba(0, 200, 255, 0.2); }
            50% { box-shadow: 0 20px 80px rgba(0, 200, 255, 0.4); }
        }

        h1 {
            font-size: 56px;
            font-weight: 700;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #ffffff, #a0d8ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .tagline {
            font-size: 20px;
            color: #a0d8ff;
            margin-bottom: 40px;
            font-weight: 300;
            letter-spacing: 0.5px;
        }

        .cta-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .btn {
            padding: 14px 32px;
            border-radius: 10px;
            border: none;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }

        .btn-primary {
            background: linear-gradient(135deg, #00c8ff, #0099cc);
            color: #0a0e27;
            box-shadow: 0 10px 30px rgba(0, 200, 255, 0.25);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 40px rgba(0, 200, 255, 0.35);
        }

        .btn-secondary {
            background: transparent;
            color: #00c8ff;
            border: 1.5px solid #00c8ff;
        }

        .btn-secondary:hover {
            background: rgba(0, 200, 255, 0.1);
            transform: translateY(-2px);
        }

        /* Download Section */
        .download-section {
            margin: 100px 0;
            padding: 80px 0;
            border-top: 1px solid rgba(0, 200, 255, 0.1);
        }

        .section-title {
            font-size: 40px;
            font-weight: 700;
            margin-bottom: 50px;
            text-align: center;
        }

        .download-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }

        .download-card {
            background: linear-gradient(135deg, rgba(0, 200, 255, 0.1), rgba(0, 150, 200, 0.05));
            border: 1px solid rgba(0, 200, 255, 0.2);
            border-radius: 16px;
            padding: 40px 30px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .download-card:hover {
            border-color: #00c8ff;
            background: linear-gradient(135deg, rgba(0, 200, 255, 0.15), rgba(0, 150, 200, 0.08));
            transform: translateY(-5px);
            box-shadow: 0 20px 50px rgba(0, 200, 255, 0.15);
        }

        .download-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }

        .download-card h3 {
            font-size: 20px;
            margin-bottom: 8px;
        }

        .download-card p {
            color: #7a8fa3;
            font-size: 14px;
            margin-bottom: 20px;
        }

        .download-card a {
            color: #00c8ff;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .download-card a:hover {
            color: #ffffff;
        }

        /* Modes Section */
        .modes-section {
            margin: 100px 0;
            padding: 80px 0;
        }

        .modes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }

        .mode-card {
            background: linear-gradient(135deg, rgba(20, 40, 70, 0.6), rgba(15, 30, 60, 0.4));
            border: 1px solid rgba(0, 200, 255, 0.2);
            border-radius: 20px;
            padding: 50px 40px;
            transition: all 0.4s ease;
            position: relative;
            overflow: hidden;
        }

        .mode-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #00c8ff, transparent);
        }

        .mode-card:hover {
            border-color: #00c8ff;
            background: linear-gradient(135deg, rgba(20, 40, 70, 0.8), rgba(15, 30, 60, 0.6));
            transform: translateY(-10px);
            box-shadow: 0 25px 60px rgba(0, 200, 255, 0.1);
        }

        .mode-icon {
            font-size: 56px;
            margin-bottom: 20px;
        }

        .mode-card h3 {
            font-size: 28px;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #ffffff, #00c8ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .mode-label {
            display: inline-block;
            font-size: 12px;
            font-weight: 700;
            color: #00c8ff;
            margin-bottom: 20px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .features-list {
            list-style: none;
        }

        .features-list li {
            margin-bottom: 16px;
            padding-left: 28px;
            position: relative;
            color: #a0d8ff;
            font-size: 15px;
            line-height: 1.6;
        }

        .features-list li::before {
            content: '→';
            position: absolute;
            left: 0;
            color: #00c8ff;
            font-weight: bold;
        }

        /* Lab Bench Section */
        .lab-bench-section {
            margin: 100px 0;
            padding: 100px 0;
        }

        .bench-content {
            background: linear-gradient(135deg, rgba(0, 200, 255, 0.08), rgba(0, 150, 200, 0.04));
            border: 1px solid rgba(0, 200, 255, 0.15);
            border-radius: 24px;
            padding: 60px;
            text-align: center;
        }

        .bench-icon {
            font-size: 64px;
            margin-bottom: 30px;
        }

        .bench-content h3 {
            font-size: 36px;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #ffffff, #00c8ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .bench-content p {
            font-size: 16px;
            color: #a0d8ff;
            margin-bottom: 30px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            line-height: 1.8;
        }

        .bench-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }

        .bench-feature {
            background: rgba(0, 200, 255, 0.05);
            border: 1px solid rgba(0, 200, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            font-size: 14px;
            color: #7a8fa3;
        }

        /* Privacy Section */
        .privacy-section {
            margin: 100px 0;
            padding: 80px 0;
            border-top: 1px solid rgba(0, 200, 255, 0.1);
        }

        .privacy-content {
            max-width: 700px;
            margin: 0 auto;
            text-align: center;
        }

        .privacy-content h3 {
            font-size: 32px;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #ffffff, #00c8ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .privacy-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }

        .privacy-item {
            background: rgba(0, 200, 255, 0.05);
            border: 1px solid rgba(0, 200, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            font-size: 14px;
            color: #7a8fa3;
        }

        .privacy-item strong {
            display: block;
            color: #00c8ff;
            margin-bottom: 8px;
        }

        /* Footer */
        footer {
            padding: 60px 0;
            border-top: 1px solid rgba(0, 200, 255, 0.1);
            text-align: center;
            color: #7a8fa3;
            margin-top: 100px;
        }

        .footer-links {
            margin-bottom: 20px;
        }

        .footer-links a {
            color: #00c8ff;
            text-decoration: none;
            margin: 0 15px;
            transition: color 0.3s ease;
        }

        .footer-links a:hover {
            color: #ffffff;
        }

        .footer-meta {
            font-size: 13px;
            color: #5a6f83;
        }

        /* Responsive */
        @media (max-width: 768px) {
            h1 { font-size: 40px; }
            .tagline { font-size: 18px; }
            .section-title { font-size: 28px; }
            .mode-card h3 { font-size: 22px; }
            .bench-content { padding: 40px; }
            .bench-content h3 { font-size: 28px; }
        }
    </style>
</head>
<body>
    <!-- Background Orbs -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>

    <!-- Dot Pattern -->
    <div class="dot-pattern dot-1"></div>
    <div class="dot-pattern dot-2"></div>
    <div class="dot-pattern dot-3"></div>
    <div class="dot-pattern dot-4"></div>
    <div class="dot-pattern dot-5"></div>

    <!-- Header -->
    <header>
        <div class="container">
            <div class="logo">∞</div>
            <h1>OmniLab</h1>
            <p class="tagline">The Cognitive AI Operating System</p>
            <p style="font-size: 16px; color: #7a8fa3; margin-bottom: 40px;">Run powerful AI workflows locally. No clouds. No limits. Pure intelligence.</p>
            <div class="cta-buttons">
                <a href="https://github.com/BryanParreira/OmniLab/releases" class="btn btn-primary">Download Now</a>
                <a href="https://github.com/BryanParreira/OmniLab" class="btn btn-secondary">View on GitHub</a>
            </div>
        </div>
    </header>

    <!-- Download Section -->
    <section class="download-section">
        <div class="container">
            <h2 class="section-title">Get OmniLab</h2>
            <div class="download-grid">
                <div class="download-card">
                    <div class="download-icon">🍎</div>
                    <h3>macOS</h3>
                    <p>Intel & Apple Silicon</p>
                    <a href="https://github.com/BryanParreira/OmniLab/releases">Download .dmg →</a>
                </div>
                <div class="download-card">
                    <div class="download-icon">🪟</div>
                    <h3>Windows</h3>
                    <p>x86_64 & ARM64</p>
                    <a href="https://github.com/BryanParreira/OmniLab/releases">Download .exe →</a>
                </div>
                <div class="download-card">
                    <div class="download-icon">🐧</div>
                    <h3>Linux</h3>
                    <p>Universal AppImage</p>
                    <a href="https://github.com/BryanParreira/OmniLab/releases">Download .AppImage →</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Modes Section -->
    <section class="modes-section">
        <div class="container">
            <h2 class="section-title">Cognitive States</h2>
            <div class="modes-grid">
                <!-- Forge Mode -->
                <div class="mode-card">
                    <div class="mode-icon">🔴</div>
                    <span class="mode-label">For Engineers & Architects</span>
                    <h3>Forge Mode</h3>
                    <ul class="features-list">
                        <li><strong>Blueprint Engine</strong> — Scaffold entire project structures instantly</li>
                        <li><strong>Diff Doctor</strong> — Detect bugs before commits with Git integration</li>
                        <li><strong>Refactor</strong> — Context-aware code cleaning</li>
                    </ul>
                </div>

                <!-- Nexus Mode -->
                <div class="mode-card">
                    <div class="mode-icon">🔵</div>
                    <span class="mode-label">For Researchers & Writers</span>
                    <h3>Nexus Mode</h3>
                    <ul class="features-list">
                        <li><strong>Flashpoint</strong> — Auto-generate spaced-repetition flashcards</li>
                        <li><strong>Podcast Protocol</strong> — Text-to-speech for complex synthesis</li>
                        <li><strong>Deep Context</strong> — Semantic search across documents</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Lab Bench Section -->
    <section class="lab-bench-section">
        <div class="container">
            <div class="bench-content">
                <div class="bench-icon">🧪</div>
                <h3>The Lab Bench</h3>
                <p>Split-screen artifact viewer that breaks window-switching chaos. See live HTML previews, full-height code reviews, and flashcard stacks side-by-side with chat—without ever leaving the workspace.</p>
                <div class="bench-features">
                    <div class="bench-feature">📺 Live HTML/JS Previews</div>
                    <div class="bench-feature">📝 Full-Height Code Reviews</div>
                    <div class="bench-feature">📇 Flashcard Flipping</div>
                    <div class="bench-feature">⚡ Zero Context Loss</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Privacy Section -->
    <section class="privacy-section">
        <div class="container">
            <div class="privacy-content">
                <h3>🔒 100% Local. 100% Private.</h3>
                <p>Your data never leaves your machine. OmniLab runs entirely on your hardware through Ollama. No APIs. No analytics. No servers. No compromise.</p>
                <div class="privacy-grid">
                    <div class="privacy-item">
                        <strong>✓ Offline</strong>
                        Zero dependencies after launch
                    </div>
                    <div class="privacy-item">
                        <strong>✓ Local Models</strong>
                        Bring your own via Ollama
                    </div>
                    <div class="privacy-item">
                        <strong>✓ No Telemetry</strong>
                        We don't phone home
                    </div>
                    <div class="privacy-item">
                        <strong>✓ Your Control</strong>
                        Full ownership of everything
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <div class="footer-links">
                <a href="https://github.com/BryanParreira/OmniLab">GitHub</a>
                <a href="https://github.com/BryanParreira/OmniLab/releases">Downloads</a>
                <a href="https://github.com/BryanParreira/OmniLab/issues">Issues</a>
            </div>
            <p class="footer-meta">© 2024 Bryan Bernardo Parreira. All Rights Reserved. | Proprietary Software</p>
        </div>
    </footer>
</body>
</html>
