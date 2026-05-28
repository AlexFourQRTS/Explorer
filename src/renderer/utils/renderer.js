//render.js



// State Variables
let currentPath = '';
let history = [];
let historyIndex = -1;
let currentFiles = [];
let selectedFiles = new Set(); // Stores path strings of selected files
let sortColumn = 'name';
let sortAscending = true;

import ICONS from '../../constant/ICONS.js';

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


window.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();

  document.body.className = 'dark-theme';

  await loadSidebar();

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

  updateNavButtons();

  updateSidebarSelection();

  sortFiles();
  renderFiles();
}


function updateSidebarSelection() {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    if (item.dataset.path === currentPath) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

function updateNavButtons() {
  backBtn.disabled = historyIndex <= 0;
  forwardBtn.disabled = historyIndex >= history.length - 1;


  const isWindowsRoot = /^[A-Z]:\\$/i.test(currentPath);
  const isUnixRoot = currentPath === '/';

  upBtn.disabled = isWindowsRoot || isUnixRoot;
}

function sortFiles() {
  currentFiles.sort((a, b) => {
    // Always keep directories first
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    let valA = a[sortColumn];

    let valB = b[sortColumn];


    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (sortColumn === 'size') {

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

    if (selectedFiles.has(file.path)) row.classList.add('selected');

    let iconHTML = ICONS.fileDefault;

    if (file.isDirectory) {
      iconHTML = ICONS.folder;
    } else {
      const typeLower = file.type.toLowerCase();


      if (typeLower.includes('text')) iconHTML = ICONS.fileText;

      if (typeLower.includes('application') || typeLower.includes('executable')) {
        iconHTML = ICONS.fileExe;
      }

      if (typeLower.includes('archive') || typeLower.includes('compressed')) {
        iconHTML = ICONS.fileZip;
      }

      if (typeLower.includes('image')) iconHTML = ICONS.fileImage;


      if (typeLower.includes('pdf')) iconHTML = ICONS.filePdf;


      if (typeLower.includes('code') || typeLower.includes('web') || typeLower.includes('source')) {
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

    row.addEventListener('click', (e) => {
      e.stopPropagation();
      handleRowClick(file.path, e.ctrlKey);
    });

    row.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openItem(file);
    });


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

    if (selectedFiles.has(path)) {
      selectedFiles.delete(path);
    } else {
      selectedFiles.add(path);
    }
  } else {
    selectedFiles.clear();
    selectedFiles.add(path);
  }

  document.querySelectorAll('.file-row').forEach(row => {
    if (selectedFiles.has(row.dataset.path)) {
      row.classList.add('selected');
    } else {
      row.classList.remove('selected');
    }
  });

  updateStatusBar();
}


async function openItem(file) {
  if (file.isDirectory) {
    await loadPath(file.path);
  } else {

    const openRes = await window.electronAPI.openInShell(file.path);
    if (openRes && openRes.error) {
      alert(`Could not open file: ${openRes.error}`);
    }
  }
}

function handleRowRightClick(file, x, y) {
  n
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

  bgContextMenu.classList.add('hidden');

  const openMenuBtn = document.getElementById('item-menu-open');
  const openShellMenuBtn = document.getElementById('item-menu-open-shell');
  const propertiesMenuBtn = document.getElementById('item-menu-properties');

  const newOpenBtn = openMenuBtn.cloneNode(true);
  const newOpenShellBtn = openShellMenuBtn.cloneNode(true);
  const newPropBtn = propertiesMenuBtn.cloneNode(true);

  openMenuBtn.parentNode.replaceChild(newOpenBtn, openMenuBtn);
  openShellMenuBtn.parentNode.replaceChild(newOpenShellBtn, openShellMenuBtn);
  propertiesMenuBtn.parentNode.replaceChild(newPropBtn, propertiesMenuBtn);

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

  positionMenu(itemContextMenu, x, y);
}

function handleBackgroundRightClick(x, y) {

  selectedFiles.clear();

  document.querySelectorAll('.file-row').forEach(row => row.classList.remove('selected'));

  updateStatusBar();

  itemContextMenu.classList.add('hidden');

  positionMenu(bgContextMenu, x, y);
}

function positionMenu(menuElement, x, y) {
  menuElement.classList.remove('hidden');

  const menuWidth = menuElement.offsetWidth || 190;
  const menuHeight = menuElement.offsetHeight || 250;
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;


  let posX = x;
  if (x + menuWidth > windowWidth) posX = windowWidth - menuWidth - 4;

  let posY = y;
  if (y + menuHeight > windowHeight) posY = windowHeight - menuHeight - 4;

  menuElement.style.left = `${posX}px`;
  menuElement.style.top = `${posY}px`;
}

function hideContextMenus() {
  bgContextMenu.classList.add('hidden');
  itemContextMenu.classList.add('hidden');
}

function showProperties(file) {
  propNameInput.value = file.name;
  propType.textContent = file.type;
  propLocation.textContent = file.path;

  if (file.isDirectory) {
    propSize.textContent = "Calculating...";
    propSize.textContent = "Folder size properties";
  } else {
    propSize.textContent = `${formatBytes(file.size)} (${file.size.toLocaleString()} bytes)`;
  }

  propModified.textContent = file.modified;

  propCreated.textContent = file.modified;

  let iconHTML = ICONS.fileDefault;
  if (file.isDirectory) {
    iconHTML = ICONS.folder;
  } else {
    const typeLower = file.type.toLowerCase();

    if (typeLower.includes('text')) iconHTML = ICONS.fileText;
    if (typeLower.includes('application') || typeLower.includes('executable')) iconHTML = ICONS.fileExe;
    if (typeLower.includes('archive') || typeLower.includes('compressed')) iconHTML = ICONS.fileZip;
    if (typeLower.includes('image')) iconHTML = ICONS.fileImage;
    if (typeLower.includes('pdf')) iconHTML = ICONS.filePdf;
    if (typeLower.includes('code') || typeLower.includes('web') || typeLower.includes('source')) iconHTML = ICONS.fileCode;

  }
  propIcon.innerHTML = iconHTML;

  document.getElementById('prop-dialog-title').textContent = `${file.name} Properties`;

  propertiesDialog.classList.remove('hidden');
}

function hideProperties() {
  propertiesDialog.classList.add('hidden');
}

function setupEventListeners() {

  document.addEventListener('click', () => hideContextMenus())

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
    }

    if (document.body.classList.contains('light-theme')) {
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


  refreshBtn.addEventListener('click', () => {
    loadPath(currentPath, false);
  });

  document.getElementById('menu-refresh-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    hideContextMenus();
    loadPath(currentPath, false);
  });


  openNativeBtn.addEventListener('click', async () => {
    if (currentPath) await window.electronAPI.openInShell(currentPath);

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
        }
        if (criteria === 'desc') {
          sortAscending = false;
        } else {
          sortColumn = criteria;
        }

        // Update checkmarks in UI
        updateSortSubmenuUI();
        sortFiles();
        renderFiles();
      }

      if (action === 'new-folder') {
        alert("Mock action: 'New Folder' would create a directory in this workspace.");
      }

      if (action === 'new-text') {
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

function getParentDirectory(dirPath) {
  if (!dirPath) return '';

  if (/^[A-Z]:\\$/i.test(dirPath)) return dirPath;

  const separator = dirPath.includes('\\') ? '\\' : '/';
  const parts = dirPath.split(separator);


  if (parts.length > 1) {
    if (parts[parts.length - 1] === '') parts.pop();

    parts.pop();

    let parent = parts.join(separator);

    if (parent.endsWith(':')) parent += separator;

    if (!parent) parent = separator;
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



const selectedCountText = document.getElementById('selected-count');

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
