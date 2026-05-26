// ==================================================
// RENDERER PROCESS - MINI WINDOWS 10 EXPLORER LOGIC
// ==================================================

// State Variables
let currentPath = '';
let history = [];
let historyIndex = -1;
let currentFiles = [];
let selectedFiles = new Set(); // Stores path strings of selected files
let sortColumn = 'name';
let sortAscending = true;

// DOM Elements
const addressInput = document.getElementById('address-input');
const goBtn = document.getElementById('go-btn');
const backBtn = document.getElementById('back-btn');
const forwardBtn = document.getElementById('forward-btn');
const upBtn = document.getElementById('up-btn');
const refreshBtn = document.getElementById('refresh-btn');
const openNativeBtn = document.getElementById('open-native-btn');
const quickAccessList = document.getElementById('quick-access-list');
const drivesList = document.getElementById('drives-list');
const filesList = document.getElementById('files-list');
const filesContainer = document.getElementById('files-view-container');
const statusOverlay = document.getElementById('status-overlay');
const statusMessage = document.getElementById('status-message');
const itemCountText = document.getElementById('item-count');
const selectedCountText = document.getElementById('selected-count');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// Context Menus
const bgContextMenu = document.getElementById('bg-context-menu');
const itemContextMenu = document.getElementById('item-context-menu');

// Properties Dialog
const propertiesDialog = document.getElementById('properties-dialog');
const propNameInput = document.getElementById('prop-name-input');
const propIcon = document.getElementById('prop-icon');
const propType = document.getElementById('prop-type');
const propLocation = document.getElementById('prop-location');
const propSize = document.getElementById('prop-size');
const propCreated = document.getElementById('prop-created');
const propModified = document.getElementById('prop-modified');

// SVG Icons Cache for high rendering performance & offline capability
const ICONS = {
  desktop: `<svg viewBox="0 0 16 16"><path fill="#0078d7" d="M0 1v10h16V1H0zm15 9H1V2h14v8zM3 12h10v1H3v-1zm4 1h2v2H7v-2z"/></svg>`,
  documents: `<svg viewBox="0 0 16 16"><path fill="#0078d7" d="M2 0v16h12V4l-4-4H2zm8 4V1.4l2.6 2.6H10zM3 2h5v3h3v9H3V2z"/></svg>`,
  downloads: `<svg viewBox="0 0 16 16"><path fill="#0078d7" d="M8 12l-4-4h3V0h2v8h3l-4 4zm-7 1h14v2H1v-2z"/></svg>`,
  pictures: `<svg viewBox="0 0 16 16"><path fill="#107c41" d="M1 1v14h14V1H1zm13 13H2V2h12v12zm-3-8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zM3 12l3-5 2 3 3-5 3 7H3z"/></svg>`,
  user: `<svg viewBox="0 0 16 16"><path fill="#0078d7" d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 1c-2.7 0-8 1.3-8 4v3h16v-3c0-2.7-5.3-4-8-4z"/></svg>`,
  drive: `<svg viewBox="0 0 16 16"><path fill="#7f7f7f" d="M1 4h14v6H1V4zm0 7h14v1H1v-1zm1-2.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0zm2 0a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0z"/></svg>`,
  folder: `<svg viewBox="0 0 16 16"><path fill="#e2a227" d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3.1c.4 0 .78.16 1.06.44l1.4 1.4c.1.1.23.16.38.16h4.1A1.5 1.5 0 0 1 14 4.5V13a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V2.5z"/></svg>`,
  fileDefault: `<svg viewBox="0 0 16 16"><path fill="#9bb3c8" d="M2 0v16h12V4l-4-4H2zm8 4V1.4l2.6 2.6H10zM3 2h5v3h3v9H3V2z"/></svg>`,
  fileText: `<svg viewBox="0 0 16 16"><path fill="#a0b5c6" d="M2 0v16h12V4l-4-4H2zm8 4V1.4l2.6 2.6H10zm-7 2h8v1H3V6zm0 2h8v1H3V8zm0 2h5v1H3v-1z"/></svg>`,
  fileExe: `<svg viewBox="0 0 16 16"><path fill="#0078d7" d="M0 0v16h16V0H0zm7 7H1V1h6v6zm8 0H9V1h6v6zM7 15H1V9h6v6zm8 0H9V9h6v6z"/></svg>`,
  fileZip: `<svg viewBox="0 0 16 16"><path fill="#e2a227" d="M2 0v16h12V4l-4-4H2zm8 4V1.4l2.6 2.6H10zM4 2h2v1H4V2zm2 1h2v1H6V3zm-2 1h2v1H4V4zm2 1h2v1H6V5zm-2 1h2v1H4V6zm2 1h2v1H6V7zm-2 1h2v1H4V8zm2 1h2v1H6V9v5H4v-5z"/></svg>`,
  fileCode: `<svg viewBox="0 0 16 16"><path fill="#68217a" d="M2 0v16h12V4l-4-4H2zm8 4V1.4l2.6 2.6H10zM4 5.5l2 2-2 2v-4zm8 0l-2 2 2 2v-4zM7.5 4h1l-2 7h-1l2-7z"/></svg>`,
  fileImage: `<svg viewBox="0 0 16 16"><path fill="#107c41" d="M1 1v14h14V1H1zm13 13H2V2h12v12zm-3-8a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zM3 12l3-5 2 3 3-5 3 7H3z"/></svg>`,
  filePdf: `<svg viewBox="0 0 16 16"><path fill="#ff4d4d" d="M2 0v16h12V4l-4-4H2zm8 4V1.4l2.6 2.6H10zM4 6h5v1H4V6zm0 2h8v1H4V8zm0 2h8v1H4v-1z"/></svg>`
};

