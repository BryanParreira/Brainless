import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, PenTool, MessageSquare, Layout, Calendar, Sparkles } from 'lucide-react';
import { useLumina } from '../context/LuminaContext';

const QUICK_ACTIONS = [
  { 
    id: 'note', 
    label: 'Quick Note', 
    icon: PenTool, 
    color: 'from-amber-500 to-orange-500',
    action: 'zenith'
  },
  { 
    id: 'chat', 
    label: 'New Chat', 
    icon: MessageSquare, 
    color: 'from-blue-500 to-cyan-500',
    action: 'chat'
  },
  { 
    id: 'canvas', 
    label: 'Canvas Node', 
    icon: Layout, 
    color: 'from-purple-500 to-pink-500',
    action: 'canvas'
  },
  { 
    id: 'event', 
    label: 'Calendar Event', 
    icon: Calendar, 
    color: 'from-green-500 to-emerald-500',
    action: 'chronos'
  }
];

export const FloatingQuickNote = () => {
  const { setCurrentView, startNewChat, addCanvasNode, theme } = useLumina();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedAction, setSelectedAction] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setIsExpanded(true);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    try {
      switch (selectedAction?.id) {
        case 'note':
          // Create new Zenith document
          const timestamp = Date.now();
          const filename = title.trim() || `Quick Note ${new Date().toLocaleDateString()}`;
          
          if (window.lumina && window.lumina.saveFile) {
            await window.lumina.saveFile(filename + '.md', content);
          }
          
          // Navigate to Zenith
          setCurrentView('zenith');
          
          // Trigger file load
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('zenith-load-file', { 
              detail: { filename: filename + '.md' } 
            }));
          }, 300);
          break;

        case 'chat':
          // Start new chat with this content
          startNewChat();
          setCurrentView('chat');
          
          // Send message
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('quick-chat-message', { 
              detail: { message: content } 
            }));
          }, 300);
          break;

        case 'canvas':
          // Create canvas node
          const centerX = window.innerWidth / 2 - 150;
          const centerY = window.innerHeight / 2 - 100;
          
          addCanvasNode('note', centerX, centerY, {
            title: title.trim() || 'Quick Note',
            content: content
          });
          
          setCurrentView('canvas');
          break;

        case 'event':
          // Create calendar event
          setCurrentView('chronos');
          
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-event-modal', {
              detail: {
                title: title.trim() || 'New Event',
                notes: content
              }
            }));
          }, 300);
          break;

        default:
          break;
      }

      // Reset state
      setContent('');
      setTitle('');
      setIsExpanded(false);
      setIsOpen(false);
      setSelectedAction(null);
    } catch (error) {
      console.error('Error saving quick note:', error);
    }
  };

  const handleCancel = () => {
    setContent('');
    setTitle('');
    setIsExpanded(false);
    setSelectedAction(null);
  };

  return (
    <>
      {/* Main FAB Button */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`fixed bottom-8 right-8 z-[9997] p-4 rounded-full bg-gradient-to-br ${theme.gradient} shadow-2xl ${theme.glow} hover:shadow-indigo-500/40 transition-all`}
            title="Quick Action (⌘N)"
          >
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus size={24} className="text-white" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Action Menu */}
      <AnimatePresence>
        {isOpen && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-8 z-[9997] flex flex-col gap-3"
          >
            {QUICK_ACTIONS.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActionSelect(action)}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0A0A0A] border border-white/10 hover:border-white/20 shadow-lg backdrop-blur-xl transition-all"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} shadow-lg`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-bold text-white whitespace-nowrap">
                    {action.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Note Editor */}
      <AnimatePresence>
        {isExpanded && selectedAction && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={handleCancel}
            />

            {/* Editor Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="fixed bottom-8 right-8 z-[9999] w-[500px] bg-gradient-to-br from-[#0A0A0A] to-[#1A1A1A] border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className={`p-4 border-b border-white/10 bg-gradient-to-r ${selectedAction.color} bg-opacity-10`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${selectedAction.color} shadow-lg`}>
                    {React.createElement(selectedAction.icon, { size: 18, className: 'text-white' })}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">{selectedAction.label}</h3>
                    <p className="text-xs text-gray-500">Press ⌘↵ to save, Esc to cancel</p>
                  </div>
                  <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Input Fields */}
              <div className="p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-all text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleCancel();
                  }}
                />
                
                <textarea
                  ref={textareaRef}
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-48 px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-all resize-none text-sm leading-relaxed"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleCancel();
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                />
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
                <div className="text-xs text-gray-600">
                  {content.length} characters
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold text-gray-400 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!content.trim()}
                    className={`px-4 py-2 rounded-lg bg-gradient-to-r ${selectedAction.color} text-sm font-bold text-white transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Check size={14} />
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingQuickNote;