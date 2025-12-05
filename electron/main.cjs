const { app, BrowserWindow, ipcMain, shell, dialog, net, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const url = require('url');
const { createTray } = require('./tray.cjs'); 
const { autoUpdater } = require("electron-updater");
const log = require('electron-log');

// --- 1. CONFIGURATION ---
log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowPrerelease = false; 
autoUpdater.fullChangelog = false;

// --- 2. LAZY LOAD DEPENDENCIES ---
const loadPdf = () => require('pdf-parse');
const loadCheerio = () => require('cheerio');
const loadGit = () => require('simple-git');
const loadGoogleApis = () => require('googleapis');
const loadStore = () => require('electron-store');

// Global References
let mainWindow;
let tray = null; 

// --- 3. FILE SYSTEM PATHS ---
const getUserDataPath = () => app.getPath('userData');
const getSessionsPath = () => path.join(getUserDataPath(), 'sessions');
const getProjectsPath = () => path.join(getUserDataPath(), 'projects');
const getCachePath = () => path.join(getProjectsPath(), 'cache');
const getGeneratedFilesPath = () => path.join(getUserDataPath(), 'generated-files');
const getSettingsPath = () => path.join(getUserDataPath(), 'settings.json');
const getCalendarPath = () => path.join(getUserDataPath(), 'calendar.json');

// Ensure directories exist
[getSessionsPath(), getProjectsPath(), getCachePath(), getGeneratedFilesPath()].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Default Settings
const DEFAULT_SETTINGS = {
  ollamaUrl: "http://127.0.0.1:11434",
  defaultModel: "", 
  contextLength: 8192,
  temperature: 0.3,
  systemPrompt: "",
  developerMode: false,
  fontSize: 14,
  chatDensity: 'comfortable'
};

// --- 4. GOOGLE CALENDAR SETUP ---
let oauth2Client = null;
let store = null;

function initGoogleCalendar() {
  try {
    const { google } = loadGoogleApis();
    const Store = loadStore();
    
    store = new Store({
      encryptionKey: 'omnilab-secure-2024-gcal-encryption'
    });
    
    // Get credentials from storage (set by user in Settings)
    const CLIENT_ID = store.get('google.clientId');
    const CLIENT_SECRET = store.get('google.clientSecret');
    
    // Only initialize if credentials are available
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.log('⚠️ Google Calendar not configured - credentials needed in Settings');
      return false;
    }
    
    oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      'http://localhost:3000/callback'
    );
    
    console.log('✅ Google Calendar initialized with stored credentials');
    return true;
  } catch (error) {
    console.error('Google Calendar init failed:', error);
    return false;
  }
}

// --- 5. WINDOW MANAGEMENT ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#030304',
    show: false,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL("http://localhost:5173/");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  return mainWindow;
}

// --- 6. UPDATER LOGIC ---
function setupUpdater() {
  ipcMain.on('check-for-updates', () => {
    if (!app.isPackaged) {
      mainWindow?.webContents.send('update-message', { 
          status: 'not-available', 
          text: 'Updater disabled in Developer Mode' 
      });
      return;
    }
    autoUpdater.checkForUpdates();
  });

  ipcMain.on('download-update', async () => {
    try {
      log.info("User requested download...");
      await autoUpdater.downloadUpdate();
    } catch (err) {
      log.error("Download Error:", err);
      mainWindow?.webContents.send('update-message', { status: 'error', text: 'Download failed. Check internet.' });
    }
  });

  ipcMain.on('quit-and-install', () => { 
      autoUpdater.quitAndInstall(true, true); 
  });

  autoUpdater.on('checking-for-update', () => mainWindow?.webContents.send('update-message', { status: 'checking', text: 'Checking for updates...' }));
  
  autoUpdater.on('update-available', (info) => {
    log.info("Update available:", info);
    mainWindow?.webContents.send('update-message', { 
        status: 'available', 
        text: `Version ${info.version} is available!`, 
        version: info.version 
    });
  });

  autoUpdater.on('update-not-available', () => mainWindow?.webContents.send('update-message', { status: 'not-available', text: 'You are on the latest version.' }));
  
  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('update-message', { 
      status: 'downloading', 
      text: `Downloading... ${Math.round(progressObj.percent)}%`, 
      progress: progressObj.percent 
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow?.webContents.send('update-message', { status: 'downloaded', text: 'Update ready. Click to restart.' });
  });
  
  autoUpdater.on('error', (err) => {
    log.error("Updater Error:", err);
    
    if (!app.isPackaged) {
        mainWindow?.webContents.send('update-message', { 
            status: 'not-available', 
            text: 'Dev Mode: Updater Disabled' 
        });
    } else {
        mainWindow?.webContents.send('update-message', { 
            status: 'error', 
            text: `Update Error: ${err.message || "Unknown error"}` 
        });
    }
  });
}

