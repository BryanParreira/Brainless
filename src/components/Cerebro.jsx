import React, { useRef, useCallback, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useLumina } from '../context/LuminaContext';
import { 
  Maximize, Minimize, RefreshCw, Share2, 
  Search, FileText, Globe, Code, File 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Cerebro = () => {
  const { graphData, theme, settings } = useLumina();
  const graphRef = useRef();
  const containerRef = useRef();
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);

  // --- RESIZE HANDLER ---
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    window.addEventListener('resize', updateSize);
    updateSize(); // Init
    
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // --- ACTIONS ---
  const handleNodeClick = useCallback(node => {
    if (!graphRef.current) return;
    
    // Fly to node
    graphRef.current.centerAt(node.x, node.y, 1000);
    graphRef.current.zoom(4, 2000);
    
    // Highlight connections logic could go here
  }, []);

  const handleZoomIn = () => {
    if (graphRef.current) {
        graphRef.current.zoom(graphRef.current.zoom() * 1.5, 500);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
        graphRef.current.zoom(graphRef.current.zoom() / 1.5, 500);
    }
  };

  const handleReset = () => {
    if (graphRef.current) {
        graphRef.current.zoomToFit(500, 50);
    }
  };

  // --- NODE STYLING ---
  const getNodeColor = (node) => {
    if (highlightNodes.has(node)) return '#ffffff';
    
    switch(node.group) {
        case 'url': return '#3B82F6'; // Blue for Web
        case 'pdf': return '#EF4444'; // Red for PDF
        case 'jsx': 
        case 'js':
        case 'ts': return '#EAB308'; // Yellow for Code
        case 'folder': return '#A855F7'; // Purple for Folders
        default: return settings.developerMode ? '#F97316' : '#6366F1'; // Theme Primary
    }
  };

  const getNodeIcon = (type) => {
      if (type === 'url') return <Globe size={12}/>;
      if (['js','jsx','ts','tsx','json'].includes(type)) return <Code size={12}/>;
      return <File size={12}/>;
  };

  return (
    <div ref={containerRef} className="flex-1 h-full bg-[#030304] relative overflow-hidden group">
      
      {/* Background Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

      {/* --- HUD OVERLAY --- */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-4 pointer-events-none">
        {/* Title Card */}
        <motion.div 
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl shadow-2xl pointer-events-auto"
        >
            <div className="flex items-center gap-2 mb-1">
                <Share2 size={16} className={theme.accentText} />
                <h2 className="text-white font-bold text-xs tracking-widest uppercase">Atlas Graph</h2>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-mono">
                <span>{graphData.nodes.length} NODES</span>
                <span className="w-px h-2 bg-white/10"></span>
                <span>{graphData.links.length} LINKS</span>
            </div>
        </motion.div>

        {/* Legend */}
        <motion.div 
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-xl pointer-events-auto space-y-2"
        >
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Web Source
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> Document (PDF)
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Code Logic
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <div className={`w-2 h-2 rounded-full ${settings.developerMode ? 'bg-orange-500' : 'bg-indigo-500'}`}></div> Context
            </div>
        </motion.div>
      </div>

      {/* --- CONTROLS --- */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2 pointer-events-auto">
          <button onClick={handleZoomIn} className="p-2 bg-[#111] hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Maximize size={16}/></button>
          <button onClick={handleZoomOut} className="p-2 bg-[#111] hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Minimize size={16}/></button>
          <button onClick={handleReset} className="p-2 bg-[#111] hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><RefreshCw size={16}/></button>
      </div>

      {/* --- GRAPH ENGINE --- */}
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor="#00000000" // Transparent to show CSS grid
        nodeLabel="id"
        nodeColor={getNodeColor}
        linkColor={() => '#333'}
        nodeRelSize={4}
        linkWidth={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        d3VelocityDecay={0.3}
        onNodeClick={handleNodeClick}
        onNodeHover={(node) => {
            setHoverNode(node || null);
            document.body.style.cursor = node ? 'pointer' : 'default';
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.id;
            const fontSize = 12/globalScale;
            
            // Draw Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
            ctx.fillStyle = getNodeColor(node);
            ctx.fill();
            
            // Draw Glow
            if (node === hoverNode) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = getNodeColor(node);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.shadowBlur = 0; // Reset
            }

            // Draw Text (Only if hovered or zoomed in close)
            if (globalScale > 2 || node === hoverNode) {
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillText(label, node.x, node.y + 8);
            }
        }}
      />
      
      {/* Empty State Overlay */}
      {graphData.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center opacity-30">
                  <Share2 size={48} className="mx-auto mb-4 text-gray-500"/>
                  <h3 className="text-lg font-bold text-white">Atlas is Empty</h3>
                  <p className="text-sm text-gray-400">Add files to your project to visualize connections.</p>
              </div>
          </div>
      )}
    </div>
  );
};