import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  FileCode, StickyNote, Database, Zap, Trash2, Copy,
  Maximize, Minimize, Grid, Cpu, Sparkles, Loader2, MoreHorizontal,
  Plus, Share2, GitBranch, Code2, Lightbulb, Target, Layers,
  Move, Lock, Unlock, Eye, EyeOff, ChevronDown, Command, Map,
  Bookmark, FolderOpen, CheckSquare, MessageSquare, Link2
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

// Smart Positioning: Finds a spot that doesn't overlap with existing nodes
const findSmartPosition = (parentX, parentY, index, total, existingNodes) => {
    let radius = 400;
    let angle = (index / total) * 2 * Math.PI;
    
    let x = parentX + radius * Math.cos(angle);
    let y = parentY + radius * Math.sin(angle);
    
    let attempts = 0;
    while (attempts < 8) {
        const collision = existingNodes.some(n => Math.abs(n.x - x) < 250 && Math.abs(n.y - y) < 250);
        if (!collision) break;
        
        radius += 120; 
        x = parentX + radius * Math.cos(angle + (attempts * 0.5)); 
        y = parentY + radius * Math.sin(angle + (attempts * 0.5));
        attempts++;
    }
    
    return { x: snapToGrid(x), y: snapToGrid(y) };
};

// --- NODE TEMPLATES ---
const NODE_TEMPLATES = {
  'Quick Note': { type: 'note', title: 'Quick Note', content: 'Ideas and thoughts...' },
  'API Endpoint': { type: 'file', title: 'API Route', content: '// GET /api/endpoint\n// Returns: {}' },
  'Database Schema': { type: 'db', title: 'Schema', content: 'table: users\n- id: uuid\n- name: string' },
  'Component': { type: 'file', title: 'Component.jsx', content: 'export const Component = () => {\n  return <div></div>\n}' },
  'Task': { type: 'note', title: 'Task', content: '☐ TODO item\n☐ Another task' },
  'Documentation': { type: 'note', title: 'Docs', content: '# Documentation\n\nOverview here...' },
};

