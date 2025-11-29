// Replace your ollama:stream-prompt handler with this improved version

ipcMain.on('ollama:stream-prompt', async (event, { prompt, model, contextFiles, systemPrompt, settings }) => {
  if (!mainWindow) return;
  
  try {
    const config = settings || DEFAULT_SETTINGS;
    const baseUrl = config.ollamaUrl || "http://127.0.0.1:11434";
    
    // --- ENHANCED ANTI-HALLUCINATION SYSTEM PROMPTS ---
    const devPersona = `You are OmniLab Forge, a Senior Software Engineer and Code Assistant.

CORE RULES - NEVER VIOLATE:
1. ONLY provide information you are CERTAIN about
2. If you don't know something, say "I don't have information about that"
3. NEVER make up file paths, function names, or API details
4. NEVER assume project structure unless explicitly provided in context

CODE GENERATION RULES:
- Provide complete, working code examples
- Use best practices and modern syntax
- Include error handling where appropriate
- Add brief comments for complex logic

DIAGRAM RULES:
- ONLY create diagrams when user explicitly asks for: "diagram", "flowchart", "architecture", "graph", or "visualize"
- Use <mermaid> tags ONLY for diagrams
- For code requests, NEVER use diagrams - output code directly

RESPONSE STYLE:
- Be concise and professional
- Answer the actual question asked
- Don't over-explain unless requested`;

    const studentPersona = `You are OmniLab Nexus, an Academic Research Assistant.

CORE RULES - NEVER VIOLATE:
1. ONLY provide factual information you are confident about
2. Clearly distinguish between facts and interpretations
3. If uncertain, say "I'm not certain, but..." or "I don't have verified information"
4. NEVER fabricate sources, citations, or research findings
5. Stick to the context provided - don't invent details

RESEARCH RULES:
- Base answers on provided context when available
- Acknowledge limitations in your knowledge
- Suggest where users can find authoritative information
- Be clear about what is opinion vs fact

DIAGRAM RULES:
- ONLY create diagrams if explicitly requested
- Use <mermaid> tags ONLY when user asks for visual representations

RESPONSE STYLE:
- Clear, educational, and well-structured
- Use examples to clarify complex concepts
- Be helpful but don't assume beyond what's asked`;

    // --- ENHANCED CONTEXT HANDLING ---
    const baseSystem = config.developerMode ? devPersona : studentPersona;
    const userSystem = systemPrompt || config.systemPrompt || "";
    const systemPromptFinal = `${baseSystem}${userSystem ? '\n\nADDITIONAL CONTEXT:\n' + userSystem : ''}`;

    let contextStr = "";
    if (contextFiles && contextFiles.length > 0) {
      contextStr = await readProjectFiles(contextFiles);
      if (contextStr.trim()) {
        mainWindow.webContents.send('ollama:chunk', ''); // Signal context loaded
      }
    }

    // --- IMPROVED PROMPT STRUCTURE ---
    let fullPrompt = prompt;
    if (contextStr.trim()) {
      fullPrompt = `You have access to the following project files and context. Use ONLY this information to answer questions about the project. Do not make assumptions about files or code not shown here.

PROJECT CONTEXT:
${contextStr}

---

USER QUESTION: ${prompt}

Remember: Only reference information explicitly provided above. If asked about something not in the context, clearly state you don't have that information.`;
    }

    // --- ROBUST FETCH WITH BETTER ERROR HANDLING ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const requestBody = {
      model: model || config.defaultModel,
      prompt: fullPrompt,
      system: systemPromptFinal, // Use proper system parameter
      stream: true,
      keep_alive: "10m",
      options: {
        num_ctx: parseInt(config.contextLength) || 8192,
        temperature: parseFloat(config.temperature) || 0.7,
        num_predict: -1, // Allow full response
        top_k: 40,
        top_p: 0.9,
        repeat_penalty: 1.1, // Reduce repetition
        num_thread: 8
      }
    };

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(requestBody)
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error (${response.status}): ${errorText || response.statusText}`);
    }

    // --- IMPROVED STREAMING PARSER ---
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let totalChunks = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const json = JSON.parse(line);
          
          if (json.error) {
            throw new Error(`Ollama error: ${json.error}`);
          }
          
          if (json.response) {
            mainWindow.webContents.send('ollama:chunk', json.response);
            totalChunks++;
          }
          
          if (json.done) {
            console.log(`Stream complete: ${totalChunks} chunks received`);
            mainWindow.webContents.send('ollama:chunk', '[DONE]');
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError, 'Line:', line);
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      try {
        const json = JSON.parse(buffer);
        if (json.error) {
          throw new Error(`Ollama error: ${json.error}`);
        }
        if (json.response) {
          mainWindow.webContents.send('ollama:chunk', json.response);
        }
        if (json.done) {
          mainWindow.webContents.send('ollama:chunk', '[DONE]');
        }
      } catch (e) {
        console.error('Final buffer parse error:', e);
      }
    }

  } catch (error) {
    console.error('Ollama stream error:', error);
    
    let errorMessage = 'Connection Error: ';
    if (error.name === 'AbortError') {
      errorMessage += 'Request timed out after 2 minutes';
    } else if (error.message.includes('fetch')) {
      errorMessage += 'Cannot connect to Ollama. Please check:\n1. Ollama is running (run: ollama serve)\n2. URL is correct in settings\n3. No firewall blocking port 11434';
    } else {
      errorMessage += error.message;
    }
    
    mainWindow.webContents.send('ollama:error', errorMessage);
  }
});

// --- ALSO UPDATE THE JSON GENERATOR FOR BETTER RELIABILITY ---
ipcMain.handle('ollama:generate-json', async (e, { prompt, model, settings }) => {
  const config = settings || DEFAULT_SETTINGS;
  const baseUrl = config.ollamaUrl || "http://127.0.0.1:11434";
  
  try {
    // Enhanced JSON prompt to prevent hallucination
    const enhancedPrompt = `${prompt}

CRITICAL: Respond with ONLY valid JSON. No explanations, no markdown, no extra text.
If you cannot generate the requested JSON structure, return an empty array: []`;

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || config.defaultModel,
        prompt: enhancedPrompt,
        format: 'json',
        stream: false,
        options: {
          temperature: 0.1, // Lower temperature for more consistent output
          num_predict: 2000,
          top_p: 0.9,
          repeat_penalty: 1.1
        }
      })
    });

    if (!response.ok) {
      console.error('JSON generation failed:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    let rawText = data.response.trim();

    // Strip markdown code blocks
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Additional cleanup
    rawText = rawText.trim();

    try {
      const parsed = JSON.parse(rawText);
      return parsed;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw text:', rawText);
      return [];
    }
  } catch (error) {
    console.error('JSON generation error:', error);
    return [];
  }
});