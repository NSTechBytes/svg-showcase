const { app, BrowserWindow, dialog, ipcMain, shell,globalShortcut} = require("electron");
const path = require("path");
const fs = require("fs");
const { exec } = require('child_process');
let mainWindow;

ipcMain.handle('get-local-version', async () => {
  return new Promise((resolve, reject) => {
    exec('reg query "HKCU\\Software\\SVG Showcase" /v Version', (error, stdout, stderr) => {
      if (error) {
        console.error('Registry query error:', error);
        return reject(error);
      }
      const match = stdout.match(/Version\s+REG_SZ\s+([^\r\n]+)/);
      if (match && match[1]) {
        resolve(match[1].trim());
      } else {
        reject(new Error("Version key not found"));
      }
    });
  });
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 950,
    height: 650,
    minWidth:600,
    minHeight:400,
    frame: false,
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("renderer/index.html");

  // Update window state for renderer
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window-maximized", true);
  });
  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window-maximized", false);
  });

  // After the window loads, check for SVG files in process.argv (Windows/Linux)
  mainWindow.webContents.once("did-finish-load", () => {
    if (process.platform !== "darwin") {
      // Skip the first argument (executable) and filter for .svg files
      const svgFiles = process.argv.slice(1).filter(arg => arg.toLowerCase().endsWith(".svg"));
      if (svgFiles.length > 0) {
        console.log("Initial SVG files:", svgFiles);
        mainWindow.webContents.send("open-svg", svgFiles);
      }
    }
  });
}

// Enforce single-instance: if a second instance is launched, pass its SVG file arguments to the existing instance.
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, argv, workingDirectory) => {
    // On Windows/Linux, all file arguments will be in argv (skip the first element)
    const svgFiles = argv.slice(1).filter(arg => arg.toLowerCase().endsWith(".svg"));
    if (svgFiles.length > 0 && mainWindow) {
      console.log("Second-instance SVG files:", svgFiles);
      mainWindow.webContents.send("open-svg", svgFiles);
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createMainWindow();

    // macOS: Handle file open events (when user opens file from Finder)
    app.on("open-file", (event, filePath) => {
      event.preventDefault();
      console.log("open-file event received:", filePath);
      if (mainWindow) {
        mainWindow.webContents.send("open-svg", [filePath]);
      } else {
        app.once("browser-window-created", () => {
          mainWindow.webContents.once("did-finish-load", () => {
            mainWindow.webContents.send("open-svg", [filePath]);
          });
        });
      }
    });
  });
}

// ----- IPC Handlers for Dialogs & Window Controls -----

// Open File Dialog (allowing multiple selection)
ipcMain.handle("open-file-dialog", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "SVG Files", extensions: ["svg"] }],
  });
  if (!canceled && filePaths.length > 0) {
    return filePaths;
  }
  return [];
});

// Open Folder Dialog
ipcMain.handle("open-folder-dialog", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  if (!canceled && filePaths.length > 0) {
    const folderPath = filePaths[0];
    const svgFiles = fs
      .readdirSync(folderPath)
      .filter(file => file.toLowerCase().endsWith(".svg"))
      .map(file => path.join(folderPath, file));
    return svgFiles;
  }
  return [];
});

// Window Controls
ipcMain.on("minimize-window", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on("maximize-window", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on("close-window", () => {
  if (mainWindow) mainWindow.close();
});

// Quit when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Open external URLs in default browser
app.on("web-contents-created", (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
});
//--------------------Disable Shortcuts----------------------------------
app.on('browser-window-focus', function () {
  // Disable reload shortcuts
  globalShortcut.register("CommandOrControl+R", () => {
  //  console.log("CommandOrControl+R is pressed: Shortcut Disabled");
  });
  globalShortcut.register("F5", () => {
  //  console.log("F5 is pressed: Shortcut Disabled");
  });

  // Disable developer tools shortcuts
  globalShortcut.register("CommandOrControl+Shift+I", () => {
  //  console.log("CommandOrControl+Shift+I is pressed: Shortcut Disabled");
  });
  globalShortcut.register("CommandOrControl+Shift+J", () => {
 //   console.log("CommandOrControl+Shift+J is pressed: Shortcut Disabled");
  });
  globalShortcut.register("CommandOrControl+Shift+C", () => {
  //  console.log("CommandOrControl+Shift+C is pressed: Shortcut Disabled");
  });

  // Disable window toggle fullscreen if needed
  globalShortcut.register("F11", () => {
    console.log("F11 is pressed: Shortcut Disabled");
  });

  // Disable closing tab or window shortcuts if required (use with caution)
  globalShortcut.register("CommandOrControl+W", () => {
    console.log("CommandOrControl+W is pressed: Shortcut Disabled");
  });
});
