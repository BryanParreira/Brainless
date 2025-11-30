const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');
const fs = require('fs');

function createTray(mainWindow) {
  let iconPath;
  
  // 1. ROBUST PATH FINDING
  // This logic ensures we find the icon whether in Dev, Prod, Mac, or Windows.
  if (app.isPackaged) {
    // Production: Look in the resources folder (where Electron packs extra files)
    iconPath = path.join(process.resourcesPath, 'icon.png');
  } else {
    // Development: Check specific common locations relative to the project root
    const rootPath = app.getAppPath();
    const possiblePaths = [
      path.join(rootPath, 'icon.png'),          // Root folder
      path.join(rootPath, 'public', 'icon.png'), // Public folder
      path.join(__dirname, 'icon.png'),          // Same folder as this script
      path.join(__dirname, '../../icon.png')     // Back up to root (if inside src/electron)
    ];

    // Find the first path that actually exists
    iconPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
  }

  // 2. CREATE ICON WITH FALLBACK
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    try {
      trayIcon = nativeImage.createFromPath(iconPath);
      
      // Resize for best quality (16x16 is standard, 22x22 for Mac Retina)
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
      
      // Set as "Template Image" for macOS (makes it adapt to Dark/Light mode automatically)
      if (process.platform === 'darwin') {
        trayIcon.setTemplateImage(true);
      }
    } catch (error) {
      console.error('Failed to load tray icon:', error);
      trayIcon = nativeImage.createEmpty();
    }
  } else {
    console.warn('Tray icon not found at:', iconPath);
    trayIcon = nativeImage.createEmpty();
  }

  // 3. INSTANTIATE TRAY
  const tray = new Tray(trayIcon);
  tray.setToolTip('OmniLab');

  // 4. CONTEXT MENU
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show OmniLab',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'New Chat',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
          // Send signal to React frontend
          mainWindow.webContents.send('cmd:new-chat'); 
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit OmniLab', 
      click: () => { 
        app.isQuitting = true; // Flag to allow actual quitting
        app.quit(); 
      } 
    },
  ]);

  tray.setContextMenu(contextMenu);

  // 5. CLICK BEHAVIOR (Toggle Window)
  tray.on('click', () => {
    if (!mainWindow) return;
    
    if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  return tray;
}

module.exports = { createTray };