// ==========================================
// Initialization & Navigation Loading
// ==========================================

window.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  
  // Theme Setup (Check system theme or save preferences if any)
  document.body.className = 'dark-theme';

  // Load Sidebar Content
  await loadSidebar();

  // Load Home Path as start
  const homePath = await window.electronAPI.getHomePath();
  await loadPath(homePath);
});

// Load Sidebar shortcuts & system drives
async function loadSidebar() {
  try {
    // Populate Quick Access list
    const quickAccess = await window.electronAPI.getQuickAccess();
    quickAccessList.innerHTML = '';
    quickAccess.forEach(item => {
      const li = document.createElement('li');
      li.className = 'sidebar-item';
      li.dataset.path = item.path;
      li.innerHTML = `
        <div class="sidebar-icon">${ICONS[item.icon] || ICONS.folder}</div>
        <span>${item.name}</span>
      `;
      li.addEventListener('click', () => loadPath(item.path));
      quickAccessList.appendChild(li);
    });

    // Populate Drives list
    const drives = await window.electronAPI.getSystemDrives();
    drivesList.innerHTML = '';
    drives.forEach(drive => {
      const li = document.createElement('li');
      li.className = 'sidebar-item';
      li.dataset.path = drive.path;
      li.innerHTML = `
        <div class="sidebar-icon">${ICONS.drive}</div>
        <span>${drive.name}</span>
      `;
      li.addEventListener('click', () => loadPath(drive.path));
      drivesList.appendChild(li);
    });
  } catch (error) {
    console.error("Failed to load sidebar folders/drives:", error);
  }
}

// Navigate to a specific path
async function loadPath(targetPath, addToHistory = true) {
  // Clear selection
  selectedFiles.clear();
  updateStatusBar();

  // Hide context menus
  hideContextMenus();

  // Call main process to scan target directory
  const result = await window.electronAPI.explorePath(targetPath);

  if (result.error) {
    // Show error screen
    statusOverlay.classList.remove('hidden');
    statusMessage.textContent = `Error accessing directory:\n${result.error}`;
    filesList.innerHTML = '';
    itemCountText.textContent = '0 items';
    
    // Fallback path details in input
    addressInput.value = targetPath;
    currentPath = targetPath;
    return;
  }

  statusOverlay.classList.add('hidden');
  currentPath = result.currentPath;
  addressInput.value = currentPath;
  currentFiles = result.files;

  // Track navigation history
  if (addToHistory) {
    // If we were in the middle of history and navigate, slice off the forward history
    if (historyIndex < history.length - 1) {
      history = history.slice(0, historyIndex + 1);
    }
    history.push(currentPath);
    historyIndex = history.length - 1;
  }

  // Update navbar button states
  updateNavButtons();

  // Update active sidebar item highlighting
  updateSidebarSelection();

  // Sort and Render
  sortFiles();
  renderFiles();
}

