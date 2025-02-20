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

// ---------------------- Sidebar Navigation & Active State ----------------------
function showPage(pageId) {
  ["home-page", "info-page", "files-page", "settings-page", "update-page"].forEach(id => {
    const page = document.getElementById(id);
    if (page) page.style.display = "none";
  });
  const selectedPage = document.getElementById(pageId);
  if (selectedPage) selectedPage.style.display = "block";

  // Update sidebar active state
  document.querySelectorAll(".sidebar-item").forEach(item => {
    item.classList.remove("active");
  });
  const mapping = {
    "home-page": "sidebar-home",
    "files-page": "sidebar-files",
    "settings-page": "sidebar-settings",
    "update-page": "sidebar-update",
    "info-page": "sidebar-info"
  };
  const sidebarId = mapping[pageId];
  if (sidebarId) {
    document.getElementById(sidebarId).classList.add("active");
  }
}

window.addEventListener("load", () => {
  showPage("home-page");
  typeEffect();
});

// Sidebar click listeners
document.getElementById("sidebar-home").addEventListener("click", () => {
  showPage("home-page");
});
document.getElementById("sidebar-info").addEventListener("click", () => {
  showPage("info-page");
});
document.getElementById("sidebar-files").addEventListener("click", () => {
  renderGrid(currentFiles);
  showPage("files-page");
});
document.getElementById("sidebar-settings").addEventListener("click", () => {
  showPage("settings-page");
});
document.getElementById("sidebar-update").addEventListener("click", () => {
  showPage("update-page");
});

// ---------------------- Settings Page Functionality ----------------------
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

// ---------------------- Update Page Functionality ----------------------
const updateButton = document.getElementById("check-update");

async function checkForUpdates() {
  try {
    const localResponse = await fetch('./version.json');
    const localData = await localResponse.json();
    const localVersion = parseFloat(localData[0].Version);
    document.getElementById("local-version").textContent = "Local Version: " + localVersion;
    
    const remoteResponse = await fetch('https://raw.githubusercontent.com/NSTechBytes/svg-showcase/main/version.json');
    const remoteData = await remoteResponse.json();
    const remoteVersion = parseFloat(remoteData[0].Version);
    document.getElementById("remote-version").textContent = "Remote Version: " + remoteVersion;
    
    if (remoteVersion > localVersion) {
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

// ---------------------- Modal Popup Functionality for SVG File Info ----------------------
async function showFileModal(filePath) {
  const fileName = filePath.split(/[/\\]/).pop();
  document.getElementById("modal-file-name").textContent = fileName;
  
  // Set preview image
  document.getElementById("modal-svg-preview").innerHTML = `<img src="file://${filePath}" alt="${fileName}" style="max-width:100%; max-height:200px;" />`;
  
  // Load SVG content
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

// Delegate click events on grid to open modal
gridContainer.addEventListener("click", (e) => {
  const card = e.target.closest(".svg-card");
  if (card) {
    const filePath = card.getAttribute("data-file-path");
    if (filePath) {
      showFileModal(filePath);
    }
  }
});

// Close modal via close button or clicking outside modal content
document.querySelector("#fileModal .close-button").addEventListener("click", () => {
  document.getElementById("fileModal").style.display = "none";
});
document.getElementById("fileModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("fileModal")) {
    document.getElementById("fileModal").style.display = "none";
  }
});

// ---------------------- Export Functions ----------------------
async function exportSVGAsPNG() {
  const svgCode = document.getElementById("modal-svg-code").value;
  const fileName = document.getElementById("modal-file-name").textContent;
  
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");
  
  const v = await canvg.Canvg.fromString(ctx, svgCode);
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
  
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");
  
  const v = await canvg.Canvg.fromString(ctx, svgCode);
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
  
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  
  const v = await canvg.Canvg.fromString(ctx, svgCode);
  await v.render();
  
  const dataURL = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataURL;
  a.download = fileName + ".ico";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---------------------- Modal Action Button Listeners ----------------------
document.getElementById("export-png").addEventListener("click", exportSVGAsPNG);
document.getElementById("export-ico").addEventListener("click", exportSVGAsICO);
document.getElementById("save-pdf").addEventListener("click", exportSVGAsPDF);
document.getElementById("copy-svg").addEventListener("click", () => {
  const svgCode = document.getElementById("modal-svg-code").value;
  navigator.clipboard.writeText(svgCode);
});

// ---------------------- Typing Effect on Home Page ----------------------
const homeSubtitle = document.getElementById("home-subtitle");
const typingText = "Most Reliable Tool for SVG  to view, and export SVG files in multiple formats";
let index = 0;
function typeEffect() {
  if (index < typingText.length) {
    homeSubtitle.textContent += typingText.charAt(index);
    index++;
    setTimeout(typeEffect, 10);
  }
}

window.electronAPI.onOpenSVG((event, files) => {
  console.log("Received open-svg event with:", files);
  
  // Ensure that files is always an array.
  let newFiles = Array.isArray(files) ? files : [files];

  // Merge newFiles with the currentFiles array without duplicates.
  currentFiles = [...new Set([...currentFiles, ...newFiles])];
  console.log("Merged currentFiles:", currentFiles);

  renderGrid(currentFiles);
  showPage("files-page");
});