// --- CONTEXT MENU COMPONENT ---
const ContextMenu = ({ x, y, onClose, items }) => {
  useEffect(() => {
    const handleClick = () => onClose();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed z-[100] bg-[#0a0a0a] border border-white/20 rounded-xl shadow-2xl overflow-hidden min-w-[200px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        {items.map((item, i) => (
          item.divider ? (
            <div key={i} className="h-px bg-white/5 my-1" />
          ) : (
            <button
              key={i}
              onClick={() => { item.onClick(); onClose(); }}
              className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                item.danger 
                  ? 'hover:bg-red-500/10 hover:text-red-400 text-gray-400' 
                  : 'hover:bg-white/5 hover:text-white text-gray-300'
              }`}
            >
              {item.icon && <span className="w-4">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.shortcut && <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500">{item.shortcut}</kbd>}
            </button>
          )
        ))}
      </div>
    </motion.div>
  );
};

// --- MINI MAP COMPONENT ---
const MiniMap = ({ nodes, pan, zoom, containerSize, onNavigate }) => {
  const mapSize = 200;
  const scale = 0.05;
  
  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    return {
      minX: Math.min(...xs, 0),
      maxX: Math.max(...xs, 1000) + 280,
      minY: Math.min(...ys, 0),
      maxY: Math.max(...ys, 1000) + 200,
    };
  }, [nodes]);

  const viewportRect = {
    x: (-pan.x / zoom) * scale,
    y: (-pan.y / zoom) * scale,
    width: (containerSize.width / zoom) * scale,
    height: (containerSize.height / zoom) * scale,
  };

  return (
    <div className="bg-[#0a0a0a]/90 border border-white/10 rounded-lg overflow-hidden backdrop-blur-md">
      <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
        <Map size={12} className="text-blue-400" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mini Map</span>
      </div>
      <svg 
        width={mapSize} 
        height={mapSize}
        className="cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - rect.left) / scale;
          const y = (e.clientY - rect.top) / scale;
          onNavigate(-x * zoom + containerSize.width / 2, -y * zoom + containerSize.height / 2);
        }}
      >
        {/* Grid Background */}
        <rect width={mapSize} height={mapSize} fill="#0a0a0a" />
        
        {/* Nodes */}
        {nodes.map((node, i) => (
          <rect
            key={i}
            x={node.x * scale}
            y={node.y * scale}
            width={14}
            height={10}
            fill={node.type === 'file' ? '#60a5fa' : node.type === 'db' ? '#a78bfa' : '#fbbf24'}
            opacity={0.6}
            rx={1}
          />
        ))}
        
        {/* Viewport */}
        <rect
          x={viewportRect.x}
          y={viewportRect.y}
          width={viewportRect.width}
          height={viewportRect.height}
          fill="none"
          stroke="#60a5fa"
          strokeWidth={2}
          strokeDasharray="3,3"
          opacity={0.8}
        />
      </svg>
    </div>
  );
};

// --- ISOLATED NODE COMPONENT (ENHANCED) ---
const CanvasNode = React.memo(({ 
    node, 
    isSelected, 
    isSparking, 
    zoom, 
    onStartDrag, 
    onUpdate, 
    onDelete,
    onDuplicate,
    onSpark, 
    onStartConnection,
    onLock
}) => {
    const [showSparkMenu, setShowSparkMenu] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    const nodeStyles = {
        file: { 
          color: 'text-blue-400', 
          border: 'border-blue-500/30', 
          glow: 'shadow-blue-500/20', 
          icon: <FileCode size={14} />, 
          label: 'FILE',
          gradient: 'from-blue-500/10 to-transparent'
        },
        note: { 
          color: 'text-amber-400', 
          border: 'border-amber-500/30', 
          glow: 'shadow-amber-500/20', 
          icon: <StickyNote size={14} />, 
          label: 'NOTE',
          gradient: 'from-amber-500/10 to-transparent'
        },
        db: { 
          color: 'text-purple-400', 
          border: 'border-purple-500/30', 
          glow: 'shadow-purple-500/20', 
          icon: <Database size={14} />, 
          label: 'DATA',
          gradient: 'from-purple-500/10 to-transparent'
        },
    };

    const style = nodeStyles[node.type] || nodeStyles.file;
    const detailLevel = zoom > 0.6 ? 'high' : zoom > 0.35 ? 'medium' : 'low';
    const width = detailLevel === 'low' ? 'w-[100px]' : 'w-[320px]';
    const height = detailLevel === 'low' ? 'h-[100px]' : 'auto';

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            className={`absolute flex flex-col ${width} ${height} rounded-xl overflow-visible backdrop-blur-xl bg-[#0a0a0a]/95 border-2 ${
              isSelected ? 'border-blue-500 shadow-2xl shadow-blue-500/30' : style.border
            } transition-all duration-200 hover:shadow-2xl ${style.glow} group z-10`}
            style={{
                left: node.x,
                top: node.y,
            }}
            onClick={(e) => { e.stopPropagation(); setShowSparkMenu(false); }} 
            onMouseUp={(e) => { e.stopPropagation(); onStartConnection(node, true); }} 
        >
            {/* Top Gradient Line */}
            <div className={`h-1 w-full bg-gradient-to-r ${style.gradient} opacity-70`}></div>

            {/* HEADER */}
            <div 
                className={`h-10 flex items-center justify-between px-3 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5 select-none rounded-t-xl ${
                  isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-move'
                }`}
                onMouseDown={(e) => !isLocked && onStartDrag(e, node)}
            >
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${style.color}`}>
                    {detailLevel !== 'low' ? (
                      <div className="flex items-center gap-2">
                        {style.icon}
                        <span>{style.label}</span>
                      </div>
                    ) : (
                      <div className="scale-150 pl-1">{style.icon}</div>
                    )}
                </div>
                
                {detailLevel === 'high' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsLocked(!isLocked); }} 
                            className={`p-1 rounded transition-colors ${isLocked ? 'text-red-400' : 'text-gray-500 hover:text-white'}`}
                            title={isLocked ? "Unlock" : "Lock"}
                        >
                            {isLocked ? <Lock size={12}/> : <Unlock size={12}/>}
                        </button>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowSparkMenu(!showSparkMenu); }} 
                            className={`p-1 rounded transition-colors ${isSparking || showSparkMenu ? 'text-yellow-400 bg-yellow-500/10' : 'text-gray-500 hover:text-yellow-400'}`}
                            title="AI Actions"
                        >
                            {isSparking ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                        </button>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDuplicate(node); }} 
                            className="text-gray-500 hover:text-blue-400 p-1 rounded hover:bg-blue-500/10"
                            title="Duplicate"
                        >
                            <Copy size={12}/>
                        </button>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} 
                            className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10"
                            title="Delete"
                        >
                            <Trash2 size={12}/>
                        </button>

                        {/* --- AI ACTION MENU --- */}
                        <AnimatePresence>
                          {showSparkMenu && !isSparking && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="absolute top-9 right-0 w-44 bg-[#0a0a0a] border border-white/20 rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col text-xs"
                            >
                                <div className="px-3 py-2 bg-gradient-to-r from-yellow-500/10 to-transparent border-b border-white/5 text-[9px] font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                                  <Sparkles size={10}/> AI Assistant
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); onSpark(node, 'expand'); setShowSparkMenu(false); }} className="px-3 py-2.5 text-left hover:bg-blue-500/10 hover:text-blue-400 transition-colors flex items-center gap-2 border-b border-white/5">
                                    <GitBranch size={12}/> Expand Ideas
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onSpark(node, 'critique'); setShowSparkMenu(false); }} className="px-3 py-2.5 text-left hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2 border-b border-white/5">
                                    <Target size={12}/> Find Issues
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onSpark(node, 'code'); setShowSparkMenu(false); }} className="px-3 py-2.5 text-left hover:bg-green-500/10 hover:text-green-400 transition-colors flex items-center gap-2 border-b border-white/5">
                                    <Code2 size={12}/> Generate Code
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onSpark(node, 'simplify'); setShowSparkMenu(false); }} className="px-3 py-2.5 text-left hover:bg-purple-500/10 hover:text-purple-400 transition-colors flex items-center gap-2">
                                    <Lightbulb size={12}/> Simplify
                                </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* CONTENT */}
            {detailLevel === 'high' ? (
                <div className="p-3 flex flex-col gap-2 relative" onMouseDown={e => e.stopPropagation()}>
                    <input 
                        className="bg-transparent text-white font-semibold text-sm w-full outline-none placeholder-gray-600 focus:placeholder-gray-500"
                        value={node.data.title}
                        onChange={(e) => onUpdate(node.id, { data: { ...node.data, title: e.target.value } })}
                        placeholder="Node Title..."
                        disabled={isLocked}
                    />
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full"></div>
                    <textarea 
                        className="bg-black/30 rounded-lg p-2.5 text-gray-400 text-xs w-full outline-none resize-none h-28 placeholder-gray-700 leading-relaxed font-mono border border-transparent focus:border-blue-500/30 focus:bg-black/50 transition-all custom-scrollbar"
                        value={node.data.content}
                        onChange={(e) => onUpdate(node.id, { data: { ...node.data, content: e.target.value } })}
                        placeholder={node.type === 'file' ? '// Your code here...' : node.type === 'db' ? 'Schema definition...' : 'Notes and ideas...'}
                        spellCheck={false}
                        disabled={isLocked}
                    />
                    <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="text-[9px] text-gray-600 font-mono">ID: {node.id.slice(0,6)}</div>
                        {node.data.content.length > 0 && (
                          <div className="text-[9px] text-gray-600">{node.data.content.length} chars</div>
                        )}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-red-500' : 'bg-green-500'} opacity-50`}></div>
                    </div>
                </div>
            ) : detailLevel === 'medium' ? (
                <div className="p-4 flex items-center justify-center h-full">
                    <div className="text-white font-bold text-center leading-tight line-clamp-3">
                        {node.data.title || "Untitled"}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center opacity-30">
                    <Layers size={24} className="text-white" />
                </div>
            )}

            {/* OUTPUT PORT */}
            {detailLevel !== 'low' && (
                <div 
                    className="absolute -right-3 top-12 w-6 h-6 flex items-center justify-center cursor-crosshair group/connector z-50"
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onStartConnection(node, false); 
                    }}
                >
                    <div className="w-3 h-3 rounded-full bg-[#0a0a0a] border-2 border-gray-600 group-hover/connector:border-blue-400 group-hover/connector:bg-blue-500 group-hover/connector:scale-125 transition-all shadow-lg"></div>
                </div>
            )}

            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute -inset-1 border-2 border-blue-500 rounded-xl pointer-events-none animate-pulse"></div>
            )}
        </motion.div>
    );
}, (prev, next) => {
    return (
        prev.node === next.node &&
        prev.isSelected === next.isSelected &&
        prev.isSparking === next.isSparking &&
        prev.zoom === next.zoom
    );
});


