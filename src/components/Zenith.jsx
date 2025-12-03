import React, { useState, useEffect, useRef } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  PenTool, Sparkles, Maximize, Minimize, Save, Ghost, 
  AlignLeft, Clock, AlertTriangle, Brain,
  Wand2, Scissors, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Zenith = () => {
  const { theme, settings, updateSettings } = useLumina();
  
  // --- STATE MANAGEMENT ---
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({ words: 0, readTime: 0, complexity: 'Neutral' });
  
  // AI State
  const [ghostText, setGhostText] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  // Selection / Lens State
  const [selection, setSelection] = useState({ start: 0, end: 0, text: "" });
  const [showLens, setShowLens] = useState(false);

  const textareaRef = useRef(null);

  // --- STATS ENGINE & AUTO-RESIZE ---
  useEffect(() => {
    const text = content.trim();
    const words = text === '' ? 0 : text.split(/\s+/).length;
    const readTime = Math.ceil(words / 200);
    
    // Cognitive Load Analysis
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
    
    let complexity = 'Neutral';
    if (avgWordsPerSentence > 20) complexity = 'Academic';
    if (avgWordsPerSentence < 8 && words > 10) complexity = 'Simple';

    setStats({ words, readTime, complexity });
    
    // Auto-resize textarea
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; 
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // --- SAFEGUARDS ---
  if (!settings || !theme) return null;

  // --- FORGE MODE LOCK ---
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

  // --- ACTIONS ---

  // 1. REAL GHOST WRITER (Connected to Backend)
  const triggerGhostWriter = async () => {
    if (isAiThinking || !content) return;
    setIsAiThinking(true);
    
    // 1. Get Context (Last 200 chars)
    const context = content.slice(-200);

    try {
        // 2. CALL REAL BACKEND
        // Note: ensure window.lumina.generateCompletion exists (updated preload.cjs)
        const completion = await window.lumina.generateCompletion(
            `Complete this sentence naturally, do not repeat the context: "${context}"`, 
            settings.defaultModel, 
            settings
        );

        if (completion) {
            // Clean up AI chatter if it returns the prompt
            let cleanText = completion.replace(context, "").trim();
            // Add a leading space if needed
            if (!cleanText.startsWith(" ") && !cleanText.startsWith(".") && !cleanText.startsWith(",")) {
                cleanText = " " + cleanText;
            }
            setGhostText(cleanText);
        } else {
            // Fallback if local AI is offline
            setGhostText(" (AI Offline: Ensure Ollama is running)");
        }
    } catch (error) {
        console.error("AI Error", error);
        setGhostText(" (Connection Error)");
    } finally {
        setIsAiThinking(false);
        if (textareaRef.current) textareaRef.current.focus();
    }
  };

  // 2. Lumina Lens (Context Menu Actions)
  const handleLensAction = async (action) => {
      setIsAiThinking(true);
      setShowLens(false);
      
      try {
          // Use the JSON generator for specific tasks (It's more reliable for instructions)
          // We ask for a "text" field in JSON to ensure clean output
          const prompt = `
            Task: ${action}
            Input Text: "${selection.text}"
            
            Return JSON format: { "text": "The modified text here" }
          `;
          
          const result = await window.lumina.generateJson(prompt, settings.defaultModel, settings);
          
          if (result && result.text) {
             const before = content.substring(0, selection.start);
             const after = content.substring(selection.end);
             setContent(before + result.text + after);
          }
      } catch (e) {
          console.error("Lens Error", e);
      } finally {
          setIsAiThinking(false);
          setSelection({ start: 0, end: 0, text: "" });
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
      // Cmd+J triggers Ghost Writer
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') { 
          e.preventDefault(); 
          triggerGhostWriter(); 
      }
      
      // Tab accepts Ghost Text
      if (e.key === 'Tab' && ghostText) { 
          e.preventDefault(); 
          setContent(prev => prev + ghostText); 
          setGhostText(""); 
      }
      
      // Escape clears UI
      if (e.key === 'Escape') { 
          setGhostText(""); 
          setShowLens(false); 
          setIsFocusMode(false); 
      }
  };

  // 3. NATIVE FILE SAVE
  const handleSave = async () => {
    if (!content.trim()) return;
    const firstLine = content.split('\n')[0].slice(0, 20).replace(/[^a-z0-9]/gi, '_') || 'zenith-draft';
    await window.lumina.saveGeneratedFile(content, `${firstLine}.md`);
  };

  return (
    <div className={`flex-1 h-full flex flex-col transition-colors duration-700 relative z-10 ${isFocusMode ? 'bg-[#000000]' : 'bg-transparent'}`}>
      
      {/* HEADER - Hides in Focus Mode */}
      <motion.div 
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: isFocusMode ? 0 : 1, y: isFocusMode ? -20 : 0 }}
        className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0A0A0A]/80 backdrop-blur-xl shrink-0 z-20"
      >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme.softBg} ${theme.accentText} transition-colors`}>
                <PenTool size={16} />
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Zenith</span>
                <span className="text-[10px] text-gray-500">Nexus Mode</span>
            </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 bg-black/40 px-4 py-2 rounded-full border border-white/5">
                <span className="flex items-center gap-2"><AlignLeft size={12}/> {stats.words} words</span>
                <span className="w-px h-3 bg-white/10"></span>
                <span className="flex items-center gap-2"><Clock size={12}/> {stats.readTime}m read</span>
                <span className="w-px h-3 bg-white/10"></span>
                <span className={`flex items-center gap-2 ${
                    stats.complexity === 'Academic' ? 'text-purple-400' : 
                    stats.complexity === 'Simple' ? 'text-green-400' : 'text-blue-400'
                }`}>
                    <Brain size={12}/> {stats.complexity}
                </span>
            </div>

            <button 
                onClick={handleSave}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white ${theme.primaryBg || 'bg-blue-600'} shadow-lg hover:brightness-110 transition-all flex items-center gap-2`}
            >
                <Save size={14} /> Save
            </button>

            <button 
                onClick={() => setIsFocusMode(!isFocusMode)}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                title="Toggle Focus Mode"
            >
                {isFocusMode ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
        </div>
      </motion.div>

      {/* EDITOR AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative flex justify-center z-10" onClick={() => textareaRef.current?.focus()}>
         <div className={`w-full max-w-3xl transition-all duration-700 ease-in-out ${isFocusMode ? 'py-40' : 'py-16'} px-12`}>
             
             {/* Title Input */}
             <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Masterpiece"
                className="w-full bg-transparent text-5xl font-bold text-white placeholder-gray-800 outline-none mb-8 tracking-tight"
             />

             <div className="relative font-serif text-xl leading-loose text-gray-300">
                {/* Main Textarea */}
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setGhostText(""); }}
                    onKeyDown={handleKeyDown}
                    onSelect={handleSelect}
                    placeholder="Start writing... (Press Cmd+J for AI)"
                    className="w-full min-h-[60vh] bg-transparent outline-none resize-none placeholder-gray-800 focus:placeholder-gray-700 caret-blue-500 overflow-hidden"
                    spellCheck={false}
                />
             </div>
         </div>
      </div>

      {/* --- AI OVERLAYS --- */}
      <AnimatePresence>
          {/* 1. GHOST WRITER BUBBLE */}
          {(ghostText || isAiThinking) && !showLens && (
              <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 p-4 rounded-2xl bg-[#0F0F0F]/90 border border-white/10 shadow-2xl backdrop-blur-xl z-50"
              >
                  {isAiThinking ? (
                      <div className="flex items-center gap-3">
                          <Sparkles size={16} className="text-blue-400 animate-spin" />
                          <span className="text-xs font-bold text-white">Lumina is crafting...</span>
                      </div>
                  ) : (
                      <>
                          <div className="flex flex-col max-w-md">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Ghost Writer</span>
                              <span className="text-sm text-white italic font-serif">"...{ghostText}"</span>
                          </div>
                          <div className="h-6 w-px bg-white/10 mx-2"></div>
                          <div className="flex gap-2 text-[9px] font-mono text-gray-500">
                              <span className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">TAB</span> to accept
                          </div>
                      </>
                  )}
              </motion.div>
          )}

          {/* 2. LUMINA LENS (Actions) */}
          {showLens && (
              <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 flex flex-col p-1 rounded-xl bg-[#1A1A1A] border border-white/20 shadow-2xl z-50 w-72"
              >
                  <div className="px-3 py-2 border-b border-white/5 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1"><Sparkles size={10}/> Lumina Lens</span>
                      <span className="text-[9px] text-gray-500">{selection.text.length} chars</span>
                  </div>
                  <div className="p-1 flex flex-col gap-0.5">
                    <button onClick={() => handleLensAction('Expand this concept into a paragraph')} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white text-xs transition-colors text-left group">
                        <Wand2 size={14} className="text-purple-400 group-hover:scale-110 transition-transform"/> Expand Concept
                    </button>
                    <button onClick={() => handleLensAction('Simplify this text to be more concise')} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white text-xs transition-colors text-left group">
                        <Scissors size={14} className="text-amber-400 group-hover:scale-110 transition-transform"/> Simplify Text
                    </button>
                    <button onClick={() => handleLensAction('Fix any grammar errors')} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-gray-300 hover:text-white text-xs transition-colors text-left group">
                        <CheckCircle2 size={14} className="text-green-400 group-hover:scale-110 transition-transform"/> Fix Grammar
                    </button>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
};