// --- 7. HEAVY CONTEXT ENGINE ---
async function readProjectFiles(projectFiles) {
  const MAX_CONTEXT_CHARS = 128000; 
  let currentChars = 0;
  
  let context = "--- PROJECT FILE STRUCTURE (Index) ---\n";
  projectFiles.forEach(f => { context += `- ${f.name}\n`; });
  context += "\n--- BEGIN FILE CONTENTS ---\n";
  currentChars += context.length;

  for (const file of projectFiles) {
    if (currentChars >= MAX_CONTEXT_CHARS) {
      context += `\n[SYSTEM NOTE: Remaining files omitted to fit context window]\n`;
      break;
    }

    try {
      if (file.type === 'url') {
        const filePath = path.join(getCachePath(), file.cacheFile);
        if (fs.existsSync(filePath)) {
           let content = await fs.promises.readFile(filePath, 'utf-8');
           if (content.length > 5000) content = content.slice(0, 5000) + "\n...[Web Page Truncated]...";
           const entry = `\n>>> SOURCE: ${file.name} (Web)\n${content}\n`;
           if (currentChars + entry.length < MAX_CONTEXT_CHARS) {
             context += entry;
             currentChars += entry.length;
           }
        }
        continue;
      }

      if (!fs.existsSync(file.path)) continue;
      const stats = await fs.promises.stat(file.path);
      if (stats.size > 20 * 1024 * 1024) continue; 
      
      let fileContent = "";
      
      if (file.path.toLowerCase().endsWith('.pdf')) {
        try {
          const pdf = loadPdf(); 
          const dataBuffer = await fs.promises.readFile(file.path);
          const data = await pdf(dataBuffer);
          fileContent = data.text;
        } catch (pdfErr) {
          fileContent = "[ERROR: Could not parse PDF text.]";
        }
      } 
      else if (!['png','jpg','jpeg','gif','exe','bin','zip','iso','dll','dmg'].includes(file.type.toLowerCase())) {
        fileContent = await fs.promises.readFile(file.path, 'utf-8');
        if (fileContent.indexOf('\0') !== -1) fileContent = ""; 
      }

      if (fileContent) {
        if (fileContent.length > 15000) {
          fileContent = fileContent.slice(0, 15000) + `\n... [File ${file.name} Truncated] ...`;
        }
        const entry = `\n>>> FILE: ${file.name}\n${fileContent}\n`;
        if (currentChars + entry.length < MAX_CONTEXT_CHARS) {
          context += entry;
          currentChars += entry.length;
        }
      }
    } catch (e) { 
      console.warn(`Read Error: ${file.name}`, e); 
    }
  }
  return context;
}

// --- 8. HELPER: RECURSIVE SCAN ---
async function scanDirectory(dirPath, fileList = []) {
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.next', '.vscode'].includes(file.name)) {
          await scanDirectory(fullPath, fileList);
        }
      } else {
        if (!['.DS_Store', 'package-lock.json'].includes(file.name)) {
          fileList.push({ path: fullPath, name: file.name, type: path.extname(file.name).substring(1) });
        }
      }
    }
  } catch (e) {}
  return fileList;
}

// --- 9. HELPER: GIT HANDLER ---
const gitHandler = {
  async getStatus(rootPath) { 
    try { 
      if (!rootPath || !fs.existsSync(path.join(rootPath, '.git'))) return null; 
      const git = loadGit()(rootPath); 
      const status = await git.status(); 
      return { 
        current: status.current, 
        modified: status.modified, 
        staged: status.staged, 
        clean: status.isClean() 
      }; 
    } catch (e) { 
      return null; 
    } 
  },
  async getDiff(rootPath) { 
    try { 
      if (!rootPath) return ""; 
      const git = loadGit()(rootPath); 
      let diff = await git.diff(['--staged']); 
      if (!diff) diff = await git.diff(); 
      return diff; 
    } catch (e) { 
      return ""; 
    } 
  }
};

// --- 10. GOOGLE CALENDAR HELPERS ---
async function getAuthenticatedGoogleClient() {
  if (!store || !oauth2Client) {
    throw new Error('Google Calendar not initialized');
  }
  
  const refreshToken = store.get('google.refreshToken');
  const accessToken = store.get('google.accessToken');
  const expiryDate = store.get('google.expiryDate');
  
  if (!refreshToken) {
    throw new Error('Not authenticated. Please connect Google Calendar.');
  }
  
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
    access_token: accessToken,
    expiry_date: expiryDate
  });
  
  // Auto-refresh if expired
  if (!expiryDate || Date.now() >= expiryDate) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      store.set('google.accessToken', credentials.access_token);
      store.set('google.expiryDate', credentials.expiry_date);
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Session expired. Please reconnect Google Calendar.');
    }
  }
  
  return oauth2Client;
}

