import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLumina } from '../context/LuminaContext';
import { 
  Search, Calendar, MessageSquare, FolderOpen, FileText, 
  Sparkles, Clock, Hash, Globe, ChevronRight, Command,
  Plus, Trash2, Edit3, Play, Grid, PenTool, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- UNIFIED SEARCH ENGINE ---
const searchAll = (query, { sessions, projects, calendarEvents, canvasNodes, zenithFiles }) => {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results = [];
  const now = Date.now();

  // 1. SESSIONS (CHATS)
  (sessions || []).forEach(session => {
    if (!session) return;
    const titleMatch = session.title?.toLowerCase().includes(q);
    const score = titleMatch ? 10 : 0;
    if (score > 0) {
      results.push({
        type: 'chat',
        id: session.id,
        title: session.title || 'Untitled Chat',
        subtitle: session.date ? new Date(session.date).toLocaleDateString() : 'No date',
        icon: MessageSquare,
        action: 'open-chat',
        data: session,
        score,
        timestamp: session.date ? new Date(session.date).getTime() : now
      });
    }
  });

  // 2. PROJECTS
  (projects || []).forEach(project => {
    if (!project) return;
    const nameMatch = project.name?.toLowerCase().includes(q);
    const score = nameMatch ? 10 : 0;
    if (score > 0) {
      results.push({
        type: 'project',
        id: project.id,
        title: project.name || 'Untitled Project',
        subtitle: `${project.files?.length || 0} files`,
        icon: FolderOpen,
        action: 'open-project',
        data: project,
        score,
        timestamp: project.createdAt ? new Date(project.createdAt).getTime() : now
      });
    }
  });

  // 3. CALENDAR EVENTS
  (calendarEvents || []).forEach(event => {
    if (!event) return;
    const titleMatch = event.title?.toLowerCase().includes(q);
    const notesMatch = event.notes?.toLowerCase().includes(q);
    const score = (titleMatch ? 10 : 0) + (notesMatch ? 5 : 0);
    if (score > 0) {
      results.push({
        type: 'event',
        id: event.id,
        title: event.title || 'Untitled Event',
        subtitle: `${event.date || 'No date'}${event.time ? ` at ${event.time}` : ''}`,
        icon: Calendar,
        action: 'open-event',
        data: event,
        score,
        timestamp: event.date ? new Date(event.date).getTime() : now
      });
    }
  });

  // 4. CANVAS NODES
  (canvasNodes || []).forEach(node => {
    if (!node || !node.data) return;
    const titleMatch = node.data.title?.toLowerCase().includes(q);
    const contentMatch = node.data.content?.toLowerCase().includes(q);
    const score = (titleMatch ? 10 : 0) + (contentMatch ? 5 : 0);
    if (score > 0) {
      results.push({
        type: 'canvas',
        id: node.id,
        title: node.data.title || 'Untitled Node',
        subtitle: `${node.type.toUpperCase()} · Canvas`,
        icon: Layout,
        action: 'open-canvas',
        data: node,
        score,
        timestamp: now
      });
    }
  });

  // 5. ZENITH DOCS
  (zenithFiles || []).forEach(doc => {
    if (!doc) return;
    const titleMatch = doc.title?.toLowerCase().includes(q);
    const contentMatch = doc.content?.toLowerCase().includes(q);
    const score = (titleMatch ? 10 : 0) + (contentMatch ? 5 : 0);
    if (score > 0) {
      results.push({
        type: 'zenith',
        id: doc.filename || doc.title,
        title: doc.title || 'Untitled Document',
        subtitle: 'Zenith Document',
        icon: PenTool,
        action: 'open-zenith',
        data: doc,
        score,
        timestamp: doc.lastModified || now
      });
    }
  });

  // Sort by score (desc) then timestamp (desc)
  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.timestamp || 0) - (a.timestamp || 0);
  }).slice(0, 50);
};

// --- QUICK ACTIONS ---
const getQuickActions = (query) => {
  const q = query.toLowerCase();
  const actions = [];

  if (q.includes('new') || q.includes('create')) {
    if (q.includes('chat') || q.includes('conversation')) {
      actions.push({
        type: 'action',
        id: 'create-chat',
        title: 'New Chat',
        subtitle: 'Start a conversation',
        icon: Plus,
        action: 'create-chat'
      });
    }
    if (q.includes('project') || q.includes('folder')) {
      actions.push({
        type: 'action',
        id: 'create-project',
        title: 'New Project',
        subtitle: 'Create a new context',
        icon: Plus,
        action: 'create-project'
      });
    }
    if (q.includes('event') || q.includes('calendar')) {
      actions.push({
        type: 'action',
        id: 'create-event',
        title: 'New Event',
        subtitle: 'Add to calendar',
        icon: Plus,
        action: 'create-event'
      });
    }
    if (q.includes('note') || q.includes('write') || q.includes('zenith')) {
      actions.push({
        type: 'action',
        id: 'create-zenith',
        title: 'New Note',
        subtitle: 'Write in Zenith',
        icon: Plus,
        action: 'create-zenith'
      });
    }
  }

  if (q.includes('open') || q.includes('go to') || q.includes('show')) {
    if (q.includes('canvas')) {
      actions.push({
        type: 'action',
        id: 'open-canvas',
        title: 'Open Canvas',
        subtitle: 'Visual thinking space',
        icon: Layout,
        action: 'open-canvas'
      });
    }
    if (q.includes('chronos') || q.includes('calendar')) {
      actions.push({
        type: 'action',
        id: 'open-chronos',
        title: 'Open Chronos',
        subtitle: 'Time management',
        icon: Calendar,
        action: 'open-chronos'
      });
    }
    if (q.includes('zenith') || q.includes('write')) {
      actions.push({
        type: 'action',
        id: 'open-zenith',
        title: 'Open Zenith',
        subtitle: 'Creative writing',
        icon: PenTool,
        action: 'open-zenith'
      });
    }
  }

  return actions;
};