// Highlight sidebar items when current path matches
function updateSidebarSelection() {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    if (item.dataset.path === currentPath) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Enable/Disable Back, Forward, Up buttons based on history
function updateNavButtons() {
  backBtn.disabled = historyIndex <= 0;
  forwardBtn.disabled = historyIndex >= history.length - 1;
  
  // Up button goes to parent path. In Windows, root has parent == root
  // We check if current path is root.
  const isWindowsRoot = /^[A-Z]:\\$/i.test(currentPath);
  const isUnixRoot = currentPath === '/';
  
  upBtn.disabled = isWindowsRoot || isUnixRoot;
}

// ==========================================
// File Sorting & Rendering
// ==========================================

function sortFiles() {
  currentFiles.sort((a, b) => {
    // Always keep directories first
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    let valA = a[sortColumn];
    let valB = b[sortColumn];

    // Case insensitive sorting for strings
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (sortColumn === 'size') {
      // Directories have size = ""
      const sizeA = a.isDirectory ? -1 : (Number(a.size) || 0);
      const sizeB = b.isDirectory ? -1 : (Number(b.size) || 0);
      return sortAscending ? sizeA - sizeB : sizeB - sizeA;
    }

    if (valA < valB) return sortAscending ? -1 : 1;
    if (valA > valB) return sortAscending ? 1 : -1;
    return 0;
  });
}

function renderFiles() {
  filesList.innerHTML = '';
  
  if (currentFiles.length === 0) {
    statusOverlay.classList.remove('hidden');
    statusMessage.textContent = 'This folder is empty.';
    itemCountText.textContent = '0 items';
    return;
  }

  statusOverlay.classList.add('hidden');
  itemCountText.textContent = `${currentFiles.length} items`;

  currentFiles.forEach(file => {
    const row = document.createElement('div');
    row.className = 'file-row';
    row.dataset.path = file.path;
    if (selectedFiles.has(file.path)) {
      row.classList.add('selected');
    }

    // Determine specific Icon matching file category/type
    let iconHTML = ICONS.fileDefault;
    if (file.isDirectory) {
      iconHTML = ICONS.folder;
    } else {
      const typeLower = file.type.toLowerCase();
      if (typeLower.includes('text')) {
        iconHTML = ICONS.fileText;
      } else if (typeLower.includes('application') || typeLower.includes('executable')) {
        iconHTML = ICONS.fileExe;
      } else if (typeLower.includes('archive') || typeLower.includes('compressed')) {
        iconHTML = ICONS.fileZip;
      } else if (typeLower.includes('image')) {
        iconHTML = ICONS.fileImage;
      } else if (typeLower.includes('pdf')) {
        iconHTML = ICONS.filePdf;
      } else if (typeLower.includes('code') || typeLower.includes('web') || typeLower.includes('source')) {
        iconHTML = ICONS.fileCode;
      }
    }

    // Human readable size format
    const displaySize = file.isDirectory ? '' : formatBytes(file.size);

    row.innerHTML = `
      <div class="file-col col-name">
        <div class="file-item-icon">${iconHTML}</div>
        <span class="file-item-name">${file.name}</span>
      </div>
      <div class="file-col col-modified file-item-meta">${file.modified}</div>
      <div class="file-col col-type file-item-meta">${file.type}</div>
      <div class="file-col col-size file-item-meta">${displaySize}</div>
    `;

    // Single Click: Select item
    row.addEventListener('click', (e) => {
      e.stopPropagation();
      handleRowClick(file.path, e.ctrlKey);
    });

    // Double Click: Open folder (navigate) or open file (native OS)
    row.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openItem(file);
    });

    // Right Click: Context Menu on specific item
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleRowRightClick(file, e.clientX, e.clientY);
    });

    filesList.appendChild(row);
  });
}

