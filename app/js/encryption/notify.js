// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ IMPORTS & DECLARATIONS                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

import { filesList } from "../utils.js";
const selectFiles = document.querySelector("#selectFileBtn");
const passwordInput = document.querySelector("#password-input");
const passwordInput2 = document.querySelector("#password-input-2");
const togglePassword = document.querySelector("#toggle-password");
const selectedFiles = document.querySelector("#selected-files");
const clearAllBtn = document.querySelector("#clear-btn");
const successSfx = new Audio("./sfx/success.mp3");
const errorSfx = new Audio("./sfx/failure.mp3");

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ EN/DECRYPTION FINISHED                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

export function encryptionDone() {
	alertSuccess("File(s) encrypted successfully.");
	clearAllBtn.disabled = true;
	filesList.length = 0;
	selectedFiles.innerHTML = "";
	passwordInput.value = "";
	passwordInput2.value = "";
}

export function decryptionDone() {
	alertSuccess("File(s) decrypted successfully.");
	clearAllBtn.disabled = true;
	filesList.length = 0;
	selectedFiles.innerHTML = "";
	passwordInput.value = "";
	passwordInput2.value = "";
}

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ NO FILES SELECTED                                                                    ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

export function noFilesSelected() {
	errorSfx.play();
	selectFiles.classList.add("flash-file-select");
	setTimeout(() => {
		selectFiles.classList.remove("flash-file-select");
	}, 1000);
}

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ NO/WRONG PASSWORD                                                                    ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

export function passwordError() {
	errorSfx.play();
	passwordInput.classList.add("shake-password-box");
	togglePassword.classList.add("shake-password-box");
	setTimeout(() => {
		passwordInput.classList.remove("shake-password-box");
		togglePassword.classList.remove("shake-password-box");
	}, "500");
}

export function passwordError2() {
	errorSfx.play();
	passwordInput2.classList.add("shake-password-box");
	setTimeout(() => {
		passwordInput2.classList.remove("shake-password-box");
	}, "500");
}

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ ALERT FUNCTIONS                                                                      ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

export async function alertSuccess(message) {
	const result = await window.ipcExposed.invoke("notify-success", message);

	if (result) {
		successSfx.play();
	}
}

export async function alertError(message) {
	const result = await window.ipcExposed.invoke("notify-error", message);

	if (result) {
		errorSfx.play();
	}
}