import React, { useState, useEffect } from 'react';
import { 
  X, Maximize2, Minimize2, Download, Code, Eye, RefreshCw, FlaskConical, 
  ChevronLeft, ChevronRight, BrainCircuit, Check, Copy, Activity, 
  Clock, ThumbsUp, RotateCcw, Repeat 
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';

// --- SUB-COMPONENT: FLASHCARDS (Active Recall / SRS) ---
const FlashcardDeck = ({ data, theme }) => {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [streak, setStreak] = useState(0);

  const handleGrade = (difficulty) => {
    // Logic: In a real app, send 'difficulty' score (1-4) to backend
    const isCorrect = difficulty !== 'again';
    
    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct
    }));

    setStreak(isCorrect ? streak + 1 : 0);
    setIsFlipped(false);

    // Auto-advance
    setTimeout(() => {
        setIndex((i) => (i + 1) % data.length);
    }, 200);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isFlipped && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          setIsFlipped(true);
      } else if (isFlipped) {
          if (e.key === '1') handleGrade('again');
          if (e.key === '2') handleGrade('hard');
          if (e.key === '3') handleGrade('good');
          if (e.key === '4') handleGrade('easy');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, index]);

  const progress = ((index + 1) / data.length) * 100;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-[#050505] relative overflow-hidden">
      
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#111]">
        <div className={`h-full ${theme.primaryBg} transition-all duration-300`} style={{ width: `${progress}%` }}></div>
      </div>

      {/* Stats Header */}
      <div className="mb-6 text-center space-y-2 z-10">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 justify-center">
            <Activity size={18} className={theme.accentText} /> 
            Active Recall
        </h3>
        <div className="flex gap-4 text-[10px] font-mono uppercase tracking-widest text-gray-500 justify-center">
            <span className="flex items-center gap-1"><Clock size={10}/> {index + 1} / {data.length}</span>
            <span className="flex items-center gap-1"><Check size={10}/> {sessionStats.reviewed} Done</span>
            {streak > 2 && <span className="text-orange-400 flex items-center gap-1"><FlaskConical size={10}/> {streak} Streak</span>}
        </div>
      </div>

      {/* Card Area */}
      <div className="relative w-full max-w-lg aspect-[3/2] perspective-1000 cursor-pointer group z-10" onClick={() => !isFlipped && setIsFlipped(true)}>
        <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* FRONT */}
          <div className={`absolute inset-0 backface-hidden rounded-2xl p-8 flex flex-col items-center justify-center text-center border ${theme.primaryBorder} bg-[#0A0A0A] shadow-2xl group-hover:border-white/20 transition-colors`}>
             <div className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Question</div>
             <div className="w-full overflow-y-auto custom-scrollbar px-2 max-h-[70%]">
               <div className="text-xl font-medium text-gray-100">{data[index].front}</div>
             </div>
             <div className="absolute bottom-4 text-[10px] text-gray-600 animate-pulse">Press SPACE to reveal</div>
          </div>
          
          {/* BACK */}
          <div className={`absolute inset-0 backface-hidden rounded-2xl p-8 flex flex-col items-center justify-center text-center border ${theme.primaryBorder} ${theme.softBg} shadow-2xl rotate-y-180`}>
             <div className={`text-xs font-bold mb-4 uppercase tracking-wider ${theme.accentText}`}>Answer</div>
             <div className="w-full overflow-y-auto custom-scrollbar px-2 max-h-[80%]">
               <div className="text-lg text-white leading-relaxed whitespace-pre-wrap">{data[index].back}</div>
             </div>
          </div>

        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 h-16 flex items-center justify-center w-full max-w-lg z-10">
        {!isFlipped ? (
            <button onClick={() => setIsFlipped(true)} className="w-full py-3 rounded-xl font-bold text-sm bg-white text-black hover:bg-gray-200 transition-colors shadow-lg">
                Show Answer <span className="text-[10px] opacity-50 ml-2">(SPACE)</span>
            </button>
        ) : (
            <div className="grid grid-cols-4 gap-3 w-full animate-in slide-in-from-bottom-2 duration-300">
                <button onClick={() => handleGrade('again')} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all active:scale-95">
                    <span className="text-xs font-bold flex items-center gap-1"><RotateCcw size={10}/> Again</span>
                    <span className="text-[9px] opacity-60">1m</span>
                </button>
                <button onClick={() => handleGrade('hard')} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all active:scale-95">
                    <span className="text-xs font-bold">Hard</span>
                    <span className="text-[9px] opacity-60">10m</span>
                </button>
                <button onClick={() => handleGrade('good')} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all active:scale-95">
                    <span className="text-xs font-bold">Good</span>
                    <span className="text-[9px] opacity-60">1d</span>
                </button>
                <button onClick={() => handleGrade('easy')} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95">
                    <span className="text-xs font-bold flex items-center gap-1"><ThumbsUp size={10}/> Easy</span>
                    <span className="text-[9px] opacity-60">4d</span>
                </button>
            </div>
        )}
      </div>

      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,#050505_100%)] opacity-80 z-0"></div>
    </div>
  );
};