function handleRowClick(path, isCtrlPressed) {
  if (isCtrlPressed) {
    // Multi-select toggle
    if (selectedFiles.has(path)) {
      selectedFiles.delete(path);
    } else {
      selectedFiles.add(path);
    }
  } else {
    // Single select
    selectedFiles.clear();
    selectedFiles.add(path);
  }

  // Update visual selection
  document.querySelectorAll('.file-row').forEach(row => {
    if (selectedFiles.has(row.dataset.path)) {
      row.classList.add('selected');
    } else {
      row.classList.remove('selected');
    }
  });

  updateStatusBar();
}

// Navigates folder or triggers shell open for files
async function openItem(file) {
  if (file.isDirectory) {
    await loadPath(file.path);
  } else {
    // If it's a file, invoke opening in standard OS shell
    const openRes = await window.electronAPI.openInShell(file.path);
    if (openRes && openRes.error) {
      alert(`Could not open file: ${openRes.error}`);
    }
  }
}

// ==========================================
// Custom Context Menu Operations (Win10)
// ==========================================

function handleRowRightClick(file, x, y) {
  // If the right-clicked row is not already part of selected list, make it the single selection
  if (!selectedFiles.has(file.path)) {
    selectedFiles.clear();
    selectedFiles.add(file.path);
    
    document.querySelectorAll('.file-row').forEach(row => {
      if (row.dataset.path === file.path) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    });
    updateStatusBar();
  }

  // Hide the alternative context menu
  bgContextMenu.classList.add('hidden');

  // Configure context menu items based on the file selected
  const openMenuBtn = document.getElementById('item-menu-open');
  const openShellMenuBtn = document.getElementById('item-menu-open-shell');
  const propertiesMenuBtn = document.getElementById('item-menu-properties');

  // Remove existing listeners to prevent duplicates
  const newOpenBtn = openMenuBtn.cloneNode(true);
  const newOpenShellBtn = openShellMenuBtn.cloneNode(true);
  const newPropBtn = propertiesMenuBtn.cloneNode(true);

  openMenuBtn.parentNode.replaceChild(newOpenBtn, openMenuBtn);
  openShellMenuBtn.parentNode.replaceChild(newOpenShellBtn, openShellMenuBtn);
  propertiesMenuBtn.parentNode.replaceChild(newPropBtn, propertiesMenuBtn);

  // Re-bind click handlers with current file properties
  newOpenBtn.addEventListener('click', () => {
    hideContextMenus();
    openItem(file);
  });

  newOpenShellBtn.addEventListener('click', async () => {
    hideContextMenus();
    await window.electronAPI.openInShell(file.path);
  });

  newPropBtn.addEventListener('click', () => {
    hideContextMenus();
    showProperties(file);
  });

  // Display menu
  positionMenu(itemContextMenu, x, y);
}

function handleBackgroundRightClick(x, y) {
  // Clear selection if right-clicking background (just like Windows Explorer)
  selectedFiles.clear();
  document.querySelectorAll('.file-row').forEach(row => row.classList.remove('selected'));
  updateStatusBar();

  // Hide the item context menu
  itemContextMenu.classList.add('hidden');

  // Display background context menu
  positionMenu(bgContextMenu, x, y);
}

function positionMenu(menuElement, x, y) {
  menuElement.classList.remove('hidden');

  const menuWidth = menuElement.offsetWidth || 190;
  const menuHeight = menuElement.offsetHeight || 250;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Prevent menu overflow on right side
  let posX = x;
  if (x + menuWidth > windowWidth) {
    posX = windowWidth - menuWidth - 4;
  }

  // Prevent menu overflow on bottom side
  let posY = y;
  if (y + menuHeight > windowHeight) {
    posY = windowHeight - menuHeight - 4;
  }

  menuElement.style.left = `${posX}px`;
  menuElement.style.top = `${posY}px`;
}

