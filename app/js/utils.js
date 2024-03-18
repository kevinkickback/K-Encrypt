// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ IMPORTS & DECLARATIONS                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

import { encryptionDone, decryptionDone, passwordError, passwordError2,  noFilesSelected, alertError } from "./encryption/notify.js";
export let filesList = [];
const browseFilesBtn = document.querySelector("#file-picker");
const selectedFiles = document.querySelector("#selected-files");
const dropArea = document.querySelector("#main");
const clearBtn = document.querySelector("#clear-btn");
const passwordInput = document.querySelector("#password-input");
const passwordInput2 = document.querySelector("#password-input-2");
const encryptBtn = document.querySelector("#encrypt-btn");
const decryptBtn = document.querySelector("#decrypt-btn");
const togglePasswordBtn = document.querySelector("#toggle-password");
// const capsLockWarning = document.getElementById('alert-box');



// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ SELECT FILES                                                                         ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

// Add event listeners to browse button and drag n' drop
browseFilesBtn.addEventListener("change", (e) => getFiles(e));
browseFilesBtn.addEventListener("click", (e) => (e.target.value = null));

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
  for (let file of files) {
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
  } else if (password.length === 0) {
    passwordError();
    return;
  } else if (passwordInput2.style.display !== 'none' && password2.length === 0) {
    passwordError2();
    return;
  } else if (passwordInput2.style.display !== 'none' && password !== password2) {
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
        const toast = document.querySelectorAll('.toastify');
        const result = await ipcExposed.invoke(ipcEventName, { fileLocation, password });
        const newFileLocation = result.newFileLocation;
        filesList[filesList.indexOf(fileLocation)] = newFileLocation;
        if (ipcEventName === 'encrypt-file') {
          encryptionDone();
          // Hide multiple toast notifications when processing multiple files
          if (toast.length > 1) {
          for (let i = 1; i < toast.length; i++) {
            toast[i].style.display = 'none';
            }
          }
        } else if (ipcEventName === 'decrypt-file') {
          decryptionDone();
          // Hide multiple toast notifications when processing multiple files
          if (toast.length > 1) {
            for (let i = 1; i < toast.length; i++) {
              toast[i].style.display = 'none';
              }
            }
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
// ║ DISABLE DRAGGING ELEMENTS                                                            ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

document.addEventListener('mousedown', (event) => {
  if (event.target.tagName !== 'INPUT' || event.target.type !== 'password') {
      event.preventDefault();
  }
});

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
  ipcExposed.send('modalWindow', 'about');
}, 200);
});

licenseLink.addEventListener('click', (event) => {
const checkbox = document.querySelector('input[type="checkbox"]');
if (checkbox) {
  checkbox.checked = false;
}

setTimeout(() => {
  ipcExposed.send('modalWindow', 'license');
}, 200);
});


// // ╔══════════════════════════════════════════════════════════════════════════════════════╗
// // ║ CAPSLOCK WARNING                                                                     ║
// // ╚══════════════════════════════════════════════════════════════════════════════════════╝

// document.addEventListener('keydown', (event) => {
//   const capsLockIsOn = event.getModifierState && event.getModifierState('CapsLock');
//   capsLockWarning.style.display = capsLockIsOn ? 'flex' : 'none';
//  });


// // ╔══════════════════════════════════════════════════════════════════════════════════════╗
// // ║ FILE VIEW TOGGLE                                                                     ║
// // ╚══════════════════════════════════════════════════════════════════════════════════════╝

// var singleBtn = document.getElementById("singleView");
// var doubleBtn = document.getElementById("doubleView");
// var elements = document.getElementsByClassName("column");
// var fileList = document.getElementById("selected-files");
// var i;

// // Single View
// function singleView() {
// singleBtn.style.backgroundColor = "#3d3d3d";
// singleBtn.style.borderBottom = "none";
// doubleBtn.style.backgroundColor = "#777777";
// doubleBtn.style.borderBottom = "1px solid #edf2f7";
// fileList.classList.remove("doubleColumn");
// for (i = 0; i < elements.length; i++) {
//   elements[i].style.width = "100%";
// }
// }

// // Double View
// function doubleView() {
// doubleBtn.style.backgroundColor = "#3d3d3d";
// doubleBtn.style.borderBottom = "none";
// singleBtn.style.backgroundColor = "#777777";
// singleBtn.style.borderBottom = "1px solid #edf2f7";
// fileList.classList.add("doubleColumn");
// for (i = 0; i < elements.length; i++) {
//   elements[i].style.width = "50%";
// }
// }