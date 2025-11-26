import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useLumina } from '../context/LuminaContext';
import { Command, FolderOpen, ChevronDown, Check, Upload, Globe, Plus, GitBranch, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dropdown = React.memo(({ label, icon: Icon, value, options, onSelect, activeId, theme, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = useCallback((opt) => {
    onSelect(opt);
    setIsOpen(false);
  }, [onSelect]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-all ${
          disabled
            ? 'text-gray-600 cursor-not-allowed'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
        disabled={disabled}
        aria-label={`${label}: ${value}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {Icon && (
          <Icon
            size={12}
            className={`transition-colors ${
              isOpen && !disabled ? theme.accentText : 'text-gray-500 group-hover:text-white'
            }`}
          />
        )}
        <span className="font-medium max-w-[120px] truncate">{value}</span>
        <ChevronDown
          size={10}
          className={`opacity-50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full left-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl p-1 shadow-2xl z-50 ring-1 ring-black/50"
            role="listbox"
          >
            <div className="text-[9px] uppercase text-gray-500 font-bold px-2 py-2 tracking-widest">
              {label}
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
              {options && options.length > 0 ? (
                options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-colors group"
                    role="option"
                    aria-selected={activeId === opt.id}
                  >
                    <span className="truncate">{opt.name}</span>
                    {activeId === opt.id && <Check size={12} className={theme.accentText} />}
                  </button>
                ))
              ) : (
                <div className="px-2 py-4 text-xs text-gray-500 text-center">No options available</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Dropdown.displayName = 'Dropdown';

export const CommandBar = () => {
  const {
    isOllamaRunning,
    currentModel,
    setCurrentModel,
    availableModels,
    projects,
    activeProject,
    setActiveProject,
    addFiles,
    addFolder,
    addUrl,
    gitStatus,
    settings,
    theme,
  } = useLumina();

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const urlInputRef = useRef(null);

  const modelOptions = useMemo(() => availableModels.map(m => ({ id: m, name: m })), [availableModels]);
  const projectOptions = useMemo(
    () => [{ id: 'none', name: 'General Chat' }, ...projects.map(p => ({ id: p.id, name: p.name }))],
    [projects]
  );

  const validateUrl = useCallback((urlString) => {
    if (!urlString.trim()) {
      setUrlError('URL cannot be empty');
      return false;
    }
    try {
      new URL(urlString);
      setUrlError("");
      return true;
    } catch (e) {
      setUrlError('Invalid URL format');
      return false;
    }
  }, []);

  const handleUrlSubmit = useCallback(() => {
    if (validateUrl(url)) {
      addUrl(url);
      setUrl("");
      setShowUrlInput(false);
      setUrlError("");
    }
  }, [url, validateUrl, addUrl]);

  const handleUrlKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleUrlSubmit();
    } else if (e.key === 'Escape') {
      setShowUrlInput(false);
      setUrl("");
      setUrlError("");
    }
  }, [handleUrlSubmit]);

  useEffect(() => {
    if (showUrlInput && urlInputRef.current) {
      urlInputRef.current.focus();
    }
  }, [showUrlInput]);

  return (
    <div className="h-14 rounded-2xl glass-panel flex items-center justify-between px-4 z-20 mb-1 shrink-0">
      <div className="flex items-center gap-2">
        <Dropdown
          label="AI Model"
          icon={Command}
          value={currentModel || "Select Model"}
          activeId={currentModel}
          options={modelOptions.length > 0 ? modelOptions : [{ id: 'loading', name: 'Loading models...' }]}
          onSelect={(opt) => opt.id !== 'loading' && setCurrentModel(opt.id)}
          theme={theme}
          disabled={modelOptions.length === 0}
        />

        <div className="h-4 w-px bg-white/5 mx-1"></div>

        <Dropdown
          label="Context"
          icon={FolderOpen}
          value={activeProject ? activeProject.name : "General Chat"}
          activeId={activeProject?.id || 'none'}
          options={projectOptions}
          onSelect={(opt) =>
            setActiveProject(opt.id === 'none' ? null : projects.find(p => p.id === opt.id))
          }
          theme={theme}
        />

        {activeProject && (
          <div className="flex items-center gap-1 ml-2 animate-fade-in">
            <button
              onClick={addFiles}
              className={`glass-button text-[10px] font-medium text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-all ${theme.hoverBg}`}
              aria-label="Add files to project"
            >
              <Upload size={10} className="inline mr-1.5" /> Files
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className={`glass-button text-[10px] font-medium text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-all ${theme.hoverBg}`}
                aria-label="Add URL to project"
                aria-expanded={showUrlInput}
              >
                <Globe size={10} className="inline mr-1.5" /> Link
              </button>

              <AnimatePresence>
                {showUrlInput && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 mt-2 w-72 bg-[#0F0F0F] border border-white/10 rounded-xl p-3 shadow-2xl z-50 flex flex-col gap-2"
                  >
                    <input
                      ref={urlInputRef}
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setUrlError("");
                      }}
                      onKeyDown={handleUrlKeyDown}
                      placeholder="https://example.com"
                      className={`flex-1 bg-black/50 border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none transition-all ${
                        urlError ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-indigo-500'
                      }`}
                      type="url"
                      aria-label="Enter URL"
                    />
                    {urlError && (
                      <span className="text-[9px] text-red-400 px-1">{urlError}</span>
                    )}
                    <button
                      onClick={handleUrlSubmit}
                      disabled={!url.trim()}
                      className={`text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                        url.trim() ? `${theme.primaryBg} hover:opacity-90` : 'bg-gray-700 cursor-not-allowed opacity-50'
                      }`}
                      aria-label="Submit URL"
                    >
                      <Plus size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {settings.developerMode && (
          <div className="flex items-center gap-2 ml-2 animate-fade-in">
            {gitStatus && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                <GitBranch size={12} className="text-orange-400" />
                <span className="text-[10px] font-mono text-orange-100">{gitStatus.current}</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
              <Activity size={12} className={theme.accentText} />
              <span className={`text-[10px] font-mono ${theme.accentText} opacity-80`}>DEV</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center">
        {isOllamaRunning ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[9px] font-bold text-emerald-500 tracking-wider">ONLINE</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-500/5 border border-red-500/10">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-[9px] font-bold text-red-500 tracking-wider">OFFLINE</span>
          </div>
        )}
      </div>
    </div>
  );
};