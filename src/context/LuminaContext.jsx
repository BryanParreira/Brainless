import React, { createContext, useContext, useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

const LuminaContext = createContext();

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
  const [settings, setSettings] = useState({
    ollamaUrl: "http://127.0.0.1:11434",
    defaultModel: "",
    contextLength: 8192,
    temperature: 0.3,
    systemPrompt: "",
    developerMode: false,
    fontSize: 14,
    chatDensity: 'comfortable'
  });

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

  const [messages, messagesDispatch] = useReducer(messagesReducer, []);
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
  const [activeArtifact, setActiveArtifact] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // --- CANVAS STATE (Optimized) ---
  const [canvasNodes, setCanvasNodes] = useState([]);
  const [canvasConnections, setCanvasConnections] = useState([]);
  
  const addCanvasNode = useCallback((type, x, y, data = {}) => {
    const newNode = {
      id: uuidv4(),
      type,
      x,
      y,
      data: { title: 'New Item', content: '', ...data }
    };
    setCanvasNodes(prev => [...prev, newNode]);
  }, []);

  const updateCanvasNode = useCallback((id, updates) => {
    setCanvasNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

  const deleteCanvasNode = useCallback((id) => {
    setCanvasNodes(prev => prev.filter(n => n.id !== id));
    setCanvasConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
  }, []);

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      try {
        if (!window.lumina) {
          setInitError('Preload bridge not available');
          setIsInitialized(true);
          return;
        }
        const savedSettings = await window.lumina.loadSettings();
        setSettings(prev => ({ ...prev, ...savedSettings }));

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

        try {
          if (window.lumina.loadCalendar) {
            const events = await window.lumina.loadCalendar();
            setCalendarEvents(events || []);
          }
        } catch (e) { console.warn('Calendar load failed:', e); }

        if (models.length > 0) {
          const modelToUse = models.includes(savedSettings.defaultModel) ? savedSettings.defaultModel : models[0];
          setCurrentModel(modelToUse);
        }

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

  useEffect(() => {
    if (!window.lumina || !isInitialized) return;
    const cleanup = window.lumina.onResponseChunk((chunk) => {
      if (chunk === '[DONE]') { setIsLoading(false); return; }
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: chunk });
    });
    return () => cleanup?.();
  }, [isInitialized]);

  useEffect(() => {
    if (messages.length === 0 || !sessionId || isLoading || !isInitialized) return;
    const timer = setTimeout(async () => {
      try {
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = firstUserMsg ? firstUserMsg.content.slice(0, 50) + "..." : "New Chat";
        await window.lumina.saveSession({ id: sessionId, title, messages, date: new Date().toISOString() });
        const updatedSessions = await window.lumina.getSessions();
        setSessions(updatedSessions);
      } catch (e) { console.error('Session save failed:', e); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [messages, sessionId, isLoading, isInitialized]);

  useEffect(() => {
    const refresh = async () => {
      if (activeProject) {
        try {
          const data = await window.lumina.generateGraph(activeProject.id);
          setGraphData(data || { nodes: [], links: [] });
          
          if (settings.developerMode) {
            const status = await window.lumina.getGitStatus(activeProject.id);
            setGitStatus(status);
          }
        } catch (e) { console.warn('Project data refresh failed:', e); }
      } else {
        setGitStatus(null);
        setGraphData({ nodes: [], links: [] });
      }
    };
    refresh();
  }, [activeProject, settings.developerMode]);

  const refreshModels = useCallback(async () => {
    try {
      if (window.lumina) {
        const models = await window.lumina.getModels(settings.ollamaUrl);
        setAvailableModels(models);
        return models;
      }
    } catch (e) { console.error('Model refresh failed:', e); }
    return [];
  }, [settings.ollamaUrl]);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      const merged = { ...settings, ...newSettings };
      setSettings(merged);
      if (window.lumina) {
        await window.lumina.saveSettings(merged);
        if (newSettings.ollamaUrl && newSettings.ollamaUrl !== settings.ollamaUrl) {
          const isRunning = await window.lumina.checkOllamaStatus(merged.ollamaUrl);
          setIsOllamaRunning(isRunning);
          await refreshModels();
        }
      }
    } catch (e) { console.error('Settings update failed:', e); }
  }, [settings, refreshModels]);

  const openGlobalSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeGlobalSettings = useCallback(() => setIsSettingsOpen(false), []);

  const factoryReset = useCallback(async () => {
    try {
      if (window.lumina) await window.lumina.resetSystem();
      setSessions([]); setProjects([]); messagesDispatch({ type: 'CLEAR_MESSAGES' });
      setActiveProject(null); setCalendarEvents([]); 
      setCanvasNodes([]); setCanvasConnections([]);
      setSettings({ ollamaUrl: "http://127.0.0.1:11434", defaultModel: "", contextLength: 8192, temperature: 0.3, systemPrompt: "", developerMode: false, fontSize: 14, chatDensity: 'comfortable' });
      await startNewChat();
    } catch (e) { console.error('Factory reset failed:', e); }
  }, []);

  const createProject = useCallback(async (name) => {
    try {
      if (window.lumina) {
        const newProj = await window.lumina.createProject({ id: uuidv4(), name });
        setProjects(prev => [...prev, newProj]);
        setActiveProject(newProj);
      }
    } catch (e) { console.error('Project creation failed:', e); }
  }, []);

  const updateProjectSettings = useCallback(async (systemPrompt) => {
    if (!activeProject) return;
    try {
      const updatedProj = await window.lumina.updateProjectSettings(activeProject.id, systemPrompt);
      if (updatedProj) {
        setActiveProject(updatedProj);
        setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProj : p));
      }
    } catch (e) { console.error('Project settings update failed:', e); }
  }, [activeProject]);

  const updateProjectFiles = useCallback((newFiles) => {
    if (!activeProject) return;
    const updatedProject = { ...activeProject, files: newFiles };
    setActiveProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === activeProject.id ? updatedProject : p));
  }, [activeProject]);

  const addFiles = useCallback(async () => { 
    if (!activeProject) return; 
    try { 
      const newFiles = await window.lumina.addFilesToProject(activeProject.id); 
      if (newFiles) updateProjectFiles(newFiles); 
    } catch (e) { console.error('Add files failed:', e); } 
  }, [activeProject, updateProjectFiles]);

  const addFolder = useCallback(async () => { 
    if (!activeProject) return; 
    try { 
      const newFiles = await window.lumina.addFolderToProject(activeProject.id); 
      if (newFiles) updateProjectFiles(newFiles); 
    } catch (e) { console.error('Add folder failed:', e); } 
  }, [activeProject, updateProjectFiles]);

  const addUrl = useCallback(async (url) => { 
    if (!activeProject) return; 
    try { 
      const newFiles = await window.lumina.addUrlToProject(activeProject.id, url); 
      if (newFiles) updateProjectFiles(newFiles); 
    } catch (e) { console.error('Add URL failed:', e); } 
  }, [activeProject, updateProjectFiles]);

  const deleteProject = useCallback(async (e, id) => { 
    e.stopPropagation(); 
    try { 
      if (window.lumina) await window.lumina.deleteProject(id); 
      setProjects(prev => prev.filter(p => p.id !== id)); 
      if (activeProject?.id === id) { 
        setActiveProject(null); 
        setCurrentView('chat'); 
      } 
    } catch (e) { console.error('Project deletion failed:', e); } 
  }, [activeProject]);

  const runDeepResearch = useCallback(async (url) => {
    if (!activeProject) return;
    setIsLoading(true);
    try {
      messagesDispatch({ type: 'ADD_USER_MESSAGE', payload: `Deep Research: ${url}` });
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
      const rawContent = await window.lumina.runDeepResearch(activeProject.id, url);
      const updatedProjects = await window.lumina.getProjects();
      const updatedProject = updatedProjects.find(p => p.id === activeProject.id);
      if (updatedProject) updateProjectFiles(updatedProject.files);
      const prompt = `Analyze this scraped content and generate a structured Research Report using Markdown.\n\nCONTENT:\n${rawContent}`;
      window.lumina.sendPrompt(prompt, currentModel, [], activeProject.systemPrompt, settings);
    } catch (e) {
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: `\n\n**Error:** ${e.message}` });
      setIsLoading(false);
    }
  }, [activeProject, currentModel, settings, updateProjectFiles]);

  const sendMessage = useCallback((text) => {
    if (!text.trim() || isLoading || !currentModel) return;
    messagesDispatch({ type: 'ADD_USER_MESSAGE', payload: text });
    messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
    setIsLoading(true);
    try {
      let contextFiles = [];
      let systemPrompt = settings.systemPrompt;
      let pid = null;
      if (activeProject) {
        pid = activeProject.id;
        const liveProject = projects.find(p => p.id === activeProject.id);
        if (liveProject) {
           contextFiles = liveProject.files || [];
           systemPrompt = liveProject.systemPrompt || settings.systemPrompt;
        } else {
           contextFiles = activeProject.files || [];
        }
      }
      window.lumina.sendPrompt(text, currentModel, contextFiles, systemPrompt, settings, pid);
    } catch (e) {
      console.error('Send message failed:', e);
      setIsLoading(false);
    }
  }, [isLoading, currentModel, activeProject, projects, settings]);

  const renameChat = useCallback(async (id, newTitle) => { try { if (window.lumina) { await window.lumina.renameSession(id, newTitle); const updatedSessions = await window.lumina.getSessions(); setSessions(updatedSessions); } } catch (e) { console.error('Rename chat failed:', e); } }, []);
  const startNewChat = useCallback(async () => { try { if (messages.length > 0) { const firstUserMsg = messages.find(m => m.role === 'user'); const title = firstUserMsg?.content.slice(0, 50) || "New Chat"; if (window.lumina) { await window.lumina.saveSession({ id: sessionId, title, messages, date: new Date().toISOString() }); const updatedSessions = await window.lumina.getSessions(); setSessions(updatedSessions); } } messagesDispatch({ type: 'CLEAR_MESSAGES' }); setSessionId(uuidv4()); setIsLoading(false); setCurrentView('chat'); } catch (e) { console.error('Start new chat failed:', e); } }, [messages, sessionId]);
  const loadSession = useCallback(async (id) => { try { if (window.lumina) { const data = await window.lumina.loadSession(id); messagesDispatch({ type: 'SET_MESSAGES', payload: data.messages || [] }); setSessionId(data.id); setCurrentView('chat'); } } catch (e) { console.error('Load session failed:', e); } }, []);
  const deleteSession = useCallback(async (e, id) => { e.stopPropagation(); try { if (window.lumina) await window.lumina.deleteSession(id); if (id === sessionId) await startNewChat(); const updatedSessions = await window.lumina.getSessions(); setSessions(updatedSessions); } catch (e) { console.error('Delete session failed:', e); } }, [sessionId, startNewChat]);

  // --- CALENDAR ACTIONS ---
  const addEvent = useCallback(async (title, date, type, priority = 'medium', notes = '', time = '') => {
    try {
      const newEvent = { id: uuidv4(), title, date, type, priority, notes, time, createdAt: new Date().toISOString() };
      const updated = [...calendarEvents, newEvent];
      setCalendarEvents(updated);
      if (window.lumina) await window.lumina.saveCalendar(updated);
    } catch (e) { console.error('Add event failed:', e); }
  }, [calendarEvents]);

  const updateEvent = useCallback(async (id, updatedFields) => {
    try {
      const updated = calendarEvents.map(ev => 
        ev.id === id ? { ...ev, ...updatedFields } : ev
      );
      setCalendarEvents(updated);
      if (window.lumina) await window.lumina.saveCalendar(updated);
    } catch (e) { console.error('Update event failed:', e); }
  }, [calendarEvents]);

  const deleteEvent = useCallback(async (id) => {
    try {
      const updated = calendarEvents.filter(ev => ev.id !== id);
      setCalendarEvents(updated);
      if (window.lumina) await window.lumina.saveCalendar(updated);
    } catch (e) { console.error('Delete event failed:', e); }
  }, [calendarEvents]);

  const generateSchedule = useCallback(async (topic, targetDate, duration, goals) => {
    if (!topic || !targetDate) { alert('Please provide a topic and target date'); return; }
    
    const start = new Date();
    const end = new Date(targetDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    const steps = [
      { t: "Research & Outline", p: "medium" },
      { t: "Core Work / Study", p: "high" },
      { t: "Deep Dive / Draft", p: "high" },
      { t: "Review & Refine", p: "medium" },
      { t: "Final Polish", p: "low" }
    ];

    const newEvents = [];
    const stepCount = Math.min(diffDays, steps.length);
    const interval = Math.max(1, Math.floor(diffDays / stepCount));

    for (let i = 0; i < stepCount; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + 1 + (i * interval));
        const dateStr = d.toISOString().split('T')[0];
        
        if (d > end) break;

        newEvents.push({
            id: uuidv4(),
            title: `${steps[i].t}: ${topic}`,
            date: dateStr,
            type: settings.developerMode ? 'task' : 'study',
            priority: steps[i].p,
            notes: `Goals: ${goals || 'Complete section'}`,
            time: '10:00',
            generatedByAI: false, 
            createdAt: new Date().toISOString()
        });
    }
    
    newEvents.push({
        id: uuidv4(),
        title: `DEADLINE: ${topic}`,
        date: targetDate,
        type: 'deadline',
        priority: 'high',
        notes: 'Final Submission / Test',
        time: '23:59',
        createdAt: new Date().toISOString()
    });

    const updated = [...calendarEvents, ...newEvents];
    setCalendarEvents(updated);
    if(window.lumina) await window.lumina.saveCalendar(updated);
    setCurrentView('chronos');

  }, [calendarEvents, settings]);

  const runFlashpoint = useCallback(async () => {
    if (!activeProject || !currentModel) return;
    setIsLoading(true);
    messagesDispatch({ type: 'ADD_USER_MESSAGE', payload: '/flashpoint (Generating Flashcards...)' });
    try {
      const prompt = `Generate 10 flashcards for study. Return JSON: { "cards": [{ "front": "Q", "back": "A" }] }`;
      const response = await window.lumina.generateJson(prompt, currentModel, settings);
      let deck = [];
      if (Array.isArray(response)) deck = response;
      else if (response && Array.isArray(response.cards)) deck = response.cards;
      if (deck.length > 0) {
        setActiveArtifact({ type: 'flashcards', language: 'json', content: deck });
        messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
        messagesDispatch({ type: 'APPEND_TO_LAST', payload: 'Flashcards generated successfully.' });
      } else throw new Error('Invalid JSON');
    } catch (e) {
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: 'Error: ' + e.message });
    } finally { setIsLoading(false); }
  }, [activeProject, currentModel, settings]);

  const runBlueprint = useCallback(async (description) => {
    if (!activeProject || !currentModel) return;
    setIsLoading(true);
    messagesDispatch({ type: 'ADD_USER_MESSAGE', payload: `Blueprint: ${description}` });
    try {
      const prompt = `Output JSON with "files" key for: ${description}.`;
      const response = await window.lumina.generateJson(prompt, currentModel, settings);
      let structure = [];
      if (Array.isArray(response)) structure = response;
      else if (response && Array.isArray(response.files)) structure = response.files;
      if (structure.length > 0) {
        messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
        messagesDispatch({ type: 'APPEND_TO_LAST', payload: `Building ${structure.length} files...` });
        await window.lumina.scaffoldProject(activeProject.id, structure);
        messagesDispatch({ type: 'APPEND_TO_LAST', payload: `\n\n✅ Done.` });
        const updatedProjects = await window.lumina.getProjects();
        const updated = updatedProjects.find(p => p.id === activeProject.id);
        if (updated) setActiveProject(prev => ({ ...prev, files: updated.files }));
      } else throw new Error('Invalid structure');
    } catch (e) {
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: 'Error: ' + e.message });
    } finally { setIsLoading(false); }
  }, [activeProject, currentModel, settings]);

  const runDiffDoctor = useCallback(async () => {
    if (!activeProject || !gitStatus || gitStatus.clean) return;
    setIsLoading(true);
    messagesDispatch({ type: 'ADD_USER_MESSAGE', payload: 'Run Diff Doctor.' });
    try {
      const diff = await window.lumina.getGitDiff(activeProject.id);
      if (!diff) throw new Error("No diff");
      const prompt = `Analyze git diff. Write commit message and check bugs.\n\n${diff.slice(0, 5000)}`;
      window.lumina.sendPrompt(prompt, currentModel, [], activeProject.systemPrompt, settings);
    } catch (e) { setIsLoading(false); }
  }, [activeProject, gitStatus, currentModel, settings]);

  const togglePodcast = useCallback(() => {
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
    else {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        const utterance = new SpeechSynthesisUtterance(lastMsg.content.replace(/[*#`]/g, ''));
        utterance.rate = 1.1; utterance.pitch = 1.0; utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance); setIsSpeaking(true);
      }
    }
  }, [isSpeaking, messages]);

  const openLabBench = useCallback((content, language) => { setActiveArtifact({ content, language }); }, []);
  const closeLabBench = useCallback(() => { setActiveArtifact(null); }, []);

  const contextValue = useMemo(() => ({
    messages, sendMessage, isLoading, isOllamaRunning, currentModel, setCurrentModel, availableModels, refreshModels, settings, updateSettings, sessions, sessionId, startNewChat, loadSession, deleteSession, renameChat, factoryReset, projects, activeProject, setActiveProject, createProject, updateProjectSettings, addFiles, addFolder, addUrl, deleteProject, graphData, runDeepResearch, gitStatus, isSettingsOpen, openGlobalSettings, closeGlobalSettings, theme, currentView, setCurrentView, calendarEvents, addEvent, updateEvent, deleteEvent, generateSchedule, isInitialized, initError, activeArtifact, openLabBench, closeLabBench, runFlashpoint, runBlueprint, runDiffDoctor, togglePodcast, isSpeaking, 
    // CANVAS EXPORTS
    canvasNodes, addCanvasNode, updateCanvasNode, deleteCanvasNode, canvasConnections, setCanvasConnections
  }), [messages, sendMessage, isLoading, isOllamaRunning, currentModel, availableModels, refreshModels, settings, updateSettings, sessions, sessionId, startNewChat, loadSession, deleteSession, renameChat, factoryReset, projects, activeProject, createProject, updateProjectSettings, addFiles, addFolder, addUrl, deleteProject, graphData, runDeepResearch, gitStatus, isSettingsOpen, openGlobalSettings, closeGlobalSettings, theme, currentView, calendarEvents, addEvent, updateEvent, deleteEvent, generateSchedule, isInitialized, initError, activeArtifact, openLabBench, closeLabBench, runFlashpoint, runBlueprint, runDiffDoctor, togglePodcast, isSpeaking, canvasNodes, canvasConnections]);

  return <LuminaContext.Provider value={contextValue}>{children}</LuminaContext.Provider>;
};

export const useLumina = () => { const context = useContext(LuminaContext); if (!context) throw new Error('useLumina must be used within LuminaProvider'); return context; };