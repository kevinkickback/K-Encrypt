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
	selectFiles.classList.add("flash-file-select");
	setTimeout(() => {
		selectFiles.classList.remove("flash-file-select");
	}, 1000);
}

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ NO/WRONG PASSWORD                                                                    ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

export function passwordError() {
	passwordInput.classList.add("shake-password-box");
	togglePassword.classList.add("shake-password-box");
	setTimeout(() => {
		passwordInput.classList.remove("shake-password-box");
		togglePassword.classList.remove("shake-password-box");
	}, "500");
}

export function passwordError2() {
	passwordInput2.classList.add("shake-password-box");
	setTimeout(() => {
		passwordInput2.classList.remove("shake-password-box");
	}, "500");
}

// ╔══════════════════════════════════════════════════════════════════════════════════════╗
// ║ TOASTIFY FUNCTIONS                                                                   ║
// ╚══════════════════════════════════════════════════════════════════════════════════════╝

const div = document.getElementById("files-container");
const successSfx = new Audio("./sfx/success.mp3");
const failureSfx = new Audio("./sfx/failure.mp3");

// Push success toast notification
function alertSuccess(message) {
	Toastify.toast({
		text: message,
		duration: 3000,
		position: "center",
		close: false,
		stopOnFocus: false,
		className: "success",
		selector: div,
		onClick: () => {
			const selToast = document.querySelector(".on");
			if (selToast) {
				selToast.classList.remove("on");
				setTimeout(() => {
					selToast.style.display = "none";
				}, 800);
			}
		},
	});

	successSfx.play();
}

// Push error taost notification
export function alertError(message) {
	Toastify.toast({
		text: message,
		duration: 3000,
		position: "center",
		close: false,
		stopOnFocus: false,
		className: "error",
		selector: div,
		onClick: () => {
			const selToast = document.querySelector(".on");
			if (selToast) {
				selToast.classList.remove("on");
				setTimeout(() => {
					selToast.style.display = "none";
				}, 800);
			}
		},
	});

	failureSfx.play();
}

// // Push info toast notification
// export function alertInfo(message) {
// 	Toastify.toast({
// 		text: message,
// 		duration: -1,
// 		position: "center",
// 		close: false,
// 		stopOnFocus: false,
// 		className: "info",
// 		selector: div,
// 	});
// }