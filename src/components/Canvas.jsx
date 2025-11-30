import React, { useState, useRef, useCallback } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  Plus, 
  FileCode, 
  StickyNote, 
  Database, 
  Zap, 
  Trash2, 
  Search,
  Maximize,
  Minimize,
  Grid,
  MoreHorizontal,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Canvas = () => {
  const { 
    canvasNodes, 
    addCanvasNode, 
    updateCanvasNode, 
    deleteCanvasNode, 
    theme, 
    sendMessage,
    setCurrentView
  } = useLumina();

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // --- CANVAS INTERACTIONS ---
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = -e.deltaY * 0.001;
      setZoom(z => Math.min(Math.max(0.4, z + zoomFactor), 2.5));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  const handleMouseDown = (e) => {
    if (e.button === 1 || e.target === containerRef.current || e.target.classList.contains('grid-bg')) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingCanvas) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  // --- NODE RENDERER ---
  const renderNode = (node) => {
    // Style configurations based on type
    const nodeStyles = {
        file: { color: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/10', icon: <FileCode size={14} />, label: 'FILE' },
        note: { color: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/10', icon: <StickyNote size={14} />, label: 'NOTE' },
        db:   { color: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/10', icon: <Database size={14} />, label: 'DATA' },
    };

    const style = nodeStyles[node.type] || nodeStyles.file;

    return (
      <motion.div
        key={node.id}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`absolute flex flex-col w-[280px] rounded-xl overflow-hidden backdrop-blur-xl bg-[#0a0a0a]/80 border ${style.border} transition-shadow hover:shadow-2xl ${style.glow} group`}
        style={{
          left: node.x,
          top: node.y,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Decorative Top Line */}
        <div className={`h-0.5 w-full bg-gradient-to-r from-transparent via-${style.color.split('-')[1]}-500 to-transparent opacity-50`}></div>

        {/* Header (Handle) */}
        <div 
          className="h-9 flex items-center justify-between px-3 cursor-move bg-white/5 border-b border-white/5 select-none"
          onMouseDown={(e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startY = e.clientY;
            const startNodeX = node.x;
            const startNodeY = node.y;

            const onMove = (moveEvent) => {
              const dx = (moveEvent.clientX - startX) / zoom;
              const dy = (moveEvent.clientY - startY) / zoom;
              updateCanvasNode(node.id, { x: startNodeX + dx, y: startNodeY + dy });
            };
            const onUp = () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        >
          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${style.color}`}>
            {style.icon}
            {style.label}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-gray-500 hover:text-white p-1 rounded hover:bg-white/10"><MoreHorizontal size={12}/></button>
            <button onClick={() => deleteCanvasNode(node.id)} className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/10"><Trash2 size={12}/></button>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 flex flex-col gap-2 relative">
            {/* Input Title */}
            <input 
                className="bg-transparent text-white font-semibold text-sm w-full outline-none placeholder-gray-600 focus:placeholder-gray-500"
                value={node.data.title}
                onChange={(e) => updateCanvasNode(node.id, { data: { ...node.data, title: e.target.value } })}
                placeholder="Node Title..."
            />
            
            {/* Divider */}
            <div className="h-px bg-white/5 w-full"></div>

            {/* Text Area */}
            <textarea 
                className="bg-black/20 rounded p-2 text-gray-400 text-xs w-full outline-none resize-none h-24 placeholder-gray-700 leading-relaxed font-mono border border-transparent focus:border-white/10 focus:bg-black/40 transition-all custom-scrollbar"
                value={node.data.content}
                onChange={(e) => updateCanvasNode(node.id, { data: { ...node.data, content: e.target.value } })}
                placeholder="// Enter details, logic, or schema..."
                spellCheck={false}
            />

            {/* Footer / Connectors Visual */}
            <div className="flex justify-between items-center pt-1">
                <div className="h-2 w-2 rounded-full bg-white/10 border border-white/20"></div>
                <div className="text-[9px] text-gray-600 font-mono">ID: {node.id.slice(0,4)}</div>
                <div className="h-2 w-2 rounded-full bg-white/10 border border-white/20"></div>
            </div>
        </div>
      </motion.div>
    );
  };

  // --- AI GENERATION ---
  const generateArchitecture = () => {
    const context = canvasNodes.map(n => `[${n.type.toUpperCase()}] ${n.data.title}: ${n.data.content}`).join('\n');
    const prompt = `Based on this visual architecture diagram, generate a file structure JSON and explain the architecture:\n\n${context}`;
    setCurrentView('chat');
    sendMessage(prompt);
  };

  return (
    <div className="w-full h-full relative bg-[#030304] overflow-hidden flex flex-col font-sans select-none">
      
      {/* Grid Background Pattern */}
      <div 
        className="absolute inset-0 z-0 grid-bg opacity-20 pointer-events-none"
        style={{
            backgroundImage: `
                radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)
            `,
            backgroundSize: '24px 24px',
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            transform: `scale(${zoom})`,
            transformOrigin: '0 0' // Fixes the grid sliding weirdly when zoomed
        }}
      />
      {/* Secondary larger grid for depth */}
      <div 
        className="absolute inset-0 z-0 grid-bg opacity-10 pointer-events-none"
        style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '120px 120px',
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            transform: `scale(${zoom})`,
            transformOrigin: '0 0'
        }}
      />

      {/* Floating HUD Toolbar (Top Center) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
        <div className="glass-panel px-1.5 py-1.5 rounded-full flex gap-1 shadow-2xl border border-white/10 bg-[#0a0a0a]/50 backdrop-blur-md">
            <button onClick={() => addCanvasNode('file', -pan.x + window.innerWidth/2 - 140, -pan.y + window.innerHeight/2 - 100)} className="p-2.5 hover:bg-blue-500/20 rounded-full text-gray-400 hover:text-blue-400 transition-all hover:scale-105 tooltip group relative">
                <FileCode size={20}/>
                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[9px] bg-black border border-white/10 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-white">Add File</span>
            </button>
            <button onClick={() => addCanvasNode('note', -pan.x + window.innerWidth/2 - 140, -pan.y + window.innerHeight/2 - 100)} className="p-2.5 hover:bg-amber-500/20 rounded-full text-gray-400 hover:text-amber-400 transition-all hover:scale-105 group relative">
                <StickyNote size={20}/>
                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[9px] bg-black border border-white/10 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-white">Add Note</span>
            </button>
            <button onClick={() => addCanvasNode('db', -pan.x + window.innerWidth/2 - 140, -pan.y + window.innerHeight/2 - 100)} className="p-2.5 hover:bg-purple-500/20 rounded-full text-gray-400 hover:text-purple-400 transition-all hover:scale-105 group relative">
                <Database size={20}/>
                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-[9px] bg-black border border-white/10 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-white">Add Schema</span>
            </button>
            
            <div className="w-px h-6 bg-white/10 mx-1 self-center"></div>
            
            <button onClick={generateArchitecture} className={`flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full text-xs font-bold text-white ${theme.primaryBg} hover:brightness-110 shadow-lg shadow-indigo-500/20 transition-all`}>
                <Zap size={14} className="animate-pulse"/> 
                <span>Generate</span>
            </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 cursor-grab active:cursor-grabbing relative z-10"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <div 
          className="absolute origin-top-left transition-transform duration-75 ease-out will-change-transform"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
            <AnimatePresence>
                {canvasNodes.map(renderNode)}
            </AnimatePresence>
        </div>
      </div>

      {/* Bottom Bar (Status & Zoom) */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
          <div className="glass-panel px-4 py-2 rounded-lg bg-[#0a0a0a]/50 backdrop-blur-md border border-white/10 flex items-center gap-3 text-xs font-mono text-gray-500 pointer-events-auto">
              <Cpu size={14} className={theme.accentText} />
              <span>NODES: <span className="text-white">{canvasNodes.length}</span></span>
              <span className="text-white/10">|</span>
              <span className="flex items-center gap-2">
                 <Grid size={14} /> {Math.round(pan.x)},{Math.round(pan.y)}
              </span>
          </div>

          <div className="glass-panel p-1 rounded-lg bg-[#0a0a0a]/50 backdrop-blur-md border border-white/10 flex flex-col gap-1 pointer-events-auto">
                <button onClick={() => setZoom(z => Math.min(2.5, z + 0.2))} className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
                    <Maximize size={16}/>
                </button>
                <div className="text-[10px] text-center font-mono text-gray-500 py-1 border-t border-b border-white/5">
                    {Math.round(zoom * 100)}%
                </div>
                <button onClick={() => setZoom(z => Math.max(0.4, z - 0.2))} className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition-colors">
                    <Minimize size={16}/>
                </button>
          </div>
      </div>

      {/* Vignette Overlay for depth */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,#000000_100%)] opacity-60 z-20"></div>
    </div>
  );
};