function hideContextMenus() {
  bgContextMenu.classList.add('hidden');
  itemContextMenu.classList.add('hidden');
}

// ==========================================
// Windows Properties Dialog Implementation
// ==========================================

function showProperties(file) {
  propNameInput.value = file.name;
  propType.textContent = file.type;
  propLocation.textContent = file.path;
  
  // Format sizes for dialog nicely
  if (file.isDirectory) {
    propSize.textContent = "Calculating...";
    // Asynchronous calculation mock or fast details
    propSize.textContent = "Folder size properties";
  } else {
    propSize.textContent = `${formatBytes(file.size)} (${file.size.toLocaleString()} bytes)`;
  }

  propModified.textContent = file.modified;
  // Fallback for created date since it's stat dependent (we use modified or placeholder)
  propCreated.textContent = file.modified;

  // Load correct SVG icon in dialog general tab
  let iconHTML = ICONS.fileDefault;
  if (file.isDirectory) {
    iconHTML = ICONS.folder;
  } else {
    const typeLower = file.type.toLowerCase();
    if (typeLower.includes('text')) iconHTML = ICONS.fileText;
    else if (typeLower.includes('application') || typeLower.includes('executable')) iconHTML = ICONS.fileExe;
    else if (typeLower.includes('archive') || typeLower.includes('compressed')) iconHTML = ICONS.fileZip;
    else if (typeLower.includes('image')) iconHTML = ICONS.fileImage;
    else if (typeLower.includes('pdf')) iconHTML = ICONS.filePdf;
    else if (typeLower.includes('code') || typeLower.includes('web') || typeLower.includes('source')) iconHTML = ICONS.fileCode;
  }
  propIcon.innerHTML = iconHTML;

  // Set the properties window title
  document.getElementById('prop-dialog-title').textContent = `${file.name} Properties`;

  propertiesDialog.classList.remove('hidden');
}

function hideProperties() {
  propertiesDialog.classList.add('hidden');
}

// ==========================================
// Event Listeners Configuration
// ==========================================

