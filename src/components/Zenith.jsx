import React, { useState, useEffect, useRef } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  PenTool, Sparkles, Maximize, Minimize, Save, 
  AlignLeft, AlertTriangle, Brain,
  Wand2, Scissors, CheckCircle2, FolderPlus, ArrowRight,
  FileText, Download, Copy, ChevronDown,
  Zap, ListOrdered, BookOpen, Hash, Code2, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- WRITING MODES ---
const WRITING_MODES = {
  freewrite: { 
    name: 'Freewrite', 
    icon: <PenTool size={14}/>, 
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    description: 'Write without constraints',
    systemPrompt: 'Continue this text naturally and creatively.'
  },
  structured: { 
    name: 'Structured', 
    icon: <ListOrdered size={14}/>, 
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    description: 'Organized sections',
    systemPrompt: 'Continue this text following a logical, organized structure.'
  },
  research: { 
    name: 'Research', 
    icon: <BookOpen size={14}/>, 
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    description: 'Academic writing',
    systemPrompt: 'Continue this academic text with formal language and citations.'
  },
  creative: { 
    name: 'Creative', 
    icon: <Palette size={14}/>, 
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    description: 'Stories & fiction',
    systemPrompt: 'Continue this creative narrative with vivid descriptions and engaging storytelling.'
  },
};

// --- EXPORT FORMATS ---
const EXPORT_FORMATS = [
  { id: 'md', name: 'Markdown', ext: '.md', icon: <Hash size={14}/> },
  { id: 'txt', name: 'Plain Text', ext: '.txt', icon: <FileText size={14}/> },
  { id: 'html', name: 'HTML', ext: '.html', icon: <Code2 size={14}/> },
];

