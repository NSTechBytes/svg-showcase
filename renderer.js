// ---------------------- Global Variables & File Rendering ----------------------
let currentFiles = [];
const gridContainer = document.getElementById("grid");
const noFilesMessage = document.getElementById("no-files");

function renderGrid(filePaths) {
  currentFiles = filePaths;
  if (filePaths.length === 0) {
    gridContainer.innerHTML = "";
    noFilesMessage.style.display = "block";
  } else {
    noFilesMessage.style.display = "none";
    gridContainer.innerHTML = filePaths
      .map(filePath => {
        const fileName = filePath.split(/[/\\]/).pop();
        return `
          <div class="svg-card" data-file-path="${filePath}">
            <div class="svg-preview">
              <img src="file://${filePath}" alt="${fileName}" />
            </div>
            <p>${fileName}</p>
          </div>
        `;
      })
      .join("");
  }
}

async function openFiles(method) {
  const files = await method();
  if (files && files.length > 0) {
    renderGrid(files);
    showPage("files-page");
  } else {
    alert("Operation Cancelled by user.");
  }
}

document.getElementById("openFile").addEventListener("click", () => {
  openFiles(window.electronAPI.openFileDialog);
});
document.getElementById("openFolder").addEventListener("click", () => {
  openFiles(window.electronAPI.openFolderDialog);
});

// ---------------------- Custom Toolbar Window Controls ----------------------
document.getElementById("minimizeBtn").addEventListener("click", () => {
  window.electronAPI.minimize();
});
document.getElementById("maximizeBtn").addEventListener("click", () => {
  window.electronAPI.maximize();
});
document.getElementById("closeBtn").addEventListener("click", () => {
  window.electronAPI.close();
});
window.electronAPI.onWindowMaximized((isMaximized) => {
  const maximizeBtn = document.getElementById("maximizeBtn");
  maximizeBtn.innerHTML = isMaximized
    ? `<i class="fas fa-window-restore"></i>`
    : `<i class="fas fa-window-maximize"></i>`;
});
document.getElementById("maximizeBtn").innerHTML = `<i class="fas fa-window-maximize"></i>`;

// ---------------------- Navigation & Active State via Navbar ----------------------
function showPage(pageId) {
  ["home-page", "info-page", "files-page", "settings-page", "update-page"].forEach(id => {
    const page = document.getElementById(id);
    if (page) page.style.display = "none";
  });
  const selectedPage = document.getElementById(pageId);
  if (selectedPage) selectedPage.style.display = "block";

  // Update active state on navbar links
  document.querySelectorAll("#nav-right a").forEach(link => {
    link.classList.remove("active");
  });
  const mapping = {
    "home-page": "nav-home",
    "files-page": "nav-files",
    "settings-page": "nav-settings",
    "update-page": "nav-update",
    "info-page": "nav-info"
  };
  const navId = mapping[pageId];
  if (navId) {
    document.getElementById(navId).classList.add("active");
  }
}

window.addEventListener("load", () => {
  showPage("home-page");
 // typeEffect();
});

// Navbar click listeners
document.getElementById("nav-home").addEventListener("click", () => {
  showPage("home-page");
});
document.getElementById("nav-info").addEventListener("click", () => {
  showPage("info-page");
});
document.getElementById("nav-files").addEventListener("click", () => {
  renderGrid(currentFiles);
  showPage("files-page");
});
document.getElementById("nav-settings").addEventListener("click", () => {
  showPage("settings-page");
});
document.getElementById("nav-update").addEventListener("click", () => {
  showPage("update-page");
});

// ---------------------- Settings Page Functionality ----------------------
// Theme and Preview Scale
const themeToggle = document.getElementById("theme-toggle");
const previewScale = document.getElementById("preview-scale");

if (localStorage.getItem("theme")) {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    themeToggle.value = "light";
  } else {
    document.body.classList.remove("light-theme");
    themeToggle.value = "dark";
  }
}
if (localStorage.getItem("previewHeight")) {
  const savedHeight = localStorage.getItem("previewHeight");
  document.documentElement.style.setProperty("--preview-height", savedHeight + "px");
  previewScale.value = savedHeight;
}

themeToggle.addEventListener("change", (event) => {
  const theme = event.target.value;
  if (theme === "light") {
    document.body.classList.add("light-theme");
  } else {
    document.body.classList.remove("light-theme");
  }
  localStorage.setItem("theme", theme);
});

