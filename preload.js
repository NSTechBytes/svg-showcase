const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  openFolderDialog: () => ipcRenderer.invoke("open-folder-dialog"),
  minimize: () => ipcRenderer.send("minimize-window"),
  maximize: () => ipcRenderer.send("maximize-window"),
  close: () => ipcRenderer.send("close-window"),
  onOpenSVG: (callback) => ipcRenderer.on('open-svg', callback),
  getLocalVersion: () => ipcRenderer.invoke('get-local-version'),
  onWindowMaximized: (callback) =>
    ipcRenderer.on("window-maximized", (event, isMaximized) => callback(isMaximized))
});

