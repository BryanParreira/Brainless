import React, { createContext, useContext, useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

const LuminaContext = createContext();

// Message reducer for better performance
const messagesReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return [...state, { role: 'user', content: action.payload }];
    case 'ADD_ASSISTANT_MESSAGE':
      return [...state, { role: 'assistant', content: '' }];
    case 'APPEND_TO_LAST':
      if (state.length === 0) return state;
      return [
        ...state.slice(0, -1),
        { ...state[state.length - 1], content: state[state.length - 1].content + action.payload }
      ];
    case 'SET_MESSAGES':
      return action.payload;
    case 'CLEAR_MESSAGES':
      return [];
    default:
      return state;
  }
};

export const LuminaProvider = ({ children }) => {
  // Settings State
  const [settings, setSettings] = useState({
    ollamaUrl: "http://127.0.0.1:11434",
    defaultModel: "",
    contextLength: 8192,
    temperature: 0.7,
    systemPrompt: "",
    developerMode: false,
    fontSize: 14,
    chatDensity: 'comfortable'
  });

  // Theme memoized based on developerMode
  const theme = useMemo(() => {
    const isDev = settings.developerMode;
    return {
      primary: isDev ? 'text-rose-500' : 'text-indigo-500',
      primaryBg: isDev ? 'bg-rose-600' : 'bg-indigo-600',
      primaryBorder: isDev ? 'border-rose-500/50' : 'border-indigo-500/50',
      glow: isDev ? 'shadow-rose-500/20' : 'shadow-indigo-500/20',
      accentText: isDev ? 'text-rose-400' : 'text-indigo-400',
      softBg: isDev ? 'bg-rose-500/10' : 'bg-indigo-500/10',
      hoverBg: isDev ? 'hover:bg-rose-500/20' : 'hover:bg-indigo-500/20',
      gradient: isDev ? 'from-rose-600 to-orange-600' : 'from-indigo-600 to-violet-600'
    };
  }, [settings.developerMode]);

  // Use reducer for messages
  const [messages, messagesDispatch] = useReducer(messagesReducer, []);

  // Other State
  const [isLoading, setIsLoading] = useState(false);
  const [isOllamaRunning, setIsOllamaRunning] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [currentView, setCurrentView] = useState('chat');
  const [gitStatus, setGitStatus] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  // Initialize app
  useEffect(() => {
    const init = async () => {
      try {
        if (!window.lumina) {
          setInitError('Preload bridge not available');
          setIsInitialized(true);
          return;
        }

        // Load settings first
        const savedSettings = await window.lumina.loadSettings();
        setSettings(prev => ({ ...prev, ...savedSettings }));

        // Check Ollama in parallel with other loads
        const [isRunning, models, sessionsList, projectsList] = await Promise.all([
          window.lumina.checkOllamaStatus(savedSettings.ollamaUrl),
          window.lumina.getModels(savedSettings.ollamaUrl).catch(() => []),
          window.lumina.getSessions().catch(() => []),
          window.lumina.getProjects().catch(() => [])
        ]);

        setIsOllamaRunning(isRunning);
        setAvailableModels(models);
        setSessions(sessionsList);
        setProjects(projectsList);

        // Load calendar safely
        try {
          if (window.lumina.loadCalendar) {
            const events = await window.lumina.loadCalendar();
            setCalendarEvents(events || []);
          }
        } catch (e) {
          console.warn('Calendar load failed:', e);
        }

        // Set default model
        if (models.length > 0) {
          const modelToUse = models.includes(savedSettings.defaultModel)
            ? savedSettings.defaultModel
            : models[0];
          setCurrentModel(modelToUse);
        }

        // Initialize new chat session
        messagesDispatch({ type: 'CLEAR_MESSAGES' });
        setSessionId(uuidv4());
        setCurrentView('chat');
        setIsLoading(false);
        setIsInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setInitError(error.message);
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  // Setup response listener
  useEffect(() => {
    if (!window.lumina || !isInitialized) return;

    const cleanup = window.lumina.onResponseChunk((chunk) => {
      if (chunk === '[DONE]') {
        setIsLoading(false);
        return;
      }
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: chunk });
    });

    return () => cleanup?.();
  }, [isInitialized]);

  // Auto-save session
  useEffect(() => {
    if (messages.length === 0 || !sessionId || isLoading || !isInitialized) return;

    // Debounce saves to avoid excessive writes
    const timer = setTimeout(async () => {
      try {
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = firstUserMsg
          ? firstUserMsg.content.slice(0, 50) + "..."
          : "New Chat";

        await window.lumina.saveSession({
          id: sessionId,
          title,
          messages,
          date: new Date().toISOString()
        });

        const updatedSessions = await window.lumina.getSessions();
        setSessions(updatedSessions);
      } catch (e) {
        console.error('Session save failed:', e);
      }
    }, 1000); // Wait 1 second before saving

    return () => clearTimeout(timer);
  }, [messages, sessionId, isLoading, isInitialized]);

  // Git refresh effect
  useEffect(() => {
    const refresh = async () => {
      if (settings.developerMode && activeProject) {
        try {
          const status = await window.lumina.getGitStatus(activeProject.id);
          setGitStatus(status);
        } catch (e) {
          console.warn('Git status failed:', e);
        }
      } else {
        setGitStatus(null);
      }
    };

    refresh();
  }, [activeProject, settings.developerMode]);

  // Graph refresh effect
  useEffect(() => {
    const refresh = async () => {
      if (activeProject) {
        try {
          const data = await window.lumina.generateGraph(activeProject.id);
          setGraphData(data || { nodes: [], links: [] });
        } catch (e) {
          console.warn('Graph generation failed:', e);
        }
      }
    };

    refresh();
  }, [activeProject]);

  // ===== CALLBACKS =====

  const refreshModels = useCallback(async () => {
    try {
      if (window.lumina) {
        const models = await window.lumina.getModels(settings.ollamaUrl);
        setAvailableModels(models);
        return models;
      }
    } catch (e) {
      console.error('Model refresh failed:', e);
    }
    return [];
  }, [settings.ollamaUrl]);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      const merged = { ...settings, ...newSettings };
      setSettings(merged);

      if (window.lumina) {
        await window.lumina.saveSettings(merged);

        // If URL changed, check status and refresh models
        if (newSettings.ollamaUrl && newSettings.ollamaUrl !== settings.ollamaUrl) {
          const isRunning = await window.lumina.checkOllamaStatus(merged.ollamaUrl);
          setIsOllamaRunning(isRunning);
          await refreshModels();
        }
      }
    } catch (e) {
      console.error('Settings update failed:', e);
    }
  }, [settings, refreshModels]);

  const openGlobalSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeGlobalSettings = useCallback(() => setIsSettingsOpen(false), []);

  const factoryReset = useCallback(async () => {
    try {
      if (window.lumina) {
        await window.lumina.resetSystem();
      }
      setSessions([]);
      setProjects([]);
      messagesDispatch({ type: 'CLEAR_MESSAGES' });
      setActiveProject(null);
      setCalendarEvents([]);
      setSettings({
        ollamaUrl: "http://127.0.0.1:11434",
        defaultModel: "",
        contextLength: 8192,
        temperature: 0.7,
        systemPrompt: "",
        developerMode: false,
        fontSize: 14,
        chatDensity: 'comfortable'
      });
      await startNewChat();
    } catch (e) {
      console.error('Factory reset failed:', e);
    }
  }, []);

  const createProject = useCallback(async (name) => {
    try {
      if (window.lumina) {
        const newProj = await window.lumina.createProject({
          id: uuidv4(),
          name
        });
        setProjects(prev => [...prev, newProj]);
        setActiveProject(newProj);
      }
    } catch (e) {
      console.error('Project creation failed:', e);
    }
  }, []);

  const updateProjectSettings = useCallback(async (systemPrompt) => {
    if (!activeProject) return;
    try {
      const updatedProj = await window.lumina.updateProjectSettings(activeProject.id, systemPrompt);
      if (updatedProj) {
        setActiveProject(updatedProj);
        setProjects(prev =>
          prev.map(p => p.id === activeProject.id ? updatedProj : p)
        );
      }
    } catch (e) {
      console.error('Project settings update failed:', e);
    }
  }, [activeProject]);

  const updateProjectFiles = useCallback((newFiles) => {
    if (!activeProject) return;
    setActiveProject(prev => ({ ...prev, files: newFiles }));
    setProjects(prev =>
      prev.map(p => p.id === activeProject.id ? { ...p, files: newFiles } : p)
    );
  }, [activeProject]);

  const addFiles = useCallback(async () => {
    if (!activeProject) return;
    try {
      const newFiles = await window.lumina.addFilesToProject(activeProject.id);
      if (newFiles) updateProjectFiles(newFiles);
    } catch (e) {
      console.error('Add files failed:', e);
    }
  }, [activeProject, updateProjectFiles]);

  const addFolder = useCallback(async () => {
    if (!activeProject) return;
    try {
      const newFiles = await window.lumina.addFolderToProject(activeProject.id);
      if (newFiles) updateProjectFiles(newFiles);
    } catch (e) {
      console.error('Add folder failed:', e);
    }
  }, [activeProject, updateProjectFiles]);

  const addUrl = useCallback(async (url) => {
    if (!activeProject) return;
    try {
      const newFiles = await window.lumina.addUrlToProject(activeProject.id, url);
      if (newFiles) updateProjectFiles(newFiles);
    } catch (e) {
      console.error('Add URL failed:', e);
    }
  }, [activeProject, updateProjectFiles]);

  const deleteProject = useCallback(async (e, id) => {
    e.stopPropagation();
    try {
      if (window.lumina) {
        await window.lumina.deleteProject(id);
      }
      setProjects(prev => prev.filter(p => p.id !== id));
      if (activeProject?.id === id) {
        setActiveProject(null);
        setCurrentView('chat');
      }
    } catch (e) {
      console.error('Project deletion failed:', e);
    }
  }, [activeProject]);

  const runDeepResearch = useCallback(async (url) => {
    if (!activeProject) return;
    setIsLoading(true);
    try {
      messagesDispatch({ type: 'ADD_USER_MESSAGE', payload: `Deep Research: ${url}` });
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });

      const rawContent = await window.lumina.runDeepResearch(activeProject.id, url);

      // Refresh project files
      const updatedProjects = await window.lumina.getProjects();
      const updatedProject = updatedProjects.find(p => p.id === activeProject.id);
      if (updatedProject) {
        updateProjectFiles(updatedProject.files);
      }

      const prompt = `Analyze this scraped content and generate a structured Research Report using Markdown.\n\nCONTENT:\n${rawContent}`;
      window.lumina.sendPrompt(prompt, currentModel, [], activeProject.systemPrompt, settings);
    } catch (e) {
      messagesDispatch({
        type: 'APPEND_TO_LAST',
        payload: `\n\n**Error:** ${e.message}`
      });
      setIsLoading(false);
      console.error('Deep research failed:', e);
    }
  }, [activeProject, currentModel, settings, updateProjectFiles]);

  const sendMessage = useCallback((text) => {
    if (!text.trim() || isLoading || !currentModel) return;

    messagesDispatch({ type: 'ADD_USER_MESSAGE', payload: text });
    messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
    setIsLoading(true);

    try {
      const contextFiles = activeProject?.files || [];
      const systemPrompt = activeProject?.systemPrompt || settings.systemPrompt;

      window.lumina.sendPrompt(
        text,
        currentModel,
        contextFiles,
        systemPrompt,
        settings,
        activeProject?.id
      );
    } catch (e) {
      console.error('Send message failed:', e);
      setIsLoading(false);
    }
  }, [isLoading, currentModel, activeProject, settings]);

  const renameChat = useCallback(async (id, newTitle) => {
    try {
      if (window.lumina) {
        await window.lumina.renameSession(id, newTitle);
        const updatedSessions = await window.lumina.getSessions();
        setSessions(updatedSessions);
      }
    } catch (e) {
      console.error('Rename chat failed:', e);
    }
  }, []);

  const startNewChat = useCallback(async () => {
    try {
      if (messages.length > 0) {
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = firstUserMsg?.content.slice(0, 50) || "New Chat";

        if (window.lumina) {
          await window.lumina.saveSession({
            id: sessionId,
            title,
            messages,
            date: new Date().toISOString()
          });
          const updatedSessions = await window.lumina.getSessions();
          setSessions(updatedSessions);
        }
      }

      messagesDispatch({ type: 'CLEAR_MESSAGES' });
      setSessionId(uuidv4());
      setIsLoading(false);
      setCurrentView('chat');
    } catch (e) {
      console.error('Start new chat failed:', e);
    }
  }, [messages, sessionId]);

  const loadSession = useCallback(async (id) => {
    try {
      if (window.lumina) {
        const data = await window.lumina.loadSession(id);
        messagesDispatch({ type: 'SET_MESSAGES', payload: data.messages || [] });
        setSessionId(data.id);
        setCurrentView('chat');
      }
    } catch (e) {
      console.error('Load session failed:', e);
    }
  }, []);

  const deleteSession = useCallback(async (e, id) => {
    e.stopPropagation();
    try {
      if (window.lumina) {
        await window.lumina.deleteSession(id);
      }
      if (id === sessionId) {
        await startNewChat();
      }
      const updatedSessions = await window.lumina.getSessions();
      setSessions(updatedSessions);
    } catch (e) {
      console.error('Delete session failed:', e);
    }
  }, [sessionId, startNewChat]);

  const addEvent = useCallback(async (title, date, type) => {
    try {
      const newEvent = { id: uuidv4(), title, date, type };
      const updated = [...calendarEvents, newEvent];
      setCalendarEvents(updated);

      if (window.lumina) {
        await window.lumina.saveCalendar(updated);
      }
    } catch (e) {
      console.error('Add event failed:', e);
    }
  }, [calendarEvents]);

  const generateSchedule = useCallback(async (topic, targetDate) => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const mode = settings.developerMode ? 'Developer Sprint' : 'Student Study Plan';
      const prompt = `You are an AI Scheduler. Today is ${today}. Target: ${targetDate}. Topic: "${topic}". Goal: Create a ${mode} schedule. Output: STRICT JSON ARRAY only. Example: [{"title": "Topic Intro", "date": "2024-01-01", "type": "study"}]`;

      if (window.lumina) {
        const events = await window.lumina.generateJson(prompt, currentModel, settings);
        if (Array.isArray(events)) {
          const newEvents = events.map(e => ({
            ...e,
            id: uuidv4(),
            type: settings.developerMode ? 'task' : 'study'
          }));
          const updated = [...calendarEvents, ...newEvents];
          setCalendarEvents(updated);
          await window.lumina.saveCalendar(updated);
          setCurrentView('chronos');
        }
      }
    } catch (e) {
      console.error('Generate schedule failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, [calendarEvents, currentModel, settings]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    messages,
    sendMessage,
    isLoading,
    isOllamaRunning,
    currentModel,
    setCurrentModel,
    availableModels,
    refreshModels,
    settings,
    updateSettings,
    sessions,
    sessionId,
    startNewChat,
    loadSession,
    deleteSession,
    renameChat,
    factoryReset,
    projects,
    activeProject,
    setActiveProject,
    createProject,
    updateProjectSettings,
    addFiles,
    addFolder,
    addUrl,
    deleteProject,
    graphData,
    runDeepResearch,
    gitStatus,
    isSettingsOpen,
    openGlobalSettings,
    closeGlobalSettings,
    theme,
    currentView,
    setCurrentView,
    calendarEvents,
    addEvent,
    generateSchedule,
    isInitialized,
    initError
  }), [
    messages,
    sendMessage,
    isLoading,
    isOllamaRunning,
    currentModel,
    availableModels,
    refreshModels,
    settings,
    updateSettings,
    sessions,
    sessionId,
    startNewChat,
    loadSession,
    deleteSession,
    renameChat,
    factoryReset,
    projects,
    activeProject,
    createProject,
    updateProjectSettings,
    addFiles,
    addFolder,
    addUrl,
    deleteProject,
    graphData,
    runDeepResearch,
    gitStatus,
    isSettingsOpen,
    openGlobalSettings,
    closeGlobalSettings,
    theme,
    currentView,
    calendarEvents,
    addEvent,
    generateSchedule,
    isInitialized,
    initError
  ]);

  return (
    <LuminaContext.Provider value={contextValue}>
      {children}
    </LuminaContext.Provider>
  );
};

export const useLumina = () => {
  const context = useContext(LuminaContext);
  if (!context) {
    throw new Error('useLumina must be used within LuminaProvider');
  }
  return context;
};