// --- SUB-COMPONENT: SYNTHESIS TABLE ---
const SynthesisTable = ({ data, theme }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full overflow-y-auto p-8 custom-scrollbar bg-[#050505]">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <BrainCircuit className={theme.accentText} /> Knowledge Synthesis
        </h3>
        <p className="text-sm text-gray-400 mb-8">Comparative analysis between sources.</p>

        <div className="space-y-8">
          {data.sections.map((section, idx) => (
            <div key={idx} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden group">
              <div className="px-6 py-3 bg-white/5 border-b border-white/5 font-bold text-gray-200 flex justify-between items-center">
                {section.title}
                <button 
                  onClick={() => handleCopy(section.synthesis, idx)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                  title="Copy Synthesis"
                >
                  {copiedId === idx ? <Check size={14} className="text-green-400"/> : <Copy size={14}/>}
                </button>
              </div>
              <div className="grid grid-cols-2 divide-x divide-white/5">
                <div className="p-4">
                  <div className="text-xs font-bold text-gray-500 mb-2 uppercase">{data.sourceA}</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{section.contentA}</p>
                </div>
                <div className="p-4">
                  <div className="text-xs font-bold text-gray-500 mb-2 uppercase">{data.sourceB}</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{section.contentB}</p>
                </div>
              </div>
              <div className={`px-6 py-3 border-t border-white/5 text-sm ${theme.softBg} text-gray-300 italic`}>
                <span className={`font-bold not-italic ${theme.accentText} mr-2`}>Synthesis:</span>
                {section.synthesis}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- MAIN LAB BENCH ---
export const LabBench = ({ artifact, onClose, theme }) => {
  const [view, setView] = useState('preview');
  const [isExpanded, setIsExpanded] = useState(false);
  const [key, setKey] = useState(0);
  const [codeCopied, setCodeCopied] = useState(false);

  // Determine artifact type
  const isWeb = artifact.language && ['html', 'svg'].includes(artifact.language);
  const isFlashcards = artifact.type === 'flashcards';
  const isSynthesis = artifact.type === 'synthesis';
  
  const handleDownload = () => {
    const content = isFlashcards || isSynthesis ? JSON.stringify(artifact.content, null, 2) : artifact.content;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact.${isFlashcards ? 'json' : artifact.language || 'txt'}`;
    a.click();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(artifact.content);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className={`border-l border-white/5 bg-[#050505] flex flex-col shadow-2xl relative transition-all duration-300 ${
        isExpanded ? 'fixed inset-0 z-50' : 'w-[45%] h-full'
      }`}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-[#0A0A0A]">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${theme.softBg} ${theme.accentText}`}>
            <FlaskConical size={14} />
          </div>
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">
            Lab Bench <span className="text-gray-600">/</span> {isFlashcards ? 'Flashpoint' : isSynthesis ? 'Synthesizer' : artifact.language || 'Editor'}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {isWeb && (
            <div className="flex bg-black/50 rounded-lg p-0.5 border border-white/5 mr-2">
              <button onClick={() => setView('code')} className={`p-1.5 rounded-md ${view === 'code' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><Code size={12}/></button>
              <button onClick={() => setView('preview')} className={`p-1.5 rounded-md ${view === 'preview' ? `${theme.softBg} ${theme.accentText}` : 'text-gray-500'}`}><Eye size={12}/></button>
            </div>
          )}
          <button onClick={() => setKey(k=>k+1)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white"><RefreshCw size={14}/></button>
          <button onClick={handleDownload} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white"><Download size={14}/></button>
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white">
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <div className="h-4 w-px bg-white/10 mx-1"></div>
          <button onClick={onClose} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400"><X size={14}/></button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative bg-[#030304]">
        {isFlashcards ? (
          <FlashcardDeck data={artifact.content} theme={theme} />
        ) : isSynthesis ? (
          <SynthesisTable data={artifact.content} theme={theme} />
        ) : view === 'preview' && isWeb ? (
          <iframe key={key} srcDoc={artifact.content} className="w-full h-full border-none bg-white" sandbox="allow-scripts allow-modals"/>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar p-0 relative group">
             {/* FLOATING COPY BUTTON */}
             <button 
                onClick={handleCopyCode}
                className="absolute top-4 right-4 z-10 p-2 bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 rounded-lg text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                title="Copy code"
             >
                {codeCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
             </button>

             <SyntaxHighlighter 
                children={artifact.content} 
                style={vscDarkPlus} 
                language={artifact.language || 'text'} 
                PreTag="div" 
                showLineNumbers={true} 
                customStyle={{ margin:0, minHeight:'100%', background:'transparent', fontSize:'12px', padding:'20px' }} 
             />
          </div>
        )}
      </div>

      {/* Styles for 3D Flip Effects */}
      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>
    </motion.div>
  );
};