previewScale.addEventListener("input", (event) => {
  const heightValue = event.target.value;
  document.documentElement.style.setProperty("--preview-height", heightValue + "px");
  localStorage.setItem("previewHeight", heightValue);
});

// ---------------------- Export Options Settings ----------------------
const pngWidthInput = document.getElementById("png-width");
const pngHeightInput = document.getElementById("png-height");
const iconWidthInput = document.getElementById("icon-width");
const iconHeightInput = document.getElementById("icon-height");

if (localStorage.getItem("pngWidth")) {
  pngWidthInput.value = localStorage.getItem("pngWidth");
}
if (localStorage.getItem("pngHeight")) {
  pngHeightInput.value = localStorage.getItem("pngHeight");
}
if (localStorage.getItem("iconWidth")) {
  iconWidthInput.value = localStorage.getItem("iconWidth");
}
if (localStorage.getItem("iconHeight")) {
  iconHeightInput.value = localStorage.getItem("iconHeight");
}

pngWidthInput.addEventListener("input", (event) => {
  localStorage.setItem("pngWidth", event.target.value);
});
pngHeightInput.addEventListener("input", (event) => {
  localStorage.setItem("pngHeight", event.target.value);
});
iconWidthInput.addEventListener("input", (event) => {
  localStorage.setItem("iconWidth", event.target.value);
});
iconHeightInput.addEventListener("input", (event) => {
  localStorage.setItem("iconHeight", event.target.value);
});

// ---------------------- Update Page Functionality using Windows Registry ----------------------
const updateButton = document.getElementById("check-update");

function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const a = parts1[i] || 0;
    const b = parts2[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

async function checkForUpdates() {
  try {
    const localVersion = await window.electronAPI.getLocalVersion();
    document.getElementById("local-version").textContent =  localVersion;
    
    const remoteResponse = await fetch('https://api.github.com/repos/NSTechBytes/svg-showcase/releases/latest');
    const remoteData = await remoteResponse.json();
    let remoteVersion = remoteData.tag_name;
    remoteVersion = remoteVersion.startsWith("v") ? remoteVersion.substring(1) : remoteVersion;
    document.getElementById("remote-version").textContent = remoteVersion;
    
    if (compareVersions(remoteVersion, localVersion) > 0) {
      document.getElementById("update-status").textContent = "Update Available!";
      updateButton.textContent = "Download Now";
      updateButton.onclick = () => {
        window.open('https://github.com/NSTechBytes/svg-showcase/releases', '_blank');
      };
    } else {
      document.getElementById("update-status").textContent = "You're up-to-date.";
      updateButton.textContent = "Check for Updates";
      updateButton.onclick = checkForUpdates;
    }
  } catch (error) {
    console.error("Update check failed:", error);
    document.getElementById("update-status").textContent = "Error checking update.";
    updateButton.textContent = "Check for Updates";
    updateButton.onclick = checkForUpdates;
  }
}

updateButton.addEventListener("click", checkForUpdates);

// ---------------------- Modal Popup & Export Functions ----------------------
async function showFileModal(filePath) {
  const fileName = filePath.split(/[/\\]/).pop();
  document.getElementById("modal-file-name").textContent = fileName;
  document.getElementById("modal-svg-preview").innerHTML = `<img src="file://${filePath}" alt="${fileName}" style="max-width:100%; max-height:200px;" />`;
  try {
    const response = await fetch("file://" + filePath);
    if (response.ok) {
      const svgCode = await response.text();
      document.getElementById("modal-svg-code").value = svgCode;
    } else {
      document.getElementById("modal-svg-code").value = "Error loading SVG content.";
    }
  } catch (err) {
    console.error("Error loading SVG content:", err);
    document.getElementById("modal-svg-code").value = "Error loading SVG content.";
  }
  document.getElementById("fileModal").style.display = "flex";
}

gridContainer.addEventListener("click", (e) => {
  const card = e.target.closest(".svg-card");
  if (card) {
    const filePath = card.getAttribute("data-file-path");
    if (filePath) {
      showFileModal(filePath);
    }
  }
});

document.querySelector("#fileModal .close-button").addEventListener("click", () => {
  document.getElementById("fileModal").style.display = "none";
});
document.getElementById("fileModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("fileModal")) {
    document.getElementById("fileModal").style.display = "none";
  }
});

