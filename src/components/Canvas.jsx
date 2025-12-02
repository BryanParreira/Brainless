import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  FileCode, StickyNote, Database, Zap, Trash2, Search,
  Maximize, Minimize, Grid, Cpu, Sparkles, Loader2, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- HELPER FUNCTIONS ---
const snapToGrid = (value) => Math.round(value / 20) * 20;

const getBezierPath = (x1, y1, x2, y2) => {
  const dist = Math.abs(x2 - x1);
  const cp1X = x1 + dist * 0.5;
  const cp2X = x2 - dist * 0.5;
  return `M ${x1} ${y1} C ${cp1X} ${y1}, ${cp2X} ${y2}, ${x2} ${y2}`;
};

// Calculates coordinates for AI generated nodes to orbit the parent
const getRadialPosition = (centerX, centerY, index, total, radius = 400) => {
  const angle = (index / total) * 2 * Math.PI; // Distribute evenly in a circle
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  };
};

export const Canvas = () => {
  const { 
    canvasNodes, 
    updateCanvasNode, 
    addCanvasNode,
    deleteCanvasNode, 
    theme, 
    sendMessage, // Assuming this handles chat, we might need a direct generation function too
    setCurrentView,
    canvasConnections,
    setCanvasConnections
  } = useLumina();

  // --- VIEWPORT STATE ---
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  
  // --- SELECTION & CONNECTIONS ---
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [selectionBox, setSelectionBox] = useState(null);
  const [connectingSource, setConnectingSource] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredConnection, setHoveredConnection] = useState(null);
  
  // --- AI STATE ---
  const [sparkingNodeId, setSparkingNodeId] = useState(null); // Track which node is generating ideas

  // --- REFS FOR GLOBAL EVENT HANDLING ---
  const stateRef = useRef({
    zoom: 1,
    pan: { x: 0, y: 0 },
    nodes: [],
  });

  useEffect(() => { stateRef.current.zoom = zoom; }, [zoom]);
  useEffect(() => { stateRef.current.pan = pan; }, [pan]);
  useEffect(() => { stateRef.current.nodes = canvasNodes; }, [canvasNodes]);

  const containerRef = useRef(null);
  
  // THE DRAG STATE REF
  const dragRef = useRef({
    active: false,
    type: null, // 'node' or 'canvas'
    startX: 0,
    startY: 0,
    initialPan: { x: 0, y: 0 },
    initialNodes: [] // { id, x, y }
  });

  // --- GLOBAL EVENT LISTENERS ---
  useEffect(() => {
    const handleGlobalMove = (e) => {
      // Dead Man's Switch: If no buttons pressed, stop.
      if (e.buttons === 0 && dragRef.current.active) {
        handleGlobalUp();
        return;
      }

      if (!dragRef.current.active) {
        if (connectingSource && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePos({ 
                x: (e.clientX - rect.left - stateRef.current.pan.x) / stateRef.current.zoom, 
                y: (e.clientY - rect.top - stateRef.current.pan.y) / stateRef.current.zoom 
            });
        }
        return;
      }

      e.preventDefault(); // Stop text selection

      const { type, startX, startY, initialPan, initialNodes } = dragRef.current;
      const currentZoom = stateRef.current.zoom;

      if (type === 'canvas') {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        setPan({ x: initialPan.x + dx, y: initialPan.y + dy });
      } 
      else if (type === 'node') {
        const dx = (e.clientX - startX) / currentZoom;
        const dy = (e.clientY - startY) / currentZoom;

        initialNodes.forEach(n => {
            updateCanvasNode(n.id, {
                x: snapToGrid(n.x + dx),
                y: snapToGrid(n.y + dy)
            });
        });
      }
      else if (type === 'selection') {
         if (selectionBox && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const endX = (e.clientX - rect.left - stateRef.current.pan.x) / currentZoom;
            const endY = (e.clientY - rect.top - stateRef.current.pan.y) / currentZoom;
            setSelectionBox(prev => ({ ...prev, endX, endY }));
         }
      }
    };

    const handleGlobalUp = () => {
      if (!dragRef.current.active && !selectionBox && !connectingSource) return;

      if (dragRef.current.type === 'selection' && selectionBox) {
        const { startX, startY, endX, endY } = selectionBox;
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);
        
        const selected = stateRef.current.nodes.filter(node => 
          node.x + 140 >= minX && node.x + 140 <= maxX &&
          node.y + 80 >= minY && node.y + 80 <= maxY
        );
        setSelectedNodes(new Set(selected.map(n => n.id)));
        setSelectionBox(null);
      }

      setConnectingSource(null);

      dragRef.current = {
        active: false,
        type: null,
        startX: 0,
        startY: 0,
        initialPan: { x: 0, y: 0 },
        initialNodes: []
      };
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('mouseleave', handleGlobalUp); 
    window.addEventListener('blur', handleGlobalUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('mouseleave', handleGlobalUp);
      window.removeEventListener('blur', handleGlobalUp);
    };
  }, [selectionBox, connectingSource, updateCanvasNode]);

  // --- ACTIONS (Mouse Down) ---
  const startCanvasDrag = (e) => {
    if (e.button === 1 || e.target === containerRef.current || e.target.classList.contains('grid-bg')) {
       if (e.shiftKey) {
          const rect = containerRef.current.getBoundingClientRect();
          const startX = (e.clientX - rect.left - pan.x) / zoom;
          const startY = (e.clientY - rect.top - pan.y) / zoom;
          setSelectionBox({ startX, startY, endX: startX, endY: startY });
          
          dragRef.current = {
             active: true, type: 'selection', startX: 0, startY: 0, initialPan: {}, initialNodes: []
          };
       } else {
          dragRef.current = {
             active: true, type: 'canvas', startX: e.clientX, startY: e.clientY, initialPan: { ...pan }, initialNodes: []
          };
       }
    }
  };

  const startNodeDrag = (e, node) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    let newSelection = new Set(selectedNodes);
    if (!selectedNodes.has(node.id)) {
        if (!e.shiftKey) newSelection = new Set([node.id]);
        else newSelection.add(node.id);
        setSelectedNodes(newSelection);
    }

    const nodesToDrag = stateRef.current.nodes.filter(n => newSelection.has(n.id));

    dragRef.current = {
        active: true, type: 'node', startX: e.clientX, startY: e.clientY, initialPan: { ...pan }, 
        initialNodes: nodesToDrag.map(n => ({ id: n.id, x: n.x, y: n.y }))
    };
  };

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = -e.deltaY * 0.001;
      setZoom(z => Math.min(Math.max(0.2, z + zoomFactor), 2.5)); // Allowed zooming out further (0.2)
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);


  // --- AI FEATURE: THE "SPARK" ---
  // This simulates the "Autocomplete" logic. You should replace the setTimeout 
  // with your actual Ollama call (e.g., fetch('http://localhost:11434/api/generate'...))
  const handleSpark = async (e, parentNode) => {
      e.stopPropagation();
      if (sparkingNodeId) return; // Prevent double clicks
      setSparkingNodeId(parentNode.id);

      try {
        // --- 1. SIMULATED AI LATENCY ---
        // REPLACE THIS BLOCK with your actual Ollama generation call.
        // Prompt: `Generate 3 distinct, short related concepts for "${parentNode.data.title}". Return as comma-separated list.`
        await new Promise(r => setTimeout(r, 1500)); 
        const mockResponses = ["Technical Specs", "User Research", "Database Schema"]; 
        // -------------------------------

        // --- 2. ADD NODES TO CANVAS ---
        mockResponses.forEach((title, index) => {
            // Calculate position in a circle around the parent
            const pos = getRadialPosition(parentNode.x, parentNode.y, index, mockResponses.length);
            
            // Add the new node
            // Note: addCanvasNode needs to return the ID, or we generate one here.
            // Assuming addCanvasNode creates a node and we just trigger it.
            // Since we can't get the ID back easily from a void function without refactoring context,
            // We will manually trigger the add and assume the connection logic later or use a different flow.
            // For now, let's assume we just add them:
            
            addCanvasNode('note', pos.x, pos.y, { title: title, content: "AI generated concept..." });
            
            // Note: To connect them immediately, you'd need the new IDs. 
            // If addCanvasNode doesn't return an ID, you might need to refactor Context slightly.
            // For this UI demo, we just add the nodes.
        });

      } catch (error) {
          console.error("AI Spark failed", error);
      } finally {
          setSparkingNodeId(null);
      }
  };


  // --- RENDER HELPERS ---
  const renderNode = (node) => {
    const nodeStyles = {
        file: { color: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/10', icon: <FileCode size={14} />, label: 'FILE' },
        note: { color: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/10', icon: <StickyNote size={14} />, label: 'NOTE' },
        db:   { color: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/10', icon: <Database size={14} />, label: 'DATA' },
    };

    const style = nodeStyles[node.type] || nodeStyles.file;
    const isSelected = selectedNodes.has(node.id);
    const isSparking = sparkingNodeId === node.id;

    // --- LEVEL OF DETAIL (LOD) LOGIC ---
    const detailLevel = zoom > 0.6 ? 'high' : zoom > 0.35 ? 'medium' : 'low';
    const width = detailLevel === 'low' ? 'w-[100px]' : 'w-[280px]';
    const height = detailLevel === 'low' ? 'h-[100px]' : 'auto';

    return (
      <motion.div
        key={node.id}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`absolute flex flex-col ${width} ${height} rounded-xl overflow-visible backdrop-blur-xl bg-[#0a0a0a]/90 border ${isSelected ? 'border-blue-500' : style.border} transition-shadow hover:shadow-2xl ${style.glow} group z-10`}
        style={{
          left: node.x,
          top: node.y,
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()} 
        onMouseUp={(e) => {
            e.stopPropagation();
            if (connectingSource && connectingSource.id !== node.id) {
                const exists = canvasConnections.some(c => c.from === connectingSource.id && c.to === node.id);
                if (!exists) setCanvasConnections(prev => [...prev, { from: connectingSource.id, to: node.id }]);
                setConnectingSource(null);
            }
        }}
      >
        <div className={`h-0.5 w-full bg-gradient-to-r from-transparent via-${style.color.split('-')[1]}-500 to-transparent opacity-50`}></div>

        {/* HEADER */}
        <div 
          className="h-9 flex items-center justify-between px-3 cursor-move bg-white/5 border-b border-white/5 select-none rounded-t-xl"
          onMouseDown={(e) => startNodeDrag(e, node)}
        >
          <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${style.color}`}>
            {detailLevel !== 'low' ? style.icon : <div className="scale-150 pl-1">{style.icon}</div>}
            {detailLevel !== 'low' && style.label}
          </div>
          
          {detailLevel === 'high' && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* AI Spark Button */}
                <button 
                    onClick={(e) => handleSpark(e, node)} 
                    className={`text-gray-500 hover:text-yellow-400 p-1 rounded hover:bg-white/10 ${isSparking ? 'animate-pulse text-yellow-400' : ''}`}
                    title="Generate related nodes (AI)"
                >
                    {isSparking ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteCanvasNode(node.id); }} className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/10"><Trash2 size={12}/></button>
            </div>
          )}
        </div>

        {/* CONTENT - Based on Zoom Level */}
        {detailLevel === 'high' ? (
            <div className="p-3 flex flex-col gap-2 relative" onMouseDown={e => e.stopPropagation()}>
                <input 
                    className="bg-transparent text-white font-semibold text-sm w-full outline-none placeholder-gray-600 focus:placeholder-gray-500"
                    value={node.data.title}
                    onChange={(e) => updateCanvasNode(node.id, { data: { ...node.data, title: e.target.value } })}
                    placeholder="Node Title..."
                />
                <div className="h-px bg-white/5 w-full"></div>
                <textarea 
                    className="bg-black/20 rounded p-2 text-gray-400 text-xs w-full outline-none resize-none h-24 placeholder-gray-700 leading-relaxed font-mono border border-transparent focus:border-white/10 focus:bg-black/40 transition-all custom-scrollbar"
                    value={node.data.content}
                    onChange={(e) => updateCanvasNode(node.id, { data: { ...node.data, content: e.target.value } })}
                    placeholder="// Logic..."
                    spellCheck={false}
                />
                <div className="flex justify-between items-center pt-1"><div className="text-[9px] text-gray-600 font-mono">ID: {node.id.slice(0,4)}</div></div>
            </div>
        ) : detailLevel === 'medium' ? (
            <div className="p-4 flex items-center justify-center h-full">
                <div className="text-white font-bold text-center leading-tight line-clamp-3">
                    {node.data.title || "Untitled Node"}
                </div>
            </div>
        ) : (
            // Low detail (heatmap style)
            <div className="flex-1 flex items-center justify-center opacity-30">
                <MoreHorizontal size={24} className="text-white" />
            </div>
        )}

        {/* CONNECTION POINT */}
        {detailLevel !== 'low' && (
            <div 
                className="absolute -right-3 top-10 w-6 h-6 flex items-center justify-center cursor-crosshair group/connector z-50"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setConnectingSource(node);
                }}
            >
                <div className="w-2.5 h-2.5 rounded-full bg-[#1a1a1a] border border-gray-500 group-hover/connector:bg-blue-500 group-hover/connector:border-blue-400 group-hover/connector:scale-125 transition-all shadow-lg"></div>
            </div>
        )}
      </motion.div>
    );
  };

  // --- ACTIONS ---
  const generateArchitecture = () => {
    const context = canvasNodes.map(n => `[${n.type.toUpperCase()}] ${n.data.title}: ${n.data.content}`).join('\n');
    const connectionsCtx = canvasConnections.map(c => {
        const from = canvasNodes.find(n => n.id === c.from)?.data.title || c.from;
        const to = canvasNodes.find(n => n.id === c.to)?.data.title || c.to;
        return `${from} -> ${to}`;
    }).join('\n');
    setCurrentView('chat');
    sendMessage(`Architecture Context:\n${context}\n\nConnections:\n${connectionsCtx}\n\nAnalyze system flow.`);
  };

  const autoLayout = () => {
    const positioned = new Set();
    let cx = 100, cy = 100;
    canvasNodes.forEach((node, i) => {
        if (!positioned.has(node.id)) {
            updateCanvasNode(node.id, { x: cx, y: cy });
            positioned.add(node.id);
            cx += 400;
            if ((i + 1) % 3 === 0) { cx = 100; cy += 300; }
        }
    });
  };

  const deleteSelected = () => { selectedNodes.forEach(id => deleteCanvasNode(id)); setSelectedNodes(new Set()); };

  return (
    <div className="w-full h-full relative bg-[#030304] overflow-hidden flex flex-col font-sans select-none">
      <div 
        className="absolute inset-0 z-0 grid-bg opacity-20 pointer-events-none"
        style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px',
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            transform: `scale(${zoom})`,
            transformOrigin: '0 0'
        }}
      />
      
      {/* TOOLBAR */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
        <div className="glass-panel px-1.5 py-1.5 rounded-full flex gap-1 shadow-2xl border border-white/10 bg-[#0a0a0a]/50 backdrop-blur-md">
            <button onClick={() => addCanvasNode('file', -pan.x + window.innerWidth/2 - 140, -pan.y + window.innerHeight/2 - 100)} className="p-2.5 hover:bg-blue-500/20 rounded-full text-gray-400 hover:text-blue-400 transition-all hover:scale-105 tooltip group relative"><FileCode size={20}/></button>
            <button onClick={() => addCanvasNode('note', -pan.x + window.innerWidth/2 - 140, -pan.y + window.innerHeight/2 - 100)} className="p-2.5 hover:bg-amber-500/20 rounded-full text-gray-400 hover:text-amber-400 transition-all hover:scale-105 group relative"><StickyNote size={20}/></button>
            <button onClick={() => addCanvasNode('db', -pan.x + window.innerWidth/2 - 140, -pan.y + window.innerHeight/2 - 100)} className="p-2.5 hover:bg-purple-500/20 rounded-full text-gray-400 hover:text-purple-400 transition-all hover:scale-105 group relative"><Database size={20}/></button>
            <div className="w-px h-6 bg-white/10 mx-1 self-center"></div>
            <button onClick={autoLayout} className="p-2.5 hover:bg-green-500/20 rounded-full text-gray-400 hover:text-green-400 transition-all hover:scale-105"><Grid size={20}/></button>
            {selectedNodes.size > 0 && <button onClick={deleteSelected} className="p-2.5 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-400 transition-all hover:scale-105"><Trash2 size={20}/></button>}
            <div className="w-px h-6 bg-white/10 mx-1 self-center"></div>
            <button onClick={generateArchitecture} className={`flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full text-xs font-bold text-white ${theme.primaryBg} hover:brightness-110 shadow-lg shadow-indigo-500/20 transition-all`}><Zap size={14} className="animate-pulse"/><span>Generate</span></button>
        </div>
      </div>

      {/* CANVAS AREA */}
      <div 
        ref={containerRef}
        className="flex-1 cursor-grab active:cursor-grabbing relative z-10 outline-none"
        onMouseDown={startCanvasDrag}
        onWheel={handleWheel}
      >
        <div 
          className="absolute origin-top-left transition-transform duration-75 ease-out will-change-transform"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
            <svg className="absolute top-0 left-0 w-full h-full overflow-visible z-0 pointer-events-none">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#52525b" /></marker>
                    <marker id="arrowhead-hover" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" /></marker>
                </defs>
                {canvasConnections.map((conn, i) => {
                    const source = canvasNodes.find(n => n.id === conn.from);
                    const target = canvasNodes.find(n => n.id === conn.to);
                    if (!source || !target) return null;
                    const isHovered = hoveredConnection === i;
                    
                    // Adjust connection points based on new dynamic sizes
                    // Note: Ideally, dynamic calculation based on source.width/height is better, 
                    // but fixed offsets work if we assume standard connection points are consistent.
                    return (
                        <g key={i} style={{ pointerEvents: 'auto' }}>
                          <path 
                              d={getBezierPath(source.x + 280, source.y + 44, target.x, target.y + 44)} 
                              fill="none" stroke="transparent" strokeWidth="20" className="cursor-pointer"
                              onMouseEnter={() => setHoveredConnection(i)} onMouseLeave={() => setHoveredConnection(null)}
                              onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete connection?')) setCanvasConnections(p => p.filter((_, idx) => idx !== i)); }}
                          />
                          <path 
                              d={getBezierPath(source.x + 280, source.y + 44, target.x, target.y + 44)} 
                              fill="none" stroke={isHovered ? "#ef4444" : "#52525b"} strokeWidth={isHovered ? "3" : "2"}
                              className="opacity-60 transition-all duration-300 pointer-events-none"
                              markerEnd={isHovered ? "url(#arrowhead-hover)" : "url(#arrowhead)"}
                          />
                        </g>
                    );
                })}
                {connectingSource && (
                    <path d={getBezierPath(connectingSource.x + 280, connectingSource.y + 44, mousePos.x, mousePos.y)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse"/>
                )}
            </svg>

            <AnimatePresence>
                {canvasNodes.map(renderNode)}
            </AnimatePresence>

            {selectionBox && (
              <div className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
                style={{
                  left: Math.min(selectionBox.startX, selectionBox.endX),
                  top: Math.min(selectionBox.startY, selectionBox.endY),
                  width: Math.abs(selectionBox.endX - selectionBox.startX),
                  height: Math.abs(selectionBox.endY - selectionBox.startY),
                }}
              />
            )}
        </div>
      </div>

      {/* FOOTER STATS */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
          <div className="glass-panel px-4 py-2 rounded-lg bg-[#0a0a0a]/50 backdrop-blur-md border border-white/10 flex items-center gap-3 text-xs font-mono text-gray-500 pointer-events-auto">
              <Cpu size={14} className={theme.accentText} />
              <span>NODES: <span className="text-white">{canvasNodes.length}</span></span>
              <span className="text-white/10">|</span>
              <span>LINKS: <span className="text-white">{canvasConnections.length}</span></span>
              {selectedNodes.size > 0 && <span>| SELECTED: <span className="text-blue-400">{selectedNodes.size}</span></span>}
              <span className="text-white/10">|</span>
              <span>ZOOM: <span className="text-white">{Math.round(zoom * 100)}%</span></span>
          </div>
          <div className="glass-panel p-1 rounded-lg bg-[#0a0a0a]/50 backdrop-blur-md border border-white/10 flex flex-col gap-1 pointer-events-auto">
                <button onClick={() => setZoom(z => Math.min(2.5, z + 0.2))} className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white"><Maximize size={16}/></button>
                <div className="text-[10px] text-center font-mono text-gray-500 py-1 border-t border-b border-white/5">{Math.round(zoom * 100)}%</div>
                <button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} className="p-2 hover:bg-white/10 rounded-md text-gray-400 hover:text-white"><Minimize size={16}/></button>
          </div>
      </div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,#000000_100%)] opacity-60 z-20"></div>
    </div>
  );
};