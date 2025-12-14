import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  RotateCcw, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Archive,
  Trash2,
  Download,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle,
  Layers,
  MessageSquare
} from 'lucide-react';
import { useLumina } from '../context/LuminaContext';

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
};

export const TimeMachine = ({ isOpen, onClose }) => {
  const { 
    theme, 
    timeMachineSnapshots, 
    currentSnapshotIndex,
    setCurrentSnapshotIndex,
    restoreSnapshot,
    deleteSnapshot,
    exportSnapshot,
    currentView
  } = useLumina();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [showDeletedOnly, setShowDeletedOnly] = useState(false);

  // Auto-play through history
  useEffect(() => {
    if (!isPlaying || !timeMachineSnapshots.length) return;
    
    const interval = setInterval(() => {
      setCurrentSnapshotIndex(prev => {
        const next = prev - 1;
        if (next < 0) {
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, timeMachineSnapshots, setCurrentSnapshotIndex]);

  const currentSnapshot = useMemo(() => {
    if (!timeMachineSnapshots.length) return null;
    return timeMachineSnapshots[currentSnapshotIndex];
  }, [timeMachineSnapshots, currentSnapshotIndex]);

  const handleRestore = useCallback(() => {
    if (!currentSnapshot) return;
    
    const confirmed = window.confirm(
      `Restore workspace to ${formatDate(currentSnapshot.timestamp)}?\n\nThis will replace your current work with this snapshot.`
    );
    
    if (confirmed) {
      restoreSnapshot(currentSnapshotIndex);
      onClose();
    }
  }, [currentSnapshot, currentSnapshotIndex, restoreSnapshot, onClose]);

  const handleNext = useCallback(() => {
    setCurrentSnapshotIndex(prev => Math.min(prev + 1, timeMachineSnapshots.length - 1));
    setIsPlaying(false);
  }, [timeMachineSnapshots, setCurrentSnapshotIndex]);

  const handlePrevious = useCallback(() => {
    setCurrentSnapshotIndex(prev => Math.max(prev - 1, 0));
    setIsPlaying(false);
  }, [setCurrentSnapshotIndex]);

  const handleSliderChange = useCallback((e) => {
    const index = parseInt(e.target.value);
    setCurrentSnapshotIndex(index);
    setIsPlaying(false);
  }, [setCurrentSnapshotIndex]);

  const changesCount = useMemo(() => {
    if (!currentSnapshot || timeMachineSnapshots.length < 2) return { added: 0, modified: 0, deleted: 0 };
    
    const currentIndex = timeMachineSnapshots.findIndex(s => s.id === currentSnapshot.id);
    if (currentIndex <= 0) return { added: 0, modified: 0, deleted: 0 };
    
    const previousSnapshot = timeMachineSnapshots[currentIndex - 1];
    if (!previousSnapshot) return { added: 0, modified: 0, deleted: 0 };

    let added = 0, modified = 0, deleted = 0;

    // Count Canvas changes
    if (currentView === 'canvas') {
      const oldNodes = new Set(previousSnapshot.data.canvasNodes?.map(n => n.id) || []);
      const newNodes = new Set(currentSnapshot.data.canvasNodes?.map(n => n.id) || []);
      
      added = (currentSnapshot.data.canvasNodes || []).filter(n => !oldNodes.has(n.id)).length;
      deleted = (previousSnapshot.data.canvasNodes || []).filter(n => !newNodes.has(n.id)).length;
      modified = (currentSnapshot.data.canvasNodes || []).filter(n => {
        const oldNode = (previousSnapshot.data.canvasNodes || []).find(old => old.id === n.id);
        return oldNode && JSON.stringify(oldNode) !== JSON.stringify(n);
      }).length;
    }

    return { added, modified, deleted };
  }, [currentSnapshot, timeMachineSnapshots, currentView]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-[200] bg-gradient-to-t from-black via-[#0A0A0A] to-transparent pointer-events-none"
    >
      {/* Main Control Panel */}
      <div className="max-w-6xl mx-auto px-6 pb-6 pointer-events-auto">
        <div className="bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${theme.softBg} border ${theme.primaryBorder}`}>
                <Clock size={20} className={theme.accentText} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Time Machine</h3>
                <p className="text-xs text-gray-500">
                  {timeMachineSnapshots.length} snapshots
                  {currentSnapshot && ` • Viewing ${formatRelativeTime(currentSnapshot.timestamp)}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeletedOnly(!showDeletedOnly)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  showDeletedOnly 
                    ? `${theme.primaryBg} text-white` 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {showDeletedOnly ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="px-6 py-6">
            {timeMachineSnapshots.length > 0 ? (
              <>
                <div className="relative mb-6">
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, timeMachineSnapshots.length - 1)}
                    value={currentSnapshotIndex}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer time-slider"
                  />
                  
                  {/* Timeline Markers */}
                  <div className="absolute top-6 left-0 right-0 flex justify-between text-[9px] text-gray-600 font-mono">
                    <span>{timeMachineSnapshots.length > 0 ? formatDate(timeMachineSnapshots[0].timestamp) : ''}</span>
                    <span className={theme.accentText}>
                      {currentSnapshot ? formatDate(currentSnapshot.timestamp) : ''}
                    </span>
                    <span>Now</span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevious}
                      disabled={currentSnapshotIndex === 0}
                      className="p-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
                    >
                      <SkipBack size={16} className="text-white" />
                    </button>
                    
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`p-3 rounded-xl ${theme.primaryBg} hover:brightness-110 transition-all shadow-lg`}
                    >
                      {isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white" />}
                    </button>
                    
                    <button
                      onClick={handleNext}
                      disabled={currentSnapshotIndex === timeMachineSnapshots.length - 1}
                      className="p-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
                    >
                      <SkipForward size={16} className="text-white" />
                    </button>

                    <div className="ml-4 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Speed:</span>
                      {[2000, 1000, 500].map(speed => (
                        <button
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
                          className={`px-2 py-1 rounded text-xs transition-all ${
                            playbackSpeed === speed 
                              ? `${theme.primaryBg} text-white` 
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {speed === 2000 ? '0.5x' : speed === 1000 ? '1x' : '2x'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {changesCount.added + changesCount.modified + changesCount.deleted > 0 && (
                      <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg text-xs">
                        {changesCount.added > 0 && (
                          <span className="text-green-400">+{changesCount.added}</span>
                        )}
                        {changesCount.modified > 0 && (
                          <span className="text-yellow-400">~{changesCount.modified}</span>
                        )}
                        {changesCount.deleted > 0 && (
                          <span className="text-red-400">-{changesCount.deleted}</span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => currentSnapshot && exportSnapshot(currentSnapshotIndex)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white transition-all flex items-center gap-2"
                    >
                      <Download size={14} />
                      Export
                    </button>
                    
                    <button
                      onClick={handleRestore}
                      disabled={!currentSnapshot}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        currentSnapshot 
                          ? `${theme.primaryBg} text-white hover:brightness-110 shadow-lg` 
                          : 'bg-white/5 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <RotateCcw size={14} />
                      Restore This Version
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle size={48} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No history snapshots yet</p>
                <p className="text-gray-600 text-xs mt-2">
                  Snapshots are created automatically as you work
                </p>
              </div>
            )}
          </div>

          {/* Snapshot Preview */}
          {currentSnapshot && (
            <div className="px-6 pb-6 border-t border-white/10 pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={16} className="text-blue-400" />
                    <span className="text-sm font-semibold text-white">Canvas</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {currentSnapshot.data.canvasNodes?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">nodes</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={16} className="text-emerald-400" />
                    <span className="text-sm font-semibold text-white">Messages</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {currentSnapshot.data.messages?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">in history</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-amber-400" />
                    <span className="text-sm font-semibold text-white">Events</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {currentSnapshot.data.calendarEvents?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">scheduled</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};