export const Zenith = () => {
  const { theme, settings, updateSettings, activeProject, addCanvasNode } = useLumina();
  
  // --- STATE MANAGEMENT ---
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [writingMode, setWritingMode] = useState('freewrite');
  
  const [activeFilename, setActiveFilename] = useState(null); 

  // Stats
  const [stats, setStats] = useState({ 
    words: 0, 
    chars: 0,
    sentences: 0,
    readTime: 0, 
    complexity: 'Neutral' 
  });
  
  // AI State
  const [ghostText, setGhostText] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  // Selection / Lens State
  const [selection, setSelection] = useState({ start: 0, end: 0, text: "" });
  const [showLens, setShowLens] = useState(false);
  
  const [saveStatus, setSaveStatus] = useState('saved');

  // UI State
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [lineHeight, setLineHeight] = useState(1.8);

  const textareaRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // --- LISTENER FOR SIDEBAR EVENTS ---
  useEffect(() => {
    const handleLoadFile = async (e) => {
        const { filename } = e.detail;
        try {
            const fileContent = await window.lumina.readFile(filename);
            if (isMounted.current) {
                setContent(fileContent);
                setActiveFilename(filename);
                setTitle(filename.replace(/\.(md|txt|html)$/, '').replace(/_/g, ' '));
                setGhostText("");
                setSaveStatus('saved');
            }
        } catch (err) {
            console.error("Failed to read file:", err);
        }
    };

    const handleNewFile = () => {
        if (isMounted.current) {
            setContent("");
            setTitle("");
            setActiveFilename(null);
            setGhostText("");
            setSaveStatus('saved');
            textareaRef.current?.focus();
        }
    };

    window.addEventListener('zenith-load-file', handleLoadFile);
    window.addEventListener('zenith-new-file', handleNewFile);

    return () => {
        window.removeEventListener('zenith-load-file', handleLoadFile);
        window.removeEventListener('zenith-new-file', handleNewFile);
    };
  }, []);

  // --- AUTO-SAVE INDICATOR ---
  useEffect(() => {
    if (content && saveStatus === 'saved') {
      setSaveStatus('unsaved');
    }
  }, [content]);

  // --- ENHANCED STATS ENGINE ---
  useEffect(() => {
    const text = content.trim();
    const words = text === '' ? 0 : text.split(/\s+/).length;
    const chars = content.length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const readTime = Math.max(1, Math.ceil(words / 200));
    
    const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
    
    let complexity = 'Neutral';
    if (avgWordsPerSentence > 25) complexity = 'Complex';
    else if (avgWordsPerSentence > 18) complexity = 'Academic';
    else if (avgWordsPerSentence < 10 && words > 20) complexity = 'Simple';
    else if (avgWordsPerSentence < 15) complexity = 'Clear';

    setStats({ words, chars, sentences, readTime, complexity });
    
    // Auto-resize textarea
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; 
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // --- ENHANCED GHOST WRITER WITH MODE-AWARE PROMPTING ---
  const triggerGhostWriter = async () => {
    if (isAiThinking || !content) return;
    setIsAiThinking(true);
    
    const context = content.slice(-1500);

    try {
        // Use the systemPrompt from the current writing mode
        const systemPrompt = WRITING_MODES[writingMode].systemPrompt;

        const prompt = `[INST] ${systemPrompt} Do NOT repeat the input. [/INST]\n\n${context}`;

        const completion = await window.lumina.generateCompletion(
            prompt, 
            settings.defaultModel, 
            settings
        );

        if (!isMounted.current) return;

        if (completion) {
            let cleanText = completion;
            const lastChunk = context.slice(-50); 
            if (cleanText.startsWith(lastChunk)) {
                cleanText = cleanText.replace(lastChunk, "");
            }
            const contextEndsInPunctuation = /[.!?]$/.test(context);
            const completionStartsWithChar = /^\w/.test(cleanText);
            
            if (contextEndsInPunctuation && completionStartsWithChar) {
                 cleanText = " " + cleanText.trimStart();
            }

            setGhostText(cleanText.slice(0, 200));
        } else {
            setGhostText(" (No suggestion)");
        }
    } catch (error) {
        console.error("AI Error", error);
        if (isMounted.current) setGhostText(" (Connection Error)");
    } finally {
        if (isMounted.current) {
            setIsAiThinking(false);
            if (textareaRef.current) textareaRef.current.focus();
        }
    }
  };

  // --- ENHANCED LUMINA LENS ---
  const handleLensAction = async (action) => {
      setIsAiThinking(true);
      setShowLens(false);
      try {
          const prompt = `
            Task: ${action}
            Writing Mode: ${writingMode}
            Input Text: "${selection.text}"
            Return JSON format: { "text": "The modified text here" }
          `;
          
          const result = await window.lumina.generateJson(prompt, settings.defaultModel, settings);
          
          if (isMounted.current && result && result.text) {
             const before = content.substring(0, selection.start);
             const after = content.substring(selection.end);
             setContent(before + result.text + after);
          }
      } catch (e) {
          console.error("Lens Error", e);
      } finally {
          if (isMounted.current) {
              setIsAiThinking(false);
              setSelection({ start: 0, end: 0, text: "" });
          }
      }
  };

  const handleSelect = (e) => {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      if (start !== end) {
          setSelection({ start, end, text: content.substring(start, end) });
          setShowLens(true);
      } else {
          setShowLens(false);
      }
  };

  const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') { 
          e.preventDefault(); 
          triggerGhostWriter(); 
      }
      if (e.key === 'Tab' && ghostText) { 
          e.preventDefault(); 
          setContent(prev => prev + ghostText); 
          setGhostText(""); 
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
      }
      if (e.key === 'Escape') { 
          setGhostText(""); 
          setShowLens(false); 
          setShowExportMenu(false);
          setShowModeSelector(false);
          if (isFocusMode) setIsFocusMode(false);
      }
  };

  // --- FILE OPERATIONS ---
  const handleSave = async () => {
    if (!content.trim()) return;
    setSaveStatus('saving');

    let filenameToSave = activeFilename;

    if (!filenameToSave) {
        let baseFilename = "zenith-draft";
        if (title && title.trim().length > 0) {
            baseFilename = title.trim();
        } else {
            baseFilename = content.split('\n')[0].slice(0, 20);
        }
        const safeFilename = baseFilename
            .replace(/[^a-z0-9\-_ ]/gi, '')
            .trim()
            .replace(/\s+/g, '_') || "zenith-draft";
        
        filenameToSave = `${safeFilename}.md`;
    }

    try {
        await window.lumina.saveGeneratedFile(content, filenameToSave);
        setActiveFilename(filenameToSave);
        setSaveStatus('saved');
        window.dispatchEvent(new CustomEvent('zenith-file-saved'));
    } catch (e) {
        console.error("Save failed", e);
        setSaveStatus('unsaved');
    }
  };

  const saveToProject = async () => {
    if (!activeProject) {
      alert('⚠️ Please select a project first from the sidebar');
      return;
    }
    
    if (!content.trim()) {
      alert('⚠️ Document is empty');
      return;
    }

    setSaveStatus('saving');

    try {
      let baseFilename = title || content.split('\n')[0].slice(0, 20) || "document";
      const safeFilename = baseFilename
        .replace(/[^a-z0-9\-_ ]/gi, '')
        .trim()
        .replace(/\s+/g, '_') + '.md';

      await window.lumina.saveGeneratedFile(content, safeFilename);
      
      if (window.lumina.addFileToProject) {
        try {
          await window.lumina.addFileToProject(activeProject.id, safeFilename);
          window.dispatchEvent(new CustomEvent('project-files-updated'));
          
          const notification = document.createElement('div');
          notification.className = 'fixed top-6 right-6 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2';
          notification.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> Saved to ${activeProject.name}`;
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        } catch (err) {
          console.warn('Could not add to project files:', err);
        }
      }
      
      if (addCanvasNode && window.confirm('📊 Also create a Canvas node?')) {
        addCanvasNode('note', 500, 500, {
          title: title || 'Zenith Document',
          content: content.slice(0, 200) + (content.length > 200 ? '...' : '')
        });
      }

      setSaveStatus('saved');
      setActiveFilename(safeFilename);
    } catch (e) {
      console.error("Save to project failed:", e);
      setSaveStatus('unsaved');
      alert(`❌ Failed to save: ${e.message}`);
    }
  };

  // --- EXPORT HANDLER ---
  const handleExport = async (format) => {
    setShowExportMenu(false);
    
    let exportContent = content;
    let filename = (title || 'zenith-export').replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '_');

    if (format.id === 'html') {
      exportContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title || 'Document'}</title>
  <style>
    body { font-family: serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #333; }
    h1 { font-size: 2.5em; margin-bottom: 0.5em; }
    p { margin: 1em 0; }
  </style>
</head>
<body>
  <h1>${title || 'Untitled'}</h1>
  ${content.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n')}
</body>
</html>`;
    }

    try {
      await window.lumina.saveGeneratedFile(exportContent, filename + format.ext);
      
      const notification = document.createElement('div');
      notification.className = 'fixed top-6 right-6 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-2';
      notification.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"></path></svg> Exported as ${format.name}`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  // --- COPY TO CLIPBOARD ---
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    const notification = document.createElement('div');
    notification.className = 'fixed top-6 right-6 bg-purple-500/10 border border-purple-500/30 text-purple-400 px-4 py-3 rounded-xl shadow-2xl z-[100]';
    notification.textContent = '📋 Copied to clipboard';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  // --- SAFEGUARDS ---
  if (!settings || !theme) return null;

  if (settings.developerMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden bg-[#030304]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 flex flex-col items-center text-center max-w-md p-8 rounded-3xl bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 shadow-2xl relative"
        >
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Protocol Restriction</h2>
          <p className="text-sm text-gray-400 mb-8">Zenith Creative Suite is disabled in <strong className="text-red-400">Forge Mode</strong>.</p>
          <button 
              onClick={() => updateSettings({ developerMode: false })}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <Brain size={14} /> Switch to Nexus Mode
            </button>
        </motion.div>
      </div>
    );
  }

  const currentMode = WRITING_MODES[writingMode];

  return (
    <div className={`flex-1 h-full flex flex-col transition-all duration-700 relative z-10 ${isFocusMode ? 'bg-[#000000]' : 'bg-[#030304]'}`}>
      
      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: isFocusMode ? 0 : 1, y: isFocusMode ? -20 : 0, pointerEvents: isFocusMode ? 'none' : 'auto' }}
        className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0A0A0A]/90 backdrop-blur-xl shrink-0 z-20"
      >
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${theme.softBg} ${theme.accentText} transition-colors`}>
                <PenTool size={18} />
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Zenith</span>
                <span className="text-[10px] text-gray-500">
                  {activeProject ? activeProject.name : 'Creative Suite'}
                </span>
            </div>

            {/* Writing Mode Selector */}
            <div className="relative ml-4">
              <button
                onClick={() => setShowModeSelector(!showModeSelector)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${currentMode.bg} border border-white/10 transition-all hover:brightness-110`}
              >
                <span className={currentMode.color}>{currentMode.icon}</span>
                <span className="text-xs font-medium text-white">{currentMode.name}</span>
                <ChevronDown size={12} className="text-gray-500" />
              </button>

              <AnimatePresence>
                {showModeSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-12 left-0 w-64 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-2">
                      {Object.entries(WRITING_MODES).map(([key, mode]) => (
                        <button
                          key={key}
                          onClick={() => { setWritingMode(key); setShowModeSelector(false); }}
                          className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                            writingMode === key ? mode.bg : 'hover:bg-white/5'
                          }`}
                        >
                          <span className={mode.color}>{mode.icon}</span>
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium text-white">{mode.name}</div>
                            <div className="text-xs text-gray-500">{mode.description}</div>
                          </div>
                          {writingMode === key && <CheckCircle2 size={14} className={mode.color} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </div>

        <div className="flex items-center gap-4">
            {/* Simplified Stats - Only words and complexity */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <AlignLeft size={12}/>
                  <span className="text-white font-bold">{stats.words}</span>
                  <span>words</span>
                </div>
                <div className="w-px h-3 bg-white/10"></div>
                <div className={`flex items-center gap-1.5 ${
                    stats.complexity === 'Complex' ? 'text-red-400' :
                    stats.complexity === 'Academic' ? 'text-purple-400' : 
                    stats.complexity === 'Clear' ? 'text-green-400' :
                    stats.complexity === 'Simple' ? 'text-blue-400' : 'text-gray-400'
                }`}>
                    <Brain size={12}/> 
                    <span className="font-bold">{stats.complexity}</span>
                </div>
            </div>

            {/* Save Status */}
            <div className="flex items-center gap-2 text-[10px] font-mono">
              {saveStatus === 'saving' ? (
                <><Sparkles size={12} className="animate-spin text-blue-400" /> <span className="text-gray-400">Saving...</span></>
              ) : saveStatus === 'saved' ? (
                <><CheckCircle2 size={12} className="text-green-400" /> <span className="text-gray-600">Saved</span></>
              ) : (
                <span className="text-amber-400">Unsaved</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Export Menu */}
              <div className="relative">
                <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title="Export"
                >
                    <Download size={14} />
                </button>

                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-12 right-0 w-48 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-2">
                        {EXPORT_FORMATS.map(format => (
                          <button
                            key={format.id}
                            onClick={() => handleExport(format)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white text-xs transition-colors"
                          >
                            {format.icon}
                            <span className="flex-1 text-left">{format.name}</span>
                            <span className="text-gray-600">{format.ext}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                  onClick={copyToClipboard}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Copy to Clipboard"
              >
                  <Copy size={14} />
              </button>

              <div className="w-px h-6 bg-white/10"></div>

              <button 
                  onClick={handleSave}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${theme.primaryBg} text-white hover:brightness-110`}
              >
                  <Save size={12} /> Save
              </button>

              {activeProject && (
                <button 
                    onClick={saveToProject}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white transition-all flex items-center gap-1.5"
                >
                    <FolderPlus size={12} /> Project
                </button>
              )}

              <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  title="Toggle Focus Mode (Escape to exit)"
              >
                  {isFocusMode ? <Minimize size={14} /> : <Maximize size={14} />}
              </button>
            </div>
        </div>
      </motion.div>

      {/* EDITOR AREA */}
      <div 
        className="flex-1 overflow-y-auto custom-scrollbar relative flex justify-center z-10"
      >
         <div className={`w-full max-w-4xl transition-all duration-700 ease-in-out ${
           isFocusMode ? 'py-32 px-16' : 'py-16 px-12'
         }`}>
             
             {/* Title Input */}
             <motion.input
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Untitled Masterpiece"
                className="w-full bg-transparent text-5xl font-bold text-white placeholder-gray-800 outline-none mb-8 tracking-tight leading-tight"
                autoComplete="off"
             />

             {/* Content Editor */}
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative font-serif text-xl leading-loose text-gray-300"
                onClick={() => textareaRef.current?.focus()}
             >
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setGhostText(""); }}
                    onKeyDown={handleKeyDown}
                    onSelect={handleSelect}
                    placeholder="Start writing... (Press Cmd+J for AI suggestions)"
                    className="w-full min-h-[60vh] bg-transparent outline-none resize-none placeholder-gray-800 focus:placeholder-gray-700 caret-blue-500 overflow-hidden"
                    spellCheck={false}
                    autoComplete="off"
                />
             </motion.div>
         </div>
      </div>

      {/* --- AI OVERLAYS --- */}
      <AnimatePresence>
          {/* GHOST WRITER BUBBLE */}
          {(ghostText || isAiThinking) && !showLens && (
              <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 10 }}
                  className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 p-4 rounded-2xl bg-[#0F0F0F]/95 border border-white/10 shadow-2xl backdrop-blur-xl z-50 max-w-2xl"
              >
                  {isAiThinking ? (
                      <div className="flex items-center gap-3">
                          <Sparkles size={18} className="text-blue-400 animate-spin" />
                          <span className="text-sm font-medium text-white">AI is thinking...</span>
                      </div>
                  ) : (
                      <>
                          <div className="flex flex-col flex-1 max-w-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={12} className="text-blue-400" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ghost Writer</span>
                              </div>
                              <span className="text-sm text-white italic font-serif leading-relaxed">"{ghostText.trim()}"</span>
                          </div>
                          <div className="h-10 w-px bg-white/10"></div>
                          <div className="flex flex-col gap-1 text-[9px] font-mono text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">TAB</kbd> 
                                <span>Accept</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">ESC</kbd> 
                                <span>Dismiss</span>
                              </div>
                          </div>
                      </>
                  )}
              </motion.div>
          )}

          {/* LUMINA LENS */}
          {showLens && (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col rounded-2xl bg-[#0a0a0a]/95 border border-white/20 shadow-2xl z-50 w-80 overflow-hidden backdrop-blur-xl"
              >
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-blue-400"/>
                        <span className="text-sm font-bold text-white">Lumina Lens</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">{selection.text.length} chars</span>
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    <button 
                      onClick={() => handleLensAction('Expand this concept into a detailed paragraph')} 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-500/10 text-gray-300 hover:text-white text-sm transition-all group border border-transparent hover:border-purple-500/20"
                    >
                        <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                          <Wand2 size={16} className="text-purple-400"/>
                        </div>
                        <span className="flex-1 text-left font-medium">Expand</span>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-400"/>
                    </button>
                    <button 
                      onClick={() => handleLensAction('Simplify this text to be more concise and clear')} 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-500/10 text-gray-300 hover:text-white text-sm transition-all group border border-transparent hover:border-amber-500/20"
                    >
                        <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                          <Scissors size={16} className="text-amber-400"/>
                        </div>
                        <span className="flex-1 text-left font-medium">Simplify</span>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400"/>
                    </button>
                    <button 
                      onClick={() => handleLensAction('Fix any grammar, spelling, or punctuation errors')} 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-green-500/10 text-gray-300 hover:text-white text-sm transition-all group border border-transparent hover:border-green-500/20"
                    >
                        <div className="p-2 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                          <CheckCircle2 size={16} className="text-green-400"/>
                        </div>
                        <span className="flex-1 text-left font-medium">Fix Grammar</span>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-green-400"/>
                    </button>
                    <button 
                      onClick={() => handleLensAction('Rephrase this in a more professional tone')} 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-500/10 text-gray-300 hover:text-white text-sm transition-all group border border-transparent hover:border-blue-500/20"
                    >
                        <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                          <Zap size={16} className="text-blue-400"/>
                        </div>
                        <span className="flex-1 text-left font-medium">Rephrase</span>
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400"/>
                    </button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
};