async function exportSVGAsPNG() {
  const svgCode = document.getElementById("modal-svg-code").value;
  const fileName = document.getElementById("modal-file-name").textContent;
  
  const pngWidth = Number(document.getElementById("png-width").value) || 800;
  const pngHeight = Number(document.getElementById("png-height").value) || 600;
  
  const canvas = document.createElement("canvas");
  canvas.width = pngWidth;
  canvas.height = pngHeight;
  const ctx = canvas.getContext("2d");
  
  const v = await canvg.Canvg.fromString(ctx, svgCode);
  // Resize to match the specified export dimensions
  v.resize(canvas.width, canvas.height, true);
  await v.render();
  
  const dataURL = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = fileName + ".png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function exportSVGAsPDF() {
  const svgCode = document.getElementById("modal-svg-code").value;
  const fileName = document.getElementById("modal-file-name").textContent;
  
  const pngWidth = Number(document.getElementById("png-width").value) || 800;
  const pngHeight = Number(document.getElementById("png-height").value) || 600;
  
  const canvas = document.createElement("canvas");
  canvas.width = pngWidth;
  canvas.height = pngHeight;
  const ctx = canvas.getContext("2d");
  
  const v = await canvg.Canvg.fromString(ctx, svgCode);
  v.resize(canvas.width, canvas.height, true);
  await v.render();
  
  const dataURL = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });
  pdf.addImage(dataURL, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(fileName + ".pdf");
}

async function exportSVGAsICO() {
  const svgCode = document.getElementById("modal-svg-code").value;
  const fileName = document.getElementById("modal-file-name").textContent;
  
  const iconWidth = Number(document.getElementById("icon-width").value) || 64;
  const iconHeight = Number(document.getElementById("icon-height").value) || 64;
  
  const canvas = document.createElement("canvas");
  canvas.width = iconWidth;
  canvas.height = iconHeight;
  const ctx = canvas.getContext("2d");
  
  const v = await canvg.Canvg.fromString(ctx, svgCode);
  v.resize(canvas.width, canvas.height, true);
  await v.render();
  
  const dataURL = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = fileName + ".ico";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

document.getElementById("export-png").addEventListener("click", exportSVGAsPNG);
document.getElementById("export-ico").addEventListener("click", exportSVGAsICO);
document.getElementById("save-pdf").addEventListener("click", exportSVGAsPDF);
document.getElementById("copy-svg").addEventListener("click", () => {
  const svgCode = document.getElementById("modal-svg-code").value;
  navigator.clipboard.writeText(svgCode);
});

//const homeSubtitle = document.getElementById("home-subtitle");
//const typingText = "Most Reliable Tool for SVG to view, and export SVG files in multiple formats";
//let index = 0;
//function typeEffect() {
//  if (index < typingText.length) {
//    homeSubtitle.textContent += typingText.charAt(index);
//    index++;
//   setTimeout(typeEffect, 10);
//  }
//}

window.electronAPI.onOpenSVG((event, files) => {
  let newFiles = Array.isArray(files) ? files : [files];
  currentFiles = [...new Set([...currentFiles, ...newFiles])];
  renderGrid(currentFiles);
  showPage("files-page");
});

function showPage(pageId) {
  if (typeof pageId === 'undefined') {
    console.error("showPage called without a pageId");
    return;
  }

  // Hide all pages
  ["home-page", "info-page", "files-page", "settings-page", "update-page"].forEach(id => {
    const page = document.getElementById(id);
    if (page) page.style.display = "none";
  });

  // Show selected page
  const selectedPage = document.getElementById(pageId);
  if (selectedPage) selectedPage.style.display = "block";

  // Update active state on navbar links (use .nav-right a to match your HTML)
  document.querySelectorAll(".nav-right a").forEach(link => {
    link.classList.remove("active");
  });
  
  const mapping = {
    "home-page": "nav-home",
    "files-page": "nav-files",
    "settings-page": "nav-settings",
    "update-page": "nav-update",
    "info-page": "nav-info"
  };
  
  const navId = mapping[pageId];
  if (navId) {
    document.getElementById(navId).classList.add("active");
  }
}
