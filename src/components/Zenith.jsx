import React, { useState, useEffect, useRef } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  PenTool, Sparkles, Maximize, Minimize, Save, Ghost, 
  AlignLeft, Clock, Lock, AlertTriangle, Terminal, Brain 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Zenith = () => {
  // --- 1. ALL HOOKS MUST BE CALLED AT THE TOP LEVEL ---
  const { theme, settings, updateSettings } = useLumina();
  
  const [content, setContent] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [stats, setStats] = useState({ words: 0, readTime: 0 });
  const [ghostText, setGhostText] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);

  const textareaRef = useRef(null);

  // MOVED UP: This useEffect must run before any return statement
  useEffect(() => {
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    const readTime = Math.ceil(words / 200);
    setStats({ words, readTime });
  }, [content]);

  // --- 2. SAFEGUARDS & CONDITIONAL RENDERING ---
  
  // Safe check for context loading
  if (!settings || !theme) return null;

  // FORGE MODE LOCKED STATE
  if (settings.developerMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden bg-[#030304]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#030304] via-transparent to-[#030304]"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 flex flex-col items-center text-center max-w-md p-8 rounded-3xl bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 shadow-2xl relative"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>

          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/5">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Protocol Restriction</h2>
          
          <div className="text-sm text-gray-400 mb-8 leading-relaxed space-y-2">
            <p>
              Zenith Creative Suite is disabled in <strong className="text-red-400">Forge Mode</strong>.
            </p>
            <p className="text-xs opacity-70">
              Creative tools are suppressed to optimize engineering focus.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={() => updateSettings({ developerMode: false })}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              <Brain size={14} />
              Switch to Nexus Mode
            </button>
            
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 font-mono mt-2">
                <Terminal size={10} />
                <span>ERR_MODE_MISMATCH: 0x004F</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- 3. EDITOR FUNCTIONS (Helper logic) ---
  const triggerGhostWriter = () => {
    if (isAiThinking || !content) return;
    setIsAiThinking(true);
    
    setTimeout(() => {
        const sampleSuggestions = [
            " which suggests a deeper underlying correlation.",
            " effectively bridging the gap between theory and practice.",
            " creating a robust foundation for future scalability.",
            " however, this approach requires careful consideration."
        ];
        const suggestion = sampleSuggestions[Math.floor(Math.random() * sampleSuggestions.length)];
        setGhostText(suggestion);
        setIsAiThinking(false);
        if (textareaRef.current) textareaRef.current.focus();
    }, 1200);
  };

  const acceptGhostText = () => {
      if (ghostText) {
          setContent(prev => prev + ghostText);
          setGhostText("");
          if (textareaRef.current) textareaRef.current.focus();
      }
  };

  const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
          e.preventDefault();
          triggerGhostWriter();
      }
      if (e.key === 'Tab' && ghostText) {
          e.preventDefault();
          acceptGhostText();
      }
      if (e.key === 'Escape') {
          if (ghostText) {
              e.preventDefault();
              setGhostText("");
          } else if (isFocusMode) {
              setIsFocusMode(false);
          }
      }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    const firstLine = content.split('\n')[0].slice(0, 20).replace(/[^a-z0-9]/gi, '_') || 'zenith-draft';
    try {
        if (window.lumina && window.lumina.saveGeneratedFile) {
            await window.lumina.saveGeneratedFile(content, `${firstLine}.md`);
        }
    } catch (error) { console.error("Save failed:", error); }
  };

  // --- 4. NEXUS MODE RENDER ---
  return (
    <div className={`flex-1 h-full flex flex-col transition-colors duration-700 relative z-10 ${isFocusMode ? 'bg-[#000000]' : 'bg-transparent'}`}>
      
      {!isFocusMode && <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>}

      {/* HEADER */}
      <motion.div 
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: isFocusMode ? 0 : 1, y: isFocusMode ? -20 : 0 }}
        className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0A0A0A]/80 backdrop-blur-xl shrink-0 z-20 transition-all"
      >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme.softBg || 'bg-blue-500/10'} ${theme.accentText || 'text-blue-400'} transition-colors duration-500`}>
                <PenTool size={16} />
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-white uppercase tracking-widest">Zenith</span>
                <span className={`text-[10px] ${theme.accentText || 'text-blue-400'} opacity-70`}>Nexus Mode</span>
            </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500 bg-black/40 px-4 py-2 rounded-full border border-white/5">
                <span className="flex items-center gap-2"><AlignLeft size={12} className="opacity-50"/> {stats.words} words</span>
                <span className="w-px h-3 bg-white/10"></span>
                <span className="flex items-center gap-2"><Clock size={12} className={`opacity-50 ${theme.accentText || 'text-blue-400'}`}/> {stats.readTime} min read</span>
            </div>

            <div className="w-px h-6 bg-white/5"></div>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    title={isFocusMode ? "Exit Focus (Esc)" : "Enter Focus Mode"}
                >
                    {isFocusMode ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
                
                <button 
                    onClick={handleSave}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white ${theme.primaryBg || 'bg-blue-600'} shadow-lg hover:brightness-110 transition-all flex items-center gap-2`}
                >
                    <Save size={14} /> Save
                </button>
            </div>
        </div>
      </motion.div>

      {/* EDITOR CANVAS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative flex justify-center z-10" onClick={() => textareaRef.current?.focus()}>
         <div className={`w-full max-w-3xl transition-all duration-700 ease-in-out ${isFocusMode ? 'py-40' : 'py-16'} px-12`}>
             
             <input 
                placeholder="Untitled Masterpiece"
                className="w-full bg-transparent text-5xl font-bold text-white placeholder-gray-800 outline-none mb-12 tracking-tight"
             />

             <div className="relative font-serif text-xl leading-loose text-gray-300">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setGhostText(""); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Start writing... (Press Cmd+J for AI assistance)"
                    className="w-full min-h-[60vh] bg-transparent outline-none resize-none placeholder-gray-800 focus:placeholder-gray-700 selection:bg-white/20 caret-white"
                    spellCheck={false}
                />
                
                {/* AI BUBBLE */}
                <AnimatePresence>
                    {(ghostText || isAiThinking) && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className={`fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 p-4 rounded-2xl bg-[#0F0F0F]/90 border shadow-2xl backdrop-blur-xl z-50 ${theme.primaryBorder || 'border-white/10'}`}
                        >
                            {isAiThinking ? (
                                <>
                                    <Sparkles size={18} className={`${theme.accentText || 'text-blue-400'} animate-spin`} />
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white">Lumina is thinking...</span>
                                        <span className="text-[10px] text-gray-500">Analyzing context</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={`p-2 rounded-lg bg-white/5 ${theme.accentText || 'text-blue-400'}`}>
                                        <Ghost size={18} />
                                    </div>
                                    <div className="flex flex-col max-w-md">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Suggestion</span>
                                        <span className="text-sm text-gray-200 italic font-serif leading-relaxed">"{ghostText}"</span>
                                    </div>
                                    <div className="h-8 w-px bg-white/10 mx-2"></div>
                                    <div className="flex flex-col gap-1 items-center">
                                        <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 font-mono border border-white/5">TAB</span>
                                        <span className="text-[9px] text-gray-600">accept</span>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>
         </div>
      </div>
    </div>
  );
};