function setupEventListeners() {
  
  // Window click to dismiss context menus
  document.addEventListener('click', () => {
    hideContextMenus();
  });

  // Background context menu handler
  filesContainer.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    handleBackgroundRightClick(e.clientX, e.clientY);
  });

  // Theme Switcher Toggle
  themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('dark-theme')) {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    }
  });

  // Navigation: Back button
  backBtn.addEventListener('click', () => {
    if (historyIndex > 0) {
      historyIndex--;
      loadPath(history[historyIndex], false);
    }
  });

  // Navigation: Forward button
  forwardBtn.addEventListener('click', () => {
    if (historyIndex < history.length - 1) {
      historyIndex++;
      loadPath(history[historyIndex], false);
    }
  });

  // Navigation: Up button
  upBtn.addEventListener('click', () => {
    const parentDir = getParentDirectory(currentPath);
    if (parentDir && parentDir !== currentPath) {
      loadPath(parentDir);
    }
  });

  // Navigation: Refresh button
  refreshBtn.addEventListener('click', () => {
    loadPath(currentPath, false);
  });

  // Context Menu Refresh button action
  document.getElementById('menu-refresh-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    hideContextMenus();
    loadPath(currentPath, false);
  });

  // Open Current Folder in Native Windows Explorer
  openNativeBtn.addEventListener('click', async () => {
    if (currentPath) {
      await window.electronAPI.openInShell(currentPath);
    }
  });

  // Address Input Handlers (Enter key navigates)
  addressInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const inputPath = addressInput.value.trim();
      if (inputPath) {
        loadPath(inputPath);
      }
    }
  });

  goBtn.addEventListener('click', () => {
    const inputPath = addressInput.value.trim();
    if (inputPath) {
      loadPath(inputPath);
    }
  });

  // Table Column Headers: Handle custom sorting
  document.querySelectorAll('.header-col').forEach(headerCol => {
    headerCol.addEventListener('click', () => {
      const column = headerCol.dataset.sort;
      if (sortColumn === column) {
        // Toggle direction
        sortAscending = !sortAscending;
      } else {
        sortColumn = column;
        sortAscending = true;
      }
      
      // Update visual arrow icons
      updateSortIndicators();
      
      // Re-sort and render
      sortFiles();
      renderFiles();
    });
  });

  // Context Menu Sorting & Submenus Trigger (Mock actions)
  document.querySelectorAll('#bg-context-menu [data-action]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const action = item.dataset.action;
      
      if (action.startsWith('sort-')) {
        const criteria = action.replace('sort-', '');
        if (criteria === 'asc') {
          sortAscending = true;
        } else if (criteria === 'desc') {
          sortAscending = false;
        } else {
          sortColumn = criteria;
        }
        
        // Update checkmarks in UI
        updateSortSubmenuUI();
        sortFiles();
        renderFiles();
      } else if (action === 'new-folder') {
        alert("Mock action: 'New Folder' would create a directory in this workspace.");
      } else if (action === 'new-text') {
        alert("Mock action: 'New Text Document' would create a new .txt file in this workspace.");
      }
      
      hideContextMenus();
    });
  });

  // Properties Dialog Close Handlers
  document.getElementById('close-prop-btn').addEventListener('click', hideProperties);
  document.getElementById('prop-ok-btn').addEventListener('click', hideProperties);
  document.getElementById('prop-cancel-btn').addEventListener('click', hideProperties);
  propertiesDialog.addEventListener('click', (e) => {
    if (e.target === propertiesDialog) hideProperties();
  });
}

// ==========================================
// Helper Utility Functions
// ==========================================

// Parse parent folder correctly for both Unix and Windows styles
function getParentDirectory(dirPath) {
  if (!dirPath) return '';
  
  // Check if it's Windows root (e.g. C:\)
  if (/^[A-Z]:\\$/i.test(dirPath)) {
    return dirPath;
  }
  
  // Match path segments
  const separator = dirPath.includes('\\') ? '\\' : '/';
  const parts = dirPath.split(separator);
  
  // Remove last segment
  if (parts.length > 1) {
    if (parts[parts.length - 1] === '') {
      parts.pop(); // Trailing slash case
    }
    parts.pop();
    
    let parent = parts.join(separator);
    
    // Windows drive parent check
    if (parent.endsWith(':')) {
      parent += separator;
    }
    
    // Root folder fallbacks
    if (!parent) {
      parent = separator;
    }
    return parent;
  }
  return dirPath;
}

// Render arrow indicator in active sorted table column header
function updateSortIndicators() {
  document.querySelectorAll('.header-col').forEach(headerCol => {
    const indicator = headerCol.querySelector('.sort-indicator');
    if (headerCol.dataset.sort === sortColumn) {
      indicator.textContent = sortAscending ? ' ▲' : ' ▼';
    } else {
      indicator.textContent = '';
    }
  });
}

// Sync active sorting classes in Background Context Menu submenus
function updateSortSubmenuUI() {
  document.querySelectorAll('#bg-context-menu [data-action^="sort-"]').forEach(item => {
    const action = item.dataset.action;
    const criteria = action.replace('sort-', '');
    
    let isActive = false;
    if (criteria === 'asc') {
      isActive = sortAscending;
    } else if (criteria === 'desc') {
      isActive = !sortAscending;
    } else {
      isActive = (sortColumn === criteria);
    }
    
    if (isActive) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  updateSortIndicators();
}

function updateStatusBar() {
  selectedCountText.textContent = `${selectedFiles.size} items selected`;
}

// Convert bytes count to human-friendly sizes
function formatBytes(bytes, decimals = 1) {
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