// --- MAIN CANVAS COMPONENT ---
export const Canvas = () => {
  const { 
    canvasNodes, 
    updateCanvasNode, 
    addCanvasNode,
    deleteCanvasNode, 
    theme, 
    sendMessage,
    setCurrentView,
    canvasConnections,
    setCanvasConnections
  } = useLumina();

  // State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [selectionBox, setSelectionBox] = useState(null);
  const [connectingSource, setConnectingSource] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredConnection, setHoveredConnection] = useState(null);
  const [sparkingNodeId, setSparkingNodeId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Refs
  const containerRef = useRef(null);
  const stateRef = useRef({ zoom: 1, pan: { x: 0, y: 0 }, nodes: [] });
  const dragRef = useRef({ active: false, type: null, startX: 0, startY: 0, initialPan: {}, initialNodes: [] });

  // Sync Refs
  useEffect(() => { stateRef.current.zoom = zoom; }, [zoom]);
  useEffect(() => { stateRef.current.pan = pan; }, [pan]);
  useEffect(() => { stateRef.current.nodes = canvasNodes; }, [canvasNodes]);

  // Track container size
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Delete key for selected nodes
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodes.size > 0 && !e.target.matches('input, textarea')) {
          e.preventDefault();
          selectedNodes.forEach(id => deleteCanvasNode(id));
          setSelectedNodes(new Set());
        }
      }
      // Cmd/Ctrl + D to duplicate
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        selectedNodes.forEach(id => {
          const node = canvasNodes.find(n => n.id === id);
          if (node) handleDuplicate(node);
        });
      }
      // Cmd/Ctrl + A to select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedNodes(new Set(canvasNodes.map(n => n.id)));
      }
      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedNodes(new Set());
        setShowTemplates(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, canvasNodes, deleteCanvasNode]);

  // Global Events
  useEffect(() => {
    const handleGlobalMove = (e) => {
      if (connectingSource && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({ 
            x: (e.clientX - rect.left - stateRef.current.pan.x) / stateRef.current.zoom, 
            y: (e.clientY - rect.top - stateRef.current.pan.y) / stateRef.current.zoom 
        });
      }

      if (e.buttons === 0 && dragRef.current.active) {
        handleGlobalUp();
        return;
      }

      if (!dragRef.current.active) return;

      e.preventDefault();
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
            updateCanvasNode(n.id, { x: snapToGrid(n.x + dx), y: snapToGrid(n.y + dy) });
        });
      }
      else if (type === 'selection' && selectionBox) {
         if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const endX = (e.clientX - rect.left - stateRef.current.pan.x) / currentZoom;
            const endY = (e.clientY - rect.top - stateRef.current.pan.y) / currentZoom;
            setSelectionBox(prev => ({ ...prev, endX, endY }));
         }
      }
    };

    const handleGlobalUp = () => {
      if (dragRef.current.type === 'selection' && selectionBox) {
        const { startX, startY, endX, endY } = selectionBox;
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);
        
        const selected = stateRef.current.nodes.filter(node => 
          node.x + 160 >= minX && node.x + 160 <= maxX &&
          node.y + 100 >= minY && node.y + 100 <= maxY
        );
        setSelectedNodes(new Set(selected.map(n => n.id)));
        setSelectionBox(null);
      }

      setTimeout(() => {
          if (dragRef.current.type !== 'node') setConnectingSource(null);
      }, 50);

      dragRef.current = { active: false, type: null, startX: 0, startY: 0, initialPan: { x: 0, y: 0 }, initialNodes: [] };
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('blur', handleGlobalUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('blur', handleGlobalUp);
    };
  }, [selectionBox, connectingSource, updateCanvasNode]);

  // Handlers
  const startCanvasDrag = (e) => {
    if (e.button === 2) {
      e.preventDefault();
      const x = e.clientX;
      const y = e.clientY;
      setContextMenu({ x, y, type: 'canvas' });
      return;
    }

    if (e.button === 1 || e.target === containerRef.current || e.target.classList.contains('grid-bg')) {
       if (e.shiftKey) {
          const rect = containerRef.current.getBoundingClientRect();
          const startX = (e.clientX - rect.left - pan.x) / zoom;
          const startY = (e.clientY - rect.top - pan.y) / zoom;
          setSelectionBox({ startX, startY, endX: startX, endY: startY });
          dragRef.current = { active: true, type: 'selection', startX: 0, startY: 0, initialPan: {}, initialNodes: [] };
       } else {
          dragRef.current = { active: true, type: 'canvas', startX: e.clientX, startY: e.clientY, initialPan: { ...pan }, initialNodes: [] };
       }
    }
  };

  const handleStartNodeDrag = useCallback((e, node) => {
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
  }, [selectedNodes, pan]);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = -e.deltaY * 0.001;
      setZoom(z => Math.min(Math.max(0.2, z + zoomFactor), 2.5));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  const handleConnectionLogic = useCallback((node, isTarget) => {
      if (!isTarget) {
          setConnectingSource(node);
      } else {
          setConnectingSource(prev => {
              if (prev && prev.id !== node.id) {
                 const exists = canvasConnections.some(c => c.from === prev.id && c.to === node.id);
                 if (!exists) setCanvasConnections(p => [...p, { from: prev.id, to: node.id }]);
              }
              return null;
          });
      }
  }, [canvasConnections, setCanvasConnections]);

  const handleDuplicate = useCallback((node) => {
    const newX = node.x + 60;
    const newY = node.y + 60;
    addCanvasNode(node.type, newX, newY, { 
      title: `${node.data.title} (Copy)`, 
      content: node.data.content 
    });
  }, [addCanvasNode]);

  // --- SMART SPARK AGENT HANDLER ---
  const handleSpark = async (parentNode, mode = 'expand') => {
      if (sparkingNodeId) return;
      setSparkingNodeId(parentNode.id);

      try {
        let prompt = "";
        let mockResponses = [];
        
        if (mode === 'expand') {
            prompt = `Given the concept "${parentNode.data.title}", suggest 3 sub-topics.`;
            mockResponses = ["Core Logic", "Helper Functions", "Error Handling"];
        } else if (mode === 'critique') {
            prompt = `Critique the logic in "${parentNode.data.title}". Find 3 potential flaws.`;
            mockResponses = ["Performance Issue", "Security Concern", "Edge Case"];
        } else if (mode === 'code') {
            prompt = `Generate code snippets for "${parentNode.data.title}".`;
            mockResponses = ["utils.js", "api.ts", "constants.js"];
        } else if (mode === 'simplify') {
            prompt = `Simplify "${parentNode.data.title}" into 2 simpler concepts.`;
            mockResponses = ["Basic Implementation", "Advanced Features"];
        }

        await new Promise(r => setTimeout(r, 1200)); 
        
        mockResponses.forEach((title, index) => {
            const pos = findSmartPosition(parentNode.x, parentNode.y, index, mockResponses.length, stateRef.current.nodes);
            
            let type = 'note';
            if (mode === 'code') type = 'file';
            if (mode === 'critique') type = 'note'; 
            
            const content = mode === 'code' 
                ? `// ${title}\nfunction example() {\n  // TODO: Implement\n}` 
                : mode === 'critique' 
                    ? `⚠️ ${title}\n\nDescription: AI detected potential issue here...` 
                    : `Related to: ${parentNode.data.title}\n\nAnalysis...`;

            const newNodeId = addCanvasNode(type, pos.x, pos.y, { title, content });
            
            // Auto-connect to parent
            setTimeout(() => {
              setCanvasConnections(prev => [...prev, { from: parentNode.id, to: newNodeId }]);
            }, 100);
        });

      } catch (error) {
          console.error("AI Spark failed", error);
      } finally {
          setSparkingNodeId(null);
      }
  };

  const generateArchitecture = () => {
    const context = canvasNodes.map(n => `[${n.type.toUpperCase()}] ${n.data.title}: ${n.data.content}`).join('\n');
    const connectionsCtx = canvasConnections.map(c => {
        const from = canvasNodes.find(n => n.id === c.from)?.data.title || c.from;
        const to = canvasNodes.find(n => n.id === c.to)?.data.title || c.to;
        return `${from} -> ${to}`;
    }).join('\n');
    setCurrentView('chat');
    sendMessage(`Analyze System Architecture:\n\n${context}\n\nConnections:\n${connectionsCtx}`);
  };

  const autoLayout = () => {
    const positioned = new Set();
    let cx = 100, cy = 100;
    canvasNodes.forEach((node, i) => {
        if (!positioned.has(node.id)) {
            updateCanvasNode(node.id, { x: cx, y: cy });
            positioned.add(node.id);
            cx += 400;
            if ((i + 1) % 3 === 0) { cx = 100; cy += 350; }
        }
    });
  };

  const centerView = () => {
    if (canvasNodes.length === 0) return;
    const avgX = canvasNodes.reduce((sum, n) => sum + n.x, 0) / canvasNodes.length;
    const avgY = canvasNodes.reduce((sum, n) => sum + n.y, 0) / canvasNodes.length;
    setPan({
      x: containerSize.width / 2 - avgX * zoom,
      y: containerSize.height / 2 - avgY * zoom
    });
  };

  const addNodeFromTemplate = (template) => {
    const centerX = (-pan.x + containerSize.width / 2) / zoom - 160;
    const centerY = (-pan.y + containerSize.height / 2) / zoom - 100;
    addCanvasNode(template.type, centerX, centerY, { 
      title: template.title, 
      content: template.content 
    });
  };

  return (
    <div 
      className="w-full h-full relative bg-[#030304] overflow-hidden flex flex-col font-sans select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* GLOBAL CSS FOR ANIMATION */}
      <style>{`
        @keyframes flow { to { stroke-dashoffset: -20; } }
        .connection-flow { stroke-dasharray: 5; animation: flow 0.5s linear infinite; }
      `}</style>

      {/* BACKGROUND GRID */}
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
        <div className="glass-panel px-2 py-2 rounded-2xl flex gap-2 shadow-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
            <button 
              onClick={() => setShowTemplates(!showTemplates)} 
              className={`p-2.5 rounded-xl transition-all flex items-center gap-2 ${
                showTemplates ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title="Templates"
            >
              <Plus size={18}/>
              <ChevronDown size={14} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`}/>
            </button>
            
            <div className="w-px h-8 bg-white/10 self-center"></div>
            
            <button onClick={() => addCanvasNode('file', -pan.x/zoom + containerSize.width/(2*zoom) - 160, -pan.y/zoom + containerSize.height/(2*zoom) - 100)} className="p-2.5 hover:bg-blue-500/20 rounded-xl text-gray-400 hover:text-blue-400 transition-all" title="File Node"><FileCode size={18}/></button>
            <button onClick={() => addCanvasNode('note', -pan.x/zoom + containerSize.width/(2*zoom) - 160, -pan.y/zoom + containerSize.height/(2*zoom) - 100)} className="p-2.5 hover:bg-amber-500/20 rounded-xl text-gray-400 hover:text-amber-400 transition-all" title="Note Node"><StickyNote size={18}/></button>
            <button onClick={() => addCanvasNode('db', -pan.x/zoom + containerSize.width/(2*zoom) - 160, -pan.y/zoom + containerSize.height/(2*zoom) - 100)} className="p-2.5 hover:bg-purple-500/20 rounded-xl text-gray-400 hover:text-purple-400 transition-all" title="Database Node"><Database size={18}/></button>
            
            <div className="w-px h-8 bg-white/10 self-center"></div>
            
            <button onClick={autoLayout} className="p-2.5 hover:bg-green-500/20 rounded-xl text-gray-400 hover:text-green-400 transition-all" title="Auto Layout"><Grid size={18}/></button>
            <button onClick={centerView} className="p-2.5 hover:bg-cyan-500/20 rounded-xl text-gray-400 hover:text-cyan-400 transition-all" title="Center View"><Target size={18}/></button>
            
            {selectedNodes.size > 0 && (
              <>
                <div className="w-px h-8 bg-white/10 self-center"></div>
                <button onClick={() => { selectedNodes.forEach(id => deleteCanvasNode(id)); setSelectedNodes(new Set()); }} className="p-2.5 hover:bg-red-500/20 rounded-xl text-gray-400 hover:text-red-400 transition-all" title="Delete Selected"><Trash2 size={18}/></button>
              </>
            )}
            
            <div className="w-px h-8 bg-white/10 self-center"></div>
            
            <button 
              onClick={generateArchitecture} 
              className={`flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl text-xs font-bold text-white ${theme.primaryBg} hover:brightness-110 shadow-lg transition-all`}
            >
              <Sparkles size={14} className="animate-pulse"/>
              <span>AI Analyze</span>
            </button>
        </div>

        {/* Template Dropdown */}
        <AnimatePresence>
          {showTemplates && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-16 left-0 w-64 bg-[#0a0a0a]/95 border border-white/20 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-50"
            >
              <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-transparent">
                <h3 className="text-sm font-bold text-white">Node Templates</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Quick start your workflow</p>
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {Object.entries(NODE_TEMPLATES).map(([name, template]) => (
                  <button
                    key={name}
                    onClick={() => { addNodeFromTemplate(template); setShowTemplates(false); }}
                    className="w-full px-3 py-2.5 rounded-lg hover:bg-white/5 text-left transition-colors group flex items-start gap-3"
                  >
                    {template.type === 'file' && <FileCode size={16} className="text-blue-400 mt-0.5" />}
                    {template.type === 'note' && <StickyNote size={16} className="text-amber-400 mt-0.5" />}
                    {template.type === 'db' && <Database size={16} className="text-purple-400 mt-0.5" />}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{name}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{template.content}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CANVAS VIEWPORT */}
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
            {/* SVG CONNECTION LAYER */}
            <svg 
                className="absolute top-0 left-0 overflow-visible pointer-events-none"
                style={{ 
                    width: '1px', 
                    height: '1px', 
                    zIndex: 0, 
                    overflow: 'visible' 
                }}
            >
                <defs>
                    {/* Gradient for normal connections */}
                    <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6"/>
                        <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.6"/>
                    </linearGradient>
                    
                    {/* Gradient for hover */}
                    <linearGradient id="connectionGradientHover" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f87171" stopOpacity="0.8"/>
                        <stop offset="50%" stopColor="#fb923c" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#f87171" stopOpacity="0.8"/>
                    </linearGradient>
                    
                    {/* Gradient for active (AI working) */}
                    <linearGradient id="connectionGradientActive" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6"/>
                        <stop offset="50%" stopColor="#facc15" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.6"/>
                    </linearGradient>
                    
                    {/* Enhanced arrow markers */}
                    <marker id="arrowhead" markerWidth="12" markerHeight="10" refX="11" refY="5" orient="auto">
                        <path d="M 0 0 L 12 5 L 0 10 z" fill="url(#connectionGradient)" />
                    </marker>
                    <marker id="arrowhead-hover" markerWidth="12" markerHeight="10" refX="11" refY="5" orient="auto">
                        <path d="M 0 0 L 12 5 L 0 10 z" fill="#fb923c" />
                    </marker>
                    <marker id="arrowhead-active" markerWidth="12" markerHeight="10" refX="11" refY="5" orient="auto">
                        <path d="M 0 0 L 12 5 L 0 10 z" fill="#facc15" />
                    </marker>
                    
                    {/* Enhanced glow filter */}
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    
                    <filter id="glowStrong">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                </defs>

                {canvasConnections.map((conn, i) => {
                    const source = canvasNodes.find(n => n.id === conn.from);
                    const target = canvasNodes.find(n => n.id === conn.to);
                    
                    if (!source || !target) return null;

                    const isHovered = hoveredConnection === i;
                    const isActive = sparkingNodeId === conn.from;

                    const startX = source.x + 320; 
                    const startY = source.y + 48; 
                    const endX = target.x;
                    const endY = target.y + 48;

                    return (
                        <g key={i} style={{ pointerEvents: 'auto' }}>
                            {/* Hit Area */}
                            <path 
                                d={getBezierPath(startX, startY, endX, endY)} 
                                fill="none" 
                                stroke="transparent" 
                                strokeWidth="24" 
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredConnection(i)} 
                                onMouseLeave={() => setHoveredConnection(null)}
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (window.confirm('Delete this connection?')) {
                                        setCanvasConnections(p => p.filter((_, idx) => idx !== i)); 
                                    }
                                }}
                            />
                            
                            {/* Background glow line */}
                            {(isHovered || isActive) && (
                              <path 
                                  d={getBezierPath(startX, startY, endX, endY)} 
                                  fill="none" 
                                  stroke={isHovered ? "#fb923c" : "#facc15"} 
                                  strokeWidth="8"
                                  className="pointer-events-none opacity-40 blur-sm"
                              />
                            )}
                            
                            {/* Main Visual Line */}
                            <path 
                                d={getBezierPath(startX, startY, endX, endY)} 
                                fill="none" 
                                stroke={isHovered ? "url(#connectionGradientHover)" : isActive ? "url(#connectionGradientActive)" : "url(#connectionGradient)"} 
                                strokeWidth={isHovered ? "3.5" : isActive ? "3" : "2.5"}
                                strokeLinecap="round"
                                className={`transition-all duration-300 pointer-events-none ${isActive ? 'connection-flow' : ''}`}
                                style={{ filter: isHovered ? 'url(#glowStrong)' : 'url(#glow)' }}
                                markerEnd={isHovered ? "url(#arrowhead-hover)" : isActive ? "url(#arrowhead-active)" : "url(#arrowhead)"}
                            />
                            
                            {/* Connection dots */}
                            <circle 
                              cx={startX} 
                              cy={startY} 
                              r={isHovered || isActive ? "4" : "3"} 
                              fill={isHovered ? "#fb923c" : isActive ? "#facc15" : "#60a5fa"}
                              className="transition-all duration-200"
                              style={{ filter: 'url(#glow)' }}
                            />
                            <circle 
                              cx={endX} 
                              cy={endY} 
                              r={isHovered || isActive ? "4" : "3"} 
                              fill={isHovered ? "#fb923c" : isActive ? "#facc15" : "#60a5fa"}
                              className="transition-all duration-200"
                              style={{ filter: 'url(#glow)' }}
                            />
                        </g>
                    );
                })}

                {/* Dragging Line */}
                {connectingSource && (
                    <>
                      {/* Glow background */}
                      <path 
                          d={getBezierPath(connectingSource.x + 320, connectingSource.y + 48, mousePos.x, mousePos.y)} 
                          fill="none" 
                          stroke="#facc15" 
                          strokeWidth="6" 
                          className="opacity-30 blur-sm"
                      />
                      {/* Main line */}
                      <path 
                          d={getBezierPath(connectingSource.x + 320, connectingSource.y + 48, mousePos.x, mousePos.y)} 
                          fill="none" 
                          stroke="url(#connectionGradientActive)" 
                          strokeWidth="3" 
                          strokeDasharray="8,4" 
                          strokeLinecap="round"
                          className="animate-pulse"
                          style={{ filter: 'url(#glow)' }}
                      />
                      {/* Source dot */}
                      <circle 
                        cx={connectingSource.x + 320} 
                        cy={connectingSource.y + 48} 
                        r="4" 
                        fill="#facc15"
                        className="animate-pulse"
                        style={{ filter: 'url(#glow)' }}
                      />
                    </>
                )}
            </svg>

            {/* NODES LAYER */}
            <AnimatePresence>
                {canvasNodes.map(node => (
                    <CanvasNode 
                        key={node.id}
                        node={node}
                        isSelected={selectedNodes.has(node.id)}
                        isSparking={sparkingNodeId === node.id}
                        zoom={zoom}
                        onStartDrag={handleStartNodeDrag}
                        onUpdate={updateCanvasNode}
                        onDelete={deleteCanvasNode}
                        onDuplicate={handleDuplicate}
                        onSpark={handleSpark}
                        onStartConnection={handleConnectionLogic}
                    />
                ))}
            </AnimatePresence>

            {/* SELECTION BOX */}
            {selectionBox && (
              <div className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none rounded"
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

      {/* FOOTER */}
      <div className="absolute bottom-6 left-6 flex items-end gap-4 pointer-events-none z-40">
          <div className="glass-panel px-4 py-2.5 rounded-xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 flex items-center gap-4 text-xs font-mono text-gray-500 pointer-events-auto">
              <div className="flex items-center gap-2">
                <Cpu size={14} className={theme.accentText} />
                <span>NODES</span>
                <span className="text-white font-bold">{canvasNodes.length}</span>
              </div>
              <div className="w-px h-4 bg-white/10"></div>
              <div className="flex items-center gap-2">
                <Link2 size={14} className="text-purple-400" />
                <span>LINKS</span>
                <span className="text-white font-bold">{canvasConnections.length}</span>
              </div>
              <div className="w-px h-4 bg-white/10"></div>
              <div className="flex items-center gap-2">
                <Target size={14} className="text-green-400" />
                <span>ZOOM</span>
                <span className="text-white font-bold">{Math.round(zoom * 100)}%</span>
              </div>
              {selectedNodes.size > 0 && (
                <>
                  <div className="w-px h-4 bg-white/10"></div>
                  <div className="flex items-center gap-2">
                    <CheckSquare size={14} className="text-blue-400" />
                    <span>SELECTED</span>
                    <span className="text-white font-bold">{selectedNodes.size}</span>
                  </div>
                </>
              )}
          </div>
      </div>

      {/* ZOOM CONTROLS - BOTTOM RIGHT ABOVE MINIMAP */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-50 pointer-events-auto">
          {canvasNodes.length > 0 && (
            <MiniMap 
              nodes={canvasNodes}
              pan={pan}
              zoom={zoom}
              containerSize={containerSize}
              onNavigate={(x, y) => setPan({ x, y })}
            />
          )}
          
          <div className="glass-panel rounded-xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 overflow-hidden">
              <button 
                onClick={() => setZoom(z => Math.min(2.5, z + 0.2))} 
                className="w-full p-2.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors border-b border-white/5"
                title="Zoom In"
              >
                <Maximize size={16} className="mx-auto"/>
              </button>
              <div className="px-3 py-2 text-center">
                <div className="text-xs font-mono font-bold text-white">{Math.round(zoom * 100)}%</div>
              </div>
              <button 
                onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} 
                className="w-full p-2.5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors border-t border-white/5"
                title="Zoom Out"
              >
                <Minimize size={16} className="mx-auto"/>
              </button>
          </div>
      </div>

      {/* VIGNETTE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,#000000_100%)] opacity-50 z-30"></div>

      {/* CONTEXT MENU */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            items={[
              { icon: <FileCode size={14}/>, label: 'Add File Node', onClick: () => addCanvasNode('file', -pan.x/zoom, -pan.y/zoom), shortcut: 'F' },
              { icon: <StickyNote size={14}/>, label: 'Add Note', onClick: () => addCanvasNode('note', -pan.x/zoom, -pan.y/zoom), shortcut: 'N' },
              { icon: <Database size={14}/>, label: 'Add Database', onClick: () => addCanvasNode('db', -pan.x/zoom, -pan.y/zoom), shortcut: 'D' },
              { divider: true },
              { icon: <Grid size={14}/>, label: 'Auto Layout', onClick: autoLayout },
              { icon: <Target size={14}/>, label: 'Center View', onClick: centerView },
            ]}
          />
        )}
      </AnimatePresence>
    </div>
  );
};