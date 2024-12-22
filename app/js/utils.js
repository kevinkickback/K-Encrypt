// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ IMPORTS & DECLARATIONS                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

import { encryptionDone, decryptionDone, passwordError, passwordError2, noFilesSelected, alertError } from "./encryption/notify.js";
export const filesList = [];
const browseFilesBtn = document.querySelector("#file-picker");
const selectedFiles = document.querySelector("#selected-files");
const dropArea = document.querySelector("#main");
const clearBtn = document.querySelector("#clear-btn");
const passwordInput = document.querySelector("#password-input");
const passwordInput2 = document.querySelector("#password-input-2");
const encryptBtn = document.querySelector("#encrypt-btn");
const decryptBtn = document.querySelector("#decrypt-btn");
const togglePasswordBtn = document.querySelector("#toggle-password");

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ SELECT FILES                                                                         ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

// Add event listeners to browse button and drag n' drop
browseFilesBtn.addEventListener("change", (e) => getFiles(e));

// Reset input's value to ensure the same file can be reselected
browseFilesBtn.addEventListener("click", (e) => {
  e.target.value = null;
});

// Disable default drag element behavior
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
});

// Enable overlay on drag enter
dropArea.addEventListener("dragenter", () => {
  toggleOverlay(true, "dropper", "Drop file(s) here");
});

// Disable overlay on drag leave
dropArea.addEventListener("dragleave", (e) => {
  if (!e.relatedTarget || (e.relatedTarget !== dropArea && !dropArea.contains(e.relatedTarget))) {
    toggleOverlay(false);
  }
});

// Disable overlay on drop and add files to list
dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  toggleOverlay(false);
  handleFiles(e.dataTransfer.files);
});


// Handle files from either method (browse or drag)
function handleFiles(files) {
  for (const file of files) {
    if (!filesList.includes(file.path)) {
      const element = `
      <li>
      <span>${file.name}</span>
      </li>
    `;
      selectedFiles.innerHTML += element;
      filesList.push(file.path);
    }
  }
  clearBtn.disabled = filesList.length === 0;
}

function getFiles(e) {
  handleFiles(e.target.files);
}


// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ CLEAR SELECTED FILES                                                                 ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

clearBtn.addEventListener("click", () => {
  filesList.length = 0;
  selectedFiles.innerHTML = "";
  passwordInput.value = "";
  passwordInput2.value = "";
  clearBtn.disabled = true;
});


// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ PASSWORD TOGGLE BUTTON                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

togglePasswordBtn.addEventListener("click", togglePassword);

function togglePassword() {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePasswordBtn.innerHTML = '<span class="icon solid fa-eye-slash"></span>';
    passwordInput2.style.display = 'none';
  } else {
    passwordInput.type = "password";
    togglePasswordBtn.innerHTML = '<span class="icon solid fa-eye"></span>';
    passwordInput2.style.display = 'flex';
  }
}


// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ EN/DECREYPT CLICK HANDELERS                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

encryptBtn.addEventListener('click', () => {
  clickHandler('encrypt-file');
});

decryptBtn.addEventListener('click', () => {
  clickHandler('decrypt-file');
});

async function clickHandler(ipcEventName) {
  const password = passwordInput.value;
  const password2 = passwordInput2.value;

  if (filesList.length === 0) {
    noFilesSelected();
    return;
  } if (password.length === 0) {
    passwordError();
    return;
  } if (passwordInput2.style.display !== 'none' && password2.length === 0) {
    passwordError2();
    return;
  } if (passwordInput2.style.display !== 'none' && password !== password2) {
    alertError('Passwords do not match.');
    return;
  }

  try {
    if (ipcEventName === 'encrypt-file') {
      toggleOverlay(true, "loader", "Encrypting...");
    } else if (ipcEventName === 'decrypt-file') {
      toggleOverlay(true, "loader", "Decrypting...");
    }

    await Promise.all(
      filesList.map(async (fileLocation) => {
        const result = await ipcExposed.invoke(ipcEventName, { fileLocation, password });
        const newFileLocation = result.newFileLocation;
        filesList[filesList.indexOf(fileLocation)] = newFileLocation;
        if (ipcEventName === 'encrypt-file') {
          encryptionDone();
        } else if (ipcEventName === 'decrypt-file') {
          decryptionDone();
        }
      })
    )
  } catch (error) {
    if (error.message.includes('not_enc')) {
      alertError('File(s) are not encrypted!');
    } else if (error.message.includes('already_enc')) {
      alertError('File(s) already encrypted!');
    } else {
      alertError('Wrong Password!');
    }
  } finally {
    toggleOverlay(false);
  }
}


// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ TOGGLE OVERLAY                                                                       ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

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

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ MENU LINKS                                                                           ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

const aboutLink = document.getElementById('aboutLink');
const licenseLink = document.getElementById('licenseLink');

aboutLink.addEventListener('click', (event) => {
  const checkbox = document.querySelector('input[type="checkbox"]');
  if (checkbox) {
    checkbox.checked = false;
  }

  setTimeout(() => {
    ipcExposed.send('modalWindow', 'about', 'off');
  }, 200);
});

licenseLink.addEventListener('click', (event) => {
  const checkbox = document.querySelector('input[type="checkbox"]');
  if (checkbox) {
    checkbox.checked = false;
  }

  setTimeout(() => {
    ipcExposed.send('modalWindow', 'license', 'off');
  }, 200);
});