function mapEventTypeToColor(type) {
  const colors = {
    deadline: '11', // Red
    study: '9',     // Blue  
    task: '6',      // Orange
    milestone: '3'  // Purple
  };
  return colors[type] || '1'; // Default blue
}

function mapColorToEventType(colorId) {
  const types = {
    '11': 'deadline',
    '9': 'study',
    '6': 'task',
    '3': 'milestone'
  };
  return types[colorId] || 'task';
}

function addHours(time, hours) {
  if (!time) return '10:00';
  const [h, m] = time.split(':').map(Number);
  const newHour = (h + hours) % 24;
  return `${String(newHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// --- 11. APP INITIALIZATION ---
app.whenReady().then(() => {
  createWindow();
  tray = createTray(mainWindow); 
  setupUpdater();
  initGoogleCalendar(); // Initialize Google Calendar
  
  // GLOBAL SHORTCUT: Toggle Window
  try {
    globalShortcut.register('Alt+Space', () => {
      if (mainWindow.isVisible()) {
          mainWindow.hide();
      } else {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('cmd-bar:toggle');
      }
    });
  } catch (e) { console.warn("Could not register Alt+Space"); }
  
  if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify();

  // ==========================================
  // GOOGLE CALENDAR IPC HANDLERS
  // ==========================================

  // Check if Google Calendar is available
  ipcMain.handle('gcal:check-availability', async () => {
    return { available: oauth2Client !== null };
  });

  // Get authorization URL (for manual mode)
  ipcMain.handle('gcal:get-auth-url', async () => {
    if (!oauth2Client) {
      return { success: false, error: 'Google Calendar not initialized' };
    }

    try {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar'],
        prompt: 'consent'
      });
      return { success: true, url: authUrl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Authenticate with manual code
  ipcMain.handle('gcal:authenticate-with-code', async (e, code) => {
    if (!oauth2Client || !store) {
      return { success: false, error: 'Google Calendar not initialized' };
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      
      // Store tokens securely
      store.set('google.refreshToken', tokens.refresh_token);
      store.set('google.accessToken', tokens.access_token);
      store.set('google.expiryDate', tokens.expiry_date);
      store.set('google.connected', true);
      
      return { success: true, message: 'Connected to Google Calendar!' };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Invalid authorization code. Please try again.' };
    }
  });

  // Connect to Google Calendar (Local OAuth Server)
  ipcMain.handle('gcal:connect', async () => {
    if (!oauth2Client) {
      return { success: false, error: 'Google Calendar not initialized. Install googleapis package.' };
    }

    return new Promise((resolve, reject) => {
      let server;
      let resolveTimeout;

      const cleanup = () => {
        if (server) server.close();
        if (resolveTimeout) clearTimeout(resolveTimeout);
      };

      // Create temporary local server
      server = http.createServer(async (req, res) => {
        try {
          const parsedUrl = url.parse(req.url, true);
          
          if (parsedUrl.pathname === '/callback') {
            const code = parsedUrl.query.code;
            const error = parsedUrl.query.error;

            if (error) {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body style="background: #0A0A0A; color: #ff6b6b; font-family: system-ui; 
                               display: flex; align-items: center; justify-content: center; 
                               height: 100vh; text-align: center;">
                    <div>
                      <h1>❌ Authentication Failed</h1>
                      <p>${error}</p>
                      <p style="color: #888;">You can close this window.</p>
                    </div>
                  </body>
                </html>
              `);
              cleanup();
              resolve({ success: false, error: error });
              return;
            }

            if (!code) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body style="background: #0A0A0A; color: #ff6b6b; font-family: system-ui; 
                               display: flex; align-items: center; justify-content: center; 
                               height: 100vh; text-align: center;">
                    <div>
                      <h1>❌ No Authorization Code</h1>
                      <p>Please try again.</p>
                    </div>
                  </body>
                </html>
              `);
              cleanup();
              resolve({ success: false, error: 'No authorization code received' });
              return;
            }
            
            // Show success page
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="background: #0A0A0A; color: white; font-family: system-ui; 
                             display: flex; align-items: center; justify-content: center; 
                             height: 100vh; text-align: center;">
                  <div>
                    <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
                    <h1 style="margin: 0; font-size: 32px;">Success!</h1>
                    <p style="color: #888; margin-top: 10px;">
                      Connected to Google Calendar<br/>
                      You can close this window and return to OmniLab.
                    </p>
                  </div>
                </body>
              </html>
            `);
            
            // Exchange code for tokens
            try {
              const { tokens } = await oauth2Client.getToken(code);
              oauth2Client.setCredentials(tokens);
              
              // Store tokens securely
              store.set('google.refreshToken', tokens.refresh_token);
              store.set('google.accessToken', tokens.access_token);
              store.set('google.expiryDate', tokens.expiry_date);
              store.set('google.connected', true);
              
              cleanup();
              resolve({ success: true, message: 'Connected to Google Calendar!' });
            } catch (tokenError) {
              console.error('Token exchange error:', tokenError);
              cleanup();
              resolve({ success: false, error: 'Failed to exchange authorization code' });
            }
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          cleanup();
          resolve({ success: false, error: error.message });
        }
      });
      
      // Try to start server on ports 3000-3010
      let port = 3000;
      const maxPort = 3010;
      
      const tryListen = () => {
        server.listen(port, () => {
          console.log(`OAuth server listening on port ${port}`);
          
          // Generate auth URL
          const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar'],
            prompt: 'consent' // Force refresh token
          });
          
          // Open browser for user login
          shell.openExternal(authUrl);
          
          // Timeout after 5 minutes
          resolveTimeout = setTimeout(() => {
            cleanup();
            resolve({ success: false, error: 'Authentication timeout (5 minutes)' });
          }, 5 * 60 * 1000);
        }).on('error', (err) => {
          if (err.code === 'EADDRINUSE' && port < maxPort) {
            port++;
            tryListen();
          } else {
            cleanup();
            resolve({ success: false, error: `Could not start OAuth server: ${err.message}` });
          }
        });
      };
      
      tryListen();
    });
  });

  // Check connection status
  ipcMain.handle('gcal:status', async () => {
    if (!store || !oauth2Client) {
      return { connected: false, error: 'Google Calendar not initialized' };
    }

    const connected = store.get('google.connected', false);
    if (!connected) {
      return { connected: false };
    }
    
    try {
      await getAuthenticatedGoogleClient();
      return { connected: true };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  });

  // Sync events TO Google Calendar
  ipcMain.handle('gcal:sync-to-google', async (e, events) => {
    try {
      const { google } = loadGoogleApis();
      const auth = await getAuthenticatedGoogleClient();
      const calendar = google.calendar({ version: 'v3', auth });
      
      const results = [];
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      for (const event of events) {
        try {
          // Skip Google-sourced events (avoid circular sync)
          if (event.source === 'google') continue;

          const googleEvent = {
            summary: event.title,
            description: event.notes || '',
            start: {
              dateTime: `${event.date}T${event.time || '09:00'}:00`,
              timeZone: timezone
            },
            end: {
              dateTime: `${event.date}T${addHours(event.time || '09:00', 1)}:00`,
              timeZone: timezone
            },
            colorId: mapEventTypeToColor(event.type)
          };
          
          // Check if already synced
          const syncedId = store.get(`gcal.mapping.${event.id}`);
          
          if (syncedId) {
            // Update existing event
            await calendar.events.update({
              calendarId: 'primary',
              eventId: syncedId,
              resource: googleEvent
            });
            results.push({ id: event.id, action: 'updated', googleId: syncedId });
          } else {
            // Create new event
            const response = await calendar.events.insert({
              calendarId: 'primary',
              resource: googleEvent
            });
            store.set(`gcal.mapping.${event.id}`, response.data.id);
            results.push({ id: event.id, action: 'created', googleId: response.data.id });
          }
        } catch (eventError) {
          console.error(`Error syncing event ${event.id}:`, eventError);
          results.push({ id: event.id, action: 'failed', error: eventError.message });
        }
      }
      
      return { success: true, results };
    } catch (error) {
      console.error('Sync to Google error:', error);
      return { success: false, error: error.message };
    }
  });

  // Import events FROM Google Calendar
  ipcMain.handle('gcal:import-from-google', async (e, { startDate, endDate }) => {
    try {
      const { google } = loadGoogleApis();
      const auth = await getAuthenticatedGoogleClient();
      const calendar = google.calendar({ version: 'v3', auth });
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250
      });
      
      const events = response.data.items
        .filter(item => item.status !== 'cancelled')
        .map(item => ({
          id: `gcal-${item.id}`,
          title: item.summary || 'Untitled',
          date: item.start.dateTime?.split('T')[0] || item.start.date,
          time: item.start.dateTime?.split('T')[1]?.substring(0, 5),
          type: mapColorToEventType(item.colorId),
          priority: 'medium',
          notes: item.description || '',
          source: 'google',
          googleId: item.id,
          location: item.location || ''
        }));
      
      return { success: true, events, count: events.length };
    } catch (error) {
      console.error('Import from Google error:', error);
      return { success: false, error: error.message };
    }
  });

  // Disconnect from Google Calendar
  ipcMain.handle('gcal:disconnect', async () => {
    if (!store) {
      return { success: false, error: 'Store not initialized' };
    }

    try {
      // Clear all Google Calendar data
      store.delete('google.refreshToken');
      store.delete('google.accessToken');
      store.delete('google.expiryDate');
      store.delete('google.connected');
      
      // Clear event mappings
      const keys = Object.keys(store.store);
      keys.forEach(key => {
        if (key.startsWith('gcal.mapping.')) {
          store.delete(key);
        }
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // --- CREDENTIAL MANAGEMENT HANDLERS ---
  
  ipcMain.handle('gcal:save-credentials', async (event, { clientId, clientSecret }) => {
    try {
      if (!store) {
        const Store = loadStore();
        store = new Store({
          encryptionKey: 'omnilab-secure-2024-gcal-encryption'
        });
      }
      
      // Save encrypted credentials
      store.set('google.clientId', clientId);
      store.set('google.clientSecret', clientSecret);
      
      // Reinitialize Google Calendar with new credentials
      initGoogleCalendar();
      
      return { 
        success: true, 
        message: 'Credentials saved! You can now connect to Google Calendar.' 
      };
    } catch (error) {
      console.error('Save credentials error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('gcal:get-credentials', async () => {
    try {
      if (!store) {
        const Store = loadStore();
        store = new Store({
          encryptionKey: 'omnilab-secure-2024-gcal-encryption'
        });
      }
      
      const clientId = store.get('google.clientId');
      const clientSecret = store.get('google.clientSecret');
      
      return { 
        success: true, 
        hasCredentials: !!(clientId && clientSecret),
        clientId: clientId ? `${clientId.substring(0, 30)}...` : null // Partial for display
      };
    } catch (error) {
      return { success: false, hasCredentials: false };
    }
  });

  ipcMain.handle('gcal:clear-credentials', async () => {
    try {
      if (!store) {
        const Store = loadStore();
        store = new Store({
          encryptionKey: 'omnilab-secure-2024-gcal-encryption'
        });
      }
      
      // Clear credentials
      store.delete('google.clientId');
      store.delete('google.clientSecret');
      
      // Also clear auth tokens
      store.delete('google.refreshToken');
      store.delete('google.accessToken');
      store.delete('google.expiryDate');
      store.delete('google.connected');
      
      // Clear event mappings
      const keys = Object.keys(store.store);
      keys.forEach(key => {
        if (key.startsWith('gcal.mapping.')) {
          store.delete(key);
        }
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ==========================================
  // EXISTING IPC HANDLERS (UNCHANGED)
  // ==========================================

  ipcMain.handle('settings:load', async () => { try { if (fs.existsSync(getSettingsPath())) return { ...DEFAULT_SETTINGS, ...JSON.parse(await fs.promises.readFile(getSettingsPath(), 'utf-8')) }; } catch (e) { } return DEFAULT_SETTINGS; });
  ipcMain.handle('settings:save', async (e, settings) => { await fs.promises.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2)); return true; });
  ipcMain.handle('system:factory-reset', async () => { try { const del = async (d) => { if(fs.existsSync(d)){ for(const f of await fs.promises.readdir(d)){ const c=path.join(d,f); if((await fs.promises.lstat(c)).isDirectory()) await fs.promises.rm(c,{recursive:true}); else await fs.promises.unlink(c); } } }; await del(getSessionsPath()); await del(getProjectsPath()); await fs.promises.writeFile(getSettingsPath(), JSON.stringify(DEFAULT_SETTINGS)); return true; } catch(e){ return false; } });
  
  ipcMain.handle('system:delete-chats', async () => { try { const sessionsPath = getSessionsPath(); if(fs.existsSync(sessionsPath)){ const files = await fs.promises.readdir(sessionsPath); for(const f of files){ if(f.endsWith('.json')) await fs.promises.unlink(path.join(sessionsPath, f)); } } return true; } catch(e){ console.error('Delete chats error:', e); return false; } });
  ipcMain.handle('system:delete-cache', async () => { try { const cachePath = getCachePath(); if(fs.existsSync(cachePath)){ const files = await fs.promises.readdir(cachePath); for(const f of files){ await fs.promises.unlink(path.join(cachePath, f)); } } return true; } catch(e){ console.error('Delete cache error:', e); return false; } });
  ipcMain.handle('system:delete-calendar', async () => { try { const calendarPath = getCalendarPath(); if(fs.existsSync(calendarPath)){ await fs.promises.unlink(calendarPath); } return true; } catch(e){ console.error('Delete calendar error:', e); return false; } });
  
  ipcMain.handle('system:save-file', async (e, { content, filename }) => { const { filePath } = await dialog.showSaveDialog(mainWindow, { defaultPath: filename || 'zenith-draft.md', filters: [ { name: 'Markdown', extensions: ['md'] }, { name: 'Text', extensions: ['txt'] }, { name: 'All Files', extensions: ['*'] } ] }); if (filePath) { await fs.promises.writeFile(filePath, content, 'utf-8'); return true; } return false; });
  ipcMain.handle('system:save-generated-file', async (e, { content, filename }) => { try { const filePath = path.join(getGeneratedFilesPath(), filename); await fs.promises.writeFile(filePath, content, 'utf-8'); return { success: true, path: filePath }; } catch (error) { console.error('Save generated file error:', error); return { success: false, error: error.message }; } });
  ipcMain.handle('system:read-file', async (e, filename) => { try { const filePath = path.join(getGeneratedFilesPath(), filename); if (!fs.existsSync(filePath)) { return { success: false, error: 'File not found' }; } const content = await fs.promises.readFile(filePath, 'utf-8'); return { success: true, content }; } catch (error) { console.error('Read file error:', error); return { success: false, error: error.message }; } });
  ipcMain.handle('system:open-file', async (e, filePath) => { try { if (!fs.existsSync(filePath)) { return { success: false, error: 'File not found' }; } await shell.openPath(filePath); return { success: true }; } catch (error) { console.error('Error opening file:', error); return { success: false, error: error.message }; } });

  ipcMain.handle('project:list', async () => { const d = getProjectsPath(); const f = await fs.promises.readdir(d); const p = []; for (const x of f) { if(x.endsWith('.json')) p.push(JSON.parse(await fs.promises.readFile(path.join(d, x), 'utf-8'))); } return p; });
  ipcMain.handle('project:create', async (e, { id, name }) => { const limitedName = name.substring(0, 100); const p = path.join(getProjectsPath(), `${id}.json`); const n = { id, name: limitedName, files: [], systemPrompt: "", createdAt: new Date() }; await fs.promises.writeFile(p, JSON.stringify(n, null, 2)); return n; });
  ipcMain.handle('project:delete', async (e, id) => { await fs.promises.unlink(path.join(getProjectsPath(), `${id}.json`)); return true; });
  ipcMain.handle('project:update-settings', async (e, { id, systemPrompt }) => { const p = path.join(getProjectsPath(), `${id}.json`); if (fs.existsSync(p)) { const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); d.systemPrompt = systemPrompt; await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d; } return null; });
  ipcMain.handle('project:delete-file', async (e, { projectId, filePath }) => { try { const p = path.join(getProjectsPath(), `${projectId}.json`); if (fs.existsSync(p)) { const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); d.files = d.files.filter(f => f.path !== filePath); await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return { success: true, files: d.files }; } return { success: false, error: 'Project not found' }; } catch (error) { console.error('Error deleting file from project:', error); return { success: false, error: error.message }; } });
  ipcMain.handle('project:add-file-to-project', async (e, { projectId, filename }) => { try { const projectPath = path.join(getProjectsPath(), `${projectId}.json`); if (!fs.existsSync(projectPath)) { return { success: false, error: 'Project not found' }; } const project = JSON.parse(await fs.promises.readFile(projectPath, 'utf-8')); const filePath = path.join(getGeneratedFilesPath(), filename); if (!fs.existsSync(filePath)) { return { success: false, error: 'File not found' }; } const exists = project.files.some(f => f.name === filename || f.path === filePath); if (!exists) { project.files.push({ name: filename, path: filePath, type: 'md', addedAt: new Date().toISOString(), source: 'zenith' }); await fs.promises.writeFile(projectPath, JSON.stringify(project, null, 2)); } return { success: true, files: project.files }; } catch (error) { console.error('Add file to project error:', error); return { success: false, error: error.message }; } });
  
  ipcMain.handle('project:add-files', async (e, projectId) => { const r = await dialog.showOpenDialog(mainWindow, { properties: ['openFile', 'multiSelections'] }); if (!r.canceled) { const p = path.join(getProjectsPath(), `${projectId}.json`); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); const n = r.filePaths.map(x => ({ path: x, name: path.basename(x), type: path.extname(x).substring(1) })); d.files.push(...n.filter(f => !d.files.some(ex => ex.path === f.path))); await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d.files; } return null; });
  ipcMain.handle('project:add-folder', async (e, projectId) => { const r = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] }); if (!r.canceled && r.filePaths.length > 0) { const folderPath = r.filePaths[0]; const allFiles = await scanDirectory(folderPath); const p = path.join(getProjectsPath(), `${projectId}.json`); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); const newFiles = allFiles.filter(f => !d.files.some(existing => existing.path === f.path)); d.files.push(...newFiles); d.rootPath = folderPath; await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d.files; } return null; });
  ipcMain.handle('project:add-url', async (e, { projectId, url }) => { try { const cheerio = loadCheerio(); const response = await fetch(url); const html = await response.text(); const $ = cheerio.load(html); $('script, style, nav, footer, iframe').remove(); const content = $('body').text().replace(/\s\s+/g, ' ').trim(); const filename = `web-${Date.now()}.txt`; await fs.promises.writeFile(path.join(getCachePath(), filename), content, 'utf-8'); const p = path.join(getProjectsPath(), `${projectId}.json`); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); d.files.push({ path: url, name: $('title').text() || url, type: 'url', cacheFile: filename }); await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d.files; } catch (e) { throw new Error("Scrape Failed"); } });
  ipcMain.handle('agent:deep-research', async (e, { projectId, url }) => { try { const cheerio = loadCheerio(); const response = await fetch(url); const html = await response.text(); const $ = cheerio.load(html); $('script, style, nav, footer, iframe').remove(); const content = $('body').text().replace(/\s\s+/g, ' ').trim().slice(0, 15000); return content; } catch (e) { throw new Error("Research Failed"); } });
  ipcMain.handle('project:scaffold', async (e, { projectId, structure }) => { const p = path.join(getProjectsPath(), `${projectId}.json`); if (!fs.existsSync(p)) throw new Error("Project not found"); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); if (!d.rootPath) throw new Error("NO_ROOT_PATH"); const root = d.rootPath; const results = []; for (const item of structure) { try { const fullPath = path.join(root, item.path); if (!fullPath.startsWith(root)) continue; if (item.type === 'folder') { await fs.promises.mkdir(fullPath, { recursive: true }); } else { await fs.promises.mkdir(path.dirname(fullPath), { recursive: true }); await fs.promises.writeFile(fullPath, item.content || '', 'utf-8'); } results.push({ success: true, path: item.path }); } catch (err) { results.push({ success: false, path: item.path, error: err.message }); } } return results; });

  ipcMain.handle('session:save', async (e, { id, title, messages, date }) => { const p = path.join(getSessionsPath(), `${id}.json`); let t = title; if(fs.existsSync(p)){ const ex = JSON.parse(await fs.promises.readFile(p,'utf-8')); if(ex.title && ex.title!=="New Chat" && (!title||title==="New Chat")) t = ex.title; } await fs.promises.writeFile(p, JSON.stringify({ id, title:t||"New Chat", messages, date }, null, 2)); return true; });
  ipcMain.handle('session:list', async () => { const d = getSessionsPath(); const f = await fs.promises.readdir(d); const s = []; for(const x of f){ if(x.endsWith('.json')){ try{ const j=JSON.parse(await fs.promises.readFile(path.join(d,x),'utf-8')); s.push({id:j.id, title:j.title, date:j.date}); }catch(e){} } } return s.sort((a,b)=>new Date(b.date)-new Date(a.date)); });
  ipcMain.handle('session:load', async (e, id) => JSON.parse(await fs.promises.readFile(path.join(getSessionsPath(), `${id}.json`), 'utf-8')));
  ipcMain.handle('session:delete', async (e, id) => { await fs.promises.unlink(path.join(getSessionsPath(), `${id}.json`)); return true; });
  ipcMain.handle('session:rename', async (e, { id, title }) => { const p = path.join(getSessionsPath(), `${id}.json`); if(fs.existsSync(p)){ const c = JSON.parse(await fs.promises.readFile(p,'utf-8')); c.title = title; await fs.promises.writeFile(p, JSON.stringify(c,null,2)); return true; } return false; });
  ipcMain.handle('calendar:load', async () => { try { if (fs.existsSync(getCalendarPath())) return JSON.parse(await fs.promises.readFile(getCalendarPath(), 'utf-8')); return []; } catch (e) { return []; } });
  ipcMain.handle('calendar:save', async (e, events) => { try { await fs.promises.writeFile(getCalendarPath(), JSON.stringify(events, null, 2)); return true; } catch (e) { return false; } });
  ipcMain.handle('project:save-dossier', async (e, { id, dossier }) => { const p = path.join(getProjectsPath(), `${id}.json`); if (fs.existsSync(p)) { const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); d.dossier = dossier; await fs.promises.writeFile(p, JSON.stringify(d, null, 2)); return d; } return null; });

  ipcMain.handle('project:generate-graph', async (e, projectId) => { const p = path.join(getProjectsPath(), `${projectId}.json`); if (!fs.existsSync(p)) return { nodes: [], links: [] }; const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); const nodes = []; d.files.forEach((file) => nodes.push({ id: file.name, group: file.type, path: file.path })); return { nodes, links: [] }; });
  ipcMain.handle('git:status', async (e, projectId) => { const p = path.join(getProjectsPath(), `${projectId}.json`); if (!fs.existsSync(p)) return null; const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); return d.rootPath ? await gitHandler.getStatus(d.rootPath) : null; });
  ipcMain.handle('git:diff', async (e, projectId) => { const p = path.join(getProjectsPath(), `${projectId}.json`); const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); return d.rootPath ? await gitHandler.getDiff(d.rootPath) : ""; });

  ipcMain.on('ollama:stream-prompt', async (event, { prompt, model, contextFiles, systemPrompt, settings }) => { const config = settings || DEFAULT_SETTINGS; let baseUrl = (config.ollamaUrl || "http://127.0.0.1:11434").replace(/\/$/, '').replace('localhost', '127.0.0.1'); let selectedModel = model || config.defaultModel; if(!selectedModel) { try { const r = await fetch(`${baseUrl}/api/tags`); const d = await r.json(); if(d.models?.length) selectedModel = d.models[0].name; } catch(e) { mainWindow.webContents.send('ollama:error', "No AI models found."); return; } } const contextStr = await readProjectFiles(contextFiles || []); const fullPrompt = contextStr ? `[CONTEXT START]\n${contextStr}\n[CONTEXT END]\n\nQUESTION: ${prompt}` : prompt; const finalSystem = `${config.developerMode ? "You are OmniLab Forge, an expert engineer." : "You are OmniLab Nexus, a research assistant."}\n${systemPrompt || ""}`; const req = net.request({ method: 'POST', url: `${baseUrl}/api/generate` }); req.setHeader('Content-Type', 'application/json'); req.on('response', (res) => { res.on('data', (chunk) => { const lines = chunk.toString().split('\n'); for(const line of lines) { if(!line.trim()) continue; try { const json = JSON.parse(line); if(json.response) mainWindow.webContents.send('ollama:chunk', json.response); if(json.done) mainWindow.webContents.send('ollama:chunk', '[DONE]'); } catch(e){} } }); res.on('error', (e) => mainWindow.webContents.send('ollama:error', e.message)); }); req.on('error', (e) => mainWindow.webContents.send('ollama:error', "Connection Failed")); req.write(JSON.stringify({ model: selectedModel, prompt: `[SYSTEM] ${finalSystem}\n\n[USER] ${fullPrompt}`, stream: true, options: { num_ctx: config.contextLength || 8192, temperature: 0.4 } })); req.end(); });
  ipcMain.handle('ollama:generate-json', async (e, { prompt, model, settings, projectId }) => { const config = settings || DEFAULT_SETTINGS; let baseUrl = (config.ollamaUrl || "http://127.0.0.1:11434").replace(/\/$/, '').replace('localhost', '127.0.0.1'); let selectedModel = model || config.defaultModel; if(!selectedModel) { try { const r = await fetch(`${baseUrl}/api/tags`); const d = await r.json(); if(d.models?.length) selectedModel = d.models[0].name; } catch(e){} } let contextStr = ""; if (projectId) { const p = path.join(getProjectsPath(), `${projectId}.json`); if (fs.existsSync(p)) { const d = JSON.parse(await fs.promises.readFile(p, 'utf-8')); contextStr = await readProjectFiles(d.files || []); } } const fullPrompt = contextStr ? `CONTEXT:\n${contextStr}\n\nTASK: ${prompt}` : prompt; try { const r = await fetch(`${baseUrl}/api/generate`, { method:'POST', body:JSON.stringify({ model:selectedModel, prompt: fullPrompt + "\n\nRETURN ONLY RAW JSON.", format:'json', stream:false }) }); const j = await r.json(); let raw = j.response.trim(); if (raw.startsWith('```json')) raw = raw.replace(/^```json\s*/, '').replace(/\s*```$/, ''); else if (raw.startsWith('```')) raw = raw.replace(/^```\s*/, '').replace(/\s*```$/, ''); return JSON.parse(raw); } catch(err) { return { error: "Failed to parse JSON" }; } });
  ipcMain.handle('ollama:completion', async (e, { prompt, model, settings }) => { const config = settings || DEFAULT_SETTINGS; let baseUrl = (config.ollamaUrl || "http://127.0.0.1:11434").replace(/\/$/, '').replace('localhost', '127.0.0.1'); let selectedModel = model || config.defaultModel; let availableModels = []; try { const tagReq = await fetch(`${baseUrl}/api/tags`); if (tagReq.ok) { const tagData = await tagReq.json(); availableModels = tagData.models?.map(m => m.name) || []; } } catch (connErr) { console.error("Ollama Connection Failed:", connErr); return "Error: Could not connect to Ollama."; } if (availableModels.length > 0) { const exactMatch = availableModels.find(m => m === selectedModel); if (!exactMatch) { const fallback = availableModels.find(m => !m.includes('embed')) || availableModels[0]; console.log(`Requested model '${selectedModel}' not found. Falling back to '${fallback}'`); selectedModel = fallback; } } else { return "Error: No models found in Ollama. Please run 'ollama pull llama3'."; } try { const r = await fetch(`${baseUrl}/api/generate`, { method: 'POST', body: JSON.stringify({ model: selectedModel, prompt: prompt, stream: false, options: { stop: ['<|endoftext|>', '<|user|>'], temperature: 0.3 } }) }); if (!r.ok) { const errText = await r.text(); throw new Error(`Ollama API Error (${r.status}): ${errText || r.statusText}`); } const j = await r.json(); return j.response; } catch(err) { console.error("Completion Error:", err); return `Error: ${err.message}`; } });

  ipcMain.handle('ollama:status', async (e, url) => { try { const r = await fetch(`${url}/api/tags`); return r.status === 200; } catch(e){ return false; } });
  ipcMain.handle('ollama:models', async (e, url) => { try { const r = await fetch(`${url}/api/tags`); const d = await r.json(); return d.models.map(m=>m.name); } catch(e){ return []; } });

  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
