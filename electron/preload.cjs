const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('lumina', {
  // ==========================================
  // 1. AI CORE (Ollama Bridge)
  // ==========================================
  checkOllamaStatus: (url) => ipcRenderer.invoke('ollama:status', url),
  getModels: (url) => ipcRenderer.invoke('ollama:models', url),
  
  // Streaming Chat (Nexus) - NOW WITH MULTIMODAL SUPPORT
  sendPrompt: (prompt, model, contextFiles, systemPrompt, settings, projectId, images, documentContext) => 
    ipcRenderer.send('ollama:stream-prompt', { 
      prompt, 
      model, 
      contextFiles, 
      systemPrompt, 
      settings, 
      projectId,
      images, // NEW: Base64 images for vision
      documentContext // NEW: Extracted text from documents
    }),
  
  // JSON Agent (Dossier / Flashcards)
  generateJson: (prompt, model, settings, projectId) => ipcRenderer.invoke('ollama:generate-json', { prompt, model, settings, projectId }),
  
  // Text Completion (Zenith Ghost Writer)
  generateCompletion: (prompt, model, settings) => ipcRenderer.invoke('ollama:completion', { prompt, model, settings }),

  // --- NEW: File Processing ---
  extractTextFromFile: (filePath) => ipcRenderer.invoke('file:extract-text', filePath),
  processImage: (imageData) => ipcRenderer.invoke('file:process-image', imageData),

  // --- AI Listeners ---
  onResponseChunk: (cb) => {
    const sub = (_e, data) => cb(data);
    ipcRenderer.on('ollama:chunk', sub);
    return () => ipcRenderer.removeListener('ollama:chunk', sub);
  },
  onAIError: (cb) => {
    const sub = (_e, message) => cb(message);
    ipcRenderer.on('ollama:error', sub);
    return () => ipcRenderer.removeListener('ollama:error', sub);
  },
  
  // ==========================================
  // 2. UPDATER
  // ==========================================
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  quitAndInstall: () => ipcRenderer.send('quit-and-install'),
  onUpdateMessage: (callback) => {
    const sub = (_e, value) => callback(value);
    ipcRenderer.on('update-message', sub);
    return () => ipcRenderer.removeListener('update-message', sub);
  },

  // ==========================================
  // 3. SYSTEM & FILES
  // ==========================================
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  resetSystem: () => ipcRenderer.invoke('system:factory-reset'),
  
  // --- SPECIFIC DATA DELETION HANDLERS ---
  deleteChats: () => ipcRenderer.invoke('system:delete-chats'),
  deleteCache: () => ipcRenderer.invoke('system:delete-cache'),
  deleteCalendar: () => ipcRenderer.invoke('system:delete-calendar'),
  
  // File System Operations - FIXED FOR ZENITH
  listFiles: (directory) => ipcRenderer.invoke('system:list-files', directory),
  readFile: (filename) => ipcRenderer.invoke('system:read-file', filename),
  saveGeneratedFile: (content, filename) => ipcRenderer.invoke('system:save-generated-file', { content, filename }),
  deleteFile: (filename) => ipcRenderer.invoke('system:delete-file', filename),
  openFile: (filePath) => ipcRenderer.invoke('system:open-file', filePath),
  
  // Command Bar Listener (Alt+Space)
  onToggleCommandBar: (cb) => {
      const sub = () => cb();
      ipcRenderer.on('cmd-bar:toggle', sub);
      return () => ipcRenderer.removeListener('cmd-bar:toggle', sub);
  },

  // ==========================================
  // 4. PROJECT MANAGEMENT
  // ==========================================
  getProjects: () => ipcRenderer.invoke('project:list'),
  createProject: (data) => ipcRenderer.invoke('project:create', data),
  addFilesToProject: (id) => ipcRenderer.invoke('project:add-files', id),
  addFolderToProject: (id) => ipcRenderer.invoke('project:add-folder', id),
  addUrlToProject: (id, url) => ipcRenderer.invoke('project:add-url', { projectId: id, url }),
  updateProjectSettings: (id, systemPrompt) => ipcRenderer.invoke('project:update-settings', { id, systemPrompt }),
  deleteProject: (id) => ipcRenderer.invoke('project:delete', id),
  scaffoldProject: (projectId, structure) => ipcRenderer.invoke('project:scaffold', { projectId, structure }),
  saveProjectDossier: (id, dossier) => ipcRenderer.invoke('project:save-dossier', { id, dossier }),
  deleteFileFromProject: (projectId, filePath) => ipcRenderer.invoke('project:delete-file', { projectId, filePath }),
  addFileToProject: (projectId, filename) => ipcRenderer.invoke('project:add-file-to-project', { projectId, filename }),

  // ==========================================
  // 5. ADVANCED AGENTS (Graph, Research, Git)
  // ==========================================
  generateGraph: (id) => ipcRenderer.invoke('project:generate-graph', id),
  runDeepResearch: (id, url) => ipcRenderer.invoke('agent:deep-research', { projectId: id, url }),
  getGitStatus: (id) => ipcRenderer.invoke('git:status', id),
  getGitDiff: (id) => ipcRenderer.invoke('git:diff', id),

  // ==========================================
  // 6. SESSIONS & CALENDAR
  // ==========================================
  saveSession: (data) => ipcRenderer.invoke('session:save', data),
  getSessions: () => ipcRenderer.invoke('session:list'),
  loadSession: (id) => ipcRenderer.invoke('session:load', id),
  deleteSession: (id) => ipcRenderer.invoke('session:delete', id),
  renameSession: (id, title) => ipcRenderer.invoke('session:rename', { id, title }),
  
  loadCalendar: () => ipcRenderer.invoke('calendar:load'),
  saveCalendar: (events) => ipcRenderer.invoke('calendar:save', events),
});
