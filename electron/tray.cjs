const { Tray, Menu, nativeImage, globalShortcut, app } = require('electron');
const path = require('path');
const fs = require('fs');

function createTray(mainWindow) {
  // 1. SMART ICON PATH FINDER
  // Checks Resources (Prod) -> Public (Dev) -> Local (Fallback)
  let iconPath;
  if (app.isPackaged) {
    iconPath = path.join(process.resourcesPath, 'icon.png');
  } else {
    iconPath = path.join(__dirname, '../public/icon.png');
  }

  // If icon doesn't exist, try looking in the same folder as this script
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, 'icon.png');
  }

  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  } catch (e) {
    trayIcon = nativeImage.createEmpty();
  }

  const tray = new Tray(trayIcon);
  tray.setToolTip('OmniLab');

  // 2. CONTEXT MENU
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show OmniLab',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
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
          // Sends a signal to frontend to open new chat
          mainWindow.webContents.send('cmd:new-chat'); 
        }
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quit(); } },
  ]);

  tray.setContextMenu(contextMenu);

  // 3. CLICK BEHAVIOR
  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return tray;
}

module.exports = { createTray };