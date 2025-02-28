import {
  passwordError,
  passwordError2,
  noFilesSelected,
  alert,
  determineErrorReason,
  showCombinedResults,
  toggleSounds
} from "./notify.js";

const filesList = [];

// DOM elements
const browseFilesBtn = document.querySelector("#file-picker");
const selectedFiles = document.querySelector("#selected-files");
const dropArea = document.querySelector("#main");
const clearBtn = document.querySelector("#clear-btn");
const passwordInput = document.querySelector("#password-input");
const passwordInput2 = document.querySelector("#password-input-2");
const encryptBtn = document.querySelector("#encrypt-btn");
const decryptBtn = document.querySelector("#decrypt-btn");
const togglePasswordBtn = document.querySelector("#toggle-password");
const soundToggle = document.querySelector("#soundToggle");
const deleteToggle = document.querySelector("#deleteCheckbox");

// Simple path utility
const path = {
  basename: (path) => path.split(/[\\/]/).pop()
};

// FILE SELECTION HANDLING
function initFileSelectionHandlers() {
  browseFilesBtn.addEventListener("change", getFiles);
  browseFilesBtn.addEventListener("click", e => {
    e.target.value = null; // Reset input
  });

  // Drag and drop handlers
  dropArea.addEventListener("dragover", e => e.preventDefault());
  dropArea.addEventListener("dragenter", () =>
    toggleOverlay(true, "dropper", "Drop file(s) here")
  );

  dropArea.addEventListener("dragleave", e => {
    if (!e.relatedTarget || (e.relatedTarget !== dropArea && !dropArea.contains(e.relatedTarget))) {
      toggleOverlay(false);
    }
  });

  dropArea.addEventListener("drop", e => {
    e.preventDefault();
    toggleOverlay(false);
    handleFiles(e.dataTransfer.files);
  });

  clearBtn.addEventListener("click", clearFileList);
}

function handleFiles(files) {
  for (const file of files) {
    if (!filesList.includes(file.path)) {
      selectedFiles.innerHTML += `
      <li>
        <span>${file.name}</span>
      </li>
      `;
      filesList.push(file.path);
    }
  }
  clearBtn.disabled = filesList.length === 0;
}

function getFiles(e) {
  handleFiles(e.target.files);
}

function clearFileList() {
  filesList.length = 0;
  selectedFiles.innerHTML = "";
  passwordInput.value = "";
  passwordInput2.value = "";
  clearBtn.disabled = true;
}

// PASSWORD HANDLING
function initPasswordHandlers() {
  togglePasswordBtn.addEventListener("click", togglePassword);
}

function togglePassword() {
  const isPasswordVisible = passwordInput.type !== "password";

  passwordInput.type = isPasswordVisible ? "password" : "text";
  togglePasswordBtn.innerHTML = isPasswordVisible
    ? '<span class="icon solid fa-eye"></span>'
    : '<span class="icon solid fa-eye-slash"></span>';
  passwordInput2.style.display = isPasswordVisible ? 'flex' : 'none';
}

function validateInputs() {
  if (filesList.length === 0) {
    noFilesSelected();
    return false;
  }

  const password = passwordInput.value;
  const password2 = passwordInput2.value;

  if (password.length === 0) {
    passwordError();
    return false;
  }

  if (passwordInput2.style.display !== 'none' && (password2.length === 0 || password !== password2)) {
    password2.length === 0 ? passwordError2() : alert("error", 'Passwords do not match.');
    return false;
  }

  return true;
}

// ENCRYPTION/DECRYPTION HANDLERS
function initCryptoHandlers() {
  encryptBtn.addEventListener('click', () => clickHandler('encrypt-file'));
  decryptBtn.addEventListener('click', () => clickHandler('decrypt-file'));
}

async function clickHandler(ipcEventName) {
  if (!validateInputs()) return;

  const password = passwordInput.value;
  const isEncryption = ipcEventName === 'encrypt-file';

  try {
    toggleOverlay(true, "loader", isEncryption ? "Encrypting..." : "Decrypting...");

    // Process all files in parallel
    const filePromises = filesList.map(async (filePath) => {
      try {
        const result = await ipcExposed.invoke(ipcEventName, {
          fileLocation: filePath,
          password
        });

        return {
          name: path.basename(filePath),
          success: true,
          path: filePath,
          newPath: result.newFileLocation
        };
      } catch (error) {
        return {
          name: path.basename(filePath),
          success: false,
          path: filePath,
          error: {
            message: error.message,
            reason: determineErrorReason(error.message)
          }
        };
      }
    });

    const processedFiles = await Promise.all(filePromises);

    // Organize results for notification
    const results = {
      success: processedFiles.filter(f => f.success).map(f => f.name),
      failure: processedFiles.filter(f => !f.success).map(f => ({
        name: f.name,
        reason: f.error.reason
      }))
    };

    await showCombinedResults(results, ipcEventName);

    // Keep only failed files in the list
    updateFileList(processedFiles.filter(file => !file.success).map(file => file.path));
  } catch (error) {
    await alert("error", `An unexpected error occurred: ${error.message}`);
  } finally {
    passwordInput.value = "";
    passwordInput2.value = "";
    toggleOverlay(false);
  }
}

function updateFileList(remainingFiles) {
  if (remainingFiles.length === 0) {
    clearFileList();
    return;
  }

  filesList.length = 0;
  filesList.push(...remainingFiles);

  // Update UI with remaining files
  selectedFiles.innerHTML = "";
  for (const filePath of filesList) {
    selectedFiles.innerHTML += `
    <li>
      <span>${path.basename(filePath)}</span>
    </li>
    `;
  }

  clearBtn.disabled = false;
}

// UI OVERLAY MANAGEMENT
function toggleOverlay(show, icon, message) {
  const overlay = document.getElementById("overlay");
  const spinner = document.getElementById("spinner");
  const text = document.getElementById("loadingText");

  if (show) {
    spinner.className = icon;
    text.innerHTML = message;
    overlay.style.display = "flex";
  } else {
    overlay.style.display = "none";
  }
}

// MENU HANDLERS
function initMenuLinks() {
  const aboutLink = document.getElementById('aboutLink');
  const licenseLink = document.getElementById('licenseLink');

  aboutLink.addEventListener('click', () => openModalWindow('about'));
  licenseLink.addEventListener('click', () => openModalWindow('license'));

  // Initialize sound toggle
  soundToggle.addEventListener('change', () => {
    toggleSounds(soundToggle.checked);
    localStorage.setItem('soundsEnabled', soundToggle.checked);
  });

  // Load sound preference from localStorage
  const savedSoundPreference = localStorage.getItem('soundsEnabled');
  if (savedSoundPreference !== null) {
    const isEnabled = savedSoundPreference === 'true';
    soundToggle.checked = isEnabled;
    toggleSounds(isEnabled);
  }

  // Initialize delete toggle
  deleteToggle.addEventListener('change', () => {
    ipcExposed.send('toggle-delete', deleteToggle.checked);
    localStorage.setItem('deleteEnabled', deleteToggle.checked);
  });

  // Load delete preference from localStorage
  const savedDeletePreference = localStorage.getItem('deleteEnabled');
  if (savedDeletePreference !== null) {
    const isEnabled = savedDeletePreference === 'true';
    deleteToggle.checked = isEnabled;
    ipcExposed.send('toggle-delete', isEnabled);
  }
}

function openModalWindow(type) {
  ipcExposed.send('modalWindow', type);
}

// Initialize all handlers
function init() {
  initFileSelectionHandlers();
  initPasswordHandlers();
  initCryptoHandlers();
  initMenuLinks();
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', init);