// --- RESULT ITEM COMPONENT ---
const ResultItem = ({ result, isSelected, onClick }) => {
  const Icon = result.icon;
  
  const typeColors = {
    chat: 'text-blue-400 bg-blue-500/10',
    project: 'text-purple-400 bg-purple-500/10',
    event: 'text-green-400 bg-green-500/10',
    canvas: 'text-pink-400 bg-pink-500/10',
    zenith: 'text-amber-400 bg-amber-500/10',
    action: 'text-indigo-400 bg-indigo-500/10'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group
        ${isSelected 
          ? 'bg-white/10 shadow-lg' 
          : 'hover:bg-white/5'
        }
      `}
    >
      <div className={`p-2 rounded-lg ${typeColors[result.type] || 'text-gray-400 bg-gray-500/10'}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{result.title}</div>
        <div className="text-xs text-gray-500 truncate">{result.subtitle}</div>
      </div>
      <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
    </motion.div>
  );
};

// --- MAIN COMPONENT ---
export const CommandPalette = ({ isOpen, onClose }) => {
  const { 
    sessions, 
    projects, 
    calendarEvents, 
    canvasNodes,
    zenithFiles,
    setCurrentView,
    loadSession,
    setActiveProject,
    addEvent,
    createProject,
    startNewChat
  } = useLumina();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Unified search results
  const results = useMemo(() => {
    if (!query) {
      // Show recent items when no query
      const recent = [
        ...(sessions || []).slice(0, 3).map(s => ({
          type: 'chat',
          id: s.id,
          title: s.title || 'Untitled Chat',
          subtitle: s.date ? new Date(s.date).toLocaleDateString() : 'No date',
          icon: MessageSquare,
          action: 'open-chat',
          data: s
        })),
        ...(projects || []).slice(0, 3).map(p => ({
          type: 'project',
          id: p.id,
          title: p.name || 'Untitled Project',
          subtitle: `${p.files?.length || 0} files`,
          icon: FolderOpen,
          action: 'open-project',
          data: p
        })),
      ];
      return recent.slice(0, 6);
    }

    const searchResults = searchAll(query, { 
      sessions, 
      projects, 
      calendarEvents, 
      canvasNodes, 
      zenithFiles
    });

    const actions = getQuickActions(query);
    
    return [...actions, ...searchResults];
  }, [query, sessions, projects, calendarEvents, canvasNodes, zenithFiles]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
      
      // Emit event for hint
      window.dispatchEvent(new Event('commandPaletteOpened'));
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (result) => {
    // ACTIONS
    if (result.action === 'create-event') {
      setCurrentView('chronos');
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open-event-modal'));
      }, 300);
    } else if (result.action === 'create-project') {
      const name = prompt('Project name:');
      if (name) {
        createProject(name);
        setCurrentView('dashboard');
      }
      onClose();
    } else if (result.action === 'create-zenith') {
      setCurrentView('zenith');
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('zenith-new-file'));
      }, 300);
    } else if (result.action === 'create-chat') {
      startNewChat();
      setCurrentView('chat');
      onClose();
    } else if (result.action === 'open-chronos') {
      setCurrentView('chronos');
      onClose();
    } else if (result.action === 'open-canvas') {
      setCurrentView('canvas');
      onClose();
    } else if (result.action === 'open-zenith') {
      setCurrentView('zenith');
      onClose();
    }
    // OPEN ITEMS
    else if (result.action === 'open-chat') {
      loadSession(result.data.id);
      setCurrentView('chat');
      onClose();
    } else if (result.action === 'open-project') {
      setActiveProject(result.data);
      setCurrentView('dashboard');
      onClose();
    } else if (result.action === 'open-event') {
      setCurrentView('chronos');
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('highlight-event', { detail: { id: result.data.id } }));
      }, 300);
    } else if (result.action === 'open-canvas') {
      setCurrentView('canvas');
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('focus-canvas-node', { detail: { id: result.data.id } }));
      }, 300);
    } else if (result.action === 'open-zenith') {
      setCurrentView('zenith');
      onClose();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('zenith-load-file', { 
          detail: { filename: result.data.filename } 
        }));
      }, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-32 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0A0A0A]/95 border border-white/20 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
      >
        {/* SEARCH INPUT */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          <Search size={20} className="text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search everything... (chats, projects, events, canvas, notes)"
            className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-all"
            >
              ×
            </button>
          )}
        </div>

        {/* RESULTS */}
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-2">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <Search size={32} className="mb-3 opacity-20" />
              <p className="text-sm">No results found</p>
              <p className="text-xs text-gray-700 mt-1">Try searching for chats, projects, events, or canvas nodes</p>
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {results.map((result, index) => (
                  <ResultItem
                    key={result.id || index}
                    result={result}
                    isSelected={index === selectedIndex}
                    onClick={() => handleSelect(result)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between p-3 border-t border-white/5 bg-white/[0.02] text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Command size={12} /> + K to open
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {results.length} results
            </span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/5 rounded">↑↓</kbd>
            <span>navigate</span>
            <kbd className="px-2 py-1 bg-white/5 rounded ml-2">↵</kbd>
            <span>select</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CommandPalette;