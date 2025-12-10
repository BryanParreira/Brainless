import React, { createContext, useContext, useState, useEffect, useCallback, useReducer, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

const LuminaContext = createContext();

const messagesReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_USER_MESSAGE':
      return [...state, { 
        role: 'user', 
        content: action.payload.text,
        // CRITICAL: Store attachments for DISPLAY only, not for sending to AI
        attachments: action.payload.attachments || [],
        // Flag to indicate attachments were already processed
        attachmentsProcessed: true
      }];
    case 'ADD_ASSISTANT_MESSAGE':
      return [...state, { role: 'assistant', content: '' }];
    case 'APPEND_TO_LAST':
      if (state.length === 0) return state;
      return [
        ...state.slice(0, -1),
        { ...state[state.length - 1], content: state[state.length - 1].content + action.payload }
      ];
    case 'SET_MESSAGES':
      // When loading old sessions, mark all messages as processed
      return action.payload.map(msg => ({
        ...msg,
        attachmentsProcessed: true
      }));
    case 'CLEAR_MESSAGES':
      return [];
    default:
      return state;
  }
};

export const LuminaProvider = ({ children }) => {
  // --- CORE STATE ---
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
  const [currentView, setCurrentView] = useState('home');
  const [gitStatus, setGitStatus] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // --- ARTIFACTS / LAB BENCH STATE (UPDATED FOR TABS) ---
  const [artifacts, setArtifacts] = useState([]); // Array of open tabs
  const [activeArtifactId, setActiveArtifactId] = useState(null); // ID of currently visible tab

  // Computed property for the currently active object
  const activeArtifact = useMemo(() => 
    artifacts.find(a => a.id === activeArtifactId) || null
  , [artifacts, activeArtifactId]);

  // --- PHASE 1: NEW STATE ---
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [undoHistory, setUndoHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);

  // --- CANVAS STATE ---
  const [canvasNodes, setCanvasNodes] = useState([]);
  const [canvasConnections, setCanvasConnections] = useState([]);

  // --- PHASE 1: UNDO/REDO SYSTEM ---
  const addToUndoHistory = useCallback((action) => {
    setUndoHistory(prev => [...prev.slice(-19), { ...action, timestamp: Date.now() }]);
    setRedoHistory([]);
  }, []);

  const performUndo = useCallback(() => {
    if (undoHistory.length === 0) return;
    const lastAction = undoHistory[undoHistory.length - 1];
    if (lastAction.undo) lastAction.undo();
    setUndoHistory(prev => prev.slice(0, -1));
    setRedoHistory(prev => [...prev, lastAction]);
  }, [undoHistory]);

  const performRedo = useCallback(() => {
    if (redoHistory.length === 0) return;
    const lastRedo = redoHistory[redoHistory.length - 1];
    
    if (lastRedo.type === 'add-canvas-node') {
      setCanvasNodes(prev => [...prev, lastRedo.data.node]);
    } else if (lastRedo.type === 'update-canvas-node') {
      setCanvasNodes(prev => prev.map(n => 
        n.id === lastRedo.data.id ? { ...n, ...lastRedo.data.updates } : n
      ));
    } else if (lastRedo.type === 'delete-canvas-node') {
      setCanvasNodes(prev => prev.filter(n => n.id !== lastRedo.data.node.id));
      setCanvasConnections(prev => prev.filter(c => 
        c.from !== lastRedo.data.node.id && c.to !== lastRedo.data.node.id
      ));
    } else if (lastRedo.type === 'add-event') {
      setCalendarEvents(prev => [...prev, lastRedo.data.event]);
    } else if (lastRedo.type === 'delete-event') {
      setCalendarEvents(prev => prev.filter(e => e.id !== lastRedo.data.event.id));
    }
    
    setRedoHistory(prev => prev.slice(0, -1));
    setUndoHistory(prev => [...prev, lastRedo]);
  }, [redoHistory]);

  // --- PHASE 1: KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        performUndo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        performRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, performRedo]);
  
  // --- CANVAS ACTIONS ---
  const addCanvasNode = useCallback((type, x, y, data = {}) => {
    const newNode = { id: uuidv4(), type, x, y, data: { title: 'New Item', content: '', ...data } };
    setCanvasNodes(prev => [...prev, newNode]);
    addToUndoHistory({
      type: 'add-canvas-node',
      data: { node: newNode },
      undo: () => setCanvasNodes(prev => prev.filter(n => n.id !== newNode.id))
    });
  }, [addToUndoHistory]);

  const updateCanvasNode = useCallback((id, updates) => {
    const oldNode = canvasNodes.find(n => n.id === id);
    if (!oldNode) return;
    setCanvasNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    addToUndoHistory({
      type: 'update-canvas-node',
      data: { id, oldNode, updates },
      undo: () => setCanvasNodes(prev => prev.map(n => n.id === id ? oldNode : n))
    });
  }, [canvasNodes, addToUndoHistory]);

  const deleteCanvasNode = useCallback((id) => {
    const deletedNode = canvasNodes.find(n => n.id === id);
    const deletedConnections = canvasConnections.filter(c => c.from === id || c.to === id);
    setCanvasNodes(prev => prev.filter(n => n.id !== id));
    setCanvasConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    addToUndoHistory({
      type: 'delete-canvas-node',
      data: { node: deletedNode, connections: deletedConnections },
      undo: () => {
        setCanvasNodes(prev => [...prev, deletedNode]);
        setCanvasConnections(prev => [...prev, ...deletedConnections]);
      }
    });
  }, [canvasNodes, canvasConnections, addToUndoHistory]);

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      try {
        if (!window.lumina) { setIsInitialized(true); return; }
        const s = await window.lumina.loadSettings();
        setSettings(prev => ({ ...prev, ...s }));
        const [r, m, se, p] = await Promise.all([
          window.lumina.checkOllamaStatus(s.ollamaUrl),
          window.lumina.getModels(s.ollamaUrl).catch(() => []),
          window.lumina.getSessions().catch(() => []),
          window.lumina.getProjects().catch(() => [])
        ]);
        setIsOllamaRunning(r);
        setAvailableModels(m);
        setSessions(se);
        setProjects(p);
        try {
          const events = await window.lumina.loadCalendar();
          setCalendarEvents(events || []);
        } catch (e) {}
        if (m.length > 0) setCurrentModel(m.includes(s.defaultModel) ? s.defaultModel : m[0]);
        setSessionId(uuidv4());
        setIsInitialized(true);
      } catch (error) {
        setIsInitialized(true);
      }
    };
    init();
  }, []);

  // --- LISTENERS ---
  useEffect(() => {
    if (!window.lumina || !isInitialized) return;
    const cleanupChunk = window.lumina.onResponseChunk((chunk) => {
      if (chunk === '[DONE]') {
        setIsLoading(false);
        return;
      }
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: chunk });
    });
    const cleanupError = window.lumina.onAIError && window.lumina.onAIError((msg) => {
      setIsLoading(false);
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: `\n\n**Error:** ${msg}` });
    });
    return () => {
      cleanupChunk?.();
      cleanupError?.();
    };
  }, [isInitialized]);

  // --- SETTINGS ---
  const updateSettings = useCallback(async (newSettings) => {
    try {
      const merged = { ...settings, ...newSettings };
      setSettings(merged);
      if (window.lumina) await window.lumina.saveSettings(merged);
    } catch (e) {
      console.error('Settings update failed:', e);
    }
  }, [settings]);

  const refreshModels = useCallback(async () => {
    try {
      const models = await window.lumina.getModels(settings.ollamaUrl);
      setAvailableModels(models);
      return models;
    } catch (e) {
      console.error('Refresh models failed:', e);
      return [];
    }
  }, [settings.ollamaUrl]);

  const factoryReset = useCallback(async () => {
    try {
      await window.lumina.resetSystem();
      messagesDispatch({ type: 'CLEAR_MESSAGES' });
      setSessions([]);
      setProjects([]);
      setActiveProject(null);
      setCalendarEvents([]);
      setCanvasNodes([]);
      setCanvasConnections([]);
      setUndoHistory([]);
      setRedoHistory([]);
      setSessionId(uuidv4());
    } catch (e) {
      console.error('Factory reset failed:', e);
    }
  }, []);

  // ====================================================================
  // CRITICAL FIX: sendMessage - Prevent Image Hallucination
  // ====================================================================
  const sendMessage = useCallback(async (text, attachments) => {
    // Normalize attachments to always be an array
    const normalizedAttachments = Array.isArray(attachments) ? attachments : [];
    
    console.log('📨 sendMessage called with:', { 
      text: text?.slice(0, 50), 
      attachmentCount: normalizedAttachments.length,
      isLoading,
      currentModel,
      messagesInHistory: messages.length
    });

    // Validation
    if (!text || !text.trim()) {
      if (normalizedAttachments.length === 0) {
        console.warn('⚠️ No text or attachments provided');
        return;
      }
    }
    
    if (isLoading) {
      console.warn('⚠️ Already loading, ignoring send');
      return;
    }
    
    if (!currentModel) {
      console.error('❌ No model selected');
      alert('Please select an AI model first');
      return;
    }

    // ========================================
    // STEP 1: Process CURRENT attachments ONLY
    // ========================================
    let images = [];
    let documentContext = "";

    if (normalizedAttachments.length > 0) {
      console.log('📎 Processing NEW attachments for THIS message only');
      
      for (const att of normalizedAttachments) {
        if (att.type === 'image' && att.data) {
          // Image is already base64 from Workspace component
          // Remove the data:image/...;base64, prefix for Ollama
          const base64Data = att.data.split(',')[1];
          if (base64Data) {
            images.push(base64Data);
            console.log('🖼️ Added image to current message context');
          }
        } else if (att.type === 'file') {
          // For text files, note that a file was attached
          documentContext += `\n--- UPLOADED FILE: ${att.name} ---\n`;
          console.log('📄 Added file context:', att.name);
        }
      }
    }

    // ========================================
    // STEP 2: Build conversation context (TEXT ONLY, NO IMAGES)
    // ========================================
    // Only include recent conversation for context (last 10 messages)
    const conversationHistory = messages.slice(-10).map(msg => {
      // Strip out any image references, just keep the text
      const role = msg.role === 'user' ? 'USER' : 'ASSISTANT';
      return `${role}: ${msg.content}`;
    }).join('\n\n');

    console.log('📜 Built conversation history (text only, last 10 messages)');

    // ========================================
    // STEP 3: Add user message with attachments (for DISPLAY only)
    // ========================================
    console.log('➕ Adding user message to chat');
    messagesDispatch({ 
      type: 'ADD_USER_MESSAGE', 
      payload: { 
        text: text || '', 
        attachments: normalizedAttachments // Stored for UI display, not sent to AI again
      } 
    });

    // ========================================
    // STEP 4: Add empty assistant message
    // ========================================
    console.log('➕ Adding empty assistant message');
    messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
    setIsLoading(true);

    // ========================================
    // STEP 5: Get project context (text files only)
    // ========================================
    let contextFiles = [];
    let systemPrompt = settings.systemPrompt;
    let pid = null;
    
    if (activeProject) {
      pid = activeProject.id;
      const liveProject = projects.find(p => p.id === activeProject.id);
      contextFiles = liveProject ? liveProject.files : activeProject.files || [];
      systemPrompt = liveProject?.systemPrompt || settings.systemPrompt;
      console.log('📁 Using project context:', pid);
    }

    // ========================================
    // STEP 6: Build enriched prompt with conversation context
    // ========================================
    let enrichedPrompt = text || '';
    
    // Add conversation history for context continuity
    if (conversationHistory && messages.length > 0) {
      enrichedPrompt = `[CONVERSATION HISTORY]\n${conversationHistory}\n\n[CURRENT MESSAGE]\n${enrichedPrompt}`;
    }
    
    // Add document context if present
    if (documentContext) {
      enrichedPrompt = `${documentContext}\n\n${enrichedPrompt}`;
    }

    // ========================================
    // CRITICAL: Add instruction to ONLY reference current images
    // ========================================
    if (images.length > 0) {
      // Prepend image instruction at the very beginning
      enrichedPrompt = `[IMPORTANT: You are being shown ${images.length} NEW image(s) with THIS current message. When the user asks about "the image" or "it", they mean THESE current images. DO NOT reference or mention any images from previous messages in the conversation history. Focus ONLY on these ${images.length} current image(s).]\n\n${enrichedPrompt}`;
      console.log(`✅ Sending ${images.length} image(s) with ANTI-HALLUCINATION instruction`);
    } else {
      console.log('✅ Sending text-only message (no images)');
      // Even without images, remind AI not to hallucinate about past images
      if (messages.some(m => m.attachments && m.attachments.length > 0)) {
        enrichedPrompt = `[NOTE: No images are attached to this message. If the user references "the image" or visual content, they are referring to context from our previous conversation. Do not request file contents or assume there are new images.]\n\n${enrichedPrompt}`;
      }
    }

    // ========================================
    // STEP 7: Send to Ollama with ONLY current message's images
    // ========================================
    try {
      window.lumina.sendPrompt(
        enrichedPrompt,
        currentModel,
        contextFiles,
        systemPrompt,
        settings,
        pid,
        images, // ONLY images from THIS message, not previous messages
        documentContext
      );
      console.log('✅ Message sent to Ollama successfully');
    } catch (error) {
      console.error('❌ Error sending to Ollama:', error);
      setIsLoading(false);
      messagesDispatch({ 
        type: 'APPEND_TO_LAST', 
        payload: `\n\n**Error:** Failed to send message - ${error.message}` 
      });
    }
  }, [isLoading, currentModel, activeProject, projects, settings, messages]);

  const startNewChat = useCallback(async () => {
    if (messages.length > 0) {
      const title = messages.find(m => m.role === 'user')?.content.slice(0, 30) || "Chat";
      await window.lumina.saveSession({ id: sessionId, title, messages, date: new Date().toISOString() });
      setSessions(await window.lumina.getSessions());
    }
    
    // CRITICAL: Clear messages to prevent context bleed
    messagesDispatch({ type: 'CLEAR_MESSAGES' });
    setSessionId(uuidv4());
    setIsLoading(false);
    setCurrentView('chat');
  }, [messages, sessionId]);

  const loadSession = useCallback(async (id) => {
    const data = await window.lumina.loadSession(id);
    messagesDispatch({ type: 'SET_MESSAGES', payload: data.messages || [] });
    setSessionId(data.id);
    setCurrentView('chat');
  }, []);

  const deleteSession = useCallback(async (e, id) => {
    e.stopPropagation();
    await window.lumina.deleteSession(id);
    if (id === sessionId) await startNewChat();
    setSessions(await window.lumina.getSessions());
  }, [sessionId, startNewChat]);

  const renameChat = useCallback(async (id, title) => {
    await window.lumina.renameSession(id, title);
    setSessions(await window.lumina.getSessions());
  }, []);

  // --- PROJECT ACTIONS ---
  const createProject = useCallback(async (name) => {
    const newProj = await window.lumina.createProject({ id: uuidv4(), name });
    setProjects(p => [...p, newProj]);
    setActiveProject(newProj);
    addToUndoHistory({
      type: 'create-project',
      data: { project: newProj },
      undo: async () => {
        await window.lumina.deleteProject(newProj.id);
        setProjects(p => p.filter(x => x.id !== newProj.id));
        if (activeProject?.id === newProj.id) setActiveProject(null);
      }
    });
  }, [activeProject, addToUndoHistory]);

  const deleteProject = useCallback(async (e, id) => {
    e.stopPropagation();
    const deletedProject = projects.find(p => p.id === id);
    await window.lumina.deleteProject(id);
    setProjects(p => p.filter(x => x.id !== id));
    if (activeProject?.id === id) setActiveProject(null);
    if (deletedProject) {
      addToUndoHistory({
        type: 'delete-project',
        data: { project: deletedProject },
        undo: async () => {
          const restored = await window.lumina.createProject({
            id: deletedProject.id,
            name: deletedProject.name
          });
          setProjects(p => [...p, restored]);
        }
      });
    }
  }, [activeProject, projects, addToUndoHistory]);

  const loadProjects = useCallback(async () => {
    try {
      const updatedProjects = await window.lumina.getProjects();
      setProjects(updatedProjects);
    } catch (e) {
      console.error('Load projects failed:', e);
    }
  }, []);

  const updateProjectSettings = useCallback(async (sysPrompt) => {
    if (!activeProject) return;
    const updated = await window.lumina.updateProjectSettings(activeProject.id, sysPrompt);
    if (updated) {
      setActiveProject(updated);
      setProjects(p => p.map(x => x.id === updated.id ? updated : x));
    }
  }, [activeProject]);

  const addFiles = useCallback(async () => {
    if (!activeProject) return;
    try {
      await window.lumina.addFilesToProject(activeProject.id);
      const updatedProjects = await window.lumina.getProjects();
      setProjects(updatedProjects);
      const updatedActive = updatedProjects.find(p => p.id === activeProject.id);
      if (updatedActive) setActiveProject(updatedActive);
    } catch (e) {
      console.error('Add files failed:', e);
    }
  }, [activeProject]);

  const addFolder = useCallback(async () => {
    if (!activeProject) return;
    try {
      await window.lumina.addFolderToProject(activeProject.id);
      const updatedProjects = await window.lumina.getProjects();
      setProjects(updatedProjects);
      const updatedActive = updatedProjects.find(p => p.id === activeProject.id);
      if (updatedActive) setActiveProject(updatedActive);
    } catch (e) {
      console.error('Add folder failed:', e);
    }
  }, [activeProject]);

  const addUrl = useCallback(async (url) => {
    if (!activeProject) return;
    try {
      await window.lumina.addUrlToProject(activeProject.id, url);
      const updatedProjects = await window.lumina.getProjects();
      setProjects(updatedProjects);
      const updatedActive = updatedProjects.find(p => p.id === activeProject.id);
      if (updatedActive) setActiveProject(updatedActive);
    } catch (e) {
      console.error('Add URL failed:', e);
    }
  }, [activeProject]);

  const openFile = useCallback(async (file) => {
    if (file.type === 'url') {
      window.open(file.path, '_blank');
    } else {
      try {
        await window.lumina.openFile(file.path);
      } catch (e) {
        console.error('Failed to open file:', e);
        alert('Could not open file');
      }
    }
  }, []);

  const deleteFile = useCallback(async (filePath) => {
    if (!activeProject) return;
    try {
      const result = await window.lumina.deleteFileFromProject(activeProject.id, filePath);
      if (result.success) {
        const updatedProjects = await window.lumina.getProjects();
        setProjects(updatedProjects);
        const updatedActive = updatedProjects.find(p => p.id === activeProject.id);
        if (updatedActive) setActiveProject(updatedActive);
      }
    } catch (e) {
      console.error('Delete file failed:', e);
    }
  }, [activeProject]);

  // --- CALENDAR ACTIONS ---
  const addEvent = useCallback(async (title, date, type, priority, notes, time) => {
    const ev = { id: uuidv4(), title, date, type, priority, notes, time };
    const updated = [...calendarEvents, ev];
    setCalendarEvents(updated);
    await window.lumina.saveCalendar(updated);
    addToUndoHistory({
      type: 'add-event',
      data: { event: ev },
      undo: async () => {
        const reverted = calendarEvents.filter(e => e.id !== ev.id);
        setCalendarEvents(reverted);
        await window.lumina.saveCalendar(reverted);
      }
    });
  }, [calendarEvents, addToUndoHistory]);

  const deleteEvent = useCallback(async (id) => {
    const deletedEvent = calendarEvents.find(e => e.id === id);
    const updated = calendarEvents.filter(e => e.id !== id);
    setCalendarEvents(updated);
    await window.lumina.saveCalendar(updated);
    if (deletedEvent) {
      addToUndoHistory({
        type: 'delete-event',
        data: { event: deletedEvent },
        undo: async () => {
          const restored = [...calendarEvents, deletedEvent];
          setCalendarEvents(restored);
          await window.lumina.saveCalendar(restored);
        }
      });
    }
  }, [calendarEvents, addToUndoHistory]);

  const updateEvent = useCallback(async (id, data) => {
    const oldEvent = calendarEvents.find(e => e.id === id);
    const updated = calendarEvents.map(e => e.id === id ? { ...e, ...data } : e);
    setCalendarEvents(updated);
    await window.lumina.saveCalendar(updated);
    if (oldEvent) {
      addToUndoHistory({
        type: 'update-event',
        data: { id, oldEvent, newData: data },
        undo: async () => {
          const reverted = calendarEvents.map(e => e.id === id ? oldEvent : e);
          setCalendarEvents(reverted);
          await window.lumina.saveCalendar(reverted);
        }
      });
    }
  }, [calendarEvents, addToUndoHistory]);

  const generateSchedule = useCallback(async (topic, targetDate, duration, goals) => {
    if (!topic || !targetDate) {
      alert('Please provide a topic and target date');
      return;
    }
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
        time: '10:00'
      });
    }
    newEvents.push({
      id: uuidv4(),
      title: `DEADLINE: ${topic}`,
      date: targetDate,
      type: 'deadline',
      priority: 'high',
      notes: 'Final Submission / Test',
      time: '23:59'
    });
    const updated = [...calendarEvents, ...newEvents];
    setCalendarEvents(updated);
    if (window.lumina) await window.lumina.saveCalendar(updated);
    setCurrentView('chronos');
  }, [calendarEvents, settings]);

  // --- AI AGENTS ---
  const runFlashpoint = useCallback(async () => {
    if (!currentModel) {
      alert("Please select an AI model first.");
      return;
    }
    const context = messages.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n').slice(0, 4000) || "General Knowledge";
    setIsLoading(true);
    messagesDispatch({ 
      type: 'ADD_USER_MESSAGE', 
      payload: { 
        text: 'Generate a flashcard deck from our current study session.',
        attachments: []
      } 
    });
    try {
      const prompt = `CONTEXT:\n${context}\nTASK: Generate 8-10 concise study flashcards. Return ONLY valid JSON: { "cards": [{ "front": "Question", "back": "Answer" }] }`;
      const response = await window.lumina.generateJson(prompt, currentModel, settings);
      let deck = [];
      if (Array.isArray(response)) deck = response;
      else if (response && Array.isArray(response.cards)) deck = response.cards;
      if (deck.length > 0) {
        const deckId = uuidv4();
        const newDeck = { 
            id: deckId, 
            type: 'flashcards', 
            language: 'json', 
            content: deck, 
            title: 'Flashcards',
            timestamp: Date.now()
        };
        // Use updated state setter for array
        setArtifacts(prev => [...prev, newDeck]);
        setActiveArtifactId(deckId);
        
        messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
        messagesDispatch({ type: 'APPEND_TO_LAST', payload: 'Flashcards generated successfully.' });
      } else throw new Error('Invalid JSON');
    } catch (e) {
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: 'Error: ' + e.message });
    } finally {
      setIsLoading(false);
    }
  }, [currentModel, settings, messages]);

  const runBlueprint = useCallback(async (description) => {
    if (!activeProject || !currentModel) return;
    setIsLoading(true);
    messagesDispatch({ 
      type: 'ADD_USER_MESSAGE', 
      payload: { 
        text: `Blueprint: ${description}`,
        attachments: []
      } 
    });
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
        setProjects(updatedProjects);
        const updated = updatedProjects.find(p => p.id === activeProject.id);
        if (updated) setActiveProject(updated);
      } else throw new Error('Invalid structure');
    } catch (e) {
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: 'Error: ' + e.message });
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, currentModel, settings]);

  const runDiffDoctor = useCallback(async () => {
    if (!activeProject || !gitStatus || gitStatus.clean) return;
    setIsLoading(true);
    messagesDispatch({ 
      type: 'ADD_USER_MESSAGE', 
      payload: { 
        text: 'Run Diff Doctor.',
        attachments: []
      } 
    });
    try {
      const diff = await window.lumina.getGitDiff(activeProject.id);
      if (!diff) throw new Error("No diff");
      const prompt = `Analyze git diff. Write commit message and check bugs.\n\n${diff.slice(0, 5000)}`;
      window.lumina.sendPrompt(prompt, currentModel, [], activeProject.systemPrompt, settings, null, [], "");
    } catch (e) {
      setIsLoading(false);
    }
  }, [activeProject, gitStatus, currentModel, settings]);

  const runDeepResearch = useCallback(async (url) => {
    if (!activeProject) return;
    setIsLoading(true);
    try {
      messagesDispatch({ 
        type: 'ADD_USER_MESSAGE', 
        payload: { 
          text: `Deep Research: ${url}`,
          attachments: []
        } 
      });
      messagesDispatch({ type: 'ADD_ASSISTANT_MESSAGE' });
      const rawContent = await window.lumina.runDeepResearch(activeProject.id, url);
      const updatedProjects = await window.lumina.getProjects();
      setProjects(updatedProjects);
      const updatedProject = updatedProjects.find(p => p.id === activeProject.id);
      if (updatedProject) setActiveProject(updatedProject);
      const prompt = `Analyze this content and report.\n\nCONTENT:\n${rawContent}`;
      window.lumina.sendPrompt(prompt, currentModel, [], activeProject.systemPrompt, settings, null, [], "");
    } catch (e) {
      messagesDispatch({ type: 'APPEND_TO_LAST', payload: `\n\n**Error:** ${e.message}` });
      setIsLoading(false);
    }
  }, [activeProject, currentModel, settings]);

  const generateDossier = useCallback(async () => {
    if (!activeProject || !currentModel) return;
    setIsLoading(true);
    try {
      const prompt = `Analyze these project files. 
        Return a JSON object with: 
        { 
          "summary": "A concise 2-sentence summary of what this project is about.", 
          "tags": ["Tag1", "Tag2", "Tag3"], 
          "questions": ["Suggest a relevant question 1?", "Suggest a relevant question 2?", "Suggest a relevant question 3?"] 
        }`;

      const dossier = await window.lumina.generateJson(prompt, currentModel, settings, activeProject.id);

      if (dossier && !dossier.error) {
        await window.lumina.saveProjectDossier(activeProject.id, dossier);
        setActiveProject(prev => ({ ...prev, dossier }));
        setProjects(prev => prev.map(p => p.id === activeProject.id ? { ...p, dossier } : p));
      }
    } catch (e) {
      console.error("Dossier failed", e);
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, currentModel, settings]);

  // --- ARTIFACTS / LAB BENCH ACTIONS (UPDATED FOR TABS) ---
  const openLabBench = useCallback((content, language) => {
    console.log('🔬 openLabBench called with:', { language, contentLength: content?.length });
    
    // Check if this content is already open in a tab to prevent duplicates
    // We check against content equality for simplicity, though IDs are preferred if available
    const existing = artifacts.find(a => a.content === content && a.language === language);
    
    if (existing) {
        // If it exists, just switch to that tab
        setActiveArtifactId(existing.id);
        return;
    }

    // Create new artifact tab
    const newId = uuidv4();
    const newArtifact = { 
        id: newId, 
        content, 
        language,
        type: 'code',
        title: `${language || 'text'} snippet`, // Basic title, can be improved
        timestamp: Date.now()
    };

    setArtifacts(prev => [...prev, newArtifact]);
    setActiveArtifactId(newId);
  }, [artifacts]);

  const closeArtifact = useCallback((id) => {
    setArtifacts(prev => {
        const newArr = prev.filter(a => a.id !== id);
        
        // If we closed the active tab, switch to the last available one
        if (id === activeArtifactId) {
             if (newArr.length > 0) {
                 setActiveArtifactId(newArr[newArr.length - 1].id);
             } else {
                 setActiveArtifactId(null);
             }
        }
        return newArr;
    });
  }, [activeArtifactId]);

  const closeLabBench = useCallback(() => {
    // Clear all
    setArtifacts([]);
    setActiveArtifactId(null);
  }, []);

  // --- CONTEXT VALUE ---
  const contextValue = useMemo(() => ({
    // Core State
    messages,
    sendMessage,
    isLoading,
    isOllamaRunning,
    currentModel,
    setCurrentModel,
    availableModels,
    settings,
    updateSettings,
    refreshModels,
    factoryReset,
    theme,
    isInitialized,

    // Sessions
    sessions,
    sessionId,
    startNewChat,
    loadSession,
    deleteSession,
    renameChat,

    // Projects
    projects,
    activeProject,
    setActiveProject,
    createProject,
    deleteProject,
    updateProjectSettings,
    addFiles,
    addFolder,
    addUrl,
    openFile,
    deleteFile,
    generateDossier,
    loadProjects,

    // Canvas
    canvasNodes,
    addCanvasNode,
    updateCanvasNode,
    deleteCanvasNode,
    canvasConnections,
    setCanvasConnections,

    // Calendar
    calendarEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    generateSchedule,

    // Navigation
    currentView,
    setCurrentView,

    // Git
    gitStatus,

    // Artifacts / Lab Bench
    activeArtifact, // The computed current object
    activeArtifactId,
    setActiveArtifactId, // To switch tabs
    artifacts, // The array of all open tabs
    openLabBench,
    closeLabBench,
    closeArtifact, // New function to close specific tab

    // AI Agents
    runFlashpoint,
    runBlueprint,
    runDiffDoctor,
    runDeepResearch,

    // Settings Modal
    openGlobalSettings: () => setIsSettingsOpen(true),
    closeGlobalSettings: () => setIsSettingsOpen(false),
    isSettingsOpen,

    // Phase 1: New Features
    commandPaletteOpen,
    setCommandPaletteOpen,
    undoHistory,
    redoHistory,
    performUndo,
    performRedo,
    addToUndoHistory,

    // Podcast (TTS)
    togglePodcast: () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else if (messages.length > 0) {
        const u = new SpeechSynthesisUtterance(messages[messages.length - 1].content);
        u.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(u);
        setIsSpeaking(true);
      }
    }
  }), [
    messages,
    sendMessage,
    isLoading,
    isOllamaRunning,
    currentModel,
    availableModels,
    settings,
    updateSettings,
    refreshModels,
    factoryReset,
    theme,
    isInitialized,
    sessions,
    sessionId,
    startNewChat,
    loadSession,
    deleteSession,
    renameChat,
    projects,
    activeProject,
    createProject,
    deleteProject,
    updateProjectSettings,
    addFiles,
    addFolder,
    addUrl,
    openFile,
    deleteFile,
    generateDossier,
    loadProjects,
    canvasNodes,
    addCanvasNode,
    updateCanvasNode,
    deleteCanvasNode,
    canvasConnections,
    calendarEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    generateSchedule,
    currentView,
    gitStatus,
    
    // Updated Artifact dependencies
    activeArtifact,
    activeArtifactId,
    artifacts,
    openLabBench,
    closeLabBench,
    closeArtifact,
    
    runFlashpoint,
    runBlueprint,
    runDiffDoctor,
    runDeepResearch,
    isSettingsOpen,
    commandPaletteOpen,
    undoHistory,
    redoHistory,
    performUndo,
    performRedo,
    addToUndoHistory,
    isSpeaking
  ]);

  return <LuminaContext.Provider value={contextValue}>{children}</LuminaContext.Provider>;
};

export const useLumina = () => useContext(LuminaContext);